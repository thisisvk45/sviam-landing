# SViam Backend

Live: https://sviam-backend.onrender.com
Stack: FastAPI, Python 3.11, Motor, Supabase, Redis, Zilliz

Key files:
- app/api/routes/match.py — resume matching engine
- app/api/routes/jobs.py — job CRUD + similar jobs
- app/api/routes/profile.py — user profile management
- app/api/routes/applications.py — application pipeline
- app/api/routes/resume_builder.py — AI resume features
- app/ingestion/pipeline.py — job crawl orchestrator
- app/ingestion/embedder.py — sentence-transformer embeddings
- app/db/mongo.py — MongoDB connection
- app/db/zilliz_client.py — Zilliz vector DB
- app/db/supabase_client.py — Supabase client

Always use PYTHONPATH=. prefix when running scripts.
Server: uvicorn app.main:app --reload --port 8000
MongoDB: 8,319 jobs, Zilliz: 768-dim cosine, Supabase: auth + user data
