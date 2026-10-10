import { describe, expect, it, vi } from 'vitest'
import { filterTours, hikeSourceBadgeLabel, tourSource } from './tourPresentation'

describe('tourPresentation', () => {
  it('uses the source abstraction for TREK, GPX import, and wanderer badges', () => {
    const t = vi.fn((key: string) => key)

    expect(tourSource({ wanderer_ref: null })).toBe('trek')
    expect(hikeSourceBadgeLabel({ wanderer_ref: null }, t)).toBe('tours.badge.trek')
    expect(tourSource({ wanderer_ref: null, has_waypoints: false })).toBe('gpx')
    expect(hikeSourceBadgeLabel({ wanderer_ref: null, has_waypoints: false }, t)).toBe('tours.badge.gpx')
    expect(tourSource({ wanderer_ref: 'wanderer:123' })).toBe('wanderer')
    expect(hikeSourceBadgeLabel({ wanderer_ref: 'wanderer:123' }, t)).toBe('tours.badge.wanderer')
  })

  it('filters tours by All, Unplanned and Planned, keeping their order', () => {
    const tours = [
      { id: 1, planned: true },
      { id: 2, planned: false },
      { id: 3, planned: true },
      { id: 4, planned: false },
    ]

    expect(filterTours(tours, 'all')).toEqual(tours)
    expect(filterTours(tours, 'all')).not.toBe(tours)
    expect(filterTours(tours, 'unplanned').map(tour => tour.id)).toEqual([2, 4])
    expect(filterTours(tours, 'planned').map(tour => tour.id)).toEqual([1, 3])
    expect(filterTours([], 'planned')).toEqual([])
  })
})
