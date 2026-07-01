"""
Report model - stores final interview report with scores and recommendations.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String(36),
        ForeignKey("interview_sessions.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Scores
    overall_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    relevance_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Summary
    interview_summary = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=True)  # ["Problem solving", "Communication"]
    weaknesses = Column(JSON, nullable=True)  # ["System design", "Time mgmt"]

    # AI Recommendations
    personalized_roadmap = Column(JSON, nullable=True)
    # Structure: [
    #   {"topic": "System Design", "action": "Study X", "priority": "high", "timeline": "2 weeks"},
    #   ...
    # ]

    hiring_recommendation = Column(String(30), nullable=True)
    # "strong_hire" / "hire" / "lean_hire" / "lean_no_hire" / "no_hire"
    hiring_explanation = Column(Text, nullable=True)

    # Resume improvement suggestions
    resume_suggestions = Column(JSON, nullable=True)

    # Proctoring data
    integrity_score = Column(Float, nullable=True)
    proctoring_summary = Column(JSON, nullable=True)
    # Structure: {"total_events": N, "tab_switches": N, "fullscreen_exits": N,
    #  "copy_attempts": N, "face_violations": N, "timeline": [{"time": ..., "type": ...}]}

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("InterviewSession", back_populates="report")

    def __repr__(self):
        return f"<Report for Session:{self.session_id[:8]}>"
