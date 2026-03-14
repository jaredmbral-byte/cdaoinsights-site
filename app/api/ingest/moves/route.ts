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

// Google Alerts RSS — add your alert URLs to GOOGLE_ALERTS_RSS_URLS env var
// Format: comma-separated list of RSS URLs from Google Alerts
// Example alerts to create at https://www.google.com/alerts:
//   "Chief Data Officer appointed" → RSS → copy URL
//   "Chief AI Officer named" → RSS → copy URL
//   "CDO joins" → RSS → copy URL
//   "CAIO appointed" → RSS → copy URL
const GOOGLE_ALERTS_FEEDS = (process.env.GOOGLE_ALERTS_RSS_URLS || '')
  .split(',')
  .map(url => url.trim())
  .filter(url => url.startsWith('http'))
  .map(url => ({ url, name: 'Google Alerts', query: 'google-alert' }))

const ALL_FEEDS = [...GOOGLE_NEWS_FEEDS, ...PR_NEWSWIRE_FEEDS, ...GOOGLE_ALERTS_FEEDS]

// Keywords that indicate an executive move article (C-Suite only)
// NOTE: Acronyms are NOT included here because MOVE_KEYWORDS uses .toLowerCase()
// comparison which would match names like "Caio". Role matching is handled
// separately by ROLE_PATTERNS which uses case-sensitive regex for acronyms.
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
]

// Title patterns — C-Suite only (VP/Director/Head of are handled by hiring signals)
// NOTE: Acronyms (CDO, CAIO, CDAO, CDAIO) are case-sensitive to avoid
// matching proper names like "Caio" (common Brazilian/Portuguese first name)
const ROLE_PATTERNS = [
  /chief\s+data\s+(?:and|&)\s+(?:ai|analytics)\s+officer/i,
  /chief\s+data\s+officer/i,
  /chief\s+ai\s+officer/i,
  /chief\s+analytics\s+officer/i,
  /\bCDAO\b/,
  /\bCDAIO\b/,
  /\bCAIO\b/,
  /\bCDO\b/,
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

// Headlines that match CDO/CAIO keywords but aren't actual appointments
const NON_MOVE_PATTERNS = [
  /roundtable|summit|conference|webinar/i,
  /accuses|shuts down rumors|launches|unveils|issues draft/i,
  /\bIndyCar\b|\bFormula\b|\bNASCAR\b/i,
  /scaling to \d+|on scaling/i,
  /will \d{4} be the year/i,
  /literacy framework/i,
  /passionate debates|loud rumors/i,
  /safety guide for citizens/i,
]

// Check if this article is relevant to executive moves
function isRelevantMove(title: string, description: string): boolean {
  // Reject known non-move patterns
  if (NON_MOVE_PATTERNS.some(p => p.test(title))) return false

  const text = `${title} ${description}`.toLowerCase()
  const hasRole = ROLE_PATTERNS.some((p) => p.test(text))
  const hasAction = MOVE_KEYWORDS.some((kw) => text.includes(kw))
  return hasRole && hasAction
}

// Normalize company name for dedup: strip junk, unify synonyms
function normalizeCompanyForDedup(name: string | null, headline?: string): string | null {
  // If name is null or garbage, try extracting from headline
  if ((!name || name.length < 3) && headline) {
    const m = headline.match(/^([A-Z][\w&.\-]+(?:\s+[A-Z][\w&.\-]+)*)\s+(?:appoints?|names?|hires?|taps?|promotes?)/i)
    if (m) name = m[1]
  }
  if (!name) return null
  let n = name.toLowerCase().trim()
  n = n.replace(/\s*[-–|]\s*[a-z][\w\s&.]+$/g, '').trim()
  const synonyms: Record<string, string> = {
    'pentagon': 'dod', 'defense department': 'dod', 'department of defense': 'dod',
  }
  for (const [pattern, replacement] of Object.entries(synonyms)) {
    if (n.includes(pattern)) return replacement
  }
  return n || null
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

        // Multi-layer dedup to catch near-duplicate move announcements
        const windowStart = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
        let isDuplicate = false

        // Layer 1: Same person within 7d (a person rarely gets two C-suite roles in a week)
        if (personName) {
          const { data: existing } = await supabaseAdmin
            .from('executive_moves')
            .select('id')
            .ilike('person_name', personName)
            .gte('published_at', windowStart)
            .limit(1)
          if (existing && existing.length > 0) isDuplicate = true
        }

        // Layer 2: Same company + same role title within 7d
        if (!isDuplicate && companyName && execTitle) {
          const { data: existing } = await supabaseAdmin
            .from('executive_moves')
            .select('id')
            .ilike('company_name', companyName)
            .ilike('title', execTitle)
            .gte('published_at', windowStart)
            .limit(1)
          if (existing && existing.length > 0) isDuplicate = true
        }

        // Layer 2.5: Normalized company + title dedup (catches Pentagon/DOD synonyms)
        if (!isDuplicate && execTitle) {
          const normCo = normalizeCompanyForDedup(companyName, item.title)
          if (normCo) {
            const normTitle = execTitle.toLowerCase().trim()
            // Check existing moves for normalized match
            const { data: allRecent } = await supabaseAdmin
              .from('executive_moves')
              .select('id, company_name, title, headline')
              .ilike('title', normTitle)
              .gte('published_at', windowStart)
              .limit(50)
            if (allRecent) {
              for (const existing of allRecent) {
                const existingNormCo = normalizeCompanyForDedup(existing.company_name, existing.headline)
                if (existingNormCo === normCo) { isDuplicate = true; break }
              }
            }
          }
        }

        // Layer 3: Headline fallback when name/company extraction both fail
        if (!isDuplicate && !personName && !companyName) {
          const coreHeadline = item.title
            .replace(/\s*[-–|]\s*[A-Z][\w\s&.]+$/g, '')
            .trim()
          if (coreHeadline.length > 15) {
            const { data: headlineMatch } = await supabaseAdmin
              .from('executive_moves')
              .select('id')
              .ilike('headline', `%${coreHeadline}%`)
              .gte('published_at', windowStart)
              .limit(1)
            if (headlineMatch && headlineMatch.length > 0) isDuplicate = true
          }
        }

        if (isDuplicate) {
          totalSkipped++
          continue
        }

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

// Vercel Cron sends GET requests
export async function GET(request: Request) {
  return POST(request)
}
