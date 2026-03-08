import HiringTicker from '@/components/HiringTicker'
import MovesTicker from '@/components/MovesTicker'
import { createServerClient } from '@/lib/supabase-server'
import { cleanTitle, cleanSummary } from '@/lib/text'
import type { ExecutiveMove, CompBenchmark } from '@/lib/types'

export const revalidate = 900 // 15 minutes

// ── FAQ data (mirrors JSON-LD in layout for visible page content) ────────────
const faqs = [
  { q: 'What is CDAO Insights?', a: 'CDAO Insights is an independent community intelligence resource for enterprise Chief Data Officers, Chief AI Officers, and senior data and analytics leaders. It covers data strategy, AI adoption, governance trends, and peer benchmarks across large enterprises \u2014 without vendor sponsorship influencing editorial.' },
  { q: 'What are the top priorities for Chief Data Officers in 2026?', a: 'Enterprise CDOs are primarily focused on three areas: operationalizing AI at scale, improving data quality and governance as the foundation for AI reliability, and demonstrating measurable business value from data investments. Agentic AI for data stewardship, unstructured data governance, and MDM modernization are emerging as high-priority initiatives.' },
  { q: 'What is the difference between a Chief Data Officer and a Chief AI Officer?', a: 'A Chief Data Officer (CDO) is responsible for enterprise data strategy, governance, data quality, and infrastructure. A Chief AI Officer (CAIO) focuses on AI strategy, model deployment, and AI governance. The roles are increasingly separate at large enterprises. The distinction matters: CDOs own the data foundation; CAIOs own what gets built on top of it.' },
  { q: 'What data governance challenges are enterprises facing in 2026?', a: 'The most common enterprise data governance challenges are: managing data quality at the scale required for AI reliability, governing unstructured data as GenAI adoption accelerates, maintaining data lineage across multi-cloud environments, and building stewardship programs that scale without proportional headcount growth.' },
  { q: 'How are large enterprises structuring their data and AI organizations?', a: 'Most large enterprises are moving toward a hybrid model: a central data platform team that owns infrastructure, governance, and standards, paired with embedded data professionals within business units. Chief AI Officer roles are increasingly separate from CDO functions, particularly where multiple AI deployments are in production.' },
  { q: 'How should a CDO structure their data organization?', a: 'Most enterprise CDOs use a hybrid model: a central data platform team (infrastructure, governance, tooling) combined with embedded data leads in business units. The center of excellence handles standards; the embedded leads handle execution. Flat is better \u2014 CDOs with fewer than 3 reporting layers move faster.' },
  { q: 'What AI governance framework do CDOs use?', a: 'The most common frameworks in enterprise data orgs are NIST AI RMF (especially post-EU AI Act), internal model risk management (MRM) adapted from financial services, and ISO/IEC 42001. Most CDOs layer these on top of existing data governance programs rather than building standalone AI governance from scratch.' },
  { q: 'What is the difference between data mesh and data fabric?', a: 'Data mesh is an organizational and ownership model \u2014 domain teams own and serve their own data products. Data fabric is a technology architecture \u2014 a unified integration layer that connects disparate sources via metadata and automation. They\u2019re not mutually exclusive; some enterprises run data mesh ownership principles on top of a data fabric technical layer.' },
  { q: 'Who does the CDO typically report to?', a: 'Reporting lines vary by industry and org maturity. Most CDOs report to the CEO (especially in data-native or heavily regulated industries), CTO, or COO. Reporting to the CFO is common in financial services. Reporting to the CIO signals a more infrastructure-focused mandate. CDOs with CEO reporting lines consistently have more budget authority and strategic influence.' },
  { q: 'What KPIs does a CDO track?', a: 'Common CDO KPIs include: data product adoption rate, data quality scores (completeness, accuracy, timeliness), time-to-insight for business requests, AI/ML model deployment velocity, data governance compliance rate, cost per data asset served, and revenue or cost savings attributed to data initiatives.' },
  { q: 'What do CDOs read to stay current?', a: 'CDOs rely on a short list of high-signal sources: MIT Sloan Management Review (data strategy), Harvard Business Review (leadership), Gartner research (vendor and market), TDWI briefings (technical depth), and peer networks like CDO Forum and MIT CDOIQ Symposium. Most CDOs are skeptical of vendor-produced content and prefer peer-to-peer intelligence.' },
  { q: 'Where do CDOs network and meet peers?', a: 'The top venues for CDO peer networking are: MIT CDOIQ Symposium (Cambridge, MA \u2014 August), CDO Forum events, DataCouncil conferences, Gartner Data & Analytics Summit, and private peer groups run by firms like Evanta and CDAO Division.' },
  { q: 'What is a data product and why do CDOs care?', a: 'A data product is a curated, documented, and reliably maintained data asset that internal or external consumers can discover and use without needing to understand its underlying pipelines. CDOs care because data products shift the org from reactive data delivery to scalable self-service \u2014 reducing ad hoc requests, improving data quality accountability, and enabling faster AI/ML development.' },
  { q: 'Why do AI pilots fail in enterprise data organizations?', a: 'The top reasons AI pilots fail: poor data quality in the underlying datasets, lack of clear business problem definition before building, no plan for operationalizing the model post-pilot, absence of executive sponsorship past the proof-of-concept stage, and governance gaps that cause legal or compliance blocks at deployment. The CDO is increasingly accountable for all five.' },
  { q: 'How long do CDOs stay in their roles?', a: 'CDO tenure is short \u2014 typically 2 to 3 years on average, though it varies significantly by industry. Government CDOs average 3\u20134 years. Healthcare and insurance CDOs last 2.5\u20133.5 years. Financial services and manufacturing average 2\u20132.5 years. Retail CDOs have the shortest tenure at 1.5\u20132 years, often due to the rapid pace of digital transformation expectations.' },
]

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
    topCompaniesResult,
    techStackResult,
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
    // Top hiring companies (90d) — featured roles only
    supabase
      .from('hiring_signals')
      .select('company_name')
      .eq('is_featured', true)
      .gte('posted_at', cutoff90.toISOString()),
    // Tech stack data for skill demand (90d) — ALL roles (including Tier 2 engineers)
    supabase
      .from('hiring_signals')
      .select('job_title, tech_stack')
      .gte('posted_at', cutoff90.toISOString()),
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

  // Top hiring companies (90d)
  const companyRows = (topCompaniesResult.data || []) as Array<{ company_name: string }>
  const companyCounts: Record<string, number> = {}
  for (const row of companyRows) {
    if (row.company_name) {
      companyCounts[row.company_name] = (companyCounts[row.company_name] || 0) + 1
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // AI skill demand tracker (90d)
  const techRows = (techStackResult.data || []) as Array<{ job_title: string; tech_stack: string[] | null }>
  const TRACKED_SKILLS = [
    'Databricks',
    'Snowflake',
    'dbt',
    'Spark',
    'Python',
    'SQL',
    'Azure',
    'AWS',
    'GCP',
    'Tableau',
    'PowerBI',
    'LLM',
    'GenAI',
    'Kubernetes',
  ]
  const skillCounts: Record<string, number> = {}
  TRACKED_SKILLS.forEach(skill => { skillCounts[skill] = 0 })

  for (const row of techRows) {
    const searchText = `${row.job_title} ${(row.tech_stack || []).join(' ')}`.toLowerCase()
    for (const skill of TRACKED_SKILLS) {
      if (searchText.includes(skill.toLowerCase())) {
        skillCounts[skill]++
      }
    }
  }
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

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
            Command Center for Enterprise Data &amp; AI Leadership
          </h1>
          <p className="text-sm text-[#888888] leading-relaxed max-w-xl">
            Real-time intelligence for CDOs, CAIOs, and senior data leaders. Track executive moves, hiring trends, and market signals. All in one place.
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
                {['C-Suite', 'SVP', 'VP', 'Director+', 'Other'].map((level) => (
                  <a key={level} href="/hiring" className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0 hover:bg-[#111111] transition-colors">
                    <span className="text-xs text-[#888888]">{level}</span>
                    <span className="font-mono text-sm font-semibold text-[#E8E8E8]">
                      {seniorityCounts[level] || 0}
                    </span>
                  </a>
                ))}
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
                            {move.published_at && (
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

        {/* ── New Panels Row (2 columns) ───────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Panel D — Top Hiring Companies */}
            <div className="border border-[#1E1E1E] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
                    Top Hiring Companies
                  </h2>
                  <span className="font-mono text-[10px] text-[#555555]">90d</span>
                </div>
                <a href="/hiring" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">
                  View all →
                </a>
              </div>

              {topCompanies.length === 0 ? (
                <p className="text-xs text-[#555555]">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topCompanies.map(([company, count], index) => (
                    <a
                      key={company}
                      href="/hiring"
                      className="flex items-center gap-3 py-1.5 hover:bg-[#111111] transition-colors rounded-sm px-2 -mx-2"
                    >
                      <span className="font-mono text-[10px] text-[#555555] w-5 flex-shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-[#E8E8E8] flex-1 truncate">
                        {company}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#00FF94] px-2 py-0.5 rounded-sm border border-[#1E1E1E] flex-shrink-0">
                        {count}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Panel E — AI Skill Demand Tracker */}
            <div className="border border-[#1E1E1E] rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
                    AI &amp; Data Skills in Demand
                  </h2>
                  <span className="font-mono text-[10px] text-[#555555]">90d</span>
                </div>
              </div>

              {topSkills.length === 0 ? (
                <p className="text-xs text-[#555555]">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topSkills.map(([skill, count], index) => (
                    <div
                      key={skill}
                      className="flex items-center gap-3 py-1.5 hover:bg-[#111111] transition-colors rounded-sm px-2 -mx-2"
                    >
                      <span className="font-mono text-[10px] text-[#555555] w-5 flex-shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-[#E8E8E8] flex-1 truncate">
                        {skill}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#00FF94] px-2 py-0.5 rounded-sm border border-[#1E1E1E] flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>


        {/* ── FAQ (AEO-optimized — below fold) ─────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pb-20 border-t border-[#1E1E1E] pt-12"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-12"
          >
            Context
          </h2>
          <dl className="space-y-10">
            {faqs.map((item, i) => (
              <div key={i}>
                <dt className="text-base font-medium text-[#E8E8E8] mb-3">
                  {item.q}
                </dt>
                <dd className="text-sm text-[#888888] leading-relaxed max-w-2xl">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  )
}
