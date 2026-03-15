# cdaoinsights.com — Project Context
> Single source of truth for all AI sessions (Claude Code on MacBook + Ace via Telegram).
> Ace reads this from GitHub raw URL. Claude Code reads it automatically from repo root.
> GitHub: https://github.com/jaredmbral-byte/cdaoinsights-site
> Last updated: 2026-03-06
---
## Mission
Replace cdomagazine.tech and Gartner as the #1 go-to resource for senior data, analytics, and AI executives (CDO / CDAIO / CAIO / VP Data).
**Win condition:** Real-time intelligence vs. their static legacy content.
**Monetization paths:**
1. Vendor sponsorships (category exclusivity, $5-25k/quarter)
2. GTM intelligence reports sold to data/AI vendors ($2-5k/mo)
---
## Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS — modular components, Jared restyled himself
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel (auto-deploys on push to main)
- **Forms:** Tally.so (email capture)
- **DNS:** Cloudflare → Vercel (set Cloudflare to DNS only / grey cloud)
- **Scraping:** Firecrawl (Jared has ~525 credits, hobby plan)
---
## Pages Built
| Page | Route | Status | Notes |
|---|---|---|---|
| Homepage | / | ✅ Live | Mission control dashboard — stat panels, moves table, hiring by seniority, top signals, weekly brief, FAQ |
| Moves | /moves | ✅ Built | Executive appointment/departure tracker |
| Hiring | /hiring | ✅ Built | CDO/CAIO/VP Data job listings |
| Intelligence | /intelligence | ✅ Built | Signal dashboard — topic sidebar, source counts, compact table |
| Compensation | /compensation | ✅ Built | Salary benchmarks |
| Sponsors | /sponsors | ✅ Gated | Requires `?key=cdao2026`. Hidden from nav. Not indexed. |
---
## API Ingest Routes (Vercel Cron)
| Route | Source | Frequency | Notes |
|---|---|---|---|
| /api/ingest/hiring | Indeed RSS (13 feeds) + Firecrawl + Google News | Daily | C-suite/VP/Director+ data/AI jobs. Negative keyword filtering + persona taxonomy. |
| /api/ingest/moves | Google News RSS + PR Newswire | Daily | Executive appointment/departure announcements. Negative keyword filtering. |
| /api/ingest/news | 20+ RSS feeds (Google News, TDWI, MIT, InfoWorld, etc.) | Daily | Market intelligence. Relevance scoring + negative keyword filtering. |
| /api/ingest/compensation | TBD | TBD | Salary data ingestion |
| /api/backfill/persona | One-time | Manual | Backfills persona column on existing hiring_signals rows |
---
## Supabase
Tables: executive_moves, hiring_signals, market_articles, comp_benchmarks, weekly_brief, subscribers
Key columns added: `hiring_signals.persona` (text), `hiring_signals.tech_stack` (text[])
Check `supabase/migrations/` for full schema history.
---
## AEO Requirements (non-negotiable)
- JSON-LD on every page ✅ (homepage done)
- FAQ sections with answer-first content ✅
- Semantic HTML, aria labels ✅
- Sitemap + robots.txt
- OpenGraph tags
---
## Decision Log
| Date | Decision |
|---|---|
| 2026-03-02 | cdaoinsights.com is the primary site (not caioindex.com) |
| 2026-03-02 | CDAIO Index folds into cdaoinsights as a future product feature |
| 2026-03-02 | Free/cheap APIs to start — Firecrawl for scraping, expand later |
| 2026-03-02 | No auth on launch |
| 2026-03-03 | Jared handles design changes himself — Claude Code focuses on data/function |
| 2026-03-03 | Monetization: vendor sponsorships + GTM intelligence reports |
| 2026-03-06 | Mission control / Palantir-style dashboard — minimal scrolling, dense data panels |
| 2026-03-06 | Email capture form removed from homepage for now |
| 2026-03-06 | Sponsors page gated behind ?key=cdao2026, not public |
| 2026-03-06 | Skip tech stack extraction from job descriptions for now |
| 2026-03-06 | Track all titles rolling up to CDO/CAIO at Director+, VP, and C-Suite |
| 2026-03-06 | DESIGN.md is the design contract — read it before any UI changes |
---
## What's Next (priority order)
1. Run Supabase migration 004 (persona + tech_stack columns) + trigger backfill
2. Confirm Vercel crons are scheduled and firing with real data
3. AEO: add JSON-LD + FAQ schema to /hiring, /compensation pages
4. Email digest (weekly) via Tally subscriber list
5. Vendor sponsorship page — finalize data, then un-gate
6. Tech stack extraction from job descriptions (future — skipped for now)
---
## Workflow
- **Big changes (100+ lines, full page rewrites):** Create a worktree and branch. Do not commit straight to main. Wait for review.
- **Small changes (styling, copy, single component fixes):** Commit directly to main.
- **Before every push:** Run `npm run build`. Do not push if build fails.
- **Supabase migrations:** Generate the SQL file AND attempt to run it via Supabase CLI if the project ref is available in env. If not, leave instructions in a MIGRATIONS.md file.
- **Default mode:** Plan first, then execute — unless the request says "just do it."
- **DESIGN.md is the design contract.** Read it at the start of any session involving UI changes. Do not deviate from the color tokens or layout principles documented there.
- **Tests:** Run `npm test` after any changes to `lib/filters.ts` or `lib/taxonomy.ts`. Do not push if tests fail.
---
## Ace's Access
Ace (Jared's Telegram agent) reads this file from:
https://raw.githubusercontent.com/jaredmbral-byte/cdaoinsights-site/main/CLAUDE.md
When Jared makes decisions via Telegram, Ace drafts updates here.
Jared pastes them into Claude Code → commits → Ace stays in sync.

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review` — Founder/CEO mode: rethink the problem, find the 10-star product
- `/plan-eng-review` — Eng manager mode: architecture, data flow, diagrams, edge cases, tests
- `/review` — Paranoid staff engineer: find bugs that pass CI but blow up in production
- `/ship` — Release engineer: sync main, run tests, push, open PR
- `/browse` — QA engineer: give the agent eyes to click through the live app and take screenshots
- `/qa` — QA lead: systematic testing, diff-aware on feature branches, full/quick/regression modes
- `/setup-browser-cookies` — Import cookies from your real browser for authenticated testing
- `/retro` — Engineering manager: team-aware retrospectives with metrics

If skills aren't working, run `cd .claude/skills/gstack && ./setup` to rebuild.
