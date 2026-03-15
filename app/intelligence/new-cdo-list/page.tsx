import { createServerClient } from '@/lib/supabase-server'
import { cleanTitle } from '@/lib/text'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New CDO & CAIO Appointments This Week | CDAO Insights',
  description: 'Weekly list of new Chief Data Officer and Chief AI Officer appointments at enterprise companies. Get the full list delivered to your inbox.',
  alternates: { canonical: 'https://cdaoinsights.com/intelligence/new-cdo-list' },
  openGraph: {
    title: 'New CDO & CAIO Appointments This Week | CDAO Insights',
    description: 'Weekly list of new CDO and CAIO appointments. The fastest way to reach data and AI leaders in their first 90 days.',
    url: 'https://cdaoinsights.com/intelligence/new-cdo-list',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
}

export const revalidate = 3600 // 1 hour

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default async function NewCdoListPage() {
  const supabase = createServerClient()

  const cutoff7 = new Date()
  cutoff7.setDate(cutoff7.getDate() - 7)

  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)

  const [previewResult, countResult] = await Promise.all([
    // Preview: last 7 days, first 5
    supabase
      .from('executive_moves')
      .select('id, person_name, title, company_name, move_type, headline, source_url, published_at')
      .gte('published_at', cutoff7.toISOString())
      .neq('move_type', 'leaves')
      .order('published_at', { ascending: false })
      .limit(5),
    // Count: last 30 days
    supabase
      .from('executive_moves')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', cutoff30.toISOString())
      .neq('move_type', 'leaves'),
  ])

  const preview = previewResult.data || []
  const totalThisMonth = countResult.count || 0

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-10 pb-24 w-full">
      {/* Header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-2">
        Intelligence Product
      </p>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-3">
        New CDO & CAIO Appointments
      </h1>
      <p className="text-sm text-[#888888] leading-relaxed max-w-2xl mb-2">
        Every week, new Chief Data Officers and Chief AI Officers step into role —
        with fresh budgets and no incumbent vendor relationships.
        This list tells you who they are before your competitors find out.
      </p>
      <p className="font-mono text-xs text-[#555555] mb-8">
        {totalThisMonth} new appointments tracked in the last 30 days.
      </p>

      {/* Value props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[
          { stat: '~90 days', label: 'Window before first major vendor decisions' },
          { stat: 'Weekly', label: 'New appointments delivered every Monday' },
          { stat: '100%', label: 'Enterprise — no startup or SMB noise' },
        ].map((item) => (
          <div key={item.stat} className="border border-[#1E1E1E] rounded-sm p-4">
            <p className="text-xl font-semibold text-[#00FF94] mb-1">{item.stat}</p>
            <p className="text-xs text-[#888888]">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
            Preview — Last 7 Days
          </h2>
          <span className="font-mono text-[10px] text-[#555555]">Showing 5 of {preview.length}+</span>
        </div>
        <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
          {preview.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-[#555555]">No appointments this week yet. Check back Monday.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E1E]">
              {preview.map((move) => (
                <div key={move.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {move.person_name && (
                        <span className="text-sm font-medium text-[#E8E8E8]">{move.person_name}</span>
                      )}
                      {move.title && (
                        <span className="font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 border border-[#00FF94]/30 text-[#00FF94] rounded-sm">
                          {move.title}
                        </span>
                      )}
                    </div>
                    {move.company_name && (
                      <p className="text-xs text-[#888888]">{move.company_name}</p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-[#555555] whitespace-nowrap flex-shrink-0">
                    {move.published_at && !isNaN(new Date(move.published_at).getTime())
                      ? timeAgo(move.published_at) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Blur/paywall hint */}
        <div className="border border-[#1E1E1E] border-t-0 rounded-b-sm px-4 py-3 bg-[#111111] text-center">
          <p className="text-xs text-[#555555]">
            + {totalThisMonth - Math.min(preview.length, 5)} more appointments this month in the full weekly export
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border border-[#1E1E1E] rounded-sm p-6 max-w-xl">
        <h2 className="text-base font-semibold text-[#E8E8E8] mb-2">Get the full weekly list</h2>
        <p className="text-sm text-[#888888] mb-4 leading-relaxed">
          Every Monday: all new CDO, CAIO, and CDAIO appointments from the prior week.
          Name, title, company, source link. CSV format.
          Built for vendor sales and marketing teams who want to reach data leaders first.
        </p>
        <div className="space-y-2 mb-5">
          {[
            'All appointments — not just the ones that make headlines',
            'CSV delivery — drop straight into your CRM',
            'No fluff — name, title, company, date, source link',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="text-[#00FF94] text-xs mt-0.5">✓</span>
              <span className="text-xs text-[#888888]">{item}</span>
            </div>
          ))}
        </div>
        <a
          href="mailto:jared@cdaoinsights.com?subject=New CDO Appointment List&body=Hi, I'm interested in the weekly new CDO/CAIO appointment list. Please send pricing details."
          className="inline-block font-mono text-xs uppercase tracking-[1px] px-4 py-2 bg-[#00FF94] text-[#0A0A0A] rounded-sm hover:bg-[#00CC77] transition-colors"
        >
          Get Pricing →
        </a>
        <p className="font-mono text-[10px] text-[#555555] mt-3">Starting at $500/month · Cancel anytime</p>
      </div>

      {/* Use cases */}
      <div className="mt-10 border-t border-[#1E1E1E] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555] mb-4">Who buys this</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {[
            { who: 'Data & AI vendors', why: 'New CDOs are evaluating tools in their first 90 days. Reach them before your competitors.' },
            { who: 'Executive recruiters', why: 'Track movement in your target market. Know when a new CDO will be looking to build their team.' },
            { who: 'GTM consultants', why: 'Know which accounts just got a new buyer before anyone else does.' },
            { who: 'VC/PE firms', why: 'Track talent flow across portfolio companies and target sectors.' },
          ].map((item) => (
            <div key={item.who} className="border border-[#1E1E1E] rounded-sm p-4">
              <p className="text-sm font-medium text-[#E8E8E8] mb-1">{item.who}</p>
              <p className="text-xs text-[#888888] leading-relaxed">{item.why}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
