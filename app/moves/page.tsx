import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { ExecutiveMove } from '@/lib/types'
import { movesListSchema, movesFaqSchema } from '@/lib/schema'

export const revalidate = 1800 // 30 minutes

export const metadata: Metadata = {
  title: 'Executive Moves — CDO, CAIO & CDAIO Appointments | CDAO Insights',
  description:
    'Track Chief Data Officer, Chief AI Officer, and CDAIO executive appointments, departures, and leadership transitions at enterprise organizations. Updated every 6 hours.',
  alternates: { canonical: 'https://cdaoinsights.com/moves' },
  openGraph: {
    title: 'Executive Moves — CDO & CAIO Appointments',
    description:
      'Real-time feed of CDO, CAIO, and CDAIO executive moves at large enterprises.',
    url: 'https://cdaoinsights.com/moves',
  },
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    <div className="relative z-10 flex flex-col min-h-screen font-sans">
      {/* JSON-LD */}
      {structuredData.map((sd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }}
        />
      ))}

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
            <a href="/moves" className="font-mono text-sm uppercase tracking-[2px] text-[#1A1A1A] transition-colors">Moves</a>
            <a href="/compensation" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Compensation</a>
          </div>
        </nav>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-8">
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-4">
            Executive Moves
          </p>
          <h1 className="text-3xl sm:text-4xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-4">
            CDO, CAIO &amp; CDAIO leadership changes
          </h1>
          <p className="text-base text-[#6B6B6B] leading-relaxed max-w-2xl mb-8">
            Appointments, departures, and promotions across enterprise data and AI
            leadership. Sourced from news coverage and press releases, updated every
            6 hours.
          </p>

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
                  className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-full transition-colors ${
                    String(days) === opt.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#999590] hover:text-[#1A1A1A] border border-[#D9D6D0]'
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
                className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-full transition-colors ${
                  !moveType
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#999590] hover:text-[#1A1A1A] border border-[#D9D6D0]'
                }`}
              >
                All
              </a>
              {Object.entries(MOVE_TYPE_LABELS).map(([value, label]) => (
                <a
                  key={value}
                  href={`/moves?days=${days}&type=${value}`}
                  className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-full transition-colors ${
                    moveType === value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#999590] hover:text-[#1A1A1A] border border-[#D9D6D0]'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* ── Count ──────────────────────────────────────────────────────── */}
          <p className="text-xs text-[#B5B1AB] mb-6">
            {typedMoves.length} {typedMoves.length === 1 ? 'move' : 'moves'} in
            the last {days} days
          </p>
        </section>

        {/* ── Feed ──────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6 pb-24">
          {typedMoves.length === 0 ? (
            <div className="border border-[#D9D6D0] rounded-xl p-8 text-center">
              <p className="text-sm text-[#6B6B6B]">
                No executive moves found for this time period. Check back soon — the
                feed refreshes every 6 hours.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E5E0] border border-[#D9D6D0] rounded-xl overflow-hidden">
              {typedMoves.map((move) => (
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
                        {move.company_name && move.source_name && (
                          <span className="text-[#D9D6D0]">|</span>
                        )}
                        {move.source_name && <span>{move.source_name}</span>}
                        {move.published_at && (
                          <>
                            <span className="text-[#D9D6D0]">|</span>
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
                        <span className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded ${
                          move.move_type === 'leaves'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-[#F0EEE9] text-[#6B6B6B]'
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
          className="max-w-3xl mx-auto px-6 pb-24 border-t border-[#D9D6D0] pt-16"
          aria-labelledby="moves-faq-heading"
        >
          <h2
            id="moves-faq-heading"
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
            &copy; {new Date().getFullYear()} CDAO Insights
          </span>
        </div>
      </footer>
    </div>
  )
}
