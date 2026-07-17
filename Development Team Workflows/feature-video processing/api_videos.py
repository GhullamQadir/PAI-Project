from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoResponse, VideoUploadResponse, VideoList
from app.api.deps import get_current_user
from app.services.file_service import save_upload_file, delete_file
from app.services.video_service import process_video_pipeline

router = APIRouter()

@router.post("/upload", response_model=VideoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Save file locally
    file_path, stored_filename = await save_upload_file(file)
    
    # 2. Create DB Record
    video_id = str(uuid.uuid4())
    new_video = Video(
        id=video_id,
        user_id=current_user.id,
        project_id=project_id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type,
        status="uploaded"
    )
    
    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)
    
    # 3. Trigger processing pipeline in background
    background_tasks.add_task(process_video_pipeline, video_id, db)
    
    return VideoUploadResponse.model_validate(new_video)

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    video = (await db.execute(stmt)).scalar_one_or_none()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    return VideoResponse.from_orm_with_parsed(video)

@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    video = (await db.execute(stmt)).scalar_one_or_none()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Delete file from disk
    delete_file(video.file_path)
    if video.output_path:
        delete_file(video.output_path)
        
    await db.delete(video)
    await db.commit()
