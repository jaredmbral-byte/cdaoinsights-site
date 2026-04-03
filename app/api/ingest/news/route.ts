import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { passesNegativeFilter } from '@/lib/filters'
import Anthropic from '@anthropic-ai/sdk'

// Cron-triggered: pull news from RSS feeds (free, no Firecrawl credits)
// Vercel Cron calls this every 15 minutes

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractToolsFromArticle(title: string, summary: string): Promise<string[]> {
  try {
    const text = `${title} ${summary}`.slice(0, 800)
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Extract specific enterprise AI software tool or product names from this text. Return ONLY a JSON array of product names (e.g. ["Snowflake Cortex", "WisdomAI"]). Return [] if none found. Only include actual named products, not generic terms like "AI" or "machine learning".\n\nText: ${text}`
      }]
    })
    const content = response.content[0]
    if (content.type !== 'text') return []
    const match = content.text.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const tools = JSON.parse(match[0]) as string[]
    return tools
      .filter((t): t is string => typeof t === 'string' && t.length > 1 && t.length < 50)
      .map(t => `tool:${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
      .slice(0, 5)
  } catch {
    return []
  }
}

const RSS_FEEDS = [
  // Google News — targeted enterprise data/AI queries
  { url: 'https://news.google.com/rss/search?q=Chief+Data+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Chief+AI+Officer+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+data+governance+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=enterprise+AI+adoption+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=CDO+%22data+strategy%22+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22chief+data+officer%22+2026+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Google News — layoffs & workforce signals (high value for CDOs tracking market)
  { url: 'https://news.google.com/rss/search?q=data+team+layoffs+enterprise+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=AI+team+layoffs+tech+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=analytics+team+cuts+workforce+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22data+engineering%22+layoffs+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Google News — vendor funding rounds (surfaced via news, no paid API needed)
  { url: 'https://news.google.com/rss/search?q=data+AI+startup+raises+funding+million+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Snowflake+OR+Databricks+OR+Alation+OR+Collibra+funding+acquisition+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

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

  // Agentic AI — dedicated feeds (Gartner's #1 theme for 2026)
  { url: 'https://news.google.com/rss/search?q=%22agentic+AI%22+enterprise+data+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22AI+agents%22+enterprise+production+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22multi-agent%22+OR+%22multiagent%22+enterprise+AI+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22AI+agent%22+governance+data+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Pilot-to-production — CDO pain point #1
  { url: 'https://news.google.com/rss/search?q=%22AI+pilot%22+production+enterprise+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=%22scaling+AI%22+enterprise+data+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Microsoft Fabric — eating BI, high CDO relevance
  { url: 'https://news.google.com/rss/search?q=%22Microsoft+Fabric%22+enterprise+data+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Research & thought leadership
  { url: 'https://sloanreview.mit.edu/feed/', name: 'MIT Sloan Review' },
  { url: 'https://datamanagementreview.com/feed/', name: 'Data Management Review' },

  // AI tools vendors
  { url: 'https://www.wisdomai.com/blog/rss.xml', name: 'WisdomAI Blog' },
  { url: 'https://www.glean.com/blog/rss', name: 'Glean Blog' },
  { url: 'https://hex.tech/blog/rss.xml', name: 'Hex Blog' },
  { url: 'https://www.thoughtspot.com/blog/rss.xml', name: 'ThoughtSpot Blog' },
  { url: 'https://www.sigmacomputing.com/blog/rss', name: 'Sigma Blog' },
  { url: 'https://www.dataiku.com/blog/rss', name: 'Dataiku Blog' },
  { url: 'https://wandb.ai/site/rss', name: 'W&B Blog' },
  { url: 'https://news.google.com/rss/search?q="enterprise+AI"+deployment+case+study+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=WisdomAI+OR+Glean+OR+ThoughtSpot+enterprise+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q="Snowflake+Cortex"+OR+"Databricks+AI"+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q="Microsoft+Copilot"+enterprise+data+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=CDO+OR+CAIO+"AI+tool"+enterprise+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q="agentic+analytics"+OR+"conversational+BI"+enterprise+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Databricks+AI+release+OR+announcement+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=Snowflake+Cortex+OR+"Snowflake+AI"+release+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },

  // Funding & market signals — enterprise AI
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  { url: 'https://news.google.com/rss/search?q=enterprise+AI+startup+raises+million+Series+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q="data+AI"+startup+funding+raises+2026+when:14d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=CDO+CAIO+enterprise+AI+tool+launch+when:7d&hl=en-US&gl=US&ceid=US:en', name: 'Google News' },
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
  if (text.includes('agentic') || text.includes('ai agent') || text.includes('ai agents') || text.includes('multi-agent') || text.includes('multiagent') || text.includes('autonomous agent'))
    topics.push('agentic-ai')
  if (text.includes('layoff') || text.includes('laid off') || text.includes('workforce reduction') || text.includes('job cut') || text.includes('reductions in force') || text.includes('rif '))
    topics.push('layoffs')
  if (text.includes('pilot to production') || text.includes('pilot-to-production') || text.includes('poc to production') || text.includes('proof of concept') || text.includes('scaling ai') || text.includes('ai at scale') || text.includes('ai in production') || text.includes('ai deployment'))
    topics.push('ai-deployment')
  if (text.includes('microsoft fabric') || text.includes('ms fabric') || text.includes('power bi') || text.includes('powerbi'))
    topics.push('microsoft-fabric')
  if (
    text.includes('wisdomai') || text.includes('wisdom ai') ||
    text.includes('glean') ||
    (text.includes('hex') && text.includes('analytics')) ||
    text.includes('thoughtspot') ||
    text.includes('sigma computing') ||
    text.includes('snowflake cortex') ||
    text.includes('databricks ai') || text.includes('databricks lakehouse') ||
    text.includes('microsoft copilot') ||
    text.includes('github copilot') ||
    text.includes('dataiku') ||
    text.includes('weights & biases') || text.includes('wandb') ||
    text.includes('conversational bi') || text.includes('agentic analytics') ||
    text.includes('langchain') || text.includes('crewai') || text.includes('langgraph')
  )
    topics.push('enterprise-ai-tools')

  return topics.length > 0 ? topics : ['general']
}

// Relevance scoring — higher bar to reduce noise
function scoreRelevance(title: string, description: string): number {
  const t = `${title} ${description}`.toLowerCase()
  let score = 0.2 // baseline

  // ── HIGH-VALUE SIGNALS: executive titles ──────────────────────────────
  if (t.includes('chief data officer') || t.includes('chief data and analytics officer')) score += 0.35
  if (t.includes('chief ai officer') || t.includes('caio')) score += 0.35
  if (t.includes('data leader') || t.includes('data executive')) score += 0.25
  if (t.includes('cdao') || t.includes('cdaio')) score += 0.35
  if (t.includes('vp of data') || t.includes('vp, data') || t.includes('vp of analytics') || t.includes('vp of ai')) score += 0.25
  if (t.includes('head of data') || t.includes('head of ai') || t.includes('head of analytics')) score += 0.2
  if ((t.includes('appoint') || t.includes('named') || t.includes('joins')) && (t.includes('cdo') || t.includes('chief') || t.includes('vp of'))) score += 0.15

  // ── HIGH-VALUE SIGNALS: enterprise AI governance (CDO #1 priority) ────
  if (t.includes('data governance')) score += 0.2
  if (t.includes('ai governance')) score += 0.25
  if (t.includes('govern') && (t.includes('ai model') || t.includes('models'))) score += 0.2
  if (t.includes('data strategy')) score += 0.2
  if (t.includes('data quality')) score += 0.15
  if (t.includes('data catalog')) score += 0.2
  if (t.includes('data mesh') || t.includes('data fabric')) score += 0.2
  if (t.includes('mdm') || t.includes('master data')) score += 0.15
  if (t.includes('data lineage') || t.includes('data observability')) score += 0.2
  if (t.includes('compliance') && (t.includes('data') || t.includes('ai') || t.includes('gdpr') || t.includes('fda') || t.includes('sox'))) score += 0.15

  // ── HIGH-VALUE SIGNALS: agentic AI (Gartner #1 theme 2026) ───────────
  if (t.includes('agentic ai') || t.includes('ai agent') || t.includes('ai agents')) score += 0.25
  if (t.includes('multi-agent') || t.includes('multiagent') || t.includes('autonomous agent')) score += 0.2

  // ── HIGH-VALUE SIGNALS: pilot-to-production (CDO pain point #1) ──────
  if (t.includes('pilot to production') || t.includes('pilot-to-production')) score += 0.25
  if (t.includes('scaling ai') || t.includes('ai at scale') || t.includes('ai in production') || t.includes('ai deployment')) score += 0.2
  if (t.includes('proof of concept') || t.includes('poc to production')) score += 0.15
  if ((t.includes('models in prod') || t.includes('models in production')) && (t.includes('govern') || t.includes('manage'))) score += 0.25

  // ── HIGH-VALUE SIGNALS: enterprise context ───────────────────────────
  if (t.includes('enterprise') && (t.includes('data') || t.includes('ai') || t.includes('analytics'))) score += 0.15
  if (t.includes('enterprise') && (t.includes('deploy') || t.includes('case study') || t.includes('production'))) score += 0.2
  if (t.includes('fortune 500') || t.includes('fortune 1000')) score += 0.15
  if (t.includes('case study') && (t.includes('data team') || t.includes('ai') || t.includes('personalize'))) score += 0.2
  if (t.includes('data team') && t.includes('personalize') && /\d/.test(t)) score += 0.25 // e.g., "1.9B customer"
  if ((t.includes('financial services') || t.includes('healthcare') || t.includes('pharma') || t.includes('retail') || t.includes('insurance')) && (t.includes('data') || t.includes('ai'))) score += 0.1

  // ── HIGH-VALUE SIGNALS: tracked vendors ──────────────────────────────
  if (t.includes('snowflake cortex') || t.includes('snowflake ai')) score += 0.35
  if (t.includes('snowflake') && (t.includes('analyst') || t.includes('natural language'))) score += 0.15
  if (t.includes('databricks ai') || t.includes('databricks lakehouse') || t.includes('databricks ai/bi')) score += 0.3
  if (t.includes('collibra')) score += 0.25
  if (t.includes('alation')) score += 0.25
  if (t.includes('atlan')) score += 0.25
  if (t.includes('monte carlo data') || t.includes('monte carlo')) score += 0.2
  if (t.includes('fivetran')) score += 0.15
  if (t.includes('microsoft fabric') || t.includes('ms fabric')) score += 0.2
  if (t.includes('power bi') || t.includes('powerbi')) score += 0.1
  if (t.includes('wisdomai') || t.includes('wisdom ai')) score += 0.25
  if (t.includes('glean')) score += 0.2
  if (t.includes('thoughtspot')) score += 0.2
  if (t.includes('dataiku')) score += 0.15
  if (t.includes('weights & biases') || t.includes('wandb')) score += 0.1
  if (t.includes('dbt') && (t.includes('enterprise') || t.includes('semantic'))) score += 0.15
  if (t.includes('palantir')) score += 0.15
  if (t.includes('google cloud') || t.includes('bigquery')) score += 0.1
  if (t.includes('looker') || t.includes('tableau') || t.includes('qlik')) score += 0.1
  if (t.includes('informatica') || t.includes('talend') || t.includes('matillion')) score += 0.1

  // ── MEDIUM SIGNALS: broader data/AI ecosystem ─────────────────────────
  if (t.includes('generative ai') || t.includes('genai') || t.includes('llm')) score += 0.1
  if (t.includes('analyst') && (t.includes('gartner') || t.includes('forrester') || t.includes('idc'))) score += 0.15
  if ((t.includes('gartner') || t.includes('forrester')) && (t.includes('predict') || t.includes('forecast'))) score += 0.2
  if (t.includes('funding') || t.includes('raises') || t.includes('series') || t.includes('acquisition')) score += 0.15
  if ((t.includes('openai') || t.includes('anthropic') || t.includes('microsoft')) && t.includes('ai')) score += 0.05
  if (t.includes('layoff') || t.includes('laid off') || t.includes('workforce reduction')) score += 0.1
  if (t.includes('survey') && (t.includes('data') || t.includes('engineering') || t.includes('practitioner'))) score += 0.15
  if (t.includes('aws') && (t.includes('sagemaker') || t.includes('data') || t.includes('ml'))) score += 0.15
  if (t.includes('cloud') && (t.includes('data') || t.includes('analytics'))) score += 0.05

  // ── NEGATIVE SIGNALS: penalize false positives ────────────────────────
  // CDO as financial instrument
  if ((t.includes('cdo') || t.includes('collateralized debt')) && (t.includes('bond') || t.includes('tranche') || t.includes('credit') || t.includes('securities') || t.includes('financial group') || t.includes('earnings') || t.includes('yield') || t.includes('default rate'))) score -= 0.5

  // Sports/MMA false positives (CDO Magazine competitor had this problem)
  if (t.includes('ufc') || t.includes('mma') || t.includes('fight') || t.includes('boxing')) score -= 0.5

  // Consumer/lifestyle content
  if (t.includes('meal prep') || t.includes('recipe') || t.includes('workout') || t.includes('fitness tip')) score -= 0.5

  // Pure developer content with no exec angle
  if ((t.includes('python') || t.includes('javascript') || t.includes('rust') || t.includes('golang')) && !t.includes('enterprise') && !t.includes('data platform')) score -= 0.15

  // Salary guides for practitioners (not exec-level)
  if (t.includes('salary guide') || t.includes('salary data') || t.includes('compensation guide')) {
    if (!t.includes('cdo') && !t.includes('chief') && !t.includes('executive')) score -= 0.2
  }

  return Math.min(Math.max(score, 0), 1.0)
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

        if (!error) {
          totalInserted++
          // Extract AI tools from high-relevance articles (async, best-effort)
          if (relevance >= 0.6 && process.env.ANTHROPIC_API_KEY) {
            extractToolsFromArticle(item.title, item.description).then(async (toolTopics) => {
              if (toolTopics.length === 0) return
              // Fetch the article to get its id and existing topics
              const { data: existing } = await supabaseAdmin
                .from('market_articles')
                .select('id, topics')
                .eq('source_url', item.link)
                .single()
              if (!existing) return
              const existingTopics: string[] = existing.topics || []
              const hasToolTopics = existingTopics.some((t: string) => t.startsWith('tool:'))
              if (hasToolTopics) return // already extracted
              const merged = [...new Set([...existingTopics, ...toolTopics])]
              await supabaseAdmin
                .from('market_articles')
                .update({ topics: merged })
                .eq('id', existing.id)
            }).catch(() => {}) // silent fail — don't block ingest
          }
        }
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

// Vercel Cron sends GET requests
export async function GET(request: Request) {
  return POST(request)
}
