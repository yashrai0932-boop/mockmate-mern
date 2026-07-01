"""
Feedback model - stores AI-generated feedback for each answer.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_id = Column(
        String(36), ForeignKey("answers.id"), nullable=False, unique=True, index=True
    )
    session_id = Column(
        String(36), ForeignKey("interview_sessions.id"), nullable=False, index=True
    )

    # Feedback content
    strengths = Column(JSON, nullable=True)  # ["Good structure", "Clear examples"]
    weaknesses = Column(JSON, nullable=True)  # ["Missing technical depth"]
    missing_concepts = Column(JSON, nullable=True)  # ["Design patterns", "SOLID"]
    communication_feedback = Column(Text, nullable=True)
    improvement_suggestions = Column(JSON, nullable=True)  # ["Practice X", "Study Y"]
    ideal_answer = Column(Text, nullable=True)  # Sample ideal answer

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    answer = relationship("Answer", back_populates="feedback")

    def __repr__(self):
        return f"<Feedback for Answer:{self.answer_id[:8]}>"
