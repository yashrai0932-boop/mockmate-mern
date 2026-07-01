"""Utility helpers."""

import re
from typing import List


def count_filler_words(text: str) -> dict:
    """Count filler words in text."""
    filler_patterns = {
        "um": r"\bum+\b",
        "uh": r"\buh+\b",
        "like": r"\blike\b",
        "you know": r"\byou know\b",
        "basically": r"\bbasically\b",
        "actually": r"\bactually\b",
        "sort of": r"\bsort of\b",
        "kind of": r"\bkind of\b",
    }
    counts = {}
    lower_text = text.lower()
    for word, pattern in filler_patterns.items():
        count = len(re.findall(pattern, lower_text))
        if count > 0:
            counts[word] = count
    return counts


def calculate_speaking_speed(text: str, duration_seconds: float) -> float:
    """Calculate words per minute."""
    if duration_seconds <= 0:
        return 0.0
    word_count = len(text.split())
    return round((word_count / duration_seconds) * 60, 1)


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to max length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."
