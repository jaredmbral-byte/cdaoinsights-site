import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { passesNegativeFilter } from '@/lib/filters'

// Cron-triggered: pull news from RSS feeds (free, no Firecrawl credits)
// Vercel Cron calls this every 15 minutes

const RSS_FEEDS = [
  // Google News — targeted enterprise data/AI queries
  { url: 'https://news.google.com/rss/search?q=Chief+Data+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Chief+AI+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+data+governance+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+AI+adoption+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=CDO+%22data+strategy%22+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22chief+data+officer%22+2026+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Industry-specific feeds — high signal for enterprise data/AI leaders
  { url: 'https://tdwi.org/rss-feeds/all-articles.aspx', name: 'TDWI' },
  { url: 'https://www.datasciencecentral.com/feed/', name: 'Data Science Central' },
  { url: 'https://www.datanami.com/feed/', name: 'Datanami' },

  // Data governance, quality & catalog vendors
  { url: 'https://www.dataversity.net/feed/', name: 'Dataversity' },
  { url: 'https://www.collibra.com/us/en/blog/rss.xml', name: 'Collibra Blog' },
  { url: 'https://www.alation.com/blog/feed/', name: 'Alation Blog' },
  { url: 'https://www.atlan.com/blog/rss.xml', name: 'Atlan Blog' },
  { url: 'https://www.montecarlodata.com/blog/feed/', name: 'Monte Carlo Blog' },
  { url: 'https://www.greatexpectations.io/blog/rss.xml', name: 'Great Expectations Blog' },

  // Data engineering & integration
  { url: 'https://www.getdbt.com/blog/rss.xml', name: 'dbt Blog' },
  { url: 'https://www.fivetran.com/blog/rss', name: 'Fivetran Blog' },
  { url: 'https://www.informatica.com/blogs.rss.html', name: 'Informatica Blog' },

  // Cloud data platforms
  { url: 'https://aws.amazon.com/blogs/big-data/feed/', name: 'AWS Big Data Blog' },
  { url: 'https://www.databricks.com/blog/feed', name: 'Databricks Blog' },
  { url: 'https://www.snowflake.com/blog/feed/', name: 'Snowflake Blog' },

  // Executive strategy & leadership
  { url: 'https://news.google.com/rss/search?q=%22data+governance%22+enterprise+2026+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22agentic+AI%22+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22data+quality%22+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=CDO+CAIO+%22data+leader%22+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Research & thought leadership
  { url: 'https://sloanreview.mit.edu/feed/', name: 'MIT Sloan Review' },
  { url: 'https://datamanagementreview.com/feed/', name: 'Data Management Review' },
]

import { stripHtml } from '@/lib/text'

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

// Relevance scoring — higher bar to reduce noise
function scoreRelevance(title: string, description: string): number {
  const t = `${title} ${description}`.toLowerCase()
  let score = 0.2 // baseline

  // High relevance: mentions our target personas directly
  if (t.includes('chief data officer') || t.includes('chief data and analytics officer')) score += 0.35
  if (t.includes('chief ai officer') || t.includes('caio')) score += 0.35
  if (t.includes('data leader') || t.includes('data executive')) score += 0.25
  if (t.includes('cdao') || t.includes('cdaio')) score += 0.3

  // Medium relevance: enterprise data/AI topics
  if (t.includes('enterprise') && (t.includes('data') || t.includes('ai'))) score += 0.2
  if (t.includes('data governance')) score += 0.2
  if (t.includes('data strategy')) score += 0.2
  if (t.includes('data quality')) score += 0.15
  if (t.includes('data mesh') || t.includes('data fabric')) score += 0.15
  if (t.includes('mdm') || t.includes('master data')) score += 0.15
  if (t.includes('agentic ai') || t.includes('ai agent')) score += 0.1

  // Slight boost: industry-specific data/AI
  if ((t.includes('data') || t.includes('analytics')) && t.includes('officer')) score += 0.15

  return Math.min(score, 1.0)
}

// Parse RSS XML into items
function parseRSS(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const title = stripHtml(
      itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '',
    )
    const link = (itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || '').trim()
    const description = stripHtml(
      itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] || '',
    ).slice(0, 500)
    const pubDate = (itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim()

    if (title && link) {
      items.push({ title, link, description, pubDate })
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
  let totalSkipped = 0

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' },
      })
      if (!response.ok) continue

      const xml = await response.text()
      const items = parseRSS(xml)

      for (const item of items) {
        const relevance = scoreRelevance(item.title, item.description)

        // Only store articles scoring 0.5+ (raised from 0.3 to reduce noise)
        if (relevance < 0.5) {
          totalSkipped++
          continue
        }

        // Negative keyword filter — reject MMA, CDO financial, and other false positives
        if (!passesNegativeFilter(item.title, item.description, item.link)) {
          totalSkipped++
          continue
        }

        const topics = classifyTopics(item.title, item.description)
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null

        // Ensure description is clean text (no HTML)
        const cleanSummary = item.description ? stripHtml(item.description) : null

        const { error } = await supabaseAdmin
          .from('market_articles')
          .upsert(
            {
              title: stripHtml(item.title),
              summary: cleanSummary,
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
    skipped: totalSkipped,
    feeds: RSS_FEEDS.length,
    timestamp: new Date().toISOString(),
  })
}
