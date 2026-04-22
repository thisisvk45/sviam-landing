from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from app.config import settings
from app.db.redis_client import get_redis

router = APIRouter(prefix="/cron", tags=["cron"])


@router.post("/tick")
async def tick(
    background_tasks: BackgroundTasks,
    x_cron_secret: str = Header(None),
):
    """Called every 5 minutes by cron-job.org. Only crawls companies whose interval has elapsed."""
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    from app.ingestion.scheduler import get_due_companies

    due = await get_due_companies()
    if not due:
        return {"status": "ok", "message": "No companies due", "due": 0}

    # Per-company Redis locks — skip companies already being crawled
    redis = get_redis()
    to_crawl = []
    for c in due:
        lock_key = f"crawl:lock:{c['_id']}"
        if redis:
            try:
                locked = await redis.get(lock_key)
                if locked:
                    continue
                await redis.set(lock_key, "1", ex=300)  # 5 min TTL
            except Exception:
                pass  # Redis down — skip locking, crawl anyway
        to_crawl.append(c)

    if not to_crawl:
        return {"status": "ok", "message": "All due companies already locked", "due": len(due), "crawling": 0}

    async def _run_tick():
        from app.ingestion.pipeline import run_all
        try:
            await run_all(to_crawl)
        finally:
            # Release locks
            if redis:
                for c in to_crawl:
                    try:
                        await redis.delete(f"crawl:lock:{c['_id']}")
                    except Exception:
                        pass

    background_tasks.add_task(_run_tick)
    names = [c["name"] for c in to_crawl]
    return {
        "status": "started",
        "due": len(due),
        "crawling": len(to_crawl),
        "companies": names,
    }


@router.post("/daily-crawl")
async def daily_crawl(
    background_tasks: BackgroundTasks,
    x_cron_secret: str = Header(None),
):
    """Force-refresh all companies + run full aggregator pipeline."""
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    redis = get_redis()
    if redis:
        running = await redis.get("crawl:running")
        if running:
            return {"message": "Crawl already in progress"}
        await redis.set("crawl:running", "true", ex=7200)  # 2 hour TTL for full pipeline

    async def _run_daily():
        import time
        from app.ingestion.pipeline import run_all, run_aggregator_pipeline
        start = time.time()
        try:
            # First: crawl ATS-based companies
            await run_all()
            # Then: run aggregator pipeline (SerpApi, Greenhouse India, Lever India, Hirist, IIMJobs)
            results = await run_aggregator_pipeline()
            elapsed = time.time() - start
            print(f"\n[DAILY] Full pipeline complete in {elapsed:.0f}s")
            print(f"[DAILY] Results: {results.get('summary', {})}")
        finally:
            if redis:
                await redis.set("crawl:running", "", ex=1)

    background_tasks.add_task(_run_daily)
    return {"status": "started", "message": "Full daily pipeline triggered (ATS companies + aggregators)"}


@router.post("/aggregator-crawl")
async def aggregator_crawl(
    background_tasks: BackgroundTasks,
    x_cron_secret: str = Header(None),
):
    """Run only aggregator sources (SerpApi, Greenhouse India, Lever India, Hirist, IIMJobs)."""
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    redis = get_redis()
    if redis:
        running = await redis.get("pipeline:running")
        if running:
            return {"message": "Aggregator pipeline already in progress"}
        await redis.set("pipeline:running", "true", ex=7200)

    async def _run_aggregators():
        from app.ingestion.pipeline import run_aggregator_pipeline
        try:
            results = await run_aggregator_pipeline()
            print(f"[AGGREGATOR] Done: {results.get('summary', {})}")
        finally:
            if redis:
                await redis.set("pipeline:running", "", ex=1)

    background_tasks.add_task(_run_aggregators)
    return {"status": "started", "message": "Aggregator pipeline triggered"}


@router.post("/decay")
async def decay_freshness(
    x_cron_secret: str = Header(None),
):
    """Daily batch recalculation of freshness_score for all active jobs."""
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    from app.db.mongo import get_db
    from app.ingestion.freshness import compute_freshness
    from pymongo import UpdateOne

    db = get_db()
    now = datetime.now(timezone.utc)

    cursor = db.jobs.find(
        {"is_active": True},
        {"_id": 1, "posted_at": 1},
    )

    operations = []
    async for job in cursor:
        posted_at = job.get("posted_at")
        if not posted_at:
            continue
        new_score = compute_freshness(posted_at, now)
        operations.append(
            UpdateOne(
                {"_id": job["_id"]},
                {"$set": {"freshness_score": new_score}},
            )
        )

    updated = 0
    if operations:
        # Process in batches of 1000 to avoid huge memory usage
        batch_size = 1000
        for i in range(0, len(operations), batch_size):
            batch = operations[i : i + batch_size]
            result = await db.jobs.bulk_write(batch, ordered=False)
            updated += result.modified_count

    return {"status": "ok", "jobs_updated": updated}


@router.post("/cleanup-expired")
async def cleanup_expired(
    x_cron_secret: str = Header(None),
):
    """Deactivate expired jobs and remove their vectors."""
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    from app.db.mongo import get_db

    db = get_db()
    now = datetime.now(timezone.utc)

    # Find expired active jobs
    expired_jobs = await db.jobs.find(
        {"is_active": True, "expires_at": {"$lt": now}},
        {"_id": 1, "milvus_id": 1},
    ).to_list(length=10000)

    if not expired_jobs:
        return {"status": "ok", "deactivated": 0, "vectors_removed": 0}

    # Deactivate in MongoDB
    expired_ids = [j["_id"] for j in expired_jobs]
    result = await db.jobs.update_many(
        {"_id": {"$in": expired_ids}},
        {"$set": {"is_active": False, "deactivated_at": now}},
    )
    deactivated = result.modified_count

    # Remove vectors from Zilliz
    vectors_removed = 0
    milvus_ids = [j["milvus_id"] for j in expired_jobs if j.get("milvus_id")]
    if milvus_ids:
        try:
            from app.db.zilliz_client import get_zilliz
            from app.config import settings as app_settings
            import asyncio

            zilliz = get_zilliz()
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: zilliz.delete(
                    collection_name=app_settings.zilliz_collection,
                    ids=milvus_ids,
                ),
            )
            vectors_removed = len(milvus_ids)
        except Exception as e:
            print(f"[CLEANUP] Failed to remove vectors: {e}")

    return {"status": "ok", "deactivated": deactivated, "vectors_removed": vectors_removed}


@router.get("/keep-alive")
async def keep_alive():
    """Called every 10 min by external cron to prevent Render free tier spin-down."""
    return {"status": "alive"}
