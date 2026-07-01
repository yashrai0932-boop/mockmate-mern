"""
Voice Service - speech-to-text using browser-native or Whisper,
plus speech analysis (filler words, speed, pauses).
"""

import os
import uuid
import logging
from typing import Optional

from app.utils.helpers import count_filler_words, calculate_speaking_speed

logger = logging.getLogger(__name__)

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Lazy-loaded Whisper model
_whisper_model = None


def _get_whisper_model():
    """Lazy load Whisper model to avoid startup delay."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            from app.config import settings
            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
            _whisper_model = whisper.load_model(settings.WHISPER_MODEL)
            logger.info("Whisper model loaded successfully")
        except ImportError:
            logger.warning("Whisper not installed. Use: pip install openai-whisper")
            return None
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            return None
    return _whisper_model


async def transcribe_audio(audio_content: bytes, filename: str) -> dict:
    """
    Transcribe audio file using Whisper.
    Returns transcript and basic analysis.
    """
    # Save audio file
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    audio_path = os.path.join(AUDIO_DIR, f"{uuid.uuid4()}.{ext}")

    with open(audio_path, "wb") as f:
        f.write(audio_content)

    model = _get_whisper_model()
    if model is None:
        return {
            "transcript": "",
            "error": "Whisper not available. Use browser speech recognition instead.",
            "audio_path": audio_path,
        }

    try:
        result = model.transcribe(audio_path)
        transcript = result.get("text", "").strip()
        duration = result.get("segments", [{}])[-1].get("end", 0) if result.get("segments") else 0

        # Analyze speech
        analysis = analyze_speech(transcript, duration)

        return {
            "transcript": transcript,
            "duration_seconds": duration,
            "analysis": analysis,
            "audio_path": audio_path,
        }
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return {
            "transcript": "",
            "error": str(e),
            "audio_path": audio_path,
        }


def analyze_speech(transcript: str, duration_seconds: float) -> dict:
    """Analyze speech patterns from transcript."""
    if not transcript:
        return {
            "filler_words": {},
            "filler_word_count": 0,
            "speaking_speed_wpm": 0,
            "word_count": 0,
            "pause_indicators": 0,
            "confidence_indicators": {
                "hedging_phrases": 0,
                "assertive_phrases": 0,
            },
        }

    filler_words = count_filler_words(transcript)
    speed = calculate_speaking_speed(transcript, duration_seconds) if duration_seconds > 0 else 0
    word_count = len(transcript.split())

    # Detect hedging (low confidence indicators)
    hedging = sum(
        transcript.lower().count(phrase)
        for phrase in ["i think", "maybe", "i guess", "not sure", "probably", "i believe"]
    )
    # Detect assertive phrases (high confidence indicators)
    assertive = sum(
        transcript.lower().count(phrase)
        for phrase in ["i know", "definitely", "certainly", "absolutely", "clearly", "in my experience"]
    )

    return {
        "filler_words": filler_words,
        "filler_word_count": sum(filler_words.values()),
        "speaking_speed_wpm": speed,
        "word_count": word_count,
        "pause_indicators": transcript.count("...") + transcript.count(",") // 3,
        "confidence_indicators": {
            "hedging_phrases": hedging,
            "assertive_phrases": assertive,
        },
    }
