import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BookDocument, BookElement, BookPageSetup, BookSpread, JourneyStats } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { fireEvent, render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { StudioTravelPanel } from '../../../src/components/Studio/StudioTravelPanel'
import { useStudioStore } from '../../../src/store/studioStore'
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

  /*
   * A router answers a long drive with thousands of points, at a precision no
   * press can resolve, and all of it is stored in the document. That is not a
   * tidiness problem: the book is saved as one body, and a route kept whole is
   * what pushed a real book past the body limit and left the editor showing
   * "not saved" with no way forward.
   *
   * Thinned evenly rather than by cutting a run out of the middle, because a
   * road's shape is the reason to draw it at all — losing the middle would
   * straighten exactly the bends somebody wanted to see.
   */
  it('thins a long answer, keeping both ends and the shape between them', async () => {
    const many: [number, number][] = Array.from({ length: 900 }, (_, i) => [
      52.5 - i * 0.001,
      13.4 + i * 0.001,
    ])
    vi.mocked(calculateRouteWithLegs).mockResolvedValue({
      coordinates: many, distance: 1, duration: 1, legs: [],
    } as never)

    const roads = await fetchRoads([{ lat: 52.5, lng: 13.4 }, { lat: 51.6, lng: 14.3 }])
    const leg = roads[0]!
    expect(leg).not.toBeNull()
    expect(leg.length).toBe(120)

    // Both ends survive, so the line still meets the stops it runs between.
    expect(leg[0]).toEqual([52.5, 13.4])
    expect(leg[leg.length - 1]).toEqual([51.601, 14.299])

    // Evenly spaced: no two consecutive points sit further apart than one step.
    const gaps = leg.slice(1).map((p, i) => Math.abs(p[0] - leg[i][0]))
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.002)
  })

  it('leaves a leg the press can already resolve exactly as it came', async () => {
    const few: [number, number][] = Array.from({ length: 40 }, (_, i) => [
      52.5 - i * 0.01,
      13.4 + i * 0.01,
    ])
    vi.mocked(calculateRouteWithLegs).mockResolvedValue({
      coordinates: few, distance: 1, duration: 1, legs: [],
    } as never)

    const roads = await fetchRoads([{ lat: 52.5, lng: 13.4 }, { lat: 52.1, lng: 13.8 }])
    expect(roads[0]!.length).toBe(40)
  })
})

/**
 * The lookups outlive the click by design — they are paced so the router is not
 * hammered — so the panel has to take them with it when it goes.
 */
describe('placing a map from the panel', () => {
  const journeyStats = {
    journeyId: 1, distance: 0, days: 1, steps: 3, photos: 0, places: 3, furthest: 0,
    countries: [], trips: [], start: null, end: null,
    points: STOPS.map(p => ({ ...p, date: null, country: null, tripId: null })),
  } as unknown as JourneyStats

  beforeEach(() => {
    vi.mocked(calculateRouteWithLegs).mockReset()
    useStudioStore.getState().load({
      version: 1, title: 'T', page,
      spreads: [{ id: 's1', role: 'inner', background: null, elements: [], parked: [], entryId: null }],
    } as unknown as BookDocument)
  })

  it('drops the road lookup when the panel goes away', async () => {
    let asked: AbortSignal | undefined
    vi.mocked(calculateRouteWithLegs).mockImplementation((_stops, opts) => {
      asked = (opts as { signal?: AbortSignal } | undefined)?.signal
      return new Promise(() => {}) as never
    })

    const { getByTitle, unmount } = render(
      <StudioTravelPanel page={page} stats={journeyStats} path={[]} t={k => k} locale="en" />,
    )
    fireEvent.click(getByTitle('journey.studio.mapStyle.minimal'))
    await vi.waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalled())

    unmount()

    expect(asked?.aborted).toBe(true)
  })
})
