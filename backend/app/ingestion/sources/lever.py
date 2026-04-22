from __future__ import annotations

import httpx
from datetime import datetime, timezone, timedelta

from app.ingestion.utils import generate_job_id, clean_html, parse_location
from app.ingestion.freshness import compute_freshness

LEVER_API = "https://api.lever.co/v0/postings/{token}?mode=json"


async def crawl_lever(
    company: dict,
    client: httpx.AsyncClient | None = None,
    last_etag: str | None = None,
) -> tuple[list[dict], str | None, str | None]:
    """Returns (jobs, new_etag, response_body_for_hashing). Empty jobs + None on 304."""
    token = company.get("lever_token")
    if not token:
        print(f"No lever token for {company['name']}")
        return [], None, None

    url = LEVER_API.format(token=token)

    headers = {}
    if last_etag:
        headers["If-None-Match"] = last_etag

    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=30)

    try:
        response = await client.get(url, headers=headers)

        if response.status_code == 304:
            print(f"{company['name']}: 304 Not Modified (Lever)")
            return [], None, None

        response.raise_for_status()
        response_body = response.text
        new_etag = response.headers.get("etag")
        data = response.json()
    except Exception as e:
        print(f"Failed to fetch {company['name']}: {e}")
        return [], None, None
    finally:
        if owns_client:
            await client.aclose()

    now = datetime.now(timezone.utc)
    jobs = []

    for raw in data:
        title = raw.get("text", "").strip()
        location_str = raw.get("categories", {}).get("location", "")
        location = parse_location(location_str)

        posted_ts = raw.get("createdAt", 0)
        try:
            posted_at = datetime.fromtimestamp(posted_ts / 1000, tz=timezone.utc)
        except Exception:
            posted_at = now

        job_id = generate_job_id(
            company["name"], title, location["city"], str(posted_at.date())
        )

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
                "name": company["name"],
                "domain": company.get("domain", ""),
                "city": company.get("city", ""),
                "industry": company.get("industry", ""),
                "size": company.get("size", "")
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "mid",
                "department": raw.get("categories", {}).get("department", ""),
                "type": raw.get("categories", {}).get("commitment", "fulltime").lower()
            },
            "location": location,
            "requirements": {
                "skills": [],
                "exp_years_min": 0,
                "exp_years_max": 10,
                "education": None
            },
            "compensation": {
                "salary_min": None,
                "salary_max": None,
                "currency": "INR",
                "disclosed": False
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
        jobs.append(job)

    print(f"{company['name']}: found {len(jobs)} jobs")
    return jobs, new_etag, response_body
