"""AI package - NVIDIA NIM integration."""
from app.ai.nim_service import nim_service
from app.ai.personalities import get_personality, get_all_personalities, PERSONALITIES

__all__ = ["nim_service", "get_personality", "get_all_personalities", "PERSONALITIES"]
