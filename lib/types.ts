// ── Database row types ──────────────────────────────────────────────────────

export interface HiringSignal {
  id: string
  person_name: string | null
  job_title: string
  company_name: string
  industry: string | null
  company_size: string | null
  location: string | null
  seniority: string | null
  source_url: string | null
  source_name: string | null
  posted_at: string | null
  ingested_at: string
}

export interface MarketArticle {
  id: string
  title: string
  summary: string | null
  source_name: string | null
  source_url: string
  image_url: string | null
  published_at: string | null
  topics: string[]
  relevance: number
  ingested_at: string
}

export interface CompBenchmark {
  id: string
  role_title: string
  industry: string | null
  geography: string | null
  p25: number | null
  p50: number | null
  p75: number | null
  p90: number | null
  sample_size: number | null
  source: string | null
  period: string | null
  updated_at: string
}

export interface ExecutiveMove {
  id: string
  person_name: string | null
  title: string | null
  company_name: string | null
  move_type: string | null
  headline: string
  summary: string | null
  source_url: string
  source_name: string | null
  published_at: string | null
  ingested_at: string
}

export interface WeeklyBrief {
  id: string
  headline: string
  body: string
  week_label: string
  category: string
  created_at: string
}

// ── Filter params ───────────────────────────────────────────────────────────

export interface HiringFilters {
  industry?: string
  days?: number // 30, 60, 90
  search?: string
}

export interface ArticleFilters {
  topic?: string
  days?: number
  search?: string
}

export interface MovesFilters {
  moveType?: string
  days?: number // 30, 60, 90
  search?: string
}
