import asyncio
from app.db.mongo import connect, disconnect, get_db

async def main():
    await connect()
    db = get_db()

    # Ping the database
    result = await db.command("ping")
    print(f"Ping result: {result}")

    # Count documents in jobs collection (will be 0, that is fine)
    count = await db.jobs.count_documents({})
    print(f"Jobs in database: {count}")

    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
