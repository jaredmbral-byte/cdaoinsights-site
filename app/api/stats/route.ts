import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Public API: returns counts for hiring signals, articles, and benchmarks
// Used by the homepage ticker and any external consumers

export async function GET() {
  const now = new Date()

  // Calculate cutoff dates
  const days30 = new Date(now)
  days30.setDate(days30.getDate() - 30)
  const days60 = new Date(now)
  days60.setDate(days60.getDate() - 60)
  const days90 = new Date(now)
  days90.setDate(days90.getDate() - 90)

  // Run all queries in parallel
  const [
    hiring30,
    hiring60,
    hiring90,
    hiringTotal,
    articleCount,
    recentHires,
    topIndustries,
  ] = await Promise.all([
    // Hiring counts by time window
    supabaseAdmin
      .from('hiring_signals')
      .select('id', { count: 'exact', head: true })
      .gte('posted_at', days30.toISOString()),

    supabaseAdmin
      .from('hiring_signals')
      .select('id', { count: 'exact', head: true })
      .gte('posted_at', days60.toISOString()),

    supabaseAdmin
      .from('hiring_signals')
      .select('id', { count: 'exact', head: true })
      .gte('posted_at', days90.toISOString()),

    // Total hiring signals
    supabaseAdmin
      .from('hiring_signals')
      .select('id', { count: 'exact', head: true }),

    // Total articles
    supabaseAdmin
      .from('market_articles')
      .select('id', { count: 'exact', head: true }),

    // Most recent 5 hires for ticker display
    supabaseAdmin
      .from('hiring_signals')
      .select('job_title, company_name, seniority, industry, posted_at, source_url')
      .order('posted_at', { ascending: false })
      .limit(5),

    // Top industries by count (last 90 days)
    supabaseAdmin
      .from('hiring_signals')
      .select('industry')
      .gte('posted_at', days90.toISOString())
      .not('industry', 'is', null),
  ])

  // Count industries
  const industryCounts: Record<string, number> = {}
  if (topIndustries.data) {
    for (const row of topIndustries.data) {
      const ind = row.industry as string
      industryCounts[ind] = (industryCounts[ind] || 0) + 1
    }
  }

  // Sort industries by count
  const sortedIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    hiring: {
      last30: hiring30.count || 0,
      last60: hiring60.count || 0,
      last90: hiring90.count || 0,
      total: hiringTotal.count || 0,
    },
    articles: {
      total: articleCount.count || 0,
    },
    recentHires: recentHires.data || [],
    topIndustries: sortedIndustries,
    generatedAt: now.toISOString(),
  })
}
