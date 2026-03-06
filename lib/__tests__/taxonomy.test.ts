import { describe, it, expect } from 'vitest'
import {
  classifyPersona,
  classifySeniorityFromTaxonomy,
} from '../taxonomy'

describe('classifyPersona', () => {
  // ── C-Suite ──────────────────────────────────────────────────────────────

  describe('C-Suite titles', () => {
    it('classifies "Chief Data Officer"', () => {
      expect(classifyPersona('Chief Data Officer')).toBe('Chief Data Officer')
    })

    it('classifies "Chief AI Officer"', () => {
      expect(classifyPersona('Chief AI Officer')).toBe('Chief AI Officer')
    })

    it('classifies "Chief Analytics Officer"', () => {
      expect(classifyPersona('Chief Analytics Officer')).toBe('Chief Analytics Officer')
    })

    it('classifies "Chief Data & AI Officer"', () => {
      expect(classifyPersona('Chief Data and AI Officer')).toBe('Chief Data & AI Officer')
    })

    it('classifies "Chief Data and Analytics Officer"', () => {
      expect(classifyPersona('Chief Data and Analytics Officer')).toBe('Chief Data & AI Officer')
    })

    it('classifies CDAIO abbreviation', () => {
      expect(classifyPersona('CDAIO')).toBe('Chief Data & AI Officer')
    })

    it('classifies CAIO abbreviation', () => {
      expect(classifyPersona('CAIO')).toBe('Chief AI Officer')
    })

    it('classifies CDO abbreviation', () => {
      expect(classifyPersona('CDO')).toBe('Chief Data Officer')
    })

    it('classifies CDAO abbreviation', () => {
      expect(classifyPersona('CDAO')).toBe('Chief Data & AI Officer')
    })
  })

  // ── VP Level ─────────────────────────────────────────────────────────────

  describe('VP-level titles', () => {
    it('classifies "VP of Data Governance"', () => {
      expect(classifyPersona('VP of Data Governance')).toBe('VP Data Governance')
    })

    it('classifies "Vice President of Data"', () => {
      expect(classifyPersona('Vice President of Data')).toBe('VP Data')
    })

    it('classifies "SVP Data Analytics"', () => {
      expect(classifyPersona('SVP Data Analytics')).toBe('VP Data')
    })

    it('classifies "VP AI"', () => {
      expect(classifyPersona('VP AI')).toBe('VP AI/ML')
    })

    it('classifies "Vice President of Artificial Intelligence"', () => {
      expect(classifyPersona('Vice President of Artificial Intelligence')).toBe('VP AI/ML')
    })

    it('classifies "VP Analytics"', () => {
      expect(classifyPersona('VP Analytics')).toBe('VP Analytics')
    })

    it('classifies "Senior Vice President of Data Governance"', () => {
      expect(classifyPersona('Senior Vice President of Data Governance')).toBe('VP Data Governance')
    })
  })

  // ── Director Level ───────────────────────────────────────────────────────

  describe('Director-level titles', () => {
    it('classifies "Director of AI/ML"', () => {
      expect(classifyPersona('Director of AI')).toBe('Director AI/ML')
    })

    it('classifies "Director of Machine Learning"', () => {
      expect(classifyPersona('Director of Machine Learning')).toBe('Director AI/ML')
    })

    it('classifies "Senior Director of Data Governance"', () => {
      expect(classifyPersona('Senior Director of Data Governance')).toBe('Director Data Governance')
    })

    it('classifies "Director of Data"', () => {
      expect(classifyPersona('Director of Data')).toBe('Director Data')
    })

    it('classifies "Director of Analytics"', () => {
      expect(classifyPersona('Director of Analytics')).toBe('Director Analytics')
    })
  })

  // ── Head of Level ────────────────────────────────────────────────────────

  describe('Head of titles', () => {
    it('classifies "Head of Data"', () => {
      expect(classifyPersona('Head of Data')).toBe('Head of Data')
    })

    it('classifies "Head of Enterprise Data"', () => {
      expect(classifyPersona('Head of Enterprise Data')).toBe('Head of Data')
    })

    it('classifies "Head of AI"', () => {
      expect(classifyPersona('Head of AI')).toBe('Head of AI')
    })

    it('classifies "Head of Artificial Intelligence"', () => {
      expect(classifyPersona('Head of Artificial Intelligence')).toBe('Head of AI')
    })
  })

  // ── Fallback ─────────────────────────────────────────────────────────────

  describe('fallback cases', () => {
    it('returns "Other Data/AI Leadership" for unrecognized titles', () => {
      expect(classifyPersona('Senior Data Engineer')).toBe('Other Data/AI Leadership')
    })

    it('returns "Other Data/AI Leadership" for generic titles', () => {
      expect(classifyPersona('Manager of Data Quality')).toBe('Other Data/AI Leadership')
    })
  })

  // ── Specific edge cases from user request ────────────────────────────────

  describe('user-specified edge cases', () => {
    it('handles "Global Head of Analytics" → Head of Data', () => {
      // "Global Head of Analytics" matches via "head of (?:\w+\s+)?analytics" pattern
      // which maps to the "Head of Data" persona
      expect(classifyPersona('Global Head of Analytics')).toBe('Head of Data')
    })
  })
})

describe('classifySeniorityFromTaxonomy', () => {
  it('returns C-Suite for Chief Data Officer', () => {
    expect(classifySeniorityFromTaxonomy('Chief Data Officer')).toBe('C-Suite')
  })

  it('returns VP for VP of Data Governance', () => {
    expect(classifySeniorityFromTaxonomy('VP of Data Governance')).toBe('VP')
  })

  it('returns Director+ for Director of AI', () => {
    expect(classifySeniorityFromTaxonomy('Director of AI')).toBe('Director+')
  })

  it('returns Director+ for Head of Data', () => {
    expect(classifySeniorityFromTaxonomy('Head of Data')).toBe('Director+')
  })

  it('falls back to C-Suite for unrecognized chief title', () => {
    expect(classifySeniorityFromTaxonomy('Chief Innovation Officer')).toBe('C-Suite')
  })

  it('falls back to VP for unrecognized VP title', () => {
    expect(classifySeniorityFromTaxonomy('VP of Marketing')).toBe('VP')
  })

  it('falls back to Senior for unrecognized title', () => {
    expect(classifySeniorityFromTaxonomy('Data Engineer III')).toBe('Senior')
  })
})
