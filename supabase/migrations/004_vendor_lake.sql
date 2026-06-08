-- Vendor Lake — master vendor table for the cdaoinsights intelligence loop.
-- Fed by ingest_vendors.py from any source (MAD, Gartner, Ai4, manual).
-- Run once in the Supabase SQL editor.

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text,
  sub_category text,
  description text default '',
  use_case text default '',
  website_url text,
  logo_url text,
  domain text,
  source text,            -- which list it came from: mad | gartner-dna | ai4 | manual
  rss_url text,           -- the vendor's own feed (resolved in Phase 1)
  raised text,            -- funding, as reported
  country text,
  founded int,
  featured boolean default false,
  tracking boolean default true,   -- include in the signal/mention loop
  created_at timestamptz default now()
);

-- If the table already exists from the old seed, make sure the lake columns are present.
alter table vendors add column if not exists sub_category text;
alter table vendors add column if not exists domain text;
alter table vendors add column if not exists source text;
alter table vendors add column if not exists rss_url text;
alter table vendors add column if not exists raised text;
alter table vendors add column if not exists country text;
alter table vendors add column if not exists founded int;
alter table vendors add column if not exists tracking boolean default true;

create table if not exists vendor_signals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  signal_date date not null,
  job_mention_count int default 0,
  news_mention_count int default 0,
  created_at timestamptz default now()
);

alter table vendors enable row level security;
drop policy if exists "Public read vendors" on vendors;
create policy "Public read vendors" on vendors for select using (true);
