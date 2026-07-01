"""
RecruiterJob model - stores job descriptions for recruiter mode.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class RecruiterJob(Base):
    __tablename__ = "recruiter_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    # Job details
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)

    # Parsed requirements
    required_skills = Column(JSON, nullable=True)
    preferred_skills = Column(JSON, nullable=True)
    experience_level = Column(String(50), nullable=True)
    parsed_requirements = Column(JSON, nullable=True)

    # ChromaDB embedding ID for semantic matching
    embedding_id = Column(String(36), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    recruiter = relationship("User", back_populates="recruiter_jobs")

    def __repr__(self):
        return f"<RecruiterJob {self.title}>"
