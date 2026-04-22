import asyncio
import json
import time
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from app.db.supabase_client import get_supabase, run_supabase
from app.db.zilliz_client import get_zilliz
from app.db.redis_client import get_redis
from app.ingestion.resume_parser import parse_resume, async_parse_resume
from app.ingestion.embedder import embed_text, async_embed_text
from app.config import settings
from app.api.deps import get_current_user

from datetime import datetime, timezone

logger = logging.getLogger("sviam.profile")
router = APIRouter(prefix="/profile", tags=["profile"])


def _get_user(authorization: str):
    """Verify JWT — delegates to shared auth dependency."""
    return get_current_user(authorization)


@router.get("/full")
async def get_full_profile(authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()
    result = await run_supabase(lambda: supabase.table("profiles").select("*").eq("user_id", user.id).single().execute())
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = result.data
    uid = user.id

    # Fetch counts in parallel
    apps_task = run_supabase(lambda: supabase.table("applications").select("id", count="exact").eq("user_id", uid).execute())
    saved_task = run_supabase(lambda: supabase.table("saved_jobs").select("id", count="exact").eq("user_id", uid).execute())
    resumes_task = run_supabase(lambda: supabase.table("user_resumes").select("id", count="exact").eq("user_id", uid).execute())
    apps_result, saved_result, resumes_result = await asyncio.gather(apps_task, saved_task, resumes_task)

    return {
        "profile": profile,
        "stats": {
            "applications_count": apps_result.count if apps_result.count is not None else len(apps_result.data or []),
            "saved_jobs_count": saved_result.count if saved_result.count is not None else len(saved_result.data or []),
            "resumes_count": resumes_result.count if resumes_result.count is not None else len(resumes_result.data or []),
        },
    }


@router.get("/sviam-score")
async def sviam_score(authorization: str = Header(None)):
    user = _get_user(authorization)
    uid = user.id

    # Check Redis cache first
    redis = get_redis()
    cache_key = f"sviam_score:{uid}"
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    supabase = get_supabase()

    # Fetch profile, resume, applications in parallel
    profile_task = run_supabase(
        lambda: supabase.table("profiles").select("*").eq("user_id", uid).single().execute()
    )
    resumes_task = run_supabase(
        lambda: supabase.table("user_resumes")
        .select("resume_text")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    apps_task = run_supabase(
        lambda: supabase.table("applications").select("*").eq("user_id", uid).execute()
    )
    profile_result, resumes_result, apps_result = await asyncio.gather(
        profile_task, resumes_task, apps_task
    )

    profile = profile_result.data or {}
    apps = apps_result.data or []
    resume_rows = resumes_result.data or []
    resume_text = resume_rows[0].get("resume_text", "") if resume_rows else (profile.get("resume_text") or "")

    tips: list[str] = []

    # ── Profile completeness (0-25) ──
    profile_score = 0
    prefs = profile.get("job_preferences") or {}
    ats_profile = prefs.get("ats_profile") or {}

    if profile.get("name"):
        profile_score += 5
    else:
        tips.append("Add your full name to your profile")
    if profile.get("city"):
        profile_score += 5
    else:
        tips.append("Set your city for better job matches")
    if profile.get("experience_level"):
        profile_score += 5
    else:
        tips.append("Set your experience level")
    if profile.get("resume_url") or resume_text:
        profile_score += 5
    else:
        tips.append("Upload your resume")
    # LinkedIn or GitHub
    has_links = bool(ats_profile.get("linkedin") or ats_profile.get("github"))
    if has_links:
        profile_score += 5
    else:
        tips.append("Add your LinkedIn or GitHub URL")

    # ── Resume quality (0-25) ──
    resume_score = 0
    if resume_text:
        import re as _re
        word_count = len(resume_text.split())
        if word_count > 300:
            resume_score += 7
        elif word_count > 100:
            resume_score += 4
        else:
            tips.append("Your resume is too short — aim for 300+ words")

        # Quantified bullets
        if _re.search(r'\d+%|\d+x|\$\d+', resume_text):
            resume_score += 6
        else:
            tips.append("Add quantified achievements to your resume (e.g., 'grew revenue 30%')")

        # Proper sections
        lines = [line.strip().lower().rstrip(":") for line in resume_text.split("\n")]
        section_headers = {"experience", "education", "skills", "projects", "summary"}
        found = sum(1 for h in section_headers if h in lines)
        if found >= 3:
            resume_score += 6
        elif found >= 1:
            resume_score += 3
        else:
            tips.append("Add standard resume sections (Experience, Education, Skills)")

        # Skills listed
        if "skills" in resume_text.lower():
            resume_score += 6
        else:
            resume_score += 2
    else:
        tips.append("Upload a resume to improve your score")

    # ── Activity (0-25) ──
    activity_score = 0
    now = datetime.now(timezone.utc)
    recent_apps = [
        a for a in apps
        if a.get("created_at") and _is_within_days(a["created_at"], now, 30)
    ]
    recent_count = len(recent_apps)
    if recent_count >= 5:
        activity_score = 25
    elif recent_count >= 3:
        activity_score = 18
    elif recent_count >= 1:
        activity_score = 10
    else:
        tips.append("Apply to more jobs — aim for 5+ applications per month")

    # ── Outcomes (0-25) ──
    outcomes_score = 0
    total_apps = len(apps)
    if total_apps > 0:
        apps_with_outcome = [a for a in apps if a.get("outcome")]
        response_rate = len(apps_with_outcome) / total_apps if total_apps else 0
        outcomes_score += round(response_rate * 20)

        hired_count = sum(1 for a in apps_with_outcome if a.get("outcome") == "hired")
        if hired_count > 0:
            outcomes_score += 5

    outcomes_score = min(25, outcomes_score)

    total = profile_score + resume_score + activity_score + outcomes_score
    total = min(100, max(0, total))

    result = {
        "score": total,
        "breakdown": {
            "profile": profile_score,
            "resume": resume_score,
            "activity": activity_score,
            "outcomes": outcomes_score,
        },
        "tips": tips[:5],
    }

    # Cache for 1 hour
    if redis:
        try:
            await redis.set(cache_key, json.dumps(result), ex=3600)
        except Exception:
            pass

    return result


def _is_within_days(date_str: str, now: datetime, days: int) -> bool:
    """Check if a date string is within N days of now."""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return (now - dt).total_seconds() < days * 86400
    except (ValueError, TypeError):
        return False


@router.get("/me")
async def get_profile(authorization: str = Header(None)):
    t_start = time.perf_counter()
    user = _get_user(authorization)
    t_auth = time.perf_counter()

    supabase = get_supabase()
    result = await run_supabase(lambda: supabase.table("profiles").select("*").eq("user_id", user.id).single().execute())
    t_query = time.perf_counter()

    logger.info(f"[PERF] /profile/me — auth: {t_auth - t_start:.3f}s, query: {t_query - t_auth:.3f}s, total: {t_query - t_start:.3f}s")

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


@router.get("/public/{slug}")
async def get_public_profile(slug: str):
    if not slug or not slug.strip():
        raise HTTPException(status_code=400, detail="Slug is required")
    supabase = get_supabase()
    # Filter server-side using JSONB containment
    result = await run_supabase(lambda: supabase.table("profiles").select("name, city, experience_level, job_preferences").filter("job_preferences->>public_slug", "eq", slug).execute())
    profiles = result.data or []
    if not profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profiles[0]
    prefs = profile.get("job_preferences") or {}
    ats = prefs.get("ats_profile") or {}
    return {
                "name": profile.get("name", ""),
                "city": profile.get("city", ""),
                "experience_level": profile.get("experience_level", ""),
                "linkedin": ats.get("linkedin", ""),
                "github": ats.get("github", ""),
                "portfolio": ats.get("portfolio", ""),
                "skills": prefs.get("skills", []),
                "target_roles": prefs.get("target_roles", []),
                "work_mode": prefs.get("work_mode", ""),
            }


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    experience_level: Optional[str] = None
    job_preferences: Optional[dict] = None
    user_type: Optional[str] = None  # "seeker" or "hirer" — set once at registration


@router.delete("/me")
async def delete_account(authorization: str = Header(None)):
    user = _get_user(authorization)
    uid = user.id
    supabase = get_supabase()

    # 1-3: Delete user data in parallel
    async def _safe_delete(table: str):
        try:
            await run_supabase(lambda: supabase.table(table).delete().eq("user_id", uid).execute())
        except Exception as e:
            logger.warning(f"Failed to delete {table} for {uid}: {e}")

    await asyncio.gather(
        _safe_delete("applications"),
        _safe_delete("saved_jobs"),
        _safe_delete("user_resumes"),
    )

    # 4: profiles (depends on above being done)
    try:
        await run_supabase(lambda: supabase.table("profiles").delete().eq("user_id", uid).execute())
    except Exception as e:
        logger.warning(f"Failed to delete profiles for {uid}: {e}")

    # 5-7: Clean up external resources in parallel
    async def _delete_storage():
        try:
            files = await run_supabase(lambda: supabase.storage.from_("resumes").list(uid))
            if files:
                paths = [f"{uid}/{f['name']}" for f in files]
                await run_supabase(lambda: supabase.storage.from_("resumes").remove(paths))
        except Exception as e:
            logger.warning(f"Failed to delete storage files for {uid}: {e}")

    async def _delete_zilliz_vectors():
        try:
            zilliz = get_zilliz()
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: zilliz.delete(
                    collection_name=settings.zilliz_collection,
                    filter=f'job_id == "user_{uid}"',
                ),
            )
        except Exception as e:
            logger.warning(f"Failed to delete Zilliz vectors for {uid}: {e}")

    async def _delete_redis_cache():
        try:
            redis = get_redis()
            if redis:
                await redis.delete(f"resume_embedding:{uid}:default")
                await redis.delete(f"tier:{uid}")
        except Exception as e:
            logger.warning(f"Failed to delete Redis cache for {uid}: {e}")

    await asyncio.gather(
        _delete_storage(),
        _delete_zilliz_vectors(),
        _delete_redis_cache(),
    )

    # 8: Auth user (last)
    try:
        await run_supabase(lambda: supabase.auth.admin.delete_user(uid))
    except Exception as e:
        logger.warning(f"Failed to delete auth user {uid}: {e}")

    return {"message": "Account deleted"}


@router.post("/me")
async def upsert_profile(body: ProfileUpdate, authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()

    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await run_supabase(lambda: supabase.table("profiles").update(data).eq("user_id", user.id).execute())
    return result.data[0] if result.data else data


@router.post("/resume")
async def upload_resume(
    resume: UploadFile = File(...),
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    supabase = get_supabase()

    # Upload to Supabase Storage
    storage_path = f"{user.id}/resume.pdf"
    await run_supabase(lambda: supabase.storage.from_("resumes").upload(
        storage_path,
        pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    ))

    # Parse resume text (non-blocking)
    parsed = await async_parse_resume(pdf_bytes)
    resume_text = parsed["raw_text"]

    # Embed resume text using structured input (same logic as match endpoint)
    vector = None
    if parsed["char_count"] >= 100:
        from app.api.routes.match import build_embedding_input
        embedding_input = build_embedding_input(resume_text)
        vector = await async_embed_text(embedding_input)

    # Store embedding in Zilliz
    inserted_ids = []
    if vector:
        zilliz = get_zilliz()
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: zilliz.insert(
                collection_name=settings.zilliz_collection,
                data=[{"vector": vector, "job_id": f"user_{user.id}"}],
            ),
        )
        inserted_ids = result.get("ids", []) if isinstance(result, dict) else list(result.primary_keys)

    # Cache embedding in Redis for fast match requests (7 day TTL)
    user_id = user.id
    if vector:
        redis = get_redis()
        if redis:
            try:
                cache_key = f"resume_embedding:{user_id}:default"
                await redis.set(cache_key, json.dumps(vector), ex=7 * 24 * 3600)
                logger.info(f"Resume embedding cached for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to cache embedding: {e}")

    # Update profile
    profile_data = {
        "resume_url": storage_path,
        "resume_text": resume_text,
    }
    if inserted_ids:
        profile_data["resume_milvus_id"] = int(inserted_ids[0])
    await run_supabase(lambda: supabase.table("profiles").update(profile_data).eq("user_id", user_id).execute())

    return {
        "message": "Resume uploaded",
        "resume_url": storage_path,
        "char_count": parsed["char_count"],
    }
