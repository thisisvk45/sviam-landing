"""Usage tracking and free-tier gating via Redis counters."""
import json
from datetime import datetime, timezone
from app.db.redis_client import get_redis
from app.db.supabase_client import get_supabase, run_supabase
from fastapi import HTTPException


# Free tier limits
FREE_LIMITS = {
    "matches": 10,        # per day
    "tailors": 3,         # per month
    "cover_letters": 3,   # per month
    "auto_applies": 3,    # per month
    "interview_prep": 5,  # per day
    "resume_parse": 5,    # per day
    "improve_bullets": 5, # per day
    "generate_summary": 5,# per day
    "suggest_skills": 5,  # per day
    "negotiate": 3,       # per day
}

# Pro tier limits (100/month for core features, unlimited daily)
PRO_LIMITS = {
    "tailors": 100,
    "cover_letters": 100,
    "auto_applies": 100,
}

# Daily-reset features
_DAILY_FEATURES = {"matches", "interview_prep", "resume_parse", "improve_bullets", "generate_summary", "suggest_skills", "negotiate"}


async def get_user_tier(user_id: str) -> str:
    """Get the user's subscription tier — cached in Redis for 5 minutes."""
    redis = get_redis()

    # Try Redis cache first
    if redis:
        try:
            cached = await redis.get(f"tier:{user_id}")
            if cached:
                return cached
        except Exception:
            pass

    # Fetch from Supabase (wrapped in executor)
    try:
        supabase = get_supabase()
        result = await run_supabase(
            lambda: supabase.table("profiles").select(
                "job_preferences"
            ).eq("id", user_id).single().execute()
        )
        prefs = (result.data or {}).get("job_preferences") or {}
        if isinstance(prefs, str):
            prefs = json.loads(prefs)
        billing = prefs.get("billing") or {}
        tier = billing.get("subscription_tier", "free")

        # Check if subscription is still valid
        valid_until = billing.get("valid_until")
        if tier != "free" and valid_until:
            try:
                expiry = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
                if expiry < datetime.now(timezone.utc):
                    tier = "free"  # Expired
            except (ValueError, TypeError):
                pass

        # Cache for 5 minutes
        if redis:
            try:
                await redis.set(f"tier:{user_id}", tier, ex=300)
            except Exception:
                pass

        return tier
    except Exception:
        return "free"


async def check_usage(user_id: str, feature: str) -> dict:
    """
    Check if user can use a feature. Returns usage info.
    Does NOT increment -- call increment_usage after successful operation.
    """
    tier = await get_user_tier(user_id)
    if tier == "unlimited":
        return {"allowed": True, "tier": tier, "used": 0, "limit": -1}

    # Pro tier: unlimited daily features, capped monthly features
    if tier == "pro":
        pro_limit = PRO_LIMITS.get(feature)
        if pro_limit is None:
            # Daily features and uncapped features are unlimited for pro
            return {"allowed": True, "tier": tier, "used": 0, "limit": -1}
        # Check monthly cap for pro
        redis = get_redis()
        if not redis:
            return {"allowed": True, "tier": tier, "used": 0, "limit": pro_limit}
        now = datetime.now(timezone.utc)
        period_key = now.strftime("%Y-%m")
        cache_key = f"usage:{user_id}:{feature}:{period_key}"
        try:
            current = await redis.get(cache_key)
            used = int(current) if current else 0
            return {"allowed": used < pro_limit, "tier": tier, "used": used, "limit": pro_limit, "resets": "monthly"}
        except Exception:
            return {"allowed": True, "tier": tier, "used": 0, "limit": pro_limit}

    limit = FREE_LIMITS.get(feature)
    if limit is None:
        return {"allowed": True, "tier": tier, "used": 0, "limit": -1}

    redis = get_redis()
    if not redis:
        # If Redis is down, allow the request (graceful degradation)
        return {"allowed": True, "tier": tier, "used": 0, "limit": limit}

    # Build key based on reset period
    now = datetime.now(timezone.utc)
    if feature in _DAILY_FEATURES:
        period_key = now.strftime("%Y-%m-%d")  # Daily reset
    else:
        period_key = now.strftime("%Y-%m")  # Monthly reset

    cache_key = f"usage:{user_id}:{feature}:{period_key}"

    try:
        current = await redis.get(cache_key)
        used = int(current) if current else 0
        return {
            "allowed": used < limit,
            "tier": tier,
            "used": used,
            "limit": limit,
            "resets": "daily" if feature in _DAILY_FEATURES else "monthly",
        }
    except Exception:
        return {"allowed": True, "tier": tier, "used": 0, "limit": limit}


async def increment_usage(user_id: str, feature: str) -> None:
    """Increment usage counter after a successful operation."""
    redis = get_redis()
    if not redis:
        return

    now = datetime.now(timezone.utc)
    if feature in _DAILY_FEATURES:
        period_key = now.strftime("%Y-%m-%d")
        ttl = 86400 * 2  # 2 days (buffer)
    else:
        period_key = now.strftime("%Y-%m")
        ttl = 86400 * 35  # 35 days (buffer)

    cache_key = f"usage:{user_id}:{feature}:{period_key}"

    try:
        pipe = redis.pipeline()
        pipe.incr(cache_key)
        pipe.expire(cache_key, ttl)
        await pipe.execute()
    except Exception:
        pass


def raise_limit_exceeded(feature: str, usage: dict):
    """Raise 429 with upgrade prompt details."""
    raise HTTPException(
        status_code=429,
        detail={
            "error": "usage_limit_exceeded",
            "feature": feature,
            "used": usage["used"],
            "limit": usage["limit"],
            "resets": usage.get("resets", "daily"),
            "message": f"Free plan limit reached for {feature}. Upgrade to Pro for unlimited access.",
            "upgrade_url": "https://sviam.in/pricing",
        },
    )
