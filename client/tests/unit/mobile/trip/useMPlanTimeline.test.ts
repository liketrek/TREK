import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WeatherResult } from '@trek/shared'
import { assignmentsApi, reservationsApi, weatherApi } from '../../../../src/api/client'
import { useMPlanTimeline } from '../../../../src/mobile/screens/trip/plan/useMPlanTimeline'
import type { TransportEntry } from '../../../../src/mobile/screens/trip/plan/planTimelineModel'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { usePluginStore, type ActivePlugin } from '../../../../src/store/pluginStore'
import { useTripStore } from '../../../../src/store/tripStore'
import type { Accommodation, Day, RouteSegment } from '../../../../src/types'
import { buildAssignment, buildDayNote, buildPlace, buildReservation } from '../../../helpers/factories'
import { buildPlanner, buildTripActions } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, renderHook, waitFor } from '../../../helpers/render'

// FE-MOB-PLTL-001 to FE-MOB-PLTL-045

// The connector calculation is its own hook with real OSRM calls — stubbed here so
// the timeline sees exactly the legs a test wants to match against.
const routeCalc = vi.hoisted(() => ({ segments: [] as unknown[] }))
vi.mock('../../../../src/hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({ routeSegments: routeCalc.segments }),
}))

const DAYS = [
  { id: 1, trip_id: 1, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 1, day_number: 2, date: '2026-05-02', title: 'Old Town' },
  { id: 3, trip_id: 1, day_number: 3, date: '2026-05-03', title: null },
] as unknown as Day[]

const MUSEUM = buildPlace({ id: 101, name: 'Museum', lat: 48, lng: 16.1 })
const PARK = buildPlace({ id: 102, name: 'Park', lat: 48, lng: 16.3 })
const CAFE = buildPlace({ id: 103, name: 'Cafe', lat: 48, lng: 16.2 })

const A_MUSEUM = buildAssignment({ id: 11, day_id: 2, order_index: 0, place_id: 101, place: MUSEUM })
const A_PARK = buildAssignment({ id: 12, day_id: 2, order_index: 1, place_id: 102, place: PARK })
const A_CAFE = buildAssignment({ id: 13, day_id: 2, order_index: 2, place_id: 103, place: CAFE })

// Timed stops without coordinates — the up-next pick needs times, not a map.
const TIMED_EARLY = buildAssignment({
  id: 21, day_id: 2, order_index: 0, place_id: 201,
  place: buildPlace({ id: 201, name: 'Breakfast', lat: null, lng: null, place_time: '09:00' }),
})
const TIMED_LATE = buildAssignment({
  id: 22, day_id: 2, order_index: 1, place_id: 202,
  place: buildPlace({ id: 202, name: 'Museum', lat: null, lng: null, place_time: '11:00' }),
})

const HOTEL = {
  id: 71, trip_id: 1, start_day_id: 1, end_day_id: 3,
  place_name: 'Hotel Sacher', place_lat: 48, place_lng: 16.05,
} as unknown as Accommodation

const FORECAST = {
  temp: 20.4, temp_max: 24, temp_min: 12, main: 'Rain', description: 'light rain', type: 'forecast',
} as WeatherResult

function seg(from: [number, number], to: [number, number]): RouteSegment {
  return {
    mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
    from, to, distance: 1200, duration: 600,
    walkingText: '15 min', drivingText: '3 min', distanceText: '1.2 km',
  }
}

const BASE_SETTINGS = {
  time_format: '24h', date_format: 'DD.MM.YYYY', default_currency: 'EUR', distance_unit: 'km',
}

function makePlanner(overrides: Record<string, unknown> = {}): TripPlanner {
  return buildPlanner({
    tripId: 1,
    days: DAYS,
    selectedDayId: 2,
    assignments: { '2': [A_CAFE, A_MUSEUM, A_PARK] },
    places: [MUSEUM, PARK, CAFE],
    reservations: [],
    tripAccommodations: [],
    settings: BASE_SETTINGS,
    ...overrides,
  } as unknown as Partial<TripPlanner>)
}

/** Renders and settles the weather request so no state update lands outside act(). */
async function renderTimeline(planner: TripPlanner) {
  const view = renderHook(() => useMPlanTimeline(planner))
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  return { ...view, planner }
}

describe('useMPlanTimeline', () => {
  beforeEach(() => {
    resetAllStores()
    usePluginStore.setState({ plugins: [] })
    routeCalc.segments = []
    vi.spyOn(weatherApi, 'get').mockResolvedValue(FORECAST)
    vi.spyOn(assignmentsApi, 'updateTransport').mockResolvedValue({})
    vi.spyOn(reservationsApi, 'updatePositions').mockResolvedValue({})
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  // The plugin store is reset in beforeEach, not here: a setState while the hook
  // is still mounted (cleanup runs after this) would re-render outside act().
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('FE-MOB-PLTL-001: resolves the selected day and sorts its stops by order index', async () => {
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.day?.id).toBe(2)
    expect(result.current.rows.map(r => r.key)).toEqual(['pl-11', 'pl-12', 'pl-13'])
    expect(result.current.timeFormat).toBe('24h')
    expect(result.current.language).toBe('en')
  })

  it('FE-MOB-PLTL-002: folds day notes from the store into the timeline', async () => {
    seedStore(useTripStore, { dayNotes: { '2': [buildDayNote({ id: 41, day_id: 2, sort_order: 0.5 })] } })
    const { result } = await renderTimeline(makePlanner({ assignments: { '2': [A_MUSEUM, A_PARK] } }))
    expect(result.current.rows.map(r => r.key)).toEqual(['pl-11', 'note-41', 'pl-12'])
  })

  it('FE-MOB-PLTL-003: slots the calculated legs in as connectors', async () => {
    routeCalc.segments = [seg([48, 16.1], [48, 16.3]), seg([48, 16.3], [48, 16.2])]
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.rows.map(r => r.kind)).toEqual(['place', 'conn', 'place', 'conn', 'place'])
  })

  it('FE-MOB-PLTL-004: exposes the hotel bookend legs and header chips', async () => {
    const out = seg([48, 16.05], [48, 16.1])
    const back = seg([48, 16.2], [48, 16.05])
    routeCalc.segments = [out, back]
    const { result } = await renderTimeline(makePlanner({ tripAccommodations: [HOTEL] }))
    expect(result.current.hotelLegs.top?.seg).toBe(out)
    expect(result.current.hotelLegs.bottom?.seg).toBe(back)
    expect(result.current.hotelChips).toEqual([
      { key: 'stay-71', variant: 'stay', name: 'Hotel Sacher', time: null },
    ])
  })

  it('FE-MOB-PLTL-005: derives nothing while no day is selected', async () => {
    const { result } = await renderTimeline(makePlanner({ selectedDayId: null }))
    expect(result.current.day).toBeUndefined()
    expect(result.current.rows).toEqual([])
    expect(result.current.merged).toEqual([])
    expect(result.current.hotelChips).toEqual([])
    expect(result.current.hotelLegs).toEqual({ top: null, bottom: null })
    expect(result.current.upNext).toBeNull()
    expect(weatherApi.get).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-006: keeps every day-scoped action inert without a selected day', async () => {
    const planner = makePlanner({ selectedDayId: null })
    const { result } = await renderTimeline(planner)
    act(() => {
      result.current.moveRow({ type: 'place', sortKey: 0, data: A_MUSEUM }, 'down')
      result.current.removeAssignment(A_MUSEUM)
      result.current.renameDay('Nope')
      result.current.exportGoogleMaps()
      result.current.setLegMode(11, 'walking')
      result.current.addTransport()
    })
    await act(async () => { await result.current.optimize() })
    expect(planner.handleRemoveAssignment).not.toHaveBeenCalled()
    expect(planner.handleUpdateDayTitle).not.toHaveBeenCalled()
    expect(window.open).not.toHaveBeenCalled()
    expect(assignmentsApi.updateTransport).not.toHaveBeenCalled()
    expect(planner.tripActions.reorderAssignments).not.toHaveBeenCalled()
    // The transport sheet still opens — it just has no day to attach to.
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-PLTL-007: requests the forecast for the first located stop', async () => {
    const { result } = await renderTimeline(makePlanner())
    await waitFor(() => expect(result.current.weather).not.toBeNull())
    expect(weatherApi.get).toHaveBeenCalledWith(48, 16.1, '2026-05-02', 'en')
    expect(result.current.weatherTemp).toBe(20)
    // #2167 — the anchor's name rides along so the chip can say where this is for.
    expect(result.current.weatherPlaceName).toBe('Museum')
  })

  it('FE-MOB-PLTL-008: converts the forecast to Fahrenheit on request', async () => {
    const planner = makePlanner({ settings: { ...BASE_SETTINGS, temperature_unit: 'fahrenheit' } })
    const { result } = await renderTimeline(planner)
    await waitFor(() => expect(result.current.weatherTemp).toBe(69))
  })

  it('FE-MOB-PLTL-009: drops a forecast the service flagged as an error', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue({ ...FORECAST, error: 'no_forecast' })
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.weather).toBeNull()
    expect(result.current.weatherTemp).toBeNull()
  })

  it('FE-MOB-PLTL-010: survives a rejected forecast request', async () => {
    vi.mocked(weatherApi.get).mockRejectedValue(new Error('offline'))
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.weather).toBeNull()
  })

  it('FE-MOB-PLTL-011: anchors the forecast to the day hotel when no stop has coordinates', async () => {
    const vague = buildAssignment({
      id: 14, day_id: 2, order_index: 0, place_id: 104,
      place: buildPlace({ id: 104, name: 'Idea', lat: null, lng: null }),
    })
    const { result } = await renderTimeline(makePlanner({ assignments: { '2': [vague] }, tripAccommodations: [HOTEL] }))
    expect(weatherApi.get).toHaveBeenCalledWith(48, 16.05, '2026-05-02', 'en')
    expect(result.current.weatherPlaceName).toBe('Hotel Sacher')
  })

  it('FE-MOB-PLTL-012: skips the forecast without any coordinates at all', async () => {
    const vague = buildAssignment({
      id: 14, day_id: 2, order_index: 0, place_id: 104,
      place: buildPlace({ id: 104, name: 'Idea', lat: null, lng: null }),
    })
    const { result } = await renderTimeline(makePlanner({ assignments: { '2': [vague] } }))
    expect(weatherApi.get).not.toHaveBeenCalled()
    expect(result.current.weatherPlaceName).toBeNull()
  })

  it('FE-MOB-PLTL-045: drops a forecast that settles after the timeline is gone', async () => {
    let resolveWeather: (w: WeatherResult) => void = () => {}
    vi.mocked(weatherApi.get).mockReturnValueOnce(new Promise(res => { resolveWeather = res }))
    const first = renderHook(() => useMPlanTimeline(makePlanner()))
    first.unmount()
    await act(async () => { resolveWeather(FORECAST); await Promise.resolve() })
    expect(first.result.current.weather).toBeNull()

    let failWeather: (e: Error) => void = () => {}
    vi.mocked(weatherApi.get).mockReturnValueOnce(new Promise((_res, rej) => { failWeather = rej }))
    const second = renderHook(() => useMPlanTimeline(makePlanner()))
    second.unmount()
    await act(async () => { failWeather(new Error('offline')); await Promise.resolve() })
    expect(second.result.current.weather).toBeNull()
  })

  it('FE-MOB-PLTL-013: toggles an expanded transit row on and off', async () => {
    const { result } = await renderTimeline(makePlanner())
    act(() => { result.current.toggleTransit('tr-61') })
    expect(result.current.openTransitKeys.has('tr-61')).toBe(true)
    act(() => { result.current.toggleTransit('tr-62') })
    expect([...result.current.openTransitKeys].sort()).toEqual(['tr-61', 'tr-62'])
    act(() => { result.current.toggleTransit('tr-61') })
    expect(result.current.openTransitKeys.has('tr-61')).toBe(false)
  })

  it('FE-MOB-PLTL-014: counts down on today and shows nothing for a day gone by', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 2, 10, 15))
    const today = makePlanner({ assignments: { '2': [TIMED_EARLY, TIMED_LATE] } })
    const { result } = renderHook(() => useMPlanTimeline(today))
    expect(result.current.upNext).toEqual({ assignment: TIMED_LATE, minutesUntil: 45 })

    const past = makePlanner({
      assignments: { '2': [TIMED_EARLY, TIMED_LATE] },
      days: DAYS.map(d => (d.id === 2 ? { ...d, date: '2026-04-30' } : d)),
    })
    const other = renderHook(() => useMPlanTimeline(past))
    expect(other.result.current.upNext).toBeNull()
  })

  it('FE-MOB-PLTL-015: re-evaluates the countdown on the half-minute tick', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 2, 10, 0))
    const planner = makePlanner({ assignments: { '2': [TIMED_EARLY, TIMED_LATE] } })
    const { result } = renderHook(() => useMPlanTimeline(planner))
    expect(result.current.upNext).toEqual({ assignment: TIMED_LATE, minutesUntil: 60 })

    vi.setSystemTime(new Date(2026, 4, 2, 11, 30))
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(result.current.upNext).toBeNull()
  })

  it('FE-MOB-PLTL-016: reorders the day when a stop is moved down', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[0], 'down') })
    await waitFor(() => expect(planner.tripActions.reorderAssignments).toHaveBeenCalledWith(1, 2, [12, 11, 13]))
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.reorder', expect.any(Function))
    expect(planner.updateRouteForDay).toHaveBeenCalledWith(2)
  })

  it('FE-MOB-PLTL-017: restores the previous order through the undo entry', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[2], 'up') })
    await waitFor(() => expect(planner.pushUndo).toHaveBeenCalled())
    const undo = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await undo()
    expect(planner.tripActions.reorderAssignments).toHaveBeenLastCalledWith(1, 2, [11, 12, 13])
  })

  it('FE-MOB-PLTL-018: ignores a move past either end of the timeline', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => {
      result.current.moveRow(result.current.merged[0], 'up')
      result.current.moveRow(result.current.merged[2], 'down')
      result.current.moveRow({ type: 'place', sortKey: 9, data: A_MUSEUM }, 'down')
    })
    expect(planner.tripActions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-019: refuses to move a timed stop past another timed stop', async () => {
    const nine = buildAssignment({
      id: 21, day_id: 2, order_index: 0, place_id: 201,
      place: buildPlace({ id: 201, name: 'Breakfast', lat: 48, lng: 16.1, place_time: '09:00' }),
    })
    const eleven = buildAssignment({
      id: 22, day_id: 2, order_index: 1, place_id: 202,
      place: buildPlace({ id: 202, name: 'Museum', lat: 48, lng: 16.2, place_time: '11:00' }),
    })
    const planner = makePlanner({ assignments: { '2': [nine, eleven] } })
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[0], 'down') })
    expect(planner.toast.info).toHaveBeenCalledWith('dayplan.cannotBreakChronology')
    expect(planner.tripActions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-020: lets an untimed stop move between timed ones', async () => {
    const nine = buildAssignment({
      id: 21, day_id: 2, order_index: 0, place_id: 201,
      place: buildPlace({ id: 201, name: 'Breakfast', lat: 48, lng: 16.1, place_time: '09:00' }),
    })
    const free = buildAssignment({
      id: 22, day_id: 2, order_index: 1, place_id: 202,
      place: buildPlace({ id: 202, name: 'Park', lat: 48, lng: 16.2 }),
    })
    const eleven = buildAssignment({
      id: 23, day_id: 2, order_index: 2, place_id: 203,
      place: buildPlace({ id: 203, name: 'Museum', lat: 48, lng: 16.3, place_time: '11:00' }),
    })
    const planner = makePlanner({ assignments: { '2': [nine, free, eleven] } })
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[1], 'up') })
    await waitFor(() => expect(planner.tripActions.reorderAssignments).toHaveBeenCalledWith(1, 2, [22, 21, 23]))
    expect(planner.toast.info).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-021: persists note and transport positions alongside the reorder', async () => {
    const bus = buildReservation({
      id: 51, type: 'bus', title: 'Bus 13A', day_id: 2, day_positions: { 2: 1.5 },
    })
    seedStore(useTripStore, {
      dayNotes: { '2': [buildDayNote({ id: 41, day_id: 2, sort_order: 0.5 })] },
      reservations: [bus],
    })
    const planner = makePlanner({ assignments: { '2': [A_MUSEUM, A_PARK] }, reservations: [bus] })
    const { result } = await renderTimeline(planner)
    expect(result.current.merged.map(m => m.type)).toEqual(['place', 'note', 'place', 'transport'])

    await act(async () => { result.current.moveRow(result.current.merged[3], 'up') })

    await waitFor(() => expect(reservationsApi.updatePositions).toHaveBeenCalledWith(
      1, [{ id: 51, day_plan_position: 2 / 3 }], 2,
    ))
    expect(planner.tripActions.reorderAssignments).toHaveBeenCalledWith(1, 2, [11, 12])
    expect(planner.tripActions.updateDayNote).toHaveBeenCalledWith(1, 2, 41, { sort_order: 1 / 3 })
    // The optimistic store write lands before the round trip so the merge stays stable.
    expect(useTripStore.getState().reservations[0]).toMatchObject({
      id: 51, day_plan_position: 2 / 3, day_positions: { 2: 2 / 3 },
    })
  })

  it('FE-MOB-PLTL-022: writes per-leg positions of a multi-leg flight back as an object', async () => {
    const flight = buildReservation({
      id: 60, type: 'flight', title: 'FRA → CTS', day_id: 2,
      metadata: JSON.stringify({
        // The third leg departs on day 3, so it never reaches this day's timeline.
        legs: [{ from: 'FRA', to: 'IST' }, { from: 'IST', to: 'NRT' }, { dep_day_id: 3, from: 'NRT', to: 'CTS' }],
      }),
    })
    const dinner = buildReservation({ id: 70, type: 'restaurant', title: 'Dinner', day_id: 3 })
    seedStore(useTripStore, { reservations: [flight, dinner] })
    const planner = makePlanner({ assignments: {}, reservations: [flight] })
    const { result } = await renderTimeline(planner)
    expect(result.current.rows.map(r => r.key)).toEqual(['tr-60-leg0', 'tr-60-leg1'])

    await act(async () => { result.current.moveRow(result.current.merged[1], 'up') })

    await waitFor(() => expect(planner.tripActions.updateReservation).toHaveBeenCalled())
    const [tripId, resId, payload] = vi.mocked(planner.tripActions.updateReservation).mock.calls[0]
    expect([tripId, resId]).toEqual([1, 60])
    const meta = (payload as unknown as { metadata: { legs: Array<{ day_positions?: Record<string, number> }> } }).metadata
    // Positions are base + (idx + 1) / (group + 1) with base -1: the whole group sits before slot 0.
    expect(meta.legs[0].day_positions).toEqual({ 2: -1 + 2 / 3 })
    expect(meta.legs[1].day_positions).toEqual({ 2: -1 + 1 / 3 })
    expect(meta.legs[2].day_positions).toBeUndefined()
    // Metadata must land in the store as an object, and only this booking is touched.
    expect(typeof useTripStore.getState().reservations[0].metadata).toBe('object')
    expect(useTripStore.getState().reservations[1]).toBe(dinner)
    // No assignments on the day — nothing to undo, and no reorder call.
    expect(planner.pushUndo).not.toHaveBeenCalled()
    expect(planner.tripActions.reorderAssignments).not.toHaveBeenCalled()
    expect(planner.updateRouteForDay).toHaveBeenCalledWith(2)

    // A second move now reads the object metadata back out of the store.
    await act(async () => { result.current.moveRow(result.current.merged[1], 'up') })
    await waitFor(() => expect(planner.tripActions.updateReservation).toHaveBeenCalledTimes(2))
    const second = vi.mocked(planner.tripActions.updateReservation).mock.calls[1][2] as unknown as
      { metadata: { legs: Array<{ day_positions?: Record<string, number> }> } }
    expect(second.metadata.legs[0].day_positions).toEqual({ 2: -1 + 2 / 3 })
  })

  it('FE-MOB-PLTL-023: skips leg positions when the booking or its metadata is unusable', async () => {
    const flight = buildReservation({
      id: 60, type: 'flight', title: 'FRA → NRT', day_id: 2,
      metadata: JSON.stringify({ legs: [{ from: 'FRA', to: 'IST' }, { from: 'IST', to: 'NRT' }] }),
    })
    const planner = makePlanner({ assignments: {}, reservations: [flight] })
    const { result } = await renderTimeline(planner)
    // Booking missing from the store entirely.
    await act(async () => { result.current.moveRow(result.current.merged[1], 'up') })
    expect(planner.tripActions.updateReservation).not.toHaveBeenCalled()

    // Present, but with metadata that no longer parses into legs.
    seedStore(useTripStore, { reservations: [{ ...flight, metadata: '{not json' }] })
    await act(async () => { result.current.moveRow(result.current.merged[1], 'up') })
    expect(planner.tripActions.updateReservation).not.toHaveBeenCalled()
    expect(planner.updateRouteForDay).toHaveBeenCalledWith(2)
  })

  it('FE-MOB-PLTL-044: slots a timed transport that carries no saved position', async () => {
    const bus = buildReservation({
      id: 51, type: 'bus', title: 'Bus 13A', day_id: 2, reservation_time: '2026-05-02T08:00',
    })
    const dinner = buildReservation({ id: 52, type: 'restaurant', title: 'Dinner', day_id: 3 })
    seedStore(useTripStore, { reservations: [bus, dinner] })
    const planner = makePlanner({ assignments: { '2': [A_MUSEUM, A_PARK] }, reservations: [bus, dinner] })
    const { result } = await renderTimeline(planner)
    expect(result.current.merged.map(m => m.type)).toEqual(['place', 'place', 'transport'])

    await act(async () => { result.current.moveRow(result.current.merged[2], 'up') })

    await waitFor(() => expect(reservationsApi.updatePositions).toHaveBeenCalledWith(
      1, [{ id: 51, day_plan_position: 0.5 }], 2,
    ))
    // Only the moved booking gains a per-day position; the other day's booking is untouched.
    expect(useTripStore.getState().reservations.map(r => r.day_positions)).toEqual([{ 2: 0.5 }, undefined])
  })

  it('FE-MOB-PLTL-024: surfaces a failed reorder as an error toast and refetches the day', async () => {
    const actions = buildTripActions()
    actions.reorderAssignments.mockRejectedValue(new Error('offline'))
    const planner = makePlanner({ tripActions: actions })
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[0], 'down') })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('offline'))
    expect(planner.updateRouteForDay).not.toHaveBeenCalled()
    // The optimistic positions are dropped by refetching, not undone one by one.
    expect(actions.refreshDays).toHaveBeenCalledWith(1)
    expect(actions.loadReservations).toHaveBeenCalledWith(1)
  })

  it('FE-MOB-PLTL-025: falls back to the generic message for a non-Error failure', async () => {
    const actions = buildTripActions()
    actions.reorderAssignments.mockRejectedValue('nope')
    const planner = makePlanner({ tripActions: actions })
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.moveRow(result.current.merged[0], 'down') })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('trip.toast.reorderError'))
  })

  it('FE-MOB-PLTL-026: removes and edits a stop through the planner', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    act(() => {
      result.current.removeAssignment(A_PARK)
      result.current.editAssignment(A_PARK)
    })
    expect(planner.handleRemoveAssignment).toHaveBeenCalledWith(2, 12)
    expect(planner.openPlaceEditor).toHaveBeenCalledWith(PARK, 12)
  })

  it('FE-MOB-PLTL-027: does not open the editor for a stop missing from the pool', async () => {
    const planner = makePlanner({ places: [] })
    const { result } = await renderTimeline(planner)
    act(() => { result.current.editAssignment(A_PARK) })
    expect(planner.openPlaceEditor).not.toHaveBeenCalled()
    expect(result.current.fullPlaceOf(A_PARK)).toBeUndefined()
  })

  it('FE-MOB-PLTL-028: resolves the full pool entry behind a timeline stop', async () => {
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.fullPlaceOf(A_CAFE)).toBe(CAFE)
  })

  it('FE-MOB-PLTL-029: opens a blank place form from the add bar', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    act(() => { result.current.addPlace() })
    expect(planner.setEditingPlace).toHaveBeenCalledWith(null)
    expect(planner.setEditingAssignmentId).toHaveBeenCalledWith(null)
    expect(planner.setPrefillCoords).toHaveBeenCalledWith(null)
    expect(planner.setShowPlaceForm).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PLTL-030: opens blank booking and transport forms from the add bar', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    act(() => {
      result.current.addBooking()
      result.current.addTransport()
    })
    expect(planner.setEditingReservation).toHaveBeenCalledWith(null)
    expect(planner.setBookingForAssignmentId).toHaveBeenCalledWith(null)
    expect(planner.setShowReservationModal).toHaveBeenCalledWith(true)
    expect(planner.setEditingTransport).toHaveBeenCalledWith(null)
    expect(planner.setTransitPrefill).toHaveBeenCalledWith(null)
    expect(planner.setTransportModalAutomated).toHaveBeenCalledWith(false)
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(2)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PLTL-031: edits a transport row through the transport modal and anything else through the booking modal', async () => {
    const bus = buildReservation({ id: 51, type: 'bus', title: 'Bus 13A', day_id: 2 })
    const dinner = buildReservation({ id: 52, type: 'restaurant', title: 'Dinner', day_id: 2 })
    const planner = makePlanner({ reservations: [bus, dinner] })
    const { result } = await renderTimeline(planner)
    // The row carries a leg-expanded copy; the full reservation is looked up by id.
    act(() => { result.current.editTransport({ ...bus, __leg: { index: 0, total: 2, from: null, to: null } } as TransportEntry) })
    expect(planner.setEditingTransport).toHaveBeenCalledWith(bus)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)

    act(() => { result.current.editTransport(dinner as TransportEntry) })
    expect(planner.setEditingReservation).toHaveBeenCalledWith(dinner)
    expect(planner.setShowReservationModal).toHaveBeenCalledWith(true)

    // A row whose booking is no longer in the pool edits the row itself.
    const orphan = buildReservation({ id: 99, type: 'taxi', title: 'Taxi', day_id: 2 }) as TransportEntry
    act(() => { result.current.editTransport(orphan) })
    expect(planner.setEditingTransport).toHaveBeenLastCalledWith(orphan)
  })

  it('FE-MOB-PLTL-032: opens the journey view for a transit row, falling back to the passed row', async () => {
    const transit = buildReservation({ id: 61, type: 'transit', title: 'U2', day_id: 2 })
    const planner = makePlanner({ reservations: [transit] })
    const { result } = await renderTimeline(planner)
    act(() => { result.current.openTransitJourney({ ...transit, title: 'stale' } as TransportEntry) })
    expect(planner.setTransitJourney).toHaveBeenCalledWith(transit)

    const orphan = buildReservation({ id: 99, type: 'transit', title: 'Gone', day_id: 2 }) as TransportEntry
    act(() => { result.current.openTransitJourney(orphan) })
    expect(planner.setTransitJourney).toHaveBeenLastCalledWith(orphan)
  })

  it('FE-MOB-PLTL-033: optimizes the day order and offers an undo', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => { await result.current.optimize() })
    expect(planner.tripActions.reorderAssignments).toHaveBeenCalledWith(1, 2, [11, 13, 12])
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.optimize', expect.any(Function))
    expect(planner.updateRouteForDay).toHaveBeenCalledWith(2)
    expect(planner.toast.success).toHaveBeenCalledWith('dayplan.toast.routeOptimized')

    const undo = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await undo()
    expect(planner.tripActions.reorderAssignments).toHaveBeenLastCalledWith(1, 2, [11, 12, 13])
  })

  it('FE-MOB-PLTL-034: reports when the accommodation anchored the optimized route', async () => {
    const planner = makePlanner({ tripAccommodations: [HOTEL] })
    const { result } = await renderTimeline(planner)
    await act(async () => { await result.current.optimize() })
    expect(planner.toast.success).toHaveBeenCalledWith('dayplan.toast.routeOptimizedFromHotel')
  })

  it('FE-MOB-PLTL-035: refuses to optimize fewer than two movable stops', async () => {
    const planner = makePlanner({ assignments: { '2': [A_MUSEUM] } })
    const { result } = await renderTimeline(planner)
    await act(async () => { await result.current.optimize() })
    expect(planner.toast.info).toHaveBeenCalledWith('dayplan.toast.needTwoPlaces')
    expect(planner.tripActions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-036: reports a failed optimize as an error toast', async () => {
    const actions = buildTripActions()
    actions.reorderAssignments.mockRejectedValueOnce(new Error('server down'))
    const planner = makePlanner({ tripActions: actions })
    const { result } = await renderTimeline(planner)
    await act(async () => { await result.current.optimize() })
    expect(planner.toast.error).toHaveBeenCalledWith('server down')
    expect(planner.toast.success).not.toHaveBeenCalled()

    actions.reorderAssignments.mockRejectedValue('nope')
    await act(async () => { await result.current.optimize() })
    expect(planner.toast.error).toHaveBeenLastCalledWith('trip.toast.reorderError')
  })

  it('FE-MOB-PLTL-037: exports the day as a Google Maps route', async () => {
    const { result } = await renderTimeline(makePlanner())
    act(() => { result.current.exportGoogleMaps() })
    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/48,16.1/48,16.3/48,16.2', '_blank', 'noopener,noreferrer',
    )
  })

  it('FE-MOB-PLTL-038: opens nothing when the day has no located stops', async () => {
    const vague = buildAssignment({
      id: 14, day_id: 2, order_index: 0, place_id: 104,
      place: buildPlace({ id: 104, name: 'Idea', lat: null, lng: null }),
    })
    const { result } = await renderTimeline(makePlanner({ assignments: { '2': [vague] } }))
    act(() => { result.current.exportGoogleMaps() })
    expect(window.open).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLTL-039: renames the day with a trimmed title', async () => {
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    act(() => { result.current.renameDay('  Old Town  ') })
    expect(planner.handleUpdateDayTitle).toHaveBeenCalledWith(2, 'Old Town')
  })

  // The two built-in modes were the only labels on this menu written in English
  // instead of looked up, so a German reader got "Driving"/"Walking" between
  // translated rows — and next to plugin profiles carrying their own label.
  it('FE-MOB-PLTL-040: offers the built-in travel modes plus every plugin profile', async () => {
    usePluginStore.setState({
      plugins: [
        { id: 'ev', name: 'EV', type: 'integration', icon: null, routeProfiles: [{ id: 'eco', label: 'Eco' }, { id: 'fast', label: 'Fast' }] },
        { id: 'plain', name: 'Plain', type: 'integration', icon: null },
      ] as ActivePlugin[],
    })
    const { result } = await renderTimeline(makePlanner())
    expect(result.current.routeModeOptions).toEqual([
      { key: 'driving', label: 'mobileTrip.profileDriving' },
      { key: 'walking', label: 'mobileTrip.profileWalking' },
      { key: 'plugin:ev/eco', label: 'Eco' },
      { key: 'plugin:ev/fast', label: 'Fast' },
    ])
  })

  it('FE-MOB-PLTL-041: sets a leg mode optimistically and persists it', async () => {
    seedStore(useTripStore, { assignments: { '2': [A_MUSEUM, A_PARK] } })
    const { result } = await renderTimeline(makePlanner())
    await act(async () => { result.current.setLegMode(11, 'walking') })
    expect(useTripStore.getState().assignments['2'].map(a => a.leg_transport_mode)).toEqual(['walking', undefined])
    expect(assignmentsApi.updateTransport).toHaveBeenCalledWith(1, 11, 'walking')
  })

  it('FE-MOB-PLTL-042: reverts to the server state when the leg mode fails to save', async () => {
    seedStore(useTripStore, { assignments: { '2': [A_MUSEUM] } })
    vi.mocked(assignmentsApi.updateTransport).mockRejectedValue(new Error('conflict'))
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.setLegMode(11, null) })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('conflict'))
    expect(planner.tripActions.refreshDays).toHaveBeenCalledWith(1)
  })

  // The store may hold no assignments for the day yet (nothing loaded) — the call still goes out.
  it('FE-MOB-PLTL-043: uses the generic message for a non-Error leg-mode failure', async () => {
    vi.mocked(assignmentsApi.updateTransport).mockRejectedValue('boom')
    const planner = makePlanner()
    const { result } = await renderTimeline(planner)
    await act(async () => { result.current.setLegMode(11, 'driving') })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('common.unknownError'))
  })
})
