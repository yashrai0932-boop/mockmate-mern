"""
Interview Service - orchestrates the entire interview flow.
Manages session creation, question delivery, answer evaluation, and adaptive difficulty.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.interview import InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.feedback import Feedback
from app.models.resume import Resume
from app.ai.nim_service import nim_service

logger = logging.getLogger(__name__)


async def start_interview(
    db: Session,
    user_id: str,
    resume_id: str,
    target_role: str,
    personality: str,
    difficulty: str,
    company_style: Optional[str],
    interview_type: str,
    total_questions: int,
) -> dict:
    """
    Start a new interview session.
    1. Load resume summary
    2. Pre-generate first batch of questions (ONE API call)
    3. Create session and first question in DB
    """
    # Load resume
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise ValueError("Resume not found")

    candidate_summary = resume.candidate_summary or resume.raw_text[:500]

    # Map difficulty string to numeric
    difficulty_map = {"easy": 3.0, "medium": 5.0, "hard": 7.5}
    difficulty_level = difficulty_map.get(difficulty, 5.0)

    # PRE-GENERATE questions (batch optimization - ONE API call)
    questions_data = await nim_service.generate_questions_batch(
        candidate_summary=candidate_summary,
        target_role=target_role,
        personality_key=personality,
        difficulty=difficulty_level,
        count=1,  # Generate only the first question for instant startup
    )

    if not questions_data:
        # Fallback questions if AI fails
        questions_data = _generate_fallback_questions(target_role, difficulty_level)

    # Create session
    session = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        company_style=company_style,
        personality=personality,
        difficulty=difficulty,
        interview_type=interview_type,
        total_questions=total_questions,
        status="in_progress",
        current_question_index=0,
        current_difficulty_level=difficulty_level,
        pre_generated_questions=[],
    )
    db.add(session)

    # Create first question
    first_q_data = questions_data[0]
    first_question = Question(
        id=str(uuid.uuid4()),
        session_id=session.id,
        text=first_q_data.get("text", "Tell me about yourself."),
        category=first_q_data.get("category", "hr"),
        difficulty=first_q_data.get("difficulty", difficulty_level),
        order_index=0,
        related_resume_section=first_q_data.get("related_resume_section"),
        question_type=first_q_data.get("question_type", "open_ended"),
        options=first_q_data.get("options", None),
    )
    db.add(first_question)
    db.commit()
    db.refresh(session)
    db.refresh(first_question)

    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "personality": session.personality,
        "difficulty": session.difficulty,
        "total_questions": session.total_questions,
        "first_question": {
            "id": first_question.id,
            "text": first_question.text,
            "category": first_question.category,
            "difficulty": first_question.difficulty,
            "order_index": first_question.order_index,
            "related_resume_section": first_question.related_resume_section,
            "is_follow_up": False,
            "question_type": first_question.question_type,
            "options": first_question.options,
        },
    }


async def submit_answer_and_evaluate(
    db: Session,
    session_id: str,
    question_id: str,
    answer_text: str,
    response_time: Optional[float],
    input_method: str,
    voice_analysis: Optional[dict],
) -> dict:
    """
    Submit an answer and get instant evaluation + next question.
    Uses SINGLE API call for evaluation + feedback + scores + next question.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise ValueError("Session not found")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found")

    resume = db.query(Resume).filter(Resume.id == session.resume_id).first()
    candidate_summary = resume.candidate_summary or resume.raw_text[:500] if resume else ""

    # Build interview context from previous Q&A (compressed)
    previous_answers = (
        db.query(Answer)
        .filter(Answer.session_id == session_id)
        .order_by(Answer.created_at)
        .all()
    )
    context_parts = []
    for prev in previous_answers[-3:]:  # Last 3 Q&A pairs for context
        prev_q = db.query(Question).filter(Question.id == prev.question_id).first()
        if prev_q:
            context_parts.append(f"Q: {prev_q.text[:80]} | A: {prev.text[:80]} | Score: {prev.overall_score or 'N/A'}")
    interview_context = " || ".join(context_parts)

    # SINGLE API CALL: evaluate answer + generate feedback + scores + next question
    eval_result = await nim_service.evaluate_and_advance(
        candidate_summary=candidate_summary,
        question_text=question.text,
        question_category=question.category,
        answer_text=answer_text,
        personality_key=session.personality,
        interview_context=interview_context,
    )

    # Parse evaluation result (with fallback defaults)
    scores = _extract_scores(eval_result)
    feedback_data = _extract_feedback(eval_result)
    next_q_data = _extract_next_question(eval_result, session)

    # Save answer
    answer = Answer(
        id=str(uuid.uuid4()),
        question_id=question_id,
        session_id=session_id,
        text=answer_text,
        input_method=input_method,
        response_time_seconds=response_time,
        voice_analysis=voice_analysis,
        communication_score=scores.get("communication", 5.0),
        technical_score=scores.get("technical_depth", 5.0),
        relevance_score=scores.get("relevance", 5.0),
        confidence_score=scores.get("confidence", 5.0),
        overall_score=scores.get("overall", 5.0),
    )
    db.add(answer)

    # Save feedback
    feedback = Feedback(
        id=str(uuid.uuid4()),
        answer_id=answer.id,
        session_id=session_id,
        strengths=feedback_data.get("strengths", []),
        weaknesses=feedback_data.get("weaknesses", []),
        missing_concepts=feedback_data.get("missing_concepts", []),
        communication_feedback=feedback_data.get("communication_feedback", ""),
        improvement_suggestions=feedback_data.get("improvement_suggestions", []),
        ideal_answer=feedback_data.get("ideal_answer", ""),
    )
    db.add(feedback)

    # Update session
    session.current_question_index += 1
    _update_running_average(session, scores.get("overall", 5.0))

    # Check if interview is complete
    is_complete = session.current_question_index >= session.total_questions
    next_question_response = None

    if not is_complete and next_q_data:
        # Create next question in DB directly from the evaluation result
        next_question = Question(
            id=str(uuid.uuid4()),
            session_id=session_id,
            text=next_q_data.get("text", "Tell me more about your experience."),
            category=next_q_data.get("category", "hr"),
            difficulty=next_q_data.get("difficulty", session.current_difficulty_level),
            order_index=session.current_question_index,
            related_resume_section=next_q_data.get("related_resume_section"),
            is_follow_up="1" if next_q_data.get("is_follow_up", False) else "0",
            question_type=next_q_data.get("question_type", "open_ended"),
            options=next_q_data.get("options", None),
        )
        db.add(next_question)
        db.flush()

        next_question_response = {
            "id": next_question.id,
            "text": next_question.text,
            "category": next_question.category,
            "difficulty": next_question.difficulty,
            "order_index": next_question.order_index,
            "related_resume_section": next_question.related_resume_section,
            "is_follow_up": next_question.is_follow_up == "1",
            "question_type": next_question.question_type,
            "options": next_question.options,
        }
    elif is_complete:
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "answer_id": answer.id,
        "scores": scores,
        "feedback": feedback_data,
        "next_question": next_question_response,
        "is_interview_complete": is_complete,
    }


async def complete_interview(db: Session, session_id: str) -> None:
    """Mark interview as completed."""
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if session and session.status != "completed":
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        db.commit()


def get_interview_history(db: Session, user_id: str) -> list:
    """Get user's interview history."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return sessions


def _extract_scores(eval_result: Optional[dict]) -> dict:
    """Safely extract scores from evaluation result."""
    default_scores = {
        "communication": 5.0,
        "technical_depth": 5.0,
        "relevance": 5.0,
        "confidence": 5.0,
        "overall": 5.0,
    }
    if not eval_result or "scores" not in eval_result:
        return default_scores
    scores = eval_result["scores"]
    return {k: float(scores.get(k, default_scores.get(k, 5.0))) for k in default_scores}


def _extract_feedback(eval_result: Optional[dict]) -> dict:
    """Safely extract feedback from evaluation result."""
    default_feedback = {
        "strengths": [],
        "weaknesses": [],
        "missing_concepts": [],
        "communication_feedback": "",
        "improvement_suggestions": [],
        "ideal_answer": "",
    }
    if not eval_result or "feedback" not in eval_result:
        return default_feedback
    feedback = eval_result["feedback"]
    return {k: feedback.get(k, default_feedback[k]) for k in default_feedback}


def _extract_next_question(eval_result: Optional[dict], session) -> Optional[dict]:
    """Safely extract next question from evaluation result."""
    if not eval_result or "next_question" not in eval_result:
        return {
            "text": "Can you elaborate further on your experience?",
            "category": "hr",
            "difficulty": session.current_difficulty_level,
            "related_resume_section": None,
            "is_follow_up": True,
            "question_type": "open_ended",
            "options": None,
        }
    return eval_result["next_question"]


def _update_running_average(session, new_score: float):
    """Update running average score and adjust difficulty."""
    n = session.current_question_index
    if n <= 1:
        session.running_avg_score = new_score
    else:
        session.running_avg_score = (
            (session.running_avg_score * (n - 1) + new_score) / n
        )

    # Adaptive difficulty adjustment
    if session.running_avg_score < 4.0:
        session.current_difficulty_level = max(1.0, session.current_difficulty_level - 0.5)
    elif session.running_avg_score > 7.5:
        session.current_difficulty_level = min(10.0, session.current_difficulty_level + 0.5)


def _generate_fallback_questions(target_role: str, difficulty: float) -> list:
    """Generate fallback questions if AI fails."""
    return [
        {
            "text": f"Tell me about yourself and why you're interested in the {target_role} role.",
            "category": "hr",
            "difficulty": difficulty,
            "related_resume_section": "experience",
            "question_type": "open_ended",
            "options": None,
        },
        {
            "text": f"What technical skills do you bring to the {target_role} position?",
            "category": "technical",
            "difficulty": difficulty,
            "related_resume_section": "skills",
            "question_type": "open_ended",
            "options": None,
        },
        {
            "text": "Describe a challenging project you've worked on and how you handled it.",
            "category": "behavioral",
            "difficulty": difficulty,
            "related_resume_section": "projects",
            "question_type": "open_ended",
            "options": None,
        },
        {
            "text": "Where do you see yourself in 5 years?",
            "category": "hr",
            "difficulty": max(1, difficulty - 1),
            "related_resume_section": None,
            "question_type": "multiple_choice",
            "options": ["Leading a team", "Deep technical expertise", "Starting my own company", "Not sure yet"],
        },
        {
            "text": f"How do you stay updated with the latest trends in {target_role}?",
            "category": "situational",
            "difficulty": difficulty,
            "related_resume_section": "technologies",
            "question_type": "open_ended",
            "options": None,
        },
    ]
