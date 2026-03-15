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
      q: 'What is the average salary for a Chief Data Officer in 2026?',
      a: 'The median total cash compensation for a Chief Data Officer in the United States is approximately $295,000 across all industries. In Financial Services, the median rises to $350,000. In Technology, the median is approximately $335,000. These figures include base salary and bonus but exclude equity compensation.',
    },
    {
      q: 'How does Chief AI Officer compensation compare to Chief Data Officer pay?',
      a: 'Chief AI Officers typically earn a 10-15% premium over Chief Data Officers. The median CAIO total cash compensation is approximately $325,000 across all industries, compared to $295,000 for CDOs. In Financial Services, the CAIO median reaches $385,000.',
    },
    {
      q: 'Where does CDAO Insights compensation data come from?',
      a: 'Compensation benchmarks are aggregated from BLS Occupational Employment Statistics, Glassdoor, Levels.fyi, and public company filings. Figures represent total cash compensation (base + bonus). Equity varies significantly and is excluded. Data is refreshed quarterly.',
    },
  ]

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Page header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-4">
        Compensation Benchmarks
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-3">
        What data &amp; AI leaders earn
      </h1>
      <p className="text-base text-[#888888] leading-relaxed max-w-2xl mb-10">
        Salary benchmarks for CDO, CAIO, and senior data leadership roles.
        Percentile breakdowns by industry. Updated quarterly.
      </p>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <a
            key={r}
            href={`/compensation?role=${encodeURIComponent(r)}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}`}
            className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              (role === r || (!role && r === 'All Roles'))
                ? 'bg-[#E8E8E8] text-[#0A0A0A] border-[#E8E8E8]'
                : 'bg-transparent text-[#888888] border-[#1E1E1E] hover:border-[#555555] hover:text-[#E8E8E8]'
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
                ? 'bg-[#888888] text-[#0A0A0A] border-[#888888]'
                : 'bg-transparent text-[#555555] border-[#1E1E1E] hover:border-[#555555] hover:text-[#888888]'
            }`}
          >
            {ind}
          </a>
        ))}
      </div>

      {/* Results */}
      {dedupedBenchmarks.length > 0 ? (
        <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E] bg-[#111111]">
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#888888] px-4 py-3">
                  Role
                </th>
                <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3 hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#888888] px-4 py-3">
                  25th
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#888888] px-4 py-3">
                  Median
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#888888] px-4 py-3">
                  75th
                </th>
                <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#555555] px-4 py-3 hidden md:table-cell">
                  90th
                </th>
              </tr>
            </thead>
            <tbody>
              {dedupedBenchmarks.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[#1E1E1E] last:border-b-0 hover:bg-[#111111] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-[#E8E8E8]">{b.role_title}</span>
                  </td>
                  <td className="px-4 py-3 text-[#888888] hidden sm:table-cell">{b.industry || 'All'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#555555]">{formatSalary(b.p25)}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-[#00FF94]">{formatSalary(b.p50)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#888888]">{formatSalary(b.p75)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#555555] hidden md:table-cell">{formatSalary(b.p90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[#1E1E1E] rounded-sm p-12 text-center">
          <p className="text-[#888888] mb-2">No compensation data yet</p>
          <p className="text-sm text-[#555555]">
            Benchmark data is refreshed monthly. Run the initial data load to populate.
          </p>
        </div>
      )}

      {/* Methodology note */}
      <div className="mt-8 p-4 bg-[#111111] border border-[#1E1E1E] rounded-sm">
        <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] mb-2">
          Methodology
        </p>
        <p className="text-xs text-[#888888] leading-relaxed">
          Compensation data is aggregated from BLS Occupational Employment Statistics,
          Glassdoor, Levels.fyi, and public company filings. Figures represent total
          cash compensation (base + bonus). Equity compensation varies significantly
          and is not included. Data is refreshed quarterly.
        </p>
      </div>

      {/* FAQ */}
      <section className="mt-16 border-t border-[#1E1E1E] pt-12">
        <h2 className="text-xl font-semibold text-[#E8E8E8] mb-8">
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
