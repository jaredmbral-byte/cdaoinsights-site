import { NextResponse } from 'next/server'
import { firecrawl } from '@/lib/firecrawl'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { passesNegativeFilter } from '@/lib/filters'
import { classifyPersona } from '@/lib/taxonomy'
import { extractTechStack } from '@/lib/tech-stack'

// Multi-source hiring ingestion (job postings only):
// 1. Adzuna API (primary — free tier, 250 req/day, full descriptions)
// 2. USAJobs API (government CDO/CAIO roles — completely free)
// 3. Firecrawl search API (fallback — uses credits)
// NOTE: Executive appointment announcements are handled by /api/ingest/moves

interface ScrapedJob {
  title: string
  company: string
  location?: string
  url?: string
  date?: string
  description?: string
  source: string
}

// ─── Search queries for each API ─────────────────────────────────────────────
const ADZUNA_TITLE_QUERIES = [
  'Chief Data Officer',
  'Chief AI Officer',
  'Chief Analytics Officer',
  'Chief Data and AI Officer',
  'VP Data',
  'VP Analytics',
  'VP Artificial Intelligence',
  'Head of Data',
  'Head of AI',
  'Director Data Governance',
  'Director of Data',
  'Director of AI',
]

const USAJOBS_QUERIES = [
  'Chief Data Officer',
  'Chief AI Officer',
  'Data Officer',
  'Artificial Intelligence',
]

// ─── CDO Disambiguation ────────────────────────────────────────────────────────
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

const DATA_AI_CONTEXT_KEYWORDS = [
  'data', 'analytics', 'ai ', 'artificial intelligence', 'machine learning',
  'ml ', 'governance', 'data quality', 'data strategy', 'data platform',
  'data infrastructure', 'data engineering', 'data science', 'big data',
  'business intelligence', ' bi ', 'data lake', 'data warehouse',
  'data mesh', 'data fabric', 'mdm', 'master data',
]

function isCdoDataRelated(title: string, context: string = ''): boolean {
  const t = title.toLowerCase()
  const ctx = (title + ' ' + context).toLowerCase()

  if (t.includes('chief data officer') || t.includes('chief data and analytics officer')) {
    return true
  }
  if (FALSE_POSITIVE_CDO_TITLES.some(fp => t.includes(fp))) {
    return false
  }
  if (t.includes('cdo')) {
    return DATA_AI_CONTEXT_KEYWORDS.some(kw => ctx.includes(kw))
  }
  return true
}

function classifySeniority(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('chief') || t.includes('caio') || t.includes('cdaio'))
    return 'C-Suite'
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

// Check if a title is relevant to our target roles
function isRelevantTitle(title: string, context: string = ''): boolean {
  const t = title.toLowerCase()

  const TARGET_PHRASES = [
    'chief data officer', 'chief ai officer', 'chief analytics officer',
    'chief data and ai officer', 'chief data and analytics officer',
    'vp data', 'vp analytics', 'vp artificial intelligence',
    'vp of data', 'vp of analytics', 'vp of ai',
    'vice president data', 'vice president analytics', 'vice president ai',
    'head of data', 'head of ai', 'head of analytics',
    'head of artificial intelligence',
    'director data', 'director of data', 'director ai', 'director of ai',
    'director analytics', 'director of analytics',
    'director data governance', 'director data engineering',
    'director data science', 'director machine learning',
  ]

  if (TARGET_PHRASES.some(q => t.includes(q))) return true
  if (t.includes('caio') || t.includes('cdaio') || t.includes('cdao')) return true
  if (t.includes('data officer') || t.includes('ai officer') || t.includes('analytics officer')) return true

  if (t.includes('cdo')) {
    return isCdoDataRelated(title, context)
  }

  return false
}

// ─── Source 1: Adzuna API (primary) ────────────────────────────────────────────
// Free tier: 250 requests/day. title_only parameter prevents false positives.
// Set ADZUNA_APP_ID and ADZUNA_APP_KEY in env vars.
async function ingestFromAdzuna(): Promise<ScrapedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) {
    console.log('Adzuna: skipping — ADZUNA_APP_ID or ADZUNA_APP_KEY not set')
    return []
  }

  const results: ScrapedJob[] = []

  for (const query of ADZUNA_TITLE_QUERIES) {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        title_only: query,
        results_per_page: '50',
        max_days_old: '14',
        sort_by: 'date',
      })

      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`,
        { headers: { 'User-Agent': 'CDAO-Insights-Bot/1.0' } },
      )

      if (!response.ok) {
        console.error(`Adzuna failed for "${query}": HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      const jobResults = data.results || []

      for (const job of jobResults) {
        if (!job.title || !job.company?.display_name) continue
        if (!isRelevantTitle(job.title, job.description || '')) continue
        if (!passesNegativeFilter(job.title, job.description || '', job.redirect_url || '')) continue

        results.push({
          title: job.title,
          company: job.company.display_name,
          location: job.location?.display_name || null,
          url: job.redirect_url || null,
          date: job.created ? new Date(job.created).toISOString() : undefined,
          description: job.description || undefined,
          source: 'Adzuna',
        })
      }
    } catch (err) {
      console.error(`Adzuna search failed for "${query}":`, err)
    }
  }

  return results
}

// ─── Source 2: USAJobs API (government roles — completely free) ────────────────
// No rate limit, richest descriptions. GS-15+ and SES for executive roles.
// Set USAJOBS_API_KEY and USAJOBS_EMAIL in env vars.
async function ingestFromUSAJobs(): Promise<ScrapedJob[]> {
  const apiKey = process.env.USAJOBS_API_KEY
  const email = process.env.USAJOBS_EMAIL
  if (!apiKey || !email) {
    console.log('USAJobs: skipping — USAJOBS_API_KEY or USAJOBS_EMAIL not set')
    return []
  }

  const results: ScrapedJob[] = []

  for (const query of USAJOBS_QUERIES) {
    try {
      const params = new URLSearchParams({
        Keyword: query,
        PayGradeLow: '15',
        DatePosted: '14',
        ResultsPerPage: '25',
        Fields: 'full',
      })

      const response = await fetch(
        `https://data.usajobs.gov/api/Search?${params}`,
        {
          headers: {
            'Authorization-Key': apiKey,
            'User-Agent': email,
          },
        },
      )

      if (!response.ok) {
        console.error(`USAJobs failed for "${query}": HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      const items = data.SearchResult?.SearchResultItems || []

      for (const item of items) {
        const pos = item.MatchedObjectDescriptor
        if (!pos) continue

        const title = pos.PositionTitle
        const org = pos.OrganizationName || pos.DepartmentName
        const location = pos.PositionLocationDisplay
        const url = pos.PositionURI
        const date = pos.PublicationStartDate
        const description = pos.UserArea?.Details?.MajorDuties?.join(' ') ||
                           pos.QualificationSummary || ''

        if (!title || !org) continue
        if (!isRelevantTitle(title, description)) continue

        results.push({
          title,
          company: org,
          location: location || undefined,
          url: url || undefined,
          date: date ? new Date(date).toISOString() : undefined,
          description: description || undefined,
          source: 'USAJobs',
        })
      }
    } catch (err) {
      console.error(`USAJobs search failed for "${query}":`, err)
    }
  }

  return results
}

// ─── Source 3: Firecrawl search API (fallback — uses credits) ──────────────────
async function ingestFromFirecrawlSearch(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = []

  const searchQueries = [
    'Chief Data Officer job opening 2026',
    'Chief AI Officer job posting',
    'VP Data Analytics hiring',
  ]

  for (const query of searchQueries) {
    try {
      const searchResult = await firecrawl.search(query, { limit: 5 })
      const webResults = searchResult.web || []

      for (const rawResult of webResults) {
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

        let company = 'Unknown'
        const desc = description || ''
        const atMatch = title.match(/(?:at|@)\s+(.+?)(?:\s*[-–|]|$)/i)
        const dashMatch = title.match(/^(.+?)\s*[-–|]\s*/i)

        if (atMatch) {
          company = atMatch[1].trim()
        } else if (dashMatch && !isRelevantTitle(dashMatch[1])) {
          company = dashMatch[1].trim()
        } else if (desc) {
          const descAtMatch = desc.match(/(?:at|@)\s+(.+?)(?:\s*[-–.|,]|$)/i)
          if (descAtMatch) company = descAtMatch[1].trim()
        }

        results.push({
          title: title.replace(/\s*[-–|].*$/, '').trim(),
          company,
          url: url || undefined,
          description: desc || undefined,
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
  const [adzunaJobs, usajobsJobs, firecrawlJobs] = await Promise.all([
    ingestFromAdzuna(),
    ingestFromUSAJobs(),
    ingestFromFirecrawlSearch(),
  ])

  sourceResults.adzuna = adzunaJobs.length
  sourceResults.usajobs = usajobsJobs.length
  sourceResults.firecrawl = firecrawlJobs.length

  const allJobs = [...adzunaJobs, ...usajobsJobs, ...firecrawlJobs]

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

    // Extract tech stack from description if available
    const techStack = job.description ? extractTechStack(job.description) : []

    const { error } = await supabaseAdmin.from('hiring_signals').insert({
      job_title: job.title.trim(),
      company_name: job.company.trim(),
      location: job.location || null,
      source_url: job.url || null,
      seniority: classifySeniority(job.title),
      persona: classifyPersona(job.title),
      industry: classifyIndustry(`${job.company} ${job.title}`),
      posted_at: job.date || new Date().toISOString(),
      source_name: job.source,
      tech_stack: techStack.length > 0 ? techStack : undefined,
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

// Vercel Cron sends GET requests
export async function GET(request: Request) {
  return POST(request)
}
