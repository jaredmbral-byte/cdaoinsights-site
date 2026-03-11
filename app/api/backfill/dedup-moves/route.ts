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
    .select('id, person_name, company_name, title, headline, published_at')
    .order('published_at', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!moves || moves.length === 0) {
    return NextResponse.json({ message: 'No moves to dedup', deleted: 0 })
  }

  const idsToDelete: number[] = []
  // Track by person name alone (a person rarely gets two C-suite roles in a week)
  const seenByPerson = new Map<string, { id: number; published_at: string }>()
  // Track by company + title (same role at same company = same announcement)
  const seenByCompanyTitle = new Map<string, { id: number; published_at: string }>()
  // Headline fallback
  const seenByHeadline = new Map<string, { id: number; published_at: string }>()

  function isWithin7Days(dateA: string, dateB: string): boolean {
    return Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / (24 * 3600_000) <= 7
  }

  for (const move of moves) {
    let isDup = false

    // Layer 1: Same person within 7 days
    if (move.person_name) {
      const personKey = move.person_name.toLowerCase().trim()
      const existing = seenByPerson.get(personKey)
      if (existing && isWithin7Days(existing.published_at, move.published_at)) {
        isDup = true
      } else if (!existing) {
        seenByPerson.set(personKey, { id: move.id, published_at: move.published_at })
      }
    }

    // Layer 2: Same company + title within 7 days
    if (!isDup && move.company_name && move.title) {
      const ctKey = `${move.company_name.toLowerCase().trim()}|${move.title.toLowerCase().trim()}`
      const existing = seenByCompanyTitle.get(ctKey)
      if (existing && isWithin7Days(existing.published_at, move.published_at)) {
        isDup = true
      } else if (!existing) {
        seenByCompanyTitle.set(ctKey, { id: move.id, published_at: move.published_at })
      }
    }

    // Layer 3: Headline fallback
    if (!isDup && !move.person_name && !move.company_name) {
      const coreHeadline = (move.headline || '')
        .replace(/\s*[-–|]\s*[A-Z][\w\s&.]+$/g, '')
        .trim()
        .toLowerCase()
      if (coreHeadline.length > 15) {
        const existing = seenByHeadline.get(coreHeadline)
        if (existing && isWithin7Days(existing.published_at, move.published_at)) {
          isDup = true
        } else if (!existing) {
          seenByHeadline.set(coreHeadline, { id: move.id, published_at: move.published_at })
        }
      }
    }

    if (isDup) {
      idsToDelete.push(move.id)
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
