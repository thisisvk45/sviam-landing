from __future__ import annotations

import httpx
from datetime import datetime, timezone, timedelta

from app.ingestion.utils import generate_job_id, clean_html, parse_location
from app.ingestion.freshness import compute_freshness

GREENHOUSE_API_US = "https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
GREENHOUSE_API_EU = "https://job-boards.eu.greenhouse.io/v1/boards/{token}/jobs?content=true"

def get_greenhouse_url(token: str, region: str = "us") -> str:
    if region == "eu":
        return GREENHOUSE_API_EU.format(token=token)
    return GREENHOUSE_API_US.format(token=token)


async def crawl_greenhouse(
    company: dict,
    client: httpx.AsyncClient | None = None,
    last_etag: str | None = None,
) -> tuple[list[dict], str | None, str | None]:
    """Returns (jobs, new_etag, response_body_for_hashing). Empty jobs + None on 304."""
    token = company.get("greenhouse_token")
    region = company.get("greenhouse_region", "us")
    if not token:
        print(f"No greenhouse token for {company['name']}")
        return [], None, None

    url = get_greenhouse_url(token, region)

    headers = {}
    if last_etag:
        headers["If-None-Match"] = last_etag

    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=30)

    try:
        response = await client.get(url, headers=headers)

        if response.status_code == 304:
            print(f"{company['name']}: 304 Not Modified (Greenhouse)")
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

    for raw in data.get("jobs", []):
        title = raw.get("title", "").strip()
        location_str = raw.get("location", {}).get("name", "")
        location = parse_location(location_str)
        posted_at = now
        try:
            posted_at = datetime.fromisoformat(
                raw.get("updated_at", "").replace("Z", "+00:00")
            )
        except Exception:
            pass

        job_id = generate_job_id(
            company["name"], title, location["city"], str(posted_at.date())
        )

        raw_jd = clean_html(raw.get("content", ""))

        job = {
            "_id": job_id,
            "source": "greenhouse",
            "source_url": raw.get("absolute_url", ""),
            "apply_url": raw.get("absolute_url", ""),
            "ats_type": "greenhouse",
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
                "department": "",
                "type": "fulltime"
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
