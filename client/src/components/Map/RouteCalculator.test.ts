import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import {
  calculateRoute,
  calculateSegments,
  optimizeRoute,
  generateGoogleMapsUrl,
} from './RouteCalculator'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

const buildOsrmRouteResponse = (distance = 5000, duration = 360) => ({
  code: 'Ok',
  routes: [
    {
      geometry: { coordinates: [[2.3522, 48.8566], [2.3600, 48.8600]] },
      distance,
      duration,
      legs: [{ distance, duration }],
    },
  ],
})

const wp1 = { lat: 48.8566, lng: 2.3522 }
const wp2 = { lat: 48.8600, lng: 2.3600 }

// ── calculateRoute ─────────────────────────────────────────────────────────────

describe('calculateRoute', () => {
  it('FE-COMP-ROUTECALCULATOR-001: throws when fewer than 2 waypoints', async () => {
    await expect(calculateRoute([wp1])).rejects.toThrow('At least 2 waypoints required')
  })

  it('FE-COMP-ROUTECALCULATOR-002: returns parsed coordinates on success', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json(buildOsrmRouteResponse())
      )
    )
    const result = await calculateRoute([wp1, wp2])
    expect(result.coordinates).toEqual([[48.8566, 2.3522], [48.8600, 2.3600]])
  })

  it('FE-COMP-ROUTECALCULATOR-003: returns formatted distance text for >= 1000 m', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json(buildOsrmRouteResponse(1500, 360))
      )
    )
    const result = await calculateRoute([wp1, wp2])
    expect(result.distanceText).toBe('1.5 km')
  })

  it('FE-COMP-ROUTECALCULATOR-004: returns formatted distance in meters for short routes', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json(buildOsrmRouteResponse(800, 360))
      )
    )
    const result = await calculateRoute([wp1, wp2])
    expect(result.distanceText).toBe('800 m')
  })

  it('FE-COMP-ROUTECALCULATOR-005: walking profile overrides duration with distance-based calculation', async () => {
    const distance = 5000
    const osrmDuration = 999
    server.use(
      http.get(`${OSRM_BASE}/walking/:coords`, () =>
        HttpResponse.json(buildOsrmRouteResponse(distance, osrmDuration))
      )
    )
    const result = await calculateRoute([wp1, wp2], 'walking')
    const expectedDuration = distance / (5000 / 3600)
    expect(result.duration).toBeCloseTo(expectedDuration)
    expect(result.duration).not.toBe(osrmDuration)
  })

  it('FE-COMP-ROUTECALCULATOR-006: throws when OSRM returns non-ok HTTP status', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    await expect(calculateRoute([wp1, wp2])).rejects.toThrow('Route could not be calculated')
  })

  it('FE-COMP-ROUTECALCULATOR-007: throws when OSRM code is not Ok', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json({ code: 'NoRoute', routes: [] })
      )
    )
    await expect(calculateRoute([wp1, wp2])).rejects.toThrow('No route found')
  })

  it('FE-COMP-ROUTECALCULATOR-008: respects AbortSignal', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json(buildOsrmRouteResponse())
      )
    )
    const controller = new AbortController()
    controller.abort()
    await expect(calculateRoute([wp1, wp2], 'driving', { signal: controller.signal })).rejects.toThrow()
  })
})

// ── calculateSegments ──────────────────────────────────────────────────────────

describe('calculateSegments', () => {
  it('FE-COMP-ROUTECALCULATOR-009: returns empty array for fewer than 2 waypoints', async () => {
    const result = await calculateSegments([wp1])
    expect(result).toEqual([])
  })

  it('FE-COMP-ROUTECALCULATOR-010: returns segment midpoints and travel times', async () => {
    server.use(
      http.get(`${OSRM_BASE}/driving/:coords`, () =>
        HttpResponse.json({
          code: 'Ok',
          routes: [
            {
              legs: [{ distance: 1000, duration: 120 }],
            },
          ],
        })
      )
    )
    const result = await calculateSegments([wp1, wp2])
    expect(result).toHaveLength(1)
    const seg = result[0]
    const expectedMid: [number, number] = [
      (wp1.lat + wp2.lat) / 2,
      (wp1.lng + wp2.lng) / 2,
    ]
    expect(seg.mid[0]).toBeCloseTo(expectedMid[0])
    expect(seg.mid[1]).toBeCloseTo(expectedMid[1])
    expect(seg.drivingText).toBe('2 min')
  })
})

// ── optimizeRoute ──────────────────────────────────────────────────────────────

describe('optimizeRoute', () => {
  it('FE-COMP-ROUTECALCULATOR-011: returns input unchanged for 2 or fewer places', () => {
    const places = [wp1, wp2]
    const result = optimizeRoute(places)
    expect(result).toHaveLength(2)
    expect(result).toBe(places)
  })

  it('FE-COMP-ROUTECALCULATOR-012: nearest-neighbor reorders 3 waypoints correctly', () => {
    // Note: filter uses `p.lat && p.lng`, so avoid zero values
    const a = { lat: 1, lng: 1 }
    const b = { lat: 10, lng: 1 }
    const c = { lat: 2, lng: 1 }
    const result = optimizeRoute([a, b, c])
    // Starting from a(1,1), nearest is c(2,1) (dist=1), then b(10,1) (dist=8)
    expect(result[0]).toEqual(a)
    expect(result[1]).toEqual(c)
    expect(result[2]).toEqual(b)
  })

  it('FE-COMP-ROUTECALCULATOR-016: start anchor begins the chain at the anchor-nearest stop', () => {
    const a = { lat: 10, lng: 1 }
    const b = { lat: 2, lng: 1 }
    const c = { lat: 5, lng: 1 }
    // From the accommodation anchor (1,1): nearest is b(2,1), then c(5,1), then a(10,1)
    const result = optimizeRoute([a, b, c], { start: { lat: 1, lng: 1 } })
    expect(result).toEqual([b, c, a])
  })

  it('FE-COMP-ROUTECALCULATOR-017: start + end anchors reorder a shuffled day and keep the end-nearest stop last', () => {
    const a = { lat: 2, lng: 1 }
    const b = { lat: 5, lng: 1 }
    const c = { lat: 8, lng: 1 }
    // Transfer day: start at hotel A (1,1), end at hotel B (9,1). c is nearest B, so it must be last.
    const result = optimizeRoute([c, a, b], { start: { lat: 1, lng: 1 }, end: { lat: 9, lng: 1 } })
    expect(result).toEqual([a, b, c])
  })

  it('FE-COMP-ROUTECALCULATOR-018: an anchor makes even a two-stop day sortable', () => {
    const a = { lat: 10, lng: 1 }
    const b = { lat: 2, lng: 1 }
    // Without anchors two stops are returned unchanged; the start anchor orders them by proximity.
    const result = optimizeRoute([a, b], { start: { lat: 1, lng: 1 } })
    expect(result).toEqual([b, a])
  })

  it('FE-COMP-ROUTECALCULATOR-019: 2-opt untangles a round-trip into a clean loop around the hotel', () => {
    const hotel = { lat: 48.8668, lng: 2.3013 } // Rue Marbeuf
    const stops = [
      { id: 1, lat: 48.8565, lng: 2.3324 },
      { id: 2, lat: 48.8813, lng: 2.3151 },
      { id: 3, lat: 48.8796, lng: 2.308 },
      { id: 4, lat: 48.8723, lng: 2.2926 },
      { id: 5, lat: 48.866, lng: 2.3102 }, // nearest the hotel
    ]
    const d = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
      Math.hypot(a.lat - b.lat, a.lng - b.lng)
    const loop = (order: typeof stops) =>
      d(hotel, order[0]) + order.slice(1).reduce((s, p, i) => s + d(order[i], p), 0) + d(order[order.length - 1], hotel)

    const result = optimizeRoute(stops, { start: hotel, end: hotel })
    // The optimized loop is no longer than the original order…
    expect(loop(result)).toBeLessThanOrEqual(loop(stops) + 1e-9)
    // …and the hotel-adjacent stop sits at one end of the loop, right next to the hotel.
    expect([result[0].id, result[result.length - 1].id]).toContain(5)
  })

  it('FE-COMP-ROUTECALCULATOR-020: an end anchor without a start finishes at the stop nearest it', () => {
    const a = { lat: 2, lng: 1 }
    const b = { lat: 5, lng: 1 }
    const c = { lat: 9, lng: 1 }
    // a is nearest the end anchor, so the route must finish at a rather than start there.
    const result = optimizeRoute([a, b, c], { end: { lat: 1, lng: 1 } })
    expect(result[result.length - 1]).toEqual(a)
  })
})

// ── generateGoogleMapsUrl ──────────────────────────────────────────────────────

describe('generateGoogleMapsUrl', () => {
  it('FE-COMP-ROUTECALCULATOR-013: returns null for empty places', () => {
    expect(generateGoogleMapsUrl([])).toBeNull()
  })

  it('FE-COMP-ROUTECALCULATOR-014: single place returns search URL', () => {
    const result = generateGoogleMapsUrl([{ lat: 48.85, lng: 2.35 }])
    expect(result).toBe('https://www.google.com/maps/search/?api=1&query=48.85,2.35')
  })

  it('FE-COMP-ROUTECALCULATOR-015: multiple places returns directions URL', () => {
    const result = generateGoogleMapsUrl([
      { lat: 48.85, lng: 2.35 },
      { lat: 48.86, lng: 2.36 },
    ])
    expect(result).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//)
    expect(result).toContain('48.85,2.35')
    expect(result).toContain('48.86,2.36')
  })
})
