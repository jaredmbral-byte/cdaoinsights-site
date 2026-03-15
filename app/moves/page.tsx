import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { ExecutiveMove } from '@/lib/types'
import { movesListSchema, movesFaqSchema } from '@/lib/schema'
import { cleanTitle } from '@/lib/text'

export const revalidate = 1800 // 30 minutes

export const metadata: Metadata = {
  title: 'CDO & CAIO Executive Moves | CDAO Insights',
  description:
    'Track chief data officer and chief AI officer appointments, departures, and transitions across Fortune 500 and high-growth companies.',
  keywords: 'CDO appointments, chief data officer moves, CAIO transitions, data executive hiring, CDO departures',
  alternates: { canonical: 'https://cdaoinsights.com/moves' },
  openGraph: {
    title: 'CDO & CAIO Executive Moves | CDAO Insights',
    description: 'Track chief data officer and chief AI officer appointments, departures, and transitions across Fortune 500 and high-growth companies.',
    url: 'https://cdaoinsights.com/moves',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

// FAQ data for visible page content
const faqs = [
  {
    q: 'What is the CDAO Insights Executive Moves feed?',
    a: 'The Executive Moves feed tracks Chief Data Officer (CDO), Chief AI Officer (CAIO), and Chief Data and AI Officer (CDAIO) appointments, departures, and leadership transitions at enterprise organizations. Sources include press releases, news coverage, and company announcements. The feed is updated every 6 hours.',
  },
  {
    q: 'Why do CDO and CAIO executive moves matter?',
    a: 'Executive leadership changes in data and AI signal strategic shifts at enterprises. A new CDO often precedes major data platform investments, governance initiatives, or organizational restructuring. Tracking these moves provides early indicators of where enterprise data and AI investment is heading.',
  },
  {
    q: 'How often is the executive moves feed updated?',
    a: 'The executive moves feed is refreshed every 6 hours from Google News and PR Newswire RSS sources. Articles are deduplicated by URL to prevent repeat entries.',
  },
]

const MOVE_TYPE_LABELS: Record<string, string> = {
  appointed: 'Appointed',
  named: 'Named',
  joins: 'Joins',
  leaves: 'Departs',
  promoted: 'Promoted',
}

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

export default async function MovesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; days?: string }>
}) {
  const params = await searchParams
  const moveType = params.type || ''
  const days = parseInt(params.days || '90', 10)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  let query = supabase
    .from('executive_moves')
    .select('*')
    .gte('published_at', cutoff.toISOString())
    .order('published_at', { ascending: false })
    .limit(200)

  if (moveType) {
    query = query.eq('move_type', moveType)
  }

  const { data: moves } = await query
  const typedMoves = (moves || []) as ExecutiveMove[]

  const structuredData = [movesListSchema(typedMoves), movesFaqSchema()]

  return (
    <>
      {/* JSON-LD */}
      {structuredData.map((sd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }}
        />
      ))}

      <main className="flex-1">
        <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-8">
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-4">
            Executive Moves
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-4">
            CDO, CAIO &amp; CDAIO leadership changes
          </h1>
          <p className="text-base text-[#888888] leading-relaxed max-w-2xl mb-8">
            Appointments, departures, and promotions across enterprise data and AI
            leadership. Sourced from news coverage and press releases, updated every
            6 hours.
          </p>

          {/* Product callout */}
          <div className="border border-[#1E1E1E] rounded-sm px-4 py-2.5 mb-6 flex items-center justify-between max-w-xl">
            <p className="text-xs text-[#888888]">Want the full weekly appointment list as a CSV?</p>
            <a href="/intelligence/new-cdo-list" className="font-mono text-[10px] uppercase tracking-[1px] text-[#00FF94] hover:text-[#00CC77] transition-colors whitespace-nowrap ml-4">
              Learn more →
            </a>
          </div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Time window */}
            <div className="flex gap-1">
              {[
                { label: '30d', value: '30' },
                { label: '60d', value: '60' },
                { label: '90d', value: '90' },
              ].map((opt) => (
                <a
                  key={opt.value}
                  href={`/moves?days=${opt.value}${moveType ? `&type=${moveType}` : ''}`}
                  className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm transition-colors ${
                    String(days) === opt.value
                      ? 'bg-[#E8E8E8] text-[#0A0A0A]'
                      : 'text-[#555555] hover:text-[#E8E8E8] border border-[#1E1E1E]'
                  }`}
                >
                  {opt.label}
                </a>
              ))}
            </div>

            {/* Move type filter */}
            <div className="flex gap-1">
              <a
                href={`/moves?days=${days}`}
                className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm transition-colors ${
                  !moveType
                    ? 'bg-[#E8E8E8] text-[#0A0A0A]'
                    : 'text-[#555555] hover:text-[#E8E8E8] border border-[#1E1E1E]'
                }`}
              >
                All
              </a>
              {Object.entries(MOVE_TYPE_LABELS).map(([value, label]) => (
                <a
                  key={value}
                  href={`/moves?days=${days}&type=${value}`}
                  className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm transition-colors ${
                    moveType === value
                      ? 'bg-[#E8E8E8] text-[#0A0A0A]'
                      : 'text-[#555555] hover:text-[#E8E8E8] border border-[#1E1E1E]'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* ── Count ──────────────────────────────────────────────────────── */}
          <p className="text-xs text-[#555555] mb-6">
            {typedMoves.length} {typedMoves.length === 1 ? 'move' : 'moves'} in
            the last {days} days
          </p>
        </section>

        {/* ── Feed ──────────────────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24">
          {typedMoves.length === 0 ? (
            <div className="border border-[#1E1E1E] rounded-sm p-8 text-center">
              <p className="text-sm text-[#888888]">
                No executive moves found for this time period. Check back soon — the
                feed refreshes every 6 hours.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E1E] border border-[#1E1E1E] rounded-sm overflow-hidden">
              {typedMoves.map((move) => (
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
                        {cleanTitle(move.headline)}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#555555]">
                        {move.company_name && (
                          <span className="text-[#888888]">{move.company_name}</span>
                        )}
                        {move.company_name && move.source_name && (
                          <span className="text-[#333]">|</span>
                        )}
                        {move.source_name && <span>{move.source_name}</span>}
                        {move.published_at && (
                          <>
                            <span className="text-[#333]">|</span>
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
          )}
        </section>

        {/* ── FAQ (AEO-optimized) ──────────────────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pb-24 border-t border-[#1E1E1E] pt-16"
          aria-labelledby="moves-faq-heading"
        >
          <h2
            id="moves-faq-heading"
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
    </>
  )
}
