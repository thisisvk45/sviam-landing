import asyncio
from app.db.mongo import connect, disconnect, get_db

async def main():
    await connect()
    db = get_db()

    # Mark these as inactive — confirmed no public API board
    dead = ["razorpay", "clevertap", "epifi"]
    for company_id in dead:
        await db.companies.update_one(
            {"_id": company_id},
            {"$set": {"active": False, "inactive_reason": "no_public_board"}}
        )
        print(f"Marked inactive: {company_id}")

    # Fix Groww — correct EU endpoint
    await db.companies.update_one(
        {"_id": "groww"},
        {"$set": {
            "greenhouse_token": "groww",
            "greenhouse_region": "eu",
            "active": True
        }}
    )
    print("Fixed Groww EU endpoint")

    active = await db.companies.count_documents({"active": True})
    print(f"\nActive companies: {active}")
    await disconnect()

if __name__ == "__main__":
    asyncio.run(main())
