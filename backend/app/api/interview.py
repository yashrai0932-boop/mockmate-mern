"""
Interview API routes - start interview, submit answers, get feedback.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.interview import InterviewSession
from app.schemas.interview import (
    InterviewStartRequest,
    InterviewStartResponse,
    AnswerSubmitRequest,
    AnswerFeedbackResponse,
    InterviewHistoryResponse,
    InterviewSessionResponse,
    TabSwitchRequest,
)
from app.services.interview_service import (
    start_interview,
    submit_answer_and_evaluate,
    complete_interview,
    get_interview_history,
)
from app.ai.personalities import get_all_personalities
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.get("/personalities")
def list_personalities():
    """Get all available interviewer personalities."""
    return {"personalities": get_all_personalities()}


@router.post("/start")
async def start_interview_session(
    request: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new interview session."""
    try:
        result = await start_interview(
            db=db,
            user_id=current_user.id,
            resume_id=request.resume_id,
            target_role=request.target_role,
            personality=request.personality,
            difficulty=request.difficulty,
            company_style=request.company_style,
            interview_type=request.interview_type,
            total_questions=request.total_questions,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    request: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit an answer and get instant feedback + next question."""
    # Verify session belongs to user
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Get current question
    from app.models.question import Question
    current_question = (
        db.query(Question)
        .filter(
            Question.session_id == session_id,
            Question.order_index == session.current_question_index,
        )
        .first()
    )
    if not current_question:
        raise HTTPException(status_code=400, detail="No current question found")

    try:
        result = await submit_answer_and_evaluate(
            db=db,
            session_id=session_id,
            question_id=current_question.id,
            answer_text=request.text,
            response_time=request.response_time_seconds,
            input_method=request.input_method,
            voice_analysis=request.voice_analysis,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")


@router.post("/{session_id}/complete")
async def complete_interview_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End the interview early and mark as completed."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await complete_interview(db, session_id)
    return {"message": "Interview completed", "session_id": session_id}


@router.post("/{session_id}/tab-switch")
def report_tab_switch(
    session_id: str,
    request: TabSwitchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Report tab switches for anti-cheat tracking."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if session:
        session.tab_switches = request.tab_switches
        db.commit()
    return {"message": "Tab switch recorded"}


@router.get("/history", response_model=InterviewHistoryResponse)
def interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's interview history."""
    sessions = get_interview_history(db, current_user.id)
    return InterviewHistoryResponse(
        sessions=[InterviewSessionResponse.model_validate(s) for s in sessions]
    )


@router.get("/{session_id}")
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get interview session details with all questions and answers."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from app.models.question import Question
    from app.models.answer import Answer
    from app.models.feedback import Feedback

    questions = (
        db.query(Question)
        .filter(Question.session_id == session_id)
        .order_by(Question.order_index)
        .all()
    )

    qa_list = []
    for q in questions:
        answer = db.query(Answer).filter(Answer.question_id == q.id).first()
        feedback = None
        if answer:
            fb = db.query(Feedback).filter(Feedback.answer_id == answer.id).first()
            if fb:
                feedback = {
                    "strengths": fb.strengths or [],
                    "weaknesses": fb.weaknesses or [],
                    "missing_concepts": fb.missing_concepts or [],
                    "communication_feedback": fb.communication_feedback,
                    "improvement_suggestions": fb.improvement_suggestions or [],
                    "ideal_answer": fb.ideal_answer,
                }

        qa_list.append({
            "question": {
                "id": q.id,
                "text": q.text,
                "category": q.category,
                "difficulty": q.difficulty,
                "order_index": q.order_index,
                "related_resume_section": q.related_resume_section,
            },
            "answer": {
                "id": answer.id,
                "text": answer.text,
                "input_method": answer.input_method,
                "scores": {
                    "communication": answer.communication_score,
                    "technical_depth": answer.technical_score,
                    "relevance": answer.relevance_score,
                    "confidence": answer.confidence_score,
                    "overall": answer.overall_score,
                },
                "voice_analysis": answer.voice_analysis,
            } if answer else None,
            "feedback": feedback,
        })

    return {
        "session": InterviewSessionResponse.model_validate(session).model_dump(),
        "questions_and_answers": qa_list,
    }
