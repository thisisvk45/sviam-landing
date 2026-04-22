import asyncio
import hashlib
import re
from typing import Optional
from datetime import datetime, timezone, timedelta
from serpapi import GoogleSearch


QUERIES = [
    "software engineer",
    "backend engineer",
    "frontend engineer",
    "full stack developer",
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "devops engineer",
    "product manager",
    "android developer",
    "ios developer",
    "platform engineer",
    "site reliability engineer",
    "software development engineer",
    "SDE",
    "cloud engineer",
    "security engineer",
    "mobile developer",
    "python developer",
    "java developer",
]

# Date-based queries added dynamically
DATE_QUERIES = [
    "software engineer",
    "backend engineer",
]

LOCATIONS = [
    "Bangalore Karnataka India",
    "Hyderabad Telangana India",
    "Pune Maharashtra India",
    "Mumbai Maharashtra India",
    "Chennai Tamil Nadu India",
    "Gurgaon Haryana India",
    "Noida Uttar Pradesh India",
    "India",
]

# Note: 20 queries x 8 locations x 3 pages = 480 max API calls per run


def generate_job_id(company: str, title: str, city: str, date: str) -> str:
    key = f"{company.lower()}|{title.lower()}|{city.lower()}|{date[:10]}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def parse_relative_date(posted_str: str) -> datetime:
    """Convert '5 days ago', '3 hours ago', etc. to absolute datetime."""
    now = datetime.now(timezone.utc)
    if not posted_str:
        return now

    posted_lower = posted_str.lower().strip()

    match = re.search(r"(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago", posted_lower)
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        if unit == "second":
            return now - timedelta(seconds=amount)
        elif unit == "minute":
            return now - timedelta(minutes=amount)
        elif unit == "hour":
            return now - timedelta(hours=amount)
        elif unit == "day":
            return now - timedelta(days=amount)
        elif unit == "week":
            return now - timedelta(weeks=amount)
        elif unit == "month":
            return now - timedelta(days=amount * 30)
        elif unit == "year":
            return now - timedelta(days=amount * 365)

    if "just" in posted_lower or "now" in posted_lower or "today" in posted_lower:
        return now

    return now


def parse_salary(salary_str: str) -> dict:
    """Parse salary strings like '₹25,00,000–₹35,00,000 a year'."""
    if not salary_str:
        return {"salary_min": None, "salary_max": None, "disclosed": False}

    numbers = re.findall(r"[\d,]+", salary_str.replace(",", ""))
    # Indian format: remove commas and parse
    raw_numbers = re.findall(r"[\d]+", salary_str.replace(",", "").replace(" ", ""))

    # Try to extract meaningful salary numbers (filter out very small numbers)
    salaries = []
    for n in raw_numbers:
        try:
            val = int(n)
            if val > 1000:  # Likely a salary, not a random number
                salaries.append(val)
        except ValueError:
            continue

    if not salaries:
        return {"salary_min": None, "salary_max": None, "disclosed": False}

    # Check if monthly — multiply by 12
    is_monthly = "month" in salary_str.lower()
    multiplier = 12 if is_monthly else 1

    salary_min = salaries[0] * multiplier if len(salaries) >= 1 else None
    salary_max = salaries[1] * multiplier if len(salaries) >= 2 else salary_min

    return {
        "salary_min": salary_min,
        "salary_max": salary_max,
        "disclosed": True,
    }


def map_schedule_type(schedule: str) -> str:
    if not schedule:
        return "fulltime"
    s = schedule.lower()
    if "part" in s:
        return "parttime"
    if "contract" in s:
        return "contract"
    if "intern" in s:
        return "internship"
    return "fulltime"


def parse_job(raw: dict) -> Optional[dict]:
    """Map a SerpApi google_jobs result to our standard schema."""
    try:
        title = (raw.get("title") or "").strip()
        company_name = (raw.get("company_name") or "").strip()
        if not title or not company_name:
            return None

        location_str = raw.get("location", "India")
        city = location_str.split(",")[0].strip() if location_str else "India"

        extensions = raw.get("detected_extensions", {})
        posted_str = extensions.get("posted_at", "")
        posted_at = parse_relative_date(posted_str)

        salary_data = parse_salary(extensions.get("salary", ""))
        schedule = extensions.get("schedule_type", "Full-time")
        job_type = map_schedule_type(schedule)

        # Use SerpApi job_id as dedup key if available
        serpapi_job_id = raw.get("job_id")
        if serpapi_job_id:
            job_id = hashlib.sha256(serpapi_job_id.encode()).hexdigest()[:32]
        else:
            job_id = generate_job_id(company_name, title, city, str(posted_at.date()))

        # Get apply URL from related_links
        apply_url = ""
        related = raw.get("related_links", [])
        if related and isinstance(related, list):
            first = related[0] if related else {}
            if isinstance(first, dict):
                apply_url = first.get("link", "")

        description = raw.get("description", "")
        now = datetime.now(timezone.utc)

        return {
            "_id": job_id,
            "source": "serpapi",
            "source_url": apply_url,
            "apply_url": apply_url,
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
                "level": "mid",
                "department": "",
                "type": job_type,
            },
            "location": {
                "city": city,
                "state": "",
                "country": "India",
                "remote": "remote" in location_str.lower(),
                "hybrid": "hybrid" in location_str.lower(),
            },
            "requirements": {
                "skills": [],
                "exp_years_min": 0,
                "exp_years_max": 10,
                "education": None,
            },
            "compensation": {
                "salary_min": salary_data["salary_min"],
                "salary_max": salary_data["salary_max"],
                "currency": "INR",
                "disclosed": salary_data["disclosed"],
            },
            "raw_jd": description,
            "milvus_id": None,
            "posted_at": posted_at,
            "expires_at": posted_at + timedelta(days=45),
            "scraped_at": now,
            "updated_at": now,
            "is_active": True,
            "freshness_score": 1.0,
        }
    except Exception as e:
        print(f"Failed to parse SerpApi job: {e}")
        return None


async def crawl_serpapi(api_key: str) -> list[dict]:
    all_jobs = []
    seen_ids = set()

    # Build full query list including date-based queries
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    full_queries = list(QUERIES)
    for q in DATE_QUERIES:
        full_queries.append(f"{q} after:{yesterday}")

    total_queries = len(full_queries) * len(LOCATIONS)
    completed = 0

    for query in full_queries:
        for location in LOCATIONS:
            completed += 1
            next_page_token = None

            for page in range(3):
                params = {
                    "engine": "google_jobs",
                    "q": query,
                    "location": location,
                    "gl": "in",
                    "hl": "en",
                    "api_key": api_key,
                }
                if next_page_token:
                    params["next_page_token"] = next_page_token

                try:
                    # SerpApi client is synchronous, run in executor
                    loop = asyncio.get_event_loop()
                    search = GoogleSearch(params)
                    result = await loop.run_in_executor(None, search.get_dict)
                except Exception as e:
                    print(f"SerpApi error for '{query}' in {location}: {e}")
                    break

                jobs_results = result.get("jobs_results", [])
                if not jobs_results:
                    break

                for raw in jobs_results:
                    job = parse_job(raw)
                    if job and job["_id"] not in seen_ids:
                        seen_ids.add(job["_id"])
                        all_jobs.append(job)

                # Check for next page
                serpapi_pagination = result.get("serpapi_pagination", {})
                next_page_token = serpapi_pagination.get("next_page_token")
                if not next_page_token:
                    break

                await asyncio.sleep(0.5)

            print(
                f"[{completed}/{total_queries}] '{query[:30]}' in {location.split()[0]} — {len(all_jobs)} total"
            )
            await asyncio.sleep(0.5)

    print(f"\nSerpApi: total unique jobs extracted: {len(all_jobs)}")
    return all_jobs
