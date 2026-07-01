"""
Interview schemas - request/response models for interview operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class InterviewStartRequest(BaseModel):
    resume_id: str
    target_role: str = Field(..., min_length=1, max_length=255)
    personality: str = Field(default="friendly_mentor")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    company_style: Optional[str] = None
    interview_type: str = Field(default="mixed")
    total_questions: int = Field(default=10, ge=5, le=25)


class InterviewStartResponse(BaseModel):
    session_id: str
    target_role: str
    personality: str
    difficulty: str
    total_questions: int
    first_question: "QuestionResponse"


class QuestionResponse(BaseModel):
    id: str
    text: str
    category: str
    difficulty: float
    order_index: int
    related_resume_section: Optional[str] = None
    is_follow_up: bool = False
    question_type: str = "open_ended"
    options: Optional[List[str]] = None


class AnswerSubmitRequest(BaseModel):
    text: str = Field(..., min_length=1)
    response_time_seconds: Optional[float] = None
    input_method: str = Field(default="text", pattern="^(text|voice)$")
    voice_analysis: Optional[Dict[str, Any]] = None


class AnswerFeedbackResponse(BaseModel):
    answer_id: str
    scores: Dict[str, float]  # communication, technical, relevance, confidence, overall
    feedback: "FeedbackDetail"
    next_question: Optional[QuestionResponse] = None
    is_interview_complete: bool = False


class FeedbackDetail(BaseModel):
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_concepts: List[str] = []
    communication_feedback: str = ""
    improvement_suggestions: List[str] = []
    ideal_answer: str = ""


class InterviewSessionResponse(BaseModel):
    id: str
    target_role: str
    personality: str
    difficulty: str
    status: str
    current_question_index: int
    total_questions: int
    overall_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InterviewHistoryResponse(BaseModel):
    sessions: List[InterviewSessionResponse]


class TabSwitchRequest(BaseModel):
    tab_switches: int
