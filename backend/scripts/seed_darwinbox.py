import asyncio
from datetime import datetime, timezone
from app.db.mongo import connect, disconnect, get_db

DARWINBOX_COMPANIES = [
    {
        "_id": "perfios",
        "name": "Perfios",
        "domain": "perfios.com",
        "ats_type": "darwinbox",
        "darwinbox_subdomain": "perfios",
        "careers_url": "https://www.perfios.com/careers",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 24,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "porter",
        "name": "Porter",
        "domain": "porter.in",
        "ats_type": "darwinbox",
        "darwinbox_subdomain": "porter",
        "careers_url": "https://porter.in/careers",
        "city": "Bengaluru",
        "industry": "Logistics",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 24,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "godigit",
        "name": "Digit Insurance",
        "domain": "godigit.com",
        "ats_type": "darwinbox",
        "darwinbox_subdomain": "godigit",
        "careers_url": "https://www.godigit.com/careers",
        "city": "Bengaluru",
        "industry": "Insurtech",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 24,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "leadsquaredhrms",
        "name": "LeadSquared",
        "domain": "leadsquared.com",
        "ats_type": "darwinbox",
        "darwinbox_subdomain": "leadsquaredhrms",
        "careers_url": "https://www.leadsquared.com/careers/",
        "city": "Bengaluru",
        "industry": "CRM / SaaS",
        "size": "501-1000",
        "active": True,
        "crawl_frequency_hours": 24,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
]

async def main():
    await connect()
    db = get_db()
    inserted = 0
    for company in DARWINBOX_COMPANIES:
        existing = await db.companies.find_one({"_id": company["_id"]})
        if existing:
            print(f"Already exists: {company['name']}")
            continue
        await db.companies.insert_one(company)
        inserted += 1
        print(f"Inserted: {company['name']}")

    total = await db.companies.count_documents({"active": True})
    print(f"\nInserted: {inserted} | Active companies total: {total}")
    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
