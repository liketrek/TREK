import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { fetchRoads } from '../../../src/components/Studio/roadRoute'

vi.mock('../../../src/components/Map/RouteCalculator', () => ({
  calculateRouteWithLegs: vi.fn(),
}))
const { calculateRouteWithLegs } = await import('../../../src/components/Map/RouteCalculator')

/**
 * The line following real roads, for the legs that have them (#1973).
 *
 * The trap this is built around: when the map element carries a track, the
 * renderer draws that INSTEAD of the stop chain, whole. A road route that only
 * covers some legs would therefore have printed those legs and silently dropped
 * the rest — three legs of twelve, and the book looks like the journey stopped.
 * So the roads are per leg and the chain is cut around them, and the case that
 * proves it is the one below with a road on the middle leg only.
 *
 * The second thing worth protecting is what is NOT asked: a leg long enough to
 * have been a flight is never sent to a router, because the answer would be a
 * three-day drive and a ferry, and that is not the journey anybody made.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({ preset: 'square-210' })

const STOPS = [
  { lat: 64.14, lng: -21.94, label: 'Reykjavík', photoId: null },
  { lat: 63.42, lng: -19.07, label: 'Vík', photoId: null },
  { lat: 65.68, lng: -18.12, label: 'Akureyri', photoId: null },
]

function map(over: Record<string, unknown> = {}): BookElement {
  return {
    id: 'mp1', kind: 'map', rotation: 0, opacity: 1, locked: false,
    font: 'sans', color: '#1a1a1a', accent: '#ffffff', textScale: 1, weight: 400, stale: false,
    frame: { x: 0, y: 0, w: 180, h: 140 },
    style: 'minimal', source: 'vector', tileUrl: '', attribution: '', zoom: null, clip: 'rect',
    showLand: true, showRoute: true, showPins: true, showLabels: false,
    routeStyle: 'drawn', routeArc: 'bow', routeDash: 'arcs', pinStyle: 'dot',
    countries: [], path: [], roads: [], fitPadding: 0.5, fitToCountries: false, tripId: null,
    points: STOPS,
    ...over,
  } as unknown as BookElement
}

function draw(el: BookElement) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements: [el], parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} big />)
}

const strokes = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).filter(p => p.getAttribute('fill') === 'none')

describe('a leg that has a road', () => {
  it('is drawn as the road rather than as a line between its ends', () => {
    const road: [number, number][] = [
      [64.14, -21.94], [64.0, -21.5], [63.8, -20.6], [63.5, -19.6], [63.42, -19.07],
    ]
    const { container } = draw(map({ roads: [road, null] }))
    const ds = strokes(container).map(p => p.getAttribute('d') ?? '')
    // A road is many points; a bow is one Q; a straight leg is one L.
    expect(ds.some(d => (d.match(/L/g) ?? []).length >= 3)).toBe(true)
  })

  it('is drawn solid and unbowed, because it is the way that was taken', () => {
    const road: [number, number][] = [
      [64.14, -21.94], [64.0, -21.5], [63.8, -20.6], [63.42, -19.07],
    ]
    const { container } = draw(map({ roads: [road, null] }))
    const roadPaths = strokes(container).filter(p => (p.getAttribute('d') ?? '').match(/L/g))
    for (const p of roadPaths) {
      expect(p.getAttribute('d')).not.toContain('Q')
      expect(p.getAttribute('stroke-dasharray')).toBeNull()
    }
  })

  /*
   * The bug this whole shape exists to avoid: `path` replaces the entire line,
   * so a partial answer used to mean a partial journey.
   */
  it('does not swallow the legs that have none', () => {
    const middle: [number, number][] = [
      [63.42, -19.07], [64.0, -18.5], [65.0, -18.2], [65.68, -18.12],
    ]
    const { container } = draw(map({ roads: [null, middle] }))
    const ds = strokes(container).map(p => p.getAttribute('d') ?? '')
    // The first leg is still drawn: either bowed or straight, but drawn.
    const hasFirstLeg = ds.some(d => d.includes('Q') || (d.match(/L/g) ?? []).length === 1)
    expect(hasFirstLeg).toBe(true)
    expect(ds.some(d => (d.match(/L/g) ?? []).length >= 2)).toBe(true)
  })

  it('is inside the frame, road and all', () => {
    // A road that wanders well north of both its ends.
    const road: [number, number][] = [
      [64.14, -21.94], [66.5, -21.0], [66.6, -19.5], [63.42, -19.07],
    ]
    const { container } = draw(map({ roads: [road, null] }))
    const numbers = strokes(container)
      .flatMap(p => (p.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? [])
      .map(Number)
    // Coordinates come in pairs; none of them may leave the 180x140 element.
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(-0.01)
      expect(numbers[i]).toBeLessThanOrEqual(180.01)
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(-0.01)
      expect(numbers[i + 1]).toBeLessThanOrEqual(140.01)
    }
  })
})

describe('what gets asked for', () => {
  beforeEach(() => {
    vi.mocked(calculateRouteWithLegs).mockReset()
  })

  it('asks once per leg and keeps the answer in leg order', async () => {
    vi.mocked(calculateRouteWithLegs).mockResolvedValue({
      coordinates: [[1, 1], [1.1, 1.1], [1.2, 1.2]],
      distance: 1, duration: 1, legs: [],
    } as never)

    const roads = await fetchRoads([
      { lat: 52.5, lng: 13.4 },
      { lat: 52.4, lng: 13.1 },
      { lat: 52.3, lng: 13.0 },
    ])
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    expect(roads).toHaveLength(2)
    expect(roads[0]).toHaveLength(3)
  })

  it('never asks about a leg long enough to have been a flight', async () => {
    const roads = await fetchRoads([
      { lat: 64.14, lng: -21.94 },
      { lat: -33.87, lng: 151.21 },
    ])
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
    expect(roads).toEqual([null])
  })

  it('leaves a leg alone when the router refuses, rather than failing the lot', async () => {
    vi.mocked(calculateRouteWithLegs)
      .mockRejectedValueOnce(new Error('no route'))
      .mockResolvedValueOnce({
        coordinates: [[1, 1], [1.1, 1.1], [1.2, 1.2]], distance: 1, duration: 1, legs: [],
      } as never)

    const roads = await fetchRoads([
      { lat: 52.5, lng: 13.4 },
      { lat: 52.4, lng: 13.1 },
      { lat: 52.3, lng: 13.0 },
    ])
    expect(roads[0]).toBeNull()
    expect(roads[1]).not.toBeNull()
  })

  it('keeps nothing when the answer is just the straight line back', async () => {
    vi.mocked(calculateRouteWithLegs).mockResolvedValue({
      coordinates: [[1, 1], [1.2, 1.2]], distance: 1, duration: 1, legs: [],
    } as never)
    const roads = await fetchRoads([{ lat: 52.5, lng: 13.4 }, { lat: 52.4, lng: 13.1 }])
    expect(roads).toEqual([null])
  })
})
