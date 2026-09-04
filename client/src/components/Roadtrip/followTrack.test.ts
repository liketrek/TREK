import { describe, it, expect } from 'vitest'
import { haversineKm, type LatLng } from './corridor'
import {
  parseTrack, lineLengthKm, thin, nearestIndex, orient, stopIndices, trackGapKm, planTrack,
} from './followTrack'

/**
 * The refinement is the interesting part, and it is testable without a router: what it
 * needs is something that answers "the road I would drive through these waypoints", and
 * the straight line between them is exactly the answer that makes the loop work for its
 * living. A track that bulges away from that chord is the shape every scenic route has.
 */

/** A track arching north away from the straight line between its ends. */
function arc(points = 120, bulgeDeg = 0.1): LatLng[] {
  return Array.from({ length: points + 1 }, (_, i) => ({
    lat: 52 + bulgeDeg * Math.sin((Math.PI * i) / points),
    lng: 13 + i / points,
  }))
}

const START: LatLng = { lat: 52, lng: 13 }
const END: LatLng = { lat: 52, lng: 14 }

/** A router with no idea about roads: it drives straight from waypoint to waypoint. */
function straightRouter(): { route: (w: LatLng[]) => Promise<LatLng[]>; calls: LatLng[][] } {
  const calls: LatLng[][] = []
  return {
    calls,
    route: async (waypoints: LatLng[]) => {
      calls.push(waypoints)
      return waypoints
    },
  }
}

describe('parseTrack', () => {
  it('FE-FOLLOWTRACK-001: reads pairs and triples, and steps over what is neither', () => {
    const geometry = JSON.stringify([[52, 13], [52.1, 13.1, 340], ['x', 1], [1], null, [53, 14]])
    expect(parseTrack(geometry)).toEqual([
      { lat: 52, lng: 13 },
      { lat: 52.1, lng: 13.1 },
      { lat: 53, lng: 14 },
    ])
  })

  it('FE-FOLLOWTRACK-002: a track that is not a track is nothing, never a throw', () => {
    // Somebody else's column, filled by an importer that has seen every malformed GPX
    // there is. A day that cannot follow a track is a day; an exception here is a page.
    expect(parseTrack('not json')).toEqual([])
    expect(parseTrack('{"type":"LineString"}')).toEqual([])
    expect(parseTrack(null)).toEqual([])
    expect(parseTrack(undefined)).toEqual([])
  })
})

describe('thinning and measuring', () => {
  it('FE-FOLLOWTRACK-003: thinning keeps both ends, whatever the stride', () => {
    const line = arc(1000)
    const thinned = thin(line, 400)
    expect(thinned.length).toBeLessThanOrEqual(401)
    expect(thinned[0]).toEqual(line[0])
    expect(thinned[thinned.length - 1]).toEqual(line[line.length - 1])
  })

  it('FE-FOLLOWTRACK-004: a line shorter than the cap comes back untouched', () => {
    const line = arc(10)
    expect(thin(line, 400)).toBe(line)
  })

  it('FE-FOLLOWTRACK-005: an arc is longer than the chord it spans', () => {
    expect(lineLengthKm(arc())).toBeGreaterThan(haversineKm(START, END))
  })

  it('FE-FOLLOWTRACK-006: the nearest point of a track is found by position, not by order', () => {
    const line = arc(20)
    expect(nearestIndex(line, line[7])).toBe(7)
  })
})

describe('orientation', () => {
  it('FE-FOLLOWTRACK-007: a track recorded the other way round is turned', () => {
    // Half of Norway's scenic routes are published southbound. Without this the vias come
    // out in reverse order and the day drives the loop backwards.
    const backwards = [...arc(20)].reverse()
    const turned = orient(backwards, [START, END])
    expect(turned[0].lng).toBeLessThan(turned[turned.length - 1].lng)
  })

  it('FE-FOLLOWTRACK-008: a track already pointing the right way is left alone', () => {
    const line = arc(20)
    expect(orient(line, [START, END])).toBe(line)
  })

  it('FE-FOLLOWTRACK-009: stops never walk backwards along the track', () => {
    // A track that doubles back has two nearest points for the same stop, and the wrong
    // one would put a via on the leg before it.
    const line = arc(40)
    const stops = [START, { lat: 52.05, lng: 13.5 }, END]
    const idx = stopIndices(line, stops)
    expect(idx[0]).toBeLessThanOrEqual(idx[1])
    expect(idx[1]).toBeLessThanOrEqual(idx[2])
  })
})

describe('planTrack', () => {
  it('FE-FOLLOWTRACK-010: a road that already follows the track needs no vias', async () => {
    const track = arc()
    const plan = await planTrack({ track, stops: [START, END], route: async () => track })
    expect(plan.vias).toEqual([])
    expect(plan.rounds).toBe(1)
    expect(plan.capped).toBe(false)
    // Still names the leg it runs along, so applying it clears what an earlier pass left.
    expect(plan.legs).toEqual([0])
  })

  it('FE-FOLLOWTRACK-011: it refines until the road is inside the tolerance', async () => {
    const { route, calls } = straightRouter()
    const plan = await planTrack({ track: arc(), stops: [START, END], route, options: { toleranceKm: 1 } })

    expect(plan.capped).toBe(false)
    expect(plan.strayKm).toBeLessThanOrEqual(1)
    expect(plan.vias.length).toBeGreaterThan(0)
    // One route per round, and the waypoint list grows by exactly the via just added.
    expect(calls.length).toBe(plan.rounds)
    expect(calls[calls.length - 1].length).toBe(2 + plan.vias.length)
  })

  it('FE-FOLLOWTRACK-012: every via lands on the track, in driving order', async () => {
    const { route } = straightRouter()
    const track = arc()
    const plan = await planTrack({ track, stops: [START, END], route, options: { toleranceKm: 1 } })

    for (const via of plan.vias) {
      expect(track.some(p => haversineKm(p, via) < 0.001)).toBe(true)
    }
    const longitudes = plan.vias.map(v => v.lng)
    expect([...longitudes].sort((a, b) => a - b)).toEqual(longitudes)
  })

  it('FE-FOLLOWTRACK-013: no via is laid down on top of a stop', async () => {
    // A via a hundred metres from a stop costs a waypoint to tell the router what the
    // stop already told it.
    const { route } = straightRouter()
    const plan = await planTrack({ track: arc(), stops: [START, END], route, options: { toleranceKm: 0.2, maxVias: 8 } })
    for (const via of plan.vias) {
      expect(haversineKm(via, START)).toBeGreaterThanOrEqual(0.6)
      expect(haversineKm(via, END)).toBeGreaterThanOrEqual(0.6)
    }
  })

  it('FE-FOLLOWTRACK-014: a via hangs behind the stop whose leg it shapes', async () => {
    const { route } = straightRouter()
    // Three stops, and the bulge is entirely on the second leg.
    const straight: LatLng[] = Array.from({ length: 40 }, (_, i) => ({ lat: 52, lng: 13 + i / 78 }))
    const bulge: LatLng[] = Array.from({ length: 81 }, (_, i) => ({
      lat: 52 + 0.1 * Math.sin((Math.PI * i) / 80),
      lng: 13.5 + i / 160,
    }))
    const middle: LatLng = { lat: 52, lng: 13.5 }
    const plan = await planTrack({
      track: [...straight, ...bulge],
      stops: [START, middle, END],
      route,
      options: { toleranceKm: 1 },
    })

    expect(plan.vias.length).toBeGreaterThan(0)
    expect(plan.vias.every(v => v.after_order_index === 1)).toBe(true)
    expect(plan.legs).toEqual([0, 1])
  })

  it('FE-FOLLOWTRACK-015: it gives up rather than spending the day on a road that will not fit', async () => {
    const { route, calls } = straightRouter()
    const plan = await planTrack({
      track: arc(),
      stops: [START, END],
      route,
      options: { toleranceKm: 0.0001, maxVias: 3 },
    })

    expect(plan.capped).toBe(true)
    expect(plan.vias).toHaveLength(3)
    expect(calls.length).toBe(4)
  })

  it('FE-FOLLOWTRACK-016: a track the day only brushes past is not a route for it', async () => {
    const { route, calls } = straightRouter()
    const plan = await planTrack({ track: [{ lat: 40, lng: 2 }, { lat: 40.001, lng: 2.001 }], stops: [START, END], route })
    expect(plan.vias).toEqual([])
    expect(plan.legs).toEqual([])
    // Never asks the router about a track that has nothing to do with the day.
    expect(calls).toHaveLength(0)
  })

  it('FE-FOLLOWTRACK-017: nothing to route through is not an error', async () => {
    const { route } = straightRouter()
    expect((await planTrack({ track: arc(), stops: [START], route })).vias).toEqual([])
    expect((await planTrack({ track: [], stops: [START, END], route })).vias).toEqual([])
  })

  it('FE-FOLLOWTRACK-018: a router that answers with no road says so', async () => {
    await expect(planTrack({ track: arc(), stops: [START, END], route: async () => [] }))
      .rejects.toThrow(/road/)
  })

  it('FE-FOLLOWTRACK-019: an aborted plan stops where it is', async () => {
    const controller = new AbortController()
    const plan = await planTrack({
      track: arc(),
      stops: [START, END],
      route: async () => [START, END],
      signal: controller.signal,
      options: { toleranceKm: 0.001 },
    })
    controller.abort()
    // Ran to its own conclusion here; the point is that the signal is honoured at the top
    // of each round, which the aborted-before-start case proves.
    expect(plan.rounds).toBeGreaterThan(0)

    const stopped = new AbortController()
    stopped.abort()
    const none = await planTrack({
      track: arc(),
      stops: [START, END],
      route: async () => [START, END],
      signal: stopped.signal,
    })
    expect(none.rounds).toBe(0)
  })

  it('FE-FOLLOWTRACK-020: how far a track runs from a day is what orders a list of them', async () => {
    const near = trackGapKm(arc(), [START, END])
    const far = trackGapKm(arc().map(p => ({ lat: p.lat + 3, lng: p.lng })), [START, END])
    expect(near).toBeLessThan(far)
    expect(trackGapKm([], [START])).toBe(Number.POSITIVE_INFINITY)
  })
})
