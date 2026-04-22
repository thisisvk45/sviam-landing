import asyncio
from app.db.mongo import connect, disconnect, get_db
from app.ingestion.pipeline import run_all

async def main():
    await connect()
    await run_all()

    db = get_db()
    total = await db.jobs.count_documents({"is_active": True})
    print(f"Total active jobs in MongoDB: {total}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
