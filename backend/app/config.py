"""
MockMate Configuration
Loads environment variables using pydantic-settings.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # NVIDIA NIM API
    NVIDIA_NIM_API_KEY: str = ""
    NVIDIA_NIM_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_NIM_MODEL: str = "meta/llama-3.1-70b-instruct"

    # JWT Authentication
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./mockmate.db"

    # ChromaDB
    CHROMA_DB_PATH: str = "./chroma_db"

    # Whisper
    WHISPER_MODEL: str = "base"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate Limiting
    NIM_MAX_RPM: int = 35  # Stay under 40 RPM free tier limit
    NIM_RETRY_ATTEMPTS: int = 3
    NIM_RETRY_DELAY: float = 2.0

    # Cache
    CACHE_MAX_SIZE: int = 500
    CACHE_TTL_SECONDS: int = 3600  # 1 hour

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


# Singleton settings instance
settings = Settings()
