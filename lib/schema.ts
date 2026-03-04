import type { HiringSignal, MarketArticle, ExecutiveMove } from './types'

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

export function movesListSchema(moves: ExecutiveMove[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'CDO / CAIO / CDAIO Executive Appointment Tracker — CDAO Insights',
    description:
      'Real-time feed of Chief Data Officer, Chief AI Officer, and CDAIO executive appointments, departures, and leadership changes at large enterprises.',
    numberOfItems: moves.length,
    itemListElement: moves.slice(0, 50).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: m.headline,
        description: m.summary,
        url: m.source_url,
        datePublished: m.published_at,
        publisher: m.source_name
          ? { '@type': 'Organization', name: m.source_name }
          : undefined,
        about: m.company_name
          ? { '@type': 'Organization', name: m.company_name }
          : undefined,
      },
    })),
  }
}

export function movesFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the CDAO Insights Executive Moves feed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Executive Moves feed tracks Chief Data Officer (CDO), Chief AI Officer (CAIO), and Chief Data and AI Officer (CDAIO) appointments, departures, and leadership transitions at enterprise organizations. Sources include press releases, news coverage, and company announcements. The feed is updated every 6 hours.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why do CDO and CAIO executive moves matter?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Executive leadership changes in data and AI signal strategic shifts at enterprises. A new CDO often precedes major data platform investments, governance initiatives, or organizational restructuring. Tracking these moves provides early indicators of where enterprise data and AI investment is heading.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often is the executive moves feed updated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The executive moves feed is refreshed every 6 hours from Google News and PR Newswire RSS sources. Articles are deduplicated by URL to prevent repeat entries.',
        },
      },
    ],
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
