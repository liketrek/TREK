// FE-TP-MAPVIEW-001 to FE-TP-MAPVIEW-012
//
// The planner's map view switches and its first fit, driven straight through
// usePlannerMapView. Every toggle is called here, together with the storage each one
// remembers its state in: the planner tests only ever read these values.
import { act, renderHook } from '@testing-library/react'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace, buildTrip } from '../../../tests/helpers/factories'
import type { Place, Trip } from '../../types'
import { usePlannerMapView } from './usePlannerMapView'

interface Props {
  tripId: number
  trip: Trip | null
  places: Place[]
  selectedDayId: number | null
  isMobile: boolean
}

function renderMapView(initial: Partial<Props> = {}) {
  const initialProps: Props = { tripId: 7, trip: null, places: [], selectedDayId: null, isMobile: false, ...initial }
  return renderHook((props: Props) => usePlannerMapView(props), { initialProps })
}

beforeEach(() => {
  vi.restoreAllMocks()
  resetAllStores()
})

describe('usePlannerMapView', () => {
  it('FE-TP-MAPVIEW-001: a trip nobody has looked at opens with every layer off and the map free', () => {
    const { result } = renderMapView()

    expect(result.current.routeShown).toBe(false)
    expect(result.current.transitRoutesShown).toBe(false)
    expect(result.current.routeProfile).toBe('driving')
    expect(result.current.overviewShown).toBe(false)
    expect(result.current.mapLocked).toBe(false)
    expect(result.current.mapLockedRef.current).toBe(false)
    expect(result.current.dawarichTrailShown).toBe(false)
    expect(result.current.dawarichTrail.status).toBe('idle')
    expect(result.current.fitKey).toBe(0)
  })

  it('FE-TP-MAPVIEW-002: the day route remembers an explicit choice per trip, given as a value or an updater', () => {
    const { result, rerender } = renderMapView()

    act(() => { result.current.setRouteShown(true) })
    expect(result.current.routeShown).toBe(true)
    expect(localStorage.getItem('trek:day-route:7')).toBe('true')
    // No day selected: the transit lines stay off whatever the toggle says (#2019).
    expect(result.current.transitRoutesShown).toBe(false)

    rerender({ tripId: 7, trip: null, places: [], selectedDayId: 3, isMobile: false })
    expect(result.current.transitRoutesShown).toBe(true)

    act(() => { result.current.setRouteShown(prev => !prev) })
    expect(result.current.routeShown).toBe(false)
    expect(localStorage.getItem('trek:day-route:7')).toBe('false')
    expect(result.current.transitRoutesShown).toBe(false)
  })

  it('FE-TP-MAPVIEW-003: a stored choice comes back with the trip, and anything else counts as no choice', () => {
    localStorage.setItem('trek:day-route:7', 'true')
    localStorage.setItem('trek:day-route:8', 'false')
    localStorage.setItem('trek:day-route:9', 'maybe')

    expect(renderMapView({ tripId: 7 }).result.current.routeShown).toBe(true)
    expect(renderMapView({ tripId: 8 }).result.current.routeShown).toBe(false)

    const unknown = renderMapView({ tripId: 9 }).result
    expect(unknown.current.routeShown).toBe(false)
    act(() => { unknown.current.autoShowRoute() })
    expect(unknown.current.routeShown).toBe(true)
  })

  it('FE-TP-MAPVIEW-004: the automatic route is a default that never overrides an explicit off or reaches storage', () => {
    const fresh = renderMapView().result
    act(() => { fresh.current.autoShowRoute() })
    expect(fresh.current.routeShown).toBe(true)
    expect(localStorage.getItem('trek:day-route:7')).toBeNull()

    localStorage.setItem('trek:day-route:8', 'false')
    const declined = renderMapView({ tripId: 8 }).result
    act(() => { declined.current.autoShowRoute() })
    expect(declined.current.routeShown).toBe(false)
    expect(localStorage.getItem('trek:day-route:8')).toBe('false')
  })

  it('FE-TP-MAPVIEW-005: without a trip id the route toggle works but is remembered nowhere', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderMapView({ tripId: Number.NaN })

    act(() => { result.current.setRouteShown(true) })

    expect(result.current.routeShown).toBe(true)
    expect(setItem).not.toHaveBeenCalled()
  })

  it('FE-TP-MAPVIEW-006: the route profile is a plain per-session choice', () => {
    const { result } = renderMapView()
    act(() => { result.current.setRouteProfile('plugin:bikes/gravel') })
    expect(result.current.routeProfile).toBe('plugin:bikes/gravel')
  })

  it('FE-TP-MAPVIEW-007: the whole-trip overview flips and is kept per trip for the session', () => {
    const { result } = renderMapView()

    act(() => { result.current.toggleOverview() })
    expect(result.current.overviewShown).toBe(true)
    expect(sessionStorage.getItem('trip-overview-7')).toBe('1')
    expect(renderMapView().result.current.overviewShown).toBe(true)
    expect(renderMapView({ tripId: 8 }).result.current.overviewShown).toBe(false)

    act(() => { result.current.toggleOverview() })
    expect(result.current.overviewShown).toBe(false)
    expect(sessionStorage.getItem('trip-overview-7')).toBe('0')
  })

  it('FE-TP-MAPVIEW-008: the map lock flips, is read through its ref and is remembered by the browser', () => {
    const { result } = renderMapView()

    act(() => { result.current.toggleMapLocked() })
    expect(result.current.mapLocked).toBe(true)
    expect(result.current.mapLockedRef.current).toBe(true)
    expect(localStorage.getItem('trek:map-locked')).toBe('1')
    // A browser-wide choice, so another trip opens locked too.
    expect(renderMapView({ tripId: 8 }).result.current.mapLocked).toBe(true)

    act(() => { result.current.toggleMapLocked() })
    expect(result.current.mapLocked).toBe(false)
    expect(result.current.mapLockedRef.current).toBe(false)
    expect(localStorage.getItem('trek:map-locked')).toBe('0')
  })

  it('FE-TP-MAPVIEW-009: a storage that refuses the lock still leaves a working toggle', () => {
    const realGet = Storage.prototype.getItem
    const realSet = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === 'trek:map-locked') throw new DOMException('denied', 'SecurityError')
      return realGet.call(this, key)
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'trek:map-locked') throw new DOMException('denied', 'SecurityError')
      realSet.call(this, key, value)
    })

    const { result } = renderMapView()
    expect(result.current.mapLocked).toBe(false)

    act(() => { result.current.toggleMapLocked() })
    expect(result.current.mapLocked).toBe(true)
  })

  it('FE-TP-MAPVIEW-010: the phone flag is read through a ref that follows every render', () => {
    const { result, rerender } = renderMapView()
    expect(result.current.isMobileRef.current).toBe(false)

    rerender({ tripId: 7, trip: null, places: [], selectedDayId: null, isMobile: true })
    expect(result.current.isMobileRef.current).toBe(true)
  })

  it('FE-TP-MAPVIEW-011: the recorded trail flips and is kept per trip for the session', () => {
    const { result } = renderMapView()

    act(() => { result.current.toggleDawarichTrail() })
    expect(result.current.dawarichTrailShown).toBe(true)
    expect(sessionStorage.getItem('trip-dawarich-7')).toBe('1')
    // The addon is off in this store, so switching the layer on asks nothing of the network.
    expect(result.current.dawarichTrail.status).toBe('idle')
    expect(renderMapView().result.current.dawarichTrailShown).toBe(true)

    act(() => { result.current.toggleDawarichTrail() })
    expect(result.current.dawarichTrailShown).toBe(false)
    expect(sessionStorage.getItem('trip-dawarich-7')).toBe('0')
  })

  it('FE-TP-MAPVIEW-012: each trip gets one automatic fit, once it has a place to fit to', () => {
    const tripA = buildTrip({ id: 1 })
    const tripB = buildTrip({ id: 2 })
    const unplaced = buildPlace({ lat: null, lng: null })
    const placed = buildPlace({ lat: 46.95, lng: 7.45 })
    const { result, rerender } = renderMapView({ places: [placed] })
    const show = (over: Partial<Props>) => rerender({ tripId: 7, trip: null, places: [], selectedDayId: null, isMobile: false, ...over })

    // No trip loaded yet: nothing to fit.
    expect(result.current.fitKey).toBe(0)

    show({ trip: tripA, places: [unplaced] })
    expect(result.current.fitKey).toBe(0)

    show({ trip: tripA, places: [unplaced, placed] })
    expect(result.current.fitKey).toBe(1)

    show({ trip: tripA, places: [placed] })
    expect(result.current.fitKey).toBe(1)

    show({ trip: tripB, places: [placed] })
    expect(result.current.fitKey).toBe(2)

    act(() => { result.current.setFitKey(k => k + 1) })
    expect(result.current.fitKey).toBe(3)
  })
})
