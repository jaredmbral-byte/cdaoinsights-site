import { describe, it, expect } from 'vitest'
import { classifyPersona } from '../homepage-analytics'

describe('classifyPersona', () => {
  it('classifies Chief AI Officer as CAIO', () => {
    expect(classifyPersona('Chief AI Officer')).toBe('CAIO')
    expect(classifyPersona('Appointed Chief Artificial Intelligence Officer')).toBe('CAIO')
  })

  it('classifies combined data+analytics/ai roles as CDAO', () => {
    expect(classifyPersona('Chief Data and Analytics Officer')).toBe('CDAO')
    expect(classifyPersona('Chief Data & AI Officer')).toBe('CDAO')
    expect(classifyPersona('named CDAO')).toBe('CDAO')
  })

  it('classifies plain data-officer roles as CDO', () => {
    expect(classifyPersona('Chief Data Officer')).toBe('CDO')
    expect(classifyPersona('Acme names new CDO')).toBe('CDO')
  })

  it('classifies analytics-only chief roles as Analytics', () => {
    expect(classifyPersona('Chief Analytics Officer')).toBe('Analytics')
  })

  it('classifies VP / Head / Director roles as VP / Head', () => {
    expect(classifyPersona('VP of Data')).toBe('VP / Head')
    expect(classifyPersona('Head of Data Science')).toBe('VP / Head')
    expect(classifyPersona('Director of Analytics Engineering')).toBe('VP / Head')
  })

  it('falls back to Other for unrelated titles', () => {
    expect(classifyPersona('Chief Financial Officer')).toBe('Other')
    expect(classifyPersona('')).toBe('Other')
    expect(classifyPersona(null)).toBe('Other')
  })

  it('prefers CAIO over CDO when both could match', () => {
    // A combined title mentioning AI officer should not collapse to CDO
    expect(classifyPersona('Chief AI Officer and Head of Data')).toBe('CAIO')
  })
})
