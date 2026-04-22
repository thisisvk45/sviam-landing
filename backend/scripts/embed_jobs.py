import asyncio
import time
from app.db.mongo import connect, disconnect, get_db
from app.db.zilliz_client import connect_zilliz, get_zilliz
from app.ingestion.embedder import embed_text
from app.config import settings

BATCH_SIZE = 50


async def ensure_collection(client):
    """Verify collection exists and is ready."""
    col = settings.zilliz_collection
    collections = client.list_collections()
    if col not in collections:
        from pymilvus import CollectionSchema, FieldSchema, DataType
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=768),
        ]
        schema = CollectionSchema(fields=fields, enable_dynamic_field=True)
        client.create_collection(collection_name=col, schema=schema)
        index_params = client.prepare_index_params()
        index_params.add_index(field_name="vector", metric_type="COSINE")
        client.create_index(collection_name=col, index_params=index_params)
        client.load_collection(collection_name=col)
        print(f"Collection '{col}' created")
    else:
        print(f"Collection '{col}' exists")


async def main():
    start = time.time()

    await connect()
    await connect_zilliz()

    db = get_db()
    zilliz = get_zilliz()

    await ensure_collection(zilliz)

    # Fetch unembedded active jobs
    cursor = db.jobs.find({"is_active": True, "milvus_id": None})
    jobs = await cursor.to_list(length=None)

    # Also grab jobs where milvus_id field doesn't exist at all
    cursor2 = db.jobs.find({"is_active": True, "milvus_id": {"$exists": False}})
    jobs2 = await cursor2.to_list(length=None)

    # Deduplicate by _id
    seen = set()
    all_jobs = []
    for j in jobs + jobs2:
        jid = str(j["_id"])
        if jid not in seen:
            seen.add(jid)
            all_jobs.append(j)

    total = len(all_jobs)
    print(f"\nJobs to embed: {total}\n")

    if total == 0:
        print("Nothing to embed.")
        await disconnect()
        return

    embedded = 0
    failed = 0
    errors = []

    for batch_start in range(0, total, BATCH_SIZE):
        batch = all_jobs[batch_start:batch_start + BATCH_SIZE]
        batch_num = batch_start // BATCH_SIZE + 1

        vectors = []
        job_ids = []
        failed_in_batch = 0

        for job in batch:
            try:
                title = job.get("role", {}).get("title", "")
                company = job.get("company", {}).get("name", "")
                city = job.get("location", {}).get("city", "")
                raw_jd = job.get("raw_jd", "")[:1000]
                text = f"{title} {company} {city} {raw_jd}"

                vec = embed_text(text)
                vectors.append(vec)
                job_ids.append(str(job["_id"]))
            except Exception as e:
                failed += 1
                failed_in_batch += 1
                errors.append(f"{job.get('_id')}: {e}")

        if not vectors:
            print(f"Batch {batch_num}: all {failed_in_batch} jobs failed — skipping")
            continue

        # Bulk insert into Zilliz
        data = []
        for vec, jid in zip(vectors, job_ids):
            data.append({
                "vector": vec,
                "job_id": jid,
            })

        try:
            result = zilliz.insert(
                collection_name=settings.zilliz_collection,
                data=data,
            )
            if isinstance(result, dict):
                inserted_ids = result.get("ids", [])
            else:
                inserted_ids = list(result.primary_keys)
        except Exception as e:
            print(f"Batch {batch_num}: Zilliz insert failed — {e}")
            failed += len(vectors)
            continue

        # Update MongoDB with milvus_id
        for i, jid in enumerate(job_ids):
            mid = inserted_ids[i] if i < len(inserted_ids) else None
            if mid is not None:
                await db.jobs.update_one(
                    {"_id": jid},
                    {"$set": {"milvus_id": int(mid)}},
                )

        embedded += len(vectors)
        elapsed = time.time() - start
        rate = embedded / elapsed if elapsed > 0 else 0
        print(f"Batch {batch_num} complete — {embedded} jobs embedded so far ({rate:.1f} jobs/sec)")

    elapsed = time.time() - start

    # Final count
    with_milvus = await db.jobs.count_documents({"milvus_id": {"$exists": True, "$ne": None}})

    print(f"\n{'='*50}")
    print(f"Total jobs processed: {total}")
    print(f"Successfully embedded: {embedded}")
    print(f"Failed: {failed}")
    print(f"Time taken: {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"Jobs in MongoDB with milvus_id: {with_milvus}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for err in errors[:10]:
            print(f"  {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")

    print(f"{'='*50}")
    await disconnect()


if __name__ == "__main__":
    asyncio.run(main())
