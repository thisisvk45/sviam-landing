import httpx
import hashlib
import asyncio
from typing import Optional
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup

ADZUNA_API = "https://api.adzuna.com/v1/api/jobs/in/search/{page}"

TECH_QUERIES = [
    "software engineer",
    "backend engineer",
    "frontend engineer",
    "data engineer",
    "machine learning",
    "devops",
    "product manager",
    "android developer",
    "ios developer",
    "full stack",
]

INDIA_CITIES = [
    "Bangalore", "Mumbai", "Hyderabad", "Pune",
    "Chennai", "Delhi", "Gurgaon", "Noida",
]

def generate_job_id(company: str, title: str, city: str, date: str) -> str:
    key = f"{company.lower()}|{title.lower()}|{city.lower()}|{date[:10]}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]

def clean_html(html: str) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(separator="\n").strip()

def parse_job(raw: dict) -> Optional[dict]:
    try:
        title = raw.get("title", "").strip()
        company_name = raw.get("company", {}).get("display_name", "").strip()
        if not title or not company_name:
            return None

        location_str = raw.get("location", {}).get("display_name", "India")
        area = raw.get("location", {}).get("area", [])
        city = area[-1] if area else location_str.split(",")[0].strip()
        state = area[-2] if len(area) >= 2 else ""

        created_str = raw.get("created", "")
        try:
            posted_at = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
        except Exception:
            posted_at = datetime.now(timezone.utc)

        salary_min = raw.get("salary_min")
        salary_max = raw.get("salary_max")
        if salary_min is not None:
            salary_min = int(salary_min)
        if salary_max is not None:
            salary_max = int(salary_max)

        description = clean_html(raw.get("description", ""))

        contract_type = raw.get("contract_type", "").lower()
        job_type = "fulltime"
        if "part" in contract_type:
            job_type = "parttime"
        elif "contract" in contract_type:
            job_type = "contract"

        now = datetime.now(timezone.utc)
        job_id = generate_job_id(company_name, title, city, str(posted_at.date()))

        return {
            "_id": job_id,
            "source": "adzuna",
            "source_url": raw.get("redirect_url", ""),
            "apply_url": raw.get("redirect_url", ""),
            "ats_type": None,
            "company": {
                "name": company_name,
                "domain": "",
                "city": city,
                "industry": raw.get("category", {}).get("label", ""),
                "size": ""
            },
            "role": {
                "title": title,
                "title_canonical": title,
                "level": "mid",
                "department": raw.get("category", {}).get("label", ""),
                "type": job_type
            },
            "location": {
                "city": city,
                "state": state,
                "country": "India",
                "remote": False,
                "hybrid": False
            },
            "requirements": {
                "skills": [],
                "exp_years_min": 0,
                "exp_years_max": 10,
                "education": None
            },
            "compensation": {
                "salary_min": salary_min,
                "salary_max": salary_max,
                "currency": "INR",
                "disclosed": salary_min is not None or salary_max is not None
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
        print(f"Failed to parse Adzuna job: {e}")
        return None

async def crawl_adzuna(app_id: str, app_key: str) -> list[dict]:
    all_jobs = []
    seen_ids = set()

    async with httpx.AsyncClient(timeout=30) as client:
        for query in TECH_QUERIES:
            for city in INDIA_CITIES:
                for page in range(1, 4):
                    url = ADZUNA_API.format(page=page)
                    params = {
                        "app_id": app_id,
                        "app_key": app_key,
                        "results_per_page": 50,
                        "what": query,
                        "where": city,
                    }
                    try:
                        response = await client.get(url, params=params)
                        if response.status_code == 401:
                            print("Adzuna: Invalid API credentials")
                            return all_jobs
                        response.raise_for_status()
                        data = response.json()
                    except Exception as e:
                        print(f"Adzuna failed for '{query}' in {city} p{page}: {e}")
                        continue

                    results = data.get("results", [])
                    if not results:
                        break

                    for raw in results:
                        job = parse_job(raw)
                        if job and job["_id"] not in seen_ids:
                            seen_ids.add(job["_id"])
                            all_jobs.append(job)

                    await asyncio.sleep(1)

                print(f"Adzuna: '{query}' in {city} — {len(all_jobs)} total so far")

    print(f"\nAdzuna: total unique jobs extracted: {len(all_jobs)}")
    return all_jobs
