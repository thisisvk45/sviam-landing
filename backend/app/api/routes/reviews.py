"""Company reviews — candidates share interview & hiring experiences."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, field_validator

from app.api.deps import get_current_user
from app.db.supabase_client import get_supabase, run_supabase

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _get_user(authorization: str):
    return get_current_user(authorization)


class ReviewCreate(BaseModel):
    company_name: str
    rating: int
    interview_difficulty: Optional[int] = None
    offer_received: Optional[bool] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    anonymous: bool = True

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("rating must be between 1 and 5")
        return v

    @field_validator("interview_difficulty")
    @classmethod
    def validate_difficulty(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("interview_difficulty must be between 1 and 5")
        return v

    @field_validator("pros", "cons")
    @classmethod
    def validate_text_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Text must be 500 characters or fewer")
        return v


@router.post("")
async def create_review(
    body: ReviewCreate,
    authorization: str = Header(None),
):
    user = _get_user(authorization)
    supabase = get_supabase()
    normalized_name = body.company_name.strip().lower()

    if not normalized_name:
        raise HTTPException(status_code=400, detail="company_name is required")

    # Check for existing review by this user for this company
    existing = await run_supabase(
        lambda: supabase.table("company_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_name", normalized_name)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="You already reviewed this company")

    data = {
        "user_id": user.id,
        "company_name": normalized_name,
        "rating": body.rating,
        "anonymous": body.anonymous,
    }
    if body.interview_difficulty is not None:
        data["interview_difficulty"] = body.interview_difficulty
    if body.offer_received is not None:
        data["offer_received"] = body.offer_received
    if body.pros is not None:
        data["pros"] = body.pros
    if body.cons is not None:
        data["cons"] = body.cons

    try:
        result = await run_supabase(
            lambda: supabase.table("company_reviews").insert(data).execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create review")

    return result.data[0] if result.data else data


@router.get("/{company_name}")
async def get_reviews(company_name: str):
    normalized = company_name.strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="company_name is required")

    supabase = get_supabase()
    result = await run_supabase(
        lambda: supabase.table("company_reviews")
        .select("id, company_name, rating, interview_difficulty, offer_received, pros, cons, anonymous, created_at")
        .eq("company_name", normalized)
        .order("created_at", desc=True)
        .execute()
    )
    return {"reviews": result.data or []}


@router.get("/{company_name}/summary")
async def get_review_summary(company_name: str):
    normalized = company_name.strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="company_name is required")

    supabase = get_supabase()
    result = await run_supabase(
        lambda: supabase.table("company_reviews")
        .select("rating, interview_difficulty, offer_received")
        .eq("company_name", normalized)
        .execute()
    )
    reviews = result.data or []
    if not reviews:
        return {
            "company_name": normalized,
            "avg_rating": 0,
            "review_count": 0,
            "offer_rate": 0,
            "avg_difficulty": 0,
        }

    review_count = len(reviews)
    avg_rating = round(sum(r["rating"] for r in reviews) / review_count, 1)

    difficulties = [r["interview_difficulty"] for r in reviews if r.get("interview_difficulty") is not None]
    avg_difficulty = round(sum(difficulties) / len(difficulties), 1) if difficulties else 0

    offers = [r for r in reviews if r.get("offer_received") is not None]
    offer_rate = round(sum(1 for r in offers if r["offer_received"]) / len(offers), 2) if offers else 0

    return {
        "company_name": normalized,
        "avg_rating": avg_rating,
        "review_count": review_count,
        "offer_rate": offer_rate,
        "avg_difficulty": avg_difficulty,
    }
