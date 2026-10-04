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

/**
 * The midnight-window regression: "today" must be the LOCAL calendar date.
 * The old code derived it from toISOString() (the UTC date), so between local
 * midnight and the UTC rollover a journey running through yesterday still
 * showed 'live' and one starting today showed 'upcoming'. Pinned at 00:30
 * local — vacuous on a UTC machine, biting on any TZ ahead of UTC.
 */
describe('computeJourneyLifecycle — local today at the midnight window', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30)) // local 2026-08-25 00:30
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it('a journey spanning the local today is live', () => {
    expect(computeJourneyLifecycle('active', '2026-08-25', '2026-08-26')).toBe('live')
  })

  it('a journey that ended yesterday (local) is completed', () => {
    expect(computeJourneyLifecycle('active', '2026-08-20', '2026-08-24')).toBe('completed')
  })

  it('single boundaries follow the local date too', () => {
    expect(computeJourneyLifecycle('active', '2026-08-25', null)).toBe('live')      // starts today → live
    expect(computeJourneyLifecycle('active', null, '2026-08-24')).toBe('completed') // ended yesterday
  })
})

describe('status set by hand (#762)', () => {
  it('wins over the trip dates and over having no trip, but not over archived', () => {
    expect(computeJourneyLifecycle('active', null, null, 'live')).toBe('live')
    expect(computeJourneyLifecycle('active', null, null, 'completed')).toBe('completed')
    expect(computeJourneyLifecycle('active', '2000-01-01', '2000-01-02', 'draft')).toBe('draft')
    expect(computeJourneyLifecycle('archived', null, null, 'live')).toBe('archived')
    expect(computeJourneyLifecycle('active', null, null, null)).toBe('draft')
    expect(computeJourneyLifecycle('active', null, null, 'bogus')).toBe('draft')
  })
})

