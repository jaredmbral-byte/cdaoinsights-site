import type { HiringSignal, MarketArticle } from './types'

// ── JSON-LD generators for AEO ──────────────────────────────────────────────

export function hiringListSchema(signals: HiringSignal[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Enterprise Data & AI Executive Hiring — CDAO Insights',
    description:
      'Real-time tracking of Chief Data Officer, Chief AI Officer, and senior data leadership hires at large enterprises.',
    numberOfItems: signals.length,
    itemListElement: signals.slice(0, 50).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'JobPosting',
        title: s.job_title,
        hiringOrganization: {
          '@type': 'Organization',
          name: s.company_name,
        },
        jobLocation: s.location
          ? { '@type': 'Place', address: s.location }
          : undefined,
        datePosted: s.posted_at,
        industry: s.industry,
      },
    })),
  }
}

export function articleListSchema(articles: MarketArticle[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Enterprise Data & AI Market Intelligence — CDAO Insights',
    description:
      'Curated intelligence feed for Chief Data Officers and Chief AI Officers — AI regulation, data strategy, vendor moves, and market signals.',
    numberOfItems: articles.length,
    itemListElement: articles.slice(0, 50).map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: a.title,
        description: a.summary,
        url: a.source_url,
        datePublished: a.published_at,
        publisher: a.source_name
          ? { '@type': 'Organization', name: a.source_name }
          : undefined,
      },
    })),
  }
}

export function compBenchmarkSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CDAO Compensation Benchmarks',
    description:
      'Salary benchmarks for Chief Data Officers, Chief AI Officers, VP of Data & Analytics, and senior data leadership roles by industry and geography.',
    creator: {
      '@type': 'Organization',
      name: 'CDAO Insights',
      url: 'https://cdaoinsights.com',
    },
    keywords: [
      'CDO salary',
      'CAIO compensation',
      'Chief Data Officer salary',
      'Chief AI Officer salary',
      'VP Data Analytics salary',
    ],
  }
}
