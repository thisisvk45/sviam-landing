import asyncio
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import json
import io
import html as html_module

from app.config import settings
from app.db.supabase_client import get_supabase
from app.ingestion.resume_parser import parse_resume, async_parse_resume
from app.api.deps import get_current_user
from app.middleware.usage_limits import check_usage, increment_usage, raise_limit_exceeded

router = APIRouter(prefix="/resume", tags=["resume-builder"])

RESUME_SCHEMA = {
    "personal": {
        "name": "", "email": "", "phone": "", "city": "",
        "state": "", "linkedin": "", "portfolio": "",
    },
    "summary": "",
    "experience": [
        {
            "company": "", "title": "", "start": "", "end": "",
            "location": "", "bullets": [""],
        }
    ],
    "education": [
        {"institution": "", "degree": "", "field": "", "year": "", "gpa": ""}
    ],
    "skills": [""],
    "certifications": [{"name": "", "issuer": "", "year": ""}],
}


def _get_user(authorization: str):
    """Verify JWT — delegates to shared auth dependency."""
    return get_current_user(authorization)


def _openai_client() -> OpenAI:
    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    return OpenAI(
        api_key=settings.openai_api_key,
        base_url="https://openrouter.ai/api/v1",
    )


async def _llm_call(client: OpenAI, **kwargs):
    """Run a synchronous OpenAI call in executor to avoid blocking event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(**kwargs),
    )


# ---------------------------------------------------------------------------
# 1. POST /resume/parse
# ---------------------------------------------------------------------------

@router.post("/parse")
async def parse_resume_endpoint(
    resume: UploadFile = File(...),
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "resume_parse")
    if not usage["allowed"]:
        raise_limit_exceeded("resume_parse", usage)

    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    parsed = await async_parse_resume(pdf_bytes)
    raw_text = parsed["raw_text"]

    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    # Truncate to limit token cost and reduce prompt injection surface
    truncated_text = raw_text[:3000]

    client = _openai_client()
    completion = await _llm_call(
        client,
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a resume parser. Extract all information from this resume text "
                    "into the exact JSON schema provided. Return only valid JSON, no markdown."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Schema:\n{json.dumps(RESUME_SCHEMA, indent=2)}\n\n"
                    f"Resume text:\n{truncated_text}"
                ),
            },
        ],
    )

    response_text = completion.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        structured = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse structured data from AI response.")

    await increment_usage(user.id, "resume_parse")
    return structured


# ---------------------------------------------------------------------------
# 2. POST /resume/improve-bullets
# ---------------------------------------------------------------------------

class ImproveBulletsRequest(BaseModel):
    company: str
    title: str
    bullets: list[str]


@router.post("/improve-bullets")
async def improve_bullets(
    body: ImproveBulletsRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "improve_bullets")
    if not usage["allowed"]:
        raise_limit_exceeded("improve_bullets", usage)

    client = _openai_client()

    completion = await _llm_call(
        client,
        model="gpt-4o",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional resume writer. Rewrite these bullet points to follow "
                    "the format: [Action Verb] + [What you did] + [Quantified impact]. "
                    "Keep technical terms accurate. Do not invent metrics that are not implied. "
                    "Return only a JSON array of improved bullet strings."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Company: {body.company}\n"
                    f"Title: {body.title}\n"
                    f"Bullets:\n{json.dumps(body.bullets)}"
                ),
            },
        ],
    )

    response_text = completion.choices[0].message.content.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        improved = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")

    await increment_usage(user.id, "improve_bullets")
    return {"improved_bullets": improved}


# ---------------------------------------------------------------------------
# 3. POST /resume/generate-summary
# ---------------------------------------------------------------------------

class GenerateSummaryRequest(BaseModel):
    experience: list
    skills: list
    target_role: Optional[str] = None


@router.post("/generate-summary")
async def generate_summary(
    body: GenerateSummaryRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "generate_summary")
    if not usage["allowed"]:
        raise_limit_exceeded("generate_summary", usage)

    client = _openai_client()

    user_content = (
        f"Experience:\n{json.dumps(body.experience, indent=2)}\n\n"
        f"Skills:\n{json.dumps(body.skills)}\n"
    )
    if body.target_role:
        user_content += f"\nTarget role: {body.target_role}"

    completion = await _llm_call(
        client,
        model="gpt-4o-mini",
        temperature=0.4,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional resume writer. Write a concise 2-3 sentence professional "
                    "summary for a resume based on the candidate's experience and skills. "
                    "If a target role is provided, tailor the summary toward that role. "
                    "Return only the summary text, no JSON or markdown."
                ),
            },
            {"role": "user", "content": user_content},
        ],
    )

    summary = completion.choices[0].message.content.strip()
    await increment_usage(user.id, "generate_summary")
    return {"summary": summary}


# ---------------------------------------------------------------------------
# 4. POST /resume/suggest-skills
# ---------------------------------------------------------------------------

class SuggestSkillsRequest(BaseModel):
    experience: list
    current_skills: list


@router.post("/suggest-skills")
async def suggest_skills(
    body: SuggestSkillsRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "suggest_skills")
    if not usage["allowed"]:
        raise_limit_exceeded("suggest_skills", usage)

    client = _openai_client()

    completion = await _llm_call(
        client,
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a career advisor. Based on the candidate's experience and current skills, "
                    "suggest 10 additional relevant skills they likely have or should add to their resume. "
                    "Do not repeat skills already listed. Return only a JSON array of skill strings."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Experience:\n{json.dumps(body.experience, indent=2)}\n\n"
                    f"Current skills:\n{json.dumps(body.current_skills)}"
                ),
            },
        ],
    )

    response_text = completion.choices[0].message.content.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        suggested = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")

    await increment_usage(user.id, "suggest_skills")
    return {"suggested_skills": suggested}


# ---------------------------------------------------------------------------
# 5. POST /resume/tailor
# ---------------------------------------------------------------------------

class TailorRequest(BaseModel):
    resume: dict
    job_description: str


@router.post("/tailor")
async def tailor_resume(
    body: TailorRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "tailors")
    if not usage["allowed"]:
        raise_limit_exceeded("tailors", usage)

    client = _openai_client()

    # Truncate inputs to limit token cost
    resume_json = json.dumps(body.resume, indent=2)[:5000]
    job_desc = body.job_description[:2000]

    completion = await _llm_call(
        client,
        model="gpt-4o",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional resume writer. Tailor the provided resume to better match "
                    "the given job description. Adjust the summary, bullet points, and skills to "
                    "highlight relevant experience. Do not fabricate information. "
                    "Return a JSON object with two keys:\n"
                    '- "tailored_resume": the full updated resume object (same schema as input)\n'
                    '- "changes": an array of objects, each with keys "section", "original", '
                    '"updated", and "reason" describing what was changed and why.\n'
                    "Return only valid JSON, no markdown."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Resume:\n{resume_json}\n\n"
                    f"Job Description:\n{job_desc}"
                ),
            },
        ],
    )

    response_text = completion.choices[0].message.content.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")

    await increment_usage(user.id, "tailors")

    return {
        "tailored_resume": result.get("tailored_resume", {}),
        "changes": result.get("changes", []),
    }


# ---------------------------------------------------------------------------
# 6. POST /resume/cover-letter
# ---------------------------------------------------------------------------

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_title: str
    company: str
    city: str = ""
    job_description: str = ""
    tone: str = "formal"  # "formal" or "creative"


@router.post("/cover-letter")
async def generate_cover_letter(
    body: CoverLetterRequest,
    authorization: str = Header(None),
):
    user = _get_user(authorization)

    # Usage gating
    usage = await check_usage(user.id, "cover_letters")
    if not usage["allowed"]:
        raise_limit_exceeded("cover_letters", usage)

    client = _openai_client()

    from datetime import date
    today = date.today().strftime("%B %d, %Y")
    location_line = f"\n{body.city}" if body.city else ""
    tone_instruction = (
        "Use a warm, engaging opening that shows genuine enthusiasm and personality. Be conversational yet professional."
        if body.tone == "creative"
        else "Use a professional, polished tone throughout. Be direct and confident."
    )

    completion = await _llm_call(
        client,
        model="gpt-4o-mini",
        temperature=0.5 if body.tone == "creative" else 0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional cover letter writer. Write a cover letter with EXACTLY this structure:\n\n"
                    f"Line 1: {today}\n"
                    f"Line 2: {body.company}{location_line}\n\n"
                    "Line 3: Dear Hiring Manager,\n\n"
                    "Then write EXACTLY 3 paragraphs:\n"
                    "- Paragraph 1: Opening that connects the candidate to the role\n"
                    "- Paragraph 2: Key achievements and relevant experience (use **bold** for 2-3 key impact metrics or achievements)\n"
                    "- Paragraph 3: Closing with enthusiasm and call to action\n\n"
                    "End with:\nSincerely,\n[Candidate Name]\n\n"
                    "RULES:\n"
                    f"- {tone_instruction}\n"
                    "- NEVER use hyphens (-) or dashes (em dash, en dash) anywhere in the letter. Rewrite sentences to avoid them.\n"
                    "- Use **bold** markers around 2-3 key impact numbers or achievements in paragraph 2\n"
                    "- Keep it concise. Each paragraph should be 3-4 sentences max.\n"
                    "- Do not use generic filler phrases.\n"
                    "- Return only the cover letter text, no JSON or markdown formatting except **bold** markers."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Resume:\n{body.resume_text[:2000]}\n\n"
                    f"Job Title: {body.job_title}\n"
                    f"Company: {body.company}\n"
                    f"Job Description:\n{body.job_description[:1500]}"
                ),
            },
        ],
    )

    await increment_usage(user.id, "cover_letters")

    return {"cover_letter": completion.choices[0].message.content.strip()}


# ---------------------------------------------------------------------------
# 7. POST /resume/generate-pdf
# ---------------------------------------------------------------------------

class GeneratePDFRequest(BaseModel):
    resume: dict


def _esc(value) -> str:
    """HTML-escape a value to prevent XSS in generated PDFs."""
    return html_module.escape(str(value)) if value else ""


def _build_resume_html(resume: dict) -> str:
    personal = resume.get("personal", {})
    name = _esc(personal.get("name", ""))
    contact_parts = []
    if personal.get("email"):
        contact_parts.append(_esc(personal["email"]))
    if personal.get("phone"):
        contact_parts.append(_esc(personal["phone"]))
    if personal.get("city") or personal.get("state"):
        location = ", ".join(filter(None, [_esc(personal.get("city")), _esc(personal.get("state"))]))
        contact_parts.append(location)
    if personal.get("linkedin"):
        contact_parts.append(_esc(personal["linkedin"]))
    if personal.get("portfolio"):
        contact_parts.append(_esc(personal["portfolio"]))

    contact_row = " &nbsp;|&nbsp; ".join(contact_parts)

    sections_html = ""

    # Summary
    summary = _esc(resume.get("summary", ""))
    if summary:
        sections_html += f"""
        <div class="section">
            <h2>Summary</h2>
            <p>{summary}</p>
        </div>"""

    # Experience
    experience = resume.get("experience", [])
    if experience:
        exp_html = ""
        for exp in experience:
            bullets = "".join(f"<li>{_esc(b)}</li>" for b in exp.get("bullets", []) if b)
            date_range = " &ndash; ".join(filter(None, [_esc(exp.get("start")), _esc(exp.get("end"))]))
            location = _esc(exp.get("location", ""))
            meta_parts = []
            if date_range:
                meta_parts.append(date_range)
            if location:
                meta_parts.append(location)
            meta = " &nbsp;|&nbsp; ".join(meta_parts)
            exp_html += f"""
            <div class="entry">
                <div class="entry-header">
                    <strong>{_esc(exp.get('title', ''))}</strong> &mdash; {_esc(exp.get('company', ''))}
                    <span class="meta">{meta}</span>
                </div>
                <ul>{bullets}</ul>
            </div>"""
        sections_html += f"""
        <div class="section">
            <h2>Experience</h2>
            {exp_html}
        </div>"""

    # Education
    education = resume.get("education", [])
    if education:
        edu_html = ""
        for edu in education:
            parts = []
            if edu.get("degree"):
                degree_str = _esc(edu["degree"])
                if edu.get("field"):
                    degree_str += f" in {_esc(edu['field'])}"
                parts.append(degree_str)
            if edu.get("institution"):
                parts.append(_esc(edu["institution"]))
            meta_parts = []
            if edu.get("year"):
                meta_parts.append(_esc(str(edu["year"])))
            if edu.get("gpa"):
                meta_parts.append(f"GPA: {_esc(edu['gpa'])}")
            meta = " &nbsp;|&nbsp; ".join(meta_parts)
            edu_html += f"""
            <div class="entry">
                <div class="entry-header">
                    <strong>{' &mdash; '.join(parts)}</strong>
                    <span class="meta">{meta}</span>
                </div>
            </div>"""
        sections_html += f"""
        <div class="section">
            <h2>Education</h2>
            {edu_html}
        </div>"""

    # Skills
    skills = resume.get("skills", [])
    if skills:
        skills_str = ", ".join(_esc(s) for s in skills if s)
        sections_html += f"""
        <div class="section">
            <h2>Skills</h2>
            <p>{skills_str}</p>
        </div>"""

    # Certifications
    certifications = resume.get("certifications", [])
    if certifications:
        cert_html = ""
        for cert in certifications:
            parts = []
            if cert.get("name"):
                parts.append(f"<strong>{_esc(cert['name'])}</strong>")
            if cert.get("issuer"):
                parts.append(_esc(cert["issuer"]))
            if cert.get("year"):
                parts.append(_esc(str(cert["year"])))
            cert_html += f"<div class='entry'>{' &mdash; '.join(parts)}</div>"
        sections_html += f"""
        <div class="section">
            <h2>Certifications</h2>
            {cert_html}
        </div>"""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {{
        size: A4;
        margin: 1.5cm;
    }}
    body {{
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #222;
        margin: 0;
        padding: 0;
    }}
    h1 {{
        font-size: 22pt;
        margin: 0 0 4px 0;
        color: #111;
    }}
    .contact {{
        font-size: 9.5pt;
        color: #555;
        margin-bottom: 10px;
    }}
    hr {{
        border: none;
        border-top: 1.5px solid #333;
        margin: 10px 0;
    }}
    .section {{
        margin-bottom: 12px;
    }}
    h2 {{
        font-size: 12pt;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 2px;
        margin: 10px 0 6px 0;
        color: #333;
    }}
    .entry {{
        margin-bottom: 8px;
    }}
    .entry-header {{
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }}
    .meta {{
        font-size: 9.5pt;
        color: #666;
        white-space: nowrap;
    }}
    ul {{
        margin: 3px 0 0 0;
        padding-left: 18px;
    }}
    li {{
        margin-bottom: 2px;
        font-size: 10.5pt;
    }}
    p {{
        margin: 3px 0;
        font-size: 10.5pt;
    }}
</style>
</head>
<body>
    <h1>{name}</h1>
    <div class="contact">{contact_row}</div>
    <hr>
    {sections_html}
</body>
</html>"""
    return html


@router.post("/generate-pdf")
async def generate_pdf(
    body: GeneratePDFRequest,
    authorization: str = Header(None),
):
    _get_user(authorization)

    from weasyprint import HTML

    html_content = _build_resume_html(body.resume)
    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(None, lambda: HTML(string=html_content).write_pdf())

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"},
    )
