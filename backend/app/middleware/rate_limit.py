import time
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-IP rate limiter with different limits per path category:
    - LLM endpoints (/match/, /resume/, /interview-prep/): 15 req/min
    - Admin/cron endpoints (/admin/, /cron/): 5 req/min
    - All other endpoints: no limit (or global default)
    """

    # Paths that hit LLM APIs and cost money per call
    LLM_PATHS = ("/match/", "/resume/", "/interview-prep/")
    # Admin paths that should be brute-force protected
    ADMIN_PATHS = ("/admin/", "/cron/daily")

    def __init__(self, app, requests_per_minute: int = 30):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Determine rate limit bucket and limit
        if any(p in path for p in self.ADMIN_PATHS):
            bucket_suffix = ":admin"
            limit = 5  # Strict limit to prevent brute-force
        elif any(p in path for p in self.LLM_PATHS):
            bucket_suffix = ":llm"
            limit = 15  # Moderate limit for expensive LLM calls
        else:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        bucket_key = f"{client_ip}{bucket_suffix}"
        now = time.time()

        # Clean old entries and remove empty keys to prevent memory leak
        active = [t for t in self._requests[bucket_key] if now - t < 60]
        if active:
            self._requests[bucket_key] = active
        else:
            del self._requests[bucket_key]

        if len(self._requests.get(bucket_key, [])) >= limit:
            oldest = min(self._requests[bucket_key])
            retry_after = int(60 - (now - oldest)) + 1
            return JSONResponse(
                status_code=429,
                content={"detail": f"Too many requests. Try again in {retry_after}s."},
                headers={"Retry-After": str(retry_after)},
            )

        self._requests[bucket_key].append(now)
        return await call_next(request)
