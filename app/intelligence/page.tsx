import { createServerClient } from '@/lib/supabase-server'
import { articleListSchema } from '@/lib/schema'
import type { MarketArticle } from '@/lib/types'
import { cleanTitle } from '@/lib/text'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market Intelligence Dashboard | CDAO Insights',
  description:
    'Real-time signal tracking for data and AI executives — AI regulation, governance shifts, vendor moves, and market signals aggregated by topic.',
  keywords: 'CDO newsletter, data executive briefing, AI governance news, enterprise data strategy, CDO weekly brief',
  alternates: { canonical: 'https://cdaoinsights.com/intelligence' },
  openGraph: {
    title: 'Market Intelligence Dashboard | CDAO Insights',
    description: 'Real-time signal tracking for data and AI executives — AI regulation, governance shifts, vendor moves, and market signals aggregated by topic.',
    url: 'https://cdaoinsights.com/intelligence',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

export const revalidate = 900 // 15 minutes

const TOPIC_META: Record<string, { label: string; color: string }> = {
  ai: { label: 'AI', color: 'border-blue-500/30 text-blue-400' },
  genai: { label: 'GenAI', color: 'border-purple-500/30 text-purple-400' },
  governance: { label: 'Governance', color: 'border-amber-500/30 text-amber-400' },
  strategy: { label: 'Strategy', color: 'border-green-500/30 text-green-400' },
  leadership: { label: 'Leadership', color: 'border-rose-500/30 text-rose-400' },
  funding: { label: 'Funding', color: 'border-emerald-500/30 text-emerald-400' },
  'data-quality': { label: 'Data Quality', color: 'border-orange-500/30 text-orange-400' },
  security: { label: 'Security', color: 'border-red-500/30 text-red-400' },
  'agentic-ai': { label: 'Agentic AI', color: 'border-indigo-500/30 text-indigo-400' },
  infrastructure: { label: 'Infrastructure', color: 'border-cyan-500/30 text-cyan-400' },
  layoffs: { label: 'Layoffs', color: 'border-red-500/30 text-red-400' },
  'ai-deployment': { label: 'AI Deployment', color: 'border-violet-500/30 text-violet-400' },
  'microsoft-fabric': { label: 'Microsoft Fabric', color: 'border-blue-400/30 text-blue-300' },
  'enterprise-ai-tools': { label: 'AI Tools', color: 'border-emerald-400/30 text-emerald-300' },
  general: { label: 'General', color: 'border-[#333] text-[#888888]' },
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

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const params = await searchParams
  const activeTopic = params.topic || ''

  const supabase = createServerClient()

  // Fetch all articles (for topic counts) and filtered results in parallel
  const [allArticlesResult, filteredResult] = await Promise.all([
    supabase
      .from('market_articles')
      .select('topics, source_name')
      .gte('relevance', 0.5)
      .order('published_at', { ascending: false })
      .limit(500),
    (() => {
      let q = supabase
        .from('market_articles')
        .select('id, title, source_name, source_url, published_at, topics, relevance')
        .gte('relevance', 0.5)
        .order('published_at', { ascending: false })
        .limit(100)
      if (activeTopic) {
        q = q.contains('topics', [activeTopic])
      }
      return q
    })(),
  ])

  const allArticles = (allArticlesResult.data || []) as Pick<MarketArticle, 'topics' | 'source_name'>[]
  const filteredArticles = (filteredResult.data || []) as MarketArticle[]

  // Compute topic distribution
  const topicCounts: Record<string, number> = {}
  const sourceCounts: Record<string, number> = {}

  for (const article of allArticles) {
    for (const t of article.topics || []) {
      topicCounts[t] = (topicCounts[t] || 0) + 1
    }
    if (article.source_name) {
      sourceCounts[article.source_name] = (sourceCounts[article.source_name] || 0) + 1
    }
  }

  // Sort topics and sources by count
  const sortedTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
  const sortedSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  // Deduplicate articles by normalized title
  function normalizeTitle(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]/g, '')
  }
  const seenTitles = new Set<string>()
  const dedupedArticles = filteredArticles.filter(a => {
    const norm = normalizeTitle(a.title)
    if (seenTitles.has(norm)) return false
    seenTitles.add(norm)
    return true
  })

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-10 pb-24 w-full">
      {/* Compact header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-2">
        Market Intelligence
      </p>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-2">
        Signal Dashboard
      </h1>
      <p className="text-sm text-[#888888] leading-relaxed max-w-2xl mb-6">
        Aggregated market signals for enterprise data &amp; AI leaders. {allArticles.length} articles tracked across {Object.keys(topicCounts).length} topics.
      </p>
      {dedupedArticles[0]?.published_at && (
        <p className="font-mono text-[10px] text-[#555555] mt-1 mb-6">
          Last signal: {new Date(dedupedArticles[0].published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* ── Dashboard Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">

        {/* ── Left Sidebar — Topic Counts + Source Counts ──────────────── */}
        <div className="space-y-4">
          {/* Topic Distribution */}
          <div className="border border-[#1E1E1E] rounded-sm p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555] mb-3">
              Topics
            </h2>
            {/* All filter */}
            <a
              href="/intelligence"
              className={`flex items-center justify-between py-1.5 border-b border-[#1E1E1E] text-xs transition-colors ${
                !activeTopic ? 'text-[#00FF94]' : 'text-[#888888] hover:text-[#E8E8E8]'
              }`}
            >
              <span>All Signals</span>
              <span className="font-mono text-[11px]">{allArticles.length}</span>
            </a>
            {sortedTopics.map(([topic, count]) => {
              const meta = TOPIC_META[topic] || TOPIC_META.general
              return (
                <a
                  key={topic}
                  href={`/intelligence?topic=${topic}`}
                  className={`flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0 text-xs transition-colors ${
                    activeTopic === topic ? 'text-[#00FF94]' : 'text-[#888888] hover:text-[#E8E8E8]'
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className="font-mono text-[11px]">{count}</span>
                </a>
              )
            })}
          </div>

          {/* Source Distribution */}
          <div className="border border-[#1E1E1E] rounded-sm p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555] mb-3">
              Top Sources
            </h2>
            {sortedSources.map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0"
              >
                <span className="text-xs text-[#888888] truncate mr-2">{source}</span>
                <span className="font-mono text-[11px] text-[#555555] flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column — Signal Table ──────────────────────────────── */}
        <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
              {activeTopic ? (TOPIC_META[activeTopic]?.label || activeTopic) + ' Signals' : 'Latest Signals'}
            </h2>
            <span className="font-mono text-[10px] text-[#555555]">
              {dedupedArticles.length} results
            </span>
          </div>

          {dedupedArticles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-[#555555]">No signals found for this topic. Try a different filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E1E]">
              {dedupedArticles.map((article) => (
                <a
                  key={article.id}
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 hover:bg-[#111111] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm text-[#E8E8E8] group-hover:text-[#3B82F6] leading-snug line-clamp-1">
                        {cleanTitle(article.title)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {article.topics.slice(0, 2).map((t) => {
                          const meta = TOPIC_META[t] || TOPIC_META.general
                          return (
                            <span
                              key={t}
                              className={`font-mono text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          )
                        })}
                        {article.source_name && (
                          <span className="font-mono text-[10px] text-[#555555]">
                            {article.source_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#555555] whitespace-nowrap mt-1 flex-shrink-0">
                      {article.published_at ? timeAgo(article.published_at) : '\u2014'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* JSON-LD for AEO — preserved */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleListSchema(dedupedArticles)) }}
      />
    </main>
  )
}
