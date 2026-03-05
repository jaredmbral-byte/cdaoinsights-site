import { createServerClient } from '@/lib/supabase-server'
import { articleListSchema } from '@/lib/schema'
import type { MarketArticle } from '@/lib/types'
import { cleanTitle, cleanSummary } from '@/lib/text'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Intelligence Brief | CDAO Insights',
  description:
    'Curated weekly briefings for data and AI executives — vendor moves, regulatory updates, and strategic signals that matter to CDOs.',
  keywords: 'CDO newsletter, data executive briefing, AI governance news, enterprise data strategy, CDO weekly brief',
  alternates: { canonical: 'https://cdaoinsights.com/intelligence' },
  openGraph: {
    title: 'Weekly Intelligence Brief | CDAO Insights',
    description: 'Curated weekly briefings for data and AI executives — vendor moves, regulatory updates, and strategic signals that matter to CDOs.',
    url: 'https://cdaoinsights.com/intelligence',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

export const revalidate = 900 // 15 minutes

const TOPICS = [
  { label: 'All', value: '' },
  { label: 'AI', value: 'ai' },
  { label: 'GenAI', value: 'genai' },
  { label: 'Governance', value: 'governance' },
  { label: 'Strategy', value: 'strategy' },
  { label: 'Leadership', value: 'leadership' },
  { label: 'Funding', value: 'funding' },
  { label: 'Data Quality', value: 'data-quality' },
  { label: 'Security', value: 'security' },
  { label: 'Agentic AI', value: 'agentic-ai' },
]

async function getArticles(topic?: string, days?: number): Promise<MarketArticle[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('market_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(100)

  if (topic) {
    query = query.contains('topics', [topic])
  }

  if (days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('published_at', cutoff.toISOString())
  }

  const { data } = await query
  return (data as MarketArticle[]) || []
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TOPIC_COLORS: Record<string, string> = {
  ai: 'border-blue-500/30 text-blue-400',
  genai: 'border-purple-500/30 text-purple-400',
  governance: 'border-amber-500/30 text-amber-400',
  strategy: 'border-green-500/30 text-green-400',
  leadership: 'border-rose-500/30 text-rose-400',
  funding: 'border-emerald-500/30 text-emerald-400',
  'data-quality': 'border-orange-500/30 text-orange-400',
  security: 'border-red-500/30 text-red-400',
  'agentic-ai': 'border-indigo-500/30 text-indigo-400',
  infrastructure: 'border-cyan-500/30 text-cyan-400',
  general: 'border-[#333] text-[#888888]',
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; days?: string }>
}) {
  const params = await searchParams
  const topic = params.topic
  const days = params.days ? parseInt(params.days) : 7

  const articles = await getArticles(topic, days)

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Page header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-4">
        Market Intelligence
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-3">
        What&apos;s moving in enterprise data &amp; AI
      </h1>
      <p className="text-base text-[#888888] leading-relaxed max-w-2xl mb-10">
        Curated signals from across the market — AI regulation, governance shifts,
        vendor moves, and leadership changes. Updated every 15 minutes.
      </p>

      {/* Topic filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {TOPICS.map((t) => (
          <a
            key={t.value}
            href={`/intelligence${t.value ? `?topic=${t.value}` : ''}${days !== 7 ? `${t.value ? '&' : '?'}days=${days}` : ''}`}
            className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              (topic === t.value || (!topic && t.value === ''))
                ? 'bg-[#E8E8E8] text-[#0A0A0A] border-[#E8E8E8]'
                : 'bg-transparent text-[#888888] border-[#1E1E1E] hover:border-[#555555] hover:text-[#E8E8E8]'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Results */}
      <p className="font-mono text-xs text-[#555555] mb-6">
        {articles.length} {articles.length === 1 ? 'article' : 'articles'}
      </p>

      {articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] hover:bg-[#111111] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base text-[#E8E8E8] group-hover:text-[#3B82F6] mb-2 leading-snug">
                    {cleanTitle(article.title)}
                  </h2>
                  {cleanSummary(article.summary, article.title) && (
                    <p className="text-sm text-[#888888] leading-relaxed mb-3 line-clamp-2">
                      {cleanSummary(article.summary, article.title)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {article.topics.map((t) => (
                      <span
                        key={t}
                        className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border ${TOPIC_COLORS[t] || TOPIC_COLORS.general}`}
                      >
                        {t.replace('-', ' ')}
                      </span>
                    ))}
                    {article.source_name && (
                      <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555]">
                        {article.source_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[#555555] whitespace-nowrap mt-1">
                  {article.published_at ? timeAgo(article.published_at) : '—'}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="border border-[#1E1E1E] rounded-sm p-12 text-center">
          <p className="text-[#888888] mb-2">No articles yet</p>
          <p className="text-sm text-[#555555]">
            News is ingested every 15 minutes from RSS feeds. Check back shortly.
          </p>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleListSchema(articles)) }}
      />
    </main>
  )
}
