"""
Proctoring event model - stores individual proctoring events during interview.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String(36),
        ForeignKey("interview_sessions.id"),
        nullable=False,
        index=True,
    )

    # Event classification
    event_type = Column(String(50), nullable=False)
    # Types: tab_switch, fullscreen_exit, copy_attempt, paste_attempt,
    #        devtools_attempt, right_click, multiple_faces, no_face,
    #        gaze_away, low_light, background_noise, inactivity,
    #        keyboard_shortcut

    severity = Column(String(10), nullable=False, default="medium")
    # low / medium / high

    message = Column(Text, nullable=True)
    # Human-readable description of the event

    score_penalty = Column(String(10), default="0")
    # How much integrity score was deducted

    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("InterviewSession", back_populates="proctor_events")

    def __repr__(self):
        return f"<ProctorEvent {self.event_type} @ {self.session_id[:8]}>"
