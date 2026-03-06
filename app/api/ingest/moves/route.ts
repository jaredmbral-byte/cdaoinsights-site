import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { passesNegativeFilter } from '@/lib/filters'

// Cron-triggered: pull C-Suite executive move announcements
// (CDO/CAIO/CDAIO/CAO appointments and departures only)
// from Google News RSS and PR Newswire RSS (free, no API key needed)
// VP/Director/Head of roles are tracked via hiring signals, not here

// C-Suite appointment/departure queries only
const QUERY_TERMS = [
  'appointed Chief Data Officer',
  'named Chief AI Officer',
  'named Chief Analytics Officer',
  'joins as CDO',
  'Chief Data Officer leaves',
  'Chief Data Officer departs',
  'appointed CDAIO',
  'named CAIO',
  'appointed CDAO',
]

// Build Google News RSS URLs for each query
const GOOGLE_NEWS_FEEDS = QUERY_TERMS.map((q) => ({
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`,
  name: 'Google News',
  query: q,
}))

// PR Newswire RSS — executive appointments feed
const PR_NEWSWIRE_FEEDS = [
  {
    url: 'https://www.prnewswire.com/rss/news-releases-list.rss',
    name: 'PR Newswire',
    query: 'executive appointments',
  },
]

const ALL_FEEDS = [...GOOGLE_NEWS_FEEDS, ...PR_NEWSWIRE_FEEDS]

// Keywords that indicate an executive move article (C-Suite only)
const MOVE_KEYWORDS = [
  'appointed', 'appoints', 'appointment',
  'named', 'names',
  'joins', 'joined',
  'hired', 'hires',
  'promoted', 'promotes', 'promotion',
  'leaves', 'departs', 'departure', 'departing',
  'steps down', 'resigns', 'resigned', 'resignation',
  'succeeds', 'successor',
  'chief data officer', 'chief ai officer',
  'chief analytics officer', 'chief data and ai officer',
  'cdo', 'caio', 'cdaio', 'cdao',
]

// Title patterns — C-Suite only (VP/Director/Head of are handled by hiring signals)
const ROLE_PATTERNS = [
  /chief\s+data\s+(?:and|&)\s+(?:ai|analytics)\s+officer/i,
  /chief\s+data\s+officer/i,
  /chief\s+ai\s+officer/i,
  /chief\s+analytics\s+officer/i,
  /\bcdao\b/i,
  /\bcdaio\b/i,
  /\bcaio\b/i,
  /\bcdo\b/i,
]

// Classify the type of executive move
function classifyMoveType(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('leaves') || t.includes('departs') || t.includes('departure') || t.includes('steps down') || t.includes('resigns'))
    return 'leaves'
  if (t.includes('promoted') || t.includes('promotes') || t.includes('promotion'))
    return 'promoted'
  if (t.includes('joins') || t.includes('joined'))
    return 'joins'
  if (t.includes('named') || t.includes('names'))
    return 'named'
  if (t.includes('appointed') || t.includes('appoints') || t.includes('appointment'))
    return 'appointed'
  return null
}

// Extract person name from headline (best effort)
function extractPersonName(headline: string): string | null {
  // Common patterns: "Jane Doe Named CDO at Company" or "Company Appoints Jane Doe as CDO"
  const patterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:named|appointed|joins|hired|promoted)/i,
    /(?:appoints?|names?|hires?|promotes?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:as|to|for)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:to\s+(?:lead|head|serve))/i,
  ]
  for (const pattern of patterns) {
    const match = headline.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

// Extract company name from headline (best effort)
function extractCompanyName(headline: string): string | null {
  const patterns = [
    /(?:at|for|of)\s+([A-Z][A-Za-z0-9&.\-\s]+?)(?:\s+as\b|\s+to\b|\s*[,.]|\s*$)/,
    /([A-Z][A-Za-z0-9&.\-\s]+?)\s+(?:appoints?|names?|hires?|promotes?)/i,
  ]
  for (const pattern of patterns) {
    const match = headline.match(pattern)
    if (match?.[1]) {
      const name = match[1].trim()
      if (name.length > 2 && name.length < 60) return name
    }
  }
  return null
}

// Extract the executive title from headline
function extractTitle(headline: string): string | null {
  for (const pattern of ROLE_PATTERNS) {
    const match = headline.match(pattern)
    if (match) return match[0]
  }
  return null
}

// Check if this article is relevant to executive moves
function isRelevantMove(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  const hasRole = ROLE_PATTERNS.some((p) => p.test(text))
  const hasAction = MOVE_KEYWORDS.some((kw) => text.includes(kw))
  return hasRole && hasAction
}

// Parse RSS XML into items (reused pattern from news ingest)
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
  let totalSkipped = 0

  for (const feed of ALL_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' },
      })
      if (!response.ok) continue

      const xml = await response.text()
      const items = parseRSS(xml)

      for (const item of items) {
        // Filter: only store articles that are actually about exec moves
        if (!isRelevantMove(item.title, item.description)) {
          totalSkipped++
          continue
        }

        // Negative keyword filter — reject MMA fighters, CDO financial terms, etc.
        if (!passesNegativeFilter(item.title, item.description, item.link)) {
          totalSkipped++
          continue
        }

        const moveType = classifyMoveType(item.title) || classifyMoveType(item.description)
        const personName = extractPersonName(item.title)
        const companyName = extractCompanyName(item.title)
        const execTitle = extractTitle(item.title) || extractTitle(item.description)
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null

        const { error } = await supabaseAdmin
          .from('executive_moves')
          .upsert(
            {
              person_name: personName,
              title: execTitle,
              company_name: companyName,
              move_type: moveType,
              headline: item.title,
              summary: item.description || null,
              source_url: item.link,
              source_name: feed.name,
              published_at: publishedAt,
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
    feeds: ALL_FEEDS.length,
    timestamp: new Date().toISOString(),
  })
}
