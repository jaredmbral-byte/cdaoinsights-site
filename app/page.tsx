import HiringTicker from '@/components/HiringTicker'
import MovesTicker from '@/components/MovesTicker'
import { createServerClient } from '@/lib/supabase-server'
import { cleanTitle } from '@/lib/text'
import type { ExecutiveMove } from '@/lib/types'
import { getHomepageAnalytics } from '@/lib/homepage-analytics'
import { StatStrip, ChartCard, TrendArea, BarList, TopicMomentumList } from '@/components/Charts'

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

// Monochrome topic tag style — one style for all topics
const TOPIC_TAG_STYLE = 'border-[#C9C4BB] text-[#6B6864]'


export default async function Home() {
  const supabase = createServerClient()
  const cutoff90 = new Date()
  cutoff90.setDate(cutoff90.getDate() - 90)

  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)

  const cutoff7 = new Date()
  cutoff7.setDate(cutoff7.getDate() - 7)

  // Analytics layer (trend series, distributions, WoW deltas) runs concurrently.
  const analyticsPromise = getHomepageAnalytics(supabase)

  // Parallel data fetch — latest-signal tables + market pulse
  const [
    movesResult,
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

  const analytics = await analyticsPromise
  const latestMoves = (movesResult.data || []) as ExecutiveMove[]

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
        <div className="border-b border-[#C9C4BB] overflow-x-auto">
          <div className="max-w-[1200px] mx-auto px-6 h-10 flex items-center gap-8 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-[1px] text-[#6B6864]">Live</span>
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
            className="text-2xl sm:text-3xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0A0A0A] mb-2"
          >
            See what your peers are doing before the board asks
          </h1>
          <p className="text-sm text-[#6B6864] leading-relaxed max-w-xl">
            Executive moves, hiring, vendor activity, and market signal across enterprise data and AI. Tracked daily and screened. Built for CDOs, CAIOs, and VPs of AI and ML.
          </p>
        </section>

        {/* ── Signal Brief — Week in Numbers ──────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6864]">
              Signal Brief · the week in numbers
            </h2>
            <span className="font-mono text-[10px] text-[#8A8782]">updated daily</span>
          </div>
          <StatStrip stats={analytics.headlineStats} />
        </section>

        {/* ── Trends ──────────────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ChartCard
                title="Appointment velocity"
                hint={`Senior data & AI exec appointments · last ${analytics.windowWeeks} weeks`}
                href="/moves"
              >
                <TrendArea points={analytics.appointmentVelocity} ariaLabel="Weekly appointment velocity" />
              </ChartCard>
            </div>
            <ChartCard title="Appointments by role" hint="CDO · CAIO · CDAO mix · 12 weeks" href="/moves">
              <BarList items={analytics.personaMix} />
            </ChartCard>
          </div>
        </section>

        {/* ── Distributions ───────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Skills in demand" hint="Platforms named in senior job posts · 90d" href="/hiring">
              <BarList items={analytics.skillsInDemand} />
            </ChartCard>
            <ChartCard title="Hiring by sector" hint="Featured roles by industry · 90d" href="/hiring">
              <BarList items={analytics.hiringByIndustry} />
            </ChartCard>
            <ChartCard title="Topic momentum" hint="Article mentions · this week vs last" href="/intelligence">
              <TopicMomentumList items={analytics.topicMomentum} />
            </ChartCard>
          </div>
        </section>

        {/* ── Latest Signals divider (raw feeds live below the analysis) ── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-1">
          <div className="flex items-baseline justify-between border-t border-[#C9C4BB] pt-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6864]">
              Latest signals · raw feed
            </h2>
            <span className="font-mono text-[10px] text-[#8A8782]">drill into any headline →</span>
          </div>
        </section>

        {/* ── Command Center Grid (3 columns) ─────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pt-4 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">

            {/* Panel A — Hiring Intel */}
            <div className="border border-[#C9C4BB] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#6B6864]">
                  Hiring Intel
                </h2>
                <a href="/hiring" className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                  All →
                </a>
              </div>

              {/* Seniority breakdown */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] mb-2">By Seniority</h3>
                {['C-Suite', 'SVP', 'VP', 'Director+', 'Other'].map((level) => {
                  const count = seniorityCounts[level] || 0
                  if (count === 0) return null
                  return (
                    <a key={level} href="/hiring" className="flex items-center justify-between py-1.5 border-b border-[#C9C4BB] last:border-0 hover:bg-[#111111] transition-colors">
                      <span className="text-xs text-[#6B6864]">{level}</span>
                      <span className="font-mono text-sm font-semibold text-[#0A0A0A]">
                        {count}
                      </span>
                    </a>
                  )
                })}
              </div>

              <p className="font-mono text-[10px] text-[#6B6864] mt-3">90-day window</p>
            </div>

            {/* Panel B — Exec Moves (center, wider) */}
            <div className="border border-[#C9C4BB] rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#C9C4BB]">
                <div>
                  <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#6B6864]">
                    Exec Moves
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#6B6864]">
                      <span className="text-[#0A0A0A] font-semibold">{appointedCount}</span> appointed
                    </span>
                    <span className="text-[#8A8782]">|</span>
                    <span className="text-xs text-[#6B6864]">
                      <span className="text-[#EF4444] font-semibold">{departedCount}</span> departed
                    </span>
                  </div>
                </div>
                <a href="/moves" className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                  View all →
                </a>
              </div>
              {latestMoves.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-[#6B6864]">No recent executive moves. Feed refreshes daily.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#C9C4BB]">
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
                            className="text-sm text-[#0A0A0A] hover:opacity-60 leading-snug block"
                          >
                            {cleanTitle(move.headline)}
                          </a>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6864] mt-0.5">
                            {move.company_name && (
                              <span className="text-[#6B6864]">{move.company_name}</span>
                            )}
                            {move.published_at && !isNaN(new Date(move.published_at).getTime()) && (
                              <>
                                {move.company_name && <span className="text-[#8A8782]">|</span>}
                                <span className="font-mono">{timeAgo(move.published_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {move.person_name && (
                            <span className="font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border border-[#C9C4BB] text-[#6B6864]">
                              {move.person_name}
                            </span>
                          )}
                          {move.move_type && (
                            <span className={`font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${
                              move.move_type === 'leaves'
                                ? 'border-red-500/30 text-[#EF4444]'
                                : 'border-[#C9C4BB] text-[#6B6864]'
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
            <div className="border border-[#C9C4BB] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#6B6864]">
                  Market Pulse
                </h2>
                <a href="/intelligence" className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                  All →
                </a>
              </div>

              {/* Top topics */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] mb-2">Top Topics</h3>
                {topTopics.length === 0 ? (
                  <p className="text-xs text-[#6B6864]">No topics tracked yet.</p>
                ) : (
                  topTopics.map(([topic, count]) => (
                    <a
                      key={topic}
                      href="/intelligence"
                      className="flex items-center justify-between py-1.5 border-b border-[#C9C4BB] last:border-0 hover:bg-[#111111] transition-colors group"
                    >
                      <span className={`font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${TOPIC_TAG_STYLE}`}>
                        {topic.replace('-', ' ')}
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#0A0A0A]">
                        {count}
                      </span>
                    </a>
                  ))
                )}
              </div>

              <p className="font-mono text-[10px] text-[#6B6864] mt-3">30-day window</p>
            </div>
          </div>
        </section>

        {/* ── AI Tools Trending ─────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="border border-[#C9C4BB] rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#6B6864]">Enterprise AI</h2>
                <span className="font-mono text-[10px] text-[#6B6864]">What CDOs &amp; CAIOs are deploying</span>
              </div>
            </div>
            <p className="text-sm text-[#6B6864] leading-relaxed">
              <span className="text-[#0A0A0A] font-semibold">{aiToolsCount}</span> enterprise AI signals tracked this week.
            </p>
          </div>
        </section>


        {/* ── Email Signup ────────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-12 border-t border-[#C9C4BB] pt-12">
          <div className="border border-[#C9C4BB] rounded-sm p-6 sm:p-8">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-[#0A0A0A] mb-2">
                Get the weekly brief
              </h2>
              <p className="text-sm text-[#6B6864] mb-4">
                One email. Five minutes. The week's executive moves, hiring signals, and vendor activity.
              </p>
              <form className="flex flex-col sm:flex-row gap-3" action="https://cdn.forms-content-1.com/sf/..." method="POST">
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  required
                  className="flex-1 bg-[#FFFFFF] border border-[#C9C4BB] rounded-sm px-4 py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#6B6864] focus:outline-none focus:border-[#0A0A0A]"
                />
                <button
                  type="submit"
                  className="bg-[#0A0A0A] text-[#F5F3EE] font-medium text-sm px-6 py-2.5 rounded-sm hover:bg-[#3A3A3A] transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="font-mono text-[10px] text-[#6B6864] mt-3">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
