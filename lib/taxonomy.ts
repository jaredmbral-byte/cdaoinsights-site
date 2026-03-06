// ── Role Taxonomy ───────────────────────────────────────────────────────────
// Maps job titles to standardized personas and seniority levels.
// Used by hiring ingest + dashboard aggregation.

export type Persona =
  | 'Chief Data Officer'
  | 'Chief AI Officer'
  | 'Chief Analytics Officer'
  | 'Chief Data & AI Officer'
  | 'VP Data'
  | 'VP AI/ML'
  | 'VP Analytics'
  | 'VP Data Governance'
  | 'Director Data'
  | 'Director AI/ML'
  | 'Director Analytics'
  | 'Director Data Governance'
  | 'Head of Data'
  | 'Head of AI'
  | 'Other Data/AI Leadership'

export type SeniorityLevel = 'C-Suite' | 'SVP' | 'VP' | 'Director+' | 'Senior'

interface TitleMapping {
  patterns: RegExp[]
  persona: Persona
  seniority: SeniorityLevel
}

// Order matters — more specific patterns first (e.g., "Chief Data and AI" before "Chief Data")
const TITLE_MAPPINGS: TitleMapping[] = [
  // C-Suite — combined roles first (more specific)
  {
    patterns: [
      /chief\s+data\s+(?:and|&)\s+(?:ai|analytics)\s+officer/i,
      /\bcdaio\b/i,
      /\bcdao\b/i,
    ],
    persona: 'Chief Data & AI Officer',
    seniority: 'C-Suite',
  },
  {
    patterns: [/chief\s+ai\s+officer/i, /\bcaio\b/i],
    persona: 'Chief AI Officer',
    seniority: 'C-Suite',
  },
  {
    patterns: [/chief\s+analytics\s+officer/i],
    persona: 'Chief Analytics Officer',
    seniority: 'C-Suite',
  },
  {
    patterns: [/chief\s+data\s+officer/i, /\bcdo\b/i],
    persona: 'Chief Data Officer',
    seniority: 'C-Suite',
  },

  // VP level
  {
    patterns: [
      /(?:svp|senior\s+vice\s+president|vp|vice\s+president)\s+(?:of\s+)?data\s+governance/i,
    ],
    persona: 'VP Data Governance',
    seniority: 'VP',
  },
  {
    patterns: [
      /(?:svp|senior\s+vice\s+president|vp|vice\s+president)\s+(?:of\s+)?(?:ai|artificial\s+intelligence|machine\s+learning)/i,
    ],
    persona: 'VP AI/ML',
    seniority: 'VP',
  },
  {
    patterns: [
      /(?:svp|senior\s+vice\s+president|vp|vice\s+president)\s+(?:of\s+)?analytics/i,
    ],
    persona: 'VP Analytics',
    seniority: 'VP',
  },
  {
    patterns: [
      /(?:svp|senior\s+vice\s+president|vp|vice\s+president)\s+(?:of\s+)?data/i,
    ],
    persona: 'VP Data',
    seniority: 'VP',
  },

  // Director level
  {
    patterns: [/(?:senior\s+)?director\s+(?:of\s+)?data\s+governance/i],
    persona: 'Director Data Governance',
    seniority: 'Director+',
  },
  {
    patterns: [
      /(?:senior\s+)?director\s+(?:of\s+)?(?:ai|artificial\s+intelligence|machine\s+learning)/i,
    ],
    persona: 'Director AI/ML',
    seniority: 'Director+',
  },
  {
    patterns: [/(?:senior\s+)?director\s+(?:of\s+)?analytics/i],
    persona: 'Director Analytics',
    seniority: 'Director+',
  },
  {
    patterns: [/(?:senior\s+)?director\s+(?:of\s+)?data/i],
    persona: 'Director Data',
    seniority: 'Director+',
  },

  // Head of
  {
    patterns: [/head\s+of\s+(?:ai|artificial\s+intelligence)/i],
    persona: 'Head of AI',
    seniority: 'Director+',
  },
  {
    patterns: [/head\s+of\s+data/i],
    persona: 'Head of Data',
    seniority: 'Director+',
  },
]

/**
 * Classify a job title into a standardized persona.
 */
export function classifyPersona(title: string): Persona {
  for (const mapping of TITLE_MAPPINGS) {
    if (mapping.patterns.some((p) => p.test(title))) {
      return mapping.persona
    }
  }
  return 'Other Data/AI Leadership'
}

/**
 * Classify seniority from a job title using the taxonomy.
 * Falls back to keyword heuristics if no pattern matches.
 */
export function classifySeniorityFromTaxonomy(title: string): SeniorityLevel {
  for (const mapping of TITLE_MAPPINGS) {
    if (mapping.patterns.some((p) => p.test(title))) {
      return mapping.seniority
    }
  }
  // Fallback heuristics
  const t = title.toLowerCase()
  if (t.includes('chief')) return 'C-Suite'
  if (t.includes('svp') || t.includes('senior vice president')) return 'SVP'
  if (t.includes('vp') || t.includes('vice president')) return 'VP'
  if (t.includes('head of') || t.includes('director')) return 'Director+'
  return 'Senior'
}

/**
 * All tracked personas grouped by seniority for dashboard display.
 */
export const PERSONA_GROUPS: Record<SeniorityLevel, Persona[]> = {
  'C-Suite': [
    'Chief Data Officer',
    'Chief AI Officer',
    'Chief Analytics Officer',
    'Chief Data & AI Officer',
  ],
  SVP: [],
  VP: ['VP Data', 'VP AI/ML', 'VP Analytics', 'VP Data Governance'],
  'Director+': [
    'Director Data',
    'Director AI/ML',
    'Director Analytics',
    'Director Data Governance',
    'Head of Data',
    'Head of AI',
  ],
  Senior: [],
}
