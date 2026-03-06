import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { classifyPersona } from '@/lib/taxonomy'

// One-time backfill: classify persona on all existing hiring_signals rows
// Run once after migration 004 is applied, then this route can be removed.
// Usage: POST /api/backfill/persona with Authorization: Bearer <CRON_SECRET>

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all rows that don't have a persona yet
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('hiring_signals')
    .select('id, job_title')
    .is('persona', null)
    .limit(1000)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: 'No rows to backfill', updated: 0 })
  }

  let updated = 0
  let failed = 0

  for (const row of rows) {
    const persona = classifyPersona(row.job_title)
    if (!persona) continue

    const { error } = await supabaseAdmin
      .from('hiring_signals')
      .update({ persona })
      .eq('id', row.id)

    if (!error) {
      updated++
    } else {
      failed++
    }
  }

  return NextResponse.json({
    total: rows.length,
    updated,
    failed,
    timestamp: new Date().toISOString(),
  })
}

// Allow GET for manual trigger via browser/curl
export { POST as GET }
