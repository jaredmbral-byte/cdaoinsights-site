import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
// Use this in Server Components, Route Handlers, and Server Actions
// NEVER expose the service role key to the client
export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
