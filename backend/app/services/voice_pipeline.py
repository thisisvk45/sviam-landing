"""Streaming voice pipeline: Deepgram Nova-3 STT + Cartesia Sonic-3 TTS."""
from __future__ import annotations

import asyncio
import logging
from typing import Callable, Awaitable

import httpx
from deepgram import AsyncDeepgramClient
from deepgram.core.events import EventType
from deepgram.listen import ListenV1Results, ListenV1UtteranceEnd

from app.config import settings

logger = logging.getLogger(__name__)

# ── Constants ──
MAX_AUDIO_CHUNK_BYTES = 32_768  # 32KB decoded — ~1s of 16kHz PCM16
MAX_TTS_TEXT_LENGTH = 2_000  # Cartesia cap — prevents credit burn on runaway text
AUDIO_IN_RATE_LIMIT = 25  # max audio_in messages per second
MAX_ACCUMULATED_SPEECH = 50_000  # chars — prevent unbounded growth

# Reusable httpx client for Cartesia TTS (connection pooling)
_tts_client: httpx.AsyncClient | None = None


def _get_tts_client() -> httpx.AsyncClient:
    global _tts_client
    if _tts_client is None or _tts_client.is_closed:
        _tts_client = httpx.AsyncClient(timeout=30)
    return _tts_client


def voice_pipeline_available() -> bool:
    """Return True if all voice pipeline credentials are configured."""
    return bool(
        settings.deepgram_api_key
        and settings.cartesia_api_key
        and settings.cartesia_voice_id
    )


class DeepgramSTTSession:
    """Wraps a Deepgram v6 async streaming client for real-time STT.

    Uses AsyncDeepgramClient with listen.v1.connect() context manager.
    start_listening() runs in a background task to process incoming events.
    """

    def __init__(
        self,
        *,
        on_transcript_partial: Callable[[str], Awaitable[None]],
        on_transcript_final: Callable[[str], Awaitable[None]],
        on_utterance_end: Callable[[], Awaitable[None]],
        on_disconnect: Callable[[], Awaitable[None]] | None = None,
    ) -> None:
        self._on_partial = on_transcript_partial
        self._on_final = on_transcript_final
        self._on_utterance_end = on_utterance_end
        self._on_disconnect = on_disconnect
        self._paused = False
        self._socket = None  # AsyncV1SocketClient
        self._ctx = None  # async context manager
        self._listen_task: asyncio.Task | None = None
        self._closed = False

    async def start(self) -> None:
        client = AsyncDeepgramClient(api_key=settings.deepgram_api_key)
        self._ctx = client.listen.v1.connect(
            model="nova-3",
            language="en",
            encoding="linear16",
            sample_rate=16000,
            interim_results=True,
            utterance_end_ms="1000",
            endpointing=300,
        )
        self._socket = await self._ctx.__aenter__()

        # Register message handler
        self._socket.on(EventType.MESSAGE, self._on_message)

        # Run start_listening in background — it loops until connection closes
        self._listen_task = asyncio.create_task(self._listen_loop())

    async def _listen_loop(self) -> None:
        try:
            await self._socket.start_listening()
        except Exception as e:
            logger.warning("[Deepgram] Listen loop ended: %s", e)
        finally:
            # Connection dropped — notify so frontend can fall back to browser STT
            if not self._closed and self._on_disconnect:
                try:
                    await self._on_disconnect()
                except Exception:
                    pass

    async def _on_message(self, message) -> None:
        """Dispatch Deepgram events to appropriate callbacks."""
        if isinstance(message, ListenV1Results):
            alts = message.channel.alternatives if message.channel else []
            if not alts:
                return
            text = alts[0].transcript.strip() if alts[0].transcript else ""
            if not text:
                return
            if message.is_final:
                await self._on_final(text)
            else:
                await self._on_partial(text)
        elif isinstance(message, ListenV1UtteranceEnd):
            await self._on_utterance_end()

    async def send_audio(self, data: bytes) -> None:
        """Forward PCM16 audio bytes to Deepgram. No-ops when paused."""
        if self._paused or self._socket is None or self._closed:
            return
        try:
            await self._socket.send_media(data)
        except Exception:
            pass

    def pause(self) -> None:
        self._paused = True

    def resume(self) -> None:
        self._paused = False

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        if self._socket is not None:
            try:
                await self._socket.send_close_stream()
            except Exception:
                pass
        if self._listen_task is not None:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except (asyncio.CancelledError, Exception):
                pass
        if self._ctx is not None:
            try:
                await self._ctx.__aexit__(None, None, None)
            except Exception:
                pass
        self._socket = None


async def synthesize_speech_streaming(text: str):
    """Async generator yielding PCM16 audio chunks from Cartesia Sonic-3.

    Yields 4096-byte chunks as they stream in from the API.
    Output format: pcm_s16le at 24000 Hz.
    Text is capped at MAX_TTS_TEXT_LENGTH to prevent credit burn.
    """
    # Truncate overlong text — never send unbounded strings to Cartesia
    if len(text) > MAX_TTS_TEXT_LENGTH:
        text = text[:MAX_TTS_TEXT_LENGTH].rsplit(" ", 1)[0] + "..."

    url = "https://api.cartesia.ai/tts/bytes"
    headers = {
        "X-API-Key": settings.cartesia_api_key,
        "Cartesia-Version": "2025-04-16",
        "Content-Type": "application/json",
    }
    payload = {
        "model_id": "sonic-3",
        "transcript": text,
        "voice": {"mode": "id", "id": settings.cartesia_voice_id},
        "output_format": {
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 24000,
        },
        "speed": "normal",
        "generation_config": {
            "speed": 1,
            "volume": 1,
        },
    }

    client = _get_tts_client()
    async with client.stream("POST", url, json=payload, headers=headers) as resp:
        resp.raise_for_status()
        async for chunk in resp.aiter_bytes(4096):
            yield chunk
