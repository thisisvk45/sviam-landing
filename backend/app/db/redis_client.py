import json
from typing import Optional
import redis.asyncio as aioredis

_client = None


def get_redis():
    return _client


async def connect_redis():
    global _client
    from app.config import settings
    if not settings.redis_url:
        print("Redis URL not set — caching disabled")
        return
    _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    await _client.ping()
    print("Redis connected")
