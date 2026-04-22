"""Interview platform REST API — config management, session CRUD, scorecard generation."""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.db.supabase_client import get_supabase, run_supabase

router = APIRouter(prefix="/interviews", tags=["interviews"])


def _get_user(authorization: str):
    return get_current_user(authorization)


# ──── Request/Response Models ────


class InterviewConfigCreate(BaseModel):
    name: str
    topics: List[str] = []
    difficulty: str = "medium"
    duration_minutes: int = 30
    question_count: int = 5
    follow_up_depth: str = "medium"
    programming_languages: List[str] = ["python", "javascript"]
    persona: str = "arya"


class GenerateJDRequest(BaseModel):
    role: str
    experience_level: str = "mid"  # junior, mid, senior, lead
    tech_stack: List[str] = []
    work_mode: str = "hybrid"  # remote, hybrid, onsite
    company_context: str = ""  # optional company/team info


class SessionCreate(BaseModel):
    config_id: str
    candidate_email: str
    candidate_name: str


# ──── Config Endpoints ────


@router.post("/config")
async def create_config(
    body: InterviewConfigCreate,
    authorization: str = Header(None),
):
    """Create a new interview configuration."""
    user = _get_user(authorization)

    config_data = {
        "id": str(uuid.uuid4()),
        "company_id": user.id,
        "name": body.name,
        "topics": body.topics,
        "difficulty": body.difficulty,
        "duration_minutes": max(10, min(body.duration_minutes, 90)),
        "question_count": max(1, min(body.question_count, 15)),
        "follow_up_depth": body.follow_up_depth,
        "programming_languages": body.programming_languages,
        "persona": body.persona,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    supabase = get_supabase()
    try:
        result = await run_supabase(
            lambda: supabase.table("interview_configs").insert(config_data).execute()
        )
        return {"config": config_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create config: {e}")


@router.get("/config")
async def list_configs(authorization: str = Header(None)):
    """List all interview configurations for the current company."""
    user = _get_user(authorization)

    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_configs")
            .select("*")
            .eq("company_id", user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"configs": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch configs: {e}")


@router.delete("/config/{config_id}")
async def delete_config(config_id: str, authorization: str = Header(None)):
    """Delete an interview configuration."""
    user = _get_user(authorization)

    try:
        await run_supabase(
            lambda: get_supabase().table("interview_configs")
            .delete()
            .eq("id", config_id)
            .eq("company_id", user.id)
            .execute()
        )
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete config: {e}")


@router.post("/generate-jd")
async def generate_jd(
    body: GenerateJDRequest,
    authorization: str = Header(None),
):
    """Auto-generate a job description from role + tech stack + experience level."""
    _get_user(authorization)

    tech = ", ".join(body.tech_stack) if body.tech_stack else "general software engineering"
    company_info = f"\nCompany/team context: {body.company_context}" if body.company_context else ""

    prompt = (
        f"Write a concise, professional job description for: {body.role}\n"
        f"Experience level: {body.experience_level}\n"
        f"Tech stack: {tech}\n"
        f"Work mode: {body.work_mode}\n"
        f"{company_info}\n\n"
        "Format:\n"
        "- 1-2 sentence role summary\n"
        "- 4-6 key responsibilities as bullet points\n"
        "- 4-6 requirements as bullet points\n"
        "- Keep it under 250 words total. No company benefits section.\n"
        "- Write in plain text, no markdown headers."
    )

    try:
        import httpx
        from app.config import settings

        api_key = settings.openrouter_api_key
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY not configured")

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "google/gemini-2.5-flash",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.6,
                    "max_tokens": 600,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            result = data["choices"][0]["message"]["content"]

        return {"job_description": result.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate JD: {e}")


# ──── Session Endpoints ────


@router.post("/sessions")
async def create_session(
    body: SessionCreate,
    authorization: str = Header(None),
):
    """Create a new interview session and generate candidate link."""
    user = _get_user(authorization)

    # Fetch the config to embed in session
    try:
        config_result = await run_supabase(
            lambda: get_supabase().table("interview_configs")
            .select("*")
            .eq("id", body.config_id)
            .eq("company_id", user.id)
            .single()
            .execute()
        )
        config = config_result.data
    except Exception:
        raise HTTPException(status_code=404, detail="Config not found")

    session_id = str(uuid.uuid4())
    pin = str(random.randint(100000, 999999))
    session_data = {
        "id": session_id,
        "company_id": user.id,
        "candidate_email": body.candidate_email,
        "candidate_name": body.candidate_name,
        "config": config,
        "pin": pin,
        "status": "pending",
        "transcript": [],
        "scorecard": None,
        "recording_url": None,
        "eye_tracking_events": [],
        "tab_switch_events": [],
        "started_at": None,
        "ended_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await run_supabase(
            lambda: get_supabase().table("interview_sessions").insert(session_data).execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")

    candidate_link = f"http://localhost:3000/interview/{session_id}"
    return {
        "session": session_data,
        "candidate_link": candidate_link,
        "pin": pin,
    }


@router.get("/sessions")
async def list_sessions(authorization: str = Header(None)):
    """List all interview sessions for the current company."""
    user = _get_user(authorization)

    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("id, candidate_name, candidate_email, status, scorecard, created_at, started_at, ended_at")
            .eq("company_id", user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"sessions": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {e}")


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, authorization: str = Header(None)):
    """Get full session details including transcript, scorecard, events."""
    user = _get_user(authorization)

    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("company_id", user.id)
            .single()
            .execute()
        )
        return {"session": result.data}
    except Exception:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/sessions/{session_id}/public")
async def get_session_public(session_id: str):
    """Public endpoint — returns minimal info (no config details until PIN verified)."""
    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("id, candidate_name, status, config")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = result.data
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "session_id": session["id"],
            "candidate_name": session["candidate_name"],
            "status": session["status"],
            "config_name": session["config"].get("name", "Technical Interview"),
            "requires_pin": True,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Session not found")


class VerifyPinRequest(BaseModel):
    pin: str


@router.post("/sessions/{session_id}/verify")
async def verify_session_pin(session_id: str, body: VerifyPinRequest):
    """Candidate verifies with PIN to unlock the interview."""
    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("id, candidate_name, candidate_email, status, config, pin")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = result.data
    except Exception:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check PIN
    if session.get("pin") != body.pin:
        raise HTTPException(status_code=403, detail="Invalid PIN")

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    if session["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Interview cancelled")

    config = session.get("config", {})
    return {
        "verified": True,
        "session_id": session["id"],
        "candidate_name": session["candidate_name"],
        "status": session["status"],
        "config": {
            "name": config.get("name", "Technical Interview"),
            "duration_minutes": config.get("duration_minutes", 30),
            "question_count": config.get("question_count", 5),
            "programming_languages": config.get("programming_languages", []),
        },
    }


@router.post("/sessions/{session_id}/start")
async def start_session(session_id: str):
    """Mark session as active (called when candidate starts)."""
    try:
        await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .update({
                "status": "active",
                "started_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", session_id)
            .execute()
        )
        return {"started": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {e}")


@router.post("/sessions/{session_id}/end")
async def end_session(session_id: str):
    """Mark session as completed, trigger scorecard generation."""
    try:
        # Fetch full session for scorecard
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = result.data

        # Mark as completed
        await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .update({
                "status": "completed",
                "ended_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", session_id)
            .execute()
        )

        # Generate scorecard asynchronously
        import asyncio
        asyncio.create_task(_generate_and_save_scorecard(session_id, session))

        return {"ended": True, "scorecard_generating": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {e}")


@router.get("/compare")
async def compare_sessions(
    session_ids: str = Query(..., description="Comma-separated session IDs (max 5)"),
    authorization: str = Header(None),
):
    """Compare multiple interview sessions side-by-side."""
    user = _get_user(authorization)

    ids = [s.strip() for s in session_ids.split(",") if s.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="Provide at least one session_id")
    if len(ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 sessions can be compared")

    supabase = get_supabase()
    result = await run_supabase(
        lambda: supabase.table("interview_sessions")
        .select("id, candidate_name, candidate_email, status, scorecard, config, started_at, ended_at, tab_switch_events, eye_tracking_events")
        .eq("company_id", user.id)
        .in_("id", ids)
        .execute()
    )
    sessions = result.data or []

    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found")

    comparisons = []
    for s in sessions:
        scorecard = s.get("scorecard") or {}
        config = s.get("config") or {}
        tab_switches = s.get("tab_switch_events") or []
        eye_events = s.get("eye_tracking_events") or []

        # Calculate duration
        duration_minutes = None
        if s.get("started_at") and s.get("ended_at"):
            try:
                started = datetime.fromisoformat(s["started_at"].replace("Z", "+00:00"))
                ended = datetime.fromisoformat(s["ended_at"].replace("Z", "+00:00"))
                duration_minutes = round((ended - started).total_seconds() / 60, 1)
            except (ValueError, TypeError):
                pass

        comparisons.append({
            "session_id": s["id"],
            "candidate_name": s.get("candidate_name", ""),
            "candidate_email": s.get("candidate_email", ""),
            "status": s.get("status", ""),
            "config_name": config.get("name", ""),
            "difficulty": config.get("difficulty", ""),
            "duration_minutes": duration_minutes,
            "overall_score": scorecard.get("overall_score"),
            "verdict": scorecard.get("verdict", ""),
            "category_scores": scorecard.get("category_scores", {}),
            "strengths": scorecard.get("strengths", []),
            "weaknesses": scorecard.get("weaknesses", []),
            "tab_switch_count": len(tab_switches),
            "eye_tracking_flags": len(eye_events),
        })

    # Sort by overall score descending (None scores go last)
    comparisons.sort(
        key=lambda c: c["overall_score"] if c["overall_score"] is not None else -1,
        reverse=True,
    )

    return {"comparisons": comparisons}


@router.get("/search")
async def search_transcripts(q: str = "", authorization: str = Header(None)):
    """Search across all completed interview transcripts for the company."""
    user = _get_user(authorization)
    if not q or len(q.strip()) < 2:
        return {"results": []}

    query = q.strip().lower()

    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("id, candidate_name, status, scorecard, transcript")
            .eq("company_id", user.id)
            .eq("status", "completed")
            .order("created_at", desc=True)
            .execute()
        )
        sessions = result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    results = []
    for s in sessions:
        transcript = s.get("transcript") or []
        matches = []
        for entry in transcript:
            for field in ("question", "answer", "code"):
                text = entry.get(field, "") or ""
                if query in text.lower():
                    # Find match position for context snippet
                    idx = text.lower().index(query)
                    start = max(0, idx - 50)
                    end = min(len(text), idx + len(query) + 150)
                    snippet = ("..." if start > 0 else "") + text[start:end] + ("..." if end < len(text) else "")
                    matches.append({"field": field, "snippet": snippet})
                    if len(matches) >= 5:
                        break
            if len(matches) >= 5:
                break
        if matches:
            scorecard = s.get("scorecard") or {}
            results.append({
                "session_id": s["id"],
                "candidate_name": s.get("candidate_name", ""),
                "verdict": scorecard.get("verdict", ""),
                "overall_score": scorecard.get("overall_score"),
                "matches": matches,
            })

    return {"results": results, "query": q}


async def _generate_and_save_scorecard(session_id: str, session: dict):
    """Background task to generate scorecard and save it."""
    try:
        from app.services.interview_ai import generate_scorecard

        transcript = session.get("transcript", [])
        config = session.get("config", {})

        scorecard = await generate_scorecard(transcript, config)

        await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .update({"scorecard": scorecard})
            .eq("id", session_id)
            .execute()
        )
        print(f"[INTERVIEW] Scorecard generated for session {session_id}: {scorecard.get('verdict')}")
    except Exception as e:
        print(f"[INTERVIEW] Scorecard generation failed for {session_id}: {e}")
