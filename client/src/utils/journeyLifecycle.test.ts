// FE-W4UTL-020 to FE-W4UTL-029
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { computeJourneyLifecycle } from './journeyLifecycle'

const TODAY = '2026-06-15'

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('computeJourneyLifecycle', () => {
  it('FE-W4UTL-020: archived wins over any date range', () => {
    expect(computeJourneyLifecycle('archived', '2026-06-01', '2026-06-30')).toBe('archived')
    expect(computeJourneyLifecycle('archived', null, null)).toBe('archived')
  })

  it('FE-W4UTL-021: a range containing today is live', () => {
    expect(computeJourneyLifecycle('published', '2026-06-01', '2026-06-30')).toBe('live')
  })

  it('FE-W4UTL-022: today on either boundary is still live', () => {
    expect(computeJourneyLifecycle('published', TODAY, '2026-06-30')).toBe('live')
    expect(computeJourneyLifecycle('published', '2026-06-01', TODAY)).toBe('live')
  })

  it('FE-W4UTL-023: a future range is upcoming', () => {
    expect(computeJourneyLifecycle('published', '2026-07-01', '2026-07-10')).toBe('upcoming')
  })

  it('FE-W4UTL-024: a past range is completed', () => {
    expect(computeJourneyLifecycle('published', '2026-05-01', '2026-05-10')).toBe('completed')
  })

  it('FE-W4UTL-025: no dates at all is a draft', () => {
    expect(computeJourneyLifecycle('published', null, null)).toBe('draft')
    expect(computeJourneyLifecycle('published', undefined, undefined)).toBe('draft')
  })

  it('FE-W4UTL-026: start only, in the future, is upcoming', () => {
    expect(computeJourneyLifecycle('published', '2026-07-01', null)).toBe('upcoming')
  })

  it('FE-W4UTL-027: start only, already reached, is live', () => {
    expect(computeJourneyLifecycle('published', '2026-06-01', null)).toBe('live')
    expect(computeJourneyLifecycle('published', TODAY, null)).toBe('live')
  })

  it('FE-W4UTL-028: end only, in the past, is completed', () => {
    expect(computeJourneyLifecycle('published', null, '2026-05-10')).toBe('completed')
  })

  it('FE-W4UTL-029: end only, not yet reached, is live', () => {
    expect(computeJourneyLifecycle('published', null, '2026-06-30')).toBe('live')
    expect(computeJourneyLifecycle('published', null, TODAY)).toBe('live')
  })
})
