-- Interview Platform Tables
-- Run this in the Supabase SQL Editor

-- 1. Interview Configurations (company-specific templates)
create table if not exists interview_configs (
  id text primary key,
  company_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  topics jsonb not null default '[]'::jsonb,
  difficulty text not null default 'medium',
  duration_minutes integer not null default 30,
  question_count integer not null default 5,
  follow_up_depth text not null default 'medium',
  programming_languages jsonb not null default '["python", "javascript"]'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Interview Sessions (one per candidate interview)
create table if not exists interview_sessions (
  id text primary key,
  company_id uuid not null references auth.users(id) on delete cascade,
  candidate_email text not null,
  candidate_name text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  transcript jsonb not null default '[]'::jsonb,
  scorecard jsonb,
  recording_url text,
  eye_tracking_events jsonb not null default '[]'::jsonb,
  tab_switch_events jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_configs_company on interview_configs(company_id);
create index if not exists idx_sessions_company on interview_sessions(company_id);
create index if not exists idx_sessions_status on interview_sessions(status);

-- RLS Policies
alter table interview_configs enable row level security;
alter table interview_sessions enable row level security;

-- Configs: owners can CRUD their own
create policy "Users can manage their own configs"
  on interview_configs for all
  using (company_id = auth.uid())
  with check (company_id = auth.uid());

-- Sessions: owners can CRUD their own
create policy "Users can manage their own sessions"
  on interview_sessions for all
  using (company_id = auth.uid())
  with check (company_id = auth.uid());

-- Sessions: public read for candidates (only specific columns via API, but allow select for the public endpoint)
create policy "Public can read sessions by id"
  on interview_sessions for select
  using (true);

-- Allow service role to insert/update (backend uses service key)
-- The backend uses the service_role key which bypasses RLS,
-- so these policies mainly protect direct client access.
