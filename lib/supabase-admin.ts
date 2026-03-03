import { createClient } from '@supabase/supabase-js'

// Admin client for cron jobs and data ingestion
// Uses service role key — never expose to browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
