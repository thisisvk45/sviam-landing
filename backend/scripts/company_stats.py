"""Show company and source breakdown from MongoDB."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main():
    from app.db.mongo import connect, disconnect, get_db

    await connect()
    db = get_db()

    total = await db.jobs.count_documents({"is_active": True})
    print(f"Total active jobs: {total}")
    print()

    # Jobs by source
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    print("BY SOURCE:")
    async for doc in db.jobs.aggregate(pipeline):
        src = doc["_id"] or "unknown"
        cnt = doc["count"]
        print(f"  {src:<20s} {cnt:>6,}")

    print()

    # Top companies by job count
    pipeline2 = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$company.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30},
    ]
    print("TOP 30 COMPANIES:")
    async for doc in db.jobs.aggregate(pipeline2):
        name = doc["_id"] or "unknown"
        cnt = doc["count"]
        print(f"  {name:<35s} {cnt:>5,}")

    print()

    # Total unique companies
    pipeline3 = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$company.name"}},
        {"$count": "total"},
    ]
    async for doc in db.jobs.aggregate(pipeline3):
        print(f"Total unique companies: {doc['total']}")

    print()

    # Jobs by city
    pipeline4 = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$location.city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]
    print("TOP 15 CITIES:")
    async for doc in db.jobs.aggregate(pipeline4):
        city = doc["_id"] or "unknown"
        cnt = doc["count"]
        print(f"  {city:<25s} {cnt:>6,}")

    print()

    # ATS-tracked companies
    companies = await db.companies.find({"active": True}).to_list(None)
    print(f"ATS-tracked companies (5-min polling): {len(companies)}")
    for c in companies:
        name = c["name"]
        ats = c.get("ats_type", "?")
        last = str(c.get("last_crawled", "never"))[:19]
        print(f"  {name:<25s} | {ats:<12s} | last: {last}")

    await disconnect()


if __name__ == "__main__":
    asyncio.run(main())
