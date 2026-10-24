import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { valhallaBase, valhallaRun, valhallaRunOnFoot, valhallaTurn } = vi.hoisted(() => ({
  valhallaBase: vi.fn(),
  valhallaRun: vi.fn(),
  valhallaRunOnFoot: vi.fn(),
  valhallaTurn: vi.fn(async () => {}),
}))

vi.mock('../../Map/valhallaRoute', () => ({
  valhallaBase,
  valhallaRun,
  valhallaRunOnFoot,
  valhallaTurn,
}))

import { enrichTourElevations, parseValhallaElevation, routeBikeTour, routeCityWalk, routeRun, routeWalkingTour, type TourRouteResult } from './tourRouting'

/** A route as the planner reads it, for the cases that expect one. */
const route = async (...args: Parameters<typeof routeWalkingTour>) => (await routeWalkingTour(...args)) as TourRouteResult | null

const waypoints = [
  { lat: 47.3822621, lng: 10.9888935 },
  { lat: 47.3896073, lng: 11.0089761 },
]

describe('routeWalkingTour', () => {
  beforeEach(() => {
    valhallaRun.mockReset().mockResolvedValue(null)
    valhallaBase.mockReset().mockReturnValue('https://valhalla.test')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('TOUR-ROUTING-001: explicitly admits T2 mountain_hiking trails for Tours only', async () => {
    await routeWalkingTour(waypoints)

    expect(valhallaRun).toHaveBeenCalledWith(waypoints, 'walking', [], undefined, {
      max_hiking_difficulty: 2,
    })
  })

  it('TOUR-ROUTING-030: asks the router for the preferences of a hike beside its limit (MF-08)', async () => {
    await routeWalkingTour(waypoints, undefined, 3, { avoid_climbs: true, avoid_steps: true })

    expect(valhallaRun).toHaveBeenCalledWith(waypoints, 'walking', [], undefined, {
      max_hiking_difficulty: 3,
      use_hills: 0.2,
      step_penalty: 600,
    })
  })

  it('TOUR-ROUTING-020: takes a fixed leg as its own line and routes only the runs around it', async () => {
    const leg = {
      kind: 'ferrata' as const,
      ref: 'way/1',
      name: 'Via A',
      geometry: [[47.39, 11.01], [47.391, 11.011], [47.392, 11.012]] as [number, number][],
    }
    valhallaRun
      .mockResolvedValueOnce({ total: { coordinates: [[47.38, 11.0], [47.39, 11.01]], distance: 1500, duration: 1200 }, snapped: [] })
      .mockResolvedValueOnce({ total: { coordinates: [[47.392, 11.012], [47.4, 11.02]], distance: 1000, duration: 800 }, snapped: [] })

    const routed = await route([
      { lat: 47.38, lng: 11.0 },
      { lat: 47.39, lng: 11.01, fixedLeg: leg },
      { lat: 47.392, lng: 11.012 },
      { lat: 47.4, lng: 11.02 },
    ])

    expect(valhallaRun).toHaveBeenCalledTimes(2)
    expect(valhallaRun.mock.calls[0]?.[0]).toEqual([{ lat: 47.38, lng: 11.0 }, { lat: 47.39, lng: 11.01 }])
    expect(valhallaRun.mock.calls[1]?.[0]).toEqual([{ lat: 47.392, lng: 11.012 }, { lat: 47.4, lng: 11.02 }])
    expect(routed?.coordinates).toEqual([[47.38, 11.0], [47.39, 11.01], [47.391, 11.011], [47.392, 11.012], [47.4, 11.02]])
    expect(routed?.distanceMeters).toBeGreaterThan(2500)
  })

  it('TOUR-ROUTING-021: a tour that is all fixed leg asks the router nothing, and a failed run fails the whole route', async () => {
    const leg = { kind: 'ferrata' as const, ref: 'way/1', name: null, geometry: [[47.39, 11.01], [47.392, 11.012]] as [number, number][] }
    const fixedOnly = await route([{ lat: 47.39, lng: 11.01, fixedLeg: leg }, { lat: 47.392, lng: 11.012 }])
    expect(valhallaRun).not.toHaveBeenCalled()
    expect(fixedOnly?.coordinates).toEqual([[47.39, 11.01], [47.392, 11.012]])

    valhallaRun.mockResolvedValueOnce(null)
    expect(await routeWalkingTour([{ lat: 47.38, lng: 11.0 }, { lat: 47.39, lng: 11.01, fixedLeg: leg }, { lat: 47.392, lng: 11.012 }])).toBeNull()
  })

  it('TOUR-ROUTING-022: hand-drawn legs ask no router and come back as their own parts, routed runs as theirs', async () => {
    const free = (from: [number, number], to: [number, number]) => ({ kind: 'free' as const, geometry: [from, to] })
    valhallaRun.mockResolvedValueOnce({ total: { coordinates: [[47.392, 11.012], [47.395, 11.015], [47.4, 11.02]], distance: 900, duration: 700 }, snapped: [] })

    const routed = await route([
      { lat: 47.38, lng: 11.0, fixedLeg: free([47.38, 11.0], [47.39, 11.01]) },
      { lat: 47.39, lng: 11.01, fixedLeg: free([47.39, 11.01], [47.392, 11.012]) },
      { lat: 47.392, lng: 11.012 },
      { lat: 47.4, lng: 11.02 },
    ])

    expect(valhallaRun).toHaveBeenCalledTimes(1)
    expect(routed?.parts.map(part => part.free)).toEqual([true, false])
    // The drawn stretch is sampled along its length, from its first point through the waypoint between to its last.
    const drawn = routed?.parts[0].coordinates ?? []
    expect(drawn[0]).toEqual([47.38, 11.0])
    expect(drawn).toContainEqual([47.39, 11.01])
    expect(drawn[drawn.length - 1]).toEqual([47.392, 11.012])
    expect(drawn.length).toBeGreaterThan(50)
    expect(routed?.parts[1].coordinates).toEqual([[47.392, 11.012], [47.395, 11.015], [47.4, 11.02]])
    expect(routed?.coordinates[routed.coordinates.length - 1]).toEqual([47.4, 11.02])
  })

  it('TOUR-ROUTING-023: a tour drawn wholly by hand, a paddle tour, never asks the router', async () => {
    const free = (from: [number, number], to: [number, number]) => ({ kind: 'free' as const, geometry: [from, to] })
    const routed = await route([
      { lat: 53.3, lng: 12.9, fixedLeg: free([53.3, 12.9], [53.31, 12.92]) },
      { lat: 53.31, lng: 12.92 },
    ])
    expect(valhallaRun).not.toHaveBeenCalled()
    expect(routed?.parts).toHaveLength(1)
    expect(routed?.parts[0]).toMatchObject({ free: true })
    expect(routed?.parts[0].coordinates[0]).toEqual([53.3, 12.9])
    const line = routed?.parts[0].coordinates ?? []
    expect(line[line.length - 1]).toEqual([53.31, 12.92])
    expect(routed?.distanceMeters).toBeGreaterThan(1500)
  })

  it.each([1, 2, 3, 4, 5, 6] as const)('TOUR-ROUTING-002: forwards T%i unchanged to Valhalla', async difficulty => {
    await routeWalkingTour(waypoints, undefined, difficulty)

    expect(valhallaRun).toHaveBeenCalledWith(waypoints, 'walking', [], undefined, {
      max_hiking_difficulty: difficulty,
    })
  })

  it.each([
    [0, 0],
    [123.5, 123.5],
    [-42.25, -42.25],
  ])('accepts finite numeric Valhalla elevation %s', (input, expected) => {
    expect(parseValhallaElevation(input)).toBe(expected)
  })

  it.each([null, undefined, '', ' ', '\t', '123', true, false, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '12m', {}, []])(
    'preserves invalid Valhalla elevation as missing for %s', value => {
      expect(parseValhallaElevation(value)).toBeNull()
    },
  )

  it('keeps valid route coordinates and explicit missing samples when height data is partial', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ range_height: [[0, 0], [1, null], [2, ' ']] }),
    }))
    const coordinates: [number, number][] = [[48, 11], [48.01, 11.01], [48.02, 11.02]]

    await expect(enrichTourElevations(coordinates)).resolves.toEqual([
      [48, 11, 0], [48.01, 11.01], [48.02, 11.02],
    ])
  })

  it('waits for its turn at the host before every height question', async () => {
    const order: string[] = []
    valhallaTurn.mockImplementation(async () => { order.push('turn') })
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
      order.push('fetch')
      const shape = (JSON.parse(init.body) as { shape: unknown[] }).shape
      return { ok: true, json: async () => ({ range_height: shape.map((_, i) => [i, 100]) }) }
    }))
    const coordinates = Array.from({ length: 600 }, (_, i) => [48 + i / 1000, 11] as [number, number])

    const result = await enrichTourElevations(coordinates)

    expect(order).toEqual(['turn', 'fetch', 'turn', 'fetch'])
    expect(valhallaTurn).toHaveBeenCalledWith('https://valhalla.test', undefined)
    expect(result!.every(point => point.length === 3)).toBe(true)
  })

  it('asks nothing once the caller gave up while waiting for its turn', async () => {
    const controller = new AbortController()
    valhallaTurn.mockImplementation(async () => { controller.abort() })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await expect(enrichTourElevations([[48, 11], [48.01, 11.01]], controller.signal)).resolves.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the full route as 2D geometry when height enrichment is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    const coordinates: [number, number][] = [[48, 11], [48.01, 11.01]]

    await expect(enrichTourElevations(coordinates)).resolves.toEqual(coordinates)
  })
})

describe('routing on land, bike profiles and unreachable points (BIK-01)', () => {
  beforeEach(() => {
    valhallaRun.mockReset().mockResolvedValue(null)
    valhallaBase.mockReset().mockReturnValue('https://valhalla.test')
  })

  const run = (snappedMeters: number[]) => ({
    total: { coordinates: [[47, 11], [47.01, 11.01]], distance: 1500, duration: 300 },
    snapped: snappedMeters.map((meters) => ({ asked: [47, 11], at: [47, 11], meters })),
  })

  it('TOUR-ROUTING-030: asks the bicycle costing with each profile\'s own options', async () => {
    valhallaRun.mockResolvedValue(run([3, 4]))
    for (const profile of ['touring', 'road', 'gravel', 'mtb'] as const) {
      await routeBikeTour(waypoints, profile)
    }
    expect(valhallaRun.mock.calls.map((call) => [call[1], (call[4] as { bicycle_type: string }).bicycle_type])).toEqual([
      ['cycling', 'Hybrid'],
      ['cycling', 'Road'],
      ['cycling', 'Cross'],
      ['cycling', 'Mountain'],
    ])
  })

  it('TOUR-ROUTING-031: a point the router could only bind far off is named, not routed to', async () => {
    valhallaRun.mockResolvedValueOnce(run([12, 2900]))
    expect(await routeBikeTour(waypoints, 'touring')).toEqual({ unreachable: 1, snappedMeters: 2900 })
    // Within the limit the route stands.
    valhallaRun.mockResolvedValueOnce(run([12, 280]))
    expect(await routeBikeTour(waypoints, 'touring')).toMatchObject({ distanceMeters: 1500 })
  })

  it('TOUR-ROUTING-032: a point after a fixed leg is counted along the whole tour', async () => {
    const free = { kind: 'free' as const, geometry: [[47.39, 11.01], [47.392, 11.012]] as [number, number][] }
    valhallaRun.mockResolvedValueOnce(run([400, 5]))
    expect(
      await routeWalkingTour([{ lat: 47.39, lng: 11.01, fixedLeg: free }, { lat: 47.392, lng: 11.012 }, { lat: 47.4, lng: 11.02 }])
    ).toEqual({ unreachable: 1, snappedMeters: 400 })
  })

  it('TOUR-ROUTING-033: a city walk goes on foot with no hiking limit, no choice of a hike, and avoids ferries (CW-01)', async () => {
    valhallaRunOnFoot.mockResolvedValueOnce(run([3, 4]))
    expect(await routeCityWalk(waypoints)).toMatchObject({ distanceMeters: 1500, durationSeconds: 300 })
    // CW-12: and binds no stop to a boat line.
    expect(valhallaRunOnFoot).toHaveBeenCalledWith(waypoints, undefined, { use_ferry: 0 }, { exclude_ferry: true })
    expect(valhallaRun).not.toHaveBeenCalled()
  })

  it('TOUR-ROUTING-034: a run goes on foot, keeps off tracks and ferries where it can, with no hiking limit (RUN-01)', async () => {
    valhallaRun.mockResolvedValueOnce(run([3, 4]))
    const signal = new AbortController().signal
    expect(await routeRun(waypoints, 'running', signal)).toMatchObject({ distanceMeters: 1500 })
    expect(valhallaRun).toHaveBeenCalledWith(waypoints, 'walking', [], signal, { use_tracks: 0, use_ferry: 0 })
    // A point no runnable way reaches is named, as for any tour on land.
    valhallaRun.mockResolvedValueOnce(run([3, 900]))
    expect(await routeRun(waypoints, 'running')).toEqual({ unreachable: 1, snappedMeters: 900 })
  })

  it('TOUR-ROUTING-035: a trail run asks for tracks and natural paths, up to mountain paths, and still no ferry (RUN-02)', async () => {
    valhallaRun.mockResolvedValueOnce(run([3, 4]))
    expect(await routeRun(waypoints, 'trail')).toMatchObject({ distanceMeters: 1500 })
    expect(valhallaRun).toHaveBeenCalledWith(waypoints, 'walking', [], undefined, {
      use_tracks: 1,
      use_ferry: 0,
      max_hiking_difficulty: 2,
    })
  })
})

describe('a city walk across the water (CW-12)', () => {
  beforeEach(() => {
    valhallaRun.mockReset().mockResolvedValue(null)
    valhallaRunOnFoot.mockReset().mockResolvedValue(null)
    valhallaBase.mockReset().mockReturnValue('https://valhalla.test')
  })

  // The reported walk from Piazza San Marco: the second leg crosses on the boat from point 1 to point 2 of its line.
  const sanMarco = { lat: 45.4342798, lng: 12.338111 }
  const saoneri = { lat: 45.4367609, lng: 12.3287531 }
  const moresco = { lat: 45.4361113, lng: 12.3214155 }
  const walkedLeg = { coordinates: [[45.4343, 12.3381], [45.4355, 12.333], [45.4368, 12.3288]], distance: 900, duration: 650, hasFerry: false }
  const boatLeg = {
    coordinates: [[45.4368, 12.3288], [45.4352, 12.3275], [45.4331, 12.3262], [45.4361, 12.3214]],
    distance: 1800,
    duration: 1100,
    hasFerry: true,
    ferrySpans: [{ from: 1, to: 2, metres: 1236, seconds: 745 }],
  }
  const crossingRun = {
    legs: [walkedLeg, boatLeg],
    total: {
      coordinates: [...walkedLeg.coordinates, ...boatLeg.coordinates.slice(1)],
      distance: 2700,
      duration: 1750,
      ferrySpans: [{ from: 3, to: 4, metres: 1236, seconds: 745 }],
    },
    snapped: [3, 4, 5].map((meters) => ({ asked: [0, 0], at: [0, 0], meters })),
  }

  it('TOUR-ROUTING-036: a crossing the router still takes is its own part, out of the walking time and named on its leg', async () => {
    valhallaRunOnFoot.mockResolvedValueOnce(crossingRun)
    const routed = (await routeCityWalk([sanMarco, saoneri, moresco])) as TourRouteResult

    expect(routed.parts.map((part) => [part.coordinates.length, part.mark ?? null])).toEqual([[4, null], [2, 'ferry'], [2, null]])
    // 1750 s routed, of which the boat's 745 s are no walking.
    expect(routed.durationSeconds).toBe(1005)
    expect(routed.distanceMeters).toBe(2700)
    expect(routed.ferries).toEqual([
      { leg: 1, geometry: boatLeg.coordinates, crossings: [[1, 2]], metres: 1236, seconds: 745, walkSeconds: 355, accepted: false },
    ])
  })

  it('TOUR-ROUTING-037: a walk over the bridges carries no crossing, and a hike is never bound off the boat lines', async () => {
    valhallaRunOnFoot.mockResolvedValueOnce({ ...crossingRun, legs: [walkedLeg], total: { coordinates: walkedLeg.coordinates, distance: 900, duration: 650 } })
    const routed = (await routeCityWalk([sanMarco, saoneri])) as TourRouteResult
    expect(routed).not.toHaveProperty('ferries')
    expect(routed.durationSeconds).toBe(650)

    valhallaRun.mockResolvedValueOnce(crossingRun)
    const hike = (await routeWalkingTour([sanMarco, saoneri, moresco])) as TourRouteResult
    expect(valhallaRun.mock.calls[0]).toHaveLength(5)
    expect(hike).not.toHaveProperty('ferries')
    expect(hike.durationSeconds).toBe(1750)
  })

  it('TOUR-ROUTING-038: a ferry leg taken on purpose keeps its line and its walk, the router asked only around it', async () => {
    const ferry = {
      kind: 'ferry' as const,
      geometry: boatLeg.coordinates as [number, number][],
      crossings: [[1, 2]] as [number, number][],
      minutes: 12,
      walk_minutes: 6,
    }
    valhallaRunOnFoot.mockResolvedValueOnce({ total: { coordinates: walkedLeg.coordinates, distance: 900, duration: 650 }, legs: [walkedLeg], snapped: [] })
    const routed = (await routeCityWalk([sanMarco, { ...saoneri, fixedLeg: ferry }, moresco])) as TourRouteResult

    expect(valhallaRunOnFoot).toHaveBeenCalledTimes(1)
    expect(routed.durationSeconds).toBe(650 + 6 * 60)
    expect(routed.parts.map((part) => part.mark ?? null)).toEqual([null, 'ferry', null])
    expect(routed.ferries).toMatchObject([{ leg: 1, crossings: [[1, 2]], seconds: 720, walkSeconds: 360, accepted: true }])
  })

  it('TOUR-ROUTING-041: two boats on one leg stay two crossings, the walk between them walking, before and after they are taken', async () => {
    const line = [[45.4368, 12.3288], [45.4352, 12.3275], [45.4331, 12.3262], [45.434, 12.325], [45.4345, 12.323], [45.4361, 12.3214]]
    const twoBoats = { coordinates: line, distance: 2000, duration: 1200, hasFerry: true,
      ferrySpans: [{ from: 0, to: 1, metres: 200, seconds: 120 }, { from: 3, to: 4, metres: 150, seconds: 90 }] }
    valhallaRunOnFoot.mockResolvedValueOnce({ legs: [twoBoats], total: twoBoats, snapped: [3, 4].map((meters) => ({ asked: [0, 0], at: [0, 0], meters })) })
    const routed = (await routeCityWalk([saoneri, moresco])) as TourRouteResult
    expect(routed.ferries?.[0]).toMatchObject({ crossings: [[0, 1], [3, 4]], metres: 350, seconds: 210, walkSeconds: 990 })
    const drawn = routed.parts.map((part) => [part.coordinates.length, part.mark ?? null])
    expect(drawn).toEqual([[2, 'ferry'], [3, null], [2, 'ferry'], [2, null]])

    valhallaRunOnFoot.mockReset()
    const taken = { kind: 'ferry' as const, geometry: line as [number, number][], crossings: [[0, 1], [3, 4]] as [number, number][], minutes: 4, walk_minutes: 17 }
    const kept = (await routeCityWalk([{ ...saoneri, fixedLeg: taken }, moresco])) as TourRouteResult
    expect(kept.parts.map((part) => [part.coordinates.length, part.mark ?? null])).toEqual(drawn)
    expect(kept.ferries?.[0]).toMatchObject({ crossings: [[0, 1], [3, 4]], accepted: true })
  })

  const answered = { total: { coordinates: [[0, 0], [1, 1]], distance: 1, duration: 1 }, legs: [], snapped: [] }
  const noPath = { noPath: true }
  const stops = [sanMarco, saoneri, moresco, { lat: 45.43, lng: 12.31 }, { lat: 45.42, lng: 12.3 }]

  it('TOUR-ROUTING-039: two stops no way joins are named by halving the walk, and a host that answers after all names none', async () => {
    // The whole walk has no way, its first half [0..2] answers, then [2..3] has none: the gap is the leg from stop 2.
    valhallaRunOnFoot.mockResolvedValueOnce(noPath).mockResolvedValueOnce(answered).mockResolvedValueOnce(noPath)
    expect(await routeCityWalk(stops)).toEqual({ gap: 2 })
    expect(valhallaRunOnFoot.mock.calls.map((call) => (call[0] as unknown[]).length)).toEqual([5, 3, 2])

    valhallaRunOnFoot.mockReset().mockResolvedValueOnce(noPath).mockResolvedValue(answered)
    expect(await routeCityWalk([sanMarco, saoneri])).toBeNull()
  })

  it('TOUR-ROUTING-040: a router that does not answer names no gap and asks no more, the walk failing as a routing error', async () => {
    expect(await routeCityWalk(stops)).toBeNull()
    expect(valhallaRunOnFoot).toHaveBeenCalledTimes(1)

    // No way through the whole walk, but the host goes quiet while the halves are asked: nothing is known about the way.
    valhallaRunOnFoot.mockReset().mockResolvedValueOnce(noPath).mockResolvedValue(null)
    expect(await routeCityWalk(stops)).toBeNull()
    expect(valhallaRunOnFoot).toHaveBeenCalledTimes(2)
  })
})
