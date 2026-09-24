import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNavigationTargets, openNavigationTarget, showsAppleMaps } from './placeNavigation'
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

/**
 * jsdom reports its own agent, so Apple has to be simulated. userAgent lives on
 * the prototype as a getter: shadowing it on the instance and deleting that
 * again afterwards restores the real one without having to reconstruct it.
 */
function withUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  return () => { delete (navigator as unknown as Record<string, unknown>).userAgent }
}

afterEach(() => { vi.restoreAllMocks() })

describe('getNavigationTargets', () => {
  it('FE-PLANNER-NAV-001: offers every app that can resolve a place with coordinates', () => {
    const targets = getNavigationTargets(place())
    expect(targets.map(t => t.id)).toEqual(['google', 'waze', 'apple', 'osm', 'comaps'])
    expect(targets[0].label).toBe('Google Maps')
  })

  it('FE-PLANNER-NAV-002: Waze gets the name as well as the position, and navigates', () => {
    // Coordinates alone would show a driver a number instead of a destination;
    // the name alone would be a guess. Waze documents taking both.
    const waze = getNavigationTargets(place()).find(t => t.id === 'waze')!
    expect(waze.url).toBe('https://waze.com/ul?q=Stephansdom&ll=48.2038,16.3616&navigate=yes')
  })

  it('FE-PLANNER-NAV-003: Google keeps its precise link when the place has an ftid', () => {
    const targets = getNavigationTargets(place({ google_ftid: '0x882b:0x8591' }))
    // The whole point of the ftid: it lands on the entry, not on the roof.
    expect(targets[0].url).toContain('ftid=0x882b:0x8591')
    expect(targets[0].url).not.toContain('query=48.2038')
  })

  it('FE-PLANNER-NAV-004: a Windows desktop gets Apple Maps too, through its web version', () => {
    const restore = withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    try {
      expect(getNavigationTargets(place()).map(t => t.id)).toContain('apple')
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-004b: an Android phone does not, because nobody there wants it', () => {
    const restore = withUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)')
    try {
      expect(getNavigationTargets(place()).map(t => t.id)).toEqual(['google', 'waze', 'osm', 'comaps'])
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-005: an iPhone gets Apple Maps with a navigation target', () => {
    const restore = withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')
    try {
      const targets = getNavigationTargets(place())
      expect(targets.map(t => t.id)).toEqual(['google', 'waze', 'apple', 'osm', 'comaps'])
      // q next to ll labels the pin rather than searching blindly.
      expect(targets[2].url).toBe('https://maps.apple.com/?q=Stephansdom&ll=48.2038,16.3616')
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-006: iPadOS reports itself as a Mac, and both deserve the entry', () => {
    const restore = withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    try {
      expect(showsAppleMaps()).toBe(true)
    } finally { restore() }
  })

  it('FE-PLANNER-NAV-007: a place without coordinates keeps only what Google can resolve', () => {
    // Waze and Apple Maps take coordinates and nothing else, so they cannot
    // offer anything here — Google still can, through the place id.
    // OpenStreetMap still manages a name search, the two driving apps do not.
    const targets = getNavigationTargets(place({ lat: null, lng: null, google_place_id: 'ChIJabc' }))
    expect(targets.map(t => t.id)).toEqual(['google', 'osm'])
  })

  it('FE-PLANNER-NAV-007b: CoMaps needs the position, so a place without one loses it', () => {
    // CoMaps drops a pin from `ll` and only labels it with `n` — a name alone
    // has nothing to attach to, the same reason Waze and Apple Maps drop out.
    const targets = getNavigationTargets(place({ lat: null, lng: null, name: 'Stephansdom' }))
    expect(targets.map(t => t.id)).not.toContain('comaps')
  })

  it('FE-PLANNER-NAV-008: no place at all yields nothing', () => {
    expect(getNavigationTargets(null)).toEqual([])
    expect(getNavigationTargets(place({ lat: null, lng: null, name: '' }))).toEqual([])
  })

  it('FE-PLANNER-NAV-009: a nameless place still reaches every app, just without a label', () => {
    const targets = getNavigationTargets(place({ name: '' }))
    expect(targets.map(t => t.id)).toEqual(['google', 'waze', 'apple', 'osm', 'comaps'])
    expect(targets.find(t => t.id === 'waze')!.url).toBe('https://waze.com/ul?ll=48.2038,16.3616&navigate=yes')
  })
})

describe('openNavigationTarget', () => {
  const target = { id: 'google', label: 'Google Maps', url: 'https://maps.google.com/?q=1,2' } as const

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  function stubDisplayMode(installed: boolean, iosStandalone = false) {
    const open = vi.fn()
    const assigned: string[] = []
    vi.stubGlobal('window', {
      matchMedia: (q: string) => ({ matches: installed && q.includes('display-mode') }),
      navigator: { standalone: iosStandalone },
      open,
      get location() { return { get href() { return '' }, set href(v: string) { assigned.push(v) } } },
    })
    return { open, assigned }
  }

  it('FE-PLANNER-NAV-101: a browser tab keeps opening a tab', () => {
    const { open, assigned } = stubDisplayMode(false)
    openNavigationTarget(target)
    expect(open).toHaveBeenCalledWith(target.url, '_blank', 'noopener,noreferrer')
    expect(assigned).toEqual([])
  })

  it('FE-PLANNER-NAV-102: an installed app hands over from the current context, leaving no blank window (#2218)', () => {
    const { open, assigned } = stubDisplayMode(true)
    openNavigationTarget(target)
    expect(open).not.toHaveBeenCalled()
    expect(assigned).toEqual([target.url])
  })

  it('FE-PLANNER-NAV-103: an iOS home-screen app is recognised without the display-mode query', () => {
    const { open, assigned } = stubDisplayMode(false, true)
    openNavigationTarget(target)
    expect(open).not.toHaveBeenCalled()
    expect(assigned).toEqual([target.url])
  })
})
