import asyncio
from app.db.mongo import connect, disconnect, get_db
from app.ingestion.sources.adzuna import crawl_adzuna
from app.config import settings

async def main():
    await connect()
    db = get_db()

    before = await db.jobs.count_documents({"is_active": True})
    print(f"Jobs before: {before}\n")

    print("=== ADZUNA INDIA ===")
    jobs = await crawl_adzuna(settings.adzuna_app_id, settings.adzuna_app_key)

    inserted = 0
    skipped = 0
    for job in jobs:
        existing = await db.jobs.find_one({"_id": job["_id"]})
        if existing:
            skipped += 1
            continue
        try:
            await db.jobs.insert_one(job)
            inserted += 1
        except Exception as e:
            if "duplicate" in str(e).lower() or "11000" in str(e):
                skipped += 1
            else:
                print(f"Insert error: {e}")

    after = await db.jobs.count_documents({"is_active": True})
    print(f"\nAdzuna: inserted {inserted} new jobs")
    print(f"Jobs before: {before}")
    print(f"Jobs after:  {after}")
    print(f"Net new:     {after - before}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
