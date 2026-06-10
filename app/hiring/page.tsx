import { createServerClient } from '@/lib/supabase-server'
import { hiringListSchema, hiringFaqSchema } from '@/lib/schema'
import type { HiringSignal } from '@/lib/types'
import type { Metadata } from 'next'
import FaqAccordion from '@/components/FaqAccordion'

export const metadata: Metadata = {
  title: 'CDO & CAIO Job Openings | CDAO Insights',
  description:
    'Active chief data officer and chief AI officer job postings from enterprise companies. Updated daily.',
  keywords: 'CDO jobs, chief data officer job openings, CAIO hiring, data executive roles, CDO job board',
  alternates: { canonical: 'https://cdaoinsights.com/hiring' },
  openGraph: {
    title: 'CDO & CAIO Job Openings | CDAO Insights',
    description: 'Active chief data officer and chief AI officer job postings from enterprise companies. Updated daily.',
    url: 'https://cdaoinsights.com/hiring',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

// Revalidate every 30 minutes
export const revalidate = 1800

const TIME_WINDOWS = [
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
]

async function getHiringSignals(days?: number, seniority?: string): Promise<HiringSignal[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('hiring_signals')
    .select('*')
    .eq('is_featured', true)
    .order('posted_at', { ascending: false })
    .limit(100)

  if (days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('posted_at', cutoff.toISOString())
  }

  if (seniority) {
    query = query.eq('seniority', seniority)
  }

  const { data } = await query
  return (data as HiringSignal[]) || []
}

export default async function HiringPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; q?: string; seniority?: string }>
}) {
  const params = await searchParams
  const days = params.days ? parseInt(params.days) : 90
  const search = params.q
  const seniority = params.seniority

  const signals = await getHiringSignals(days, seniority)

  const filtered = search
    ? signals.filter(
        (s) =>
          s.job_title.toLowerCase().includes(search.toLowerCase()) ||
          s.company_name.toLowerCase().includes(search.toLowerCase()),
      )
    : signals

  const hiringFaqs = [
    {
      q: 'What roles does the CDAO Insights hiring tracker cover?',
      a: 'The hiring tracker monitors Chief Data Officer (CDO), Chief AI Officer (CAIO), Chief Data and AI Officer (CDAIO), VP of Data, VP of Analytics, Head of Data, Head of AI, and Director-level data leadership roles at enterprise organizations. Postings are pulled daily from public job boards and company careers pages, then filtered to senior data and AI leadership roles.',
    },
    {
      q: 'How often is the hiring data updated?',
      a: 'The hiring feed is refreshed daily from public job boards and company careers pages. Listings are deduplicated by job title and company name to prevent duplicates.',
    },
    {
      q: 'What industries are tracked for data and AI executive hiring?',
      a: 'Roles are classified across Financial Services, Healthcare, Technology, Retail, Manufacturing, Energy, Insurance, Media & Telecom, Government, Education, and Consulting. Industry classification is based on company name and job description keywords.',
    },
  ]

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Page header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#6B6864] mb-4">
        Executive Hiring Tracker
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#0A0A0A] mb-3">
        Open CDO, CAIO &amp; data leadership roles
      </h1>
      <p className="text-base text-[#6B6864] leading-relaxed max-w-2xl mb-10">
        Open job postings for CDO, CAIO, VP Data, and senior data leadership roles at large enterprises. Updated daily.
      </p>

      {/* Time window */}
      <div className="flex gap-2 mb-6">
        {TIME_WINDOWS.map((tw) => (
          <a
            key={tw.value}
            href={`/hiring?days=${tw.value}${search ? `&q=${search}` : ''}${seniority ? `&seniority=${seniority}` : ''}`}
            className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 border-b-2 transition-colors ${
              String(days) === tw.value
                ? 'border-[#0A0A0A] text-[#0A0A0A]'
                : 'border-transparent text-[#6B6864] hover:text-[#0A0A0A]'
            }`}
          >
            {tw.label}
          </a>
        ))}
      </div>

      {/* Seniority filter */}
      <div className="flex gap-2 mb-10">
        <a
          href={`/hiring?days=${days}${search ? `&q=${search}` : ''}`}
          className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm transition-colors ${
            !seniority
              ? 'bg-[#0A0A0A] text-[#F5F3EE]'
              : 'text-[#6B6864] hover:text-[#0A0A0A] border border-[#C9C4BB]'
          }`}
        >
          All
        </a>
        {['C-Suite', 'SVP', 'VP', 'Director+'].map((level) => (
          <a
            key={level}
            href={`/hiring?days=${days}${search ? `&q=${search}` : ''}&seniority=${level}`}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm transition-colors ${
              seniority === level
                ? 'bg-[#0A0A0A] text-[#F5F3EE]'
                : 'text-[#6B6864] hover:text-[#0A0A0A] border border-[#C9C4BB]'
            }`}
          >
            {level}
          </a>
        ))}
      </div>

      {/* Results count */}
      <p className="font-mono text-xs text-[#6B6864] mb-6">
        {filtered.length} {filtered.length === 1 ? 'role' : 'roles'} found
      </p>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-[#C9C4BB] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#C9C4BB] bg-[#EDEAE2]">
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  Role
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  Company
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3 hidden md:table-cell">
                  Location
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3 hidden md:table-cell">
                  Level
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  Posted
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((signal) => (
                <tr
                  key={signal.id}
                  className="border-b border-[#C9C4BB] last:border-b-0 hover:bg-[#EDEAE2] transition-colors"
                >
                  <td className="px-4 py-3">
                    {signal.source_url ? (
                      <a
                        href={signal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A0A0A] hover:text-[#0A0A0A]"
                      >
                        {signal.job_title}
                      </a>
                    ) : (
                      <span className="text-[#0A0A0A]">{signal.job_title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B6864]">{signal.company_name}</td>
                  <td className="px-4 py-3 text-[#6B6864] hidden md:table-cell">{signal.location || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {signal.seniority && (
                      <span className="font-mono text-xs uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#C9C4BB] text-[#6B6864]">
                        {signal.seniority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6B6864] font-mono text-xs">
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
        <div className="border border-[#C9C4BB] rounded-sm p-12 text-center">
          <p className="text-[#6B6864] mb-2">No hiring signals yet</p>
          <p className="text-sm text-[#6B6864]">
            Data is ingested daily. Check back soon or adjust your filters.
          </p>
        </div>
      )}

      {/* FAQ */}
      <section className="mt-16 border-t border-[#C9C4BB] pt-12">
        <h2 className="text-xl font-semibold text-[#0A0A0A] mb-8">
          Frequently asked questions
        </h2>
        <FaqAccordion items={hiringFaqs} />
      </section>

      {/* AEO: Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hiringListSchema(filtered)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hiringFaqSchema()) }}
      />
    </main>
  )
}
