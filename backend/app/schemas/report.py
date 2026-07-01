"""
Report schemas - request/response models for final reports.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class RoadmapItem(BaseModel):
    topic: str
    action: str
    priority: str  # high/medium/low
    timeline: str  # e.g. "2 weeks"
    resources: List[str] = []


class ReportResponse(BaseModel):
    id: str
    session_id: str
    overall_score: float
    communication_score: float
    technical_score: float
    relevance_score: float
    confidence_score: float
    interview_summary: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    personalized_roadmap: List[RoadmapItem] = []
    hiring_recommendation: Optional[str] = None
    hiring_explanation: Optional[str] = None
    resume_suggestions: List[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}
