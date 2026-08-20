import { describe, it, expect } from 'vitest'
import type { BookElement, JourneyStats } from '@trek/shared'
import { isStale, refreshPatch, routeFor } from '../../../src/components/Studio/travelRefresh'

/**
 * A map of one trip, out of a journey made of several (#1973).
 *
 * A journey is a collection of trips, and printing two of them as one route
 * draws a line from the last stop of the first to the first stop of the second.
 * On a journey that went to Iceland in June and Portugal in September that leg
 * is the longest line on the page and nobody travelled it.
 *
 * The scope is stored on the element rather than worked out at draw time,
 * because the stops are frozen into it when it is placed. These cases pin the
 * part that would otherwise rot quietly: bringing a map up to date has to keep
 * the scope, or a map of Iceland turns back into a map of everywhere the first
 * time somebody clicks refresh.
 */

const ICELAND = 11
const PORTUGAL = 22

const stats: JourneyStats = {
  journeyId: 5,
  distance: 4_000_000,
  days: 21,
  steps: 6,
  photos: 40,
  places: 12,
  furthest: 3_000_000,
  countries: [
    { code: 'IS', name: 'Iceland', places: 2, firstVisit: '2026-06-02' },
    { code: 'PT', name: 'Portugal', places: 2, firstVisit: '2026-09-04' },
  ],
  points: [
    { lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS', tripId: ICELAND, photoId: null },
    { lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', country: 'IS', tripId: ICELAND, photoId: null },
    { lat: 38.72, lng: -9.14, label: 'Lisboa', date: '2026-09-04', country: 'PT', tripId: PORTUGAL, photoId: null },
    { lat: 41.15, lng: -8.61, label: 'Porto', date: '2026-09-08', country: 'PT', tripId: PORTUGAL, photoId: null },
  ],
  trips: [
    { id: ICELAND, title: 'Iceland', start: '2026-06-02', end: '2026-06-14', points: 2 },
    { id: PORTUGAL, title: 'Portugal', start: '2026-09-04', end: '2026-09-12', points: 2 },
  ],
  start: '2026-06-02',
  end: '2026-09-12',
}

const map = (over: Record<string, unknown> = {}): BookElement => ({
  id: 'mp1', kind: 'map', frame: { x: 10, y: 10, w: 180, h: 140 },
  rotation: 0, opacity: 1, locked: false,
  font: 'sans', color: '#1a1a1a', accent: '#c2410c', textScale: 1, weight: 400, stale: false,
  style: 'minimal', source: 'vector', tileUrl: '', attribution: '', zoom: null, clip: 'rect',
  showLand: true, showRoute: true, showPins: true, showLabels: false,
  countries: ['IS', 'PT'],
  points: stats.points.map(p => ({ lat: p.lat, lng: p.lng, label: p.label })),
  path: [],
  fitPadding: 0.18,
  fitToCountries: true,
  tripId: null,
  ...over,
} as unknown as BookElement)

describe('which stops a map is of', () => {
  it('is the whole journey when no trip is named', () => {
    expect(routeFor(stats, null)).toHaveLength(4)
  })

  it('is one trip when one is', () => {
    const route = routeFor(stats, ICELAND)
    expect(route.map(p => p.label)).toEqual(['Reykjavík', 'Akureyri'])
  })

  it('is empty for a trip with nothing on the route, rather than everything', () => {
    expect(routeFor(stats, 999)).toEqual([])
  })
})

describe('bringing a map up to date', () => {
  it('keeps a journey map showing the journey', () => {
    const patch = refreshPatch(map(), stats) as { points: unknown[]; countries: string[] }
    expect(patch.points).toHaveLength(4)
    expect(patch.countries).toEqual(['IS', 'PT'])
  })

  /*
   * The case this test exists for: refresh used to read `stats.points` flat,
   * so one click turned a map of Iceland back into a map of both trips.
   */
  it('keeps a trip map showing that trip', () => {
    const el = map({
      tripId: ICELAND,
      countries: ['IS'],
      points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavík' }],
    })
    const patch = refreshPatch(el, stats) as { points: { label: string }[]; countries: string[] }
    expect(patch.points.map(p => p.label)).toEqual(['Reykjavík', 'Akureyri'])
    expect(patch.countries).toEqual(['IS'])
  })

  it('notices a trip map is behind, against its own trip rather than the journey', () => {
    const behind = map({
      tripId: ICELAND,
      points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavík' }],
    })
    expect(isStale(behind, stats)).toBe(true)

    const current = map({
      tripId: ICELAND,
      points: [
        { lat: 64.14, lng: -21.94, label: 'Reykjavík' },
        { lat: 65.68, lng: -18.12, label: 'Akureyri' },
      ],
    })
    expect(isStale(current, stats)).toBe(false)
  })

  it('does not call a journey map stale merely because a trip map would be', () => {
    expect(isStale(map(), stats)).toBe(false)
  })

  /*
   * A marker draws the entry's own first photograph, so adding one to an entry
   * changes the map without moving a single stop. The shape test — same number
   * of stops, same two ends — cannot see that, and until it did the only way to
   * get the picture onto the page was to delete the map and place it again.
   */
  it('notices a photograph added to a stop, though nothing moved', () => {
    const el = map({
      points: stats.points.map(p => ({ lat: p.lat, lng: p.lng, label: p.label, photoId: null })),
    })
    expect(isStale(el, stats)).toBe(false)

    const withPhoto: JourneyStats = {
      ...stats,
      points: stats.points.map((p, i) => (i === 1 ? { ...p, photoId: 42 } : p)),
    }
    expect(isStale(el, withPhoto)).toBe(true)

    const patch = refreshPatch(el, withPhoto) as { points: { photoId: number | null }[] }
    expect(patch.points[1].photoId).toBe(42)
  })

  it('notices one taken away again', () => {
    const el = map({
      points: stats.points.map((p, i) => ({
        lat: p.lat, lng: p.lng, label: p.label, photoId: i === 0 ? 7 : null,
      })),
    })
    expect(isStale(el, stats)).toBe(true)
  })
})
