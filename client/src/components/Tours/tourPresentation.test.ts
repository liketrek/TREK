import { describe, expect, it, vi } from 'vitest'
import { formatPlannedTourDuration, hikeSourceBadgeLabel, tourPlannedTimes, tourSource, tourWebsitePresentation } from './tourPresentation'

describe('tourPresentation', () => {
  it('formats planned Tour totals using the shared compact duration formatter', () => {
    expect(formatPlannedTourDuration(0)).toBe('0 min')
    expect(formatPlannedTourDuration(45)).toBe('45 min')
    expect(formatPlannedTourDuration(95)).toBe('1 h 35 min')
  })

  it('calculates planned total from walking and breaks unless a manual override exists', () => {
    expect(tourPlannedTimes({ duration: 80, planned_duration_minutes: null, break_additional_minutes: 25 })).toEqual({
      walkingMinutes: 80, breakMinutes: 25, plannedTotalMinutes: 105, manuallyOverridden: false,
    })
    expect(tourPlannedTimes({ duration: 80, planned_duration_minutes: 130, break_additional_minutes: 25 })).toEqual({
      walkingMinutes: 80, breakMinutes: 25, plannedTotalMinutes: 130, manuallyOverridden: true,
    })
    expect(tourPlannedTimes({ duration: null, planned_duration_minutes: null, break_additional_minutes: 25 }).plannedTotalMinutes).toBeNull()
  })

  it('uses the source abstraction for TREK, GPX import, and wanderer badges', () => {
    const t = vi.fn((key: string) => key)

    expect(tourSource({ wanderer_ref: null })).toBe('trek')
    expect(hikeSourceBadgeLabel({ wanderer_ref: null }, t)).toBe('tours.badge.trek')
    expect(tourSource({ wanderer_ref: null, has_waypoints: false })).toBe('gpx')
    expect(hikeSourceBadgeLabel({ wanderer_ref: null, has_waypoints: false }, t)).toBe('tours.badge.gpx')
    expect(tourSource({ wanderer_ref: 'wanderer:123' })).toBe('wanderer')
    expect(hikeSourceBadgeLabel({ wanderer_ref: 'wanderer:123' }, t)).toBe('tours.badge.wanderer')
  })

  it.each([
    ['https://www.komoot.com/tour/42', 'Komoot', 'komoot.com'],
    ['https://trail.alltrails.com/route/42', 'AllTrails', 'trail.alltrails.com'],
    ['https://www.outdooractive.de/route/42', 'Outdooractive', 'outdooractive.de'],
    ['https://demo.wanderer.to/trail/view/42', 'Wanderer', 'demo.wanderer.to'],
  ])('classifies %s by its hostname', (href, provider, domain) => {
    expect(tourWebsitePresentation(href)).toEqual({ href, provider, domain })
  })

  it('labels an unknown HTTPS host as an external website domain', () => {
    expect(tourWebsitePresentation('https://www.example.org/path')).toEqual({
      href: 'https://www.example.org/path',
      provider: null,
      domain: 'example.org',
    })
    expect(tourWebsitePresentation('https://komoot.com.evil.test/route')).toMatchObject({
      provider: null,
      domain: 'komoot.com.evil.test',
    })
  })

  it.each(['http://komoot.com/route', 'https://user:pass@komoot.com/route', 'javascript:alert(1)'])
    ('does not classify unsafe URL %s', value => {
      expect(tourWebsitePresentation(value)).toBeNull()
    })
})
