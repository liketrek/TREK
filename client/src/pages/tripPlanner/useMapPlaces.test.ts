// FE-TP-MAPPLACES-001 to FE-TP-MAPPLACES-010
//
// Which places the planner's map draws, driven straight through useMapPlaces: the
// list filters it shares with the sidebars through the trip store, the declutter of
// collapsed days, the marker flags, the Tracks fallback and the selected day's order
// badges and fit list.
import { act, renderHook } from '@testing-library/react'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildAssignment, buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories'
import type { Accommodation, AssignmentsMap, Day, Place, Reservation } from '../../types'
import { useMapPlaces } from './useMapPlaces'

interface Props {
  places: Place[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  days: Day[]
  tripAccommodations: Accommodation[]
  reservations: Reservation[]
  toursEnabled: boolean
}

// Four places: one on day 1, one on day 2 and two in the pool, one of which has no
// position for the map to draw. The day 1 place is planned on day 2 as well, so
// collapsing either day alone must not hide it.
const museum = buildPlace({ id: 1, name: 'Museum' })
const harbour = buildPlace({ id: 2, name: 'Harbour' })
const bakery = buildPlace({ id: 3, name: 'Bakery' })
const nowhere = buildPlace({ id: 4, name: 'Nowhere', lat: null, lng: null })
const days = [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 })]
const assignments: AssignmentsMap = {
  1: [buildAssignment({ id: 11, day_id: 1, place: museum, order_index: 0 })],
  2: [
    buildAssignment({ id: 21, day_id: 2, place: harbour, order_index: 0 }),
    buildAssignment({ id: 22, day_id: 2, place: museum, order_index: 1 }),
  ],
}

function renderMapPlaces(over: Partial<Props> = {}) {
  const initialProps: Props = {
    places: [museum, harbour, bakery, nowhere],
    assignments,
    selectedDayId: null,
    days,
    tripAccommodations: [],
    reservations: [],
    toursEnabled: false,
    ...over,
  }
  return renderHook((props: Props) => useMapPlaces(props), { initialProps })
}

const ids = (places: { id: number }[]) => places.map(p => p.id)

beforeEach(() => {
  resetAllStores()
})

describe('useMapPlaces', () => {
  it('FE-TP-MAPPLACES-001: with no filter the map draws every place that has a position, unchanged', () => {
    const { result } = renderMapPlaces()

    expect(ids(result.current.mapPlaces)).toEqual([1, 2, 3])
    expect(result.current.mapPlaces[0]).toBe(museum)
    expect(result.current.expandedDayIds).toBeNull()
  })

  it('FE-TP-MAPPLACES-002: a collapsed day takes its stops off the map unless an open day still holds them', () => {
    // A visit whose place is gone (still syncing, or deleted elsewhere) hides nothing.
    const placeless = (id: number, dayId: number) => buildAssignment({ id, day_id: dayId, place: null } as never)
    const { result } = renderMapPlaces({
      assignments: { 1: [...assignments[1], placeless(12, 1)], 2: [...assignments[2], placeless(23, 2)] },
    })

    act(() => { result.current.setExpandedDayIds(new Set([2])) })
    expect(ids(result.current.mapPlaces)).toEqual([1, 2, 3])

    act(() => { result.current.setExpandedDayIds(new Set([1])) })
    expect(ids(result.current.mapPlaces)).toEqual([1, 3])

    act(() => { result.current.setExpandedDayIds(new Set()) })
    expect(ids(result.current.mapPlaces)).toEqual([3])
  })

  it('FE-TP-MAPPLACES-003: under the planned filter a collapsed day keeps its places on the map', () => {
    seedStore(useTripStore, { placesFilter: 'planned' })
    const { result } = renderMapPlaces()

    act(() => { result.current.setExpandedDayIds(new Set()) })

    expect(ids(result.current.mapPlaces)).toEqual([1, 2])
  })

  it('FE-TP-MAPPLACES-004: planned follows the open day, unplanned always reads the whole trip', () => {
    seedStore(useTripStore, { placesFilter: 'planned' })
    const { result, rerender } = renderMapPlaces({ selectedDayId: 1 })
    expect(ids(result.current.mapPlaces)).toEqual([1])

    act(() => { useTripStore.setState({ placesFilter: 'unplanned' }) })
    rerender({
      places: [museum, harbour, bakery, nowhere], assignments, selectedDayId: 1, days,
      tripAccommodations: [], reservations: [], toursEnabled: false,
    })
    expect(ids(result.current.mapPlaces)).toEqual([3])
  })

  it('FE-TP-MAPPLACES-005: a stay or a booking on a day plans its place for the filters', () => {
    seedStore(useTripStore, { placesFilter: 'unplanned' })
    const stay = { id: 50, place_id: 3, start_day_id: 1, end_day_id: 2 } as Accommodation
    const { result } = renderMapPlaces({ tripAccommodations: [stay] })

    expect(ids(result.current.mapPlaces)).toEqual([])
  })

  it('FE-TP-MAPPLACES-006: the category and rating filters the lists set narrow the markers too', () => {
    const rated = buildPlace({ id: 5, category_id: 7, rating_avg: 4.5 } as Partial<Place>)
    seedStore(useTripStore, { placesCategoryFilter: new Set(['7']), placesRatingFilter: 4 })
    const { result } = renderMapPlaces({ places: [museum, rated] })

    expect(ids(result.current.mapPlaces)).toEqual([5])
  })

  it('FE-TP-MAPPLACES-007: compact unplanned and pending stays mark their markers, planned ones stay as they are', () => {
    seedStore(useSettingsStore, { settings: { map_compact_unplanned: true } })
    const stay = { id: 60, place_id: 2, start_day_id: 2, end_day_id: 2 } as Accommodation
    const booking = buildReservation({ id: 61, accommodation_id: 60, status: 'pending' } as Partial<Reservation>)
    const { result } = renderMapPlaces({ tripAccommodations: [stay], reservations: [booking] })

    const [first, second, third] = result.current.mapPlaces
    expect(first).toBe(museum)
    expect(second).toEqual({ ...harbour, _compact: false, _pending: true })
    expect(third).toEqual({ ...bakery, _compact: true, _pending: false })
  })

  it('FE-TP-MAPPLACES-008: the Tracks filter falls back to all once nothing carries a track, or tours take tracks over', () => {
    const trail = buildPlace({ id: 6, route_geometry: '[[46.9,7.4],[46.8,7.5]]' } as Partial<Place>)
    seedStore(useTripStore, { placesFilter: 'tracks' })

    const kept = renderMapPlaces({ places: [museum, trail] })
    expect(useTripStore.getState().placesFilter).toBe('tracks')
    expect(ids(kept.result.current.mapPlaces)).toEqual([6])
    kept.unmount()

    renderMapPlaces({ places: [museum, trail], toursEnabled: true })
    expect(useTripStore.getState().placesFilter).toBe('all')

    seedStore(useTripStore, { placesFilter: 'tracks' })
    renderMapPlaces({ places: [museum] })
    expect(useTripStore.getState().placesFilter).toBe('all')
  })

  it('FE-TP-MAPPLACES-009: the order badges follow the day order and pass over service stops', () => {
    const fuel = buildPlace({ id: 7, stop_type: 'fuel' } as Partial<Place>)
    const day: AssignmentsMap = {
      3: [
        buildAssignment({ id: 31, day_id: 3, place: harbour, order_index: 2 }),
        buildAssignment({ id: 32, day_id: 3, place: fuel, order_index: 1 }),
        buildAssignment({ id: 33, day_id: 3, place: museum, order_index: 0 }),
        buildAssignment({ id: 34, day_id: 3, place: museum, order_index: 3 }),
        buildAssignment({ id: 35, day_id: 3, place: null, order_index: 4 } as never),
      ],
    }

    expect(renderMapPlaces({ assignments: day }).result.current.dayOrderMap).toEqual({})
    expect(renderMapPlaces({ assignments: day, selectedDayId: 9 }).result.current.dayOrderMap).toEqual({})
    expect(renderMapPlaces({ assignments: day, selectedDayId: 3 }).result.current.dayOrderMap).toEqual({ 1: [1, 3], 2: [2] })
  })

  it('FE-TP-MAPPLACES-010: the map fits to the selected day\'s places that have a position', () => {
    const day: AssignmentsMap = {
      3: [
        buildAssignment({ id: 41, day_id: 3, place: nowhere, order_index: 0 }),
        buildAssignment({ id: 42, day_id: 3, place: bakery, order_index: 1 }),
      ],
    }

    expect(renderMapPlaces({ assignments: day }).result.current.dayPlaces).toEqual([])
    expect(renderMapPlaces({ assignments: day, selectedDayId: 9 }).result.current.dayPlaces).toEqual([])
    expect(renderMapPlaces({ assignments: day, selectedDayId: 3 }).result.current.dayPlaces).toEqual([bakery])
  })
})
