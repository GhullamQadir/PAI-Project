from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AIAnalysisRequest(BaseModel):
    video_id: str
    prompt: Optional[str] = None
    analysis_type: str = "comprehensive"  # comprehensive, highlights, chapters, summary


class AIAnalysisResponse(BaseModel):
    video_id: str
    analysis: Dict[str, Any]
    suggestions: List[Dict[str, Any]]
    title: str
    description: str

class AISuggestionsResponse(BaseModel):
    video_id: str
    suggestions: List[Dict[str, Any]]
