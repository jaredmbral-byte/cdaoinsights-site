import { NextResponse } from 'next/server'
import { firecrawl } from '@/lib/firecrawl'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Multi-source hiring ingestion:
// 1. Firecrawl search API (uses credits but gets real structured results)
// 2. Indeed RSS feeds (free, no credits)
// 3. Google News RSS for executive appointment announcements

interface ScrapedJob {
  title: string
  company: string
  location?: string
  url?: string
  date?: string
  source: string
}

const SEARCH_QUERIES = [
  'Chief Data Officer',
  'Chief AI Officer',
  'Chief Analytics Officer',
  'VP Data',
  'VP Analytics',
  'Head of Data',
  'Head of AI',
]

// Indeed RSS feeds — free, no auth required
const INDEED_RSS_URLS = [
  'https://www.indeed.com/rss?q=%22Chief+Data+Officer%22&fromage=14&explvl=executive',
  'https://www.indeed.com/rss?q=%22Chief+AI+Officer%22&fromage=14&explvl=executive',
  'https://www.indeed.com/rss?q=%22Chief+Analytics+Officer%22&fromage=14&explvl=executive',
  'https://www.indeed.com/rss?q=%22VP+Data%22&fromage=14&explvl=executive',
  'https://www.indeed.com/rss?q=%22Head+of+Data%22&fromage=14&explvl=executive',
]

// Google News RSS for executive appointment announcements
// NOTE: Use "Chief Data Officer" (not bare "CDO") to avoid false positives
// like Chief Development Officer, Chief Digital Officer, etc.
const APPOINTMENT_RSS_URLS = [
  'https://news.google.com/rss/search?q=%22Chief+Data+Officer%22+%22appointed%22+OR+%22hired%22+OR+%22named%22+when:14d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22Chief+AI+Officer%22+%22appointed%22+OR+%22hired%22+OR+%22named%22+when:14d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22Chief+Analytics+Officer%22+OR+%22CAIO%22+%22appointed%22+OR+%22named%22+when:14d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22CDAO%22+OR+%22CDAIO%22+%22appointed%22+OR+%22named%22+when:14d&hl=en-US&gl=US&ceid=US:en',
]

// ─── CDO Disambiguation ────────────────────────────────────────────────────────
// "CDO" is ambiguous — it can mean Chief Data Officer, Chief Digital Officer,
// Chief Development Officer, Chief Diversity Officer, etc.
// These helpers ensure we only capture data/analytics/AI executives.

const FALSE_POSITIVE_CDO_TITLES = [
  'chief development officer',
  'chief digital officer',
  'chief diversity officer',
  'chief design officer',
  'chief delivery officer',
  'chief disruption officer',
  'chief dental officer',
  'chief diplomatic officer',
  'collateralized debt obligation',
  'community development officer',
]

// Keywords that confirm we're talking about data/analytics/AI context
const DATA_AI_CONTEXT_KEYWORDS = [
  'data', 'analytics', 'ai ', 'artificial intelligence', 'machine learning',
  'ml ', 'governance', 'data quality', 'data strategy', 'data platform',
  'data infrastructure', 'data engineering', 'data science', 'big data',
  'business intelligence', ' bi ', 'data lake', 'data warehouse',
  'data mesh', 'data fabric', 'mdm', 'master data',
]

/**
 * Check if "CDO" in context actually means Chief Data Officer.
 * Returns true only if:
 * - The full title explicitly says "Chief Data Officer" / "Chief Data and Analytics Officer"
 * - OR surrounding context contains data/analytics/AI keywords
 * - AND the full title is NOT a known false-positive expansion
 */
function isCdoDataRelated(title: string, context: string = ''): boolean {
  const t = title.toLowerCase()
  const ctx = (title + ' ' + context).toLowerCase()

  // If the title explicitly says "Chief Data Officer" — always valid
  if (t.includes('chief data officer') || t.includes('chief data and analytics officer')) {
    return true
  }

  // If the title explicitly matches a false-positive expansion — reject
  if (FALSE_POSITIVE_CDO_TITLES.some(fp => t.includes(fp))) {
    return false
  }

  // If "CDO" abbreviation appears, check surrounding context for data/AI keywords
  if (t.includes('cdo')) {
    return DATA_AI_CONTEXT_KEYWORDS.some(kw => ctx.includes(kw))
  }

  // Not CDO-related at all, pass through (other checks will handle relevance)
  return true
}

function classifySeniority(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('chief') || t.includes('caio') || t.includes('cdaio'))
    return 'C-Suite'
  // Only classify "CDO" as C-Suite if it's actually data-related
  if (t.includes('cdo') && isCdoDataRelated(title)) return 'C-Suite'
  if (t.includes('cao') && (t.includes('analytics') || !t.includes('chief accounting')))
    return 'C-Suite'
  if (t.includes('svp') || t.includes('senior vice president')) return 'SVP'
  if (t.includes('vp') || t.includes('vice president')) return 'VP'
  if (t.includes('head of') || t.includes('director')) return 'Director+'
  return 'Senior'
}

function classifyIndustry(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('bank') || t.includes('financial') || t.includes('capital') || t.includes('finance')) return 'Financial Services'
  if (t.includes('health') || t.includes('pharma') || t.includes('medical') || t.includes('hospital')) return 'Healthcare'
  if (t.includes('tech') || t.includes('software') || t.includes('saas') || t.includes('cloud')) return 'Technology'
  if (t.includes('retail') || t.includes('commerce') || t.includes('consumer') || t.includes('store')) return 'Retail'
  if (t.includes('manufactur') || t.includes('industrial') || t.includes('automotive')) return 'Manufacturing'
  if (t.includes('energy') || t.includes('oil') || t.includes('utility') || t.includes('power')) return 'Energy'
  if (t.includes('insur')) return 'Insurance'
  if (t.includes('telecom') || t.includes('media') || t.includes('broadcast')) return 'Media & Telecom'
  if (t.includes('government') || t.includes('federal') || t.includes('public sector') || t.includes('agency')) return 'Government'
  if (t.includes('education') || t.includes('university') || t.includes('college')) return 'Education'
  if (t.includes('consult') || t.includes('advisory') || t.includes('professional service')) return 'Consulting'
  return null
}

// Parse RSS XML into items
function parseRSS(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const title = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || ''
    const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() || ''
    const description = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() || ''
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''

    if (title && link) {
      items.push({ title, link, description: description.slice(0, 500), pubDate })
    }
  }

  return items
}

// Extract company name from Indeed RSS title (format: "Job Title - Company Name - Location")
function parseIndeedTitle(fullTitle: string): { title: string; company: string; location?: string } {
  const parts = fullTitle.split(' - ')
  if (parts.length >= 3) {
    return {
      title: parts[0].trim(),
      company: parts[1].trim(),
      location: parts[2].trim(),
    }
  } else if (parts.length === 2) {
    return {
      title: parts[0].trim(),
      company: parts[1].trim(),
    }
  }
  return { title: fullTitle.trim(), company: 'Unknown' }
}

// Extract person + company from Google News appointment headlines
function parseAppointmentHeadline(headline: string): { personName?: string; company?: string; title?: string } | null {
  const result: { personName?: string; company?: string; title?: string } = {}

  // Strip source suffix like " - ExecutiveGov" or " | CDO Magazine"
  const cleanHeadline = headline.replace(/\s*[-–|]\s*[A-Z][\w\s&.]+$/, '').trim()

  // Try to extract a relevant job title
  // Match explicit titles first; "CDO" alone requires additional disambiguation
  const explicitTitlePattern = /(?:Chief\s+(?:Data|AI|Analytics|Information|Data\s+(?:and|&)\s+Analytics)\s+Officer|CAIO|CDAIO|VP\s+(?:of\s+)?(?:Data|Analytics|AI)|Head\s+of\s+(?:Data|AI|Analytics))/i
  const cdoOnlyPattern = /\bCDO\b/i
  // Combined pattern for cleanup (stripping title from company name)
  const titlePattern = /(?:Chief\s+(?:Data|AI|Analytics|Information|Data\s+(?:and|&)\s+Analytics)\s+Officer|CDO|CAIO|CDAIO|VP\s+(?:of\s+)?(?:Data|Analytics|AI)|Head\s+of\s+(?:Data|AI|Analytics))/i

  let titleMatch = cleanHeadline.match(explicitTitlePattern)
  if (!titleMatch) {
    // If only "CDO" abbreviation found, validate it's data-related using headline context
    titleMatch = cleanHeadline.match(cdoOnlyPattern)
    if (!titleMatch || !isCdoDataRelated(cleanHeadline, cleanHeadline)) {
      return null
    }
  }
  result.title = titleMatch[0]

  // Pattern: "Person Named/Appointed/Joins as Title at/of Company"
  const namedAtMatch = cleanHeadline.match(
    /(.+?)\s+(?:named|appointed|joins|tapped|elevated|promoted)\s+.*?(?:at|of|for)\s+(.+)/i
  )
  if (namedAtMatch) {
    result.personName = namedAtMatch[1].trim()
    result.company = namedAtMatch[2].replace(titlePattern, '').replace(/\s+as\s+.*$/i, '').trim()
  }

  // Pattern: "Company Names/Appoints/Hires Person as Title"
  if (!result.company) {
    const companyNamesMatch = cleanHeadline.match(
      /^(.+?)\s+(?:names?|appoints?|hires?|taps?|promotes?|elevates?)\s+(.+?)(?:\s+as\s+|\s+to\s+|\s+its?\s+|\s+new\s+)/i
    )
    if (companyNamesMatch) {
      result.company = companyNamesMatch[1].trim()
      result.personName = companyNamesMatch[2].trim()
    }
  }

  // Pattern: "Person Named Company Title" (e.g., "Budhu Bhaduri Named ORNL Chief Data Officer")
  if (!result.company) {
    const namedTitleMatch = cleanHeadline.match(
      /(.+?)\s+(?:named|appointed)\s+(.+?)(?:Chief|CDO|CAIO|VP|Head)/i
    )
    if (namedTitleMatch) {
      result.personName = namedTitleMatch[1].trim()
      result.company = namedTitleMatch[2].trim()
    }
  }

  // Pattern: title appears with "at Company" after it
  if (!result.company) {
    const atCompanyMatch = cleanHeadline.match(
      /(?:Chief|CDO|CAIO|VP|Head).+?(?:at|of)\s+(.+?)$/i
    )
    if (atCompanyMatch) {
      result.company = atCompanyMatch[1].trim()
    }
  }

  // Clean up company name
  if (result.company) {
    // Remove common noise words at start/end
    result.company = result.company
      .replace(/^(?:the|new)\s+/i, '')
      .replace(/\s*['']s?\s*$/, '')
      .replace(/\s+$/, '')
      .trim()

    // If company is still the full headline or too long, it's probably wrong
    if (result.company.length > 60 || result.company === cleanHeadline) {
      result.company = undefined
    }
  }

  return result.title ? result : null
}

// Check if a title is relevant to our target roles
function isRelevantTitle(title: string, context: string = ''): boolean {
  const t = title.toLowerCase()

  // Direct matches on full title phrases — always relevant
  if (SEARCH_QUERIES.some(q => t.includes(q.toLowerCase()))) return true
  if (t.includes('caio') || t.includes('cdaio')) return true
  if (t.includes('data officer') || t.includes('ai officer') || t.includes('analytics officer')) return true

  // "CDO" requires disambiguation — only accept if data-related
  if (t.includes('cdo')) {
    return isCdoDataRelated(title, context)
  }

  return false
}

// ─── Source 1: Indeed RSS (free) ──────────────────────────────────────────────
async function ingestFromIndeedRSS(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = []

  for (const url of INDEED_RSS_URLS) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' },
      })
      if (!response.ok) continue

      const xml = await response.text()
      const items = parseRSS(xml)

      for (const item of items) {
        if (!isRelevantTitle(item.title, item.description)) continue

        const parsed = parseIndeedTitle(item.title)
        results.push({
          title: parsed.title,
          company: parsed.company,
          location: parsed.location,
          url: item.link,
          date: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          source: 'Indeed',
        })
      }
    } catch (err) {
      console.error(`Indeed RSS failed for ${url}:`, err)
    }
  }

  return results
}

// ─── Source 2: Google News RSS (appointment announcements) ────────────────────
async function ingestFromAppointmentRSS(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = []

  for (const url of APPOINTMENT_RSS_URLS) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' },
      })
      if (!response.ok) continue

      const xml = await response.text()
      const items = parseRSS(xml)

      for (const item of items) {
        const parsed = parseAppointmentHeadline(item.title)
        if (!parsed) continue

        // Derive company from parser or fallback to splitting on common verbs
        let company = parsed.company
        if (!company) {
          // Fallback: try splitting headline on action verbs
          const parts = item.title.split(/\s+(?:names?|appoints?|hires?|taps?|promotes?)\s+/i)
          if (parts.length >= 2 && parts[0].length < 50) {
            company = parts[0].replace(/\s*[-–|]\s*[A-Z][\w\s&.]+$/, '').trim()
          }
        }

        // Skip if we still can't determine a company
        if (!company || company.length > 60) continue

        results.push({
          title: parsed.title || item.title,
          company,
          url: item.link,
          date: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          source: 'News',
          // Store person name in location field temporarily (we don't have a dedicated column)
        })
      }
    } catch (err) {
      console.error(`Appointment RSS failed for ${url}:`, err)
    }
  }

  return results
}

// ─── Source 3: Firecrawl search API (uses credits, structured results) ────────
async function ingestFromFirecrawlSearch(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = []

  // Only search a subset to conserve credits
  const searchQueries = [
    'Chief Data Officer job opening 2026',
    'Chief AI Officer job posting',
    'VP Data Analytics hiring',
  ]

  for (const query of searchQueries) {
    try {
      const searchResult = await firecrawl.search(query, {
        limit: 5,
      })

      // v4 SDK returns SearchData with .web array (union of SearchResultWeb | Document)
      const webResults = searchResult.web || []
      for (const rawResult of webResults) {
        // Handle union type: SearchResultWeb has .title/.url directly,
        // Document has .metadata.title/.metadata.url
        const title = 'title' in rawResult
          ? (rawResult as { title?: string }).title
          : (rawResult as { metadata?: { title?: string } }).metadata?.title
        const url = 'url' in rawResult && typeof (rawResult as { url?: string }).url === 'string'
          ? (rawResult as { url: string }).url
          : (rawResult as { metadata?: { url?: string } }).metadata?.url
        const description = 'description' in rawResult
          ? (rawResult as { description?: string }).description
          : (rawResult as { metadata?: { description?: string } }).metadata?.description

        if (!title || !isRelevantTitle(title, description || '')) continue

        // Try to extract company from the title or description
        let company = 'Unknown'
        const desc = description || ''
        // Common pattern: "Role at Company" or "Company - Role"
        const atMatch = title.match(/(?:at|@)\s+(.+?)(?:\s*[-–|]|$)/i)
        const dashMatch = title.match(/^(.+?)\s*[-–|]\s*/i)

        if (atMatch) {
          company = atMatch[1].trim()
        } else if (dashMatch && !isRelevantTitle(dashMatch[1])) {
          company = dashMatch[1].trim()
        } else if (desc) {
          // Try extracting from description
          const descAtMatch = desc.match(/(?:at|@)\s+(.+?)(?:\s*[-–.|,]|$)/i)
          if (descAtMatch) company = descAtMatch[1].trim()
        }

        results.push({
          title: title.replace(/\s*[-–|].*$/, '').trim(),
          company,
          url: url || undefined,
          source: 'Firecrawl',
        })
      }
    } catch (err) {
      console.error(`Firecrawl search failed for "${query}":`, err)
    }
  }

  return results
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sourceResults: Record<string, number> = {}

  // Run all sources in parallel
  const [indeedJobs, appointmentJobs, firecrawlJobs] = await Promise.all([
    ingestFromIndeedRSS(),
    ingestFromAppointmentRSS(),
    ingestFromFirecrawlSearch(),
  ])

  sourceResults.indeed = indeedJobs.length
  sourceResults.appointments = appointmentJobs.length
  sourceResults.firecrawl = firecrawlJobs.length

  const allJobs = [...indeedJobs, ...appointmentJobs, ...firecrawlJobs]

  // Deduplicate by (title + company) before inserting
  const seen = new Set<string>()
  const uniqueJobs: ScrapedJob[] = []
  for (const job of allJobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueJobs.push(job)
    }
  }

  // Insert into Supabase
  let inserted = 0
  let skipped = 0

  for (const job of uniqueJobs) {
    // Skip invalid entries
    if (!job.title || job.company === 'Unknown' || job.company === 'See Article') {
      skipped++
      continue
    }

    // Check if this job already exists (by title + company)
    const { data: existing } = await supabaseAdmin
      .from('hiring_signals')
      .select('id')
      .ilike('job_title', job.title.trim())
      .ilike('company_name', job.company.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      skipped++
      continue
    }

    const { error } = await supabaseAdmin.from('hiring_signals').insert({
      job_title: job.title.trim(),
      company_name: job.company.trim(),
      location: job.location || null,
      source_url: job.url || null,
      seniority: classifySeniority(job.title),
      industry: classifyIndustry(`${job.company} ${job.title}`),
      posted_at: job.date || new Date().toISOString(),
      source_name: job.source,
    })

    if (!error) {
      inserted++
    } else {
      console.error(`Insert failed for ${job.title} at ${job.company}:`, error.message)
    }
  }

  return NextResponse.json({
    sources: sourceResults,
    total_scraped: allJobs.length,
    unique: uniqueJobs.length,
    inserted,
    skipped,
    timestamp: new Date().toISOString(),
  })
}
