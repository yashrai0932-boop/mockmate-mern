"""
Proctoring API routes - log events, get integrity scores and summaries.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.user import User
from app.models.interview import InterviewSession
from app.models.proctor_event import ProctorEvent
from app.schemas.proctor import (
    ProctorEventsBatch,
    ProctorSummaryResponse,
    IntegrityScoreResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/proctor", tags=["Proctoring"])


def _verify_session(db: Session, session_id: str, user_id: str) -> InterviewSession:
    """Verify session exists and belongs to user."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/events")
def log_proctoring_events(
    session_id: str,
    batch: ProctorEventsBatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Log a batch of proctoring events from the frontend.
    Called every ~10 seconds during interview.
    """
    session = _verify_session(db, session_id, current_user.id)

    # Store each event
    for evt in batch.events:
        proctor_event = ProctorEvent(
            session_id=session_id,
            event_type=evt.event_type,
            severity=evt.severity,
            message=evt.message,
            score_penalty=str(evt.score_penalty),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(proctor_event)

    # Update session integrity score and warning count
    session.integrity_score = max(0, batch.current_integrity_score)
    session.proctor_warnings = batch.warning_count

    db.commit()

    return {
        "status": "ok",
        "events_logged": len(batch.events),
        "integrity_score": session.integrity_score,
    }


@router.get("/{session_id}/integrity", response_model=IntegrityScoreResponse)
def get_integrity_score(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current integrity score for a session."""
    session = _verify_session(db, session_id, current_user.id)
    return IntegrityScoreResponse(
        session_id=session_id,
        integrity_score=session.integrity_score or 100.0,
        warning_count=session.proctor_warnings or 0,
        proctoring_enabled=session.proctoring_enabled if session.proctoring_enabled is not None else True,
    )


@router.get("/{session_id}/summary", response_model=ProctorSummaryResponse)
def get_proctoring_summary(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get full proctoring summary for a completed session.
    Used by the report page.
    """
    session = _verify_session(db, session_id, current_user.id)

    # Get all events for this session
    events = (
        db.query(ProctorEvent)
        .filter(ProctorEvent.session_id == session_id)
        .order_by(ProctorEvent.timestamp)
        .all()
    )

    # Build event breakdown
    breakdown: dict[str, int] = {}
    timeline = []
    session_start = session.created_at or datetime.now(timezone.utc)

    for evt in events:
        breakdown[evt.event_type] = breakdown.get(evt.event_type, 0) + 1

        # Calculate relative time
        if evt.timestamp and session_start:
            delta = (evt.timestamp - session_start).total_seconds()
            mins = int(delta // 60)
            secs = int(delta % 60)
            time_str = f"{mins:02d}:{secs:02d}"
        else:
            time_str = "00:00"

        timeline.append({
            "time": time_str,
            "type": evt.event_type,
            "severity": evt.severity,
            "message": evt.message or "",
        })

    # Store summary on session for report generation
    summary = {
        "total_events": len(events),
        "event_breakdown": breakdown,
        "timeline": timeline[:50],  # Cap at 50 events for storage
    }
    session.proctor_summary = summary
    db.commit()

    return ProctorSummaryResponse(
        session_id=session_id,
        integrity_score=session.integrity_score or 100.0,
        total_events=len(events),
        warning_count=session.proctor_warnings or 0,
        event_breakdown=breakdown,
        timeline=timeline[:50],
    )
