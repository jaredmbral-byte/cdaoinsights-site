import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cron-triggered: pull news from RSS feeds (free, no Firecrawl credits)
// Vercel Cron calls this every 15 minutes

const RSS_FEEDS = [
  { url: 'https://news.google.com/rss/search?q=Chief+Data+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Chief+AI+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+data+governance+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+AI+adoption+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat' },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch' },
  { url: 'https://www.datanami.com/feed/', name: 'Datanami' },
]

// Topic classification based on keywords
function classifyTopics(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase()
  const topics: string[] = []

  if (text.includes('governance') || text.includes('compliance') || text.includes('regulation'))
    topics.push('governance')
  if (text.includes('hiring') || text.includes('appointed') || text.includes('joins'))
    topics.push('leadership')
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning'))
    topics.push('ai')
  if (text.includes('data quality') || text.includes('data management') || text.includes('mdm'))
    topics.push('data-quality')
  if (text.includes('funding') || text.includes('raised') || text.includes('investment') || text.includes('acquisition'))
    topics.push('funding')
  if (text.includes('strategy') || text.includes('transformation') || text.includes('roadmap'))
    topics.push('strategy')
  if (text.includes('cloud') || text.includes('infrastructure') || text.includes('platform'))
    topics.push('infrastructure')
  if (text.includes('privacy') || text.includes('security') || text.includes('breach'))
    topics.push('security')
  if (text.includes('genai') || text.includes('generative') || text.includes('llm') || text.includes('chatgpt'))
    topics.push('genai')
  if (text.includes('agentic') || text.includes('agent'))
    topics.push('agentic-ai')

  return topics.length > 0 ? topics : ['general']
}

// Simple relevance scoring
function scoreRelevance(title: string): number {
  const t = title.toLowerCase()
  let score = 0.3 // baseline

  // High relevance: mentions our target personas directly
  if (t.includes('chief data officer') || t.includes('cdo')) score += 0.3
  if (t.includes('chief ai officer') || t.includes('caio')) score += 0.3
  if (t.includes('data leader') || t.includes('data executive')) score += 0.2

  // Medium relevance: enterprise data/AI topics
  if (t.includes('enterprise') && (t.includes('data') || t.includes('ai'))) score += 0.2
  if (t.includes('data governance')) score += 0.15
  if (t.includes('data strategy')) score += 0.15

  return Math.min(score, 1.0)
}

// Parse RSS XML into items
function parseRSS(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const title = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || ''
    const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() || ''
    const description = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() || ''
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''

    if (title && link) {
      items.push({ title, link, description: description.slice(0, 500), pubDate })
    }
  }

  return items
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let totalInserted = 0

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' },
      })
      if (!response.ok) continue

      const xml = await response.text()
      const items = parseRSS(xml)

      for (const item of items) {
        const relevance = scoreRelevance(item.title)
        // Only store articles above minimum relevance threshold
        if (relevance < 0.3) continue

        const topics = classifyTopics(item.title, item.description)
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null

        const { error } = await supabaseAdmin
          .from('market_articles')
          .upsert(
            {
              title: item.title,
              summary: item.description || null,
              source_name: feed.name,
              source_url: item.link,
              published_at: publishedAt,
              topics,
              relevance,
            },
            { onConflict: 'source_url', ignoreDuplicates: true },
          )

        if (!error) totalInserted++
      }
    } catch (err) {
      console.error(`Failed to fetch RSS feed ${feed.url}:`, err)
    }
  }

  return NextResponse.json({
    inserted: totalInserted,
    feeds: RSS_FEEDS.length,
    timestamp: new Date().toISOString(),
  })
}
