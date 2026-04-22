from __future__ import annotations

import httpx
from datetime import datetime, timezone, timedelta

from app.ingestion.utils import generate_job_id, clean_html
from app.ingestion.freshness import compute_freshness

DARWINBOX_API = "https://{subdomain}.darwinbox.in/ms/candidatev2/main/careers/allJobs"


async def crawl_darwinbox(
    company: dict,
    client: httpx.AsyncClient | None = None,
    last_etag: str | None = None,
) -> tuple[list[dict], str | None, str | None]:
    """Returns (jobs, new_etag, response_body_for_hashing). Empty jobs + None on 304."""
    subdomain = company.get("darwinbox_subdomain")
    if not subdomain:
        print(f"No darwinbox subdomain for {company['name']}")
        return [], None, None

    url = DARWINBOX_API.format(subdomain=subdomain)
    now = datetime.now(timezone.utc)

    request_headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    }
    # Darwinbox POST endpoints don't support If-None-Match, but we still
    # return the body for content-hash comparison in the pipeline.

    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=30)

    try:
        response = await client.post(url, headers=request_headers, json={})
        response.raise_for_status()
        response_body = response.text
        new_etag = response.headers.get("etag")  # unlikely but capture if present
        data = response.json()
    except Exception as e:
        print(f"Failed to fetch {company['name']} from Darwinbox: {e}")
        return [], None, None
    finally:
        if owns_client:
            await client.aclose()

    # Darwinbox returns jobs under different keys depending on version
    raw_jobs = (
        data.get("data", {}).get("jobs", [])
        or data.get("jobs", [])
        or data.get("data", [])
        or []
    )

    jobs = []
    for raw in raw_jobs:
        title = raw.get("title", "").strip() or raw.get("job_title", "").strip()
        if not title:
            continue

        location_str = raw.get("location", "") or raw.get("job_location", "")
        remote = "remote" in location_str.lower()
        hybrid = "hybrid" in location_str.lower()
        city = location_str.split(",")[0].strip() if location_str else company.get("city", "India")

        posted_at = now
        try:
            date_str = raw.get("created_at", "") or raw.get("posted_date", "")
            if date_str:
                posted_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            pass

        job_id = generate_job_id(
            company["name"], title, city, str(posted_at.date())
        )

        raw_jd = clean_html(raw.get("description", "") or raw.get("job_description", ""))
        job_url = raw.get("url", "") or raw.get("job_url", f"https://{subdomain}.darwinbox.in/ms/candidate/careers")

        job = {
            "_id": job_id,
            "source": "darwinbox",
            "source_url": job_url,
            "apply_url": job_url,
            "ats_type": "darwinbox",
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
                "department": raw.get("department", "") or raw.get("function", ""),
                "type": "fulltime"
            },
            "location": {
                "city": city,
                "state": "",
                "country": "India",
                "remote": remote,
                "hybrid": hybrid
            },
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
