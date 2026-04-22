import asyncio
from datetime import datetime, timezone
from app.db.mongo import connect, disconnect, get_db

COMPANIES = [
    # GREENHOUSE — 5 min polling (free JSON API)
    {
        "_id": "postman",
        "name": "Postman",
        "domain": "postman.com",
        "ats_type": "greenhouse",
        "greenhouse_token": "postman",
        "careers_url": "https://www.postman.com/company/careers/",
        "city": "Bengaluru",
        "industry": "Developer Tools",
        "size": "501-1000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "groww",
        "name": "Groww",
        "domain": "groww.in",
        "ats_type": "greenhouse",
        "greenhouse_token": "groww",
        "greenhouse_region": "eu",
        "careers_url": "https://groww.in/careers",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "razorpay",
        "name": "Razorpay",
        "domain": "razorpay.com",
        "ats_type": "greenhouse",
        "greenhouse_token": "razorpay",
        "careers_url": "https://razorpay.com/jobs/",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "phonepe",
        "name": "PhonePe",
        "domain": "phonepe.com",
        "ats_type": "greenhouse",
        "greenhouse_token": "phonepe",
        "careers_url": "https://www.phonepe.com/careers/",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "5001-10000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    # LEVER — 5 min polling (free JSON API)
    {
        "_id": "cred",
        "name": "CRED",
        "domain": "cred.club",
        "ats_type": "lever",
        "lever_token": "cred",
        "careers_url": "https://careers.cred.club",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "501-1000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "meesho",
        "name": "Meesho",
        "domain": "meesho.com",
        "ats_type": "lever",
        "lever_token": "meesho",
        "careers_url": "https://meesho.io/jobs",
        "city": "Bengaluru",
        "industry": "E-Commerce",
        "size": "1001-5000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "clevertap",
        "name": "CleverTap",
        "domain": "clevertap.com",
        "ats_type": "lever",
        "lever_token": "clevertap",
        "careers_url": "https://clevertap.com/careers/",
        "city": "Mumbai",
        "industry": "MarTech",
        "size": "501-1000",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
    {
        "_id": "epifi",
        "name": "Fi Money",
        "domain": "fi.money",
        "ats_type": "lever",
        "lever_token": "epifi",
        "careers_url": "https://fi.money/careers",
        "city": "Bengaluru",
        "industry": "Neobanking",
        "size": "201-500",
        "active": True,
        "crawl_frequency_hours": 0.083,
        "total_jobs_indexed": 0,
        "last_crawled": None,
        "added_at": datetime.now(timezone.utc)
    },
]

async def main():
    await connect()
    db = get_db()

    inserted = 0
    skipped = 0

    for company in COMPANIES:
        existing = await db.companies.find_one({"_id": company["_id"]})
        if existing:
            skipped += 1
            continue
        await db.companies.insert_one(company)
        inserted += 1
        print(f"Inserted: {company['name']}")

    total = await db.companies.count_documents({})
    print(f"\nInserted: {inserted} | Skipped: {skipped} | Total in DB: {total}")
    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
