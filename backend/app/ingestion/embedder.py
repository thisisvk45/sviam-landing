import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

_model = None
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="embed")


def _get_model():
    global _model
    if _model is None:
        print("Loading embedding model (first use)...")
        t0 = time.perf_counter()
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
        t1 = time.perf_counter()
        print(f"Embedding model loaded in {t1 - t0:.1f}s")
    return _model


async def warmup_model():
    """Pre-load the embedding model at startup (in a thread to avoid blocking)."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _get_model)


def embed_text(text: str) -> list[float]:
    model = _get_model()
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist()


async def async_embed_text(text: str) -> list[float]:
    """Non-blocking embedding — runs in dedicated thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, embed_text, text)
