# Vendors Page Setup Instructions

## SQL Migration Required
Before the /vendors page will work, you need to run the SQL migration:

```bash
# Option 1: Via Supabase CLI (if configured)
supabase db push supabase/vendors-seed.sql

# Option 2: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql
# 2. Copy and paste the contents of supabase/vendors-seed.sql
# 3. Run the query
```

The SQL file is located at: `supabase/vendors-seed.sql`

This will:
- Create the `vendors` table (if not exists)
- Create the `vendor_signals` table (if not exists)
- Seed 43 vendors from the Gartner D&A Summit exhibitor list

## What Was Built

### Page Structure
- **Route:** `/vendors`
- **Title:** "The Data & AI Vendor Landscape"
- **Subhead:** "Tools and platforms CDOs are buying, deploying, and tracking in 2026"

### Features
1. **Category Filters** (client-side, no page reload):
   - All
   - Data Platform
   - Governance
   - AI & Analytics
   - Observability
   - Integration
   - Enterprise Suite
   - Data Intelligence
   - Data Security
   - Data Resilience
   - AI Governance

2. **Vendor Cards** (3 columns desktop, 1 column mobile):
   - Vendor name (bold)
   - Category badge (colored pill)
   - Website URL (linked, opens in new tab)
   - Job mention count from vendor_adoption_signals data (if available, else 0)

3. **Sort Options:**
   - A-Z (default)
   - Most Mentions

4. **Navigation:**
   - "Vendors" link added to site nav between Intelligence and Compensation

### Files Created/Modified
- `/app/vendors/page.tsx` - Server component (fetches vendors + mention counts)
- `/components/VendorGrid.tsx` - Client component (filtering/sorting UI)
- `/app/layout.tsx` - Added "Vendors" nav link

### Data Source
- Vendors: `vendors` table
- Job mention counts: Calculated from `hiring_signals.tech_stack` and `job_title` (90-day window)
- Uses same vendor mention logic as homepage vendor_adoption_signals panel

### Styling
- Matches existing dark theme
- Uses Tailwind color palette for category badges
- Consistent with other page card patterns
- Fully responsive

## Testing Locally

To test locally, you need:
1. `.env.local` with Supabase credentials:
   ```
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

2. Run the SQL migration (see above)

3. Build and run:
   ```bash
   npm run build
   npm run dev
   ```

## Deployment

Once the SQL migration is run in production Supabase:
1. Commit and push to main
2. Vercel will auto-deploy
3. Page will be live at https://cdaoinsights.com/vendors
