import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Query
from app.db.supabase_client import get_supabase, run_supabase
from app.ingestion.resume_parser import parse_resume, async_parse_resume
from app.api.deps import get_current_user

router = APIRouter(prefix="/resumes", tags=["resumes"])

MAX_RESUMES = 3


def _get_user(authorization: str):
    """Verify JWT — delegates to shared auth dependency."""
    return get_current_user(authorization)


@router.get("")
async def list_resumes(authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()
    result = await run_supabase(
        lambda: supabase.table("user_resumes")
        .select("id,user_id,label,storage_path,char_count,created_at")
        .eq("user_id", user.id)
        .order("created_at")
        .execute()
    )
    return {"resumes": result.data or []}


@router.post("")
async def upload_resume(
    resume: UploadFile = File(...),
    label: str = Query("Resume"),
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    supabase = get_supabase()

    existing = await run_supabase(
        lambda: supabase.table("user_resumes")
        .select("id")
        .eq("user_id", user.id)
        .execute()
    )
    if existing.data and len(existing.data) >= MAX_RESUMES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_RESUMES} resumes allowed. Delete one first.",
        )

    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    parsed = await async_parse_resume(pdf_bytes)
    resume_text = parsed["raw_text"]

    file_id = str(uuid.uuid4())[:8]
    storage_path = f"{user.id}/{file_id}.pdf"

    await run_supabase(lambda: supabase.storage.from_("resumes").upload(
        storage_path,
        pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    ))

    data = {
        "user_id": user.id,
        "label": label,
        "storage_path": storage_path,
        "resume_text": resume_text,
        "char_count": parsed["char_count"],
    }
    result = await run_supabase(lambda: supabase.table("user_resumes").insert(data).execute())

    # Keep profiles table in sync with latest resume
    await run_supabase(lambda: supabase.table("profiles").update({
        "resume_url": storage_path,
        "resume_text": resume_text,
    }).eq("user_id", user.id).execute())

    return result.data[0] if result.data else data


@router.delete("/{resume_id}")
async def delete_resume(resume_id: str, authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()

    result = await run_supabase(
        lambda: supabase.table("user_resumes")
        .select("*")
        .eq("id", resume_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        await run_supabase(lambda: supabase.storage.from_("resumes").remove([result.data["storage_path"]]))
    except Exception:
        pass

    await run_supabase(lambda: supabase.table("user_resumes").delete().eq("id", resume_id).execute())
    return {"deleted": True}
