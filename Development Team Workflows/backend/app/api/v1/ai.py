from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.models.transcript import Transcript
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.api.deps import get_current_user
from app.services.ai_provider import analyze_transcript, generate_title_description, chat_with_ai
import json

router = APIRouter()

@router.post("/analyze", response_model=AIAnalysisResponse)
async def run_analysis(
    req: AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify ownership
    video_stmt = select(Video).where(Video.id == req.video_id, Video.user_id == current_user.id)
    video = (await db.execute(video_stmt)).scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Get transcript
    transcript_stmt = select(Transcript).where(Transcript.video_id == req.video_id).order_by(Transcript.created_at.desc()).limit(1)
    transcript = (await db.execute(transcript_stmt)).scalar_one_or_none()
    
    if not transcript:
        raise HTTPException(status_code=400, detail="Video does not have a transcript yet")

    try:
        # Re-run analysis
        analysis = await analyze_transcript(transcript.full_text, req.prompt)
        seo_data = await generate_title_description(transcript.full_text)

        # Update DB
        video.ai_analysis = json.dumps(analysis)
        video.ai_title = seo_data.get("title")
        video.ai_description = seo_data.get("description")
        await db.commit()

        return {
            "video_id": req.video_id,
            "analysis": analysis,
            "suggestions": [],
            "title": video.ai_title,
            "description": video.ai_description
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.models.chat import ChatSession, ChatMessage
from app.schemas.ai import AIChatRequest, AIChatResponse

@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    video_context = None
    if req.video_id:
        video_stmt = select(Video).where(Video.id == req.video_id, Video.user_id == current_user.id)
        video = (await db.execute(video_stmt)).scalar_one_or_none()
        if video:
            has_transcript = False
            transcript_stmt = select(Transcript).where(Transcript.video_id == req.video_id).limit(1)
            transcript = (await db.execute(transcript_stmt)).scalar_one_or_none()
            if transcript:
                has_transcript = True
                
            video_context = {
                "filename": video.original_filename,
                "duration": video.duration,
                "width": video.width,
                "height": video.height,
                "has_transcript": has_transcript
            }

    history = None
    db_session = None
    if req.session_id:
        session_stmt = select(ChatSession).where(ChatSession.id == req.session_id, ChatSession.user_id == current_user.id)
        db_session = (await db.execute(session_stmt)).scalar_one_or_none()
        if db_session:
            msg_stmt = select(ChatMessage).where(ChatMessage.session_id == req.session_id).order_by(ChatMessage.created_at.asc())
            history = (await db.execute(msg_stmt)).scalars().all()
            
            # Save user message
            user_msg = ChatMessage(session_id=req.session_id, role="user", content=req.message)
            db.add(user_msg)
            await db.commit()

    try:
        result = await chat_with_ai(req.message, video_context, history=history)
        
        # Save AI reply
        if db_session:
            ai_msg = ChatMessage(session_id=req.session_id, role="ai", content=result["reply"])
            db_session.updated_at = ai_msg.created_at
            db.add(ai_msg)
            await db.commit()
            
        return AIChatResponse(reply=result["reply"], actions=result["actions"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
