"""Freshness score decay — replaces hardcoded 1.0."""
from __future__ import annotations

from datetime import datetime, timezone


def compute_freshness(posted_at: datetime, now: datetime | None = None) -> float:
    """Decay freshness based on job age."""
    if now is None:
        now = datetime.now(timezone.utc)
    # Handle string dates from MongoDB
    if isinstance(posted_at, str):
        try:
            posted_at = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return 0.1  # Can't parse — treat as stale
    # Handle timezone-naive datetimes from MongoDB
    if posted_at.tzinfo is None:
        posted_at = posted_at.replace(tzinfo=timezone.utc)
    age_hours = (now - posted_at).total_seconds() / 3600
    if age_hours < 1:
        return 1.0
    if age_hours < 24:
        return 0.95
    if age_hours < 72:
        return 0.85
    if age_hours < 168:
        return 0.7
    if age_hours < 720:
        return 0.4
    return 0.1
