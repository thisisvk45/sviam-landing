import asyncio
import logging
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from contextlib import asynccontextmanager
from app.db.mongo import connect, disconnect, get_db
from app.db.zilliz_client import connect_zilliz, get_zilliz
from app.db.supabase_client import connect_supabase
from app.api.routes.jobs import router as jobs_router
from app.api.routes.match import router as match_router
from app.api.routes.profile import router as profile_router
from app.api.routes.resume_builder import router as resume_builder_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.applications import router as applications_router
from app.api.routes.interview_prep import router as interview_prep_router
from app.api.routes.cron import router as cron_router
from app.api.routes.billing import router as billing_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.interview_ws import router as interview_ws_router
from app.api.routes.reviews import router as reviews_router
from app.db.redis_client import connect_redis, get_redis
from app.ingestion.embedder import warmup_model
from app.config import settings

# Configure logging to show timing logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
logger = logging.getLogger("sviam")


async def _connect_with_timeout(name: str, coro, timeout: int = 15):
    """Connect to a service with a timeout so startup never hangs."""
    try:
        t0 = time.perf_counter()
        await asyncio.wait_for(coro(), timeout=timeout)
        elapsed = time.perf_counter() - t0
        print(f"  ✓ {name} ({elapsed:.1f}s)")
    except asyncio.TimeoutError:
        print(f"  ✗ {name} timed out after {timeout}s — will retry on first request")
    except Exception as e:
        print(f"  ✗ {name} failed: {type(e).__name__}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    t_start = time.perf_counter()
    print("Starting SViam Backend...")

    # Connect to databases concurrently for faster startup
    await asyncio.gather(
        _connect_with_timeout("MongoDB", connect),
        _connect_with_timeout("Zilliz", connect_zilliz),
        _connect_with_timeout("Supabase", connect_supabase),
        _connect_with_timeout("Redis", connect_redis),
    )

    # Pre-warm embedding model in background (don't block port binding)
    # This runs in a thread so the server can start accepting requests immediately
    asyncio.create_task(_warmup_embedding_model())

    t_total = time.perf_counter() - t_start
    print(f"Startup complete in {t_total:.1f}s — binding port")
    yield
    await disconnect()


async def _warmup_embedding_model():
    """Load embedding model after startup so first /match request isn't slow."""
    try:
        await asyncio.wait_for(warmup_model(), timeout=120)
    except asyncio.TimeoutError:
        print("Embedding model warmup timed out (120s) — will load on first request")
    except Exception as e:
        print(f"Embedding model warmup failed: {e}")

app = FastAPI(
    title="SViam Backend",
    version="0.2.0",
    lifespan=lifespan
)


# Response time middleware — logs slow requests
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time"] = f"{elapsed:.0f}ms"
        if elapsed > 500:
            logger.warning(f"SLOW {request.method} {request.url.path}: {elapsed:.0f}ms")
        return response

app.add_middleware(TimingMiddleware)

# CORS — only allow localhost in dev mode
origins = ["https://sviam.in", "https://www.sviam.in", "http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=30)

app.include_router(jobs_router)
app.include_router(match_router)
app.include_router(profile_router)
app.include_router(resume_builder_router)
app.include_router(resumes_router)
app.include_router(applications_router)
app.include_router(interview_prep_router)
app.include_router(cron_router)
app.include_router(billing_router)
app.include_router(notifications_router)
app.include_router(interviews_router)
app.include_router(interview_ws_router)
app.include_router(reviews_router)

@app.get("/health")
async def health():
    """Health check that verifies all database connections."""
    checks = {}
    # MongoDB
    try:
        db = get_db()
        await db.command("ping")
        checks["mongodb"] = "ok"
    except Exception:
        checks["mongodb"] = "error"
    # Redis
    redis = get_redis()
    if redis:
        try:
            await redis.ping()
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "error"
    else:
        checks["redis"] = "disabled"
    # Zilliz
    try:
        zilliz = get_zilliz()
        checks["zilliz"] = "ok" if zilliz else "not_connected"
    except Exception:
        checks["zilliz"] = "error"

    all_ok = all(v == "ok" for v in checks.values() if v != "disabled")
    status_code = 200 if all_ok else 503
    return JSONResponse(
        content={"status": "ok" if all_ok else "degraded", "checks": checks, "version": "0.2.0"},
        status_code=status_code,
    )


@app.get("/ping")
async def ping():
    """Ultra-lightweight keep-alive endpoint. Call every 10 min to prevent Render spin-down."""
    return {"pong": True}
