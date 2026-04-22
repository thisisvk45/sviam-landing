import asyncio
from app.db.mongo import connect, disconnect, get_db
from app.ingestion.sources.indeed import crawl_indeed
from app.ingestion.sources.internshala import crawl_internshala

async def insert_jobs(db, jobs: list[dict], source: str) -> int:
    inserted = 0
    for job in jobs:
        existing = await db.jobs.find_one({"_id": job["_id"]})
        if existing:
            continue
        try:
            await db.jobs.insert_one(job)
            inserted += 1
        except Exception as e:
            if "duplicate" in str(e).lower() or "11000" in str(e):
                pass
            else:
                print(f"Insert error: {e}")
    print(f"{source}: inserted {inserted} new jobs")
    return inserted

async def main():
    await connect()
    db = get_db()

    before = await db.jobs.count_documents({"is_active": True})
    print(f"Jobs before: {before}\n")

    # Run Indeed
    print("=== INDEED INDIA ===")
    indeed_jobs = await crawl_indeed()
    await insert_jobs(db, indeed_jobs, "Indeed")

    # Run Internshala
    print("\n=== INTERNSHALA ===")
    internshala_jobs = await crawl_internshala()
    await insert_jobs(db, internshala_jobs, "Internshala")

    after = await db.jobs.count_documents({"is_active": True})
    print(f"\nJobs before: {before}")
    print(f"Jobs after:  {after}")
    print(f"Net new:     {after - before}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
