"""
Proctoring schemas - request/response models for proctoring operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProctorEventItem(BaseModel):
    event_type: str = Field(
        ...,
        description="Event type: tab_switch, fullscreen_exit, copy_attempt, paste_attempt, "
                    "devtools_attempt, right_click, multiple_faces, no_face, gaze_away, "
                    "low_light, background_noise, inactivity, keyboard_shortcut"
    )
    severity: str = Field(default="medium", pattern="^(low|medium|high)$")
    message: str = ""
    score_penalty: float = 0
    timestamp: Optional[str] = None  # ISO string from frontend


class ProctorEventsBatch(BaseModel):
    """Batch of proctoring events sent from frontend every ~10 seconds."""
    events: List[ProctorEventItem] = []
    current_integrity_score: float = Field(default=100.0, ge=0, le=100)
    warning_count: int = Field(default=0, ge=0)


class ProctorSummaryResponse(BaseModel):
    session_id: str
    integrity_score: float
    total_events: int
    warning_count: int
    event_breakdown: Dict[str, int] = {}
    # e.g. {"tab_switch": 3, "copy_attempt": 1, "no_face": 2}
    timeline: List[Dict[str, Any]] = []
    # e.g. [{"time": "00:02:15", "type": "tab_switch", "severity": "medium"}]


class IntegrityScoreResponse(BaseModel):
    session_id: str
    integrity_score: float
    warning_count: int
    proctoring_enabled: bool
