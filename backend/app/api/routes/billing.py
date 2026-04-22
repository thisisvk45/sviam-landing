import json
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from app.db.supabase_client import get_supabase, run_supabase
from app.db.redis_client import get_redis
from app.api.deps import get_current_user
from app.config import settings
from app.middleware.usage_limits import check_usage
import httpx

router = APIRouter(prefix="/billing", tags=["billing"])


def _get_user(authorization: str):
    return get_current_user(authorization)


PLAN_IDS = {
    "pro": {"amount": 29900, "currency": "INR", "period": "monthly", "interval": 1},
    "unlimited": {"amount": 49900, "currency": "INR", "period": "monthly", "interval": 1},
}


class CreateSubscriptionRequest(BaseModel):
    tier: str


@router.get("/status")
async def billing_status(authorization: str = Header(None)):
    user = _get_user(authorization)
    supabase = get_supabase()
    result = await run_supabase(lambda: supabase.table("profiles").select(
        "job_preferences"
    ).eq("id", user.id).single().execute())

    prefs = (result.data or {}).get("job_preferences") or {}
    if isinstance(prefs, str):
        prefs = json.loads(prefs)
    billing = prefs.get("billing") or {}

    return {
        "tier": billing.get("subscription_tier", "free"),
        "subscription_id": billing.get("subscription_id"),
        "valid_until": billing.get("valid_until"),
    }


@router.post("/create-subscription")
async def create_subscription(
    body: CreateSubscriptionRequest,
    authorization: str = Header(None),
):
    if body.tier not in ("pro", "unlimited"):
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'pro' or 'premium'.")

    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Contact support.",
        )

    user = _get_user(authorization)
    plan = PLAN_IDS[body.tier]

    # Create Razorpay order via HTTP API
    async with httpx.AsyncClient() as client:
        order_resp = await client.post(
            "https://api.razorpay.com/v1/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={
                "amount": plan["amount"],
                "currency": plan["currency"],
                "notes": {
                    "user_id": user.id,
                    "tier": body.tier,
                },
            },
            timeout=10.0,
        )

        if order_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to create payment order")

        order = order_resp.json()

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.razorpay_key_id,
        "tier": body.tier,
    }


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    tier: str


@router.post("/verify-payment")
async def verify_payment(
    body: VerifyPaymentRequest,
    authorization: str = Header(None),
):
    """Verify Razorpay payment signature and activate subscription."""
    user = _get_user(authorization)

    # Verify signature using HMAC-SHA256
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected_signature != body.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Activate subscription
    supabase = get_supabase()
    result = await run_supabase(lambda: supabase.table("profiles").select(
        "job_preferences"
    ).eq("id", user.id).single().execute())

    prefs = (result.data or {}).get("job_preferences") or {}
    if isinstance(prefs, str):
        prefs = json.loads(prefs)

    # Set subscription for 30 days
    valid_until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    prefs["billing"] = {
        "subscription_tier": body.tier,
        "subscription_id": body.razorpay_payment_id,
        "order_id": body.razorpay_order_id,
        "valid_until": valid_until,
        "activated_at": datetime.now(timezone.utc).isoformat(),
    }

    await run_supabase(lambda: supabase.table("profiles").update(
        {"job_preferences": prefs}
    ).eq("id", user.id).execute())

    # Invalidate tier cache
    redis = get_redis()
    if redis:
        await redis.delete(f"tier:{user.id}")

    return {
        "status": "active",
        "tier": body.tier,
        "valid_until": valid_until,
    }


@router.post("/webhook")
async def billing_webhook(request: Request):
    """Handle Razorpay webhook events — with signature verification."""
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    if settings.razorpay_key_secret:
        expected = hmac.new(
            settings.razorpay_key_secret.encode(),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    body = json.loads(raw_body)
    event = body.get("event", "")

    if event == "payment.captured":
        payload = body.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payload.get("notes", {})
        user_id = notes.get("user_id")
        tier = notes.get("tier", "pro")

        if user_id:
            supabase = get_supabase()
            result = await run_supabase(lambda: supabase.table("profiles").select(
                "job_preferences"
            ).eq("id", user_id).single().execute())

            prefs = (result.data or {}).get("job_preferences") or {}
            if isinstance(prefs, str):
                prefs = json.loads(prefs)

            prefs["billing"] = {
                "subscription_tier": tier,
                "subscription_id": payload.get("id"),
                "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "activated_at": datetime.now(timezone.utc).isoformat(),
            }

            await run_supabase(lambda: supabase.table("profiles").update(
                {"job_preferences": prefs}
            ).eq("id", user_id).execute())

            # Invalidate tier cache
            redis = get_redis()
            if redis:
                await redis.delete(f"tier:{user_id}")

    return {"status": "ok"}


@router.get("/usage")
async def get_usage(authorization: str = Header(None)):
    user = _get_user(authorization)
    features = ["matches", "tailors", "cover_letters", "auto_applies", "interview_prep"]
    usage = {}
    for feature in features:
        info = await check_usage(user.id, feature)
        usage[feature] = info
    return {"usage": usage}
