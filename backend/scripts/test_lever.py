import asyncio
from app.ingestion.sources.lever import crawl_lever
from app.db.mongo import connect, disconnect, get_db

LEVER_COMPANIES = [
    {
        "name": "CRED",
        "lever_token": "cred",
        "domain": "cred.club",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "501-1000"
    },
    {
        "name": "Meesho",
        "lever_token": "meesho",
        "domain": "meesho.com",
        "city": "Bengaluru",
        "industry": "E-Commerce",
        "size": "1001-5000"
    },
    {
        "name": "CleverTap",
        "lever_token": "clevertap",
        "domain": "clevertap.com",
        "city": "Mumbai",
        "industry": "MarTech",
        "size": "501-1000"
    },
    {
        "name": "Fi Money",
        "lever_token": "epifi",
        "domain": "fi.money",
        "city": "Bengaluru",
        "industry": "Neobanking",
        "size": "201-500"
    },
]

async def main():
    await connect()
    db = get_db()

    total_inserted = 0

    for company in LEVER_COMPANIES:
        jobs = await crawl_lever(company)
        for job in jobs:
            existing = await db.jobs.find_one({"_id": job["_id"]})
            if existing:
                continue
            try:
                await db.jobs.insert_one(job)
                total_inserted += 1
            except Exception as e:
                if "duplicate" not in str(e).lower() and "11000" not in str(e):
                    print(f"Insert error: {e}")
        await asyncio.sleep(1)

    count = await db.jobs.count_documents({"is_active": True})
    print(f"\nInserted this run: {total_inserted}")
    print(f"Total jobs in MongoDB: {count}")
    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
