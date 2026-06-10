import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} | CDAO Insights Vendor Lake` }
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function VendorProfile(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const sb = createServerClient()
  const { data: vendors } = await sb.from('vendors').select('*').eq('slug', slug).limit(1)
  const v = vendors?.[0] as Record<string, unknown> | undefined
  if (!v) notFound()

  const name = String(v.name)
  const { data: rawMentions } = await sb
    .from('market_articles')
    .select('title,source_name,source_url,published_at,topics,relevance')
    .contains('topics', [name])
    .order('published_at', { ascending: false })
    .limit(40)
  const mentions = (rawMentions || []) as Array<{
    title: string
    source_name: string
    source_url: string
    published_at: string | null
    topics: string[] | null
    relevance: number
  }>
  const verified = mentions.filter((m) => (m.topics || []).includes('verified'))

  const facts: Array<[string, string]> = [
    ['Category', String(v.sub_category || v.category || '—')],
    ['Funding', String(v.raised || '—')],
    ['Founded', v.founded ? String(v.founded) : '—'],
    ['HQ', String(v.country || '—')],
    ['Events', v.verified_count ? String(v.verified_count) : '0'],
  ]

  return (
    <main className="flex-1 max-w-[1000px] mx-auto px-6 pt-10 lg:pt-16 pb-24">
      <Link
        href="/vendors"
        className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864] hover:text-[#0A0A0A] transition-colors"
      >
        ← Vendor Lake
      </Link>

      <header className="mt-6 pb-8 border-b border-[#C9C4BB]">
        <h1 className="font-sans font-medium text-[#0A0A0A] tracking-[-0.025em] leading-[1.05] text-[clamp(32px,5vw,56px)]">
          {name}
        </h1>
        {v.website_url ? (
          <a
            href={String(v.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 font-mono text-[12px] text-[#6B6864] hover:text-[#0A0A0A] underline underline-offset-4"
          >
            {String(v.domain || v.website_url)}
          </a>
        ) : null}
      </header>

      {/* Firmographics */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-[#C9C4BB] border-x border-b border-[#C9C4BB]">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-[#F5F3EE] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864] mb-1.5">
              {label}
            </div>
            <div className="text-[15px] text-[#0A0A0A] font-medium">{value}</div>
          </div>
        ))}
      </section>

      {/* Description */}
      {v.description ? (
        <p className="mt-8 text-[#3A3A3A] text-[15px] leading-[1.6] max-w-[680px]">
          {String(v.description)}
        </p>
      ) : null}

      {/* Verified signal */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between pb-4 border-b border-[#C9C4BB]">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
            Verified Signal
          </span>
          <span className="font-mono text-[10px] text-[#8A8782] tabular-nums">{verified.length}</span>
        </div>
        <div className="divide-y divide-[#C9C4BB]">
          {verified.map((m, i) => (
            <a
              key={i}
              href={m.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[1fr_auto] gap-4 py-3.5 items-baseline group"
            >
              <div>
                <div className="text-[15px] text-[#0A0A0A] group-hover:opacity-60 transition-opacity">
                  {m.title}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.03em] text-[#8A8782] mt-1">
                  {m.source_name}
                </div>
              </div>
              <div className="font-mono text-[11px] text-[#8A8782] tabular-nums whitespace-nowrap">
                {fmtDate(m.published_at)}
              </div>
            </a>
          ))}
          {verified.length === 0 && (
            <div className="py-8 text-[#6B6864] text-sm">
              No verified events yet. The daily monitor will surface them as they happen.
            </div>
          )}
        </div>
      </section>

      {/* All recent mentions (raw stream) */}
      {mentions.length > verified.length && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#C9C4BB]">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
              All Recent Mentions
            </span>
            <span className="font-mono text-[10px] text-[#8A8782] tabular-nums">
              {mentions.length}
            </span>
          </div>
          <div className="divide-y divide-[#C9C4BB]">
            {mentions.map((m, i) => (
              <a
                key={i}
                href={m.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[1fr_auto] gap-4 py-2.5 items-baseline group"
              >
                <div className="text-[13px] text-[#3A3A3A] group-hover:text-[#0A0A0A] transition-colors truncate">
                  {m.title}
                </div>
                <div className="font-mono text-[10px] text-[#8A8782] tabular-nums whitespace-nowrap">
                  {fmtDate(m.published_at)}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
