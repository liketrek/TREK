import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { valhallaBase, valhallaRun } = vi.hoisted(() => ({
  valhallaBase: vi.fn(),
  valhallaRun: vi.fn(),
}))

vi.mock('../../Map/valhallaRoute', () => ({
  valhallaBase,
  valhallaRun,
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

  it('keeps the full route as 2D geometry when height enrichment is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    const coordinates: [number, number][] = [[48, 11], [48.01, 11.01]]

    await expect(enrichTourElevations(coordinates)).resolves.toEqual(coordinates)
  })
})
