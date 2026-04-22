import asyncio
from typing import Optional
from pymilvus import MilvusClient
from app.config import settings

_client: Optional[MilvusClient] = None


def get_zilliz() -> MilvusClient:
    global _client
    if _client is None:
        # Lazy-connect on first use if startup connection failed/timed out
        _client = MilvusClient(
            uri=settings.zilliz_uri,
            token=settings.zilliz_token,
        )
        print("Zilliz connected (lazy)")
    return _client


async def connect_zilliz():
    global _client
    # MilvusClient() is synchronous — run in thread so it can be timed out
    loop = asyncio.get_event_loop()
    _client = await loop.run_in_executor(
        None,
        lambda: MilvusClient(uri=settings.zilliz_uri, token=settings.zilliz_token),
    )
    print("Zilliz connected")


async def async_search_zilliz(vector, limit: int = 100, collection: str = None):
    """Non-blocking Zilliz search — MilvusClient is synchronous."""
    zilliz = get_zilliz()
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: zilliz.search(
            collection_name=collection or settings.zilliz_collection,
            data=[vector],
            limit=limit,
            output_fields=["job_id"],
            search_params={"metric_type": "COSINE", "params": {"ef": 200}},
        ),
    )
