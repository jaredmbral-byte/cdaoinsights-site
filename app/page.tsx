import TallyForm from '@/components/TallyForm'
import HiringTicker from '@/components/HiringTicker'
import MovesTicker from '@/components/MovesTicker'
import { createServerClient } from '@/lib/supabase-server'
import type { ExecutiveMove, MarketArticle } from '@/lib/types'

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
  ai: 'bg-blue-50 text-blue-700',
  genai: 'bg-purple-50 text-purple-700',
  governance: 'bg-amber-50 text-amber-700',
  strategy: 'bg-green-50 text-green-700',
  leadership: 'bg-rose-50 text-rose-700',
  funding: 'bg-emerald-50 text-emerald-700',
  'data-quality': 'bg-orange-50 text-orange-700',
  security: 'bg-red-50 text-red-700',
  'agentic-ai': 'bg-indigo-50 text-indigo-700',
  infrastructure: 'bg-cyan-50 text-cyan-700',
  general: 'bg-gray-50 text-gray-600',
}

export default async function Home() {
  const supabase = createServerClient()

  // Fetch latest executive moves and top intelligence in parallel
  const [movesResult, intelligenceResult] = await Promise.all([
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
  ])

  const latestMoves = (movesResult.data || []) as ExecutiveMove[]
  const topIntel = (intelligenceResult.data || []) as MarketArticle[]

  return (
    <div className="relative z-10 flex flex-col min-h-screen font-sans">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="w-full border-b border-[#D9D6D0]">
        <nav
          className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between"
          aria-label="Main navigation"
        >
          <a
            href="/"
            className="font-mono font-medium text-sm uppercase tracking-[2px] text-[#1A1A1A]"
            aria-label="CDAO Insights home"
          >
            CDAO Insights
          </a>
          <div className="flex items-center gap-6">
            <a href="/hiring" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Hiring</a>
            <a href="/intelligence" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Intelligence</a>
            <a href="/moves" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Moves</a>
            <a href="/compensation" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Compensation</a>
            <a
              href="#join"
              className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Join →
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section
          className="max-w-3xl mx-auto px-6 pt-24 pb-20"
          aria-labelledby="hero-heading"
        >
          {/* Eyebrow */}
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-6">
            Community Intelligence Resource
          </p>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-6"
          >
            What enterprise data and AI leaders are{' '}
            <em className="not-italic text-[#6B6B6B]">actually</em> building
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-[#6B6B6B] leading-relaxed max-w-2xl mb-12">
            Peer signals, market context, and trends for CDOs, CAIOs, and senior
            data leaders at large enterprises. No vendor agendas. No thought
            leadership theater.
          </p>

          {/* Email Capture */}
          <div
            id="join"
            className="bg-white border border-[#D9D6D0] rounded-xl p-6 sm:p-8 max-w-lg"
          >
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">
              Get the briefing
            </p>
            <p className="text-sm text-[#6B6B6B] mb-5">
              Join data and AI leaders at enterprise organizations.
            </p>
            <TallyForm />
            <p className="text-xs text-[#999590] mt-4">
              No spam. No vendor partnerships that shape what you read.
              Unsubscribe any time.
            </p>
          </div>
        </section>

        {/* ── Hiring Ticker ────────────────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-6 pb-16"
          aria-label="Executive hiring data"
        >
          <HiringTicker />
        </section>

        {/* ── Executive Moves Ticker ─────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-6 pb-16"
          aria-label="Executive moves data"
        >
          <MovesTicker />
        </section>

        {/* ── Latest Executive Moves (server-rendered) ─────────────────────── */}
        {latestMoves.length > 0 && (
          <section
            className="max-w-3xl mx-auto px-6 pb-16"
            aria-label="Latest executive moves"
          >
            <div className="border-t border-[#D9D6D0] pt-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590]">
                  Latest Executive Moves
                </h2>
                <a
                  href="/moves"
                  className="font-mono text-xs uppercase tracking-[1px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="divide-y divide-[#E8E5E0] border border-[#D9D6D0] rounded-xl overflow-hidden">
                {latestMoves.map((move) => (
                  <article
                    key={move.id}
                    className="px-6 py-4 hover:bg-[#FAFAF8] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <a
                          href={move.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#1A1A1A] hover:underline leading-snug block mb-1"
                        >
                          {move.headline}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#999590]">
                          {move.company_name && (
                            <span className="text-[#6B6B6B]">{move.company_name}</span>
                          )}
                          {move.published_at && (
                            <>
                              {move.company_name && <span className="text-[#D9D6D0]">|</span>}
                              <span>{timeAgo(move.published_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {move.person_name && (
                          <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded bg-[#F0EEE9] text-[#6B6B6B]">
                            {move.person_name}
                          </span>
                        )}
                        {move.move_type && (
                          <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded bg-[#F0EEE9] text-[#6B6B6B]">
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
            className="max-w-3xl mx-auto px-6 pb-16"
            aria-label="Top intelligence"
          >
            <div className="border-t border-[#D9D6D0] pt-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590]">
                  Top Intelligence
                </h2>
                <a
                  href="/intelligence"
                  className="font-mono text-xs uppercase tracking-[1px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="space-y-4">
                {topIntel.map((article) => (
                  <a
                    key={article.id}
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-[#D9D6D0] rounded-xl p-5 hover:border-[#999590] hover:bg-[#FAFAF8] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#1A1A1A] group-hover:underline mb-2 leading-snug">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-xs text-[#6B6B6B] leading-relaxed mb-2 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {article.topics.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded ${TOPIC_COLORS[t] || TOPIC_COLORS.general}`}
                            >
                              {t.replace('-', ' ')}
                            </span>
                          ))}
                          {article.source_name && (
                            <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#B5B1AB]">
                              {article.source_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-[#B5B1AB] whitespace-nowrap mt-1">
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
          className="max-w-3xl mx-auto px-6 pb-24 border-t border-[#D9D6D0] pt-16"
          aria-label="What CDAO Insights covers"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Peer Intelligence
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                What your counterparts are prioritizing, where they&apos;re
                struggling, and what&apos;s actually shipping inside enterprise
                organizations.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Market Signals
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Where enterprise data and AI investment is moving — sourced from
                hiring patterns, org changes, and technology adoption before the
                analysts catch up.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Independent
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Community-driven editorial. No sponsor determines what gets
                covered or how it&apos;s framed. The signal stays clean.
              </p>
            </article>
          </div>
        </section>

        {/* ── FAQ (AEO-optimized) ───────────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-6 pb-24 border-t border-[#D9D6D0] pt-16"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-12"
          >
            Context
          </h2>
          <dl className="space-y-10">
            {faqs.map((item, i) => (
              <div key={i}>
                <dt className="text-base font-medium text-[#1A1A1A] mb-3">
                  {item.q}
                </dt>
                <dd className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#D9D6D0]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#999590]">
            CDAO Insights — Enterprise data &amp; AI leaders
          </span>
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#B5B1AB]">
            © {new Date().getFullYear()} CDAO Insights
          </span>
        </div>
      </footer>

    </div>
  )
}
