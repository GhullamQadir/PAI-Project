from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import json


class VideoMetadata(BaseModel):
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None


class VideoUploadResponse(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class VideoResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int
    mime_type: str
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None
    status: str
    processing_error: Optional[str] = None
    output_path: Optional[str] = None
    output_filename: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    ai_suggestions: Optional[Dict[str, Any]] = None
    ai_title: Optional[str] = None
    ai_description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_parsed(cls, obj):
        data = cls.model_validate(obj)
        # Parse JSON fields
        for field in ['ai_analysis', 'ai_suggestions']:
            value = getattr(obj, field, None)
            if value and isinstance(value, str):
                try:
                    setattr(data, field, json.loads(value))
                except (json.JSONDecodeError, ValueError, TypeError):
                    setattr(data, field, None)
        return data


class VideoList(BaseModel):
    videos: List[VideoResponse]
    total: int
