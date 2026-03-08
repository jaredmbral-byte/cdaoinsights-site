-- Migration 007: Add is_featured column to hiring_signals
-- is_featured = true  → Tier 1: CDO/CAIO/VP/Director-level executive roles (shown on /hiring page)
-- is_featured = false → Tier 2: Data Engineer, ML Engineer, Analytics Engineer, etc.
--                        (used for tech stack trend analysis / skills demand panel)

ALTER TABLE hiring_signals ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT true;

-- Backfill: mark existing rows as featured (they're all Tier 1)
UPDATE hiring_signals SET is_featured = true WHERE is_featured IS NULL;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_hiring_signals_is_featured ON hiring_signals (is_featured);
CREATE INDEX IF NOT EXISTS idx_hiring_signals_tech_stack ON hiring_signals USING gin (tech_stack);
