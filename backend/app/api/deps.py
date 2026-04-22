"""Shared authentication dependencies — single source of truth for JWT verification."""

import time
import logging
from dataclasses import dataclass
from fastapi import HTTPException
from app.config import settings

logger = logging.getLogger("sviam.auth")


@dataclass
class AuthUser:
    id: str
    email: str


# In-memory LRU cache for decoded tokens (avoids re-decoding same JWT)
_token_cache: dict[str, tuple[AuthUser, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def get_current_user(authorization: str) -> AuthUser:
    """Verify JWT locally — zero network calls when JWT secret is configured.

    Usage in any route:
        from app.api.deps import get_current_user
        user = get_current_user(authorization)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]

    # Check in-memory cache first (same token = same user within 5 min)
    now = time.time()
    cached = _token_cache.get(token)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]

    if settings.supabase_jwt_secret:
        # Decode JWT locally — no network call
        import jwt

        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user = AuthUser(id=payload["sub"], email=payload.get("email", ""))
            _token_cache[token] = (user, now)
            # Prune cache if it grows too large
            if len(_token_cache) > 1000:
                cutoff = now - _CACHE_TTL
                expired = [k for k, (_, t) in _token_cache.items() if t < cutoff]
                for k in expired:
                    del _token_cache[k]
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        # Fallback: remote verification (for dev without JWT secret)
        from app.db.supabase_client import get_supabase

        supabase = get_supabase()
        try:
            resp = supabase.auth.get_user(token)
            user = AuthUser(id=str(resp.user.id), email=resp.user.email or "")
            _token_cache[token] = (user, now)
            return user
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
