"""Full pipeline test — runs all aggregator sources and reports results."""
import asyncio
import sys
import os
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main():
    from app.db.mongo import connect, disconnect, get_db
    from app.ingestion.pipeline import run_aggregator_pipeline

    print("=" * 60)
    print("SViam Full Pipeline Test")
    print("=" * 60)

    await connect()
    db = get_db()

    before = await db.jobs.count_documents({"is_active": True})
    print(f"\nJobs before: {before}")
    print("-" * 60)

    start = time.time()
    results = await run_aggregator_pipeline()
    elapsed = time.time() - start

    after = await db.jobs.count_documents({"is_active": True})

    print("\n" + "=" * 60)
    print("PIPELINE RESULTS")
    print("=" * 60)

    for source, data in results.items():
        if source != "summary":
            if isinstance(data, dict) and "error" in data:
                print(f"  {source}: FAILED — {data['error']}")
            elif isinstance(data, dict):
                print(f"  {source}: {data.get('fetched', 0)} fetched, {data.get('inserted', 0)} new, {data.get('updated', 0)} updated")
            else:
                print(f"  {source}: {data}")

    summary = results.get("summary", {})
    print(f"\n{'=' * 60}")
    print(f"Jobs before:      {before}")
    print(f"Jobs after:       {after}")
    print(f"Net new:          {after - before}")
    print(f"Total inserted:   {summary.get('total_inserted', 0)}")
    print(f"Total updated:    {summary.get('total_updated', 0)}")
    print(f"Embedded:         {summary.get('embedded', 0)}")
    print(f"Elapsed:          {elapsed:.0f}s ({elapsed/60:.1f} min)")
    print(f"{'=' * 60}")

    await disconnect()


if __name__ == "__main__":
    asyncio.run(main())
