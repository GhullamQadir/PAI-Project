from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.transcript import Transcript
from app.models.video import Video
from app.schemas.transcript import TranscriptResponse
from app.api.deps import get_current_user
import json

router = APIRouter()

@router.get("/video/{video_id}", response_model=List[TranscriptResponse])
async def get_video_transcripts(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if video belongs to user
    video_stmt = select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    video = (await db.execute(video_stmt)).scalar_one_or_none()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    stmt = select(Transcript).where(Transcript.video_id == video_id)
    result = await db.execute(stmt)
    transcripts = result.scalars().all()
    
    # Parse the segments JSON string before returning
    res = []
    for t in transcripts:
        t_dict = t.__dict__.copy()
        if isinstance(t_dict.get("segments"), str):
            try:
                t_dict["segments"] = json.loads(t_dict["segments"])
            except:
                t_dict["segments"] = []
        res.append(TranscriptResponse.model_validate(t_dict))
        
    return res

@router.get("/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(
    transcript_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Transcript).join(Video).where(
        Transcript.id == transcript_id,
        Video.user_id == current_user.id
    )
    transcript = (await db.execute(stmt)).scalar_one_or_none()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
        
    t_dict = transcript.__dict__.copy()
    if isinstance(t_dict.get("segments"), str):
        try:
            t_dict["segments"] = json.loads(t_dict["segments"])
        except:
            t_dict["segments"] = []
            
    return TranscriptResponse.model_validate(t_dict)
