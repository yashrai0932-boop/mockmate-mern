"""
Analytics Service - computes dashboard analytics from interview history.
"""

from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.interview import InterviewSession
from app.models.answer import Answer
from app.models.question import Question


def get_dashboard_analytics(db: Session, user_id: str) -> dict:
    """Compute comprehensive analytics for user dashboard."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    if not sessions:
        return _empty_analytics()

    completed = [s for s in sessions if s.status == "completed"]

    # Score trends over time
    score_trends = []
    for s in completed:
        score_trends.append({
            "date": s.created_at.isoformat() if s.created_at else None,
            "overall": s.overall_score or 0,
            "communication": s.communication_score or 0,
            "technical": s.technical_score or 0,
            "relevance": s.relevance_score or 0,
            "confidence": s.confidence_score or 0,
            "role": s.target_role,
        })

    # Weak topics (categories with lowest scores)
    category_scores = defaultdict(list)
    for s in completed:
        answers = db.query(Answer).filter(Answer.session_id == s.id).all()
        for a in answers:
            q = db.query(Question).filter(Question.id == a.question_id).first()
            if q:
                category_scores[q.category].append(a.overall_score or 5.0)

    weak_topics = []
    for category, scores in category_scores.items():
        avg = sum(scores) / len(scores) if scores else 0
        weak_topics.append({
            "category": category,
            "avg_score": round(avg, 1),
            "attempts": len(scores),
        })
    weak_topics.sort(key=lambda x: x["avg_score"])

    # Overall stats
    total_interviews = len(sessions)
    completed_count = len(completed)
    avg_score = (
        sum(s.overall_score for s in completed if s.overall_score) / completed_count
        if completed_count
        else 0
    )

    # Confidence progress
    confidence_progress = [
        {
            "date": s.created_at.isoformat() if s.created_at else None,
            "confidence": s.confidence_score or 0,
        }
        for s in completed
    ]

    # Skill heatmap data
    skill_heatmap = {}
    for category, scores in category_scores.items():
        for i, score in enumerate(scores):
            key = f"{category}_{i}"
            skill_heatmap[key] = round(score, 1)

    return {
        "total_interviews": total_interviews,
        "completed_interviews": completed_count,
        "average_score": round(avg_score, 1),
        "score_trends": score_trends,
        "weak_topics": weak_topics,
        "confidence_progress": confidence_progress,
        "skill_heatmap": skill_heatmap,
        "recent_sessions": [
            {
                "id": s.id,
                "target_role": s.target_role,
                "status": s.status,
                "overall_score": s.overall_score,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions[:10]
        ],
    }


def _empty_analytics() -> dict:
    return {
        "total_interviews": 0,
        "completed_interviews": 0,
        "average_score": 0,
        "score_trends": [],
        "weak_topics": [],
        "confidence_progress": [],
        "skill_heatmap": {},
        "recent_sessions": [],
    }
