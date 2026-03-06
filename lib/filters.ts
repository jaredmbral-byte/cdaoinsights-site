// ── Negative keyword filtering ──────────────────────────────────────────────
// Shared across all ingest routes to filter false positives from RSS feeds.

// Articles containing these terms are almost certainly NOT about data/AI executives
export const NEGATIVE_KEYWORDS = [
  // MMA/UFC — "CAIO" is a common Brazilian first name in combat sports
  'mma', 'ufc', 'fighter', 'knockout', 'bout', 'octagon', 'bellator',
  'martial arts', 'wrestling', 'boxing', 'flyweight', 'middleweight',
  'heavyweight', 'bantamweight', 'featherweight', 'welterweight',
  'submission', 'tapout', 'title fight', 'cage', 'combat sport',

  // Collateralized Debt Obligations (financial CDO ≠ Chief Data Officer)
  'collateralized debt', 'cdo tranche', 'structured credit',
  'mortgage-backed', 'securitization', 'credit default swap',

  // Other "CDO" expansions that aren't Chief Data Officer
  'chief diversity officer diversity inclusion',
  'chief development officer fundraising nonprofit',

  // Noise
  'obituary', 'death notice', 'in memoriam',
  'fantasy football', 'fantasy sports', 'nfl draft',
]

// Skip articles from these domains entirely
export const NEGATIVE_DOMAINS = [
  'mmafighting.com', 'mmajunkie.com', 'sherdog.com',
  'tapology.com', 'ufc.com', 'bloodyelbow.com',
  'bjpenn.com', 'combatpress.com', 'lowkickmma.com',
  'espn.com/mma',
]

export function containsNegativeKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw))
}

export function isNegativeDomain(url: string): boolean {
  const lower = url.toLowerCase()
  return NEGATIVE_DOMAINS.some((d) => lower.includes(d))
}

/**
 * Master filter — returns true if the article should be KEPT (passes filtering).
 * Returns false if the article is a false positive and should be skipped.
 */
export function passesNegativeFilter(
  title: string,
  description: string,
  url: string,
): boolean {
  if (isNegativeDomain(url)) return false
  if (containsNegativeKeyword(title)) return false
  if (containsNegativeKeyword(description)) return false
  return true
}
