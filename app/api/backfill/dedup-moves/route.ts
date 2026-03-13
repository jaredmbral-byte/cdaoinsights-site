import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// One-time cleanup: deduplicate executive_moves table + remove non-move articles
// Usage: POST /api/backfill/dedup-moves with Authorization: Bearer <CRON_SECRET>
// Add ?dry=true to preview without deleting

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry') === 'true'

  const { data: moves, error: fetchError } = await supabaseAdmin
    .from('executive_moves')
    .select('id, person_name, company_name, title, headline, published_at, source_url')
    .order('published_at', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!moves || moves.length === 0) {
    return NextResponse.json({ message: 'No moves to process', deleted: 0 })
  }

  const idsToDelete: string[] = []
  const deleteReasons: Record<string, string> = {}

  // ── Phase 1: Remove non-move articles ──
  // These are news articles, opinion pieces, etc. that match CDO/CAIO keywords
  // but aren't actual executive appointment/departure announcements
  const NON_MOVE_PATTERNS = [
    /roundtable|summit|conference|webinar/i,
    /accuses|shuts down rumors|launches|unveils|issues draft/i,
    /\bIndyCar\b|\bFormula\b|\bNASCAR\b/i,
    /scaling to \d+|on scaling/i,
    /will \d{4} be the year/i,
    /literacy framework/i,
    /passionate debates|loud rumors/i,
    /safety guide for citizens/i,
  ]

  // An actual move headline should contain an action verb indicating appointment
  const MOVE_VERBS = /\b(appoint|name[ds]?|hire[ds]?|promote[ds]?|tap[ps]?|elevate[ds]?|join[s]?|select[s]?)\b/i

  for (const move of moves) {
    const hl = move.headline || ''

    // Check if headline matches a known non-move pattern
    if (NON_MOVE_PATTERNS.some(p => p.test(hl))) {
      idsToDelete.push(move.id)
      deleteReasons[move.id] = 'non-move pattern'
      continue
    }

    // If headline has no move verb AND no person name was extracted, likely not a real move
    // Exception: keep if company_name is present (might be a valid move with a weak headline)
    if (!MOVE_VERBS.test(hl) && !move.person_name && !move.company_name) {
      idsToDelete.push(move.id)
      deleteReasons[move.id] = 'no move verb + no person/company'
      continue
    }
  }

  // ── Phase 2: Keyword-overlap dedup ──
  // Extract significant words from each headline, group overlapping headlines
  // Words that appear in nearly every move headline — never count as overlap
  const IGNORE_WORDS = new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'for', 'and', 'as', 'at', 'by',
    'on', 'is', 'it', 'new', 'its', 'with', 'from', 'has', 'was', 'are',
    'that', 'this', 'will', 'be', 'been', 'have', 'had', 'not', 'but', 'or',
    // Generic title/role words — these appear in every CDO/CAIO move
    'chief', 'officer', 'data', 'named', 'names', 'appoints', 'appointed',
    'announces', 'hires', 'promotes', 'taps', 'elevates', 'joins', 'selects',
    'former', 'first', 'senior', 'head', 'vice', 'president', 'director',
    'global', 'executive', 'leadership', 'moves', 'week', 'magazine',
  ])

  function getSignificantWords(text: string): Set<string> {
    return new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !IGNORE_WORDS.has(w))
    )
  }

  function wordOverlap(a: Set<string>, b: Set<string>): number {
    let count = 0
    for (const w of a) if (b.has(w)) count++
    return count
  }

  // Only check non-deleted moves
  const remaining = moves.filter(m => !idsToDelete.includes(m.id))
  const kept: typeof remaining = []

  function isWithin7Days(a: string, b: string): boolean {
    return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (24 * 3600_000) <= 7
  }

  for (const move of remaining) {
    const moveWords = getSignificantWords(move.headline || '')
    let isDup = false

    for (const existing of kept) {
      if (!isWithin7Days(existing.published_at, move.published_at)) continue

      const existingWords = getSignificantWords(existing.headline || '')
      const overlap = wordOverlap(moveWords, existingWords)

      // Need 2+ significant (non-title) words in common — e.g. person name + company name
      if (overlap >= 2) {
        isDup = true
        idsToDelete.push(move.id)
        const sharedWords = [...moveWords].filter(w => existingWords.has(w))
        deleteReasons[move.id] = `headline overlap with ${existing.id.slice(0, 8)} [${sharedWords.join(', ')}]`
        break
      }
    }

    if (!isDup) {
      kept.push(move)
    }
  }

  // ── Phase 3: Delete ──
  let deleted = 0
  if (!dryRun) {
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batch = idsToDelete.slice(i, i + 50)
      const { error } = await supabaseAdmin
        .from('executive_moves')
        .delete()
        .in('id', batch)
      if (!error) deleted += batch.length
      else console.error('Delete batch failed:', error.message)
    }
  }

  // Build debug output showing what gets deleted and why
  const deletedMoves = moves
    .filter(m => idsToDelete.includes(m.id))
    .map(m => ({
      id: m.id.slice(0, 8),
      reason: deleteReasons[m.id],
      headline: (m.headline || '').slice(0, 90),
    }))

  const keptMoves = kept.map(m => ({
    id: m.id.slice(0, 8),
    person_name: m.person_name,
    company_name: m.company_name,
    title: m.title,
    headline: (m.headline || '').slice(0, 90),
  }))

  return NextResponse.json({
    dryRun,
    total: moves.length,
    toDelete: idsToDelete.length,
    deleted,
    remaining: moves.length - (dryRun ? 0 : deleted),
    deletedMoves,
    keptMoves,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(request: Request) {
  return POST(request)
}
