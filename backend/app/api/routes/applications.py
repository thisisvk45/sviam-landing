from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.db.supabase_client import get_supabase, run_supabase
from app.db.mongo import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])

VALID_STATUSES = {"queued", "applied", "interview", "offer", "rejected"}
VALID_OUTCOMES = {"hired", "rejected_resume", "rejected_interview", "ghosted", "withdrew", "offer_declined"}


def _get_user(authorization: str):
    return get_current_user(authorization)


class ApplicationCreate(BaseModel):
    job_id: str
    title: str
    company: str
    city: str = ""
    apply_url: str = ""
    resume_id: Optional[str] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_id: Optional[str] = None


@router.get("")
async def list_applications(
    status: Optional[str] = None,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    supabase = get_supabase()
    query = supabase.table("applications").select("*").eq("user_id", user.id).order("created_at", desc=True)
    if status and status in VALID_STATUSES:
        query = query.eq("status", status)
    result = await run_supabase(lambda: query.execute())
    return {"applications": result.data or []}


@router.post("")
async def create_application(
    body: ApplicationCreate,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    if not body.job_id.strip() or not body.title.strip():
        raise HTTPException(status_code=400, detail="job_id and title are required")
    supabase = get_supabase()
    data = {
        "user_id": user.id,
        "job_id": body.job_id.strip(),
        "title": body.title,
        "company": body.company,
        "city": body.city,
        "apply_url": body.apply_url,
        "status": "queued",
    }
    if body.resume_id:
        data["resume_id"] = body.resume_id
    if body.notes:
        data["notes"] = body.notes
    try:
        result = await run_supabase(lambda: supabase.table("applications").insert(data).execute())
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Job already in your pipeline")
        raise HTTPException(status_code=500, detail="Failed to create application")
    return result.data[0] if result.data else data


@router.patch("/{app_id}")
async def update_application(
    app_id: str,
    body: ApplicationUpdate,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    supabase = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
    result = await run_supabase(
        lambda: supabase.table("applications")
        .update(updates)
        .eq("id", app_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return result.data[0]


@router.delete("/{app_id}")
async def delete_application(
    app_id: str,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    supabase = get_supabase()
    result = await run_supabase(
        lambda: supabase.table("applications")
        .delete()
        .eq("id", app_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application removed"}


class OutcomeUpdate(BaseModel):
    outcome: str
    salary_offered: Optional[int] = None
    feedback: Optional[str] = None
    outcome_date: Optional[str] = None


@router.patch("/{app_id}/outcome")
async def update_outcome(
    app_id: str,
    body: OutcomeUpdate,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    if body.outcome not in VALID_OUTCOMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid outcome. Must be one of: {', '.join(VALID_OUTCOMES)}",
        )

    supabase = get_supabase()
    updates: dict = {"outcome": body.outcome}
    if body.salary_offered is not None:
        updates["salary_offered"] = body.salary_offered
    if body.feedback is not None:
        updates["feedback"] = body.feedback
    updates["outcome_date"] = body.outcome_date or datetime.now(timezone.utc).isoformat()

    result = await run_supabase(
        lambda: supabase.table("applications")
        .update(updates)
        .eq("id", app_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return result.data[0]


@router.get("/stats")
async def application_stats(authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()

    result = await run_supabase(
        lambda: supabase.table("applications")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )
    apps = result.data or []
    total = len(apps)

    by_status: dict[str, int] = {}
    by_outcome: dict[str, int] = {}
    response_count = 0
    days_to_response: list[float] = []

    for app in apps:
        status = app.get("status", "unknown")
        by_status[status] = by_status.get(status, 0) + 1

        outcome = app.get("outcome")
        if outcome:
            by_outcome[outcome] = by_outcome.get(outcome, 0) + 1
            response_count += 1

            # Calculate days to response
            created = app.get("created_at")
            outcome_dt = app.get("outcome_date")
            if created and outcome_dt:
                try:
                    t_created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    t_outcome = datetime.fromisoformat(outcome_dt.replace("Z", "+00:00"))
                    days = (t_outcome - t_created).total_seconds() / 86400
                    if days >= 0:
                        days_to_response.append(days)
                except (ValueError, TypeError):
                    pass

    response_rate = round(response_count / total, 3) if total > 0 else 0.0
    avg_days = round(sum(days_to_response) / len(days_to_response), 1) if days_to_response else 0.0

    return {
        "total": total,
        "by_status": by_status,
        "by_outcome": by_outcome,
        "response_rate": response_rate,
        "avg_days_to_response": avg_days,
    }


class FromApplyRequest(BaseModel):
    job_id: str


@router.post("/from-apply")
async def create_from_apply(
    body: FromApplyRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    db = get_db()
    job = await db.jobs.find_one({"_id": body.job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    title = job.get("role", {}).get("title", "")
    company = job.get("company", {}).get("name", "")
    city = job.get("location", {}).get("city", "")
    apply_url = job.get("apply_url", "")

    supabase = get_supabase()
    data = {
        "user_id": user.id,
        "job_id": body.job_id.strip(),
        "title": title,
        "company": company,
        "city": city,
        "apply_url": apply_url,
        "status": "applied",
    }
    try:
        result = await run_supabase(lambda: supabase.table("applications").upsert(
            data, on_conflict="user_id,job_id"
        ).execute())
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create application")
    return result.data[0] if result.data else data
