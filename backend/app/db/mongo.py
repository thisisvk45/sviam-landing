from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None

async def connect():
    global client, db
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=20,
        minPoolSize=5,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
    )
    db = client.sviam
    await _ensure_indexes()
    print("MongoDB connected")

async def _ensure_indexes():
    """Create indexes if they don't exist (idempotent)."""
    # Jobs collection — covers all query patterns
    await db.jobs.create_index([("is_active", 1), ("posted_at", -1)], name="active_posted")
    await db.jobs.create_index([("is_active", 1), ("location.city", 1)], name="active_city")
    await db.jobs.create_index([("is_active", 1), ("role.level", 1)], name="active_level")
    await db.jobs.create_index([("is_active", 1), ("location.remote", 1)], name="active_remote")
    await db.jobs.create_index("company.name", name="company_name")
    # Change detection + lifecycle indexes
    await db.jobs.create_index("content_hash", name="content_hash", sparse=True)
    await db.jobs.create_index([("company.name", 1), ("is_active", 1)], name="company_active")
    # Companies collection
    await db.companies.create_index("active", name="companies_active")
    await db.companies.create_index(
        [("active", 1), ("last_crawled", 1)],
        name="scheduler_query",
    )
    print("  Indexes ensured on jobs + companies")

async def disconnect():
    global client
    if client:
        client.close()
        print("MongoDB disconnected")

def get_db():
    return db
