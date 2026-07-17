import asyncio
import whisper
from app.config import settings
import os

# Lazy load model to avoid memory consumption until needed
_model = None

def get_whisper_model():
    global _model
    if _model is None:
        _model = whisper.load_model(settings.WHISPER_MODEL, device=settings.WHISPER_DEVICE)
    return _model

async def transcribe_audio(audio_path: str, language: str = None) -> dict:
    """
    Transcribe audio file using Whisper.
    Returns full text and segments.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    try:
        def _transcribe():
            model = get_whisper_model()
            kwargs = {}
            if language and language != "auto":
                kwargs["language"] = language
            result = model.transcribe(audio_path, **kwargs)
            
            segments = []
            for i, segment in enumerate(result["segments"]):
                segments.append({
                    "id": i,
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"].strip(),
                    "confidence": None # Whisper doesn't provide per-word confidence by default without word_timestamps=True
                })
            
            return {
                "text": result["text"].strip(),
                "segments": segments,
                "language": result.get("language", language or "en")
            }

        # Run model inference in thread pool to not block asyncio event loop
        result = await asyncio.to_thread(_transcribe)
        return result
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")
