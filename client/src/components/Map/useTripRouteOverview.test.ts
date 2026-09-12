import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dayColor } from '../Roadtrip/dayColors'
import { useTripRouteOverview } from './useTripRouteOverview'
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories'
import type { AssignmentsMap, RouteSegment } from '../../types'

vi.mock('./RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('./RouteCalculator')>()
  return { ...actual, calculateRouteWithLegs: vi.fn() }
})

const { calculateRouteWithLegs } = await import('./RouteCalculator')

const leg = (distance: number, duration: number): RouteSegment => ({
  mid: [0, 0], from: [0, 0], to: [0, 0],
  distance, duration,
  distanceText: `${Math.round(distance / 1000)} km`,
  durationText: '1 h', walkingText: '5 h', drivingText: '1 h',
})

const at = (lat: number, lng: number, order: number, dayId: number, extra: Record<string, unknown> = {}) =>
  buildAssignment({ day_id: dayId, order_index: order, place: buildPlace({ lat, lng }), ...extra })

const DAYS = [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 })]
const ASSIGNMENTS: AssignmentsMap = {
  '1': [at(48.86, 2.35, 0, 1), at(48.88, 2.36, 1, 1)],
  '2': [at(45.76, 4.83, 0, 2), at(45.78, 4.85, 1, 2)],
}

const render = (enabled = true, assignments: AssignmentsMap = ASSIGNMENTS, days = DAYS) =>
  renderHook(
    ({ assignments: a }: { assignments: AssignmentsMap }) =>
      useTripRouteOverview(7, days, a, [], [], 'driving', enabled),
    { initialProps: { assignments } },
  )

beforeEach(() => {
  vi.mocked(calculateRouteWithLegs).mockReset()
  vi.mocked(calculateRouteWithLegs).mockResolvedValue({
    coordinates: [[48.86, 2.35], [48.87, 2.355], [48.88, 2.36]],
    distance: 12000, duration: 900,
    legs: [leg(12000, 900)],
  })
})

describe('useTripRouteOverview', () => {
  it('FE-MAP-TRO-001: does nothing at all until it is switched on', () => {
    const { result } = render(false)

    expect(result.current.days).toEqual([])
    expect(result.current.totalDistance).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
  })

  it('FE-MAP-TRO-002: sums every day into the trip total', async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days).toHaveLength(2)
    expect(result.current.days.map(d => d.distance)).toEqual([12000, 12000])
    expect(result.current.totalDistance).toBe(24000)
    expect(result.current.totalDuration).toBe(1800)
  })

  it('FE-MAP-TRO-003: gives each day the colour the road trip draws it in', async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.loading).toBe(false))
    const colors = result.current.days.map(d => d.color)
    // The same palette either way, so a day does not change colour when the trip is
    // read as a road trip instead of an overview.
    expect(colors[0]).toEqual(dayColor(1))
    expect(colors[1]).toEqual(dayColor(2))
    // Every drawn line is labelled with the colour of the day it belongs to.
    expect(result.current.lineColors).toHaveLength(result.current.lines.length)
    expect(new Set(result.current.lineColors.map(c => c.line)).size).toBe(2)
  })

  it('FE-MAP-TRO-004: reports the modes each day is travelled in', async () => {
    const { result } = render(true, {
      '1': [at(48.86, 2.35, 0, 1, { leg_transport_mode: 'walking' }), at(48.88, 2.36, 1, 1)],
      '2': ASSIGNMENTS['2'],
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[0].modes).toEqual(['walking'])
    expect(result.current.days[1].modes).toEqual(['driving'])
    expect(result.current.days[0].segments[0].mode).toBe('walking')
  })

  it('FE-MAP-TRO-005: draws straight lines first and keeps them when routing refuses', async () => {
    vi.mocked(calculateRouteWithLegs).mockRejectedValue(new Error('429'))
    const { result } = render()

    await waitFor(() => expect(result.current.loading).toBe(false))
    // The shape of the trip is still on the map...
    expect(result.current.lines).toHaveLength(2)
    expect(result.current.lines[0]).toEqual([[48.86, 2.35], [48.88, 2.36]])
    // ...but a leg that never answered contributes no distance.
    expect(result.current.totalDistance).toBe(0)
  })

  it('FE-MAP-TRO-006: a day with nothing to drive is left out', async () => {
    const { result } = render(true, { '1': ASSIGNMENTS['1'], '2': [at(45.76, 4.83, 0, 2)] })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days.map(d => d.dayId)).toEqual([1])
  })

  it('FE-MAP-TRO-007: frames the whole trip, not one day of it', async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.focusPoints.length).toBe(result.current.lines.flat().length)
    expect(result.current.focusPoints.length).toBeGreaterThan(2)
  })

  it('FE-MAP-TRO-008: renaming a place does not re-route the trip', async () => {
    const { result, rerender } = render()
    await waitFor(() => expect(result.current.loading).toBe(false))
    const calls = vi.mocked(calculateRouteWithLegs).mock.calls.length

    expect(calls).toBeGreaterThan(0)

    // A new object identity with the same geometry: the plan memo re-runs, the
    // routing round must not.
    rerender({
      assignments: {
        ...ASSIGNMENTS,
        '1': ASSIGNMENTS['1'].map(a => ({ ...a, place: { ...a.place, name: 'Renamed' } })),
      },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(calculateRouteWithLegs).mock.calls.length).toBe(calls)
  })
})
