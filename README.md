# cdaoinsights.com

AEO-first landing page for CDAO Insights — community intelligence resource for enterprise data & AI leaders.

## Setup

```bash
npm install
npm run dev
```

## Before deploying

1. **Create your Tally form** at tally.so
   - Single field: Email address
   - Label: "Your work email"
   - Button: "Join"
   - Settings: Keep it minimal, no branding

2. **Add your Tally form ID** in `components/TallyForm.tsx`
   - Replace `REPLACE_WITH_TALLY_FORM_ID` with your actual form ID
   - Form ID is the string in your Tally share URL: `tally.so/r/YOUR_ID_HERE`

## Deploy to Vercel

Vercel auto-deploys on every push to main. No extra config needed.

## Add custom domain (Cloudflare → Vercel)

In Vercel dashboard → Settings → Domains → Add `cdaoinsights.com`

Vercel will give you DNS records. In Cloudflare:
- Add CNAME: `cdaoinsights.com` → `cname.vercel-dns.com`
- Or use the A record Vercel provides
- Set Cloudflare proxy to **DNS only** (grey cloud) — Vercel handles SSL

## Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Tally.so (email capture)
- Vercel (hosting)
