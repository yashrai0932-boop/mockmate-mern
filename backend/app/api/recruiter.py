"""
Recruiter API routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.recruiter import JobCreateRequest
from app.services.recruiter_service import create_job, get_candidate_matches, get_recruiter_jobs
from app.utils.dependencies import get_current_user, require_recruiter

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter"])


@router.post("/job")
async def create_job_posting(
    request: JobCreateRequest,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Create a new job posting (recruiter only)."""
    result = await create_job(
        db=db,
        recruiter_id=current_user.id,
        title=request.title,
        company=request.company,
        description=request.description,
    )
    return result


@router.get("/jobs")
def list_jobs(
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """List all jobs for the recruiter."""
    return {"jobs": get_recruiter_jobs(db, current_user.id)}


@router.get("/candidates/{job_id}")
async def get_candidates(
    job_id: str,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Get ranked candidate matches for a job posting."""
    try:
        return await get_candidate_matches(db, job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
