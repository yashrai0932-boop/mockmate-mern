"""
Recruiter schemas - request/response models for recruiter operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company: Optional[str] = None
    description: str = Field(..., min_length=10)


class JobResponse(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_level: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateMatch(BaseModel):
    user_id: str
    full_name: str
    email: str
    resume_id: str
    fit_score: float  # 0-100
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    interview_summary: Optional[str] = None
    hiring_recommendation: Optional[str] = None


class CandidateListResponse(BaseModel):
    job: JobResponse
    candidates: List[CandidateMatch]
