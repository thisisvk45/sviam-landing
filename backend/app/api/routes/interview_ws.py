"""WebSocket endpoint for real-time interview sessions."""
from __future__ import annotations

import asyncio
import base64
import json
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.supabase_client import get_supabase, run_supabase
from app.services.interview_ai import (
    analyze_typing_cadence,
    generate_first_question,
    generate_follow_up,
    generate_scorecard,
    should_interrupt,
)
from app.services.voice_pipeline import (
    AUDIO_IN_RATE_LIMIT,
    MAX_ACCUMULATED_SPEECH,
    MAX_AUDIO_CHUNK_BYTES,
    DeepgramSTTSession,
    synthesize_speech_streaming,
    voice_pipeline_available,
)

# VPN / datacenter org keywords
_VPN_KEYWORDS = [
    "mullvad", "nordvpn", "expressvpn", "surfshark", "proton",
    "cloudflare", "digitalocean", "amazon", "aws", "google cloud",
    "microsoft azure", "linode", "vultr", "hetzner",
]


async def _check_ip(ip: str, session_id: str) -> None:
    """Non-blocking IP geolocation + VPN check via ipapi.co."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"https://ipapi.co/{ip}/json/")
            resp.raise_for_status()
            data = resp.json()

        org = (data.get("org") or "").lower()
        is_vpn = any(kw in org for kw in _VPN_KEYWORDS)

        ip_check = {
            "ip": ip,
            "city": data.get("city"),
            "country": data.get("country_name"),
            "org": data.get("org"),
            "is_vpn_or_datacenter": is_vpn,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

        # Merge into integrity_signals
        try:
            current = await run_supabase(
                lambda: get_supabase().table("interview_sessions")
                .select("integrity_signals")
                .eq("id", session_id)
                .single()
                .execute()
            )
            signals = (current.data or {}).get("integrity_signals", {}) or {}
            signals["ip_check"] = ip_check
            await run_supabase(
                lambda: get_supabase().table("interview_sessions")
                .update({"integrity_signals": signals})
                .eq("id", session_id)
                .execute()
            )
        except Exception:
            pass
        print(f"[IP] Session {session_id}: {ip} → {data.get('city')}, VPN={is_vpn}")
    except Exception as e:
        print(f"[IP] Check failed for {session_id}: {e}")

router = APIRouter()


@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    """Real-time interview WebSocket. Handles the full interview state machine."""
    await websocket.accept()

    # ── Verify session exists and is valid ──
    try:
        result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = result.data
    except Exception:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    if session["status"] == "completed":
        await websocket.send_json({"type": "error", "message": "Interview already completed"})
        await websocket.close()
        return

    if session["status"] == "cancelled":
        await websocket.send_json({"type": "error", "message": "Interview cancelled"})
        await websocket.close()
        return

    # ── IP / VPN check (non-blocking) ──
    client_ip = ""
    try:
        # Render proxies set X-Forwarded-For
        for header_name in ("x-forwarded-for", "X-Forwarded-For"):
            val = dict(websocket.headers).get(header_name)
            if val:
                client_ip = val.split(",")[0].strip()
                break
        if not client_ip and websocket.client:
            client_ip = websocket.client.host
    except Exception:
        pass
    if client_ip:
        asyncio.create_task(_check_ip(client_ip, session_id))

    # ── Initialize interview state ──
    config = session.get("config", {})
    max_questions = config.get("question_count", 5)
    transcript: list = session.get("transcript", []) or []
    question_number = len(transcript) + 1
    current_question = ""
    current_code = ""
    last_interrupt_time = 0
    last_fraud_interrupt_time = 0
    typing_events: list = []
    violations: list = []
    screenshots: list = []
    interview_active = True

    # ── Voice pipeline (Deepgram STT + Cartesia TTS) ──
    use_voice_pipeline = voice_pipeline_available()
    deepgram_session: DeepgramSTTSession | None = None
    is_ai_speaking = False
    accumulated_speech = ""
    audio_in_count = 0
    audio_in_window_start = time.time()

    if use_voice_pipeline:
        async def _on_partial(text: str) -> None:
            try:
                await websocket.send_json({"type": "transcript_partial", "text": text})
            except Exception:
                pass

        async def _on_final(text: str) -> None:
            nonlocal current_answer_text, accumulated_speech, last_activity_time, inactivity_nudge_sent
            accumulated_speech = (accumulated_speech + " " + text).strip()
            # Cap accumulated speech to prevent unbounded memory growth
            if len(accumulated_speech) > MAX_ACCUMULATED_SPEECH:
                accumulated_speech = accumulated_speech[-MAX_ACCUMULATED_SPEECH:]
            current_answer_text = accumulated_speech
            last_activity_time = time.time()
            inactivity_nudge_sent = False
            try:
                await websocket.send_json({"type": "transcript_final", "text": accumulated_speech})
            except Exception:
                pass
            # Fire interrupt check on speech content
            if len(accumulated_speech.strip()) >= 40:
                asyncio.create_task(check_interrupt("answer"))

        async def _on_utterance_end() -> None:
            pass  # transcript_final already handles state updates

        async def _on_deepgram_disconnect() -> None:
            """Deepgram connection dropped mid-session — tell frontend to fall back."""
            nonlocal use_voice_pipeline, deepgram_session
            print(f"[Voice] Deepgram disconnected for session {session_id} — falling back to browser STT")
            deepgram_session = None
            # Don't disable TTS (Cartesia still works), just tell frontend to enable browser STT
            try:
                await websocket.send_json({"type": "stt_fallback", "reason": "deepgram_disconnected"})
            except Exception:
                pass

        deepgram_session = DeepgramSTTSession(
            on_transcript_partial=_on_partial,
            on_transcript_final=_on_final,
            on_utterance_end=_on_utterance_end,
            on_disconnect=_on_deepgram_disconnect,
        )
        try:
            await deepgram_session.start()
            print(f"[Voice] Deepgram STT started for session {session_id}")
        except Exception as e:
            print(f"[Voice] Deepgram start failed: {e} — falling back to browser STT")
            deepgram_session = None
            use_voice_pipeline = False

    async def speak_via_pipeline(text: str) -> None:
        """Stream TTS audio to frontend via Cartesia. Falls back to tts_fallback on error."""
        nonlocal is_ai_speaking
        if not use_voice_pipeline:
            return
        is_ai_speaking = True
        if deepgram_session:
            deepgram_session.pause()
        try:
            await websocket.send_json({"type": "ai_speaking_start"})
            async for chunk in synthesize_speech_streaming(text):
                b64 = base64.b64encode(chunk).decode("ascii")
                await websocket.send_json({"type": "audio_out", "data": b64})
            await websocket.send_json({"type": "ai_speaking_end"})
        except Exception as e:
            print(f"[Voice] TTS streaming error: {e}")
            # Tell frontend to fall back to browser TTS for this message
            try:
                await websocket.send_json({"type": "ai_speaking_end"})
                await websocket.send_json({"type": "tts_fallback", "text": text})
            except Exception:
                pass
        finally:
            is_ai_speaking = False
            if deepgram_session:
                deepgram_session.resume()

    # ── Mark session as active ──
    try:
        await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .update({"status": "active", "started_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", session_id)
            .in_("status", ["pending", "active"])
            .execute()
        )
    except Exception:
        pass

    # ── Timing state ──
    question_sent_at = time.time()
    last_activity_time = time.time()
    inactivity_nudge_sent = False
    current_answer_text = ""

    # ── Send welcome message ──
    candidate_name = session.get("candidate_name", "there")
    persona_key = config.get("persona", "arya")
    persona_names = {"arya": "Arya", "vikram": "Vikram", "priya": "Priya", "rahul": "Rahul", "ananya": "Ananya"}
    persona_display = persona_names.get(persona_key, "Arya")
    config_name = config.get("name", "Technical Interview")
    duration = config.get("duration_minutes", 30)

    welcome_text = (
        f"Hello {candidate_name}, welcome to your interview! "
        f"I'm {persona_display}, and I'll be conducting your {config_name} today. "
        f"We have {max_questions} questions over {duration} minutes. "
        f"Take your time to think through each problem, write your code on the left, "
        f"and explain your approach. I may ask follow-up questions as you go. "
        f"Let's get started with your first question."
    )
    await websocket.send_json({
        "type": "welcome",
        "text": welcome_text,
        "persona": persona_display,
        "voice_pipeline": use_voice_pipeline,
    })
    if use_voice_pipeline:
        await speak_via_pipeline(welcome_text)
    else:
        await asyncio.sleep(1)

    # ── Send first question ──
    try:
        current_question = await generate_first_question(config)
        await websocket.send_json({
            "type": "question",
            "text": current_question,
            "question_number": question_number,
            "total_questions": max_questions,
        })
        question_sent_at = time.time()
        last_activity_time = time.time()
        if use_voice_pipeline:
            asyncio.create_task(speak_via_pipeline(current_question))
    except Exception as e:
        fallback_q = "Write a function that reverses a linked list. Explain your approach and its time complexity."
        await websocket.send_json({
            "type": "question",
            "text": fallback_q,
            "question_number": question_number,
            "total_questions": max_questions,
        })
        current_question = fallback_q
        question_sent_at = time.time()
        if use_voice_pipeline:
            asyncio.create_task(speak_via_pipeline(fallback_q))

    # ── Background task for interrupt checking ──
    interrupt_lock = asyncio.Lock()
    pending_interrupt_check = False

    async def check_interrupt(source: str = "code"):
        """Check if AI should interrupt. source = 'code' or 'answer'."""
        nonlocal last_interrupt_time, pending_interrupt_check
        if not interview_active:
            return
        content = current_code if source == "code" else current_answer_text
        if not content or len(content.strip()) < 20:
            return
        # Rate limit interrupts: minimum 15 seconds between interrupts
        if time.time() - last_interrupt_time < 15:
            return
        async with interrupt_lock:
            if pending_interrupt_check:
                return
            pending_interrupt_check = True
        try:
            result = await should_interrupt(content, current_question, transcript, config)
            if result["should_interrupt"] and result["question"]:
                last_interrupt_time = time.time()
                await websocket.send_json({
                    "type": "interrupt",
                    "text": result["question"],
                })
                if use_voice_pipeline:
                    asyncio.create_task(speak_via_pipeline(result["question"]))
                # Log interrupt in current exchange
                if transcript and "interrupts" not in transcript[-1]:
                    transcript[-1]["interrupts"] = []
                elif not transcript:
                    transcript.append({"question": current_question, "interrupts": []})
                if transcript:
                    transcript[-1].setdefault("interrupts", []).append({
                        "question": result["question"],
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
        except Exception:
            pass
        finally:
            async with interrupt_lock:
                pending_interrupt_check = False

    # ── Background inactivity checker ──
    async def inactivity_monitor():
        """Check every 2s if candidate has been idle too long after a question."""
        nonlocal inactivity_nudge_sent
        while interview_active:
            await asyncio.sleep(2)
            if not interview_active:
                break
            idle_seconds = time.time() - last_activity_time
            since_question = time.time() - question_sent_at
            # Only nudge if >5s since question AND no activity AND not already nudged
            if since_question > 5 and idle_seconds > 5 and not inactivity_nudge_sent:
                inactivity_nudge_sent = True
                try:
                    nudge_text = "You've been quiet for a while. Please start explaining your approach — silence may affect your score."
                    await websocket.send_json({
                        "type": "nudge",
                        "text": nudge_text,
                        "idle_seconds": round(idle_seconds),
                    })
                    if use_voice_pipeline:
                        asyncio.create_task(speak_via_pipeline(nudge_text))
                    # Log as event
                    if transcript:
                        transcript[-1].setdefault("nudges", []).append({
                            "idle_seconds": round(idle_seconds),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                except Exception:
                    break

    asyncio.create_task(inactivity_monitor())

    # ── Main message loop ──
    try:
        while interview_active:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=300)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "timeout", "message": "Interview timed out due to inactivity"})
                break

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            # ── audio_in: high-frequency mic audio, process first ──
            if msg_type == "audio_in":
                if deepgram_session and not is_ai_speaking:
                    # Rate limit: max AUDIO_IN_RATE_LIMIT messages per second
                    audio_in_count += 1
                    now = time.time()
                    if now - audio_in_window_start >= 1.0:
                        audio_in_count = 1
                        audio_in_window_start = now
                    elif audio_in_count > AUDIO_IN_RATE_LIMIT:
                        continue  # Drop excess frames

                    raw_data = msg.get("data", "")
                    # Size guard: reject oversize payloads (base64 is ~4/3 of decoded)
                    if len(raw_data) > MAX_AUDIO_CHUNK_BYTES * 2:
                        continue
                    try:
                        audio_bytes = base64.b64decode(raw_data)
                        if len(audio_bytes) <= MAX_AUDIO_CHUNK_BYTES:
                            await deepgram_session.send_audio(audio_bytes)
                    except Exception:
                        pass
                continue

            if msg_type == "typing_batch":
                # Typing cadence data from frontend
                deltas = msg.get("deltas", [])
                if deltas:
                    typing_events.append({
                        "deltas": deltas,
                        "timestamp": msg.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    })

                    # Real-time paste detection for fraud intervention
                    consecutive_fast = 0
                    for d in deltas:
                        if d < 50:
                            consecutive_fast += 1
                        else:
                            consecutive_fast = 0
                        if consecutive_fast >= 5 and time.time() - last_fraud_interrupt_time >= 30:
                            last_fraud_interrupt_time = time.time()
                            paste_interrupt_text = (
                                "I noticed some content was added quickly there. "
                                "Could you walk me through exactly what you just wrote, "
                                "starting from the first line?"
                            )
                            await websocket.send_json({
                                "type": "interrupt",
                                "text": paste_interrupt_text,
                                "trigger": "paste_detected",
                            })
                            if use_voice_pipeline:
                                asyncio.create_task(speak_via_pipeline(paste_interrupt_text))
                            # Log in transcript
                            if transcript:
                                transcript[-1].setdefault("interrupts", []).append({
                                    "question": "Walk me through what you just wrote.",
                                    "trigger": "paste_detected",
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                })
                            break

            elif msg_type == "code_update":
                # Candidate's code editor content — sent every 2 seconds
                new_code = msg.get("code", "")
                if new_code != current_code:
                    current_code = new_code
                    last_activity_time = time.time()
                    inactivity_nudge_sent = False
                    # Fire interrupt check in background
                    asyncio.create_task(check_interrupt("code"))

            elif msg_type == "answer_update":
                # Candidate typing in answer/explanation box — sent every 2 seconds
                new_answer = msg.get("answer", "")
                if new_answer != current_answer_text:
                    current_answer_text = new_answer
                    last_activity_time = time.time()
                    inactivity_nudge_sent = False
                    # Fire interrupt check on answer content too
                    if len(new_answer.strip()) >= 40:
                        asyncio.create_task(check_interrupt("answer"))

            elif msg_type == "speech_update":
                # Candidate's live speech-to-text transcription
                speech_text = msg.get("text", "")
                if speech_text:
                    current_answer_text = speech_text
                    last_activity_time = time.time()
                    inactivity_nudge_sent = False
                    # Fire interrupt check on speech content
                    if len(speech_text.strip()) >= 40:
                        asyncio.create_task(check_interrupt("answer"))

            elif msg_type == "answer_submit":
                # Candidate submits their answer
                answer = msg.get("answer", "")
                code = msg.get("code", current_code)

                # Record exchange in transcript
                spoken_text = msg.get("spoken_text", "")
                exchange = {
                    "question": current_question,
                    "answer": answer,
                    "code": code,
                    "spoken_text": spoken_text,
                    "question_number": question_number,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                # Merge any existing interrupts
                if transcript and transcript[-1].get("question") == current_question:
                    exchange["interrupts"] = transcript[-1].get("interrupts", [])
                    transcript[-1] = exchange
                else:
                    transcript.append(exchange)

                # Save transcript progress
                try:
                    await run_supabase(
                        lambda: get_supabase().table("interview_sessions")
                        .update({"transcript": transcript})
                        .eq("id", session_id)
                        .execute()
                    )
                except Exception:
                    pass

                question_number += 1
                current_code = ""
                current_answer_text = ""
                accumulated_speech = ""
                question_sent_at = time.time()
                last_activity_time = time.time()
                inactivity_nudge_sent = False

                # Check if interview is complete
                if question_number > max_questions:
                    interview_active = False
                    await websocket.send_json({"type": "interview_complete"})
                    break

                # Generate next question
                try:
                    current_question = await generate_follow_up(
                        current_question, answer, transcript, config
                    )
                except Exception:
                    current_question = "Can you explain the time and space complexity of your solution?"

                await websocket.send_json({
                    "type": "question",
                    "text": current_question,
                    "question_number": question_number,
                    "total_questions": max_questions,
                })
                if use_voice_pipeline:
                    asyncio.create_task(speak_via_pipeline(current_question))

            elif msg_type == "eye_tracking_event":
                # Log eye tracking
                event = {
                    "event": msg.get("event", "looking_away"),
                    "duration_seconds": msg.get("duration_seconds", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                try:
                    await run_supabase(
                        lambda: get_supabase().table("interview_sessions")
                        .update({"eye_tracking_events": sb.table("interview_sessions")
                                .select("eye_tracking_events")
                                .eq("id", session_id)
                                .single()
                                .execute()
                                .data.get("eye_tracking_events", []) + [event]})
                        .eq("id", session_id)
                        .execute()
                    )
                except Exception:
                    pass  # Non-critical, don't break interview

            elif msg_type == "tab_switch_event":
                # Log tab switch
                event = {
                    "timestamp": msg.get("timestamp", datetime.now(timezone.utc).isoformat()),
                }
                try:
                    # Fetch current events and append
                    current = await run_supabase(
                        lambda: get_supabase().table("interview_sessions")
                        .select("tab_switch_events")
                        .eq("id", session_id)
                        .single()
                        .execute()
                    )
                    events = (current.data or {}).get("tab_switch_events", []) or []
                    events.append(event)
                    await run_supabase(
                        lambda: get_supabase().table("interview_sessions")
                        .update({"tab_switch_events": events})
                        .eq("id", session_id)
                        .execute()
                    )
                except Exception:
                    pass

                # Send warning back to candidate
                await websocket.send_json({
                    "type": "warning",
                    "message": "Tab switch detected and logged.",
                })

            elif msg_type == "violation":
                # Paste attempt, copy attempt, right-click, keyboard shortcut, drag-drop
                violation = {
                    "action": msg.get("action", "unknown"),
                    "target": msg.get("target", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                violations.append(violation)
                print(f"[VIOLATION] Session {session_id}: {violation['action']} on {violation['target']}")

            elif msg_type == "screenshot":
                # Periodic screen capture thumbnail (base64 JPEG)
                screenshots.append({
                    "timestamp": msg.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "data": msg.get("data", ""),  # base64 JPEG, ~10-20KB
                })

            elif msg_type == "fullscreen_exit":
                # Candidate exited fullscreen — treat like a tab switch
                violations.append({
                    "action": "fullscreen_exit",
                    "target": "",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await websocket.send_json({
                    "type": "warning",
                    "message": "You exited fullscreen. This has been logged. Please return to fullscreen.",
                })

            elif msg_type == "end_interview":
                interview_active = False
                await websocket.send_json({"type": "interview_complete"})
                break

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected from session {session_id}")
    except Exception as e:
        print(f"[WS] Error in session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": "Internal error"})
        except Exception:
            pass

    # ── Close Deepgram session ──
    if deepgram_session:
        try:
            await deepgram_session.close()
        except Exception:
            pass

    # ── Analyze typing cadence ──
    typing_analysis = analyze_typing_cadence(typing_events) if typing_events else {}

    # ── Merge integrity signals ──
    try:
        current_signals_result = await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .select("integrity_signals")
            .eq("id", session_id)
            .single()
            .execute()
        )
        integrity_signals = (current_signals_result.data or {}).get("integrity_signals", {}) or {}
    except Exception:
        integrity_signals = {}

    if typing_analysis:
        integrity_signals["typing_analysis"] = typing_analysis
    if violations:
        integrity_signals["violations"] = violations
        integrity_signals["violation_count"] = len(violations)
    if screenshots:
        integrity_signals["screenshot_count"] = len(screenshots)

    # ── Finalize session ──
    try:
        update_data: dict = {
            "status": "completed",
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "transcript": transcript,
            "integrity_signals": integrity_signals,
            "typing_events": typing_events,
        }
        # Store screenshots separately (they can be large)
        if screenshots:
            update_data["screenshots"] = screenshots
        await run_supabase(
            lambda: get_supabase().table("interview_sessions")
            .update(update_data)
            .eq("id", session_id)
            .execute()
        )
    except Exception:
        pass

    # ── Generate scorecard ──
    if transcript:
        try:
            await websocket.send_json({"type": "scorecard_generating"})
        except Exception:
            pass

        try:
            scorecard = await generate_scorecard(transcript, config, integrity_signals)
            await run_supabase(
                lambda: get_supabase().table("interview_sessions")
                .update({"scorecard": scorecard})
                .eq("id", session_id)
                .execute()
            )
            try:
                await websocket.send_json({"type": "scorecard_ready", "scorecard": scorecard})
            except Exception:
                pass
        except Exception as e:
            print(f"[WS] Scorecard generation failed: {e}")

    try:
        await websocket.close()
    except Exception:
        pass
