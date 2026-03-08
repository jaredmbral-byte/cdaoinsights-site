# Signal Layer Implementation Complete ✅

Branch: `feat/signal-layer` (pushed, ready for review)

## What Was Built

A two-tier hiring ingestion system that:
1. **Tier 1 (Featured)**: Senior roles (CDO, CAIO, VP, Director+) shown on the site
2. **Tier 2 (Signal-only)**: Engineer roles (Data Engineer, ML Engineer, etc.) ingested ONLY for tech stack intelligence

## Key Changes

### 1. Database Migration
- Added `is_featured` boolean column to `hiring_signals` table (default: true)
- Migration script: `scripts/migrate-add-is-featured.ts`
- Runner: `scripts/run-migration.ts` (loads from `.env.local`)
- **Action Required**: Run `npm run migrate` after setting up `.env.local`

### 2. Ingest Route Updates (`app/api/ingest/hiring/route.ts`)
- Added 10 Tier 2 engineer titles to `ADZUNA_TITLE_QUERIES`:
  - Data Engineer, Senior Data Engineer
  - ML Engineer, Machine Learning Engineer
  - AI Engineer, Data Architect
  - Analytics Engineer, MLOps Engineer
  - Data Platform Engineer, AI Infrastructure Engineer
- New `isFeaturedTitle()` function classifies roles as featured vs signal-only
- Insert statement now includes `is_featured: isFeaturedTitle(job.title)`

### 3. UI Query Updates

#### `/hiring` Page
- Added `.eq('is_featured', true)` filter
- Only senior executive roles appear in the job board

#### Homepage (`/`)
- **Stat panels**: Featured filter on counts (Open Positions, seniority, industries, top companies)
- **AI Skill Demand panel**: NO filter — counts skills from ALL roles (Tier 1 + Tier 2)
- This is the magic: senior execs rarely mention "Databricks" or "Snowflake" in JDs, but engineers do

### 4. Type Updates
- Added `is_featured: boolean | null` to `HiringSignal` interface in `lib/types.ts`

### 5. Backfill Script
- `scripts/backfill-tech-stack.ts` extracts tech stack from existing rows
- Processes rows where `tech_stack` is null or empty
- Logs progress every 50 rows
- **Action Required**: Run `npm run backfill` after migration

## Next Steps for Jared

1. **Set up `.env.local`** (if not already):
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Run migration**:
   ```bash
   npm run migrate
   ```

3. **Run backfill** (optional — only needed if you have existing rows with missing tech_stack):
   ```bash
   npm run backfill
   ```

4. **Test locally**:
   ```bash
   npm run dev
   ```
   - Visit `/hiring` — should only show senior roles
   - Visit homepage — "AI & Data Skills in Demand" panel should show tech stack counts

5. **Review and merge**:
   - Review the branch on GitHub: https://github.com/jaredmbral-byte/cdaoinsights-site/tree/feat/signal-layer
   - Merge to `main` when ready
   - Vercel will auto-deploy

## Why This Works

- Senior executive JDs say "Lead data strategy" and "Drive AI transformation" — no specific tools
- Engineer JDs say "Build pipelines in Databricks, model in Snowflake, orchestrate with Airflow"
- By ingesting both tiers but only SHOWING Tier 1, we get:
  - Clean, executive-focused UI (no junior roles cluttering the board)
  - Rich tech stack intelligence from engineer JDs for the skill demand tracker
  - Real signal on what tools are actually in demand across the market

## Files Changed

- `app/api/ingest/hiring/route.ts` — ingest logic + Tier 2 queries
- `app/hiring/page.tsx` — featured filter added
- `app/page.tsx` — selective featured filter (counts yes, skills no)
- `lib/types.ts` — added is_featured field
- `package.json` — added migrate/backfill scripts
- `scripts/migrate-add-is-featured.ts` — migration script
- `scripts/run-migration.ts` — migration runner
- `scripts/backfill-tech-stack.ts` — backfill script

## TypeScript Check

✅ Passed (`npx tsc --noEmit`)

---

**Status**: Ready for review and merge. No breaking changes. All existing data will be marked `is_featured=true` by default.
