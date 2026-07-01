"""
Question model - stores individual interview questions.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String(36), ForeignKey("interview_sessions.id"), nullable=False, index=True
    )

    # Question content
    text = Column(Text, nullable=False)
    category = Column(String(30), nullable=False)  # hr/technical/situational/behavioral
    difficulty = Column(Float, default=5.0)  # 1-10 scale
    order_index = Column(Integer, nullable=False)
    
    question_type = Column(String(20), default="open_ended") # open_ended or multiple_choice
    options = Column(JSON, nullable=True) # list of string options if multiple_choice

    # Context: which resume section this relates to
    related_resume_section = Column(String(50), nullable=True)
    is_follow_up = Column(String(1), default="0")  # "1" if follow-up to previous

    # Timing
    asked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question {self.order_index}: {self.category}>"
