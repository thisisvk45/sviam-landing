"""ETag + content hash change detection to skip unchanged sources."""
from __future__ import annotations

from app.db.redis_client import get_redis
from app.ingestion.utils import compute_content_hash

ETAG_TTL = 172800  # 48 hours


async def get_cached_etag(company_id: str) -> str | None:
    """Read stored ETag for a company from Redis."""
    redis = get_redis()
    if not redis:
        return None
    try:
        return await redis.get(f"crawl:etag:{company_id}")
    except Exception:
        return None


async def get_cached_hash(company_id: str) -> str | None:
    """Read stored content hash for a company from Redis."""
    redis = get_redis()
    if not redis:
        return None
    try:
        return await redis.get(f"crawl:hash:{company_id}")
    except Exception:
        return None


async def store_etag_and_hash(company_id: str, etag: str | None, content_hash: str | None) -> None:
    """Store ETag and content hash in Redis with TTL."""
    redis = get_redis()
    if not redis:
        return
    try:
        if etag:
            await redis.set(f"crawl:etag:{company_id}", etag, ex=ETAG_TTL)
        if content_hash:
            await redis.set(f"crawl:hash:{company_id}", content_hash, ex=ETAG_TTL)
    except Exception:
        pass


def check_content_changed(response_body: str | bytes, cached_hash: str | None) -> tuple[bool, str]:
    """Compare response body hash against cached hash. Returns (changed, new_hash)."""
    if isinstance(response_body, bytes):
        response_body = response_body.decode("utf-8", errors="replace")
    new_hash = compute_content_hash(response_body)
    if cached_hash and new_hash == cached_hash:
        return False, new_hash
    return True, new_hash
