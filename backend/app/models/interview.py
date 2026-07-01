"""
Interview session model - tracks an entire interview session.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Integer, JSON, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=False)

    # Interview configuration
    target_role = Column(String(255), nullable=False)
    company_style = Column(String(100), nullable=True)  # e.g., "FAANG", "Startup"
    personality = Column(String(50), nullable=False, default="friendly_mentor")
    difficulty = Column(String(20), nullable=False, default="medium")  # easy/medium/hard
    interview_type = Column(String(50), default="mixed")  # mixed/technical/hr/behavioral

    # Session state
    status = Column(String(20), default="in_progress")  # in_progress/completed/abandoned
    current_question_index = Column(Integer, default=0)
    total_questions = Column(Integer, default=10)

    # Pre-generated questions (batch optimization)
    pre_generated_questions = Column(JSON, nullable=True)

    # Running context for adaptive difficulty
    running_avg_score = Column(Float, default=0.0)
    current_difficulty_level = Column(Float, default=5.0)  # 1-10 scale

    # Final scores (populated on completion)
    overall_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

    # Anti-cheat
    tab_switches = Column(Integer, default=0)
    avg_response_time = Column(Float, nullable=True)

    # Proctoring
    proctoring_enabled = Column(Boolean, default=True)
    integrity_score = Column(Float, default=100.0)
    proctor_warnings = Column(Integer, default=0)
    proctor_summary = Column(JSON, nullable=True)  # Aggregated proctoring stats

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    resume = relationship("Resume", back_populates="interview_sessions")
    questions = relationship(
        "Question", back_populates="session", cascade="all, delete-orphan",
        order_by="Question.order_index"
    )
    report = relationship(
        "Report", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    proctor_events = relationship(
        "ProctorEvent", back_populates="session", cascade="all, delete-orphan",
        order_by="ProctorEvent.timestamp"
    )

    def __repr__(self):
        return f"<InterviewSession {self.id[:8]} - {self.target_role}>"
