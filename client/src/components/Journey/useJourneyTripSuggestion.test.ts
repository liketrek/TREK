// FE-JOURNEY-TRIPSUGGEST-001 (#2265)
import { describe, it, expect } from 'vitest'
import { tripForDate } from './useJourneyTripSuggestion'

const trips = [
  { id: 1, title: 'Summer', start_date: '2026-07-01', end_date: '2026-07-31' },
  { id: 2, title: 'Berlin weekend', start_date: '2026-07-10', end_date: '2026-07-12' },
  { id: 3, title: 'Undated' },
]

describe('tripForDate', () => {
  it('FE-JOURNEY-TRIPSUGGEST-001: picks the shortest unlinked trip that takes in the day', () => {
    expect(tripForDate(trips, '2026-07-11', new Set())?.id).toBe(2)
    expect(tripForDate(trips, '2026-07-11T09:00', new Set([2]))?.id).toBe(1)
    expect(tripForDate(trips, '2026-07-02', new Set())?.id).toBe(1)
    expect(tripForDate(trips, '2026-08-01', new Set())).toBeNull()
    expect(tripForDate(trips, null, new Set())).toBeNull()
    expect(tripForDate(trips, '2026-07-31', new Set([1]))).toBeNull()
  })
})
