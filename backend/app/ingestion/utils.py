"""Shared utilities for all ingestion adapters — DRY extraction."""

import hashlib
from bs4 import BeautifulSoup


def generate_job_id(company: str, title: str, city: str, date: str) -> str:
    """Deterministic job ID from company|title|city|date."""
    key = f"{company.lower()}|{title.lower()}|{city.lower()}|{date[:10]}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def clean_html(html: str) -> str:
    """Strip HTML tags, return plain text."""
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(separator="\n").strip()


def parse_location(location_str: str, fallback_city: str = "India") -> dict:
    """Parse a location string into structured location dict."""
    location_str = location_str or ""
    remote = "remote" in location_str.lower()
    hybrid = "hybrid" in location_str.lower()
    parts = [p.strip() for p in location_str.replace(",", "|").split("|")]
    city = parts[0] if parts and parts[0] else fallback_city
    state = parts[1].strip() if len(parts) > 1 else ""
    return {
        "city": city,
        "state": state,
        "country": "India",
        "remote": remote,
        "hybrid": hybrid,
    }


def compute_content_hash(content: str) -> str:
    """SHA256 hash of content for change detection."""
    return hashlib.sha256(content.encode()).hexdigest()
