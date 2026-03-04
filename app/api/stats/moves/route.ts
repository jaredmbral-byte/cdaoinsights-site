import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Public API: returns executive moves counts and recent items
// Used by the homepage MovesTicker component

export async function GET() {
  const now = new Date()

  const days30 = new Date(now)
  days30.setDate(days30.getDate() - 30)
  const days60 = new Date(now)
  days60.setDate(days60.getDate() - 60)
  const days90 = new Date(now)
  days90.setDate(days90.getDate() - 90)

  const [count30, count60, count90, recentMoves] = await Promise.all([
    supabaseAdmin
      .from('executive_moves')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', days30.toISOString()),

    supabaseAdmin
      .from('executive_moves')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', days60.toISOString()),

    supabaseAdmin
      .from('executive_moves')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', days90.toISOString()),

    supabaseAdmin
      .from('executive_moves')
      .select('id, headline, person_name, company_name, move_type, source_url, published_at')
      .order('published_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    moves: recentMoves.data || [],
    counts: {
      last30: count30.count || 0,
      last60: count60.count || 0,
      last90: count90.count || 0,
    },
    generatedAt: now.toISOString(),
  })
}
