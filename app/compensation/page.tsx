import { createServerClient } from '@/lib/supabase-server'
import { compBenchmarkSchema, compFaqSchema } from '@/lib/schema'
import type { CompBenchmark } from '@/lib/types'
import type { Metadata } from 'next'
import FaqAccordion from '@/components/FaqAccordion'

export const metadata: Metadata = {
  title: 'CDO & CAIO Compensation Benchmarks | CDAO Insights',
  description:
    'Salary and total compensation data for chief data officers and chief AI officers, benchmarked by industry, company size, and geography.',
  keywords: 'CDO salary, chief data officer compensation, CAIO pay, data executive salary benchmark, CDO total comp',
  alternates: { canonical: 'https://cdaoinsights.com/compensation' },
  openGraph: {
    title: 'CDO & CAIO Compensation Benchmarks | CDAO Insights',
    description: 'Salary and total compensation data for chief data officers and chief AI officers, benchmarked by industry, company size, and geography.',
    url: 'https://cdaoinsights.com/compensation',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

export const revalidate = 86400 // 24 hours — comp data changes slowly

const ROLES = [
  'All Roles',
  'Chief Data Officer',
  'Chief AI Officer',
  'VP of Data & Analytics',
  'Head of Data Engineering',
  'Director of Data Governance',
]

async function getBenchmarks(role?: string, industry?: string): Promise<CompBenchmark[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('comp_benchmarks')
    .select('*')
    .order('p50', { ascending: false })

  if (role && role !== 'All Roles') {
    query = query.eq('role_title', role)
  }

  if (industry) {
    query = query.eq('industry', industry)
  }

  const { data } = await query
  return (data as CompBenchmark[]) || []
}

function formatSalary(amount: number | null): string {
  if (!amount) return '—'
  return `$${(amount / 1000).toFixed(0)}K`
}

export default async function CompensationPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; industry?: string }>
}) {
  const params = await searchParams
  const role = params.role
  const industry = params.industry

  const benchmarks = await getBenchmarks(role, industry)

  // Deduplicate benchmarks by role + industry
  const seenBenchmarks = new Set<string>()
  const dedupedBenchmarks = benchmarks.filter(b => {
    const key = `${b.role_title}|${b.industry}`
    if (seenBenchmarks.has(key)) return false
    seenBenchmarks.add(key)
    return true
  })

  const industries = ['All Industries', ...new Set(
    benchmarks
      .map((b) => b.industry)
      .filter((ind): ind is string => Boolean(ind) && ind !== 'All Industries')
  )]

  const compFaqs = [
    {
      q: 'What does a Chief Data Officer earn?',
      a: 'Benchmarks are compiled from public postings and filings and are shown in the table above as percentile ranges by role and industry. Coverage is expanding.',
    },
    {
      q: 'How does Chief AI Officer compensation compare to Chief Data Officer pay?',
      a: 'The table above shows benchmarks for both roles side by side as percentile ranges, compiled from public postings and filings. Coverage is expanding.',
    },
    {
      q: 'Where does CDAO Insights compensation data come from?',
      a: 'Compensation benchmarks are aggregated from BLS Occupational Employment Statistics, Glassdoor, Levels.fyi, and public company filings. Figures represent total cash compensation (base plus bonus). Equity varies and is excluded. Data is updated as new data lands.',
    },
  ]

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Page header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#6B6864] mb-4">
        Compensation Benchmarks
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#0A0A0A] mb-3">
        What data &amp; AI leaders earn
      </h1>
      <p className="text-base text-[#6B6864] leading-relaxed max-w-2xl mb-10">
        Salary benchmarks for CDO, CAIO, and senior data leadership roles.
        Percentile breakdowns by industry. Updated as new data lands.
      </p>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <a
            key={r}
            href={`/compensation?role=${encodeURIComponent(r)}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}`}
            className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              (role === r || (!role && r === 'All Roles'))
                ? 'bg-[#0A0A0A] text-[#F5F3EE] border-[#0A0A0A]'
                : 'bg-transparent text-[#6B6864] border-[#C9C4BB] hover:border-[#6B6864] hover:text-[#0A0A0A]'
            }`}
          >
            {r}
          </a>
        ))}
      </div>

      {/* Industry filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {industries.map((ind) => (
          <a
            key={ind}
            href={`/compensation?industry=${encodeURIComponent(ind)}${role ? `&role=${encodeURIComponent(role)}` : ''}`}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-2.5 py-1 rounded-sm border transition-colors ${
              (industry === ind || (!industry && ind === 'All Industries'))
                ? 'bg-[#6B6864] text-[#F5F3EE] border-[#6B6864]'
                : 'bg-transparent text-[#6B6864] border-[#C9C4BB] hover:border-[#6B6864] hover:text-[#6B6864]'
            }`}
          >
            {ind}
          </a>
        ))}
      </div>

      {/* Results */}
      {dedupedBenchmarks.length > 0 ? (
        <div className="border border-[#C9C4BB] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#C9C4BB] bg-[#EDEAE2]">
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  Role
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3 hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  25th
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  Median
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3">
                  75th
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#6B6864] px-4 py-3 hidden md:table-cell">
                  90th
                </th>
              </tr>
            </thead>
            <tbody>
              {dedupedBenchmarks.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[#C9C4BB] last:border-b-0 hover:bg-[#EDEAE2] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-[#0A0A0A]">{b.role_title}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6864] hidden sm:table-cell">{b.industry || 'All'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#6B6864]">{formatSalary(b.p25)}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-[#0A0A0A]">{formatSalary(b.p50)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#6B6864]">{formatSalary(b.p75)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#6B6864] hidden md:table-cell">{formatSalary(b.p90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[#C9C4BB] rounded-sm p-12 text-center">
          <p className="text-[#6B6864] mb-2">No compensation data yet</p>
          <p className="text-sm text-[#6B6864]">
            Benchmark data is updated as new data lands. Run the initial data load to populate.
          </p>
        </div>
      )}

      {/* Methodology note */}
      <div className="mt-8 p-4 bg-[#EDEAE2] border border-[#C9C4BB] rounded-sm">
        <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] mb-2">
          Methodology
        </p>
        <p className="text-xs text-[#6B6864] leading-relaxed">
          Compensation data is aggregated from BLS Occupational Employment Statistics,
          Glassdoor, Levels.fyi, and public company filings. Figures represent total
          cash compensation (base plus bonus). Equity compensation varies
          and is not included. Data is updated as new data lands.
        </p>
      </div>

      {/* FAQ */}
      <section className="mt-16 border-t border-[#C9C4BB] pt-12">
        <h2 className="text-xl font-semibold text-[#0A0A0A] mb-8">
          Frequently asked questions
        </h2>
        <FaqAccordion items={compFaqs} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compBenchmarkSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compFaqSchema()) }}
      />
    </main>
  )
}
