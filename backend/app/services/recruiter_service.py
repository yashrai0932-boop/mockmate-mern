"""
Recruiter Service - job posting, candidate matching, and interview summaries.
"""

import uuid
import logging
from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.recruiter_job import RecruiterJob
from app.models.resume import Resume
from app.models.user import User
from app.models.interview import InterviewSession
from app.models.report import Report
from app.ai.nim_service import nim_service

logger = logging.getLogger(__name__)


async def create_job(
    db: Session, recruiter_id: str, title: str, company: Optional[str], description: str
) -> dict:
    """Create a job posting and parse requirements."""
    job = RecruiterJob(
        id=str(uuid.uuid4()),
        recruiter_id=recruiter_id,
        title=title,
        company=company,
        description=description,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "created_at": job.created_at,
    }


async def get_candidate_matches(db: Session, job_id: str) -> dict:
    """Find and rank candidates for a job posting."""
    job = db.query(RecruiterJob).filter(RecruiterJob.id == job_id).first()
    if not job:
        raise ValueError("Job not found")

    # Get all resumes with summaries
    resumes = db.query(Resume).filter(Resume.candidate_summary.isnot(None)).all()

    candidates = []
    for resume in resumes:
        user = db.query(User).filter(User.id == resume.user_id).first()
        if not user:
            continue

        # Use AI to evaluate match
        match_result = await nim_service.evaluate_job_match(
            candidate_summary=resume.candidate_summary or "",
            job_description=job.description,
        )

        # Get latest interview report if exists
        latest_session = (
            db.query(InterviewSession)
            .filter(
                InterviewSession.user_id == user.id,
                InterviewSession.status == "completed",
            )
            .order_by(InterviewSession.created_at.desc())
            .first()
        )

        interview_summary = None
        hiring_rec = None
        if latest_session:
            report = db.query(Report).filter(Report.session_id == latest_session.id).first()
            if report:
                interview_summary = report.interview_summary
                hiring_rec = report.hiring_recommendation

        candidates.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "resume_id": resume.id,
            "fit_score": match_result.get("fit_score", 50) if match_result else 50,
            "matching_skills": match_result.get("matching_skills", []) if match_result else [],
            "missing_skills": match_result.get("missing_skills", []) if match_result else [],
            "interview_summary": interview_summary,
            "hiring_recommendation": hiring_rec,
        })

    # Sort by fit score descending
    candidates.sort(key=lambda x: x["fit_score"], reverse=True)

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "created_at": job.created_at,
        },
        "candidates": candidates,
    }


def get_recruiter_jobs(db: Session, recruiter_id: str) -> list:
    """Get all jobs for a recruiter."""
    jobs = (
        db.query(RecruiterJob)
        .filter(RecruiterJob.recruiter_id == recruiter_id)
        .order_by(RecruiterJob.created_at.desc())
        .all()
    )
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "description": j.description[:200],
            "created_at": j.created_at,
        }
        for j in jobs
    ]
