"""
Resume model - stores uploaded resumes and parsed data.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    file_path = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # "pdf" or "docx"

    # Raw extracted text
    raw_text = Column(Text, nullable=True)

    # Parsed structured data
    parsed_data = Column(JSON, nullable=True)
    # Structure: {
    #   "skills": [...],
    #   "projects": [...],
    #   "education": [...],
    #   "experience": [...],
    #   "certifications": [...],
    #   "technologies": [...]
    # }

    # Compressed AI-optimized summary
    candidate_summary = Column(Text, nullable=True)

    # ChromaDB embedding ID
    embedding_id = Column(String(36), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resumes")
    interview_sessions = relationship(
        "InterviewSession", back_populates="resume", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Resume {self.file_name}>"
