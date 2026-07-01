"""
Answer model - stores user's answers to interview questions.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(
        String(36), ForeignKey("questions.id"), nullable=False, unique=True, index=True
    )
    session_id = Column(
        String(36), ForeignKey("interview_sessions.id"), nullable=False, index=True
    )

    # Answer content
    text = Column(Text, nullable=False)
    audio_path = Column(Text, nullable=True)  # Path to voice recording if any
    input_method = Column(String(20), default="text")  # "text" or "voice"

    # Response timing
    response_time_seconds = Column(Float, nullable=True)

    # Voice analysis (if voice input)
    voice_analysis = Column(JSON, nullable=True)
    # Structure: {
    #   "filler_words": {"um": 3, "uh": 2, "like": 5},
    #   "speaking_speed_wpm": 145,
    #   "pause_count": 2,
    #   "total_pause_duration": 4.5
    # }

    # Scores (from AI evaluation)
    communication_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    question = relationship("Question", back_populates="answer")
    feedback = relationship("Feedback", back_populates="answer", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Answer to Q:{self.question_id[:8]}>"
