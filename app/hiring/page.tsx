import { createServerClient } from '@/lib/supabase-server'
import { hiringListSchema } from '@/lib/schema'
import type { HiringSignal } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Executive Hiring Tracker — CDO, CAIO & Data Leadership Roles | CDAO Insights',
  description:
    'Real-time tracking of Chief Data Officer, Chief AI Officer, VP of Data, and senior data leadership hires at large enterprises. Updated daily.',
  alternates: { canonical: 'https://cdaoinsights.com/hiring' },
}

// Revalidate every 30 minutes
export const revalidate = 1800

const INDUSTRIES = [
  'All Industries',
  'Financial Services',
  'Healthcare',
  'Technology',
  'Retail',
  'Manufacturing',
  'Energy',
  'Insurance',
  'Media & Telecom',
  'Government',
]

const TIME_WINDOWS = [
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
]

async function getHiringSignals(industry?: string, days?: number): Promise<HiringSignal[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('hiring_signals')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(100)

  if (industry && industry !== 'All Industries') {
    query = query.eq('industry', industry)
  }

  if (days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('posted_at', cutoff.toISOString())
  }

  const { data } = await query
  return (data as HiringSignal[]) || []
}

export default async function HiringPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; days?: string; q?: string }>
}) {
  const params = await searchParams
  const industry = params.industry
  const days = params.days ? parseInt(params.days) : 90
  const search = params.q

  const signals = await getHiringSignals(industry, days)

  // Filter by search query client-side if provided
  const filtered = search
    ? signals.filter(
        (s) =>
          s.job_title.toLowerCase().includes(search.toLowerCase()) ||
          s.company_name.toLowerCase().includes(search.toLowerCase()),
      )
    : signals

  return (
    <div className="relative z-10 flex flex-col min-h-screen font-sans">
      {/* Nav */}
      <header className="w-full border-b border-[#D9D6D0]">
        <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between" aria-label="Main navigation">
          <a href="/" className="font-mono font-medium text-sm uppercase tracking-[2px] text-[#1A1A1A]" aria-label="CDAO Insights home">
            CDAO Insights
          </a>
          <div className="flex items-center gap-6">
            <a href="/hiring" className="font-mono text-sm uppercase tracking-[2px] text-[#1A1A1A] border-b border-[#1A1A1A]">Hiring</a>
            <a href="/intelligence" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Intelligence</a>
            <a href="/compensation" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Compensation</a>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* Page header */}
        <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-4">
          Executive Hiring Tracker
        </p>
        <h1 className="text-3xl sm:text-4xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-3">
          New CDO, CAIO &amp; data leadership appointments
        </h1>
        <p className="text-base text-[#6B6B6B] leading-relaxed max-w-2xl mb-10">
          Real-time tracking of CDO, CAIO, VP Data, and senior leadership roles
          at large enterprises. Updated every 6 hours.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Industry filter */}
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <a
                key={ind}
                href={`/hiring?industry=${encodeURIComponent(ind)}&days=${days}${search ? `&q=${search}` : ''}`}
                className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-full border transition-colors ${
                  (industry === ind || (!industry && ind === 'All Industries'))
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#6B6B6B] border-[#D9D6D0] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                }`}
              >
                {ind}
              </a>
            ))}
          </div>
        </div>

        {/* Time window */}
        <div className="flex gap-2 mb-10">
          {TIME_WINDOWS.map((tw) => (
            <a
              key={tw.value}
              href={`/hiring?days=${tw.value}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}${search ? `&q=${search}` : ''}`}
              className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 border-b-2 transition-colors ${
                String(days) === tw.value
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#999590] hover:text-[#1A1A1A]'
              }`}
            >
              {tw.label}
            </a>
          ))}
        </div>

        {/* Results count */}
        <p className="font-mono text-xs text-[#999590] mb-6">
          {filtered.length} {filtered.length === 1 ? 'role' : 'roles'} found
        </p>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="border border-[#D9D6D0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D9D6D0] bg-[#FAFAF8]">
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    Role
                  </th>
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    Company
                  </th>
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3 hidden sm:table-cell">
                    Industry
                  </th>
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3 hidden md:table-cell">
                    Location
                  </th>
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3 hidden md:table-cell">
                    Level
                  </th>
                  <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    Posted
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((signal) => (
                  <tr
                    key={signal.id}
                    className="border-b border-[#D9D6D0] last:border-b-0 hover:bg-[#FAFAF8] transition-colors"
                  >
                    <td className="px-4 py-3">
                      {signal.source_url ? (
                        <a
                          href={signal.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1A1A1A] font-medium hover:underline"
                        >
                          {signal.job_title}
                        </a>
                      ) : (
                        <span className="text-[#1A1A1A] font-medium">{signal.job_title}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B]">{signal.company_name}</td>
                    <td className="px-4 py-3 text-[#999590] hidden sm:table-cell">{signal.industry || '—'}</td>
                    <td className="px-4 py-3 text-[#999590] hidden md:table-cell">{signal.location || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {signal.seniority && (
                        <span className="font-mono text-xs uppercase tracking-[1px] px-2 py-0.5 rounded bg-[#F0EEE9] text-[#6B6B6B]">
                          {signal.seniority}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#999590] font-mono text-xs">
                      {signal.posted_at
                        ? new Date(signal.posted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[#D9D6D0] rounded-xl p-12 text-center">
            <p className="text-[#999590] mb-2">No hiring signals yet</p>
            <p className="text-sm text-[#B5B1AB]">
              Data is ingested every 6 hours. Check back soon or adjust your filters.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D9D6D0]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#999590]">
            CDAO Insights — Enterprise data &amp; AI leaders
          </span>
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#B5B1AB]">
            &copy; {new Date().getFullYear()} CDAO Insights
          </span>
        </div>
      </footer>

      {/* AEO: Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hiringListSchema(filtered)) }}
      />
    </div>
  )
}
