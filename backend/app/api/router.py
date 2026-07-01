"""
API Router - aggregates all route modules.
"""

from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.resume import router as resume_router
from app.api.interview import router as interview_router
from app.api.report import router as report_router
from app.api.analytics import router as analytics_router
from app.api.voice import router as voice_router
from app.api.recruiter import router as recruiter_router
from app.api.proctor import router as proctor_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(resume_router)
api_router.include_router(interview_router)
api_router.include_router(report_router)
api_router.include_router(analytics_router)
api_router.include_router(voice_router)
api_router.include_router(recruiter_router)
api_router.include_router(proctor_router)

