import { createServerClient } from '@/lib/supabase-server'
import { compBenchmarkSchema } from '@/lib/schema'
import type { CompBenchmark } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compensation Benchmarks — CDO, CAIO & Data Leadership Salaries | CDAO Insights',
  description:
    'Salary benchmarks for Chief Data Officers, Chief AI Officers, VP of Data & Analytics, and senior data leadership roles. Percentile breakdowns by industry and geography.',
  alternates: { canonical: 'https://cdaoinsights.com/compensation' },
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

  // Get unique industries from data for filter
  const industries = ['All Industries', ...new Set(benchmarks.map((b) => b.industry).filter(Boolean) as string[])]

  return (
    <div className="relative z-10 flex flex-col min-h-screen font-sans">
      {/* Nav */}
      <header className="w-full border-b border-[#D9D6D0]">
        <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between" aria-label="Main navigation">
          <a href="/" className="font-mono font-medium text-sm uppercase tracking-[2px] text-[#1A1A1A]">
            CDAO Insights
          </a>
          <div className="flex items-center gap-6">
            <a href="/hiring" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Hiring</a>
            <a href="/intelligence" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Intelligence</a>
            <a href="/compensation" className="font-mono text-sm uppercase tracking-[2px] text-[#1A1A1A] border-b border-[#1A1A1A]">Compensation</a>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* Page header */}
        <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-4">
          Compensation Benchmarks
        </p>
        <h1 className="text-3xl sm:text-4xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-3">
          What data &amp; AI leaders earn
        </h1>
        <p className="text-base text-[#6B6B6B] leading-relaxed max-w-2xl mb-10">
          Salary benchmarks for CDO, CAIO, and senior data leadership roles.
          Percentile breakdowns by industry. Updated quarterly.
        </p>

        {/* Role filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map((r) => (
            <a
              key={r}
              href={`/compensation?role=${encodeURIComponent(r)}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}`}
              className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-full border transition-colors ${
                (role === r || (!role && r === 'All Roles'))
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#6B6B6B] border-[#D9D6D0] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
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
              className={`font-mono text-[10px] uppercase tracking-[1px] px-2.5 py-1 rounded-full border transition-colors ${
                (industry === ind || (!industry && ind === 'All Industries'))
                  ? 'bg-[#6B6B6B] text-white border-[#6B6B6B]'
                  : 'bg-white text-[#999590] border-[#D9D6D0] hover:border-[#6B6B6B] hover:text-[#6B6B6B]'
              }`}
            >
              {ind}
            </a>
          ))}
        </div>

        {/* Results */}
        {benchmarks.length > 0 ? (
          <div className="border border-[#D9D6D0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D9D6D0] bg-[#FAFAF8]">
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    Role
                  </th>
                  <th className="text-left font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3 hidden sm:table-cell">
                    Industry
                  </th>
                  <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    25th
                  </th>
                  <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    Median
                  </th>
                  <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3">
                    75th
                  </th>
                  <th className="text-right font-mono text-xs font-medium uppercase tracking-[1px] text-[#999590] px-4 py-3 hidden md:table-cell">
                    90th
                  </th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#D9D6D0] last:border-b-0 hover:bg-[#FAFAF8] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[#1A1A1A] font-medium">{b.role_title}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B] hidden sm:table-cell">{b.industry || 'All'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#999590]">{formatSalary(b.p25)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-[#1A1A1A]">{formatSalary(b.p50)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#6B6B6B]">{formatSalary(b.p75)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#999590] hidden md:table-cell">{formatSalary(b.p90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[#D9D6D0] rounded-xl p-12 text-center">
            <p className="text-[#999590] mb-2">No compensation data yet</p>
            <p className="text-sm text-[#B5B1AB]">
              Benchmark data is refreshed monthly. Run the initial data load to populate.
            </p>
          </div>
        )}

        {/* Methodology note */}
        <div className="mt-8 p-4 bg-[#FAFAF8] border border-[#D9D6D0] rounded-lg">
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#999590] mb-2">
            Methodology
          </p>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Compensation data is aggregated from BLS Occupational Employment Statistics,
            Glassdoor, Levels.fyi, and public company filings. Figures represent total
            cash compensation (base + bonus). Equity compensation varies significantly
            and is not included. Data is refreshed quarterly.
          </p>
        </div>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compBenchmarkSchema()) }}
      />
    </div>
  )
}
