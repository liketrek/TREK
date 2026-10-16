import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { valhallaBase, valhallaRun, valhallaTurn } = vi.hoisted(() => ({
  valhallaBase: vi.fn(),
  valhallaRun: vi.fn(),
  valhallaTurn: vi.fn(async () => {}),
}))

vi.mock('../../Map/valhallaRoute', () => ({
  valhallaBase,
  valhallaRun,
  valhallaTurn,
}))

import { enrichTourElevations, parseValhallaElevation, routeWalkingTour } from './tourRouting'

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

  it('TOUR-ROUTING-020: takes a fixed leg as its own line and routes only the runs around it', async () => {
    const leg = {
      kind: 'ferrata' as const,
      ref: 'way/1',
      name: 'Via A',
      geometry: [[47.39, 11.01], [47.391, 11.011], [47.392, 11.012]] as [number, number][],
    }
    valhallaRun
      .mockResolvedValueOnce({ total: { coordinates: [[47.38, 11.0], [47.39, 11.01]], distance: 1500, duration: 1200 } })
      .mockResolvedValueOnce({ total: { coordinates: [[47.392, 11.012], [47.4, 11.02]], distance: 1000, duration: 800 } })

    const routed = await routeWalkingTour([
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
    const fixedOnly = await routeWalkingTour([{ lat: 47.39, lng: 11.01, fixedLeg: leg }, { lat: 47.392, lng: 11.012 }])
    expect(valhallaRun).not.toHaveBeenCalled()
    expect(fixedOnly?.coordinates).toEqual([[47.39, 11.01], [47.392, 11.012]])

    valhallaRun.mockResolvedValueOnce(null)
    expect(await routeWalkingTour([{ lat: 47.38, lng: 11.0 }, { lat: 47.39, lng: 11.01, fixedLeg: leg }, { lat: 47.392, lng: 11.012 }])).toBeNull()
  })

  it('TOUR-ROUTING-022: hand-drawn legs ask no router and come back as their own parts, routed runs as theirs', async () => {
    const free = (from: [number, number], to: [number, number]) => ({ kind: 'free' as const, geometry: [from, to] })
    valhallaRun.mockResolvedValueOnce({ total: { coordinates: [[47.392, 11.012], [47.395, 11.015], [47.4, 11.02]], distance: 900, duration: 700 } })

    const routed = await routeWalkingTour([
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
    const routed = await routeWalkingTour([
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
