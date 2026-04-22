"""Greenhouse India — crawl public Greenhouse boards for 50+ Indian companies."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta

import httpx

from app.ingestion.utils import generate_job_id, clean_html, parse_location
from app.ingestion.freshness import compute_freshness

GREENHOUSE_API = "https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"

# Greenhouse tokens — verified working + speculative (404s are skipped silently)
INDIAN_COMPANY_TOKENS = [
    # Verified working (as of 2026-04-20)
    "groww", "phonepe", "slice",
    # Verified — global companies with India presence
    "postman", "inmobi", "druva", "stripe", "figma",
    # Speculative — will 404 if wrong, no harm
    "razorpay", "zerodha", "upstox", "smallcase",
    "fi", "jupiter", "cred", "paytm",
    "bharatpe", "moneytap", "freo", "niyo",
    "meesho", "nykaa", "purplle", "mamaearth", "lenskart",
    "myntra", "ajio", "bewakoof", "firstcry",
    "unacademy", "vedantu", "toppr", "emeritus", "simplilearn",
    "scaler", "almabetter", "masaischool",
    "practo", "pharmeasy", "1mg", "mfine", "healthifyme",
    "curefit", "pristyncare",
    "freshworks", "zoho", "chargebee", "clevertap", "webengage",
    "helpshift", "exotel", "gupshup", "kaleyra",
    "dunzo", "delhivery", "shiprocket", "elasticrun",
    "rapido", "yulu", "bounce",
    "dream11", "mpl", "winzo", "games24x7",
    "hasura", "dgraph", "appsmith", "tooljet",
    "urban-company", "nobroker", "housing", "magicbricks",
    "policybazaar", "coverfox", "acko", "digit",
    "swiggy", "zomato", "blinkit",
    # Global tech with big India presence
    "browserstack", "innovaccer", "mindtickle", "gojek",
    "sprinklr", "sharechat", "udaan", "khatabook",
    "moglix", "ninjacart", "ofbusiness", "rupeek",
    "inframarket", "ixigo",
]

DELAY_BETWEEN_TOKENS = 0.5


async def crawl_greenhouse_india() -> list[dict]:
    """Crawl all Indian Greenhouse boards. Skip 404s silently."""
    all_jobs: list[dict] = []
    seen_ids: set[str] = set()
    valid_tokens: list[str] = []

    async with httpx.AsyncClient(timeout=30) as client:
        for token in INDIAN_COMPANY_TOKENS:
            url = GREENHOUSE_API.format(token=token)

            try:
                resp = await client.get(url)
                if resp.status_code == 404:
                    continue
                if resp.status_code != 200:
                    continue
                data = resp.json()
            except Exception as e:
                print(f"[GH-INDIA] {token}: error — {e}")
                continue

            jobs_data = data.get("jobs", [])
            if not jobs_data:
                await asyncio.sleep(DELAY_BETWEEN_TOKENS)
                continue

            valid_tokens.append(token)
            now = datetime.now(timezone.utc)
            company_name = token.replace("-", " ").title()

            for raw in jobs_data:
                title = raw.get("title", "").strip()
                if not title:
                    continue

                location_str = raw.get("location", {}).get("name", "")
                location = parse_location(location_str)

                posted_at = now
                try:
                    posted_at = datetime.fromisoformat(
                        raw.get("updated_at", "").replace("Z", "+00:00")
                    )
                except (ValueError, AttributeError):
                    pass

                job_id = generate_job_id(
                    company_name, title, location["city"], str(posted_at.date())
                )

                if job_id in seen_ids:
                    continue
                seen_ids.add(job_id)

                raw_jd = clean_html(raw.get("content", ""))

                job = {
                    "_id": job_id,
                    "source": "greenhouse",
                    "source_url": raw.get("absolute_url", ""),
                    "apply_url": raw.get("absolute_url", ""),
                    "ats_type": "greenhouse",
                    "company": {
                        "name": company_name,
                        "domain": "",
                        "city": location["city"],
                        "industry": "",
                        "size": "",
                    },
                    "role": {
                        "title": title,
                        "title_canonical": title,
                        "level": "mid",
                        "department": "",
                        "type": "fulltime",
                    },
                    "location": location,
                    "requirements": {
                        "skills": [],
                        "exp_years_min": 0,
                        "exp_years_max": 10,
                        "education": None,
                    },
                    "compensation": {
                        "salary_min": None,
                        "salary_max": None,
                        "currency": "INR",
                        "disclosed": False,
                    },
                    "raw_jd": raw_jd,
                    "milvus_id": None,
                    "posted_at": posted_at,
                    "expires_at": posted_at + timedelta(days=45),
                    "scraped_at": now,
                    "updated_at": now,
                    "is_active": True,
                    "freshness_score": compute_freshness(posted_at, now),
                }
                all_jobs.append(job)

            print(f"[GH-INDIA] {token}: {len(jobs_data)} jobs")
            await asyncio.sleep(DELAY_BETWEEN_TOKENS)

    print(f"[GH-INDIA] Valid tokens: {len(valid_tokens)}/{len(INDIAN_COMPANY_TOKENS)}")
    print(f"[GH-INDIA] Total unique jobs: {len(all_jobs)}")
    return all_jobs
