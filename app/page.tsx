import HiringTicker from '@/components/HiringTicker'
import MovesTicker from '@/components/MovesTicker'
import { createServerClient } from '@/lib/supabase-server'
import { cleanTitle, cleanSummary } from '@/lib/text'
import type { ExecutiveMove, CompBenchmark } from '@/lib/types'

export const dynamic = 'force-dynamic' // Dashboard data — always fresh
export const revalidate = 900 // 15 minutes ISR fallback

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const MOVE_TYPE_LABELS: Record<string, string> = {
  appointed: 'Appointed',
  named: 'Named',
  joins: 'Joins',
  leaves: 'Departs',
  promoted: 'Promoted',
}

const TOPIC_COLORS: Record<string, string> = {
  ai: 'border-blue-500/30 text-blue-400',
  genai: 'border-purple-500/30 text-purple-400',
  governance: 'border-amber-500/30 text-amber-400',
  strategy: 'border-green-500/30 text-green-400',
  leadership: 'border-rose-500/30 text-rose-400',
  funding: 'border-emerald-500/30 text-emerald-400',
  'data-quality': 'border-orange-500/30 text-orange-400',
  security: 'border-red-500/30 text-red-400',
  'agentic-ai': 'border-indigo-500/30 text-indigo-400',
  infrastructure: 'border-cyan-500/30 text-cyan-400',
  layoffs: 'border-red-500/30 text-red-400',
  'ai-deployment': 'border-violet-500/30 text-violet-400',
  'microsoft-fabric': 'border-blue-400/30 text-blue-300',
  general: 'border-[#333] text-[#888888]',
}


function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export default async function Home() {
  const supabase = createServerClient()
  const cutoff90 = new Date()
  cutoff90.setDate(cutoff90.getDate() - 90)

  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)

  const cutoff7 = new Date()
  cutoff7.setDate(cutoff7.getDate() - 7)

  // Parallel data fetch — dashboard panels
  const [
    movesResult,
    hiringCountResult,
    movesCountResult,
    articlesCountResult,
    compResult,
    hiringSeniorityResult,
    movesTypeResult,
    marketTopicsResult,
    aiToolsCountResult,
  ] = await Promise.all([
    // Latest 5 executive moves
    supabase
      .from('executive_moves')
      .select('id, headline, person_name, company_name, move_type, source_url, published_at')
      .order('published_at', { ascending: false })
      .limit(5),
    // Hiring signals count (90d) — featured only
    supabase
      .from('hiring_signals')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true)
      .gte('posted_at', cutoff90.toISOString()),
    // Executive moves count (90d)
    supabase
      .from('executive_moves')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', cutoff90.toISOString()),
    // Market articles count
    supabase
      .from('market_articles')
      .select('id', { count: 'exact', head: true })
      .gte('relevance', 0.5),
    // CDO median comp (p50)
    supabase
      .from('comp_benchmarks')
      .select('p50')
      .eq('role_title', 'Chief Data Officer')
      .limit(1),
    // Seniority breakdown (featured roles only from last 90d)
    supabase
      .from('hiring_signals')
      .select('seniority')
      .eq('is_featured', true)
      .gte('posted_at', cutoff90.toISOString()),
    // Move type summary (appointed vs departed, last 90d)
    supabase
      .from('executive_moves')
      .select('move_type')
      .gte('published_at', cutoff90.toISOString()),
    // Market topics (all topics from last 30d)
    supabase
      .from('market_articles')
      .select('topics')
      .gte('published_at', cutoff30.toISOString()),
    // AI tools count (last 7 days)
    supabase
      .from('market_articles')
      .select('id', { count: 'exact', head: true })
      .or('topics.cs.{enterprise-ai-tools},topics.cs.{agentic-ai}')
      .gte('published_at', cutoff7.toISOString()),
  ])

  const latestMoves = (movesResult.data || []) as ExecutiveMove[]

  // Stat panel data
  const hiringCount = hiringCountResult.count ?? 0
  const movesCount = movesCountResult.count ?? 0
  const articlesCount = articlesCountResult.count ?? 0
  const cdoP50 = (compResult.data?.[0] as CompBenchmark | undefined)?.p50 ?? null

  // Seniority breakdown from DB column (not classifySeniority)
  const seniorityRows = (hiringSeniorityResult.data || []) as Array<{ seniority: string | null }>
  const seniorityCounts: Record<string, number> = { 'C-Suite': 0, SVP: 0, VP: 0, 'Director+': 0, Other: 0 }
  for (const row of seniorityRows) {
    const level = row.seniority || 'Other'
    // Map DB values to display labels
    if (level === 'C-Suite' || level === 'SVP' || level === 'VP' || level === 'Director+') {
      seniorityCounts[level] = (seniorityCounts[level] || 0) + 1
    } else {
      seniorityCounts.Other = (seniorityCounts.Other || 0) + 1
    }
  }

  // Move type summary (appointed vs departed)
  const moveTypeRows = (movesTypeResult.data || []) as Array<{ move_type: string }>
  let appointedCount = 0
  let departedCount = 0
  for (const row of moveTypeRows) {
    if (row.move_type === 'leaves') {
      departedCount++
    } else {
      appointedCount++
    }
  }

  // Market topics (top 5)
  const topicRows = (marketTopicsResult.data || []) as Array<{ topics: string[] }>
  const topicCounts: Record<string, number> = {}
  for (const row of topicRows) {
    for (const topic of row.topics || []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    }
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // AI tools count
  const aiToolsCount = aiToolsCountResult.count ?? 0

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex-1">

        {/* ── Live Stat Bar ─────────────────────────────────────────────── */}
        <div className="border-b border-[#1E1E1E] overflow-x-auto">
          <div className="max-w-[1200px] mx-auto px-6 h-10 flex items-center gap-8 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-[1px] text-[#555555]">Live</span>
            </div>
            <HiringTicker />
            <MovesTicker />
          </div>
        </div>

        {/* ── Compact Hero ───────────────────────────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pt-10 pb-6"
          aria-labelledby="hero-heading"
        >
          <h1
            id="hero-heading"
            className="text-2xl sm:text-3xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#E8E8E8] mb-2"
          >
            Know what your peers are doing before your next board meeting
          </h1>
          <p className="text-sm text-[#888888] leading-relaxed max-w-xl">
            Real-time intelligence for CDOs and CAIOs. Track executive moves, hiring patterns, and what tools enterprises are actually deploying — not what vendors say they're deploying.
          </p>
        </section>

        {/* ── Stat Panels ────────────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a href="/hiring" className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors group">
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-1">Open Positions</p>
              <p className="text-2xl font-semibold text-[#00FF94]">{hiringCount.toLocaleString()}</p>
              <p className="font-mono text-[10px] text-[#555555] mt-0.5">Job postings · 90d</p>
            </a>
            <a href="/moves" className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors group">
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-1">C-Suite Moves</p>
              <p className="text-2xl font-semibold text-[#00FF94]">{movesCount.toLocaleString()}</p>
              <p className="font-mono text-[10px] text-[#555555] mt-0.5">Appointments &amp; departures · 90d</p>
            </a>
            <a href="/intelligence" className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors group">
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-1">Market Signals</p>
              <p className="text-2xl font-semibold text-[#00FF94]">{articlesCount.toLocaleString()}</p>
              <p className="font-mono text-[10px] text-[#555555] mt-0.5">Tracked articles</p>
            </a>
            <a href="/compensation" className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors group">
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-1">CDO Median Comp</p>
              <p className="text-2xl font-semibold text-[#00FF94]">{cdoP50 ? formatCurrency(cdoP50) : '\u2014'}</p>
              <p className="font-mono text-[10px] text-[#555555] mt-0.5">Base (P50)</p>
            </a>
          </div>
        </section>

        {/* ── Command Center Grid (3 columns) ─────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">

            {/* Panel A — Hiring Intel */}
            <div className="border border-[#1E1E1E] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
                  Hiring Intel
                </h2>
                <a href="/hiring" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">
                  All →
                </a>
              </div>

              {/* Seniority breakdown */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-2">By Seniority</h3>
                {['C-Suite', 'SVP', 'VP', 'Director+', 'Other'].map((level) => {
                  const count = seniorityCounts[level] || 0
                  if (count === 0) return null
                  return (
                    <a key={level} href="/hiring" className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0 hover:bg-[#111111] transition-colors">
                      <span className="text-xs text-[#888888]">{level}</span>
                      <span className="font-mono text-sm font-semibold text-[#E8E8E8]">
                        {count}
                      </span>
                    </a>
                  )
                })}
              </div>

              <p className="font-mono text-[10px] text-[#555555] mt-3">90-day window</p>
            </div>

            {/* Panel B — Exec Moves (center, wider) */}
            <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
                <div>
                  <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
                    Exec Moves
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#888888]">
                      <span className="text-[#00FF94] font-semibold">{appointedCount}</span> appointed
                    </span>
                    <span className="text-[#333]">|</span>
                    <span className="text-xs text-[#888888]">
                      <span className="text-[#EF4444] font-semibold">{departedCount}</span> departed
                    </span>
                  </div>
                </div>
                <a href="/moves" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">
                  View all →
                </a>
              </div>
              {latestMoves.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-[#555555]">No recent executive moves. Feed refreshes every 6 hours.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1E1E1E]">
                  {latestMoves.map((move) => (
                    <article
                      key={move.id}
                      className="px-4 py-2.5 hover:bg-[#111111] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <a
                            href={move.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#E8E8E8] hover:text-[#3B82F6] leading-snug block"
                          >
                            {cleanTitle(move.headline)}
                          </a>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#555555] mt-0.5">
                            {move.company_name && (
                              <span className="text-[#888888]">{move.company_name}</span>
                            )}
                            {move.published_at && !isNaN(new Date(move.published_at).getTime()) && (
                              <>
                                {move.company_name && <span className="text-[#333]">|</span>}
                                <span className="font-mono">{timeAgo(move.published_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {move.person_name && (
                            <span className="font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border border-[#1E1E1E] text-[#888888]">
                              {move.person_name}
                            </span>
                          )}
                          {move.move_type && (
                            <span className={`font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${
                              move.move_type === 'leaves'
                                ? 'border-red-500/30 text-[#EF4444]'
                                : 'border-[#1E1E1E] text-[#888888]'
                            }`}>
                              {MOVE_TYPE_LABELS[move.move_type] || move.move_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Panel C — Market Pulse */}
            <div className="border border-[#1E1E1E] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
                  Market Pulse
                </h2>
                <a href="/intelligence" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">
                  All →
                </a>
              </div>

              {/* Top topics */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-2">Top Topics</h3>
                {topTopics.length === 0 ? (
                  <p className="text-xs text-[#555555]">No topics tracked yet.</p>
                ) : (
                  topTopics.map(([topic, count]) => (
                    <a
                      key={topic}
                      href="/intelligence"
                      className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0 hover:bg-[#111111] transition-colors group"
                    >
                      <span className={`font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${TOPIC_COLORS[topic] || TOPIC_COLORS.general}`}>
                        {topic.replace('-', ' ')}
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#E8E8E8]">
                        {count}
                      </span>
                    </a>
                  ))
                )}
              </div>

              <p className="font-mono text-[10px] text-[#555555] mt-3">30-day window</p>
            </div>
          </div>
        </section>

        {/* ── AI Tools Trending ─────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="border border-[#1E1E1E] rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">Enterprise AI</h2>
                <span className="font-mono text-[10px] text-[#555555]">What CDOs &amp; CAIOs are deploying</span>
              </div>
              <a href="/ai-tools" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">All →</a>
            </div>
            <p className="text-sm text-[#888888] leading-relaxed">
              <span className="text-[#00FF94] font-semibold">{aiToolsCount}</span> enterprise AI signals tracked this week.
              Snowflake Cortex, Databricks AI, agentic analytics, and more.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Snowflake Cortex", "Databricks AI", "Agentic Analytics", "Microsoft Copilot", "WisdomAI"].map((tool) => (
                <a key={tool} href="/ai-tools"
                  className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 border border-[#1E1E1E] rounded-sm text-[#555555] hover:border-[#333] hover:text-[#888888] transition-colors">
                  {tool}
                </a>
              ))}
            </div>
          </div>
        </section>


        {/* ── Email Signup ────────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-12 border-t border-[#1E1E1E] pt-12">
          <div className="border border-[#1E1E1E] rounded-sm p-6 sm:p-8">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">
                Get the weekly brief
              </h2>
              <p className="text-sm text-[#888888] mb-4">
                One email. Five minutes. What CDOs and CAIOs are actually doing — not what vendors say they're doing.
              </p>
              <form className="flex flex-col sm:flex-row gap-3" action="https://cdn.forms-content-1.com/sf/..." method="POST">
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  required
                  className="flex-1 bg-[#0A0A0A] border border-[#1E1E1E] rounded-sm px-4 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#333]"
                />
                <button
                  type="submit"
                  className="bg-[#00FF94] text-[#0A0A0A] font-medium text-sm px-6 py-2.5 rounded-sm hover:bg-[#00E085] transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="font-mono text-[10px] text-[#555555] mt-3">
                No spam. Unsubscribe anytime. Join 200+ data leaders.
              </p>
            </div>
          </div>
        </section>

        {/* ── About / Why This Exists ─────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555] mb-4">
                Why this exists
              </h2>
              <p className="text-sm text-[#888888] leading-relaxed mb-4">
                Built after 7 years running Gartner's fastest-growing C-suite program. 
                I watched CDOs waste hours sifting through vendor hype to find out what 
                their peers were actually doing.
              </p>
              <p className="text-sm text-[#888888] leading-relaxed">
                This tracks 500+ signals weekly — executive moves, hiring patterns, 
                tool adoption — so you know what's happening before your next board meeting.
              </p>
            </div>
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555] mb-4">
                Methodology
              </h2>
              <ul className="space-y-2 text-sm text-[#888888]">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF94]">—</span>
                  <span>Executive moves tracked from 50+ sources, updated every 6 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF94]">—</span>
                  <span>Hiring signals from public job boards, filtered to director+</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF94]">—</span>
                  <span>Market intelligence from 35+ RSS feeds, AI-extracted topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF94]">—</span>
                  <span>No vendor sponsorship. No paid placements. Just data.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
