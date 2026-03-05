import { createServerClient } from '@/lib/supabase-server'
import { hiringListSchema } from '@/lib/schema'
import type { HiringSignal } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CDO & CAIO Job Openings | CDAO Insights',
  description:
    'Active chief data officer and chief AI officer job postings from enterprise companies. Updated weekly.',
  keywords: 'CDO jobs, chief data officer job openings, CAIO hiring, data executive roles, CDO job board',
  alternates: { canonical: 'https://cdaoinsights.com/hiring' },
  openGraph: {
    title: 'CDO & CAIO Job Openings | CDAO Insights',
    description: 'Active chief data officer and chief AI officer job postings from enterprise companies. Updated weekly.',
    url: 'https://cdaoinsights.com/hiring',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
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

  const filtered = search
    ? signals.filter(
        (s) =>
          s.job_title.toLowerCase().includes(search.toLowerCase()) ||
          s.company_name.toLowerCase().includes(search.toLowerCase()),
      )
    : signals

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Page header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-4">
        Executive Hiring Tracker
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-3">
        New CDO, CAIO &amp; data leadership appointments
      </h1>
      <p className="text-base text-[#888888] leading-relaxed max-w-2xl mb-10">
        Real-time tracking of CDO, CAIO, VP Data, and senior leadership roles
        at large enterprises. Updated every 6 hours.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <a
              key={ind}
              href={`/hiring?industry=${encodeURIComponent(ind)}&days=${days}${search ? `&q=${search}` : ''}`}
              className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
                (industry === ind || (!industry && ind === 'All Industries'))
                  ? 'bg-[#E8E8E8] text-[#0A0A0A] border-[#E8E8E8]'
                  : 'bg-transparent text-[#888888] border-[#1E1E1E] hover:border-[#555555] hover:text-[#E8E8E8]'
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
                ? 'border-[#00FF94] text-[#E8E8E8]'
                : 'border-transparent text-[#555555] hover:text-[#E8E8E8]'
            }`}
          >
            {tw.label}
          </a>
        ))}
      </div>

      {/* Results count */}
      <p className="font-mono text-xs text-[#555555] mb-6">
        {filtered.length} {filtered.length === 1 ? 'role' : 'roles'} found
      </p>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E] bg-[#111111]">
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3">
                  Role
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3">
                  Company
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3 hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3 hidden md:table-cell">
                  Location
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3 hidden md:table-cell">
                  Level
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3">
                  Posted
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((signal) => (
                <tr
                  key={signal.id}
                  className="border-b border-[#1E1E1E] last:border-b-0 hover:bg-[#111111] transition-colors"
                >
                  <td className="px-4 py-3">
                    {signal.source_url ? (
                      <a
                        href={signal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E8E8E8] hover:text-[#3B82F6]"
                      >
                        {signal.job_title}
                      </a>
                    ) : (
                      <span className="text-[#E8E8E8]">{signal.job_title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#888888]">{signal.company_name}</td>
                  <td className="px-4 py-3 text-[#555555] hidden sm:table-cell">{signal.industry || '—'}</td>
                  <td className="px-4 py-3 text-[#555555] hidden md:table-cell">{signal.location || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {signal.seniority && (
                      <span className="font-mono text-xs uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#1E1E1E] text-[#888888]">
                        {signal.seniority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[#555555] font-mono text-xs">
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
        <div className="border border-[#1E1E1E] rounded-sm p-12 text-center">
          <p className="text-[#888888] mb-2">No hiring signals yet</p>
          <p className="text-sm text-[#555555]">
            Data is ingested every 6 hours. Check back soon or adjust your filters.
          </p>
        </div>
      )}

      {/* AEO: Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hiringListSchema(filtered)) }}
      />
    </main>
  )
}
