import httpx
import hashlib
import json
from typing import Optional
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
import asyncio

BASE_URL = "https://internshala.com/jobs"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-IN,en;q=0.9",
}

TECH_CATEGORIES = [
    "software-development",
    "web-development",
    "data-science",
    "machine-learning",
    "android-development",
    "ios-development",
    "devops",
]

def generate_job_id(company: str, title: str, city: str, date: str) -> str:
    key = f"{company.lower()}|{title.lower()}|{city.lower()}|{date[:10]}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]

def extract_json_ld(soup: BeautifulSoup) -> Optional[dict]:
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, dict) and data.get("@type") == "JobPosting":
                return data
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("@type") == "JobPosting":
                        return item
        except Exception:
            continue
    return None

async def fetch_job_links(
    client: httpx.AsyncClient, category: str
) -> list[str]:
    url = f"{BASE_URL}/{category}"
    try:
        await asyncio.sleep(2)
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/jobs/detail/" in href:
                full = f"https://internshala.com{href}" if href.startswith("/") else href
                if full not in links:
                    links.append(full)
        return links[:20]
    except Exception as e:
        print(f"Failed to fetch Internshala category {category}: {e}")
        return []

async def fetch_job_detail(
    client: httpx.AsyncClient, url: str
) -> Optional[dict]:
    try:
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        return extract_json_ld(soup)
    except Exception as e:
        print(f"Failed to fetch Internshala job: {e}")
        return None

def build_job_from_jsonld(data: dict, source_url: str) -> Optional[dict]:
    try:
        title = data.get("title", "").strip()
        org = data.get("hiringOrganization", {})
        company = (org.get("name", "") if isinstance(org, dict) else str(org)).strip()
        if not title or not company:
            return None

        location_data = data.get("jobLocation", {})
        if isinstance(location_data, list):
            location_data = location_data[0] if location_data else {}
        address = location_data.get("address", {})
        city = address.get("addressLocality", "India").strip()

        remote_str = str(data.get("jobLocationType", "")).lower()
        remote = "remote" in remote_str

        posted_str = data.get("datePosted", "")
        try:
            posted_at = datetime.fromisoformat(posted_str).replace(tzinfo=timezone.utc)
        except Exception:
            posted_at = datetime.now(timezone.utc)

        description = BeautifulSoup(
            data.get("description", ""), "lxml"
        ).get_text(separator="\n").strip()

        now = datetime.now(timezone.utc)
        job_id = generate_job_id(company, title, city, str(posted_at.date()))

        return {
            "_id": job_id,
            "source": "internshala",
            "source_url": source_url,
            "apply_url": source_url,
            "ats_type": None,
            "company": {
                "name": company,
                "domain": (org.get("sameAs", "") if isinstance(org, dict) else ""),
                "city": city,
                "industry": "",
                "size": ""
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "entry",
                "department": "",
                "type": "fulltime"
            },
            "location": {
                "city": city,
                "state": address.get("addressRegion", ""),
                "country": "India",
                "remote": remote,
                "hybrid": False
            },
            "requirements": {
                "skills": [],
                "exp_years_min": 0,
                "exp_years_max": 3,
                "education": None
            },
            "compensation": {
                "salary_min": None,
                "salary_max": None,
                "currency": "INR",
                "disclosed": False
            },
            "raw_jd": description,
            "milvus_id": None,
            "posted_at": posted_at,
            "expires_at": posted_at + timedelta(days=45),
            "scraped_at": now,
            "updated_at": now,
            "is_active": True,
            "freshness_score": 1.0
        }
    except Exception as e:
        print(f"Failed to parse Internshala job: {e}")
        return None

async def crawl_internshala(max_per_category: int = 20) -> list[dict]:
    all_jobs = []
    seen_urls = set()

    # Semaphore for concurrent detail fetches (3 at a time per domain)
    sem = asyncio.Semaphore(3)

    async def fetch_with_limit(client: httpx.AsyncClient, url: str) -> Optional[dict]:
        async with sem:
            result = await fetch_job_detail(client, url)
            await asyncio.sleep(1)  # 1s between requests on same domain
            return result

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        for category in TECH_CATEGORIES:
            print(f"Fetching Internshala category: {category}")
            links = await fetch_job_links(client, category)

            # Filter out already-seen URLs
            new_urls = [u for u in links if u not in seen_urls]
            seen_urls.update(new_urls)

            # Fetch details concurrently with semaphore
            if new_urls:
                results = await asyncio.gather(
                    *[fetch_with_limit(client, url) for url in new_urls]
                )
                for url, data in zip(new_urls, results):
                    if data:
                        job = build_job_from_jsonld(data, url)
                        if job:
                            all_jobs.append(job)

            await asyncio.sleep(1)

    print(f"\nInternshala: total jobs extracted: {len(all_jobs)}")
    return all_jobs
