import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNavigationTargets, isApplePlatform } from './placeNavigation'
import type { Place } from '../../types'

// FE-PLANNER-NAV-001 to FE-PLANNER-NAV-008

function place(overrides: Partial<Place> = {}): Place {
  return {
    name: 'Stephansdom',
    lat: 48.2038,
    lng: 16.3616,
    google_place_id: null,
    google_ftid: null,
    ...overrides,
  } as unknown as Place
}

/** jsdom reports a Linux-ish agent, so Apple has to be simulated explicitly. */
function withUserAgent(ua: string) {
  const original = Object.getOwnPropertyDescriptor(window.navigator, 'userAgent')
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
  return () => {
    if (original) Object.defineProperty(window.navigator, 'userAgent', original)
  }
}

afterEach(() => { vi.restoreAllMocks() })

describe('getNavigationTargets', () => {
  it('FE-PLANNER-NAV-001: offers Google Maps and Waze for a place with coordinates', () => {
    const targets = getNavigationTargets(place())
    expect(targets.map(t => t.id)).toEqual(['google', 'waze'])
    expect(targets[0].label).toBe('Google Maps')
  })

  it('FE-PLANNER-NAV-002: Waze opens with navigation armed', () => {
    const waze = getNavigationTargets(place()).find(t => t.id === 'waze')!
    expect(waze.url).toBe('https://waze.com/ul?ll=48.2038,16.3616&navigate=yes')
  })

  it('FE-PLANNER-NAV-003: Google keeps its precise link when the place has an ftid', () => {
    const targets = getNavigationTargets(place({ google_ftid: '0x882b:0x8591' }))
    // The whole point of the ftid: it lands on the entry, not on the roof.
    expect(targets[0].url).toContain('ftid=0x882b:0x8591')
    expect(targets[0].url).not.toContain('query=48.2038')
  })

  it('FE-PLANNER-NAV-004: Apple Maps only appears on Apple platforms', () => {
    const restore = withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    try {
      expect(getNavigationTargets(place()).map(t => t.id)).not.toContain('apple')
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-005: an iPhone gets Apple Maps with a navigation target', () => {
    const restore = withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')
    try {
      const targets = getNavigationTargets(place())
      expect(targets.map(t => t.id)).toEqual(['google', 'waze', 'apple'])
      expect(targets[2].url).toBe('https://maps.apple.com/?daddr=48.2038,16.3616')
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-006: iPadOS reports itself as a Mac, and both deserve the entry', () => {
    const restore = withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    try {
      expect(isApplePlatform()).toBe(true)
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-007: a place without coordinates keeps only what Google can resolve', () => {
    // Waze and Apple Maps take coordinates and nothing else, so they cannot
    // offer anything here — Google still can, through the place id.
    const targets = getNavigationTargets(place({ lat: null, lng: null, google_place_id: 'ChIJabc' }))
    expect(targets.map(t => t.id)).toEqual(['google'])
  })

  it('FE-PLANNER-NAV-008: no place, and nothing locatable about it, yields nothing', () => {
    expect(getNavigationTargets(null)).toEqual([])
    expect(getNavigationTargets(place({ lat: null, lng: null }))).toEqual([])
  })
})
