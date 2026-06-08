import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createServerClient } from '@/lib/supabase-server'
import TallyForm from '@/components/TallyForm'

export const metadata: Metadata = {
  title: 'The Digest | CDAO Insights',
  description:
    'The weekly intelligence brief for enterprise data and AI leaders. Field notes, not think pieces.',
}
export const dynamic = 'force-dynamic'

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
      {children}
    </span>
  )
}

export default async function DigestPage() {
  const sb = createServerClient()
  const safe = async (p: PromiseLike<{ data: unknown }>) => {
    try {
      const { data } = await p
      return (data as Record<string, unknown>[]) || []
    } catch {
      return []
    }
  }

  const [briefs, moves, hiring, articles] = await Promise.all([
    safe(
      sb
        .from('weekly_brief')
        .select('headline, body, week_label, category, created_at')
        .order('created_at', { ascending: false })
        .limit(12),
    ),
    safe(
      sb
        .from('executive_moves')
        .select('person_name, title, company_name, move_type, source_url, published_at')
        .neq('move_type', 'leaves')
        .order('published_at', { ascending: false })
        .limit(8),
    ),
    safe(
      sb
        .from('hiring_signals')
        .select('job_title, company_name, location, seniority, source_url, posted_at')
        .eq('is_featured', true)
        .order('posted_at', { ascending: false })
        .limit(6),
    ),
    safe(
      sb
        .from('market_articles')
        .select('title, source_name, source_url, published_at, relevance')
        .gte('relevance', 0.6)
        .order('published_at', { ascending: false })
        .limit(8),
    ),
  ])

  const latestWeek = (briefs[0] as { week_label?: string } | undefined)?.week_label
  const notes = briefs.filter((b) => (b as { week_label?: string }).week_label === latestWeek)
  const weekLabel =
    latestWeek ||
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Verification gate: a move is only real if we know WHO moved and WHERE.
  // Without this, the ingestion's title-only rows render as "is appointed at as Chief AI Officer".
  const validMoves = (moves as Array<{ person_name?: string; company_name?: string }>).filter(
    (m) => m.person_name && m.company_name,
  )

  return (
    <main className="flex-1">
      {/* Masthead */}
      <header className="max-w-[1200px] mx-auto px-6 pt-12 lg:pt-20 pb-10 lg:pb-14">
        <div className="flex items-center gap-3 mb-8">
          <Label>The Digest</Label>
          <span className="h-px flex-1 bg-[#C9C4BB]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
            {weekLabel}
          </span>
        </div>
        <h1 className="font-sans font-medium text-[#0A0A0A] tracking-[-0.03em] leading-[1.0] text-[clamp(40px,6vw,76px)]">
          The week in <span className="text-[#6B6864]">enterprise data &amp; AI.</span>
        </h1>
        <p className="mt-6 max-w-[640px] text-[#3A3A3A] text-[17px] leading-[1.5]">
          Field notes for the people who own the data. Who moved, what shipped, where the budgets
          are going. Sourced, not summarized.
        </p>
      </header>

      {/* Field Notes */}
      <section className="max-w-[1200px] mx-auto px-6 border-t border-[#C9C4BB]">
        <div className="py-6">
          <Label>Field Notes</Label>
        </div>
        <div className="divide-y divide-[#C9C4BB] border-t border-[#C9C4BB]">
          {notes.map((n, i) => {
            const note = n as { headline: string; body: string; category: string }
            return (
              <article
                key={i}
                className="grid grid-cols-1 lg:grid-cols-[56px_136px_1fr] gap-3 lg:gap-6 py-7"
              >
                <div className="font-mono text-[12px] text-[#8A8782] tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="pt-0.5">
                  <Label>{note.category}</Label>
                </div>
                <div>
                  <h2 className="font-sans font-medium text-[#0A0A0A] text-[22px] lg:text-[26px] leading-[1.15] tracking-[-0.015em]">
                    {note.headline}
                  </h2>
                  <p className="mt-2.5 text-[#3A3A3A] text-[15px] leading-[1.55] max-w-[680px]">
                    {note.body}
                  </p>
                </div>
              </article>
            )
          })}
          {notes.length === 0 && (
            <div className="py-10 text-[#6B6864] text-sm">
              No field notes published yet for this week.
            </div>
          )}
        </div>
      </section>

      {/* The Board — Leadership Moves */}
      {validMoves.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 mt-16 lg:mt-24 border-t border-[#C9C4BB]">
          <div className="py-6 flex items-baseline justify-between">
            <Label>The Board — Leadership Moves</Label>
            <span className="font-mono text-[10px] text-[#8A8782] tabular-nums">
              {validMoves.length}
            </span>
          </div>
          <div className="divide-y divide-[#C9C4BB] border-t border-[#C9C4BB]">
            {validMoves.map((m, i) => {
              const mv = m as {
                person_name: string
                title: string
                company_name: string
                published_at: string
              }
              return (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-3.5 items-baseline">
                  <div className="text-[15px] text-[#0A0A0A]">
                    <span className="font-medium">{mv.person_name}</span>
                    {mv.title && <span className="text-[#6B6864]"> · {mv.title}</span>}
                    {mv.company_name && <span>, {mv.company_name}</span>}
                  </div>
                  <div className="font-mono text-[11px] text-[#8A8782] tabular-nums whitespace-nowrap">
                    {timeAgo(mv.published_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Hiring Signal */}
      {hiring.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 mt-16 lg:mt-24 border-t border-[#C9C4BB]">
          <div className="py-6">
            <Label>Hiring Signal — Senior Openings</Label>
          </div>
          <div className="divide-y divide-[#C9C4BB] border-t border-[#C9C4BB]">
            {hiring.map((h, i) => {
              const hh = h as { job_title: string; company_name: string; location: string; seniority: string }
              return (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-3.5 items-baseline">
                  <div className="text-[15px] text-[#0A0A0A]">
                    <span className="font-medium">{hh.job_title}</span>
                    <span className="text-[#6B6864]"> · {hh.company_name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#8A8782] whitespace-nowrap">
                    {hh.location || hh.seniority || ''}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* The Wire — Market */}
      {articles.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 mt-16 lg:mt-24 border-t border-[#C9C4BB]">
          <div className="py-6">
            <Label>The Wire — What Moved the Market</Label>
          </div>
          <div className="divide-y divide-[#C9C4BB] border-t border-[#C9C4BB]">
            {articles.map((a, i) => {
              const ar = a as { title: string; source_name: string; source_url: string }
              return (
                <a
                  key={i}
                  href={ar.source_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[120px_1fr] gap-4 py-3.5 items-baseline group"
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#6B6864] truncate">
                    {ar.source_name}
                  </div>
                  <div className="text-[15px] text-[#0A0A0A] group-hover:opacity-60 transition-opacity">
                    {ar.title}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Subscribe */}
      <section className="max-w-[1200px] mx-auto px-6 mt-20 lg:mt-28 pt-12 border-t border-[#C9C4BB] pb-24">
        <div className="max-w-[560px]">
          <h2 className="font-sans font-medium text-[#0A0A0A] text-[28px] lg:text-[34px] leading-[1.05] tracking-[-0.025em]">
            The intel desk, in your inbox.
          </h2>
          <p className="mt-4 text-[#3A3A3A] text-[16px] leading-[1.5]">
            One issue a week. The moves, the money, the field notes. Read by the people who own the
            data.
          </p>
          <div className="mt-6">
            <TallyForm />
          </div>
        </div>
      </section>
    </main>
  )
}
