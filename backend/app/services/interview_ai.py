"""Core AI brain for the interview platform — question generation, interruptions, scoring."""
from __future__ import annotations

import json
import re
from typing import Optional
import httpx
from app.config import settings


# ── AI Interviewer Personas ──

PERSONAS = {
    "arya": {
        "name": "Arya",
        "style": "Warm but thorough",
        "description": "Friendly senior engineer who puts candidates at ease while probing deep",
        "system_prompt_addition": (
            "Your name is Arya. You are warm and encouraging but technically thorough. "
            "You use a conversational tone, occasionally say 'nice approach' or 'interesting', "
            "and gently guide candidates when they are stuck. You probe edge cases with curiosity, not pressure."
        ),
    },
    "vikram": {
        "name": "Vikram",
        "style": "Rigorous and precise",
        "description": "Staff engineer who expects precision and optimal solutions",
        "system_prompt_addition": (
            "Your name is Vikram. You are rigorous and precise. You expect candidates to discuss "
            "time and space complexity unprompted. You push back on suboptimal solutions and ask "
            "'Can you do better?' when there is room for improvement. You are fair but demanding."
        ),
    },
    "priya": {
        "name": "Priya",
        "style": "System-design focused",
        "description": "Principal architect who thinks in systems and trade-offs",
        "system_prompt_addition": (
            "Your name is Priya. You think in systems. Even for coding questions you ask about "
            "how the solution would scale, what happens under load, and what trade-offs the candidate "
            "is making. You value practical experience and real-world reasoning over textbook answers."
        ),
    },
    "rahul": {
        "name": "Rahul",
        "style": "Fast-paced and challenging",
        "description": "Engineering manager who tests speed and adaptability under pressure",
        "system_prompt_addition": (
            "Your name is Rahul. You run a fast-paced interview. You give candidates less time to "
            "think and move quickly between topics. You test adaptability by changing requirements "
            "mid-question. You are not harsh but you keep the pressure on to see how candidates perform under stress."
        ),
    },
    "ananya": {
        "name": "Ananya",
        "style": "Collaborative and exploratory",
        "description": "Tech lead who treats the interview as a pair-programming session",
        "system_prompt_addition": (
            "Your name is Ananya. You treat the interview like a pair-programming session. "
            "You think out loud with the candidate, offer small hints when they are stuck, and "
            "build on their ideas. You value collaboration and communication as much as the final solution."
        ),
    },
}


async def _call_groq(messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """Call Groq API with Llama 4 Scout. Returns content string."""
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_claude(messages: list[dict], system: str = "", max_tokens: int = 2048) -> str:
    """Call Claude Sonnet via Anthropic API. Returns content string."""
    api_key = settings.anthropic_api_key or settings.openrouter_api_key
    if not api_key:
        raise RuntimeError("No Anthropic or OpenRouter API key configured")

    # Use OpenRouter if no direct Anthropic key
    if settings.anthropic_api_key:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        body = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system:
            body["system"] = system
    else:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        }
        all_messages = []
        if system:
            all_messages.append({"role": "system", "content": system})
        all_messages.extend(messages)
        body = {
            "model": "anthropic/claude-sonnet-4-20250514",
            "messages": all_messages,
            "max_tokens": max_tokens,
        }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

        if settings.anthropic_api_key:
            # Anthropic native format
            return data["content"][0]["text"]
        else:
            # OpenRouter format
            return data["choices"][0]["message"]["content"]


async def generate_first_question(config: dict) -> str:
    """Generate the opening interview question based on config."""
    topics = ", ".join(config.get("topics", ["general programming"]))
    difficulty = config.get("difficulty", "medium")
    languages = config.get("programming_languages", ["python"])
    lang = languages[0] if languages else "python"

    persona_key = config.get("persona", "arya")
    persona = PERSONAS.get(persona_key, PERSONAS["arya"])

    messages = [
        {
            "role": "system",
            "content": (
                f"{persona['system_prompt_addition']}\n\n"
                "You are a senior technical interviewer at a top Indian product company. "
                "Generate one technical interview question based on the config. "
                "The question should be specific, have a clear correct approach, and allow "
                "for follow up questions about complexity and edge cases. "
                "Return only the question text, nothing else. Do not include any preamble."
            ),
        },
        {
            "role": "user",
            "content": f"Topics: {topics}. Difficulty: {difficulty}. Programming language: {lang}.",
        },
    ]
    return await _call_groq(messages, temperature=0.7)


async def should_interrupt(
    code_so_far: str,
    current_question: str,
    interview_history: list,
    config: dict | None = None,
) -> dict:
    """Analyze candidate's code in real-time. Returns {should_interrupt, question}."""
    if not code_so_far or len(code_so_far.strip()) < 30:
        return {"should_interrupt": False, "question": ""}

    # Build brief history context
    history_ctx = ""
    if interview_history:
        recent = interview_history[-3:]  # Last 3 exchanges only for speed
        history_ctx = "\n".join(
            f"Q: {h.get('question', '')[:100]}\nA: {h.get('answer', '')[:100]}"
            for h in recent
        )

    persona_key = (config or {}).get("persona", "arya")
    persona = PERSONAS.get(persona_key, PERSONAS["arya"])

    messages = [
        {
            "role": "system",
            "content": (
                f"{persona['system_prompt_addition']}\n\n"
                "You are monitoring a technical interview in real time. Analyze the candidate's "
                "code and decide if now is a good moment to interrupt with a follow up question. "
                "Consider: is there a bug in their approach, are they using suboptimal complexity, "
                "are they missing an edge case, have they written enough code to probe their understanding? "
                "Only interrupt if there is something genuinely worth asking about right now. "
                "If they have barely started or are on the right track, do not interrupt."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Question asked: {current_question}\n\n"
                f"Candidate's code so far:\n```\n{code_so_far[:2000]}\n```\n\n"
                f"Previous exchanges:\n{history_ctx}\n\n"
                "Should I interrupt now? Respond in JSON only: "
                '{"should_interrupt": true/false, "question": "follow up question if yes, empty string if no"}'
            ),
        },
    ]

    try:
        raw = await _call_groq(messages, temperature=0, max_tokens=256)
        # Extract JSON from response
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            return {
                "should_interrupt": bool(result.get("should_interrupt", False)),
                "question": result.get("question", ""),
            }
    except Exception:
        pass

    return {"should_interrupt": False, "question": ""}


async def generate_follow_up(
    question: str,
    answer: str,
    interview_history: list,
    config: dict,
) -> str:
    """Generate the next question based on candidate's answer."""
    topics = ", ".join(config.get("topics", []))
    difficulty = config.get("difficulty", "medium")
    covered = [h.get("question", "")[:80] for h in interview_history]
    covered_str = "\n- ".join(covered) if covered else "None yet"

    persona_key = config.get("persona", "arya")
    persona = PERSONAS.get(persona_key, PERSONAS["arya"])

    messages = [
        {
            "role": "system",
            "content": (
                f"{persona['system_prompt_addition']}\n\n"
                "You are a senior technical interviewer conducting a live interview. "
                "Based on the candidate's answer to the previous question, generate the next question. "
                "The next question should either: probe deeper into their answer if it was incomplete, "
                "or move to a new topic from the configured topics. "
                "Do not repeat questions already asked. Return only the question text."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Interview config — Topics: {topics}, Difficulty: {difficulty}\n\n"
                f"Previous question: {question}\n\n"
                f"Candidate's answer:\n{answer[:3000]}\n\n"
                f"Questions already asked:\n- {covered_str}\n\n"
                f"Generate the next interview question."
            ),
        },
    ]
    return await _call_groq(messages, temperature=0.6)


def analyze_typing_cadence(typing_events: list[dict]) -> dict:
    """Analyze typing cadence batches for fraud signals.

    Returns {ai_signal_score: 0-100, paste_events: int, suspicious_segments: list}.
    """
    all_deltas: list[int] = []
    for batch in typing_events:
        all_deltas.extend(batch.get("deltas", []))

    if not all_deltas:
        return {"ai_signal_score": 0, "paste_events": 0, "suspicious_segments": []}

    paste_events = 0
    ai_signals = 0
    suspicious_segments: list[dict] = []

    # Scan for paste events: 3+ consecutive deltas <50ms
    streak = 0
    streak_start = 0
    for i, d in enumerate(all_deltas):
        if d < 50:
            if streak == 0:
                streak_start = i
            streak += 1
        else:
            if streak >= 3:
                paste_events += 1
                suspicious_segments.append({
                    "type": "paste",
                    "index_start": streak_start,
                    "length": streak,
                    "avg_delta_ms": round(sum(all_deltas[streak_start:streak_start + streak]) / streak),
                })
            if streak >= 5 and all(d2 < 18 for d2 in all_deltas[streak_start:streak_start + streak]):
                ai_signals += 1
                suspicious_segments.append({
                    "type": "ai_assisted",
                    "index_start": streak_start,
                    "length": streak,
                    "avg_delta_ms": round(sum(all_deltas[streak_start:streak_start + streak]) / streak),
                })
            streak = 0

    # Check final streak
    if streak >= 3:
        paste_events += 1
        suspicious_segments.append({
            "type": "paste",
            "index_start": streak_start,
            "length": streak,
            "avg_delta_ms": round(sum(all_deltas[streak_start:streak_start + streak]) / streak),
        })
    if streak >= 5 and all(d < 18 for d in all_deltas[streak_start:streak_start + streak]):
        ai_signals += 1

    # Score: weighted combination
    total_keystrokes = len(all_deltas)
    paste_ratio = sum(s["length"] for s in suspicious_segments) / max(total_keystrokes, 1)
    ai_signal_score = min(100, int(paste_ratio * 200) + ai_signals * 20)

    return {
        "ai_signal_score": ai_signal_score,
        "paste_events": paste_events,
        "suspicious_segments": suspicious_segments[:10],  # Cap at 10
    }


async def generate_scorecard(transcript: list, config: dict, integrity_signals: dict | None = None) -> dict:
    """Generate structured scorecard from full interview transcript using Claude."""
    # Format transcript for analysis
    transcript_text = ""
    for i, exchange in enumerate(transcript, 1):
        transcript_text += f"\n--- Exchange {i} ---\n"
        transcript_text += f"Interviewer: {exchange.get('question', '')}\n"
        if exchange.get("code"):
            transcript_text += f"Candidate's code:\n```\n{exchange['code']}\n```\n"
        if exchange.get("answer"):
            transcript_text += f"Candidate's response: {exchange['answer']}\n"
        if exchange.get("interrupts"):
            for intr in exchange["interrupts"]:
                transcript_text += f"[Interrupt] Interviewer: {intr.get('question', '')}\n"
                transcript_text += f"[Interrupt] Candidate: {intr.get('answer', '')}\n"

    topics = ", ".join(config.get("topics", []))
    difficulty = config.get("difficulty", "medium")

    # Build integrity context for scorecard
    integrity_ctx = ""
    if integrity_signals:
        typing = integrity_signals.get("typing_analysis", {})
        ip_check = integrity_signals.get("ip_check", {})
        if typing:
            integrity_ctx += (
                f"\n\nINTEGRITY SIGNALS — Typing Analysis:\n"
                f"- AI signal score: {typing.get('ai_signal_score', 0)}/100\n"
                f"- Paste events detected: {typing.get('paste_events', 0)}\n"
            )
        if ip_check:
            integrity_ctx += (
                f"\nINTEGRITY SIGNALS — IP Check:\n"
                f"- Location: {ip_check.get('city', '?')}, {ip_check.get('country', '?')}\n"
                f"- Org: {ip_check.get('org', '?')}\n"
                f"- VPN/Datacenter: {ip_check.get('is_vpn_or_datacenter', False)}\n"
            )
        if integrity_ctx:
            integrity_ctx += (
                "\nFactor these integrity signals into your assessment. "
                "High paste events or VPN usage should be noted in red_flags if suspicious."
            )

    system_prompt = (
        "You are a senior engineering hiring manager. Analyze this technical interview "
        "transcript and generate a detailed structured scorecard. Be specific and evidence-based. "
        "Quote exact moments from the transcript to support each assessment.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        '  "verdict": "Strong Hire" or "Hire" or "No Hire",\n'
        '  "overall_score": integer 1-10,\n'
        '  "competencies": {\n'
        '    "problem_solving": {"score": 1-10, "evidence": "...", "gaps": "..."},\n'
        '    "code_quality": {"score": 1-10, "evidence": "...", "gaps": "..."},\n'
        '    "communication": {"score": 1-10, "evidence": "...", "gaps": "..."},\n'
        '    "adaptability": {"score": 1-10, "evidence": "...", "gaps": "..."}\n'
        "  },\n"
        '  "red_flags": ["list of specific concerns"],\n'
        '  "standout_moments": ["list of impressive moments"],\n'
        '  "hiring_recommendation_rationale": "2-3 sentence summary"\n'
        "}\n\n"
        "Return ONLY the JSON object, no other text."
    )

    messages = [
        {
            "role": "user",
            "content": (
                f"Interview configuration: Topics — {topics}, Difficulty — {difficulty}\n\n"
                f"Full interview transcript:\n{transcript_text}\n\n"
                f"{integrity_ctx}\n\n"
                "Generate the scorecard."
            ),
        },
    ]

    try:
        raw = await _call_claude(messages, system=system_prompt, max_tokens=2048)
        # Extract JSON
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            scorecard = json.loads(json_match.group(0))
            return scorecard
    except Exception as e:
        print(f"[SCORECARD] Generation failed: {e}")

    # Fallback scorecard
    return {
        "verdict": "No Hire",
        "overall_score": 0,
        "competencies": {
            "problem_solving": {"score": 0, "evidence": "Scorecard generation failed", "gaps": "N/A"},
            "code_quality": {"score": 0, "evidence": "Scorecard generation failed", "gaps": "N/A"},
            "communication": {"score": 0, "evidence": "Scorecard generation failed", "gaps": "N/A"},
            "adaptability": {"score": 0, "evidence": "Scorecard generation failed", "gaps": "N/A"},
        },
        "red_flags": ["Automated scorecard generation failed — manual review required"],
        "standout_moments": [],
        "hiring_recommendation_rationale": "Scorecard could not be generated automatically. Please review the transcript manually.",
    }
