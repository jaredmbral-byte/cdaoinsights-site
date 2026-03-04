-- CDAO Insights — Executive Moves Table
-- Run this in Supabase SQL Editor

-- ── Executive Moves ───────────────────────────────────────────────────────────
create table if not exists executive_moves (
  id            uuid primary key default gen_random_uuid(),
  person_name   text,
  title         text,
  company_name  text,
  move_type     text,          -- appointed, named, joins, leaves, promoted
  headline      text not null,
  summary       text,
  source_url    text not null unique,
  source_name   text,
  published_at  timestamptz,
  ingested_at   timestamptz default now()
);

create index if not exists idx_moves_published on executive_moves (published_at desc);
create index if not exists idx_moves_type on executive_moves (move_type);
create index if not exists idx_moves_company on executive_moves (company_name);
create index if not exists idx_moves_source on executive_moves (source_url);

-- Row Level Security
alter table executive_moves enable row level security;

-- Public read access (anon can read)
create policy "Public read executive_moves"
  on executive_moves for select
  to anon using (true);

-- Service role can do everything (for cron ingestion)
-- (service_role bypasses RLS by default, no policy needed)
