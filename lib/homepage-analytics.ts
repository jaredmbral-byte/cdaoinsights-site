// Homepage analytics — derives trend series, distributions, and week-over-week
// deltas from raw Supabase rows. All computation is server-side; the homepage
// renders the output through static SVG/CSS chart components (no client JS).

import type { SupabaseClient } from '@supabase/supabase-js'

export interface WeekPoint {
  label: string // short axis label e.g. "Apr 14"
  value: number
  iso: string // ISO date of the Monday that starts the week
}

export interface BarDatum {
  label: string
  value: number
  href?: string
}

export interface TopicMomentum {
  topic: string
  thisWeek: number
  prevWeek: number
  deltaPct: number | null // null when prevWeek is 0
}

export interface Delta {
  dir: 'up' | 'down' | 'flat'
  text: string
}

export interface HeadlineStat {
  label: string
  value: string
  sub?: string
  delta?: Delta
  href?: string
}

export interface HomepageAnalytics {
  headlineStats: HeadlineStat[]
  appointmentVelocity: WeekPoint[]
  personaMix: BarDatum[]
  skillsInDemand: BarDatum[]
  hiringByIndustry: BarDatum[]
  topicMomentum: TopicMomentum[]
  windowWeeks: number
}

// ── Date helpers (no external dep) ──────────────────────────────────────────

const DAY_MS = 86_400_000

function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7 // Mon = 0 … Sun = 6
  x.setUTCDate(x.getUTCDate() - dow)
  return x
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// Returns the Monday ISO keys for the last `n` weeks, oldest → newest (inclusive of current week).
function lastNWeekKeys(n: number, now: Date): { iso: string; label: string; start: number; end: number }[] {
  const thisMonday = mondayOf(now)
  const weeks: { iso: string; label: string; start: number; end: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * DAY_MS)
    const end = new Date(start.getTime() + 7 * DAY_MS)
    weeks.push({
      iso: start.toISOString().slice(0, 10),
      label: shortLabel(start),
      start: start.getTime(),
      end: end.getTime(),
    })
  }
  return weeks
}

// ── Persona classifier (derived from move title, since there's no column) ────

export function classifyPersona(title: string | null | undefined): string {
  const t = (title || '').toLowerCase()
  if (/chief a\.?i\.? officer|chief artificial intelligence|\bcaio\b/.test(t)) return 'CAIO'
  if (/chief data (and|&|,) (analytics|ai)|chief data analytics|\bcdao\b|\bcdaio\b/.test(t)) return 'CDAO'
  if (/chief data officer|chief data\b|\bcdo\b/.test(t)) return 'CDO'
  if (/chief analytics|chief data scien/.test(t)) return 'Analytics'
  if (/chief digital/.test(t)) return 'Digital'
  if (/\bvp\b|vice president|head of|director/.test(t)) return 'VP / Head'
  return 'Other'
}

// Skills we treat as real platform/vendor signal, not generic languages.
// Generic skills (SQL, Python) are common to every posting and add no signal.
const GENERIC_SKILLS = new Set([
  'sql', 'python', 'excel', 'r', 'java', 'scala', 'bash', 'git', 'linux',
])

function deltaFor(thisV: number, prevV: number): Delta {
  if (prevV === 0 && thisV === 0) return { dir: 'flat', text: 'no change' }
  if (prevV === 0) return { dir: 'up', text: 'new' }
  const pct = Math.round(((thisV - prevV) / prevV) * 100)
  if (pct > 0) return { dir: 'up', text: `+${pct}% wk/wk` }
  if (pct < 0) return { dir: 'down', text: `${pct}% wk/wk` }
  return { dir: 'flat', text: 'flat wk/wk' }
}

// ── Main aggregator ─────────────────────────────────────────────────────────

export async function getHomepageAnalytics(
  sb: SupabaseClient,
  now: Date = new Date(),
): Promise<HomepageAnalytics> {
  const WINDOW = 12
  const weeks = lastNWeekKeys(WINDOW, now)
  const windowStart = new Date(weeks[0].start).toISOString()
  const cutoff90 = new Date(now.getTime() - 90 * DAY_MS).toISOString()

  const [movesRes, hiringRes, topicsRes] = await Promise.all([
    sb
      .from('executive_moves')
      .select('title, headline, published_at')
      .gte('published_at', windowStart)
      .order('published_at', { ascending: false })
      .limit(2000),
    sb
      .from('hiring_signals')
      .select('seniority, industry, tech_stack, posted_at')
      .eq('is_featured', true)
      .gte('posted_at', cutoff90)
      .limit(5000),
    sb
      .from('market_articles')
      .select('topics, published_at')
      .gte('published_at', windowStart)
      .gte('relevance', 0.4)
      .limit(5000),
  ])

  const moves = (movesRes.data || []) as { title: string | null; headline: string | null; published_at: string }[]
  const hiring = (hiringRes.data || []) as {
    seniority: string | null
    industry: string | null
    tech_stack: string[] | null
    posted_at: string
  }[]
  const articles = (topicsRes.data || []) as { topics: string[] | null; published_at: string }[]

  // ── Appointment velocity (weekly counts of appointments) ──────────────────
  const velocity: WeekPoint[] = weeks.map((w) => ({ label: w.label, iso: w.iso, value: 0 }))
  for (const m of moves) {
    const t = new Date(m.published_at).getTime()
    const idx = weeks.findIndex((w) => t >= w.start && t < w.end)
    if (idx >= 0) velocity[idx].value++
  }

  // ── Persona mix (last 90d of moves, derived from title) ───────────────────
  const personaCounts = new Map<string, number>()
  for (const m of moves) {
    const p = classifyPersona(m.title || m.headline)
    if (p === 'Other') continue
    personaCounts.set(p, (personaCounts.get(p) || 0) + 1)
  }
  const personaMix: BarDatum[] = [...personaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, href: '/moves' }))

  // ── Skills in demand (platform/vendor skills from featured hiring) ────────
  const skillCounts = new Map<string, number>()
  for (const h of hiring) {
    for (const raw of h.tech_stack || []) {
      const key = (raw || '').trim()
      if (!key) continue
      if (GENERIC_SKILLS.has(key.toLowerCase())) continue
      skillCounts.set(key, (skillCounts.get(key) || 0) + 1)
    }
  }
  const skillsInDemand: BarDatum[] = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, href: '/hiring' }))

  // ── Hiring by industry (featured, last 90d) ───────────────────────────────
  const industryCounts = new Map<string, number>()
  for (const h of hiring) {
    const key = (h.industry || '').trim()
    if (!key || key.toLowerCase() === 'unknown') continue
    industryCounts.set(key, (industryCounts.get(key) || 0) + 1)
  }
  const hiringByIndustry: BarDatum[] = [...industryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, href: '/hiring' }))

  // ── Topic momentum (this week vs previous week) ───────────────────────────
  const thisWeek = weeks[weeks.length - 1]
  const prevWeek = weeks[weeks.length - 2]
  const tw = new Map<string, number>()
  const pw = new Map<string, number>()
  for (const a of articles) {
    const t = new Date(a.published_at).getTime()
    const bucket = thisWeek && t >= thisWeek.start && t < thisWeek.end ? tw
      : prevWeek && t >= prevWeek.start && t < prevWeek.end ? pw
      : null
    if (!bucket) continue
    for (const topic of a.topics || []) {
      if (topic === 'general') continue
      bucket.set(topic, (bucket.get(topic) || 0) + 1)
    }
  }
  const topicMomentum: TopicMomentum[] = [...tw.entries()]
    .map(([topic, thisWeekV]) => {
      const prevWeekV = pw.get(topic) || 0
      const deltaPct = prevWeekV === 0 ? null : Math.round(((thisWeekV - prevWeekV) / prevWeekV) * 100)
      return { topic, thisWeek: thisWeekV, prevWeek: prevWeekV, deltaPct }
    })
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .slice(0, 6)

  // ── Headline stats (week in numbers, with WoW deltas) ─────────────────────
  const movesThisWeek = velocity[velocity.length - 1]?.value ?? 0
  const movesPrevWeek = velocity[velocity.length - 2]?.value ?? 0

  const hiringThisWeek = hiring.filter((h) => {
    const t = new Date(h.posted_at).getTime()
    return thisWeek && t >= thisWeek.start && t < thisWeek.end
  }).length
  const hiringPrevWeek = hiring.filter((h) => {
    const t = new Date(h.posted_at).getTime()
    return prevWeek && t >= prevWeek.start && t < prevWeek.end
  }).length

  const topTopic = topicMomentum[0]
  const topIndustry = hiringByIndustry[0]

  const headlineStats: HeadlineStat[] = [
    {
      label: 'Appointments',
      value: String(movesThisWeek),
      sub: 'this week',
      delta: deltaFor(movesThisWeek, movesPrevWeek),
      href: '/moves',
    },
    {
      label: 'Senior roles open',
      value: String(hiringThisWeek),
      sub: 'posted this week',
      delta: deltaFor(hiringThisWeek, hiringPrevWeek),
      href: '/hiring',
    },
    {
      label: 'Hottest topic',
      value: topTopic ? topTopic.topic.replace(/-/g, ' ') : '—',
      sub: topTopic ? `${topTopic.thisWeek} mentions` : 'this week',
      delta: topTopic && topTopic.deltaPct !== null
        ? deltaFor(topTopic.thisWeek, topTopic.prevWeek)
        : undefined,
      href: '/intelligence',
    },
    {
      label: 'Top hiring sector',
      value: topIndustry ? topIndustry.label : '—',
      sub: topIndustry ? `${topIndustry.value} roles · 90d` : '',
      href: '/hiring',
    },
  ]

  return {
    headlineStats,
    appointmentVelocity: velocity,
    personaMix,
    skillsInDemand,
    hiringByIndustry,
    topicMomentum,
    windowWeeks: WINDOW,
  }
}
