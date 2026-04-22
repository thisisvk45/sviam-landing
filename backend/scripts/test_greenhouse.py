import asyncio
from app.ingestion.sources.greenhouse import crawl_greenhouse
from app.db.mongo import connect, disconnect, get_db

# Three Indian companies confirmed on Greenhouse
TEST_COMPANIES = [
    {
        "name": "Razorpay",
        "greenhouse_token": "razorpay",
        "domain": "razorpay.com",
        "city": "Bengaluru",
        "industry": "Fintech",
        "size": "501-1000"
    },
    {
        "name": "Postman",
        "greenhouse_token": "postman",
        "domain": "postman.com",
        "city": "Bengaluru",
        "industry": "Developer Tools",
        "size": "501-1000"
    },
    {
        "name": "BrowserStack",
        "greenhouse_token": "browserstack",
        "domain": "browserstack.com",
        "city": "Mumbai",
        "industry": "SaaS",
        "size": "501-1000"
    }
]

async def main():
    await connect()
    db = get_db()

    total_inserted = 0

    for company in TEST_COMPANIES:
        jobs = await crawl_greenhouse(company)

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
    print(f"\nTotal inserted this run: {total_inserted}")
    print(f"Total jobs in MongoDB: {count}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
