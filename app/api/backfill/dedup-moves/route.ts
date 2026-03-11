import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// One-time cleanup: deduplicate executive_moves table
// Keeps the earliest row for each (person_name, company_name) within 7 days
// Usage: POST /api/backfill/dedup-moves with Authorization: Bearer <CRON_SECRET>

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all moves ordered by published_at
  const { data: moves, error: fetchError } = await supabaseAdmin
    .from('executive_moves')
    .select('id, person_name, company_name, headline, published_at')
    .order('published_at', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!moves || moves.length === 0) {
    return NextResponse.json({ message: 'No moves to dedup', deleted: 0 })
  }

  const idsToDelete: number[] = []
  const seen = new Map<string, { id: number; published_at: string }>()

  for (const move of moves) {
    // Build dedup key: person + company (case insensitive)
    let dedupKey: string | null = null

    if (move.person_name && move.company_name) {
      dedupKey = `${move.person_name.toLowerCase().trim()}|${move.company_name.toLowerCase().trim()}`
    } else {
      // Fallback: normalize headline (strip source suffix)
      const coreHeadline = (move.headline || '')
        .replace(/\s*[-–|]\s*[A-Z][\w\s&.]+$/g, '')
        .trim()
        .toLowerCase()
      if (coreHeadline.length > 15) {
        dedupKey = `headline:${coreHeadline}`
      }
    }

    if (!dedupKey) continue

    const existing = seen.get(dedupKey)
    if (existing) {
      // Check if within 7 day window
      const existingDate = new Date(existing.published_at).getTime()
      const currentDate = new Date(move.published_at).getTime()
      const daysDiff = Math.abs(currentDate - existingDate) / (24 * 3600_000)

      if (daysDiff <= 7) {
        // Duplicate — mark the newer one for deletion (keep earliest)
        idsToDelete.push(move.id)
      } else {
        // Same person+company but > 7 days apart — likely a different event
        seen.set(dedupKey, { id: move.id, published_at: move.published_at })
      }
    } else {
      seen.set(dedupKey, { id: move.id, published_at: move.published_at })
    }
  }

  // Delete duplicates in batches of 50
  let deleted = 0
  for (let i = 0; i < idsToDelete.length; i += 50) {
    const batch = idsToDelete.slice(i, i + 50)
    const { error } = await supabaseAdmin
      .from('executive_moves')
      .delete()
      .in('id', batch)

    if (!error) {
      deleted += batch.length
    } else {
      console.error(`Delete batch failed:`, error.message)
    }
  }

  return NextResponse.json({
    total: moves.length,
    duplicatesFound: idsToDelete.length,
    deleted,
    remaining: moves.length - deleted,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(request: Request) {
  return POST(request)
}
