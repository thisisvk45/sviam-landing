import httpx
import hashlib
import json
from typing import Optional
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
import asyncio

BASE_URL = "https://in.indeed.com/jobs"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

TECH_QUERIES = [
    "software engineer",
    "backend engineer",
    "frontend engineer",
    "full stack developer",
    "data engineer",
    "machine learning engineer",
    "devops engineer",
    "product manager tech",
    "mobile developer",
    "android developer",
    "ios developer",
]

INDIA_CITIES = [
    "Bengaluru", "Mumbai", "Hyderabad",
    "Pune", "Chennai", "Delhi", "Gurugram", "Noida"
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

def parse_salary(salary_data: dict) -> dict:
    if not salary_data:
        return {"salary_min": None, "salary_max": None, "disclosed": False}
    try:
        value = salary_data.get("value", {})
        min_val = int(value.get("minValue", 0) or 0)
        max_val = int(value.get("maxValue", 0) or 0)
        unit = value.get("unitText", "YEAR")
        if unit == "MONTH":
            min_val *= 12
            max_val *= 12
        return {
            "salary_min": min_val if min_val > 0 else None,
            "salary_max": max_val if max_val > 0 else None,
            "disclosed": min_val > 0 or max_val > 0
        }
    except Exception:
        return {"salary_min": None, "salary_max": None, "disclosed": False}

async def fetch_job_detail(client: httpx.AsyncClient, job_url: str) -> Optional[dict]:
    try:
        response = await client.get(job_url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        return extract_json_ld(soup)
    except Exception as e:
        print(f"Failed to fetch job detail: {e}")
        return None

async def fetch_search_results(
    client: httpx.AsyncClient, query: str, location: str, start: int = 0
) -> list[str]:
    params = {
        "q": query,
        "l": location,
        "start": start,
        "fromage": 14,
    }
    try:
        await asyncio.sleep(2)
        response = await client.get(BASE_URL, params=params, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/pagead/clk" in href or "/rc/clk" in href:
                continue
            if "/viewjob" in href or "/clk" in href:
                full = f"https://in.indeed.com{href}" if href.startswith("/") else href
                if full not in links:
                    links.append(full)
        return links[:15]
    except Exception as e:
        print(f"Search failed for '{query}' in {location}: {e}")
        return []

def build_job_from_jsonld(data: dict, source_url: str) -> Optional[dict]:
    try:
        title = data.get("title", "").strip()
        company = (
            data.get("hiringOrganization", {}).get("name", "")
            or data.get("hiringOrganization", "")
        ).strip()
        if not title or not company:
            return None

        location_data = data.get("jobLocation", {})
        if isinstance(location_data, list):
            location_data = location_data[0] if location_data else {}
        address = location_data.get("address", {})
        city = (
            address.get("addressLocality", "")
            or address.get("addressRegion", "India")
        ).strip()

        remote_str = str(data.get("jobLocationType", "")).lower()
        remote = "remote" in remote_str

        posted_str = data.get("datePosted", "")
        try:
            posted_at = datetime.fromisoformat(posted_str).replace(tzinfo=timezone.utc)
        except Exception:
            posted_at = datetime.now(timezone.utc)

        salary = parse_salary(data.get("baseSalary"))
        description = BeautifulSoup(
            data.get("description", ""), "lxml"
        ).get_text(separator="\n").strip()

        employment_type = data.get("employmentType", "FULL_TIME")
        job_type = "fulltime"
        if "PART" in employment_type:
            job_type = "parttime"
        elif "CONTRACT" in employment_type:
            job_type = "contract"
        elif "INTERN" in employment_type:
            job_type = "internship"

        now = datetime.now(timezone.utc)
        job_id = generate_job_id(company, title, city, str(posted_at.date()))

        return {
            "_id": job_id,
            "source": "indeed",
            "source_url": source_url,
            "apply_url": data.get("url", source_url),
            "ats_type": None,
            "company": {
                "name": company,
                "domain": "",
                "city": city,
                "industry": "",
                "size": ""
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "mid",
                "department": "",
                "type": job_type
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
                "exp_years_max": 10,
                "education": data.get("educationRequirements", {}).get("credentialCategory")
            },
            "compensation": {
                "salary_min": salary["salary_min"],
                "salary_max": salary["salary_max"],
                "currency": "INR",
                "disclosed": salary["disclosed"]
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
        print(f"Failed to parse job JSON-LD: {e}")
        return None

async def crawl_indeed(max_per_query: int = 15) -> list[dict]:
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
        for query in TECH_QUERIES[:5]:
            for city in INDIA_CITIES[:4]:
                print(f"Searching: '{query}' in {city}")
                urls = await fetch_search_results(client, query, city)

                # Filter out already-seen URLs
                new_urls = [u for u in urls if u not in seen_urls]
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

    print(f"\nIndeed: total jobs extracted: {len(all_jobs)}")
    return all_jobs
