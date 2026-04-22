from __future__ import annotations

import httpx
from datetime import datetime, timezone, timedelta

from app.ingestion.utils import generate_job_id, clean_html
from app.ingestion.freshness import compute_freshness

ASHBY_API = "https://api.ashbyhq.com/posting-api/job-board/{token}"


async def crawl_ashby(
    company: dict,
    client: httpx.AsyncClient | None = None,
    last_etag: str | None = None,
) -> tuple[list[dict], str | None, str | None]:
    """Returns (jobs, new_etag, response_body_for_hashing). Empty jobs + None on 304."""
    token = company.get("ashby_token")
    if not token:
        print(f"No ashby token for {company['name']}")
        return [], None, None

    url = ASHBY_API.format(token=token)

    headers = {}
    if last_etag:
        headers["If-None-Match"] = last_etag

    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=30)

    try:
        response = await client.get(url, headers=headers)

        if response.status_code == 304:
            print(f"{company['name']}: 304 Not Modified (Ashby)")
            return [], None, None

        if response.status_code == 404:
            print(f"Ashby: {company['name']} — 404, no public board")
            return [], None, None

        response.raise_for_status()
        response_body = response.text
        new_etag = response.headers.get("etag")
        data = response.json()
    except Exception as e:
        print(f"Failed to fetch {company['name']} from Ashby: {e}")
        return [], None, None
    finally:
        if owns_client:
            await client.aclose()

    now = datetime.now(timezone.utc)
    postings = data.get("jobPostings", data.get("jobs", []))
    jobs = []

    for raw in postings:
        title = raw.get("title", "").strip()
        if not title:
            continue

        location_str = raw.get("locationName", "India")
        city = location_str.split(",")[0].strip() if location_str else "India"
        remote = "remote" in location_str.lower()

        published_str = raw.get("publishedAt", "")
        try:
            posted_at = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        except Exception:
            posted_at = now

        job_id = generate_job_id(
            company["name"], title, city, str(posted_at.date())
        )

        raw_jd = clean_html(raw.get("descriptionHtml", ""))
        job_url = raw.get("jobUrl", f"https://jobs.ashbyhq.com/{token}")

        job = {
            "_id": job_id,
            "source": "ashby",
            "source_url": job_url,
            "apply_url": job_url,
            "ats_type": "ashby",
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
                "department": raw.get("teamName", ""),
                "type": "fulltime"
            },
            "location": {
                "city": city,
                "state": "",
                "country": "India",
                "remote": remote,
                "hybrid": False
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

    print(f"{company['name']}: found {len(jobs)} jobs (Ashby)")
    return jobs, new_etag, response_body
