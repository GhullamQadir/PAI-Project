from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.schemas.processing import VideoTrimRequest
from app.api.deps import get_current_user
from app.services.ffmpeg_service import trim_video
from app.config import settings
import os
import uuid

router = APIRouter()

@router.post("/trim")
async def trim_video_endpoint(
    req: VideoTrimRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id == req.video_id, Video.user_id == current_user.id)
    video = (await db.execute(stmt)).scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    output_filename = req.output_filename or f"trimmed_{uuid.uuid4().hex[:8]}_{video.stored_filename}"
    output_path = os.path.join(settings.UPLOAD_DIR, output_filename) # Save to uploads so it can be streamed back

    try:
        await trim_video(video.file_path, output_path, req.start_time, req.end_time)
        
        # Create new video record
        file_size = os.path.getsize(output_path)
        new_video = Video(
            user_id=current_user.id,
            original_filename=f"Trimmed: {video.original_filename}",
            stored_filename=output_filename,
            file_path=output_path,
            file_size=file_size,
            mime_type=video.mime_type,
            status="completed"
        )
        db.add(new_video)
        await db.commit()
        await db.refresh(new_video)
        
        # We also trigger processing in background ideally, but for now we mark it completed
        return {
            "status": "success", 
            "output_path": output_path, 
            "output_filename": output_filename,
            "video": {
                "id": str(new_video.id),
                "original_filename": new_video.original_filename,
                "stored_filename": new_video.stored_filename,
                "file_size": new_video.file_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.processing import VideoMergeRequest, BurnSubtitleRequest, AutoTrimRequest
from app.services.ffmpeg_service import merge_videos, burn_subtitles, auto_trim_video

@router.post("/auto-trim")
async def auto_trim_video_endpoint(
    req: AutoTrimRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id == req.video_id, Video.user_id == current_user.id)
    video = (await db.execute(stmt)).scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    output_filename = req.output_filename or f"autotrimmed_{uuid.uuid4().hex[:8]}_{video.stored_filename}"
    output_path = os.path.join(settings.UPLOAD_DIR, output_filename)

    try:
        await auto_trim_video(video.file_path, output_path, req.threshold_db)
        
        file_size = os.path.getsize(output_path)
        new_video = Video(
            user_id=current_user.id,
            original_filename=f"Auto-Trimmed: {video.original_filename}",
            stored_filename=output_filename,
            file_path=output_path,
            file_size=file_size,
            mime_type=video.mime_type,
            status="completed"
        )
        db.add(new_video)
        await db.commit()
        await db.refresh(new_video)
        
        return {
            "status": "success", 
            "output_path": output_path, 
            "output_filename": output_filename,
            "video": {
                "id": str(new_video.id),
                "original_filename": new_video.original_filename,
                "stored_filename": new_video.stored_filename,
                "file_size": new_video.file_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/merge")
async def merge_videos_endpoint(
    req: VideoMergeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id.in_(req.video_ids), Video.user_id == current_user.id)
    videos = (await db.execute(stmt)).scalars().all()
    if len(videos) != len(req.video_ids):
        raise HTTPException(status_code=404, detail="One or more videos not found")

    video_map = {str(v.id): v.file_path for v in videos}
    input_paths = [video_map[vid] for vid in req.video_ids]

    output_filename = req.output_filename or f"merged_{uuid.uuid4().hex[:8]}.mp4"
    output_path = os.path.join(settings.OUTPUT_DIR, output_filename)

    try:
        await merge_videos(input_paths, output_path)
        return {"status": "success", "output_path": output_path, "output_filename": output_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/burn-subtitles")
async def burn_subtitles_endpoint(
    req: BurnSubtitleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Video).where(Video.id == req.video_id, Video.user_id == current_user.id)
    video = (await db.execute(stmt)).scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    output_filename = req.output_filename or f"subtitled_{video.stored_filename}"
    output_path = os.path.join(settings.OUTPUT_DIR, output_filename)

    srt_filename = f"temp_{uuid.uuid4().hex[:8]}.srt"
    srt_path = os.path.join(settings.TEMP_DIR, srt_filename)
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(req.subtitle_text)

    try:
        await burn_subtitles(video.file_path, srt_path, output_path)
        return {"status": "success", "output_path": output_path, "output_filename": output_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(srt_path):
            os.remove(srt_path)
