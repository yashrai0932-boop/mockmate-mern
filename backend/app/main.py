"""
MockMate Backend - FastAPI Application
Main entry point for the backend server.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.base import Base
from app.database.connection import engine
from app.api.router import api_router
from app.ai.nim_service import nim_service

# Import all models so SQLAlchemy can create tables
from app.models import *  # noqa: F401, F403

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    # Startup
    logger.info("🚀 Starting MockMate Backend...")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created")

    # Verify NIM API key
    if not settings.NVIDIA_NIM_API_KEY or settings.NVIDIA_NIM_API_KEY == "your_nvidia_nim_api_key_here":
        logger.warning("⚠️  NVIDIA NIM API key not set! AI features will not work.")
    else:
        logger.info("✅ NVIDIA NIM API key configured")

    logger.info("✅ MockMate Backend ready!")

    yield

    # Shutdown
    logger.info("Shutting down MockMate Backend...")
    await nim_service.close()
    logger.info("👋 Goodbye!")


# Create FastAPI app
app = FastAPI(
    title="MockMate API",
    description="AI-powered mock interview platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)


# Health check
@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MockMate API",
        "version": "1.0.0",
    }
