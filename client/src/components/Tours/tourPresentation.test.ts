import { describe, expect, it, vi } from 'vitest'
import { hikeSourceBadgeLabel, tourSource } from './tourPresentation'

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
})
