import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAssignment, buildDay, buildPlace } from '../../tests/helpers/factories'
import { resetAllStores } from '../../tests/helpers/store'
import { useAddonStore } from '../store/addonStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTripStore } from '../store/tripStore'
import { useRouteCalculation } from './useRouteCalculation'

const mocks = vi.hoisted(() => ({ route: vi.fn(), mirrorServiceStops: true }))
vi.mock('../components/Map/RouteCalculator', async importActual => ({
  ...await importActual<typeof import('../components/Map/RouteCalculator')>(),
  calculateRouteWithLegs: mocks.route,
}))
vi.mock('./useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (settings: { roadtrip_service_stops_in_days: boolean }) => unknown) =>
    select({ roadtrip_service_stops_in_days: mocks.mirrorServiceStops }),
}))

function seed(enabled = true, excluded = false) {
  const places = [
    buildPlace({ id: 1, lat: 48.1, lng: 11.1 }),
    buildPlace({ id: 2, lat: 48.2, lng: 11.2, route_geometry: '[[48.2,11.2],[48.3,11.3]]' }),
    buildPlace({ id: 3, lat: 48.4, lng: 11.4 }),
  ]
  const assignments = { '1': places.map((place, order) => buildAssignment({
    day_id: 1, order_index: order, place,
    ...(order === 1 ? { tour_place_id: 2, tour_route_geometry: '[[49,12],[49.1,12.1]]', route_excluded: excluded } : {}),
  })) }
  useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', icon: 'Route', type: 'feature', enabled }] })
  useTripStore.setState({ days: [buildDay({ id: 1 })], assignments, places, reservations: [] })
  return places
}

beforeEach(() => {
  resetAllStores()
  mocks.mirrorServiceStops = true
  mocks.route.mockReset().mockImplementation(async (points: Array<{ lat: number; lng: number }>) => ({
    coordinates: points.map(point => [point.lat, point.lng]), legs: [],
  }))
  useSettingsStore.setState(state => ({ settings: { ...state.settings, optimize_from_accommodation: false } }))
})

describe('B5 useRouteCalculation', () => {
  it.each([
    { enabled: true, excluded: false, expected: [[48.1, 48.2], [48.3, 48.4]] },
    { enabled: true, excluded: true, expected: [[48.1, 48.4]] },
    { enabled: false, excluded: false, expected: [[48.1, 48.2, 48.4]] },
  ])('routes enabled=$enabled excluded=$excluded using the shared day topology', async ({ enabled, excluded, expected }) => {
    seed(enabled, excluded)
    const { result } = renderHook(() => useRouteCalculation(useTripStore(), 1, true, 'walking'))
    await waitFor(() => expect(result.current.route?.map(run => run.map(point => point[0]))).toEqual(expected))
    expect(mocks.route.mock.calls.map(call => call[0].map((point: { lat: number }) => point.lat))).toEqual(expected)
    expect(useTripStore.getState().assignments['1']).toHaveLength(3)
  })

  it('filters hidden service stops before the Tour projection', async () => {
    mocks.mirrorServiceStops = false
    const places = seed()
    const service = buildAssignment({ day_id: 1, order_index: 0.5,
      place: buildPlace({ id: 4, lat: 48.15, lng: 11.15, stop_type: 'fuel' }) })
    useTripStore.setState(state => ({ assignments: { '1': [...state.assignments['1'], service] }, places }))
    const { result } = renderHook(() => useRouteCalculation(useTripStore(), 1, true, 'walking'))
    await waitFor(() => expect(result.current.route).toHaveLength(2))
    expect(mocks.route.mock.calls.map(call => call[0].map((point: { lat: number }) => point.lat)))
      .toEqual([[48.1, 48.2], [48.3, 48.4]])
  })

  it('aborts an old calculation and prevents its late answer replacing current Place geometry', async () => {
    const places = seed()
    let release: (answer: { coordinates: number[][]; legs: never[] }) => void = () => {}
    mocks.route.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    const { result } = renderHook(() => useRouteCalculation(useTripStore(), 1, true, 'walking'))
    const oldSignal = mocks.route.mock.calls[0][1].signal as AbortSignal
    act(() => useTripStore.setState({ places: places.map(place => place.id === 2
      ? { ...place, route_geometry: '[[48.2,11.2],[48.35,11.35]]' } : place) }))
    await waitFor(() => expect(result.current.route?.[1]?.[0]).toEqual([48.35, 11.35]))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => release({ coordinates: [[49, 12], [49.1, 12.1]], legs: [] }))
    expect(result.current.route?.[1]?.[0]).toEqual([48.35, 11.35])
  })
})