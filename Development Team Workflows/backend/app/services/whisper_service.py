import os
import asyncio
from app.config import settings

_model = None

def get_whisper_model():
    return None

def _format_timestamp(seconds: float) -> str:
    """Format seconds into SRT timestamp format: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"

def generate_srt_from_segments(segments: list) -> str:
    """Converts a list of whisper segment dicts into an SRT formatted string."""
    srt_content = []
    for i, segment in enumerate(segments, start=1):
        start_time = _format_timestamp(segment["start"])
        end_time = _format_timestamp(segment["end"])
        text = segment["text"].strip()
        srt_content.append(f"{i}\n{start_time} --> {end_time}\n{text}\n")
    return "\n".join(srt_content)

async def transcribe_audio(audio_path: str, language: str = None) -> dict:
    """
    Mock transcription to bypass PyTorch Windows path limit issues for the preview.
    """
    await asyncio.sleep(2) # Simulate processing
    return {
        "text": "This is a mock transcription because the Whisper AI model (PyTorch) could not be installed due to a Windows file path length limitation. The rest of the pipeline will proceed normally.",
        "language": "en",
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 2.0,
                "text": "This is a mock transcription"
            },
            {
                "id": 1,
                "start": 2.0,
                "end": 5.0,
                "text": "because the Whisper AI model could not be installed."
            }
        ]
    }
