"""Ingestion pipeline — upsert-based with change detection and job lifecycle management."""
from __future__ import annotations

import asyncio
import json
import traceback
import httpx
from datetime import datetime, timezone
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from app.db.mongo import get_db
from app.db.redis_client import get_redis
from app.ingestion.change_detect import (
    get_cached_etag,
    get_cached_hash,
    store_etag_and_hash,
    check_content_changed,
)
from app.ingestion.freshness import compute_freshness
from app.ingestion.utils import compute_content_hash

# How many consecutive absences before deactivating a job
MISSING_THRESHOLD = 3


async def ingest_company(company: dict, shared_client: httpx.AsyncClient | None = None) -> dict:
    """Crawl a single company and upsert jobs. Handles change detection and lifecycle."""
    ats = company.get("ats_type")
    name = company.get("name", "unknown")
    company_id = company["_id"]

    # --- Change detection: load cached ETag + hash ---
    last_etag = await get_cached_etag(company_id)
    last_hash = await get_cached_hash(company_id)

    jobs: list[dict] = []
    new_etag: str | None = None
    response_body: str | None = None

    try:
        if ats == "greenhouse":
            from app.ingestion.sources.greenhouse import crawl_greenhouse
            jobs, new_etag, response_body = await crawl_greenhouse(company, shared_client, last_etag)
        elif ats == "lever":
            from app.ingestion.sources.lever import crawl_lever
            jobs, new_etag, response_body = await crawl_lever(company, shared_client, last_etag)
        elif ats == "darwinbox":
            from app.ingestion.sources.darwinbox import crawl_darwinbox
            jobs, new_etag, response_body = await crawl_darwinbox(company, shared_client, last_etag)
        elif ats == "ashby":
            from app.ingestion.sources.ashby import crawl_ashby
            jobs, new_etag, response_body = await crawl_ashby(company, shared_client, last_etag)
        elif ats == "adzuna":
            from app.ingestion.sources.adzuna import crawl_adzuna
            from app.config import settings
            raw_jobs = await crawl_adzuna(settings.adzuna_app_id, settings.adzuna_app_key)
            jobs, new_etag, response_body = raw_jobs, None, None
        elif ats == "serpapi":
            from app.ingestion.sources.serpapi_jobs import crawl_serpapi
            from app.config import settings
            raw_jobs = await crawl_serpapi(settings.serpapi_key)
            jobs, new_etag, response_body = raw_jobs, None, None
        else:
            print(f"[CRAWL] No crawler for ATS type '{ats}' — skipping {name}")
            return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": False, "error": None}
    except Exception as e:
        print(f"[CRAWL] Crawler failed for {name} ({ats}): {type(e).__name__}: {e}")
        traceback.print_exc()
        return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": False, "error": str(type(e).__name__)}

    # --- 304 Not Modified: adapter returned empty on ETag match ---
    if not jobs and not response_body:
        # Could be a genuine 304 or just no jobs. If we had an etag, treat as not-modified.
        if last_etag or last_hash:
            db = get_db()
            await db.companies.update_one(
                {"_id": company_id},
                {"$set": {"last_crawled": datetime.now(timezone.utc)}},
            )
            return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": True, "error": None}
        return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": False, "error": None}

    # --- Content hash check (for sources that don't support ETag) ---
    if response_body and not new_etag:
        changed, content_hash = check_content_changed(response_body, last_hash)
        if not changed:
            print(f"[CRAWL] {name}: content hash unchanged, skipping processing")
            db = get_db()
            await db.companies.update_one(
                {"_id": company_id},
                {"$set": {"last_crawled": datetime.now(timezone.utc)}},
            )
            return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": True, "error": None}
        await store_etag_and_hash(company_id, None, content_hash)
    elif new_etag:
        content_hash = compute_content_hash(response_body) if response_body else None
        await store_etag_and_hash(company_id, new_etag, content_hash)

    if not jobs:
        return {"company": name, "new": 0, "updated": 0, "deactivated": 0, "skipped_304": False, "error": None}

    db = get_db()
    now = datetime.now(timezone.utc)

    # --- Upsert jobs via bulk_write ---
    crawled_ids = set()
    operations = []
    for job in jobs:
        job_id = job["_id"]
        crawled_ids.add(job_id)

        # Compute content hash for individual job change detection
        jd_hash = compute_content_hash(job.get("raw_jd", "") + job.get("role", {}).get("title", ""))

        operations.append(
            UpdateOne(
                {"_id": job_id},
                {
                    "$set": {
                        "source": job["source"],
                        "source_url": job["source_url"],
                        "apply_url": job["apply_url"],
                        "ats_type": job.get("ats_type"),
                        "company": job["company"],
                        "role": job["role"],
                        "location": job["location"],
                        "requirements": job["requirements"],
                        "compensation": job["compensation"],
                        "raw_jd": job["raw_jd"],
                        "posted_at": job["posted_at"],
                        "expires_at": job["expires_at"],
                        "scraped_at": now,
                        "updated_at": now,
                        "is_active": True,
                        "freshness_score": job.get("freshness_score", compute_freshness(job["posted_at"], now)),
                        "content_hash": jd_hash,
                        "consecutive_missing": 0,
                    },
                    "$setOnInsert": {
                        "first_seen_at": now,
                        "milvus_id": None,
                    },
                },
                upsert=True,
            )
        )

    new_count = 0
    updated_count = 0
    if operations:
        try:
            result = await db.jobs.bulk_write(operations, ordered=False)
            new_count = result.upserted_count
            updated_count = result.modified_count
        except BulkWriteError as bwe:
            new_count = bwe.details.get("nUpserted", 0)
            updated_count = bwe.details.get("nModified", 0)
            print(f"[CRAWL] Bulk write partial error for {name}: {bwe.details.get('writeErrors', [])[:3]}")
        except Exception as e:
            print(f"[CRAWL] Bulk write error for {name}: {e}")

    # --- Job lifecycle: mark missing jobs ---
    # Only for ATS-based companies (not aggregator sources like adzuna/serpapi)
    deactivated = 0
    if ats in ("greenhouse", "lever", "ashby", "darwinbox", "workday", "smartrecruiters"):
        # Find active jobs for this company that were NOT in this crawl
        missing_filter = {
            "company.name": company["name"],
            "is_active": True,
            "_id": {"$nin": list(crawled_ids)},
        }
        # Increment consecutive_missing counter
        await db.jobs.update_many(
            missing_filter,
            {"$inc": {"consecutive_missing": 1}, "$set": {"updated_at": now}},
        )
        # Deactivate jobs that have been missing for MISSING_THRESHOLD consecutive crawls
        deactivate_result = await db.jobs.update_many(
            {
                "company.name": company["name"],
                "is_active": True,
                "consecutive_missing": {"$gte": MISSING_THRESHOLD},
            },
            {"$set": {"is_active": False, "deactivated_at": now, "updated_at": now}},
        )
        deactivated = deactivate_result.modified_count
        if deactivated:
            print(f"[CRAWL] {name}: deactivated {deactivated} jobs (missing {MISSING_THRESHOLD}+ crawls)")

    # Update company record
    await db.companies.update_one(
        {"_id": company_id},
        {
            "$set": {"last_crawled": now},
            "$inc": {"total_jobs_indexed": new_count},
        },
    )

    return {
        "company": name,
        "new": new_count,
        "updated": updated_count,
        "deactivated": deactivated,
        "skipped_304": False,
        "error": None,
    }


async def run_all(companies: list[dict] | None = None):
    """Run ingestion for given companies, or all active companies if None."""
    db = get_db()
    if companies is None:
        companies = await db.companies.find({"active": True}).to_list(None)

    print(f"[CRAWL] Running ingestion for {len(companies)} companies\n")

    # Shared HTTP client with connection pooling
    async with httpx.AsyncClient(
        timeout=30,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    ) as shared_client:
        sem = asyncio.Semaphore(8)

        async def crawl_with_sem(company: dict) -> dict:
            async with sem:
                result = await ingest_company(company, shared_client)
                if result.get("skipped_304"):
                    print(f"[CRAWL] {result['company']}: skipped (304/hash unchanged)")
                else:
                    status = f"+{result['new']} new, {result['updated']} updated"
                    if result.get("deactivated"):
                        status += f", -{result['deactivated']} deactivated"
                    if result.get("error"):
                        status += f" (ERROR: {result['error']})"
                    print(f"[CRAWL] {result['company']}: {status}")
                return result

        results = await asyncio.gather(
            *[crawl_with_sem(c) for c in companies],
            return_exceptions=True,
        )

    valid_results = [r for r in results if isinstance(r, dict)]
    total_new = sum(r["new"] for r in valid_results)
    total_updated = sum(r["updated"] for r in valid_results)
    total_deactivated = sum(r.get("deactivated", 0) for r in valid_results)
    skipped_304 = sum(1 for r in valid_results if r.get("skipped_304"))
    failed = sum(1 for r in results if not isinstance(r, dict) or r.get("error"))

    print(f"\n[CRAWL] Done. +{total_new} new, {total_updated} updated, -{total_deactivated} deactivated, {skipped_304} skipped (304), {failed} failed")

    # Update crawl status in Redis
    redis = get_redis()
    if redis:
        await redis.set("crawl:running", "", ex=1)
        await redis.set("crawl:last_result", json.dumps({
            "total_new": total_new,
            "total_updated": total_updated,
            "total_deactivated": total_deactivated,
            "skipped_304": skipped_304,
            "companies": len(valid_results),
            "failed": failed,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }), ex=86400)

    return valid_results


async def insert_jobs_bulk(jobs: list[dict], source_name: str) -> tuple[int, int]:
    """Insert jobs with deduplication. Returns (inserted, skipped)."""
    db = get_db()
    if not jobs:
        return 0, 0

    from pymongo.errors import BulkWriteError, DuplicateKeyError

    now = datetime.now(timezone.utc)
    operations = []
    for job in jobs:
        operations.append(
            UpdateOne(
                {"_id": job["_id"]},
                {
                    "$set": {
                        "source": job["source"],
                        "source_url": job["source_url"],
                        "apply_url": job["apply_url"],
                        "ats_type": job.get("ats_type"),
                        "company": job["company"],
                        "role": job["role"],
                        "location": job["location"],
                        "requirements": job["requirements"],
                        "compensation": job["compensation"],
                        "raw_jd": job["raw_jd"],
                        "posted_at": job["posted_at"],
                        "expires_at": job["expires_at"],
                        "scraped_at": now,
                        "updated_at": now,
                        "is_active": True,
                        "freshness_score": job.get("freshness_score", compute_freshness(job["posted_at"], now)),
                        "consecutive_missing": 0,
                    },
                    "$setOnInsert": {
                        "first_seen_at": now,
                        "milvus_id": None,
                    },
                },
                upsert=True,
            )
        )

    inserted = 0
    updated = 0
    # Process in batches of 500
    batch_size = 500
    for i in range(0, len(operations), batch_size):
        batch = operations[i:i + batch_size]
        try:
            result = await db.jobs.bulk_write(batch, ordered=False)
            inserted += result.upserted_count
            updated += result.modified_count
        except BulkWriteError as bwe:
            inserted += bwe.details.get("nUpserted", 0)
            updated += bwe.details.get("nModified", 0)
        except Exception as e:
            print(f"[PIPELINE] Bulk write error for {source_name}: {e}")

    return inserted, updated


async def embed_new_jobs(limit: int = 5000) -> int:
    """Embed jobs that don't have milvus_id yet. Returns count embedded."""
    db = get_db()
    from app.ingestion.embedder import async_embed_text
    from app.db.zilliz_client import get_zilliz
    from app.config import settings

    new_jobs = await db.jobs.find(
        {"milvus_id": None, "is_active": True},
        {"_id": 1, "role": 1, "company": 1, "location": 1, "raw_jd": 1},
    ).to_list(length=limit)

    if not new_jobs:
        return 0

    print(f"[EMBED] Embedding {len(new_jobs)} new jobs...")
    zilliz = get_zilliz()
    embedded_count = 0
    batch_size = 50

    for i in range(0, len(new_jobs), batch_size):
        batch = new_jobs[i:i + batch_size]
        vectors = []
        job_ids = []

        for job in batch:
            # Build embedding text from key fields
            title = job.get("role", {}).get("title", "")
            company = job.get("company", {}).get("name", "")
            city = job.get("location", {}).get("city", "")
            jd = (job.get("raw_jd", "") or "")[:1000]  # Limit JD length for embedding
            embed_text = f"{title} at {company} in {city}. {jd}"

            try:
                vector = await async_embed_text(embed_text)
                vectors.append(vector)
                job_ids.append(job["_id"])
            except Exception as e:
                print(f"[EMBED] Failed to embed {job['_id']}: {e}")
                continue

        if vectors:
            try:
                # Insert into Zilliz
                data = [
                    {"job_id": jid, "vector": vec}
                    for jid, vec in zip(job_ids, vectors)
                ]
                insert_result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda d=data: zilliz.insert(
                        collection_name=settings.zilliz_collection,
                        data=d,
                    ),
                )

                # Update MongoDB with milvus_ids
                ids = insert_result.get("ids", []) if isinstance(insert_result, dict) else []
                if ids:
                    for idx, jid in enumerate(job_ids[:len(ids)]):
                        await db.jobs.update_one(
                            {"_id": jid},
                            {"$set": {"milvus_id": str(ids[idx])}},
                        )
                else:
                    # Some Zilliz versions return differently — mark as embedded anyway
                    for jid in job_ids:
                        await db.jobs.update_one(
                            {"_id": jid},
                            {"$set": {"milvus_id": f"emb_{jid[:8]}"}},
                        )

                embedded_count += len(vectors)
            except Exception as e:
                print(f"[EMBED] Zilliz insert failed for batch: {e}")
                # Still mark as embedded to avoid retrying endlessly
                for jid in job_ids:
                    await db.jobs.update_one(
                        {"_id": jid},
                        {"$set": {"milvus_id": f"err_{jid[:8]}"}},
                    )

        if (i + batch_size) % 200 == 0:
            print(f"[EMBED] Progress: {min(i + batch_size, len(new_jobs))}/{len(new_jobs)}")

    print(f"[EMBED] Done. Embedded {embedded_count} jobs.")
    return embedded_count


async def run_aggregator_pipeline() -> dict:
    """Run all aggregator-style crawlers (non-ATS) and bulk insert results."""
    from app.config import settings

    results = {}

    # Define aggregator sources
    sources = []

    # SerpApi — only if key is configured
    if settings.serpapi_key:
        from app.ingestion.sources.serpapi_jobs import crawl_serpapi
        sources.append(("serpapi", lambda: crawl_serpapi(settings.serpapi_key)))

    # Greenhouse India — free public APIs
    from app.ingestion.sources.greenhouse_india import crawl_greenhouse_india
    sources.append(("greenhouse_india", crawl_greenhouse_india))

    # Lever India — free public APIs
    from app.ingestion.sources.lever_india import crawl_lever_india
    sources.append(("lever_india", crawl_lever_india))

    # Hirist and IIMJobs are JS-rendered SPAs — need headless browser
    # Skipped until Playwright/Apify integration is added
    # from app.ingestion.sources.hirist import crawl_hirist
    # sources.append(("hirist", crawl_hirist))
    # from app.ingestion.sources.iimjobs import crawl_iimjobs
    # sources.append(("iimjobs", crawl_iimjobs))

    # Adzuna — only if keys are configured
    if settings.adzuna_app_id and settings.adzuna_app_key:
        from app.ingestion.sources.adzuna import crawl_adzuna
        sources.append(("adzuna", lambda: crawl_adzuna(settings.adzuna_app_id, settings.adzuna_app_key)))

    total_inserted = 0
    total_updated = 0

    for source_name, crawl_fn in sources:
        try:
            print(f"\n[PIPELINE] Starting {source_name}...")
            jobs = await crawl_fn()
            inserted, updated = await insert_jobs_bulk(jobs, source_name)
            results[source_name] = {
                "fetched": len(jobs),
                "inserted": inserted,
                "updated": updated,
            }
            total_inserted += inserted
            total_updated += updated
            print(f"[PIPELINE] {source_name}: {len(jobs)} fetched, {inserted} new, {updated} updated")
        except Exception as e:
            print(f"[PIPELINE] {source_name} FAILED: {e}")
            import traceback
            traceback.print_exc()
            results[source_name] = {"error": str(e)}

    # Embed new jobs
    embedded = 0
    try:
        embedded = await embed_new_jobs()
    except Exception as e:
        print(f"[PIPELINE] Embedding failed: {e}")

    db = get_db()
    total_active = await db.jobs.count_documents({"is_active": True})

    results["summary"] = {
        "total_inserted": total_inserted,
        "total_updated": total_updated,
        "embedded": embedded,
        "total_active_jobs": total_active,
    }

    # Store in Redis
    redis = get_redis()
    if redis:
        await redis.set("pipeline:last_result", json.dumps({
            **results,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }, default=str), ex=86400)

    return results
