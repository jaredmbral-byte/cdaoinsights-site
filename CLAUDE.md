# cdaoinsights.com — Project Context
> Single source of truth for all AI sessions (Claude Code on MacBook + Ace via Telegram).
> Ace reads this from GitHub raw URL. Claude Code reads it automatically from repo root.
> GitHub: https://github.com/jaredmbral-byte/cdaoinsights-site
> Last updated: 2026-03-03
---
## Mission
Replace cdomagazine.tech and Gartner as the #1 go-to resource for senior data, analytics, and AI executives (CDO / CDAIO / CAIO / VP Data).
**Win condition:** Real-time intelligence vs. their static legacy content.
**Monetization paths:**
1. Vendor sponsorships (category exclusivity, $5-25k/quarter)
2. GTM intelligence reports sold to data/AI vendors ($2-5k/mo)
---
## Stack
- **Framework:** Next.js 15 (App Router)
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
| Homepage | / | ✅ Live | Hero, FAQs, Tally email capture, JSON-LD |
| Hiring | /hiring | ✅ Built | CDO/CAIO/VP Data job listings |
| Intelligence | /intelligence | ✅ Built | News/insights feed |
| Compensation | /compensation | ✅ Built | Salary benchmarks |
---
## API Ingest Routes (Vercel Cron)
| Route | Source | Frequency | Notes |
|---|---|---|---|
| /api/ingest/hiring | Firecrawl → LinkedIn/Indeed | Every 6h | Scrapes C-suite data/AI job listings |
| /api/ingest/news | TBD | TBD | News/intelligence feed |
| /api/ingest/compensation | TBD | TBD | Salary data ingestion |
---
## Supabase
Tables: executive_moves, jobs, subscribers (check migrations for full schema)
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
---
## What's Next (priority order)
1. Verify Firecrawl ingest is actually pulling live data into Supabase
2. Get hiring ticker live on homepage with real data (30/60/90 day toggle)
3. Executive moves feed (new CDO/CAIO appointment announcements) — separate from job listings
4. Confirm Vercel crons are scheduled and firing
5. AEO: add JSON-LD + FAQ schema to /hiring, /intelligence, /compensation pages
6. Email digest (weekly) via Tally subscriber list
7. Vendor sponsorship page + pricing
---
## Ace's Access
Ace (Jared's Telegram agent) reads this file from:
https://raw.githubusercontent.com/jaredmbral-byte/cdaoinsights-site/main/CLAUDE.md
When Jared makes decisions via Telegram, Ace drafts updates here.
Jared pastes them into Claude Code → commits → Ace stays in sync.
