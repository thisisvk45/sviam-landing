import asyncio
from app.db.mongo import connect, disconnect, get_db
from app.ingestion.sources.serpapi_jobs import crawl_serpapi
from app.config import settings

async def main():
    await connect()
    db = get_db()

    before = await db.jobs.count_documents({"is_active": True})
    print(f"Jobs before: {before}\n")

    print("=== SERPAPI GOOGLE JOBS ===")
    jobs = await crawl_serpapi(settings.serpapi_key)

    # Show sample of first 5 unique jobs
    print("\n--- Sample jobs ---")
    for job in jobs[:5]:
        print(f"  {job['role']['title']} at {job['company']['name']} ({job['location']['city']})")
    print("---\n")

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
    print(f"SerpApi: inserted {inserted} new, skipped {skipped}")
    print(f"Jobs before: {before}")
    print(f"Jobs after:  {after}")
    print(f"Net new:     {after - before}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
