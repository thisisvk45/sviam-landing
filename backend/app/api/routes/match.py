import asyncio
import hashlib
import json
import re
import time
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, HTTPException, Header, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from openai import OpenAI
from app.ingestion.resume_parser import parse_resume, async_parse_resume
from app.ingestion.embedder import embed_text, async_embed_text
from app.db.zilliz_client import get_zilliz, async_search_zilliz
from app.db.mongo import get_db
from app.db.redis_client import get_redis
from app.db.supabase_client import run_supabase
from app.config import settings
from app.middleware.usage_limits import check_usage, increment_usage, raise_limit_exceeded

logger = logging.getLogger("sviam.match")

router = APIRouter(prefix="/match", tags=["match"])

# Embedding cache TTL: 7 days
_EMBEDDING_CACHE_TTL = 7 * 24 * 3600


def build_embedding_input(resume_text: str) -> str:
    """Build a structured embedding input from resume text.

    Instead of raw text, extract the high-signal parts: header, summary,
    and first role — typically the first ~50 lines. Shorter input = faster
    embedding + better signal-to-noise for vector search.
    """
    lines = resume_text.split("\n")
    # First 50 non-empty lines usually contain name, summary, skills, first role
    meaningful_lines = [l for l in lines[:60] if l.strip()][:50]
    structured = "\n".join(meaningful_lines)
    return structured[:1000]


_ACTION_VERBS = {
    "achieved", "built", "created", "delivered", "designed", "developed",
    "drove", "enabled", "engineered", "executed", "grew", "implemented",
    "improved", "increased", "launched", "led", "managed", "optimized",
    "orchestrated", "reduced", "scaled", "shipped", "spearheaded", "streamlined",
}

_SECTION_HEADERS = {
    "experience", "education", "skills", "projects", "summary",
    "work experience", "professional experience", "technical skills",
    "certifications", "awards", "publications",
}

_STRICT_ATS_PARSERS = {"greenhouse", "lever", "icims", "taleo", "workday"}


def compute_ats_score(resume_text: str, job: dict) -> dict:
    """Compute ATS compatibility score and actionable tips."""
    resume_lower = resume_text.lower()
    tips: list[str] = []
    score = 0

    # 1. Keyword overlap (0-50)
    skills = job.get("requirements", {}).get("skills", [])
    if skills:
        matched = sum(1 for s in skills if s.lower() in resume_lower)
        keyword_pct = matched / len(skills)
        score += round(keyword_pct * 50)
        missing = [s for s in skills if s.lower() not in resume_lower]
        if missing:
            tips.append(f"Add missing keywords: {', '.join(missing[:5])}")
    else:
        score += 35  # No skills listed, give partial credit

    # 2. Format signals (0-30)
    format_score = 0
    # Quantified bullets
    quant_matches = re.findall(r'\d+%|\d+x|\$\d+', resume_text)
    if quant_matches:
        format_score += 10
    else:
        tips.append("Add quantified achievements (e.g., 'increased revenue by 30%')")

    # Action verbs
    words = set(resume_lower.split())
    verb_count = len(words & _ACTION_VERBS)
    if verb_count >= 3:
        format_score += 10
    elif verb_count >= 1:
        format_score += 5
    else:
        tips.append("Start bullet points with action verbs (led, built, improved)")

    # Section headers
    lines = [line.strip().lower().rstrip(":") for line in resume_text.split("\n")]
    found_sections = sum(1 for h in _SECTION_HEADERS if h in lines)
    if found_sections >= 3:
        format_score += 10
    elif found_sections >= 1:
        format_score += 5
    else:
        tips.append("Use standard section headers (Experience, Education, Skills)")

    score += format_score

    # 3. ATS parser penalty (0-20 penalty)
    ats_type = job.get("ats_type", "").lower() if job.get("ats_type") else ""
    if ats_type in _STRICT_ATS_PARSERS:
        required_sections = {"experience", "education", "skills"}
        missing_sections = required_sections - {l for l in lines}
        if missing_sections:
            penalty = len(missing_sections) * 7
            score = max(0, score - penalty)
            tips.append(f"This job uses {ats_type.title()} ATS — ensure you have: {', '.join(s.title() for s in missing_sections)}")
    else:
        score += 20  # No strict parser, full bonus

    score = min(100, max(0, score))
    return {"ats_score": score, "ats_tips": tips[:3]}


def compute_sub_scores(resume_text: str, job: dict) -> dict:
    """Compute granular sub-scores for a resume-job pair."""
    resume_lower = resume_text.lower()

    # Skill match
    skills = job.get("requirements", {}).get("skills", [])
    if skills:
        matched = sum(1 for s in skills if s.lower() in resume_lower)
        skill_score = round(matched / len(skills) * 100, 1)
    else:
        skill_score = 70.0

    # Experience match
    level = job.get("role", {}).get("level", "")
    if level:
        level_map = {"entry": 1, "junior": 2, "mid": 3, "senior": 4, "staff": 5, "lead": 6}
        job_level = level_map.get(level.lower(), 3)
        year_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', resume_lower)
        if year_matches:
            max_years = max(int(y) for y in year_matches)
            if max_years <= 1:
                resume_level = 1
            elif max_years <= 3:
                resume_level = 2
            elif max_years <= 5:
                resume_level = 3
            elif max_years <= 8:
                resume_level = 4
            elif max_years <= 12:
                resume_level = 5
            else:
                resume_level = 6
            diff = abs(job_level - resume_level)
            experience_score = max(40.0, round(100 - diff * 20, 1))
        else:
            experience_score = 70.0
    else:
        experience_score = 70.0

    # Location match
    job_city = job.get("location", {}).get("city", "")
    is_remote = job.get("location", {}).get("remote", False)
    if job_city and job_city.lower() in resume_lower:
        location_score = 95.0
    elif is_remote:
        location_score = 90.0
    else:
        location_score = 60.0

    return {
        "skill_match": skill_score,
        "experience_match": experience_score,
        "location_match": location_score,
    }


async def _get_or_compute_embedding(
    resume_text: str, user_id: Optional[str], resume_id: Optional[str], redis
) -> tuple[list[float], str]:
    """Get cached embedding or compute and cache it.

    Returns (vector, source) where source is 'cache' or 'computed'.
    """
    # Try Redis cache first
    cache_key = None
    if user_id:
        cache_key = f"resume_embedding:{user_id}:{resume_id or 'default'}"
    if cache_key and redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                vector = json.loads(cached)
                logger.info("[MATCH] Embedding source: Redis cache")
                return vector, "cache"
        except Exception:
            pass

    # Compute embedding — run in dedicated thread pool
    input_text = build_embedding_input(resume_text)
    vector = await async_embed_text(input_text)

    # Cache for future requests (7 day TTL)
    if cache_key and redis:
        try:
            await redis.set(cache_key, json.dumps(vector), ex=_EMBEDDING_CACHE_TTL)
            logger.info(f"[MATCH] Embedding cached: {cache_key}")
        except Exception:
            pass

    return vector, "computed"


async def _fetch_resume_text(user_id: str, resume_id: Optional[str]) -> Optional[str]:
    """Fetch stored resume text. Tries: specific resume -> latest resume -> profile fallback."""
    from app.db.supabase_client import get_supabase
    supabase = get_supabase()

    if resume_id:
        row = await run_supabase(
            lambda: supabase.table("user_resumes")
            .select("resume_text")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if row.data and row.data.get("resume_text"):
            return row.data["resume_text"]

    # Fallback: latest resume
    rows = await run_supabase(
        lambda: supabase.table("user_resumes")
        .select("resume_text")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if rows.data and rows.data[0].get("resume_text"):
        return rows.data[0]["resume_text"]

    # Fallback: profile
    profile = await run_supabase(
        lambda: supabase.table("profiles")
        .select("resume_text")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if profile.data and profile.data.get("resume_text"):
        return profile.data["resume_text"]

    return None


@router.post("/resume")
async def match_resume(
    request: Request,
    authorization: Optional[str] = Header(None),
    resume_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    remote_only: bool = Query(False),
    min_score: float = Query(0.0),
    limit: int = Query(50),
    offset: int = Query(0),
):
    start = time.perf_counter()
    resume_text = None
    user_id = None

    # ── Step 1: Auth (<1ms with JWT secret) ──────────────────────────────
    if authorization and authorization.startswith("Bearer "):
        from app.api.deps import get_current_user
        try:
            user = get_current_user(authorization)
            user_id = user.id
        except HTTPException:
            pass  # Fall through to anonymous PDF upload

    # ── Step 2: EARLY response cache check (~5ms) ────────────────────────
    redis = get_redis()
    filter_hash = hashlib.md5(f"{city}|{work_type}|{remote_only}|{min_score}|{limit}|{offset}".encode()).hexdigest()[:8]
    if user_id:
        cache_key = f"match:{user_id}:{resume_id or 'default'}:{filter_hash}"
    else:
        cache_key = None  # Can't cache without user_id until we have resume text

    if cache_key and redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                data = json.loads(cached)
                response = JSONResponse(content=data)
                response.headers["X-Cache"] = "HIT"
                response.headers["X-Response-Time"] = f"{(time.perf_counter() - start) * 1000:.0f}ms"
                return response
        except Exception:
            pass

    # ── Step 3: Resume fetch + usage check IN PARALLEL (~80ms) ───────────
    if user_id:
        resume_task = asyncio.create_task(_fetch_resume_text(user_id, resume_id))
        usage_task = asyncio.create_task(check_usage(user_id, "matches"))
        resume_text, usage = await asyncio.gather(resume_task, usage_task)
        if not usage["allowed"]:
            raise_limit_exceeded("matches", usage)

    # If no stored resume, try uploaded PDF
    if not resume_text:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form = await request.form()
            resume_file = form.get("resume")
            if resume_file and hasattr(resume_file, "filename"):
                if not resume_file.filename or not resume_file.filename.lower().endswith(".pdf"):
                    raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
                pdf_bytes = await resume_file.read()
                parsed = await async_parse_resume(pdf_bytes)
                if parsed["char_count"] < 100:
                    raise HTTPException(status_code=400, detail="Could not extract text from PDF")
                resume_text = parsed["raw_text"]

    if not resume_text:
        raise HTTPException(status_code=400, detail="Upload a PDF resume or sign in with a stored resume.")

    # Build anon cache key if we didn't have one earlier
    if not cache_key:
        text_hash = hashlib.sha256(resume_text.encode()).hexdigest()[:32]
        cache_key = f"match:anon:{text_hash}:{filter_hash}"
        # Check cache for anonymous users too
        if redis:
            try:
                cached = await redis.get(cache_key)
                if cached:
                    data = json.loads(cached)
                    response = JSONResponse(content=data)
                    response.headers["X-Cache"] = "HIT"
                    return response
            except Exception:
                pass

    logger.info(f"[MATCH] Step 1-3 (auth + resume + usage): {(time.perf_counter() - start) * 1000:.0f}ms")

    # ── Step 4: Embed resume (cached or computed) ────────────────────────
    t_embed = time.perf_counter()
    vector, embedding_source = await _get_or_compute_embedding(
        resume_text, user_id, resume_id, redis
    )
    embed_ms = (time.perf_counter() - t_embed) * 1000
    logger.info(f"[MATCH] Embedding ({embedding_source}): {embed_ms:.0f}ms")

    # ── Step 5: ANN search (non-blocking) ────────────────────────────────
    t_zilliz = time.perf_counter()
    search_results = await async_search_zilliz(vector, limit=100)
    zilliz_ms = (time.perf_counter() - t_zilliz) * 1000
    logger.info(f"[MATCH] Zilliz search (top 100): {zilliz_ms:.0f}ms")

    # ── Step 6: Batch fetch from MongoDB ─────────────────────────────────
    t_mongo = time.perf_counter()
    db = get_db()
    hits_by_id = {}
    for hit in search_results[0]:
        job_id = hit["entity"]["job_id"]
        if job_id.startswith("user_"):  # SECURITY: Skip user resume vectors
            continue
        similarity = hit["distance"]  # Zilliz COSINE returns similarity (0-1)
        hits_by_id[job_id] = round(similarity * 100, 1)

    projection = {
        "role.title": 1,
        "role.level": 1,
        "company.name": 1,
        "location": 1,
        "requirements.skills": 1,
        "apply_url": 1,
        "posted_at": 1,
        "source": 1,
    }
    jobs_cursor = db.jobs.find(
        {"_id": {"$in": list(hits_by_id.keys())}},
        projection,
    )
    jobs_map = {doc["_id"]: doc async for doc in jobs_cursor}
    mongo_ms = (time.perf_counter() - t_mongo) * 1000
    logger.info(f"[MATCH] MongoDB fetch ({len(hits_by_id)} jobs): {mongo_ms:.0f}ms")

    # ── Step 7: Score + post-filter in Python ────────────────────────────
    t_score = time.perf_counter()
    results = []
    for job_id, match_score in hits_by_id.items():
        job = jobs_map.get(job_id)
        if not job:
            continue

        is_remote = job.get("location", {}).get("remote", False)
        job_work_type = job.get("location", {}).get("work_type", "")
        if not job_work_type:
            job_work_type = "Remote" if is_remote else "Onsite"

        sub_scores = compute_sub_scores(resume_text, job)
        ats = compute_ats_score(resume_text, job)

        results.append({
            "match_score": match_score,
            "sub_scores": sub_scores,
            "ats_score": ats["ats_score"],
            "ats_tips": ats["ats_tips"],
            "job_id": job_id,
            "title": job.get("role", {}).get("title", ""),
            "company": job.get("company", {}).get("name", ""),
            "city": job.get("location", {}).get("city", ""),
            "remote": is_remote,
            "work_type": job_work_type,
            "apply_url": job.get("apply_url", ""),
            "posted_at": job.get("posted_at", "").isoformat() if job.get("posted_at") else None,
            "skills": job.get("requirements", {}).get("skills", []),
            "source": job.get("source", ""),
        })

    # Post-ANN filtering (better recall than pre-filtering in Zilliz)
    if city:
        results = [r for r in results if city.lower() in r["city"].lower() or r["remote"]]
    if work_type:
        results = [r for r in results if r["work_type"].lower() == work_type.lower()]
    if remote_only:
        results = [r for r in results if r["remote"]]
    if min_score > 0:
        results = [r for r in results if r["match_score"] >= min_score]

    # Sort by match score descending, take top results
    results.sort(key=lambda r: r["match_score"], reverse=True)

    score_ms = (time.perf_counter() - t_score) * 1000
    logger.info(f"[MATCH] Scoring + filtering: {score_ms:.0f}ms")

    total = len(results)
    results = results[offset:offset + limit]

    total_ms = (time.perf_counter() - start) * 1000
    logger.info(f"[MATCH] Total: {total_ms:.0f}ms (embed={embed_ms:.0f} zilliz={zilliz_ms:.0f} mongo={mongo_ms:.0f} score={score_ms:.0f})")

    response_data = {
        "jobs_matched": total,
        "results": results,
    }

    # Cache in Redis (30 min TTL) — fire and forget
    if redis:
        asyncio.create_task(redis.set(cache_key, json.dumps(response_data), ex=1800))

    # Increment usage after successful match
    if user_id:
        await increment_usage(user_id, "matches")

    response = JSONResponse(content=response_data)
    response.headers["X-Cache"] = "MISS"
    response.headers["X-Embedding-Source"] = embedding_source
    response.headers["X-Response-Time"] = f"{total_ms:.0f}ms"
    return response


class ExplainRequest(BaseModel):
    job_id: str
    resume_text: str


@router.post("/explain")
async def explain_match(body: ExplainRequest, authorization: str = Header(...)):
    from app.api.deps import get_current_user
    get_current_user(authorization)

    db = get_db()
    job = await db.jobs.find_one({"_id": body.job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check Redis cache
    redis = get_redis()
    cache_key = f"explain:{body.job_id}:{hashlib.sha256(body.resume_text.encode()).hexdigest()[:32]}"

    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    title = job.get("role", {}).get("title", "")
    company = job.get("company", {}).get("name", "")
    skills = job.get("requirements", {}).get("skills", [])

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=settings.openai_api_key)
    loop = asyncio.get_event_loop()
    resp = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a career advisor. Given a job description and resume excerpt, provide a single concise sentence explaining how well the candidate matches this role and why.",
                },
                {
                    "role": "user",
                    "content": f"Job: {title} at {company}\nRequired skills: {', '.join(skills)}\n\nResume excerpt:\n{body.resume_text[:1000]}",
                },
            ],
            max_tokens=150,
        ),
    )

    explanation = resp.choices[0].message.content.strip()
    result = {"explanation": explanation}

    # Cache for 24 hours
    if redis:
        try:
            await redis.set(cache_key, json.dumps(result), ex=86400)
        except Exception:
            pass

    return result


class NegotiationRequest(BaseModel):
    job_id: str
    current_ctc: Optional[int] = None
    expected_ctc: Optional[int] = None
    offer_amount: Optional[int] = None
    experience_years: Optional[int] = None


@router.post("/negotiate")
async def salary_negotiation_coach(
    body: NegotiationRequest,
    authorization: str = Header(...),
):
    from app.api.deps import get_current_user
    user = get_current_user(authorization)

    # Usage gate
    usage = await check_usage(user.id, "negotiate")
    if not usage["allowed"]:
        raise_limit_exceeded("negotiate", usage)

    db = get_db()
    job = await db.jobs.find_one({"_id": body.job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    title = job.get("role", {}).get("title", "")
    company = job.get("company", {}).get("name", "")
    city = job.get("location", {}).get("city", "")
    skills = job.get("requirements", {}).get("skills", [])

    prompt_parts = [
        f"Job: {title} at {company} in {city}",
        f"Required skills: {', '.join(skills)}",
    ]
    if body.current_ctc:
        prompt_parts.append(f"Candidate current CTC: {body.current_ctc}")
    if body.expected_ctc:
        prompt_parts.append(f"Candidate expected CTC: {body.expected_ctc}")
    if body.offer_amount:
        prompt_parts.append(f"Offer received: {body.offer_amount}")
    if body.experience_years:
        prompt_parts.append(f"Years of experience: {body.experience_years}")

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=settings.openai_api_key)
    loop = asyncio.get_event_loop()
    resp = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert salary negotiation coach. Given the job details and candidate info, "
                        "respond with a JSON object (no markdown) with these keys:\n"
                        "- market_range: {min: int, max: int, median: int} (annual salary in same currency)\n"
                        "- talking_points: string[] (3-5 negotiation talking points)\n"
                        "- counter_suggestion: int or null (suggested counter-offer amount)\n"
                        "- risk_level: string ('low', 'medium', or 'high')\n"
                        "- script: string (a 2-3 sentence negotiation script the candidate can use)"
                    ),
                },
                {
                    "role": "user",
                    "content": "\n".join(prompt_parts),
                },
            ],
            max_tokens=500,
        ),
    )

    raw = resp.choices[0].message.content.strip()
    # Parse JSON from response (handle markdown code blocks)
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "market_range": {"min": 0, "max": 0, "median": 0},
            "talking_points": [raw],
            "counter_suggestion": None,
            "risk_level": "medium",
            "script": raw,
        }

    await increment_usage(user.id, "negotiate")
    return result
