import asyncio
import io
from PyPDF2 import PdfReader


def parse_resume(pdf_bytes: bytes) -> dict:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = reader.pages
    text = ""
    for page in pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    return {
        "raw_text": text.strip(),
        "char_count": len(text.strip()),
        "page_count": len(pages),
    }


async def async_parse_resume(pdf_bytes: bytes) -> dict:
    """Non-blocking PDF parse — runs in thread executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, parse_resume, pdf_bytes)
