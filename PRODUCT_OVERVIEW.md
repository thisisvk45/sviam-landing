# SViam — Product & Technical Overview

**Last updated:** April 19, 2026
**Live URL:** [sviam.in](https://sviam.in)
**Status:** Candidate portal MVP — actively developing

---

## What is SViam?

SViam is an AI-powered hiring platform with three planned products:

| Product | Target User | Status |
|---------|-------------|--------|
| **AI Job Copilot** | Job seekers (India-first) | ✅ MVP Live |
| **AI Interview Platform** | Companies / Recruiters | 🔜 Planned |
| **F-1 Visa Prep** | International students (US) | ✅ Built |

The current focus is the **Candidate Portal** — a single dashboard where job seekers upload their resume and get AI-powered matching, resume tailoring, cover letter generation, interview prep, and an application pipeline tracker.

---

## Features Built (Candidate Portal)

### 1. AI Job Matching Engine
- Upload a PDF resume → get ranked matches from **8,000+ indexed jobs**
- Matching uses **vector similarity** (sentence-transformers embeddings + Zilliz cosine search)
- Match scores (0–100%) with skill, experience, and industry sub-scores
- Filters: city (11 Indian metros), work mode (Remote/Hybrid/Onsite), salary range, experience level

### 2. Job Detail View (Jobright-style)
- Clicking a job opens a full-page detail view (not a new page, replaces content area)
- Shows: full job description parsed into sections (Responsibilities, Qualifications, Benefits), match score breakdown, company info card with research links (LinkedIn, Glassdoor, website)
- AI tools sidebar: Customize Resume, Generate Cover Letter, Add to Pipeline, Interview Prep
- Job detail data is **cached per session** for instant back-and-forth navigation

### 3. Resume Management
- Upload up to **3 resume versions** per account
- PDF parsing extracts structured data (name, experience, education, skills, certifications)
- Set a primary resume for matching
- Resume text stored for AI features

### 4. AI Resume Builder
- Upload any resume → auto-parsed into editable sections
- **AI Improve Bullets**: rewrites experience bullet points with stronger action verbs and quantified impact
- **AI Generate Summary**: creates a professional summary from experience + skills
- **AI Suggest Skills**: recommends skills to add based on experience
- **AI Tailor Resume**: adapts entire resume to a specific job description, shows tracked changes (section, original → updated, reason)
- **PDF Export**: generates a clean, formatted PDF download

### 5. AI Cover Letter Generator
- Generates cover letters tailored to a specific job + company
- **Tone selector**: Professional (formal) or Creative
- Formatting: today's date, "Dear Hiring Manager", company + city, max 3 paragraphs, **bold impact metrics**
- **Session-level caching**: switching between jobs doesn't re-generate; cached by `job_id + tone`
- **Download options**: Copy to clipboard, PDF (print dialog), Word (.doc)

### 6. Application Pipeline Tracker
- Add any matched job to your pipeline with one click ("Add to Queue")
- Track status across 5 stages: **Queued → Applied → Interview → Offer → Rejected**
- Filter pipeline view by status
- Add notes, attach resume version, attach cover letter per application
- Duplicate detection (can't add same job twice)

### 7. AI Interview Prep
- Generate practice questions for any job in your pipeline or custom role/company
- Each question includes: category (Technical / Behavioral / Situational / Company-specific), difficulty (Easy / Medium / Hard), and a preparation tip
- Configurable question count (1–20)

### 8. F-1 Visa Interview Prep
- Specialized for US F-1 visa consulate interviews
- Inputs: university, program, consulate city, funding source, work experience
- Question categories: Intent, Academic, Financial, Ties to Home, Post-graduation
- Each question includes difficulty level and a preparation tip

### 9. User Profile & ATS Profile
- Personal info: name, phone, city, experience level
- Links: LinkedIn, GitHub, portfolio
- Work & compensation: authorization status, current/expected CTC, notice period
- Additional: DOB, gender, languages, full address
- **Auto-Apply Settings** (UI built, agent pending): enabled toggle, max applications/day, minimum match score, excluded companies, preferred work modes, always include cover letter

### 10. Public Candidate Profile
- Shareable URL: `sviam.in/u/{slug}`
- Displays: name, city, experience level, skills, target roles, work mode, social links
- Filterable server-side via Supabase JSONB query (no full table scan)

### 11. Job Saving
- Bookmark any job from the match results
- Saved jobs persist across sessions (stored in Supabase)
- Dedicated "Saved" tab in dashboard

### 12. Landing Page
- Seeker / Hirer path selector (fork UI)
- Hero section with animated beam network (Three.js + Framer Motion)
- **Try It**: upload resume without signing up → see top 5 matches instantly
- Company logos, founder story, FAQ, waitlist form
- Waitlist captures: name, email, role preference, experience level, with confetti animation

### 13. Company Research Links
- For every job, auto-generated links to research the company:
  - LinkedIn company page
  - Glassdoor reviews
  - Company website (from domain)

### 14. Performance Optimizations (Latest)
- **Parallel API loading**: dashboard fires all initial API calls simultaneously via `Promise.all` instead of sequential waterfall
- **Batch MongoDB query**: match endpoint fetches all 50 jobs in a single `find({_id: {$in: ids}})` with field projection (was 50 individual queries)
- **MongoDB projection**: only fetches 7 needed fields per job, excludes heavy `raw_jd` from match results
- **Frontend caching**: job detail responses and cover letters cached in `useRef` for instant re-access within a session

---

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16.2.4** (App Router) | Server/client rendering, routing, API routes |
| Language | **TypeScript 5** | Type safety |
| UI Library | **React 19** | Component architecture |
| Styling | **Tailwind CSS 4** | Utility-first CSS |
| Animation | **Framer Motion 12** | Page transitions, hover effects, scroll animations |
| 3D Graphics | **Three.js + React Three Fiber** | Hero section beam network |
| Smooth Scroll | **Lenis** | Smooth page scrolling |
| Icons | **Tabler Icons** | 4,000+ SVG icons |
| Confetti | **Canvas Confetti** | Waitlist celebration effect |
| Auth | **Supabase SSR** | Google OAuth, session cookies |
| Analytics | **Vercel Analytics + Speed Insights** | Performance monitoring |
| Hosting | **Vercel** | Edge deployment, auto-preview deploys |
| Domain | **sviam.in** | Production domain |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **FastAPI** | Async Python API server |
| Server | **Uvicorn** | ASGI production server |
| Language | **Python 3.11+** | Backend logic |
| Validation | **Pydantic v2** | Request/response models |

### Databases

| Database | Technology | What It Stores |
|----------|-----------|---------------|
| Auth & Relational | **Supabase (PostgreSQL)** | User profiles, resumes metadata, saved jobs, applications, waitlist |
| Jobs & Companies | **MongoDB (Motor async)** | 8,000+ job listings, company metadata, raw JDs |
| Vector Search | **Zilliz (Managed Milvus)** | 768-dim embeddings for resume ↔ job similarity matching |
| File Storage | **Supabase Storage** | Resume PDFs |

### AI / ML

| Capability | Model / Service | Usage |
|-----------|----------------|-------|
| Text Embeddings | **sentence-transformers/all-mpnet-base-v2** | 768-dim vectors for semantic job matching |
| Resume Parsing | **GPT-4o-mini** (via OpenRouter) | Extract structured data from PDF text |
| Resume Tailoring | **GPT-4o** (via OpenRouter) | Adapt resume to job descriptions |
| Bullet Improvement | **GPT-4o** (via OpenRouter) | Rewrite experience bullets with impact |
| Cover Letters | **GPT-4o-mini** (via OpenRouter) | Generate tailored cover letters |
| Interview Questions | **GPT-4o-mini** (via OpenRouter) | Generate practice questions with tips |
| Skill Suggestions | **GPT-4o-mini** (via OpenRouter) | Recommend missing skills |
| Summary Generation | **GPT-4o-mini** (via OpenRouter) | Write professional summaries |

### Job Ingestion Pipeline

| Source | Type | Coverage |
|--------|------|----------|
| **Greenhouse** | ATS API | US + EU companies with public boards |
| **Lever** | ATS API | Companies with Lever job boards |
| **Darwinbox** | Web scraper | Indian enterprise companies |
| **Ashby** | API | Startups using Ashby ATS |
| **Adzuna** | Public API | Tech jobs across 11 Indian cities |
| **SerpAPI** | Search API | General job search aggregation |

Jobs are deduplicated by SHA-256 hash of `company|title|city|date`, normalized to a standard schema, embedded, and stored in both MongoDB and Zilliz.

### Infrastructure & DevOps

| Tool | Purpose |
|------|---------|
| **Vercel** | Frontend hosting, CI/CD, preview deploys |
| **Supabase Cloud** | Managed PostgreSQL + Auth + Storage |
| **MongoDB Atlas** (or self-hosted) | Job data storage |
| **Zilliz Cloud** | Managed vector database |
| **OpenRouter** | LLM API gateway (routes to OpenAI models) |
| **Git + GitHub** | Version control |

---

## API Endpoints Summary

### Public (No Auth)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/jobs` | List jobs with filters |
| GET | `/jobs/{id}` | Full job detail |
| GET | `/jobs/stats` | Total active job count |
| GET | `/profile/public/{slug}` | Public candidate profile |

### Authenticated (Bearer JWT)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/match/resume` | Match resume → jobs (vector search) |
| GET | `/profile/me` | Get user profile |
| POST | `/profile/me` | Update profile |
| POST | `/profile/resume` | Upload + embed resume |
| GET | `/resumes` | List resume versions |
| POST | `/resumes` | Upload resume version |
| DELETE | `/resumes/{id}` | Delete resume |
| POST | `/resume/parse` | AI parse resume to JSON |
| POST | `/resume/improve-bullets` | AI improve bullet points |
| POST | `/resume/generate-summary` | AI generate summary |
| POST | `/resume/suggest-skills` | AI suggest skills |
| POST | `/resume/tailor` | AI tailor resume to JD |
| POST | `/resume/cover-letter` | AI generate cover letter |
| POST | `/resume/generate-pdf` | Generate PDF download |
| GET | `/applications` | List applications |
| POST | `/applications` | Queue a job application |
| PATCH | `/applications/{id}` | Update status/notes |
| DELETE | `/applications/{id}` | Remove application |
| POST | `/jobs/save/{id}` | Save/bookmark job |
| DELETE | `/jobs/save/{id}` | Unsave job |
| GET | `/jobs/saved` | List saved jobs |
| POST | `/interview-prep/generate` | AI interview questions |
| POST | `/interview-prep/visa-prep` | AI visa prep questions |

### Admin (API Key)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/jobs/seed-test` | Insert test job |
| POST | `/jobs/admin/crawl` | Trigger job crawl across all sources |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              Next.js 16 + React 19 + TypeScript              │
│                    Hosted on Vercel                           │
│                                                              │
│  Landing Page ─── Dashboard ─── Resume Builder ─── Profile   │
│       │               │              │               │       │
│   Try It (no     Job Matches    AI Parse/Edit    ATS Profile │
│   auth needed)   Pipeline       Tailor/PDF       Auto-Apply  │
│                  Cover Letters  Improve Bullets   Settings    │
│                  Interview Prep Suggest Skills               │
│                  Visa Prep      Generate Summary             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Bearer JWT)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                                │
│                FastAPI + Uvicorn (Python)                      │
│                                                               │
│  /match ── /resume ── /profile ── /applications ── /jobs      │
│     │          │          │            │              │        │
│  Embed &    LLM calls   CRUD       Pipeline        CRUD +    │
│  Search    (OpenRouter)  + Auth     Tracking        Crawlers  │
└─────┬──────────┬─────────┬────────────┬──────────────┬───────┘
      │          │         │            │              │
      ▼          ▼         ▼            ▼              ▼
  ┌───────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
  │Zilliz │ │Open    │ │Supabase │ │Supabase │ │ MongoDB  │
  │Vector │ │Router  │ │  Auth   │ │Postgres │ │  (Jobs)  │
  │  DB   │ │(GPT-4o)│ │(Google) │ │+ Storage│ │ 8,000+   │
  └───────┘ └────────┘ └─────────┘ └─────────┘ └──────────┘
```

---

## What's Next (Proposed)

These are features that have UI groundwork or are logically next:

1. **Auto-Apply Agent** — The settings UI is built (max/day, min score, excluded companies). The next step is building the backend agent that actually submits applications on behalf of the user.

2. **AI Interview Platform (for Companies)** — The hirer path UI exists on the landing page (pipeline, interview config, results). Backend needs to be built.

3. **Real-time Sub-scores** — Match score currently shows an overall score. Backend could return breakdown by skill match, experience level match, and industry match.

4. **Email Notifications** — Notify users when new high-match jobs are found, application status changes, etc.

5. **More Job Sources** — Add Indeed, Internshala, Naukri, LinkedIn (scrapers exist as stubs).

6. **Analytics Dashboard** — Track: applications sent, response rates, match score trends over time.

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Jobs indexed | 8,000+ |
| ATS sources integrated | 6 (Greenhouse, Lever, Darwinbox, Ashby, Adzuna, SerpAPI) |
| Indian cities covered | 11 metros |
| AI features | 8 (match, parse, tailor, improve, suggest, summarize, cover letter, interview prep) |
| API endpoints | 25+ |
| Frontend pages | 9 |
| Frontend components | 30+ |
