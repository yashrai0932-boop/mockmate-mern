"""
Resume schemas - request/response models for resume operations.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ResumeUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    parsed_data: Optional[Dict[str, Any]] = None
    candidate_summary: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    resumes: List[ResumeUploadResponse]


class ParsedResumeData(BaseModel):
    skills: List[str] = []
    projects: List[Dict[str, str]] = []
    education: List[Dict[str, str]] = []
    experience: List[Dict[str, str]] = []
    certifications: List[str] = []
    technologies: List[str] = []
