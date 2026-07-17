from app.models.video import Video
from app.models.transcript import Transcript
from app.services.ffmpeg_service import get_video_metadata, extract_audio
from app.services.whisper_service import transcribe_audio
from app.services.gemini_service import analyze_transcript, generate_title_description
from app.config import settings
import json
import os
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

async def process_video_pipeline(video_id: str, db: AsyncSession):
    """Orchestrates the entire video processing pipeline in the background."""
    # 1. Fetch video record
    video = await db.get(Video, video_id)
    if not video:
        print(f"Video {video_id} not found for processing.")
        return

    try:
        video.status = "processing"
        await db.commit()

        # 2. Extract Metadata
        metadata = get_video_metadata(video.file_path)
        if metadata:
            video.duration = metadata.get("duration")
            video.width = metadata.get("width")
            video.height = metadata.get("height")
            video.fps = metadata.get("fps")
            video.codec = metadata.get("codec")
            video.bitrate = metadata.get("bitrate")
            video.metadata = json.dumps(metadata)

        # 3. Extract Audio for transcription
        audio_path = os.path.join(settings.TEMP_DIR, f"{video_id}_audio.mp3")
        await extract_audio(video.file_path, audio_path)

        # 4. Transcribe Audio
        transcription_result = await transcribe_audio(audio_path)
        
        # Save transcript to DB
        transcript = Transcript(
            video_id=video_id,
            language=transcription_result.get("language", "en"),
            full_text=transcription_result["text"],
            segments=json.dumps(transcription_result["segments"]),
            status="completed"
        )
        db.add(transcript)
        
        # Clean up temp audio
        if os.path.exists(audio_path):
            os.remove(audio_path)

        # 5. Analyze with Gemini
        if settings.GEMINI_API_KEY and transcription_result["text"]:
             analysis = await analyze_transcript(transcription_result["text"])
             video.ai_analysis = json.dumps(analysis)

             seo_data = await generate_title_description(transcription_result["text"], metadata)
             video.ai_title = seo_data.get("title")
             video.ai_description = seo_data.get("description")

        # Finalize
        video.status = "completed"
        video.processed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        await db.commit()
        
    except Exception as e:
        print(f"Error processing video {video_id}: {str(e)}")
        video.status = "failed"
        video.processing_error = str(e)
        await db.commit()
