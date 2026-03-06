import { describe, it, expect } from 'vitest'
import {
  passesNegativeFilter,
  containsNegativeKeyword,
  isNegativeDomain,
} from '../filters'

describe('passesNegativeFilter', () => {
  // ── Should REJECT (return false) ──────────────────────────────────────────

  describe('rejects MMA/UFC content', () => {
    it('rejects articles about MMA fighters named CAIO', () => {
      expect(
        passesNegativeFilter(
          'CAIO Borralho defeats Sean Strickland at UFC 310',
          'Brazilian UFC middleweight fighter CAIO Borralho wins by knockout',
          'https://mmafighting.com/caio-borralho-ufc-310',
        ),
      ).toBe(false)
    })

    it('rejects UFC domain even if title looks clean', () => {
      expect(
        passesNegativeFilter(
          'CAIO appointed to new role',
          'Exciting announcement',
          'https://ufc.com/news/caio-announcement',
        ),
      ).toBe(false)
    })

    it('rejects articles with fighter/knockout terms', () => {
      expect(
        passesNegativeFilter(
          'CAIO lands devastating knockout in title fight',
          'The Brazilian fighter dominated the octagon',
          'https://example.com/sports',
        ),
      ).toBe(false)
    })

    it('rejects sherdog.com domain', () => {
      expect(
        passesNegativeFilter(
          'CAIO Borralho fighter profile',
          'Professional MMA record',
          'https://sherdog.com/fighter/caio-borralho',
        ),
      ).toBe(false)
    })

    it('rejects bjpenn.com domain', () => {
      expect(
        passesNegativeFilter(
          'Some article title',
          'Some description',
          'https://bjpenn.com/mma-news/some-article',
        ),
      ).toBe(false)
    })
  })

  describe('rejects CDO financial terms', () => {
    it('rejects collateralized debt obligation articles', () => {
      expect(
        passesNegativeFilter(
          'CDO market sees record issuance in 2026',
          'Collateralized debt obligations are back as investors chase yield',
          'https://reuters.com/finance/cdo-market',
        ),
      ).toBe(false)
    })

    it('rejects structured credit articles', () => {
      expect(
        passesNegativeFilter(
          'CDO tranche pricing analysis',
          'The structured credit market continues to evolve',
          'https://bloomberg.com/structured-credit',
        ),
      ).toBe(false)
    })
  })

  describe('rejects noise content', () => {
    it('rejects obituary content', () => {
      expect(
        passesNegativeFilter(
          'John Smith, former CDO, remembered by colleagues',
          'Obituary for John Smith who served as chief data officer',
          'https://example.com/obituaries/john-smith',
        ),
      ).toBe(false)
    })

    it('rejects fantasy sports content', () => {
      expect(
        passesNegativeFilter(
          'Fantasy football draft picks for data analysts',
          'Use your data skills for fantasy sports success',
          'https://example.com/fantasy-football-data',
        ),
      ).toBe(false)
    })
  })

  // ── Should ACCEPT (return true) ──────────────────────────────────────────

  describe('accepts legitimate data/AI executive content', () => {
    it('accepts CDO appointment article', () => {
      expect(
        passesNegativeFilter(
          'Jane Doe named Chief Data Officer at Microsoft',
          'Microsoft has appointed Jane Doe as its new CDO, responsible for enterprise data strategy',
          'https://businesswire.com/news/microsoft-cdo',
        ),
      ).toBe(true)
    })

    it('accepts CAIO appointment article', () => {
      expect(
        passesNegativeFilter(
          'Acme Corp appoints new Chief AI Officer',
          'The CAIO will lead AI strategy and governance across the enterprise',
          'https://prnewswire.com/acme-caio',
        ),
      ).toBe(true)
    })

    it('accepts CDAIO article', () => {
      expect(
        passesNegativeFilter(
          'Enterprise CDAIO trends for 2026',
          'Chief Data and AI Officers are reshaping organizations',
          'https://hbr.org/cdaio-trends',
        ),
      ).toBe(true)
    })

    it('accepts VP Data Governance article', () => {
      expect(
        passesNegativeFilter(
          'VP of Data Governance role at Fortune 500',
          'Leading data governance and quality initiatives',
          'https://indeed.com/job/vp-data-governance',
        ),
      ).toBe(true)
    })

    it('accepts Director of AI/ML job posting', () => {
      expect(
        passesNegativeFilter(
          'Director of AI/ML - Enterprise Company',
          'Lead machine learning engineering team',
          'https://linkedin.com/jobs/director-ai-ml',
        ),
      ).toBe(true)
    })

    it('accepts data governance article', () => {
      expect(
        passesNegativeFilter(
          'How CDOs are implementing data governance at scale',
          'Enterprise data governance frameworks and best practices',
          'https://tdwi.org/data-governance',
        ),
      ).toBe(true)
    })
  })
})

describe('containsNegativeKeyword', () => {
  it('is case-insensitive', () => {
    expect(containsNegativeKeyword('UFC Fight Night Results')).toBe(true)
    expect(containsNegativeKeyword('ufc fight night results')).toBe(true)
  })

  it('matches partial words in compound terms', () => {
    expect(containsNegativeKeyword('collateralized debt market')).toBe(true)
  })

  it('does not match on clean text', () => {
    expect(containsNegativeKeyword('Chief Data Officer appointed at Enterprise Corp')).toBe(false)
  })
})

describe('isNegativeDomain', () => {
  it('matches domain within full URL', () => {
    expect(isNegativeDomain('https://www.mmafighting.com/2026/article')).toBe(true)
  })

  it('matches espn.com/mma path', () => {
    expect(isNegativeDomain('https://espn.com/mma/story/_/id/12345')).toBe(true)
  })

  it('does not match espn.com without /mma', () => {
    expect(isNegativeDomain('https://espn.com/nba/story')).toBe(false)
  })

  it('does not match legitimate domains', () => {
    expect(isNegativeDomain('https://hbr.org/article/cdo-trends')).toBe(false)
    expect(isNegativeDomain('https://prnewswire.com/news')).toBe(false)
  })
})
