import asyncio
from app.db.zilliz_client import connect_zilliz, get_zilliz
from app.ingestion.embedder import embed_text
from app.config import settings


async def main():
    # Connect
    await connect_zilliz()
    client = get_zilliz()

    # List collections
    collections = client.list_collections()
    print(f"Collections: {collections}")
    assert settings.zilliz_collection in collections, (
        f"{settings.zilliz_collection} not found in {collections}"
    )
    print(f"'{settings.zilliz_collection}' collection found")

    # Describe collection schema
    info = client.describe_collection(collection_name=settings.zilliz_collection)
    print(f"Schema: {info}")

    # Embed test sentence
    test_text = "Senior Software Engineer Python Bangalore"
    vector = embed_text(test_text)
    print(f"Embedding dimension: {len(vector)}")
    assert len(vector) == 768, f"Expected 768, got {len(vector)}"

    # Insert test vector
    client.insert(
        collection_name=settings.zilliz_collection,
        data=[{
            "primary_key": 1,
            "vector": vector,
        }],
    )
    print("Test vector inserted")

    # Query with the same vector
    results = client.search(
        collection_name=settings.zilliz_collection,
        data=[vector],
        limit=1,
        output_fields=["primary_key"],
    )
    print(f"Query result: {results}")
    assert len(results) > 0 and len(results[0]) > 0, "No results returned"
    print(f"Returned primary_key: {results[0][0]['id']}")

    print("\nZilliz connection test passed")


if __name__ == "__main__":
    asyncio.run(main())
