"""Hirist.tech crawler — tech-only Indian job board with Schema.org JSON-LD."""
from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone, timedelta

import httpx
from bs4 import BeautifulSoup

from app.ingestion.utils import generate_job_id, clean_html
from app.ingestion.freshness import compute_freshness

CATEGORIES = [
    "software-development",
    "data-science-analytics",
    "devops-cloud",
    "product-management",
    "mobile-development",
    "machine-learning-ai",
    "backend-development",
    "frontend-development",
    "full-stack-development",
    "java-development",
    "python-development",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
}

MAX_PAGES_PER_CATEGORY = 5
DELAY_BETWEEN_PAGES = 3.0
DELAY_BETWEEN_JOBS = 1.5


def _extract_json_ld(soup: BeautifulSoup) -> dict | None:
    """Extract JobPosting JSON-LD from page."""
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                for item in data:
                    if item.get("@type") == "JobPosting":
                        return item
            elif data.get("@type") == "JobPosting":
                return data
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def _parse_salary(base_salary: dict | None) -> dict:
    """Parse Schema.org baseSalary structure."""
    if not base_salary:
        return {"salary_min": None, "salary_max": None, "currency": "INR", "disclosed": False}

    value = base_salary.get("value", {})
    if isinstance(value, dict):
        min_val = value.get("minValue")
        max_val = value.get("maxValue")
        unit = value.get("unitText", "YEAR")
        currency = base_salary.get("currency", "INR")

        multiplier = 1
        if unit and "month" in unit.lower():
            multiplier = 12

        try:
            salary_min = int(float(min_val)) * multiplier if min_val else None
            salary_max = int(float(max_val)) * multiplier if max_val else None
        except (ValueError, TypeError):
            salary_min = salary_max = None

        return {
            "salary_min": salary_min,
            "salary_max": salary_max,
            "currency": currency,
            "disclosed": salary_min is not None,
        }

    return {"salary_min": None, "salary_max": None, "currency": "INR", "disclosed": False}


def _parse_job_from_jsonld(data: dict) -> dict | None:
    """Map JSON-LD JobPosting to standard schema."""
    try:
        title = data.get("title", "").strip()
        if not title:
            return None

        org = data.get("hiringOrganization", {})
        company_name = org.get("name", "").strip() if isinstance(org, dict) else ""
        if not company_name:
            return None

        # Location
        job_location = data.get("jobLocation", {})
        if isinstance(job_location, list):
            job_location = job_location[0] if job_location else {}
        address = job_location.get("address", {}) if isinstance(job_location, dict) else {}
        city = address.get("addressLocality", "India") if isinstance(address, dict) else "India"
        state = address.get("addressRegion", "") if isinstance(address, dict) else ""

        # Date
        posted_str = data.get("datePosted", "")
        now = datetime.now(timezone.utc)
        try:
            posted_at = datetime.fromisoformat(posted_str.replace("Z", "+00:00"))
            if posted_at.tzinfo is None:
                posted_at = posted_at.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            posted_at = now

        # Description
        description = clean_html(data.get("description", ""))

        # Salary
        salary_data = _parse_salary(data.get("baseSalary"))

        # Employment type
        emp_type = data.get("employmentType", "FULL_TIME")
        if isinstance(emp_type, list):
            emp_type = emp_type[0] if emp_type else "FULL_TIME"
        type_map = {
            "FULL_TIME": "fulltime",
            "PART_TIME": "parttime",
            "CONTRACT": "contract",
            "TEMPORARY": "contract",
            "INTERN": "internship",
        }
        job_type = type_map.get(emp_type.upper().replace("-", "_").replace(" ", "_"), "fulltime")

        job_id = generate_job_id(company_name, title, city, str(posted_at.date()))

        # Apply URL
        apply_url = data.get("url", "") or data.get("directApply", "")

        return {
            "_id": job_id,
            "source": "hirist",
            "source_url": apply_url,
            "apply_url": apply_url,
            "ats_type": None,
            "company": {
                "name": company_name,
                "domain": org.get("sameAs", "") if isinstance(org, dict) else "",
                "city": city,
                "industry": "",
                "size": "",
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "mid",
                "department": "",
                "type": job_type,
            },
            "location": {
                "city": city,
                "state": state,
                "country": "India",
                "remote": "remote" in (city + title).lower(),
                "hybrid": "hybrid" in (city + title).lower(),
            },
            "requirements": {
                "skills": [],
                "exp_years_min": 0,
                "exp_years_max": 10,
                "education": None,
            },
            "compensation": salary_data,
            "raw_jd": description,
            "milvus_id": None,
            "posted_at": posted_at,
            "expires_at": posted_at + timedelta(days=45),
            "scraped_at": now,
            "updated_at": now,
            "is_active": True,
            "freshness_score": compute_freshness(posted_at, now),
        }
    except Exception as e:
        print(f"[HIRIST] Failed to parse job JSON-LD: {e}")
        return None


async def crawl_hirist() -> list[dict]:
    """Crawl Hirist.tech job listings across all tech categories."""
    all_jobs: list[dict] = []
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(timeout=30, headers=HEADERS, follow_redirects=True) as client:
        for category in CATEGORIES:
            for page in range(1, MAX_PAGES_PER_CATEGORY + 1):
                url = f"https://www.hirist.tech/jobs?category={category}&page={page}"
                try:
                    resp = await client.get(url)
                    if resp.status_code == 404:
                        break
                    resp.raise_for_status()
                except httpx.HTTPError as e:
                    print(f"[HIRIST] Failed to fetch {category} page {page}: {e}")
                    break

                soup = BeautifulSoup(resp.text, "html.parser")

                # Find job links — pattern: /j/{id}/{slug}
                job_links = set()
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if re.match(r"/j/\d+/", href) or re.match(r"/j/.+", href):
                        if href.startswith("/"):
                            href = f"https://www.hirist.tech{href}"
                        job_links.add(href)

                if not job_links:
                    # Try alternate link patterns
                    for a in soup.find_all("a", href=True):
                        href = a["href"]
                        if "/job/" in href or "/jobs/" in href and href != url:
                            if href.startswith("/"):
                                href = f"https://www.hirist.tech{href}"
                            job_links.add(href)

                if not job_links:
                    break

                # Fetch each job page for JSON-LD
                for job_url in job_links:
                    try:
                        job_resp = await client.get(job_url)
                        if job_resp.status_code != 200:
                            continue
                    except httpx.HTTPError:
                        continue

                    job_soup = BeautifulSoup(job_resp.text, "html.parser")
                    jsonld = _extract_json_ld(job_soup)

                    if jsonld:
                        job = _parse_job_from_jsonld(jsonld)
                        if job and job["_id"] not in seen_ids:
                            # Override source_url with actual page URL
                            job["source_url"] = job_url
                            if not job["apply_url"]:
                                job["apply_url"] = job_url
                            seen_ids.add(job["_id"])
                            all_jobs.append(job)

                    await asyncio.sleep(DELAY_BETWEEN_JOBS)

                print(f"[HIRIST] {category} page {page}: {len(job_links)} links, {len(all_jobs)} total jobs")
                await asyncio.sleep(DELAY_BETWEEN_PAGES)

    print(f"[HIRIST] Total unique jobs: {len(all_jobs)}")
    return all_jobs
