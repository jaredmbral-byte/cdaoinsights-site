import TallyForm from '@/components/TallyForm'
import HiringTicker from '@/components/HiringTicker'
import MovesTicker from '@/components/MovesTicker'
import { createServerClient } from '@/lib/supabase-server'
import { cleanTitle, cleanSummary } from '@/lib/text'
import type { ExecutiveMove, MarketArticle, WeeklyBrief } from '@/lib/types'

export const revalidate = 900 // 15 minutes

// ─── FAQ data (mirrors JSON-LD in layout for visible page content) ────────────
const faqs = [
  {
    q: 'What is CDAO Insights?',
    a: 'CDAO Insights is an independent community intelligence resource for enterprise Chief Data Officers, Chief AI Officers, and senior data and analytics leaders. It covers data strategy, AI adoption, governance trends, and peer benchmarks across large enterprises — without vendor sponsorship influencing editorial.',
  },
  {
    q: 'What are the top priorities for Chief Data Officers in 2026?',
    a: 'Enterprise CDOs are primarily focused on three areas: operationalizing AI at scale, improving data quality and governance as the foundation for AI reliability, and demonstrating measurable business value from data investments. Agentic AI for data stewardship, unstructured data governance, and MDM modernization are emerging as high-priority initiatives.',
  },
  {
    q: 'What is the difference between a Chief Data Officer and a Chief AI Officer?',
    a: 'A Chief Data Officer (CDO) is responsible for enterprise data strategy, governance, data quality, and infrastructure. A Chief AI Officer (CAIO) focuses on AI strategy, model deployment, and AI governance. The roles are increasingly separate at large enterprises. The distinction matters: CDOs own the data foundation; CAIOs own what gets built on top of it.',
  },
  {
    q: 'What data governance challenges are enterprises facing in 2026?',
    a: 'The most common enterprise data governance challenges are: managing data quality at the scale required for AI reliability, governing unstructured data as GenAI adoption accelerates, maintaining data lineage across multi-cloud environments, and building stewardship programs that scale without proportional headcount growth.',
  },
  {
    q: 'How are large enterprises structuring their data and AI organizations?',
    a: 'Most large enterprises are moving toward a hybrid model: a central data platform team that owns infrastructure, governance, and standards, paired with embedded data professionals within business units. Chief AI Officer roles are increasingly separate from CDO functions, particularly where multiple AI deployments are in production.',
  },
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

export default async function Home() {
  const supabase = createServerClient()

  // Fetch latest executive moves, top intelligence, and weekly brief in parallel
  const [movesResult, intelligenceResult, briefResult] = await Promise.all([
    supabase
      .from('executive_moves')
      .select('id, headline, person_name, company_name, move_type, source_url, published_at')
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('market_articles')
      .select('id, title, summary, source_name, source_url, published_at, topics, relevance')
      .gte('relevance', 0.5)
      .order('relevance', { ascending: false })
      .limit(5),
    supabase
      .from('weekly_brief')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const latestMoves = (movesResult.data || []) as ExecutiveMove[]
  const topIntel = (intelligenceResult.data || []) as MarketArticle[]
  const weeklyBrief = (briefResult.data || []) as WeeklyBrief[]

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

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pt-20 pb-16"
          aria-labelledby="hero-heading"
        >
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#E8E8E8] mb-4 max-w-2xl"
          >
            Real-Time Intelligence for Data Leadership
          </h1>
          <p className="text-base text-[#888888] leading-relaxed max-w-xl mb-10">
            Signal-dense intelligence for CDOs, CAIOs, and CDAIOs. Daily.
          </p>

          {/* Inline email capture */}
          <div
            id="join"
            className="bg-[#111111] border border-[#1E1E1E] rounded-sm p-5 max-w-md"
          >
            <p className="font-mono text-xs uppercase tracking-[1px] text-[#888888] mb-3">
              Enter Platform
            </p>
            <TallyForm />
            <p className="text-[11px] text-[#555555] mt-3">
              No spam. No vendor partnerships. Unsubscribe any time.
            </p>
          </div>
        </section>

        {/* ── Weekly Brief ──────────────────────────────────────────────── */}
        {weeklyBrief.length > 0 && (
          <section
            className="max-w-[1200px] mx-auto px-6 pb-16"
            aria-label="Weekly brief"
          >
            <div className="border-t border-[#1E1E1E] pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555]">
                  Weekly Brief
                </h2>
                <span className="font-mono text-[11px] text-[#555555]">
                  {weeklyBrief[0]?.week_label}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weeklyBrief.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#1E1E1E] text-[#888888]">
                        {entry.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-[#E8E8E8] mb-2 leading-snug">
                      {entry.headline}
                    </h3>
                    <p className="text-xs text-[#888888] leading-relaxed">
                      {entry.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Executive Moves (server-rendered) ───────────────────────────── */}
        {latestMoves.length > 0 && (
          <section
            className="max-w-[1200px] mx-auto px-6 pb-16"
            aria-label="Latest executive moves"
          >
            <div className="border-t border-[#1E1E1E] pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555]">
                  Executive Moves
                </h2>
                <a
                  href="/moves"
                  className="font-mono text-xs uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="border border-[#1E1E1E] rounded-sm overflow-hidden divide-y divide-[#1E1E1E]">
                {latestMoves.map((move) => (
                  <article
                    key={move.id}
                    className="px-5 py-3.5 hover:bg-[#111111] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <a
                          href={move.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#E8E8E8] hover:text-[#3B82F6] leading-snug block mb-1"
                        >
                          {move.headline}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#555555]">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {move.person_name && (
                          <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#1E1E1E] text-[#888888]">
                            {move.person_name}
                          </span>
                        )}
                        {move.move_type && (
                          <span className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border ${
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
            </div>
          </section>
        )}

        {/* ── Top Intelligence (server-rendered) ───────────────────────────── */}
        {topIntel.length > 0 && (
          <section
            className="max-w-[1200px] mx-auto px-6 pb-16"
            aria-label="Top intelligence"
          >
            <div className="border-t border-[#1E1E1E] pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555]">
                  Intelligence
                </h2>
                <a
                  href="/intelligence"
                  className="font-mono text-xs uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="space-y-3">
                {topIntel.map((article) => (
                  <a
                    key={article.id}
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] hover:bg-[#111111] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-[#E8E8E8] group-hover:text-[#3B82F6] mb-2 leading-snug">
                          {cleanTitle(article.title)}
                        </h3>
                        {cleanSummary(article.summary, article.title) && (
                          <p className="text-xs text-[#888888] leading-relaxed mb-2 line-clamp-2">
                            {cleanSummary(article.summary, article.title)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {article.topics.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border ${TOPIC_COLORS[t] || TOPIC_COLORS.general}`}
                            >
                              {t.replace('-', ' ')}
                            </span>
                          ))}
                          {article.source_name && (
                            <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555]">
                              {article.source_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#555555] whitespace-nowrap mt-1">
                        {article.published_at ? timeAgo(article.published_at) : '—'}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Pillars ──────────────────────────────────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pb-20 border-t border-[#1E1E1E] pt-12"
          aria-label="What CDAO Insights covers"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#E8E8E8] mb-3">
                Peer Intelligence
              </h2>
              <p className="text-sm text-[#888888] leading-relaxed">
                What your counterparts are prioritizing, where they&apos;re
                struggling, and what&apos;s actually shipping inside enterprise
                organizations.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#E8E8E8] mb-3">
                Market Signals
              </h2>
              <p className="text-sm text-[#888888] leading-relaxed">
                Where enterprise data and AI investment is moving — sourced from
                hiring patterns, org changes, and technology adoption before the
                analysts catch up.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#E8E8E8] mb-3">
                Independent
              </h2>
              <p className="text-sm text-[#888888] leading-relaxed">
                Community-driven editorial. No sponsor determines what gets
                covered or how it&apos;s framed. The signal stays clean.
              </p>
            </article>
          </div>
        </section>

        {/* ── FAQ (AEO-optimized) ───────────────────────────────────────────── */}
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
