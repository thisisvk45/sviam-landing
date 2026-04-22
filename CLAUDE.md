@AGENTS.md

# SViam Monorepo

## Frontend
Live: sviam.in
Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12
Run: `npm run dev` (port 3000)

Key files:
- src/app/dashboard/DashboardClient.tsx — main dashboard
- src/components/JobCard.tsx — job match cards
- src/lib/api.ts — all API calls to backend
- src/app/resume-builder/ResumeBuilderClient.tsx — resume builder
- src/app/profile/ProfileClient.tsx — user profile

## Backend
Live: https://sviam-backend.onrender.com
Stack: FastAPI, Python 3.11, Motor, Supabase, Redis, Zilliz
Run: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000`
Or: `npm run dev:backend`
Both: `npm run dev:all`

Key files:
- backend/app/api/routes/match.py — resume matching engine
- backend/app/api/routes/jobs.py — job CRUD + similar jobs
- backend/app/api/routes/profile.py — user profile management
- backend/app/api/routes/applications.py — application pipeline
- backend/app/api/routes/resume_builder.py — AI resume features
- backend/app/api/routes/interviews.py — interview session management
- backend/app/ingestion/pipeline.py — job crawl orchestrator
- backend/app/ingestion/embedder.py — sentence-transformer embeddings
- backend/app/db/mongo.py — MongoDB connection
- backend/app/db/zilliz_client.py — Zilliz vector DB
- backend/app/db/supabase_client.py — Supabase client

## Rules
Always run `npm run build` after frontend changes. Zero TypeScript errors required.
Never use `any` as a TypeScript type.
Always use `PYTHONPATH=.` prefix when running backend scripts.
