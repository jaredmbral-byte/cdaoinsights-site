-- Vendor activity counters — the self-improving loop's visible state.
-- compute_vendor_signals.py recomputes these daily from market_articles.
-- Run once in the Supabase SQL editor.

alter table vendors add column if not exists mention_count int default 0;
alter table vendors add column if not exists verified_count int default 0;
alter table vendors add column if not exists last_event_at timestamptz;
