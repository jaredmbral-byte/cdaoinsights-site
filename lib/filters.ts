// ── Negative keyword filtering ──────────────────────────────────────────────
// Shared across all ingest routes to filter false positives from RSS feeds.

// Articles containing these terms are almost certainly NOT about data/AI executives
export const NEGATIVE_KEYWORDS = [
  // MMA/UFC — "CAIO" is a common Brazilian/Portuguese first name in combat sports
  'mma', 'ufc', 'fighter', 'knockout', 'bout', 'octagon', 'bellator',
  'martial arts', 'wrestling', 'boxing', 'flyweight', 'middleweight',
  'heavyweight', 'bantamweight', 'featherweight', 'welterweight',
  'submission', 'tapout', 'title fight', 'cage', 'combat sport',

  // Soccer/Football — "Caio" and "Rodrigo Caio" are common player names
  'soccer', 'footballer', 'defender', 'midfielder', 'striker',
  'goalkeeper', 'flamengo', 'serie a', 'la liga', 'premier league',
  'champions league', 'transfer window', 'technical committee',
  'matchday', 'kickoff', 'penalty', 'red card', 'yellow card',

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
  'espn.com/mma', 'espn.com/soccer', 'espn.com/football',
  'goal.com', 'transfermarkt.com', 'soccerway.com',
  'footballtransfers.com', 'fotmob.com',
]

// ── Commercial roles that sell data/AI, rather than own it ──────────────────
// These match the same title patterns as data leadership. "Head of AI Sales"
// and "Head of AI Inference GTM" both contain "head of ai". The job is
// quota-carrying, so the person is a peer of the vendors, not the buyer.
export const COMMERCIAL_ROLE_MARKERS = [
  'sales', 'account executive', 'account manager', 'business development',
  'revenue', 'go-to-market', 'go to market', ' gtm', 'gtm ',
  'partnerships', 'partner manager', 'customer success',
  'solutions engineer', 'sales engineer', 'presales', 'pre-sales',
  'solutions architect', 'field cto', 'evangelist', 'territory',
  'demand generation', 'product marketing', 'growth marketing',
]

// ── Staffing and recruiting firms ───────────────────────────────────────────
// They post on behalf of an unnamed client, so the company column is
// meaningless and the same role often appears under several agencies.
export const STAFFING_AGENCY_MARKERS = [
  'staffing', 'recruiting', 'recruitment', 'recruiters', 'talent solutions',
  'talent acquisition', 'search partners', 'executive search',
  'insight global', 'robert half', 'randstad', 'adecco', 'kforce',
  'teksystems', 'apex systems', 'motion recruitment', 'jobot',
  'cybercoders', 'firstpro', 'truehire', 'harnham', 'burtch works',
  'signify technology', 'aerotek', 'collabera', 'diversant',
  'experis', 'modis', 'beacon hill', 'creative circle',
]

/** True when the title is a commercial role rather than a data leadership one. */
export function isCommercialRole(title: string): boolean {
  const t = ` ${title.toLowerCase()} `
  return COMMERCIAL_ROLE_MARKERS.some((m) => t.includes(m))
}

/** True when the employer is a staffing agency posting for an unnamed client. */
export function isStaffingAgency(company: string): boolean {
  const c = company.toLowerCase()
  return STAFFING_AGENCY_MARKERS.some((m) => c.includes(m))
}

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
