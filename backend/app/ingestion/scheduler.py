"""Tiered scheduler — reads crawl_frequency_hours to determine which companies are due."""
from __future__ import annotations

from datetime import datetime, timezone
from app.db.mongo import get_db


# Default tier assignments by ATS type
ATS_TIER_DEFAULTS: dict[str, float] = {
    "greenhouse": 0.083,   # 5 min — free public JSON API
    "lever": 0.083,        # 5 min — free public JSON API
    "ashby": 0.083,        # 5 min — free public JSON API
    "darwinbox": 0.5,      # 30 min — POST-based, heavier
    "workday": 0.5,        # 30 min — POST-based
    "smartrecruiters": 0.5,# 30 min
    "indeed": 6,           # 6h — web scraping, brittle
    "internshala": 6,      # 6h — web scraping
    "adzuna": 24,          # 24h — paid API, rate-limited
    "serpapi": 24,          # 24h — paid API, expensive
}


async def get_due_companies() -> list[dict]:
    """Return companies whose crawl interval has elapsed since last_crawled."""
    now = datetime.now(timezone.utc)
    db = get_db()
    companies = await db.companies.find({"active": True}).to_list(None)

    due = []
    for c in companies:
        freq_hours = c.get("crawl_frequency_hours") or ATS_TIER_DEFAULTS.get(c.get("ats_type", ""), 24)
        last = c.get("last_crawled")
        if not last:
            due.append(c)
            continue
        # Handle timezone-naive datetimes from MongoDB
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if (now - last).total_seconds() >= freq_hours * 3600:
            due.append(c)

    return due
