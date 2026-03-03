-- CDAO Insights — Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/istbbdnryqeisgxovvqn/sql

-- ── Hiring Signals ──────────────────────────────────────────────────────────
create table if not exists hiring_signals (
  id            uuid primary key default gen_random_uuid(),
  person_name   text,
  job_title     text not null,
  company_name  text not null,
  industry      text,
  company_size  text,
  location      text,
  seniority     text,
  source_url    text,
  source_name   text,
  posted_at     timestamptz,
  ingested_at   timestamptz default now(),
  raw_payload   jsonb
);

create index if not exists idx_hiring_posted on hiring_signals (posted_at desc);
create index if not exists idx_hiring_industry on hiring_signals (industry);
create index if not exists idx_hiring_title on hiring_signals (job_title);
create index if not exists idx_hiring_company on hiring_signals (company_name);

-- ── Market Intelligence ─────────────────────────────────────────────────────
create table if not exists market_articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  summary       text,
  source_name   text,
  source_url    text not null unique,
  image_url     text,
  published_at  timestamptz,
  topics        text[] default '{}',
  relevance     real default 0.5,
  ingested_at   timestamptz default now()
);

create index if not exists idx_articles_published on market_articles (published_at desc);
create index if not exists idx_articles_topics on market_articles using gin (topics);

-- ── Compensation Benchmarks ─────────────────────────────────────────────────
create table if not exists comp_benchmarks (
  id            uuid primary key default gen_random_uuid(),
  role_title    text not null,
  industry      text,
  geography     text,
  p25           integer,
  p50           integer,
  p75           integer,
  p90           integer,
  sample_size   integer,
  source        text,
  period        text,
  updated_at    timestamptz default now()
);

create index if not exists idx_comp_role on comp_benchmarks (role_title);
create index if not exists idx_comp_industry on comp_benchmarks (industry);

-- ── Subscribers ─────────────────────────────────────────────────────────────
create table if not exists subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text,
  company       text,
  title         text,
  subscribed_at timestamptz default now(),
  status        text default 'active'
);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS on all tables
alter table hiring_signals enable row level security;
alter table market_articles enable row level security;
alter table comp_benchmarks enable row level security;
alter table subscribers enable row level security;

-- Public read access for content tables (anon can read)
create policy "Public read hiring_signals"
  on hiring_signals for select
  to anon using (true);

create policy "Public read market_articles"
  on market_articles for select
  to anon using (true);

create policy "Public read comp_benchmarks"
  on comp_benchmarks for select
  to anon using (true);

-- Service role can do everything (for cron ingestion)
-- (service_role bypasses RLS by default, no policy needed)

-- Subscribers: no public read (privacy)
create policy "Service role manages subscribers"
  on subscribers for all
  to service_role using (true);
