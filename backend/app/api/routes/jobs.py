import asyncio
import hashlib
import json
import re as re_module
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from app.db.mongo import get_db
from app.db.redis_client import get_redis
from app.db.zilliz_client import get_zilliz, async_search_zilliz
from app.ingestion.embedder import embed_text, async_embed_text
from app.db.supabase_client import run_supabase
from app.config import settings

router = APIRouter(prefix="/jobs", tags=["jobs"])

def generate_job_id(company: str, title: str, city: str, date: str) -> str:
    key = f"{company.lower()}|{title.lower()}|{city.lower()}|{date[:10]}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]

@router.get("")
async def list_jobs(
    city: str = None,
    level: str = None,
    remote: bool = None,
    limit: int = 20,
    skip: int = 0
):
    db = get_db()
    cutoff = datetime.now(timezone.utc) - timedelta(days=60)
    query = {"is_active": True, "posted_at": {"$gte": cutoff}}
    use_collation = False
    if city:
        query["location.city"] = city
        use_collation = True
    if level:
        query["role.level"] = level
    if remote is not None:
        query["location.remote"] = remote

    # Run count + find in parallel
    total_coro = db.jobs.count_documents(query)
    if use_collation:
        jobs_coro = db.jobs.find(query, {"raw_jd": 0}).collation({"locale": "en", "strength": 2}).sort("posted_at", -1).skip(skip).limit(limit).to_list(limit)
    else:
        jobs_coro = db.jobs.find(query, {"raw_jd": 0}).sort("posted_at", -1).skip(skip).limit(limit).to_list(limit)
    total, jobs = await asyncio.gather(total_coro, jobs_coro)

    for job in jobs:
        job["_id"] = str(job["_id"]) if "_id" in job else job.get("id")
    return {"jobs": jobs, "total": total, "count": len(jobs), "skip": skip, "limit": limit}

@router.get("/cities")
async def list_cities():
    """Returns list of cities with job counts for sitemap/navigation."""
    db = get_db()
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$location.city", "count": {"$sum": 1}}},
        {"$match": {"_id": {"$ne": None}}},
        {"$sort": {"count": -1}},
    ]
    results = []
    async for doc in db.jobs.aggregate(pipeline):
        if doc["_id"]:
            results.append({"city": doc["_id"], "count": doc["count"]})
    return {"cities": results}

@router.get("/stats")
async def job_stats():
    db = get_db()
    total = await db.jobs.count_documents({"is_active": True})
    return {"total_active_jobs": total}

@router.get("/trending")
async def trending_jobs():
    # Check Redis cache first
    redis = get_redis()
    cache_key = "trending_jobs"
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    db = get_db()
    cursor = db.jobs.find(
        {"is_active": True},
        {"raw_jd": 0},
    ).sort("posted_at", -1).limit(20)

    results = []
    async for doc in cursor:
        results.append({
            "job_id": str(doc.get("_id", "")),
            "title": doc.get("role", {}).get("title", ""),
            "company": doc.get("company", {}).get("name", ""),
            "city": doc.get("location", {}).get("city", ""),
            "remote": doc.get("location", {}).get("remote", False),
            "work_type": doc.get("role", {}).get("type", ""),
            "apply_url": doc.get("apply_url", ""),
            "posted_at": doc.get("posted_at", ""),
            "skills": doc.get("requirements", {}).get("skills", []),
            "source": doc.get("source", ""),
            "match_score": 0,
        })

    response = {"jobs_matched": len(results), "results": results}

    # Cache for 5 minutes
    if redis:
        try:
            await redis.set(cache_key, json.dumps(response, default=str), ex=300)
        except Exception:
            pass

    return response


@router.get("/{job_id}")
async def get_job(job_id: str):
    db = get_db()
    # Exclude raw_jd to avoid leaking internal company info from crawled postings
    job = await db.jobs.find_one({"_id": job_id}, {"raw_jd": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/seed-test")
async def seed_test_job(x_admin_key: str = Header(None)):
    from app.config import settings
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = get_db()
    now = datetime.now(timezone.utc)
    job_id = generate_job_id("Razorpay", "Backend Engineer", "Bengaluru", str(now.date()))

    test_job = {
        "_id": job_id,
        "source": "test",
        "source_url": "https://razorpay.com/jobs/backend-engineer",
        "apply_url": "https://razorpay.com/jobs/backend-engineer",
        "ats_type": "greenhouse",
        "company": {
            "name": "Razorpay",
            "domain": "razorpay.com",
            "city": "Bengaluru",
            "industry": "Fintech",
            "size": "501-1000"
        },
        "role": {
            "title": "Backend Engineer",
            "title_canonical": "Backend Engineer",
            "level": "mid",
            "department": "Engineering",
            "type": "fulltime"
        },
        "location": {
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "remote": False,
            "hybrid": True
        },
        "requirements": {
            "skills": ["Python", "Go", "PostgreSQL", "Kafka", "Kubernetes"],
            "exp_years_min": 2,
            "exp_years_max": 5,
            "education": "B.Tech or equivalent"
        },
        "compensation": {
            "salary_min": 2000000,
            "salary_max": 3500000,
            "currency": "INR",
            "disclosed": True
        },
        "raw_jd": "We are looking for a Backend Engineer to join Razorpay.",
        "milvus_id": None,
        "posted_at": now.isoformat(),
        "expires_at": now.isoformat(),
        "scraped_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "is_active": True,
        "freshness_score": 1.0
    }

    existing = await db.jobs.find_one({"_id": job_id})
    if existing:
        return {"message": "Job already exists", "job_id": job_id}

    await db.jobs.insert_one(test_job)
    return {"message": "Test job inserted", "job_id": job_id}


async def _run_crawl_background():
    """Run crawl in background — updates Redis status when done."""
    from app.ingestion.pipeline import run_all
    redis = get_redis()
    try:
        results = await run_all()
        total_new = sum(r["new"] for r in results)
        total_updated = sum(r["updated"] for r in results)
        result_data = {
            "message": "Crawl complete",
            "companies_crawled": len(results),
            "total_new_jobs": total_new,
            "total_updated": total_updated,
            "results": results,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
        if redis:
            await redis.set("crawl:last_result", json.dumps(result_data), ex=86400)
        print(f"[CRAWL] Done — +{total_new} new, {total_updated} updated from {len(results)} companies")
    except Exception as e:
        result_data = {
            "message": f"Crawl failed: {type(e).__name__}",
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
        if redis:
            await redis.set("crawl:last_result", json.dumps(result_data), ex=86400)
        print(f"[CRAWL] Failed: {e}")
    finally:
        if redis:
            await redis.set("crawl:running", "", ex=1)


@router.post("/admin/crawl")
async def trigger_crawl(
    background_tasks: BackgroundTasks,
    x_admin_key: str = Header(None),
):
    from app.config import settings

    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    redis = get_redis()
    if redis:
        running = await redis.get("crawl:running")
        if running:
            return {"message": "Crawl already in progress"}

    if redis:
        await redis.set("crawl:running", "true", ex=3600)

    background_tasks.add_task(_run_crawl_background)
    return {"message": "Crawl started in background", "started_at": datetime.now(timezone.utc).isoformat()}


@router.get("/admin/crawl-status")
async def crawl_status(x_admin_key: str = Header(None)):
    from app.config import settings
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    redis = get_redis()
    status = {"running": False, "last_result": None}
    if redis:
        running = await redis.get("crawl:running")
        status["running"] = bool(running)
        last_result = await redis.get("crawl:last_result")
        if last_result:
            status["last_result"] = json.loads(last_result)
    return status


@router.post("/save/{job_id}")
async def save_job(job_id: str, authorization: str = Header(None)):
    from app.api.deps import get_current_user
    from app.db.supabase_client import get_supabase
    user = get_current_user(authorization)
    supabase = get_supabase()

    # Check job exists
    db = get_db()
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await run_supabase(lambda: supabase.table("saved_jobs").upsert({
        "user_id": user.id,
        "job_id": job_id,
        "title": job.get("role", {}).get("title", ""),
        "company": job.get("company", {}).get("name", ""),
        "city": job.get("location", {}).get("city", ""),
    }).execute())

    return {"message": "Job saved", "job_id": job_id}


@router.delete("/save/{job_id}")
async def unsave_job(job_id: str, authorization: str = Header(None)):
    from app.api.deps import get_current_user
    from app.db.supabase_client import get_supabase
    user = get_current_user(authorization)
    supabase = get_supabase()
    await run_supabase(lambda: supabase.table("saved_jobs").delete().eq("user_id", user.id).eq("job_id", job_id).execute())
    return {"message": "Job unsaved", "job_id": job_id}


@router.get("/saved")
async def get_saved_jobs(authorization: str = Header(None)):
    from app.api.deps import get_current_user
    from app.db.supabase_client import get_supabase
    user = get_current_user(authorization)
    supabase = get_supabase()
    result = await run_supabase(lambda: supabase.table("saved_jobs").select("*").eq("user_id", user.id).execute())
    return {"saved_jobs": result.data or []}


@router.get("/{job_id}/similar")
async def get_similar_jobs(job_id: str):
    db = get_db()
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check Redis cache
    redis = get_redis()
    cache_key = f"similar:{job_id}"
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    # Build search text from job title + skills
    title = job.get("role", {}).get("title", "")
    skills = job.get("requirements", {}).get("skills", [])
    search_text = f"{title} {' '.join(skills)}"

    vector = await async_embed_text(search_text[:1500])
    search_results = await async_search_zilliz(vector, limit=6)

    # Collect results excluding self
    hits_by_id = {}
    for hit in search_results[0]:
        jid = hit["entity"]["job_id"]
        if jid == job_id or jid.startswith("user_"):
            continue
        similarity = hit["distance"]
        hits_by_id[jid] = round(similarity * 100, 1)

    # Take top 5
    top_ids = list(hits_by_id.keys())[:5]
    if not top_ids:
        result = {"similar_jobs": []}
    else:
        jobs_cursor = db.jobs.find(
            {"_id": {"$in": top_ids}},
            {"role.title": 1, "company.name": 1, "location.city": 1},
        )
        jobs_map = {doc["_id"]: doc async for doc in jobs_cursor}

        similar = []
        for jid in top_ids:
            j = jobs_map.get(jid)
            if not j:
                continue
            similar.append({
                "job_id": jid,
                "title": j.get("role", {}).get("title", ""),
                "company": j.get("company", {}).get("name", ""),
                "city": j.get("location", {}).get("city", ""),
                "match_score": hits_by_id[jid],
            })
        result = {"similar_jobs": similar}

    # Cache for 1 hour
    if redis:
        try:
            await redis.set(cache_key, json.dumps(result), ex=3600)
        except Exception:
            pass

    return result
