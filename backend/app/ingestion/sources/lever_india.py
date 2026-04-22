"""Lever India — crawl public Lever boards for Indian companies."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta

import httpx

from app.ingestion.utils import generate_job_id, clean_html, parse_location
from app.ingestion.freshness import compute_freshness

LEVER_API = "https://api.lever.co/v0/postings/{token}?mode=json"

LEVER_INDIA_TOKENS = [
    # Verified working
    "cred",
    # Speculative — 404s are skipped silently
    "razorpay", "meesho", "groww",
    "slice", "jupiter", "fi", "niyo",
    "dunzo", "rapido", "urban-company",
    "freshworks", "chargebee", "clevertap",
    "dream11", "mpl", "games24x7",
    "delhivery", "shiprocket",
    "practo", "healthifyme", "curefit",
    "unacademy", "scaler", "emeritus",
    "hasura", "appsmith", "tooljet",
    "acko", "digit", "policybazaar",
    # Alternate slug formats
    "credclub", "meeshoinc", "freshworksinc",
    "chargebeeinc", "urbancompany",
    "browserstack", "sprinklr", "postman",
    "inmobi", "innovaccer", "druva",
]

DELAY_BETWEEN_TOKENS = 0.5


async def crawl_lever_india() -> list[dict]:
    """Crawl all Indian Lever boards. Skip 404s silently."""
    all_jobs: list[dict] = []
    seen_ids: set[str] = set()
    valid_tokens: list[str] = []

    async with httpx.AsyncClient(timeout=30) as client:
        for token in LEVER_INDIA_TOKENS:
            url = LEVER_API.format(token=token)

            try:
                resp = await client.get(url)
                if resp.status_code == 404:
                    continue
                if resp.status_code != 200:
                    continue
                data = resp.json()
            except Exception as e:
                print(f"[LEVER-INDIA] {token}: error — {e}")
                continue

            if not isinstance(data, list) or not data:
                await asyncio.sleep(DELAY_BETWEEN_TOKENS)
                continue

            valid_tokens.append(token)
            now = datetime.now(timezone.utc)
            company_name = token.replace("-", " ").title()

            for raw in data:
                title = raw.get("text", "").strip()
                if not title:
                    continue

                location_str = raw.get("categories", {}).get("location", "")
                location = parse_location(location_str)

                posted_ts = raw.get("createdAt", 0)
                try:
                    posted_at = datetime.fromtimestamp(posted_ts / 1000, tz=timezone.utc)
                except (ValueError, OSError):
                    posted_at = now

                job_id = generate_job_id(
                    company_name, title, location["city"], str(posted_at.date())
                )

                if job_id in seen_ids:
                    continue
                seen_ids.add(job_id)

                lists = raw.get("lists", [])
                raw_jd = "\n".join(
                    clean_html(lst.get("content", "")) for lst in lists
                )

                job = {
                    "_id": job_id,
                    "source": "lever",
                    "source_url": raw.get("hostedUrl", ""),
                    "apply_url": raw.get("applyUrl", raw.get("hostedUrl", "")),
                    "ats_type": "lever",
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
                        "department": raw.get("categories", {}).get("department", ""),
                        "type": raw.get("categories", {}).get("commitment", "fulltime").lower(),
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

            print(f"[LEVER-INDIA] {token}: {len(data)} postings")
            await asyncio.sleep(DELAY_BETWEEN_TOKENS)

    print(f"[LEVER-INDIA] Valid tokens: {len(valid_tokens)}/{len(LEVER_INDIA_TOKENS)}")
    print(f"[LEVER-INDIA] Total unique jobs: {len(all_jobs)}")
    return all_jobs
