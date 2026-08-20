import { describe, it, expect } from 'vitest'
import type { BookElement, JourneyStats } from '@trek/shared'
import { isStale, liveMetrics, refreshPatch } from '../../../src/components/Studio/travelRefresh'

/**
 * Keeping a travel element in step with its journey (#1973).
 *
 * The behaviour being pinned is restraint: an element holds its own values so
 * the print renderer never needs a network, and the editor offers to update
 * them only when they have genuinely stopped matching. Marking a page stale
 * because *something* changed would make the prompt meaningless.
 */

const stats: JourneyStats = {
  journeyId: 6,
  distance: 1_189_000,
  days: 14,
  steps: 14,
  photos: 57,
  places: 21,
  furthest: 408_000,
  countries: [
    { code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' },
  ],
  points: [
    { lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS', tripId: null, photoId: null },
    { lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', country: 'IS', tripId: null, photoId: null },
  ],
  trips: [],
  start: '2026-06-02',
  end: '2026-06-15',
}

const frame = { x: 0, y: 0, w: 100, h: 60 }
const common = { frame, rotation: 0, opacity: 1, locked: false }
const typeset = { font: 'sans' as const, color: '#1a1a1a', accent: '#111111', textScale: 1, weight: 700 as const, stale: false }

function statsEl(over: Partial<Record<string, unknown>> = {}): BookElement {
  return {
    ...common, ...typeset, id: 'st-1', kind: 'stats',
    metrics: ['distance', 'days'],
    layout: 'grid', showIcons: true, units: 'metric',
    values: { distance: 1_189_000, days: 14 },
    ...over,
  } as BookElement
}

function countriesEl(over: Partial<Record<string, unknown>> = {}): BookElement {
  return {
    ...common, ...typeset, id: 'co-1', kind: 'countries',
    codes: ['IS'], names: ['Island'],
    layout: 'list', showOutline: true, showFlag: false, showName: true, align: 'center',
    ...over,
  } as BookElement
}

function mapEl(over: Partial<Record<string, unknown>> = {}): BookElement {
  return {
    ...common, ...typeset, id: 'mp-1', kind: 'map',
    style: 'minimal', showLand: true, showRoute: true, showPins: true, showLabels: false,
    countries: ['IS'],
    points: stats.points.map(p => ({ lat: p.lat, lng: p.lng, label: p.label })),
    ...over,
  } as BookElement
}

describe('liveMetrics', () => {
  it('maps every metric name onto a figure', () => {
    expect(liveMetrics(stats)).toEqual({
      distance: 1_189_000, days: 14, steps: 14, photos: 57, countries: 1, places: 21, furthest: 408_000,
    })
  })

  it('reports the count of countries, not the list', () => {
    expect(liveMetrics(stats).countries).toBe(1)
  })
})

describe('isStale', () => {
  it('is false with no figures to compare against', () => {
    expect(isStale(statsEl(), null)).toBe(false)
  })

  it('is false for an element that carries no journey figures at all', () => {
    const text = { ...common, id: 't-1', kind: 'text', text: 'hi' } as unknown as BookElement
    expect(isStale(text, stats)).toBe(false)
  })

  it('is false while the stored figures still match', () => {
    expect(isStale(statsEl(), stats)).toBe(false)
  })

  it('is true once a shown figure has moved', () => {
    expect(isStale(statsEl({ values: { distance: 900_000, days: 14 } }), stats)).toBe(true)
  })

  /*
   * The restraint that makes the prompt worth showing: a summary of distance
   * and days does not go stale because somebody uploaded a photograph.
   */
  it('ignores a figure the element does not show', () => {
    expect(isStale(statsEl({ values: { distance: 1_189_000, days: 14, photos: 3 } }), stats)).toBe(false)
  })

  it('treats a missing stored value as zero and therefore stale', () => {
    expect(isStale(statsEl({ values: { distance: 1_189_000 } }), stats)).toBe(true)
  })

  it('spots a country added to the journey', () => {
    expect(isStale(countriesEl({ codes: [] }), stats)).toBe(true)
    expect(isStale(countriesEl(), stats)).toBe(false)
  })

  it('spots countries reordered, since the list retells the route', () => {
    const twoCountries: JourneyStats = {
      ...stats,
      countries: [
        { code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' },
        { code: 'FO', name: 'Faroe Islands', places: 2, firstVisit: '2026-06-16' },
      ],
    }
    expect(isStale(countriesEl({ codes: ['FO', 'IS'], names: ['a', 'b'] }), twoCountries)).toBe(true)
  })

  it('spots a route that gained or lost a stop', () => {
    expect(isStale(mapEl({ points: [stats.points[0]] }), stats)).toBe(true)
    expect(isStale(mapEl(), stats)).toBe(false)
  })

  it('spots a route of the same length whose ends have moved', () => {
    const moved = mapEl({
      points: [{ lat: 0, lng: 0, label: '' }, { lat: 65.68, lng: -18.12, label: '' }],
    })
    expect(isStale(moved, stats)).toBe(true)
  })

  it('is false for an empty route against an empty journey', () => {
    expect(isStale(mapEl({ points: [] }), { ...stats, points: [] })).toBe(false)
  })
})

describe('refreshPatch', () => {
  it('is null for an element with nothing to refresh', () => {
    const text = { ...common, id: 't-1', kind: 'text', text: 'hi' } as unknown as BookElement
    expect(refreshPatch(text, stats)).toBeNull()
  })

  it('takes the current figures and clears the stale flag', () => {
    const patch = refreshPatch(statsEl({ values: { distance: 1, days: 1 } }), stats)!
    expect(patch).toMatchObject({ stale: false })
    expect((patch as { values: Record<string, number> }).values.distance).toBe(1_189_000)
  })

  it('brings a country list up to date', () => {
    const patch = refreshPatch(countriesEl({ codes: [], names: [] }), stats)!
    expect((patch as { codes: string[] }).codes).toEqual(['IS'])
  })

  /*
   * Names are the book's language, resolved on the client when the element was
   * placed. A refresh must not quietly replace "Island" with the API's English.
   */
  it('keeps the name a country already had, in whatever language it was set', () => {
    const twoCountries: JourneyStats = {
      ...stats,
      countries: [
        { code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' },
        { code: 'FO', name: 'Faroe Islands', places: 2, firstVisit: '2026-06-16' },
      ],
    }
    const patch = refreshPatch(countriesEl(), twoCountries)!
    expect((patch as { names: string[] }).names[0]).toBe('Island')
    expect((patch as { names: string[] }).names[1]).toBe('Faroe Islands')
  })

  it('keeps a name matched to its country when the order changes', () => {
    const reordered: JourneyStats = {
      ...stats,
      countries: [
        { code: 'FO', name: 'Faroe Islands', places: 2, firstVisit: '2026-05-01' },
        { code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' },
      ],
    }
    const patch = refreshPatch(countriesEl(), reordered)!
    const { codes, names } = patch as { codes: string[]; names: string[] }
    expect(codes).toEqual(['FO', 'IS'])
    // Iceland keeps the German name it was placed with, now in second position.
    expect(names[codes.indexOf('IS')]).toBe('Island')
  })

  it('replaces the route and the countries a map draws', () => {
    const patch = refreshPatch(mapEl({ points: [], countries: [] }), stats)!
    expect((patch as { points: unknown[] }).points).toHaveLength(2)
    expect((patch as { countries: string[] }).countries).toEqual(['IS'])
  })

  it('carries only what a map draws with, not the whole stats point', () => {
    const patch = refreshPatch(mapEl({ points: [] }), stats)!
    // The date, the country and the trip stay behind; the photograph comes
    // along because a marker can be a picture of the stop.
    expect((patch as { points: object[] }).points[0]).toEqual({
      lat: 64.14, lng: -21.94, label: 'Reykjavík', photoId: null,
    })
  })

  it('leaves the element stale-free after refreshing, so the prompt goes away', () => {
    const el = statsEl({ values: { distance: 1, days: 1 } })
    const patched = { ...el, ...refreshPatch(el, stats) } as BookElement
    expect(isStale(patched, stats)).toBe(false)
  })
})
