"""
Report API routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.interview import InterviewSession
from app.services.report_service import generate_report
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/report", tags=["Report"])


@router.get("/{session_id}")
async def get_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get or generate the final report for an interview session."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        report = await generate_report(db, session_id)
        if not report:
            raise HTTPException(status_code=500, detail="Failed to generate report")
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
