import asyncio
from typing import Optional
from supabase import create_client, Client
from app.config import settings

_client: Optional[Client] = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        # Lazy-connect on first use if startup connection failed/timed out
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        print("Supabase connected (lazy)")
    return _client


async def connect_supabase():
    global _client
    loop = asyncio.get_event_loop()
    _client = await loop.run_in_executor(
        None,
        lambda: create_client(settings.supabase_url, settings.supabase_service_role_key),
    )
    print("Supabase connected")


async def run_supabase(fn):
    """Run a synchronous Supabase operation without blocking the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fn)
