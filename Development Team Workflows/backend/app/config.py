from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from pathlib import Path 

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # App
    APP_NAME: str = "AI Video Editor API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{Path(BASE_DIR) / 'app.db'}"

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File Storage
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    OUTPUT_DIR: str = os.path.join(BASE_DIR, "outputs")
    TEMP_DIR: str = os.path.join(BASE_DIR, "temp")
    MAX_FILE_SIZE: int = 524288000
    ALLOWED_MEDIA_TYPES: List[str] = [
        "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska",
        "video/mpeg", "video/ogg", "video/webm", "video/x-ms-wmv", 
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg", "audio/flac",
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml", "image/tiff", "image/x-icon",
        "text/plain", "text/csv", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    ALLOWED_EXTENSIONS: List[str] = [
        ".mp4", ".mov", ".avi", ".mkv", ".webm", ".mpe", ".mpeg", ".ogm", ".mpg", ".wmv", ".ogv", ".m4v", ".asx",
        ".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".tiff", ".ico",
        ".txt", ".csv", ".pdf", ".doc", ".docx"
    ]

    # Google Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Groq API
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

    # Whisper
    WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "cpu"

    # FFmpeg
    FFMPEG_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ffmpeg_bin", "ffmpeg.exe")
    FFPROBE_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ffmpeg_bin", "ffprobe.exe")

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
