-- Drop comp_benchmarks — the fabricated compensation data.
--
-- The /compensation page and its ingest route were deleted in the credibility
-- purge, so nothing reads or writes this table anymore. The rows are still in
-- the database though, and every one of them was invented: hardcoded figures
-- with sample_size null and a source string claiming "Market Composite (BLS,
-- Glassdoor, Levels.fyi)" that was never actually queried.
--
-- Leaving fabricated numbers in the database is how they come back. Some future
-- query finds a conveniently-shaped table and trusts it.
--
-- NOT RUN AUTOMATICALLY. Apply this in the Supabase SQL editor when you are
-- ready. It is destructive and irreversible.
--
-- If you want to keep the shape for a future real dataset, run the truncate
-- instead of the drop, then repopulate only from a source you can cite.

-- Option A (recommended): remove the table entirely.
drop table if exists comp_benchmarks;

-- Option B: keep the schema, discard the invented rows.
-- truncate table comp_benchmarks;
