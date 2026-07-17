from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import json


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    settings: Optional[dict] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|processing|completed|failed)$")
    settings: Optional[dict] = None


class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    status: str
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    video_count: int = 0

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_count(cls, obj, video_count: int = 0):
        data = cls.model_validate(obj)
        data.video_count = video_count
        if isinstance(data.settings, str):
            try:
                data.settings = json.loads(data.settings)
            except:
                data.settings = None
        return data


class ProjectList(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
