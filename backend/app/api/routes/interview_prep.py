from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.config import settings
from app.middleware.usage_limits import check_usage, increment_usage, raise_limit_exceeded
import httpx

router = APIRouter(prefix="/interview-prep", tags=["interview-prep"])


def _get_user(authorization: str):
    return get_current_user(authorization)


class InterviewPrepRequest(BaseModel):
    job_title: str
    company: str
    skills: List[str] = []
    experience_level: str = "Mid"
    question_count: int = 8

    def model_post_init(self, __context):
        self.question_count = max(1, min(self.question_count, 20))
        self.skills = self.skills[:15]
        self.job_title = self.job_title[:200]
        self.company = self.company[:200]


class InterviewQuestion(BaseModel):
    question: str
    category: str  # technical, behavioral, situational, company-specific
    difficulty: str  # easy, medium, hard
    tip: str


class VisaPrepRequest(BaseModel):
    university: str
    program: str  # e.g. "MS in Computer Science"
    consulate_city: str = ""  # e.g. "Chennai", "Mumbai"
    funding: str = "Self-funded"  # Self-funded, Assistantship, Scholarship
    work_experience_years: int = 0
    question_count: int = 10

    def model_post_init(self, __context):
        self.question_count = max(1, min(self.question_count, 20))
        self.work_experience_years = max(0, min(self.work_experience_years, 50))
        self.university = self.university[:300]
        self.program = self.program[:300]
        self.consulate_city = self.consulate_city[:100]
        self.funding = self.funding[:100]


@router.post("/visa-prep")
async def generate_visa_questions(
    body: VisaPrepRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "interview_prep")
    if not usage["allowed"]:
        raise_limit_exceeded("interview_prep", usage)

    consulate_context = f" at the {body.consulate_city} US consulate" if body.consulate_city else ""
    prompt = f"""You are simulating a US F-1 visa interview{consulate_context}. Generate {body.question_count} realistic visa interview questions for a student going to {body.university} for {body.program}.

Student context:
- Funding: {body.funding}
- Work experience: {body.work_experience_years} years

Return a JSON array where each element has:
- "question": the visa officer's question (direct, sometimes challenging)
- "category": one of "intent", "academic", "financial", "ties-to-home", "post-graduation"
- "difficulty": one of "easy", "medium", "hard"
- "tip": a brief tip on how to answer convincingly (1-2 sentences, focus on what consulate officers look for)

Include tough follow-up style questions. Visa officers often push back — include questions like "Why not study in India?" or "How will you fund if your assistantship is cut?".
Return ONLY the JSON array, no other text."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            choices = data.get("choices") or []
            if not choices:
                raise HTTPException(status_code=502, detail="No response from AI model")
            content = choices[0].get("message", {}).get("content", "")

            import json, re
            cleaned = content.strip()
            # Extract JSON array from markdown fences or raw text
            fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
            if fence_match:
                cleaned = fence_match.group(1).strip()
            # Find the JSON array
            arr_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
            if not arr_match:
                raise HTTPException(status_code=502, detail="AI returned invalid format")
            questions = json.loads(arr_match.group(0))

            await increment_usage(user.id, "interview_prep")

            return {"questions": questions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate questions")


@router.post("/generate")
async def generate_questions(
    body: InterviewPrepRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "interview_prep")
    if not usage["allowed"]:
        raise_limit_exceeded("interview_prep", usage)

    skills_str = ", ".join(body.skills[:10]) if body.skills else "relevant skills"
    prompt = f"""Generate {body.question_count} interview questions for a {body.experience_level}-level {body.job_title} position at {body.company}.

Skills to focus on: {skills_str}

Return a JSON array where each element has:
- "question": the interview question
- "category": one of "technical", "behavioral", "situational", "company-specific"
- "difficulty": one of "easy", "medium", "hard"
- "tip": a brief tip on how to approach this question (1-2 sentences)

Mix categories and difficulties. Include at least one company-specific question about {body.company}.
Return ONLY the JSON array, no other text."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            choices = data.get("choices") or []
            if not choices:
                raise HTTPException(status_code=502, detail="No response from AI model")
            content = choices[0].get("message", {}).get("content", "")

            import json, re
            cleaned = content.strip()
            fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
            if fence_match:
                cleaned = fence_match.group(1).strip()
            arr_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
            if not arr_match:
                raise HTTPException(status_code=502, detail="AI returned invalid format")
            questions = json.loads(arr_match.group(0))

            await increment_usage(user.id, "interview_prep")

            return {"questions": questions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate questions")
