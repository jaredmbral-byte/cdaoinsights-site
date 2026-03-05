# cdaoinsights.com

Real-time intelligence platform for enterprise data & AI leaders (CDO / CDAIO / CAIO / VP Data). Dark theme, data-dense, zero fluff.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS — dark theme (#0A0A0A bg, #E8E8E8 text, #00FF94 accent)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Forms:** Tally.so (email capture, form ID hardcoded in `components/TallyForm.tsx`)
- **DNS:** Cloudflare → Vercel (Cloudflare set to DNS only / grey cloud)
- **Scraping:** Firecrawl (hiring signals)

## Setup

```bash
npm install
cp .env.local.example .env.local  # fill in Supabase + API keys
npm run dev
```

## Environment Variables

| Variable | Required | Where | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel + `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel + `.env.local` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel + `.env.local` | Supabase service role key (server-side only) |
| `CRON_SECRET` | Yes | Vercel + `.env.local` | Protects ingestion API routes |
| `FIRECRAWL_API_KEY` | Yes | Vercel + `.env.local` | Firecrawl scraping API key |
| `RAPIDAPI_KEY` | No | — | Reserved for future compensation data APIs |

## Pages

| Route | Description | Data Source |
|---|---|---|
| `/` | Homepage — weekly brief, hiring ticker, moves ticker, intelligence feed, FAQ | All tables |
| `/hiring` | CDO/CAIO/VP Data job listings with filters | `hiring_signals` |
| `/intelligence` | News & insights feed with topic filters | `market_articles` |
| `/compensation` | Salary benchmarks by role/geography | `comp_benchmarks` |
| `/moves` | Executive appointment & departure tracker | `executive_moves` |

## Supabase Tables

| Table | Migration File | Notes |
|---|---|---|
| `hiring_signals` | `supabase/migrations/001_hiring_signals.sql` | Job listings |
| `market_articles` | `supabase/migrations/001_market_articles.sql` | News articles |
| `comp_benchmarks` | `supabase/migrations/001_comp_benchmarks.sql` | Salary data |
| `executive_moves` | `supabase/migrations/002_executive_moves.sql` | Leadership moves |
| `weekly_brief` | `supabase/migrations/003_weekly_brief.sql` | Homepage brief cards |

To apply migrations, run the SQL in Supabase Dashboard → SQL Editor.

## Data Ingestion (Cron Jobs)

Automated ingestion is configured via **Vercel Cron Jobs** in `vercel.json`:

| Route | Schedule | Source |
|---|---|---|
| `/api/ingest/hiring` | Daily at 6:00 UTC | Firecrawl → LinkedIn/Indeed |
| `/api/ingest/news` | Daily at 7:00 UTC | Google News RSS feeds |
| `/api/ingest/moves` | Daily at 8:00 UTC | Google News RSS (executive moves) |
| `/api/ingest/compensation` | 1st of month at midnight | TBD |

All ingestion routes are protected by `CRON_SECRET` — pass via `Authorization: Bearer <CRON_SECRET>` header.

For external cron triggers (e.g., cron-job.org), point HTTP GET/POST requests at `https://cdaoinsights.com/api/ingest/<route>` with the auth header.

## Deploy

Vercel auto-deploys on every push to `main`. No extra config needed.

### Custom Domain (Cloudflare → Vercel)

In Vercel → Settings → Domains → Add `cdaoinsights.com`. Vercel provides DNS records. In Cloudflare:
- Add CNAME: `cdaoinsights.com` → `cname.vercel-dns.com`
- Set Cloudflare proxy to **DNS only** (grey cloud) — Vercel handles SSL

## Text Cleaning

RSS-ingested content (Google News) often contains raw HTML tags, entities, and truncated markup. The shared utility `lib/text.ts` provides:

- `stripHtml()` — Multi-pass HTML entity decoding + tag stripping
- `cleanTitle()` — Strips HTML + removes trailing source name suffixes
- `cleanSummary()` — Strips HTML + suppresses summaries that just duplicate the title

These are applied at both render time (pages) and ingestion time (API routes).
