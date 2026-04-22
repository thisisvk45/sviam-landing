import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header
from app.db.supabase_client import get_supabase, run_supabase
from app.db.mongo import get_db
from app.config import settings
import httpx

router = APIRouter(prefix="/cron", tags=["notifications"])


def _build_digest_html(user_name: str, jobs: list) -> str:
    """Build HTML email for daily job digest."""
    job_rows = ""
    for job in jobs:
        title = job.get("role", {}).get("title", "Untitled")
        company = job.get("company", {}).get("name", "Unknown")
        city = job.get("location", {}).get("city", "")
        job_id = str(job.get("_id", ""))
        job_rows += f"""
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e;">
            <a href="https://sviam.in/jobs/{job_id}" style="color: #ededf0; text-decoration: none; font-weight: 600; font-size: 15px;">{title}</a>
            <br/>
            <span style="color: #63637a; font-size: 13px;">{company}{f' · {city}' if city else ''}</span>
          </td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin: 0; padding: 0; background: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 700; color: #ededf0; letter-spacing: -0.02em;">SViam</span>
        </div>
        <div style="background: #0b0b10; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden;">
          <div style="padding: 24px 20px 16px;">
            <p style="color: #ededf0; font-size: 16px; font-weight: 600; margin: 0 0 4px;">Hi {user_name or 'there'},</p>
            <p style="color: #63637a; font-size: 14px; margin: 0;">Here are your latest job matches:</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            {job_rows}
          </table>
          <div style="padding: 20px; text-align: center;">
            <a href="https://sviam.in/dashboard" style="display: inline-block; padding: 10px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">View All Matches</a>
          </div>
        </div>
        <p style="text-align: center; color: #63637a; font-size: 11px; margin-top: 24px;">
          You're receiving this because you enabled job match notifications on SViam.
          <br/><a href="https://sviam.in/profile" style="color: #6366f1;">Manage preferences</a>
        </p>
      </div>
    </body>
    </html>
    """


async def _send_email(to: str, subject: str, html: str) -> bool:
    """Send email via Resend API."""
    if not settings.resend_api_key:
        return False

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "SViam <notifications@sviam.in>",
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
                timeout=10.0,
            )
            return resp.status_code == 200
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to}: {e}")
        return False


@router.post("/daily-digest")
async def daily_digest(x_cron_secret: str = Header(None)):
    """Send daily email digest of new job matches to opted-in users."""
    if x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not settings.resend_api_key:
        return {"message": "Email service not configured (no RESEND_API_KEY)", "sent": 0}

    supabase = get_supabase()
    db = get_db()

    # Find new jobs posted in last 24h
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    new_jobs_cursor = db.jobs.find(
        {"is_active": True, "posted_at": {"$gte": since.isoformat()}},
        {"role": 1, "company": 1, "location": 1, "compensation": 1, "_id": 1},
    ).sort("posted_at", -1).limit(50)
    new_jobs = await new_jobs_cursor.to_list(50)

    if not new_jobs:
        return {"message": "No new jobs in last 24h", "sent": 0}

    # Get all users with email notifications enabled
    result = await run_supabase(lambda: supabase.table("profiles").select("id, name, job_preferences").execute())

    sent_count = 0
    errors = []

    for profile in result.data or []:
        try:
            prefs = profile.get("job_preferences") or {}
            if isinstance(prefs, str):
                prefs = json.loads(prefs)

            email_prefs = prefs.get("email_notifications") or {}
            if not email_prefs.get("new_matches", True):
                continue

            # Rate limit: don't send more than once per 20h
            last_sent = prefs.get("last_digest_sent_at")
            if last_sent:
                try:
                    last_dt = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) - last_dt < timedelta(hours=20):
                        continue
                except (ValueError, TypeError):
                    pass

            user_id = profile["id"]
            user_name = profile.get("name", "")

            # Smart alert filtering
            alerts = prefs.get("alerts") or []
            if alerts:
                matched_jobs = []
                for job in new_jobs:
                    job_title = (job.get("role", {}).get("title", "") or "").lower()
                    job_city = (job.get("location", {}).get("city", "") or "").lower()
                    job_remote = job.get("location", {}).get("remote", False)
                    job_salary_min = job.get("compensation", {}).get("salary_min", 0) or 0

                    for alert in alerts:
                        alert_role = (alert.get("role", "") or "").lower()
                        alert_city = (alert.get("city", "") or "").lower()
                        alert_salary_min = alert.get("salary_min", 0) or 0

                        role_match = not alert_role or alert_role in job_title or job_title in alert_role
                        city_match = not alert_city or alert_city in job_city or job_remote
                        salary_match = not alert_salary_min or job_salary_min >= alert_salary_min

                        if role_match and city_match and salary_match:
                            matched_jobs.append(job)
                            break

                user_jobs = matched_jobs[:5]
            else:
                user_jobs = new_jobs[:5]

            if not user_jobs:
                continue

            # Get user's email from Supabase Auth
            try:
                auth_user = await run_supabase(lambda: supabase.auth.admin.get_user_by_id(user_id))
                user_email = auth_user.user.email if auth_user and auth_user.user else None
            except Exception:
                user_email = None

            if not user_email:
                continue

            # Send matched jobs
            html = _build_digest_html(user_name, user_jobs)
            subject = f"{len(user_jobs)} new job match{'es' if len(user_jobs) != 1 else ''} on SViam"
            success = await _send_email(user_email, subject, html)

            if success:
                prefs["last_digest_sent_at"] = datetime.now(timezone.utc).isoformat()
                await run_supabase(lambda: supabase.table("profiles").update(
                    {"job_preferences": prefs}
                ).eq("id", user_id).execute())
                sent_count += 1

        except Exception as e:
            errors.append({"user_id": profile.get("id"), "error": str(e)})

    return {
        "message": "Daily digest complete",
        "new_jobs_found": len(new_jobs),
        "sent": sent_count,
        "errors": len(errors),
    }
