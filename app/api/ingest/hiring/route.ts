import { NextResponse } from 'next/server'
import { firecrawl } from '@/lib/firecrawl'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cron-triggered: scrape job boards for CDO/CAIO/VP Data roles
// Vercel Cron calls this every 6 hours

const SEARCH_QUERIES = [
  'Chief Data Officer',
  'Chief AI Officer',
  'Chief Analytics Officer',
  'VP Data',
  'VP Analytics',
  'Head of Data',
  'Head of AI',
]

const JOB_BOARD_URLS = [
  'https://www.linkedin.com/jobs/search/?keywords=Chief+Data+Officer&f_TPR=r604800&f_E=5',
  'https://www.linkedin.com/jobs/search/?keywords=Chief+AI+Officer&f_TPR=r604800&f_E=5',
  'https://www.indeed.com/jobs?q=Chief+Data+Officer&fromage=7&explvl=executive',
  'https://www.indeed.com/jobs?q=Chief+AI+Officer&fromage=7&explvl=executive',
]

interface ScrapedJob {
  title: string
  company: string
  location?: string
  url?: string
  date?: string
}

function classifySeniority(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('chief') || t.includes('cdo') || t.includes('caio') || t.includes('cao'))
    return 'C-Suite'
  if (t.includes('svp') || t.includes('senior vice president')) return 'SVP'
  if (t.includes('vp') || t.includes('vice president')) return 'VP'
  if (t.includes('head of') || t.includes('director')) return 'Director+'
  return 'Senior'
}

function classifyIndustry(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('bank') || t.includes('financial') || t.includes('capital')) return 'Financial Services'
  if (t.includes('health') || t.includes('pharma') || t.includes('medical')) return 'Healthcare'
  if (t.includes('tech') || t.includes('software') || t.includes('saas')) return 'Technology'
  if (t.includes('retail') || t.includes('commerce') || t.includes('consumer')) return 'Retail'
  if (t.includes('manufactur') || t.includes('industrial')) return 'Manufacturing'
  if (t.includes('energy') || t.includes('oil') || t.includes('utility')) return 'Energy'
  if (t.includes('insur')) return 'Insurance'
  if (t.includes('telecom') || t.includes('media')) return 'Media & Telecom'
  if (t.includes('government') || t.includes('federal') || t.includes('public sector')) return 'Government'
  return null
}

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: ScrapedJob[] = []

  for (const url of JOB_BOARD_URLS) {
    try {
      const scrapeResult = await firecrawl.scrape(url, {
        formats: ['markdown'],
      })

      if (scrapeResult.markdown) {
        // Parse the markdown for job listings
        const lines = scrapeResult.markdown.split('\n')
        let currentJob: Partial<ScrapedJob> = {}

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          // Look for job title patterns (bold or heading text with relevant keywords)
          const isRelevantTitle = SEARCH_QUERIES.some((q) =>
            trimmed.toLowerCase().includes(q.toLowerCase()),
          )

          if (isRelevantTitle && (trimmed.startsWith('#') || trimmed.startsWith('**'))) {
            // Save previous job if exists
            if (currentJob.title && currentJob.company) {
              results.push(currentJob as ScrapedJob)
            }
            currentJob = {
              title: trimmed.replace(/^[#*\s]+/, '').replace(/[*]+$/, ''),
            }
          }

          // Company name patterns
          if (currentJob.title && !currentJob.company) {
            // Usually the line right after the title on job boards
            if (trimmed.length > 2 && trimmed.length < 100 && !trimmed.startsWith('[')) {
              currentJob.company = trimmed.replace(/^[·•\-\s]+/, '')
            }
          }

          // Location patterns
          if (
            currentJob.title &&
            !currentJob.location &&
            (trimmed.includes(',') || trimmed.toLowerCase().includes('remote'))
          ) {
            if (trimmed.length < 80) {
              currentJob.location = trimmed.replace(/^[·•\-\s]+/, '')
            }
          }
        }

        // Don't forget last job
        if (currentJob.title && currentJob.company) {
          results.push(currentJob as ScrapedJob)
        }
      }
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err)
    }
  }

  // Insert into Supabase, skipping duplicates
  let inserted = 0
  for (const job of results) {
    const { error } = await supabaseAdmin.from('hiring_signals').upsert(
      {
        job_title: job.title,
        company_name: job.company,
        location: job.location || null,
        source_url: job.url || null,
        seniority: classifySeniority(job.title),
        industry: classifyIndustry(`${job.company} ${job.title}`),
        posted_at: job.date || new Date().toISOString(),
        source_name: job.url?.includes('linkedin') ? 'LinkedIn' : 'Indeed',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    if (!error) inserted++
  }

  return NextResponse.json({
    scraped: results.length,
    inserted,
    timestamp: new Date().toISOString(),
  })
}
