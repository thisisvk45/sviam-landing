"""IIMJobs crawler — senior & MBA-level tech roles in India."""
from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone, timedelta

import httpx
from bs4 import BeautifulSoup

from app.ingestion.utils import generate_job_id, clean_html
from app.ingestion.freshness import compute_freshness

CATEGORY_URLS = [
    "https://www.iimjobs.com/j/technology-it-software-jobs-{page}.html",
    "https://www.iimjobs.com/j/data-analytics-business-intelligence-jobs-{page}.html",
    "https://www.iimjobs.com/j/product-management-jobs-{page}.html",
    "https://www.iimjobs.com/j/engineering-jobs-{page}.html",
]

MAX_PAGES = 3

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
}

DELAY_BETWEEN_PAGES = 3.0
DELAY_BETWEEN_JOBS = 2.0


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


def _parse_from_html(soup: BeautifulSoup, url: str) -> dict | None:
    """Fallback: parse job from HTML structure when JSON-LD is missing."""
    try:
        now = datetime.now(timezone.utc)

        # Title from h1
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else ""
        if not title:
            return None

        # Company — look for common patterns
        company_name = ""
        company_el = soup.find("a", class_=re.compile(r"company|employer", re.I))
        if company_el:
            company_name = company_el.get_text(strip=True)
        if not company_name:
            # Try meta tags
            meta_company = soup.find("meta", {"property": "og:site_name"})
            if meta_company:
                company_name = meta_company.get("content", "")

        if not company_name:
            company_name = "Unknown Company"

        # Location
        city = "India"
        location_el = soup.find(class_=re.compile(r"location|loc", re.I))
        if location_el:
            city = location_el.get_text(strip=True).split(",")[0].strip() or "India"

        # Experience
        exp_min = 0
        exp_max = 10
        exp_el = soup.find(string=re.compile(r"\d+\s*-\s*\d+\s*(yrs|years)", re.I))
        if exp_el:
            match = re.search(r"(\d+)\s*-\s*(\d+)", exp_el)
            if match:
                exp_min = int(match.group(1))
                exp_max = int(match.group(2))

        # Description — main content area
        desc_el = soup.find(class_=re.compile(r"job.?desc|description|jd", re.I))
        description = clean_html(str(desc_el)) if desc_el else ""

        # Posted date
        date_el = soup.find(string=re.compile(r"\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", re.I))
        posted_at = now
        if date_el:
            try:
                # Try parsing "15 Apr 2026" style
                match = re.search(r"(\d{1,2}\s+\w+\s+\d{4})", date_el)
                if match:
                    posted_at = datetime.strptime(match.group(1), "%d %b %Y").replace(tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                pass

        job_id = generate_job_id(company_name, title, city, str(posted_at.date()))

        return {
            "_id": job_id,
            "source": "iimjobs",
            "source_url": url,
            "apply_url": url,
            "ats_type": None,
            "company": {
                "name": company_name,
                "domain": "",
                "city": city,
                "industry": "",
                "size": "",
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "senior",
                "department": "",
                "type": "fulltime",
            },
            "location": {
                "city": city,
                "state": "",
                "country": "India",
                "remote": "remote" in (city + title).lower(),
                "hybrid": "hybrid" in (city + title).lower(),
            },
            "requirements": {
                "skills": [],
                "exp_years_min": exp_min,
                "exp_years_max": exp_max,
                "education": None,
            },
            "compensation": {
                "salary_min": None,
                "salary_max": None,
                "currency": "INR",
                "disclosed": False,
            },
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
        print(f"[IIMJOBS] HTML parse failed: {e}")
        return None


def _parse_from_jsonld(data: dict, url: str) -> dict | None:
    """Parse job from Schema.org JSON-LD."""
    try:
        title = data.get("title", "").strip()
        if not title:
            return None

        org = data.get("hiringOrganization", {})
        company_name = org.get("name", "").strip() if isinstance(org, dict) else ""
        if not company_name:
            return None

        now = datetime.now(timezone.utc)

        # Location
        job_location = data.get("jobLocation", {})
        if isinstance(job_location, list):
            job_location = job_location[0] if job_location else {}
        address = job_location.get("address", {}) if isinstance(job_location, dict) else {}
        city = address.get("addressLocality", "India") if isinstance(address, dict) else "India"
        state = address.get("addressRegion", "") if isinstance(address, dict) else ""

        # Date
        posted_str = data.get("datePosted", "")
        try:
            posted_at = datetime.fromisoformat(posted_str.replace("Z", "+00:00"))
            if posted_at.tzinfo is None:
                posted_at = posted_at.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            posted_at = now

        description = clean_html(data.get("description", ""))

        # Salary
        base_salary = data.get("baseSalary", {})
        salary_min = salary_max = None
        disclosed = False
        if isinstance(base_salary, dict):
            value = base_salary.get("value", {})
            if isinstance(value, dict):
                try:
                    salary_min = int(float(value.get("minValue", 0))) or None
                    salary_max = int(float(value.get("maxValue", 0))) or None
                    disclosed = salary_min is not None
                except (ValueError, TypeError):
                    pass

        job_id = generate_job_id(company_name, title, city, str(posted_at.date()))

        return {
            "_id": job_id,
            "source": "iimjobs",
            "source_url": url,
            "apply_url": url,
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
                "level": "senior",
                "department": "",
                "type": "fulltime",
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
            "compensation": {
                "salary_min": salary_min,
                "salary_max": salary_max,
                "currency": "INR",
                "disclosed": disclosed,
            },
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
        print(f"[IIMJOBS] JSON-LD parse failed: {e}")
        return None


async def crawl_iimjobs() -> list[dict]:
    """Crawl IIMJobs senior tech roles."""
    all_jobs: list[dict] = []
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(timeout=30, headers=HEADERS, follow_redirects=True) as client:
        for url_template in CATEGORY_URLS:
            for page in range(1, MAX_PAGES + 1):
                url = url_template.format(page=page)
                try:
                    resp = await client.get(url)
                    if resp.status_code == 404:
                        break
                    resp.raise_for_status()
                except httpx.HTTPError as e:
                    print(f"[IIMJOBS] Failed to fetch {url}: {e}")
                    break

                soup = BeautifulSoup(resp.text, "html.parser")

                # Find job detail links
                job_links = set()
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if "/job-details/" in href or re.match(r"/j/.*-\d+\.html", href):
                        if href.startswith("/"):
                            href = f"https://www.iimjobs.com{href}"
                        job_links.add(href)

                if not job_links:
                    # Try broader job link patterns
                    for a in soup.find_all("a", href=True):
                        href = a["href"]
                        if re.search(r"/j/[a-z].*\.html", href) and "jobs-" not in href:
                            if href.startswith("/"):
                                href = f"https://www.iimjobs.com{href}"
                            job_links.add(href)

                if not job_links:
                    break

                for job_url in job_links:
                    try:
                        job_resp = await client.get(job_url)
                        if job_resp.status_code != 200:
                            continue
                    except httpx.HTTPError:
                        continue

                    job_soup = BeautifulSoup(job_resp.text, "html.parser")

                    # Try JSON-LD first
                    jsonld = _extract_json_ld(job_soup)
                    if jsonld:
                        job = _parse_from_jsonld(jsonld, job_url)
                    else:
                        job = _parse_from_html(job_soup, job_url)

                    if job and job["_id"] not in seen_ids:
                        seen_ids.add(job["_id"])
                        all_jobs.append(job)

                    await asyncio.sleep(DELAY_BETWEEN_JOBS)

                category_name = url_template.split("/j/")[1].split("-{page}")[0] if "/j/" in url_template else "unknown"
                print(f"[IIMJOBS] {category_name} page {page}: {len(job_links)} links, {len(all_jobs)} total")
                await asyncio.sleep(DELAY_BETWEEN_PAGES)

    print(f"[IIMJOBS] Total unique jobs: {len(all_jobs)}")
    return all_jobs
