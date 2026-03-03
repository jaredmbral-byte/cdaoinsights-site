import { createServerClient } from '@/lib/supabase-server'
import { articleListSchema } from '@/lib/schema'
import type { MarketArticle } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market Intelligence — Enterprise Data & AI News | CDAO Insights',
  description:
    'Curated intelligence feed for enterprise data and AI leaders. AI regulation, data governance, vendor moves, funding rounds, and market signals — without the noise.',
  alternates: { canonical: 'https://cdaoinsights.com/intelligence' },
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
  ai: 'bg-blue-50 text-blue-700',
  genai: 'bg-purple-50 text-purple-700',
  governance: 'bg-amber-50 text-amber-700',
  strategy: 'bg-green-50 text-green-700',
  leadership: 'bg-rose-50 text-rose-700',
  funding: 'bg-emerald-50 text-emerald-700',
  'data-quality': 'bg-orange-50 text-orange-700',
  security: 'bg-red-50 text-red-700',
  'agentic-ai': 'bg-indigo-50 text-indigo-700',
  infrastructure: 'bg-cyan-50 text-cyan-700',
  general: 'bg-gray-50 text-gray-600',
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
    <div className="relative z-10 flex flex-col min-h-screen font-sans">
      {/* Nav */}
      <header className="w-full border-b border-[#D9D6D0]">
        <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between" aria-label="Main navigation">
          <a href="/" className="font-mono font-medium text-sm uppercase tracking-[2px] text-[#1A1A1A]">
            CDAO Insights
          </a>
          <div className="flex items-center gap-6">
            <a href="/hiring" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Hiring</a>
            <a href="/intelligence" className="font-mono text-sm uppercase tracking-[2px] text-[#1A1A1A] border-b border-[#1A1A1A]">Intelligence</a>
            <a href="/compensation" className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Compensation</a>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* Page header */}
        <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-4">
          Market Intelligence
        </p>
        <h1 className="text-3xl sm:text-4xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-3">
          What&apos;s moving in enterprise data &amp; AI
        </h1>
        <p className="text-base text-[#6B6B6B] leading-relaxed max-w-2xl mb-10">
          Curated signals from across the market — AI regulation, governance shifts,
          vendor moves, and leadership changes. Updated every 15 minutes.
        </p>

        {/* Topic filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TOPICS.map((t) => (
            <a
              key={t.value}
              href={`/intelligence${t.value ? `?topic=${t.value}` : ''}${days !== 7 ? `${t.value ? '&' : '?'}days=${days}` : ''}`}
              className={`font-mono text-xs uppercase tracking-[1px] px-3 py-1.5 rounded-full border transition-colors ${
                (topic === t.value || (!topic && t.value === ''))
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#6B6B6B] border-[#D9D6D0] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Results */}
        <p className="font-mono text-xs text-[#999590] mb-6">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </p>

        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-[#D9D6D0] rounded-xl p-5 hover:border-[#999590] hover:bg-[#FAFAF8] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-medium text-[#1A1A1A] group-hover:underline mb-2 leading-snug">
                      {article.title}
                    </h2>
                    {article.summary && (
                      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-3 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {article.topics.map((t) => (
                        <span
                          key={t}
                          className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded ${TOPIC_COLORS[t] || TOPIC_COLORS.general}`}
                        >
                          {t.replace('-', ' ')}
                        </span>
                      ))}
                      {article.source_name && (
                        <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#B5B1AB]">
                          {article.source_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#B5B1AB] whitespace-nowrap mt-1">
                    {article.published_at ? timeAgo(article.published_at) : '—'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="border border-[#D9D6D0] rounded-xl p-12 text-center">
            <p className="text-[#999590] mb-2">No articles yet</p>
            <p className="text-sm text-[#B5B1AB]">
              News is ingested every 15 minutes from RSS feeds. Check back shortly.
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleListSchema(articles)) }}
      />
    </div>
  )
}
