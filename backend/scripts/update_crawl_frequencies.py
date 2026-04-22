"""One-time migration: update existing company docs with tiered crawl_frequency_hours."""

import asyncio
from app.db.mongo import connect, disconnect, get_db

# ATS type → polling interval in hours
ATS_FREQUENCIES = {
    "greenhouse": 0.083,   # 5 min
    "lever": 0.083,        # 5 min
    "ashby": 0.083,        # 5 min
    "darwinbox": 0.5,      # 30 min
    "adzuna": 24,
    "serpapi": 24,
    "indeed": 6,
    "internshala": 6,
}


async def main():
    await connect()
    db = get_db()

    updated = 0
    async for company in db.companies.find({}):
        ats = company.get("ats_type", "")
        new_freq = ATS_FREQUENCIES.get(ats, 24)
        old_freq = company.get("crawl_frequency_hours", 24)

        if old_freq != new_freq:
            await db.companies.update_one(
                {"_id": company["_id"]},
                {"$set": {"crawl_frequency_hours": new_freq}},
            )
            print(f"  {company['name']}: {old_freq}h → {new_freq}h")
            updated += 1

    print(f"\nUpdated {updated} companies")
    await disconnect()


if __name__ == "__main__":
    asyncio.run(main())
