import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Admin client for cron jobs and data ingestion
// Uses service role key — never expose to browser
// Lazy-init: avoids crashing during Next.js static build workers
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _admin
}

// Backward compat — existing callers use `supabaseAdmin.from(...)`
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabaseAdmin().from(...args),
  rpc: (...args: Parameters<SupabaseClient['rpc']>) => getSupabaseAdmin().rpc(...args),
}
