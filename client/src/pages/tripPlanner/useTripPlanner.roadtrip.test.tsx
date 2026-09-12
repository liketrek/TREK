import { roadtripPreferencesRepo } from '../../repo/roadtripPreferencesRepo'
// FE-TP-ROAD-001 to FE-TP-ROAD-074
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { useTripPlanner } from './useTripPlanner'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { useAuthStore } from '../../store/authStore'
import { usePluginStore } from '../../store/pluginStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip, buildDay, buildPlace, buildAssignment } from '../../../tests/helpers/factories'
import {
  addonsApi, accommodationsApi, authApi, tripsApi, healthApi, airtrailApi, mapsApi,
} from '../../api/client'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { dayColor } from '../../components/Roadtrip/dayColors'

/**
 * The road trip half of the planner hook.
 *
 * Everything here is unreachable until two things are true at once: the addon is on for
 * the instance AND the mode is on for this trip. The sibling suite runs with both off,
 * which is the ordinary planner; this one turns them on and drives the handlers the rail,
 * the corridor panel and the map call.
 *
 * The five road trip hooks are replaced by fixtures. They have their own suites, and the
 * point here is what the planner DOES with what they report: which day a hit lands on,
 * which position in the chain, and, in every case that moves a stop, the correction that
 * keeps the vias pinned to the legs the traveller drew them for. A via anchors by
 * POSITION, so a reorder that forgets to re-anchor silently re-shapes the drive.
 */

// ── Router ────────────────────────────────────────────────────────────────────
const navigate = vi.fn()
let routeParams: { id?: string } = { id: '42' }
let searchParams = new URLSearchParams()

vi.mock('react-router', () => ({
  useParams: () => routeParams,
  useNavigate: () => navigate,
  useSearchParams: () => [searchParams, vi.fn()],
}))

vi.mock('../../hooks/useTripWebSocket', () => ({ useTripWebSocket: vi.fn() }))

const updateRouteForDay = vi.fn(async (_dayId: number | null) => {})
vi.mock('../../hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({
    route: null,
    routeSegments: [],
    routeVias: [],
    routeInfo: null,
    setRoute: vi.fn(),
    setRouteInfo: vi.fn(),
    updateRouteForDay,
  }),
}))

vi.mock('../../hooks/useAirtrailConnection', () => ({
  useAirtrailConnection: () => ({ airtrailEnabled: false, connected: false, available: false, loading: false }),
}))

vi.mock('../../repo/accommodationRepo', () => ({
  accommodationRepo: { list: vi.fn(async () => ({ accommodations: [] })) },
}))

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => undefined),
  fetchPhoto: vi.fn(),
}))

// ── The road trip fixtures ────────────────────────────────────────────────────
// One object per hook, kept identity-stable across renders so the hook's own
// memoisation behaves the way it does in the app. Set the fields BEFORE mounting.
const rt = vi.hoisted(() => {
  const vias = {
    byDay: {} as Record<number, Array<{ id: number; day_id: number; after_order_index: number; sequence: number; lat: number; lng: number }>>,
    trackByDay: {} as Record<number, unknown>,
    stale: false,
    editable: true,
    add: vi.fn(async () => {}),
    addMany: vi.fn(async () => {}),
    move: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    reanchor: vi.fn(async () => {}),
  }
  const routes = {
    days: [] as Array<Record<string, unknown>>,
    quietDays: [] as unknown[],
    lines: [] as unknown[],
    lineDays: [] as number[],
    accessLines: [] as unknown[],
    vias: [] as unknown[],
    segments: [] as unknown[],
    totalDistance: 0,
    totalDuration: 0,
    totalStops: 0,
    loading: false,
  }
  const corridor = {
    dayId: '',
    setDayId: vi.fn(),
    day: undefined as Record<string, unknown> | undefined,
    categories: ['fuel'],
    toggleCategory: vi.fn(),
    widthKm: 5,
    setWidthKm: vi.fn(),
    search: {
      results: [] as unknown[],
      progress: { done: 0, total: 0 },
      loading: false,
      capped: false,
      failedAreas: 0,
      truncatedAreas: 0,
      error: false,
      spine: [] as Array<{ lat: number; lng: number }>,
      search: vi.fn(),
      clear: vi.fn(),
    },
    nameFilter: '',
    setNameFilter: vi.fn(),
    anchors: [] as unknown[],
    section: null as unknown,
    setSection: vi.fn(),
    sectionKm: 25,
    setSectionKm: vi.fn(),
    socketFilter: '',
    setSocketFilter: vi.fn(),
    minKw: 0,
    setMinKw: vi.fn(),
    visible: [] as Array<Record<string, unknown>>,
    insertIndexFor: vi.fn(() => 1),
    stopsAlongKm: [] as number[],
  }
  const alt = {
    open: null as null | Record<string, unknown>,
    ask: vi.fn(),
    close: vi.fn(),
  }
  return { vias, routes, corridor, alt }
})

vi.mock('../../components/Roadtrip/useRoadtripVias', () => ({ useRoadtripVias: () => rt.vias }))
vi.mock('../../components/Roadtrip/useRoadtripRoutes', () => ({ useRoadtripRoutes: () => rt.routes }))
vi.mock('../../components/Roadtrip/useRoadtripCorridor', () => ({ useRoadtripCorridor: () => rt.corridor }))
vi.mock('../../components/Roadtrip/useRouteAlternatives', () => ({ useRouteAlternatives: () => rt.alt }))
vi.mock('../../components/Roadtrip/useFollowTrack', () => ({
  useFollowTrack: () => ({ busy: false, dayId: null, run: vi.fn(), attach: vi.fn(), detach: vi.fn() }),
}))

// ── Store fixtures ────────────────────────────────────────────────────────────
const toasts: Array<{ message: string; type: string }> = []

function makeActions() {
  return {
    loadTrip: vi.fn(async () => undefined),
    loadReservations: vi.fn(async () => undefined),
    loadBudgetItems: vi.fn(async () => undefined),
    loadFiles: vi.fn(async () => undefined),
    refreshDays: vi.fn(async () => undefined),
    addPlace: vi.fn(async () => ({ id: 900, name: 'Rasthof' })),
    updatePlace: vi.fn(async () => undefined),
    deletePlace: vi.fn(async () => undefined),
    deletePlacesMany: vi.fn(async () => undefined),
    updatePlacesMany: vi.fn(async () => undefined),
    addFile: vi.fn(async () => undefined),
    assignPlaceToDay: vi.fn(async () => ({ id: 555 })),
    moveAssignment: vi.fn(async () => undefined),
    removeAssignment: vi.fn(async () => undefined),
    reorderAssignments: vi.fn(async () => undefined),
    setAssignmentEndDay: vi.fn(async () => undefined),
    reorderDays: vi.fn(async () => undefined),
    insertDay: vi.fn(async () => undefined),
    updateDayTitle: vi.fn(async () => undefined),
    addReservation: vi.fn(async () => ({ id: 77 })),
    updateReservation: vi.fn(async () => ({ id: 77 })),
    deleteReservation: vi.fn(async () => undefined),
    setSelectedDay: vi.fn(() => undefined),
  }
}
let actions: ReturnType<typeof makeActions>

function wrapper({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>
}

/** Mount with the addon on and the mode on, and wait until both have landed. */
async function renderRoadtrip() {
  if (!rt.routes.days.length && rt.corridor.day) {
    const dayId = Number(rt.corridor.day.dayId)
    const assigned = useTripStore.getState().assignments[String(dayId)] ?? []
    const stops = assigned.length
      ? assigned.filter(a => typeof a.place.lat === 'number' && typeof a.place.lng === 'number').map(a => ({
        assignmentId: a.id, placeId: a.place_id, lat: a.place.lat, lng: a.place.lng,
      }))
      : [0, 1, 2].map(i => ({ assignmentId: i + 1, placeId: i + 1, lat: 53 - i, lng: 10 + i }))
    rt.routes.days = [{ ...rt.corridor.day, stops }]
  }
  rt.routes.days = rt.routes.days.map(day => ({
    schedule: { entries: [] },
    legs: [],
    ...day,
    stops: (day.stops as Array<Record<string, unknown>>).map((stop, i) => ({
      ownerDayId: day.dayId, ownerIndex: i, ...stop,
    })),
  }))
  if (rt.corridor.day) rt.corridor.day = rt.routes.days.find(d => d.dayId === rt.corridor.day?.dayId) ?? rt.corridor.day
  const rendered = renderHook(() => useTripPlanner(), { wrapper })
  await act(async () => { await Promise.resolve() })
  await waitFor(() => expect(rendered.result.current.roadtripActive).toBe(true))
  return rendered
}

function seedTrip(extra: Partial<TripStoreState> = {}) {
  const trip = buildTrip({ id: 42, title: 'Nordkap' })
  useTripStore.setState({
    trip,
    isLoading: false,
    days: [],
    places: [],
    assignments: {},
    reservations: [],
    ...(actions as unknown as Partial<TripStoreState>),
    ...extra,
  } as Partial<TripStoreState>)
  return trip
}

/**
 * Demote the current session to somebody who may look but not touch.
 *
 * An instance admin passes every check by role, so the level alone proves nothing:
 * the user has to be an ordinary one as well.
 */
function asReader(actionKey: string) {
  seedStore(useAuthStore, { user: buildUser({ id: 2, role: 'user' }), isAuthenticated: true })
  usePermissionsStore.setState({ permissions: { [actionKey]: 'admin' } })
}

/** A stop as the rail counts them: an assignment whose place has coordinates. */
function stopAt(id: number, dayId: number, orderIndex: number, over: Record<string, unknown> = {}) {
  return buildAssignment({
    id,
    day_id: dayId,
    order_index: orderIndex,
    place: buildPlace({ id: 1000 + id, lat: 53 + orderIndex, lng: 10 + orderIndex }),
    ...over,
  })
}

/** A row the rail never shows, because the map cannot put it anywhere. */
function placeless(id: number, dayId: number, orderIndex: number) {
  return buildAssignment({
    id,
    day_id: dayId,
    order_index: orderIndex,
    place: buildPlace({ id: 2000 + id, lat: null as never, lng: null as never }),
  })
}

const poi = (over: Record<string, unknown> = {}) => ({
  osm_id: 'node/1',
  name: 'Rasthof Dammer Berge',
  lat: 52.5,
  lng: 8.2,
  category: 'fuel',
  poi_type: 'fuel',
  address: 'A1',
  website: null,
  phone: null,
  opening_hours: null,
  cuisine: null,
  source: 'openstreetmap' as const,
  offRouteKm: 0.4,
  alongKm: 120,
  ...over,
})

const via = (id: number, dayId: number, afterOrderIndex: number, sequence = 0, lat = 53.2, lng = 10.4) =>
  ({ id, day_id: dayId, after_order_index: afterOrderIndex, sequence, lat, lng })

beforeEach(() => {
  vi.clearAllMocks()
  resetAllStores()
  routeParams = { id: '42' }
  searchParams = new URLSearchParams()
  toasts.length = 0
  actions = makeActions()

  rt.vias.byDay = {}
  rt.vias.stale = false
  rt.vias.editable = true
  rt.routes.days = []
  rt.routes.lines = []
  rt.routes.lineDays = []
  rt.corridor.day = undefined
  rt.corridor.visible = []
  rt.corridor.widthKm = 5
  rt.corridor.stopsAlongKm = []
  rt.corridor.search.spine = []
  rt.corridor.insertIndexFor.mockReturnValue(1)
  rt.alt.open = null

  usePluginStore.setState({ plugins: [], loaded: true })
  useBackgroundTasksStore.setState({ tasks: [] })
  window.__addToast = ((message: string, type: string) => {
    toasts.push({ message, type })
    return 1
  }) as unknown as typeof window.__addToast
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true, placesPhotosEnabled: false })

  // The two switches this whole file depends on.
  sessionStorage.setItem('trip-roadtrip-42', '1')
  vi.spyOn(addonsApi, 'enabled').mockResolvedValue({ addons: [{ id: 'roadtrip' }] } as never)

  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue({})
  vi.spyOn(healthApi, 'features').mockResolvedValue({ bookingImport: false, aiParsing: false })
  vi.spyOn(tripsApi, 'getMembers').mockResolvedValue({ owner: null, members: [] })
  vi.spyOn(accommodationsApi, 'list').mockResolvedValue({ accommodations: [] })
  vi.spyOn(accommodationsApi, 'create').mockResolvedValue({ id: 7 } as never)
  vi.spyOn(airtrailApi, 'sync').mockResolvedValue({ changed: 0 })
  vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: '', address: '' } as never)
  vi.mocked(accommodationRepo.list).mockResolvedValue({ accommodations: [] })
})

afterEach(() => {
  delete window.__addToast
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('visit day-end controls', () => {
  const setup = async () => {
    const place = buildPlace({ id: 101 })
    seedTrip({ places: [place], days: [buildDay({ id: 5 })] })
    rt.routes.days = [{ dayId: 5, stops: [{ assignmentId: 11, placeId: 101, endDay: true }] }]
    useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' } }))
    const rendered = await renderRoadtrip()
    act(() => rendered.result.current.selectAssignment(11, 101))
    return rendered
  }

  it('offers the selected visit and saves to its stored day', async () => {
    const { result } = await setup()
    expect(result.current.roadtripEndDay?.active).toBe(true)
    await act(async () => result.current.roadtripEndDay?.onToggle())
    expect(actions.setAssignmentEndDay).toHaveBeenCalledWith(42, 5, 11, false)
  })

  it('hides the control when daily times are off and restores the stored choice when enabled', async () => {
    const { result } = await setup()
    act(() => useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_day_end: '' } })))
    expect(result.current.roadtripEndDay).toBeUndefined()
    act(() => useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_day_end: '18:00' } })))
    expect(result.current.roadtripEndDay?.active).toBe(true)
  })

  it('hides the control in Days mode and from a reader', async () => {
    const { result } = await setup()
    act(() => result.current.toggleRoadtripMode())
    expect(result.current.roadtripEndDay).toBeUndefined()
    act(() => {
      result.current.toggleRoadtripMode()
      asReader('day_edit')
    })
    expect(result.current.roadtripEndDay).toBeUndefined()
  })

  it('reports a rejected change', async () => {
    const { result } = await setup()
    actions.setAssignmentEndDay.mockRejectedValueOnce(new Error('Save failed'))
    await act(async () => result.current.roadtripEndDay?.onToggle())
    expect(toasts.some(t => t.type === 'error')).toBe(true)
  })
})

describe('useTripPlanner road trip: a hit on the drive', () => {
  it('FE-TP-ROAD-001: a corridor hit opens the popup on the day being searched, at its place in the chain', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(2)

    const { result } = await renderRoadtrip()
    act(() => { result.current.handlePoiClick(poi() as never) })

    expect(result.current.stopDraft).toMatchObject({ dayId: 5, position: 2, dayNumber: 1 })
    // Not the full form: the popup is the point of the corridor.
    expect(result.current.showPlaceForm).toBe(false)
  })

  it('FE-TP-ROAD-002: somewhere to sleep opens in overnight mode, ending on the next day of the trip', async () => {
    // Ordered by the trip's own day order, not by array position: a day list can be
    // sorted by anything, and "the next day" has to mean the next day driven.
    seedTrip({
      days: [
        buildDay({ id: 7, day_number: 3 }),
        buildDay({ id: 5, day_number: 1, date: '2025-06-01' }),
        buildDay({ id: 6, day_number: 2, date: '2025-06-02' }),
      ],
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderRoadtrip()
    act(() => { result.current.handlePoiClick(poi({ category: 'hotel' }) as never) })

    const overnight = result.current.stopDraft?.overnight
    expect(overnight?.defaultEndDayId).toBe(6)
    expect(overnight?.days.map(d => d.id)).toEqual([5, 6, 7])
  })

  it('FE-TP-ROAD-003: on the last day of the trip the night ends where it began', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderRoadtrip()
    act(() => { result.current.handlePoiClick(poi({ category: 'campsite' }) as never) })

    expect(result.current.stopDraft?.overnight?.defaultEndDayId).toBe(5)
  })

  it('FE-TP-ROAD-004: a fuel stop gets no overnight mode, so the popup stays a dwell dialog', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderRoadtrip()
    act(() => { result.current.handlePoiClick(poi() as never) })

    expect(result.current.stopDraft?.overnight).toBeUndefined()
  })

  it('FE-TP-ROAD-005: an ordinary map POI still goes to the full form, carrying the day being driven', async () => {
    // Without the day it lands in the unplanned pool, and road trip mode shows no pool,
    // so a just-added place would disappear without a trace.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderRoadtrip()
    const { alongKm: _drop, offRouteKm: _drop2, ...plain } = poi()
    act(() => { result.current.handlePoiClick(plain as never) })

    expect(result.current.stopDraft).toBeNull()
    expect(result.current.showPlaceForm).toBe(true)
    expect(result.current.placeFormDayId).toBe(5)
  })

  it('FE-TP-ROAD-006: a reader who may not add places gets nothing at all', async () => {
    asReader('place_edit')
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderRoadtrip()
    act(() => { result.current.handlePoiClick(poi() as never) })

    expect(result.current.stopDraft).toBeNull()
    expect(result.current.showPlaceForm).toBe(false)
  })
})

describe('useTripPlanner road trip: saving a hit', () => {
  const openDraft = async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(1)
    const rendered = await renderRoadtrip()
    act(() => { rendered.result.current.handlePoiClick(poi() as never) })
    return rendered
  }

  it('FE-TP-ROAD-007: the place, its position and the via correction go in that order, then the day re-routes', async () => {
    rt.vias.byDay = { 5: [via(1, 5, 1)] }
    const { result } = await openDraft()

    await act(async () => { await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 }) })

    expect(actions.addPlace).toHaveBeenCalledWith(42, expect.objectContaining({
      name: 'Rasthof Dammer Berge', stop_type: 'fuel', duration_minutes: 15, osm_id: 'node/1',
    }))
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 900, 1)
    // Awaited before the re-route: a correction landing after it would draw the wrong
    // road first and the right one a moment later.
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, expect.anything())
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
    expect(result.current.stopDraft).toBeNull()
    expect(toasts.some(t => t.type === 'success')).toBe(true)
  })

  it('FE-TP-ROAD-008: a failed write is said out loud and the draft stays open', async () => {
    const { result } = await openDraft()
    actions.addPlace.mockRejectedValue(new Error('disk full'))

    await act(async () => { await result.current.saveStopDraft({ stopType: null, dwellMinutes: 0 }) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'disk full')).toBe(true)
    expect(result.current.stopDraft).not.toBeNull()
  })

  it('FE-TP-ROAD-009: saving with nothing open writes nothing', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 10 }) })

    expect(actions.addPlace).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-010: a night writes the place, its day and the booking, then reloads the bookings', async () => {
    const { result } = await openDraft()

    await act(async () => {
      await result.current.saveStopDraftAsNight({ endDayId: 6, checkIn: '15:00', checkOut: '10:00' })
    })

    const [, payload] = actions.addPlace.mock.calls[0] as unknown as [number, Record<string, unknown>]
    expect(payload.stop_type).toBe('hotel')
    expect(payload.duration_minutes).toBeUndefined()
    expect(accommodationsApi.create).toHaveBeenCalledWith(42, {
      place_id: 900, start_day_id: 5, end_day_id: 6, check_in: '15:00', check_out: '10:00',
    })
    expect(accommodationRepo.list).toHaveBeenCalled()
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
  })

  it('FE-TP-ROAD-011: times nobody filled in are left out rather than sent empty', async () => {
    // A hotel found on a map has no idea when its reception opens, and the server
    // stores null.
    const { result } = await openDraft()

    await act(async () => {
      await result.current.saveStopDraftAsNight({ endDayId: 6, checkIn: '', checkOut: '' })
    })

    expect(accommodationsApi.create).toHaveBeenCalledWith(42, {
      place_id: 900, start_day_id: 5, end_day_id: 6,
    })
  })

  it('FE-TP-ROAD-012: a booking that will not save is reported and the draft is kept', async () => {
    const { result } = await openDraft()
    vi.mocked(accommodationsApi.create).mockRejectedValue(new Error('no room'))

    await act(async () => {
      await result.current.saveStopDraftAsNight({ endDayId: 6, checkIn: '', checkOut: '' })
    })

    expect(toasts.some(t => t.type === 'error' && t.message === 'no room')).toBe(true)
    expect(result.current.stopDraft).not.toBeNull()
  })

  it('FE-TP-ROAD-013: asking for the full form carries the kind and the dwell the popup had worked out', async () => {
    // Leaving them behind is what turned a fuel stop into a numbered destination on the
    // way to the full form, silently and in every total.
    const { result } = await openDraft()

    act(() => { result.current.stopDraftToForm({ stopType: 'fuel', dwellMinutes: 20 }) })

    expect(result.current.stopDraft).toBeNull()
    expect(result.current.showPlaceForm).toBe(true)
    expect(result.current.prefillCoords).toMatchObject({ stop_type: 'fuel', duration_minutes: 20 })
    expect(result.current.placeFormDayId).toBe(5)
  })

  it('FE-TP-ROAD-014: handing over with nothing decided leaves both fields empty', async () => {
    const { result } = await openDraft()

    act(() => { result.current.stopDraftToForm() })

    expect(result.current.prefillCoords).toMatchObject({ stop_type: null, duration_minutes: undefined })
  })

  it('FE-TP-ROAD-015: a place on this trip from the same OSM object is named in the popup', async () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      places: [buildPlace({ id: 3, name: 'Aral A1', osm_id: 'node/1' })],
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    act(() => { result.current.handlePoiClick(poi() as never) })

    expect(result.current.stopDraftDuplicate).toBe('Aral A1')
  })

  it('FE-TP-ROAD-057: which side of the new stop a via falls on is measured on the road driven', async () => {
    // Both the via and the new stop are projected onto the day's current routed line,
    // so the comparison is "which one does the car reach first" rather than a
    // straight-line guess.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(1)
    rt.routes.days = [{
      dayId: 5,
      stops: [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }],
      geometry: [[53.55, 9.99], [53.2, 10.9], [52.9, 12.0], [52.52, 13.4]],
    }]
    // One via before the hit on the road, one after it.
    rt.vias.byDay = { 5: [via(1, 5, 0, 0, 53.2, 10.9), via(2, 5, 0, 1, 52.9, 12.0)] }

    const { result } = await renderRoadtrip()
    // The hit sits between them, at the second shape point of the drive.
    act(() => { result.current.handlePoiClick(poi({ lat: 53.05, lng: 11.45 }) as never) })
    await act(async () => { await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 10 }) })

    const [, plan] = rt.vias.reanchor.mock.calls[0] as unknown as [number, { vias: Array<{ id: number; after_order_index: number }> }]
    const moved = new Map(plan.vias.map(v => [v.id, v.after_order_index]))
    // The one the car passes first keeps its leg; the one past the new stop moves on.
    expect(moved.get(1)).not.toBe(moved.get(2))
  })

  it('FE-TP-ROAD-058: saving through the full form still lands the stop where it will be driven past', async () => {
    // The slice has taken a position all along and nothing ever passed it, so a place
    // added by way of the full form went to the end of the day.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(2)
    const { result } = await renderRoadtrip()

    act(() => { result.current.handlePoiClick(poi() as never) })
    act(() => { result.current.stopDraftToForm({ stopType: 'fuel', dwellMinutes: 5 }) })
    await act(async () => { await result.current.handleSavePlace({ name: 'Rasthof' }) })

    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 900, 2)
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
  })

  it('FE-TP-ROAD-059: a day link that fails is said out loud, and the place itself stands', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()
    actions.assignPlaceToDay.mockRejectedValue(new Error('day gone'))

    act(() => { result.current.handlePoiClick(poi() as never) })
    act(() => { result.current.stopDraftToForm() })
    await act(async () => { await result.current.handleSavePlace({ name: 'Rasthof' }) })

    expect(actions.addPlace).toHaveBeenCalled()
    expect(toasts.some(t => t.type === 'error' && t.message === 'day gone')).toBe(true)
  })

  it('FE-TP-ROAD-016: with nothing open there is nothing to warn about', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    expect(result.current.stopDraftDuplicate).toBeNull()
  })
})

describe('useTripPlanner road trip: what the rail moves', () => {
  const dayWithStops = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: {
        '5': [stopAt(11, 5, 0), placeless(12, 5, 1), stopAt(13, 5, 2), stopAt(14, 5, 3)],
        '6': [stopAt(21, 6, 0)],
      },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
  }

  it('FE-TP-ROAD-017: a reorder rebuilds the day from its COMPLETE list, keeping the rows the rail hides', async () => {
    // Both reorderAssignments and the WebSocket handler rebuild the day purely from the
    // ids they are given, so a row left out here vanishes for every session watching.
    dayWithStops()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 14, 0) })

    const [, , ids] = actions.reorderAssignments.mock.calls[0] as unknown as [number, number, number[]]
    expect(ids).toHaveLength(4)
    expect(ids).toContain(12)
    expect(ids[0]).toBe(14)
  })

  it('FE-TP-ROAD-018: the rail index counts stops, not rows, so it maps onto the full list', async () => {
    dayWithStops()
    const { result } = await renderRoadtrip()

    // Rail index 1 is assignment 13: the placeless row was never in that space.
    await act(async () => { await result.current.reorderRoadtripStop(5, 11, 1) })

    const [, , ids] = actions.reorderAssignments.mock.calls[0] as unknown as [number, number, number[]]
    expect(ids).toEqual([12, 13, 11, 14])
  })

  it('FE-TP-ROAD-019: the vias are re-anchored in the rail own index space', async () => {
    dayWithStops()
    rt.vias.byDay = { 5: [via(1, 5, 0), via(2, 5, 1)] }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 11, 2) })

    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, expect.anything())
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
  })

  it('FE-TP-ROAD-020: dropping a stop on itself changes nothing', async () => {
    dayWithStops()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 11, 0) })

    expect(actions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-021: an assignment the day does not hold is not moved', async () => {
    dayWithStops()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 999, 0) })

    expect(actions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-022: a failed reorder is reported rather than swallowed', async () => {
    dayWithStops()
    actions.reorderAssignments.mockRejectedValue(new Error('conflict'))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 14, 0) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'conflict')).toBe(true)
  })

  it('FE-TP-ROAD-023: a reader may not reorder the drive', async () => {
    asReader('day_edit')
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: { '5': [stopAt(11, 5, 0), stopAt(13, 5, 1)] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 11, 1) })

    expect(actions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-024: moving to another day corrects BOTH days and re-routes both', async () => {
    // The stop leaves a gap on one side and opens one on the other, so each day needs
    // its own correction.
    dayWithStops()
    rt.vias.byDay = { 5: [via(1, 5, 1)], 6: [via(2, 6, 0)] }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripStopToDay(5, 13, 6, 1) })

    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 13, 5, 6, expect.any(Number))
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, expect.anything())
    expect(rt.vias.reanchor).toHaveBeenCalledWith(6, expect.anything())
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
    expect(updateRouteForDay).toHaveBeenCalledWith(6)
  })

  it('FE-TP-ROAD-025: a move onto the day it is already on is not a move', async () => {
    dayWithStops()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripStopToDay(5, 13, 5, 0) })

    expect(actions.moveAssignment).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-026: a day the rail draws no drive for can still be dropped onto', async () => {
    // A day with one stop or none is exactly what a stop gets moved onto when a leg
    // turns out to be too long.
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 9, day_number: 4 })],
      assignments: { '5': [stopAt(11, 5, 0), stopAt(13, 5, 1)], '9': [] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripStopToDay(5, 13, 9, 0) })

    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 13, 5, 9, 0)
  })

  it('FE-TP-ROAD-027: a failed move is reported', async () => {
    dayWithStops()
    actions.moveAssignment.mockRejectedValue(new Error('gone'))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripStopToDay(5, 13, 6, 0) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'gone')).toBe(true)
  })

  it('FE-TP-ROAD-028: a reader may not move a stop between days', async () => {
    asReader('day_edit')
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: { '5': [stopAt(11, 5, 0)], '6': [] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripStopToDay(5, 11, 6, 0) })

    expect(actions.moveAssignment).not.toHaveBeenCalled()
  })
})

describe('useTripPlanner road trip: one stop at a time', () => {
  const oneStop = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: { '5': [stopAt(11, 5, 0)] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
  }

  it('FE-TP-ROAD-029: making a stop a pause writes one field on one place', async () => {
    oneStop()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStopKind(1011, 'rest_area') })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 1011, { stop_type: 'rest_area' })
  })

  it('FE-TP-ROAD-030: turning it back into a destination sends null, and a failure is reported', async () => {
    oneStop()
    actions.updatePlace.mockRejectedValue(new Error('locked'))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStopKind(1011, null) })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 1011, { stop_type: null })
    expect(toasts.some(t => t.type === 'error' && t.message === 'locked')).toBe(true)
  })

  it('FE-TP-ROAD-031: clearing a stay sends a zero, never a null', async () => {
    // The update statement folds a null into "leave it alone", so a null could give a
    // stop a stay and never take one away.
    oneStop()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStay(1011, 0) })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 1011, { duration_minutes: 0 })

    actions.updatePlace.mockRejectedValue(new Error('read only'))
    await act(async () => { await result.current.setRoadtripStay(1011, 45) })
    expect(toasts.some(t => t.type === 'error' && t.message === 'read only')).toBe(true)
  })

  it('FE-TP-ROAD-032: a reader may not set a stay', async () => {
    asReader('place_edit')
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStay(1011, 45) })
    expect(actions.updatePlace).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-033: a driving limit goes straight to the settings, and a failure is said', async () => {
    oneStop()
    const updateSettings = vi.mocked(roadtripPreferencesRepo.update)
    updateSettings.mockResolvedValue({})
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.saveRoadtripLimit?.('roadtrip_leg_minutes', 180) })
    expect(updateSettings).toHaveBeenCalledWith(42, { roadtrip_leg_minutes: 180 })

    updateSettings.mockRejectedValue(new Error('nope'))
    await act(async () => { await result.current.saveRoadtripLimit?.('roadtrip_leg_minutes', 90) })
    expect(toasts.some(t => t.type === 'error')).toBe(true)
  })
})

describe('useTripPlanner road trip: other ways of driving a leg', () => {
  const routedDay = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        { lat: 53.55, lng: 9.99, name: 'Hamburg' },
        { lat: 52.52, lng: 13.4, name: 'Berlin' },
      ],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
    }]
  }

  it('FE-TP-ROAD-034: asking passes the vias of THAT leg, so the road being driven is offered too', async () => {
    routedDay()
    rt.vias.byDay = { 5: [via(1, 5, 0, 1), via(2, 5, 0, 0), via(3, 5, 1)] }
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, 0) })

    const [dayId, legIndex, , , profile, legVias] = rt.alt.ask.mock.calls[0] as [number, number, unknown, unknown, string, Array<{ id: number }>]
    expect([dayId, legIndex, profile]).toEqual([5, 0, 'driving'])
    // Only the vias on leg 0, and in the order the car passes them.
    expect(legVias.map(v => v.id)).toEqual([2, 1])
  })

  it('FE-TP-ROAD-035: asking again for the leg already open closes it instead', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, 0) })

    expect(rt.alt.close).toHaveBeenCalled()
    expect(rt.alt.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-036: a leg with nothing at its far end is not a leg', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, 1) })

    expect(rt.alt.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-037: choosing the road already driven changes nothing but the picker', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [{ current: true }], loading: false, error: false }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-038: the router own preference clears the leg in ONE write', async () => {
    // One delete per via meant a full trip re-route between each of them, so undoing a
    // detour with three vias drew three routes.
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [{ direct: true }], loading: false, error: false }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [], [0])
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-039: a clear that fails leaves the picker open and says so', async () => {
    // Swallowing it closed the picker on a leg that still carries its via and still
    // routes the old way, so the traveller believed they had undone the detour.
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [{ direct: true }], loading: false, error: false }
    rt.vias.addMany.mockRejectedValue(new Error('offline'))
    const { result } = await renderRoadtrip()
    // The mode starts off until the addon feed answers, and that effect closes the
    // picker once on the way in. Measure from there.
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'offline')).toBe(true)
    expect(rt.alt.close).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-040: another road is stored as a via where it differs most, not as a polyline', async () => {
    routedDay()
    rt.alt.open = {
      dayId: 5, index: 0, loading: false, error: false,
      routes: [{ divergence: { lat: 53.1, lng: 11.9 } }],
    }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53.1, 11.9)
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-041: a via that will not save leaves the picker open', async () => {
    routedDay()
    rt.alt.open = {
      dayId: 5, index: 0, loading: false, error: false,
      routes: [{ divergence: { lat: 53.1, lng: 11.9 } }],
    }
    rt.vias.add.mockRejectedValue(new Error('rejected'))
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'rejected')).toBe(true)
    expect(rt.alt.close).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-042: choosing an index nothing was offered at does nothing', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(3) })

    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(rt.vias.addMany).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-043: the overlays and the frame come from the open leg, and empty when it closes', async () => {
    routedDay()
    rt.alt.open = {
      dayId: 5, index: 0, loading: false, error: false,
      routes: [
        { coordinates: [[53.5, 10], [52.5, 13]], distance: 290_000, duration: 10_800, divergence: { lat: 53, lng: 11 } },
        { coordinates: [[53.5, 10], [53, 12], [52.5, 13]], distance: 310_000, duration: 11_400, divergence: { lat: 53, lng: 12 } },
      ],
    }
    const { result } = await renderRoadtrip()

    expect(result.current.alternativeOverlays).toHaveLength(2)
    // Derived from the overlays, not from the two endpoints, so the frame holds the
    // whole of every alternative including one that swings far off the direct line.
    expect(result.current.alternativeFocusPoints.length).toBeGreaterThan(2)
  })

  it('FE-TP-ROAD-044: leaving road trip mode closes the picker over the map', async () => {
    // The switch sits in the left sidebar and is reachable while the bar is open, and
    // the overlay depends only on the picker: flipping the mode off left pale blue
    // alternatives drawn on an ordinary planner map with no way to dismiss them.
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    act(() => { result.current.toggleRoadtripMode() })

    await waitFor(() => expect(rt.alt.close).toHaveBeenCalled())
    expect(result.current.roadtripActive).toBe(false)
  })

  it('FE-TP-ROAD-045: closing the picker clears the road it had lit up', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, index: 0, routes: [], loading: false, error: false }
    const { result, rerender } = await renderRoadtrip()

    act(() => { result.current.setHighlightedAlternative(1) })
    expect(result.current.highlightedAlternative).toBe(1)

    rt.alt.open = null
    rerender()

    await waitFor(() => expect(result.current.highlightedAlternative).toBeNull())
  })
})

describe('useTripPlanner road trip: shaping the drive on the map', () => {
  const twoRoutedDays = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [
      {
        dayId: 5,
        stops: [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }],
        geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
      },
      {
        dayId: 6,
        stops: [{ lat: 48.13, lng: 11.58 }, { lat: 47.8, lng: 13.05 }],
        geometry: [[48.13, 11.58], [47.9, 12.3], [47.8, 13.05]],
      },
    ]
  }

  it('FE-TP-ROAD-046: a click on the drawn route lands on the day whose line it is nearest', async () => {
    twoRoutedDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.0, 11.5) })

    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53.0, 11.5)
  })

  it('FE-TP-ROAD-047: a click that landed on some other line is not a via anywhere', async () => {
    twoRoutedDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(41.9, 12.5) })

    expect(rt.vias.add).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-048: a day with no drawn line is skipped rather than measured against', async () => {
    twoRoutedDays()
    rt.routes.days = [{ dayId: 5, stops: [], geometry: [] }, rt.routes.days[1]]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(47.9, 12.3) })

    expect(rt.vias.add).toHaveBeenCalledWith(6, 0, 47.9, 12.3)
  })

  it('FE-TP-ROAD-049: a via that will not save is reported', async () => {
    twoRoutedDays()
    rt.vias.add.mockRejectedValue(new Error('read only'))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.0, 11.5) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'read only')).toBe(true)
  })

  it('FE-TP-ROAD-050: a reader may not shape the drive at all', async () => {
    asReader('day_edit')
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{ dayId: 5, stops: [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }], geometry: [[53.55, 9.99], [52.52, 13.4]] }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.0, 11.5) })
    await act(async () => { await result.current.moveRoadtripVia(5, 1, 53.1, 11.6) })
    await act(async () => { await result.current.removeRoadtripVia(5, 1) })

    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(rt.vias.move).not.toHaveBeenCalled()
    expect(rt.vias.remove).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-051: dragging a via redraws the route through its new position', async () => {
    twoRoutedDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 3, 53.2, 11.7) })
    expect(rt.vias.move).toHaveBeenCalledWith(5, 3, 53.2, 11.7, 0)

    rt.vias.move.mockRejectedValue(new Error('stale'))
    await act(async () => { await result.current.moveRoadtripVia(5, 3, 53.2, 11.7) })
    expect(toasts.some(t => t.type === 'error' && t.message === 'stale')).toBe(true)
  })

  it('FE-TP-ROAD-053: a via dragged past a stop is re-pinned to the leg it landed on', async () => {
    // The bug this exists for. A drag used to send only the new coordinates, so a via
    // pulled beyond the stop it used to precede kept claiming the earlier leg: the route
    // ran out to the point and back before carrying on, which reads as the drag doing
    // nothing at all. Three stops so there are two legs to land between.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      stops: [{ lat: 53.55, lng: 9.99 }, { lat: 53.85, lng: 11.45 }, { lat: 52.52, lng: 13.4 }],
      geometry: [[53.55, 9.99], [53.87, 10.7], [53.85, 11.45], [53.87, 11.53], [52.52, 13.4]],
    }]
    const { result } = await renderRoadtrip()

    // Dropped on the first leg, then dragged past the middle stop onto the second.
    await act(async () => { await result.current.addRoadtripVia(53.87, 10.7) })
    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53.87, 10.7)

    await act(async () => { await result.current.moveRoadtripVia(5, 9, 53.87, 11.53) })
    expect(rt.vias.move).toHaveBeenCalledWith(5, 9, 53.87, 11.53, 1)
  })

  it('FE-TP-ROAD-054: a drag is measured against its own day, however close another one runs', async () => {
    // Placing a via lets the nearest day win, which is right for a click on the map.
    // A drag is not that: the via already belongs to a day, and handing it to a
    // neighbouring day whose road happens to pass closer would make it vanish from the
    // one it was dragged in.
    twoRoutedDays()
    const { result } = await renderRoadtrip()

    // Right on day 6's line, but dragged within day 5.
    await act(async () => { await result.current.moveRoadtripVia(5, 3, 47.9, 12.3) })

    expect(rt.vias.move).toHaveBeenCalledWith(5, 3, 47.9, 12.3, expect.any(Number))
    // Day 6 never saw it.
    expect(rt.vias.move).not.toHaveBeenCalledWith(6, expect.anything(), expect.anything(), expect.anything(), expect.anything())
  })

  it('FE-TP-ROAD-055: a drag far off the road still moves, without an anchor to offer', async () => {
    // No distance guard on a drag, unlike on a click: pulling a via well away from the
    // current road is the whole point of the gesture. A day with no line to measure
    // against simply sends no anchor, and the existing pin stays as it was.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{ dayId: 5, stops: [], geometry: [] }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 3, 41.9, 12.5) })

    expect(rt.vias.move).toHaveBeenCalledWith(5, 3, 41.9, 12.5, undefined)
  })

  it('FE-TP-ROAD-052: removing a via lets the drive take the direct road again', async () => {
    twoRoutedDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.removeRoadtripVia(5, 3) })
    expect(rt.vias.remove).toHaveBeenCalledWith(5, 3)

    rt.vias.remove.mockRejectedValue(new Error('vanished'))
    await act(async () => { await result.current.removeRoadtripVia(5, 3) })
    expect(toasts.some(t => t.type === 'error' && t.message === 'vanished')).toBe(true)
  })
})

describe('useTripPlanner road trip: dropping a hit where it belongs', () => {
  const corridorWithHit = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.visible = [poi({ osm_id: 'node/7' })]
    rt.corridor.search.spine = [
      { lat: 53.55, lng: 9.99 },
      { lat: 53.0, lng: 11.5 },
      { lat: 52.52, lng: 13.4 },
    ]
    rt.corridor.stopsAlongKm = [0, 290]
    rt.corridor.widthKm = 5
  }

  it('FE-TP-ROAD-053: the drop coordinate decides, not the projection the corridor made', async () => {
    // The two differ whenever a drive passes near the same spot twice, and the
    // automatic projection can only pick one of them.
    corridorWithHit()
    const { result } = await renderRoadtrip()

    act(() => { result.current.dropPoiOnRoute('node/7', 53.0, 11.5) })

    expect(result.current.stopDraft).toMatchObject({ dayId: 5, dayNumber: 1 })
    expect(result.current.stopDraft?.poi.osm_id).toBe('node/7')
  })

  it('FE-TP-ROAD-054: a drop nowhere near the drive is ignored rather than guessed at', async () => {
    corridorWithHit()
    const { result } = await renderRoadtrip()

    act(() => { result.current.dropPoiOnRoute('node/7', 41.9, 12.5) })

    expect(result.current.stopDraft).toBeNull()
  })

  it('FE-TP-ROAD-055: a hit the corridor is no longer showing cannot be dropped', async () => {
    corridorWithHit()
    const { result } = await renderRoadtrip()

    act(() => { result.current.dropPoiOnRoute('node/999', 53.0, 11.5) })

    expect(result.current.stopDraft).toBeNull()
  })

  it('FE-TP-ROAD-056: a reader may not drop one at all', async () => {
    asReader('place_edit')
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.visible = [poi({ osm_id: 'node/7' })]
    rt.corridor.search.spine = [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }]
    const { result } = await renderRoadtrip()

    act(() => { result.current.dropPoiOnRoute('node/7', 53.0, 11.5) })

    expect(result.current.stopDraft).toBeNull()
  })
})

/** A stop as the rail DRAWS it: a point on a card, naming the day it is STORED on. */
const drawn = (placeId: number, lat: number, lng: number, ownerDayId: number, ownerIndex: number) => ({
  placeId, name: `Stop ${placeId}`, lat, lng, ownerDayId, ownerIndex,
})

/** Four drawn legs: two on the first day, one each on the two after it. */
const LINES: [number, number][][] = [
  [[53.55, 9.99], [53.2, 10.7]],
  [[53.2, 10.7], [52.52, 13.4]],
  [[52.52, 13.4], [50.1, 12.0]],
  [[50.1, 12.0], [48.13, 11.58]],
]

/** Per-day colours on or off, without dropping the defaults the providers read. */
function setDayColors(on: boolean) {
  useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, roadtrip_day_colors: on } })
}

describe('useTripPlanner road trip: folding a day off the map', () => {
  /**
   * Three cards, and two of the places drawn on two cards each: the stop a day ends on is
   * the stop the next one sets off from. That overlap is what the second pass below is
   * about, and a fixture without it would let a one-pass answer through.
   */
  const threeCards = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 }), buildDay({ id: 7, day_number: 3 })],
      places: [
        buildPlace({ id: 1101, lat: 53.55, lng: 9.99 }),
        buildPlace({ id: 1102, lat: 52.52, lng: 13.4 }),
        buildPlace({ id: 1103, lat: 50.1, lng: 12.0 }),
        buildPlace({ id: 1104, lat: 48.13, lng: 11.58 }),
      ],
    })
    const places = useTripStore.getState().places
    useTripStore.setState({ assignments: { '5': places.map((place, i) => buildAssignment({ id: i + 1, day_id: 5, place_id: place.id, place })) } })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [
      { dayId: 5, dayNumber: 1, stops: [drawn(1101, 53.55, 9.99, 5, 0), drawn(1102, 52.52, 13.4, 5, 1)], geometry: LINES[0] },
      { dayId: 6, dayNumber: 2, stops: [drawn(1102, 52.52, 13.4, 6, 0), drawn(1103, 50.1, 12.0, 6, 1)], geometry: LINES[2] },
      { dayId: 7, dayNumber: 3, stops: [drawn(1103, 50.1, 12.0, 7, 0), drawn(1104, 48.13, 11.58, 7, 1)], geometry: LINES[3] },
    ]
    rt.routes.lines = LINES
    rt.routes.lineDays = [1, 1, 2, 3]
  }

  it('FE-TP-ROAD-060: folding a day folds that one alone, and folding it again brings it back', async () => {
    // One set for the whole rail, so a header that wrote its own answer over it instead
    // of editing a copy would fold one card and unfold every other in the same click.
    threeCards()
    const { result } = await renderRoadtrip()

    act(() => { result.current.toggleRoadtripDay(6) })
    act(() => { result.current.toggleRoadtripDay(7) })
    expect([...result.current.collapsedRoadtripDays]).toEqual([6, 7])

    act(() => { result.current.toggleRoadtripDay(6) })
    expect([...result.current.collapsedRoadtripDays]).toEqual([7])
  })

  it('FE-TP-ROAD-061: a folded card takes ITS lines off the map and leaves the rest drawn', async () => {
    // The fold is keyed by day id and the lines are labelled by day number. They are
    // different numbers on this trip, as on any trip whose days were not created in
    // order, so a filter built from the wrong one quietly hides nothing at all.
    threeCards()
    const { result } = await renderRoadtrip()
    expect(result.current.roadtripMapLines).toHaveLength(4)

    act(() => { result.current.toggleRoadtripDay(6) })

    expect(result.current.roadtripMapLines).toEqual([LINES[0], LINES[1], LINES[3]])
  })

  it('FE-TP-ROAD-062: the colours drop with the lines, so what is left still lines up', async () => {
    // The map reads the two lists side by side. Leaving a folded day colour in shifts
    // every colour after it onto the wrong road, which reads as the days having moved.
    threeCards()
    const { result } = await renderRoadtrip()
    // Off is an absent list rather than a list of blues: a trip that never turns this on
    // is handed nothing and the map paints what it always painted.
    expect(result.current.roadtripLineColors).toBeUndefined()

    act(() => { setDayColors(true) })
    act(() => { result.current.toggleRoadtripDay(6) })

    expect(result.current.roadtripLineColors).toEqual([dayColor(1), dayColor(1), dayColor(3)])
    expect(result.current.roadtripLineColors).toHaveLength(result.current.roadtripMapLines.length)
  })

  it('FE-TP-ROAD-063: a folded card takes its own stops off the map with it', async () => {
    threeCards()
    const { result } = await renderRoadtrip()

    act(() => { result.current.toggleRoadtripDay(5) })

    expect(result.current.roadtripMapPlaces.map(p => p.id)).not.toContain(1101)
    // The fold and nothing else: the planner own map still holds it, so a filter that
    // dropped the place for some unrelated reason would show up right here.
    expect(result.current.mapPlaces.map(p => p.id)).toContain(1101)
  })

  it('FE-TP-ROAD-064: a stop another card still draws stays, and goes only when that card folds too', async () => {
    // The second pass is the whole rule. The place a day ends on is the place the next
    // day sets off from, so folding one card must not rub it off the other.
    threeCards()
    const { result } = await renderRoadtrip()

    act(() => { result.current.toggleRoadtripDay(5) })
    expect(result.current.roadtripMapPlaces.map(p => p.id)).toEqual([1102, 1103, 1104])

    act(() => { result.current.toggleRoadtripDay(6) })
    expect(result.current.roadtripMapPlaces.map(p => p.id)).toEqual([1103, 1104])
  })
})

describe('useTripPlanner road trip: how full one stop fills up', () => {
  it('FE-TP-ROAD-065: the fill is one field on one place, and handing it back sends null rather than nothing', async () => {
    // null is not "leave it alone", it is "follow my own setting again" — the only way
    // back from a figure typed on a single stop. Left out of the payload the update folds
    // it into "unchanged" and the stop keeps the number for good.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })], assignments: { '5': [stopAt(11, 5, 0)] } })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStopFill(1011, 80) })
    expect(actions.updatePlace).toHaveBeenCalledWith(42, 1011, { fill_percent: 80 })

    actions.updatePlace.mockRejectedValue(new Error('read only'))
    await act(async () => { await result.current.setRoadtripStopFill(1011, null) })
    expect(actions.updatePlace).toHaveBeenLastCalledWith(42, 1011, { fill_percent: null })
    expect(toasts.some(t => t.type === 'error' && t.message === 'read only')).toBe(true)
  })
})

describe('useTripPlanner road trip: a card that opens with yesterday stop', () => {
  /**
   * One card, day 6, whose drive begins with a stop stored on day 5: the night drive
   * arrived after midnight, so the rail draws that stop here while the server still files
   * it under the day it set off from.
   */
  const spilledCard = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [drawn(1102, 53.0, 11.5, 5, 1), drawn(1103, 52.52, 13.4, 6, 0)],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.8, 12.4], [52.52, 13.4]],
    }]
  }

  it('FE-TP-ROAD-066: a via is filed under the day its anchor stop is STORED on, not the card it is drawn on', async () => {
    // Written with the card own numbers the via matches no stop the next time the day is
    // routed: the road springs back to where it was and the gesture reads as having done
    // nothing at all.
    spilledCard()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(52.8, 12.4) })

    expect(rt.vias.add).toHaveBeenCalledWith(5, 1, 52.8, 12.4)
  })

  it('FE-TP-ROAD-072: a via dropped on the incoming night drive follows the stop it left from', async () => {
    // The stretch between the card first drawn point and its first stop is last night
    // driving: it is drawn here, but it leaves from a stop on the card before this one.
    // Anchored to this card first stop instead, the via would be filed on the leg AFTER
    // that stop, and the route would run forward, double back to the point and carry on.
    //
    // The rule used to be asked of the insert index, which cannot answer it:
    // insertIndexForAlong clamps to at least 1 for any card with two stops or more, and
    // the rail publishes no other kind. The guard read correctly and never ran.
    spilledCard()
    rt.routes.days[0].spills = [{
      at: 0,
      count: 1,
      fromDayNumber: 1,
      // The stop the night drive left from: FIRST on day 5, while the first stop drawn
      // on this card is the second one, reached after midnight. Different numbers on
      // purpose, or the two paths through the lookup would answer alike and this case
      // would pass whichever one ran.
      fromStop: drawn(1101, 53.55, 9.99, 5, 0),
    }]
    const { result } = await renderRoadtrip()

    // Half way along the night stretch, well before the first stop drawn on this card.
    await act(async () => { await result.current.addRoadtripVia(53.3, 10.7) })

    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53.3, 10.7)
  })

  it('FE-TP-ROAD-073: a point before the first stop of an ordinary card still takes that stop', async () => {
    // The other half of the same rule, and the reason it is asked of the spill rather
    // than of the distance alone: a card that received no night drive has nothing before
    // its first stop but its own first leg, so a point there belongs on that leg.
    spilledCard()
    rt.routes.days[0].spills = []
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.3, 10.7) })

    expect(rt.vias.add).toHaveBeenCalledWith(5, 1, 53.3, 10.7)
  })

  it('FE-TP-ROAD-067: a drag keeps to the day the via is stored on, wherever that day stops are drawn', async () => {
    // Not "the card with that id". After a night drive the stops of day 5 are drawn on
    // card 6, and measuring the drag against card 5 alone leaves it with no anchor to
    // offer — which is exactly the anchor it needed.
    spilledCard()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52.8, 12.4) })
    expect(rt.vias.move).toHaveBeenCalledWith(5, 9, 52.8, 12.4, 1)

    // The same rule the other way round: the stop nearest that point belongs to day 5, so
    // a via of day 6 takes no anchor from it and the pin it already has stands.
    await act(async () => { await result.current.moveRoadtripVia(6, 9, 52.8, 12.4) })
    expect(rt.vias.move).toHaveBeenLastCalledWith(6, 9, 52.8, 12.4, undefined)
  })
})

describe('useTripPlanner road trip: somewhere to fill up', () => {
  /**
   * A day driven straight down the tenth meridian, so a kilometre along the road is a
   * kilometre anybody can check: a degree of latitude is 111 km and nothing here bends.
   * Its first two stops are stored on the day before, the night drive having arrived
   * after midnight, which is what the accepting case turns on.
   */
  const drivenCard = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [drawn(1201, 53, 10, 5, 1), drawn(1202, 52, 10, 5, 2), drawn(1203, 51, 10, 6, 0)],
      geometry: [[53, 10], [52, 10], [51, 10]],
      drivingGeometry: [[53, 10], [52, 10], [51, 10]],
      legs: [{ mode: 'driving', distance: 111000 }, { mode: 'driving', distance: 111000 }],
    }]
  }

  /** Where the tank runs out: 190 km into a 222 km day, on the second leg. */
  const dry = { legIndex: 1, intoLegKm: 79, drivenMeters: 190_000, sinceKm: 500, lat: 51.29, lng: 10 }

  const pump = (name: string, lat: number) => ({
    osm_id: `node/${name}`, name, lat, lng: 10, category: 'fuel', poi_type: 'fuel',
    address: null, website: null, phone: null, opening_hours: null, cuisine: null,
  })

  it('FE-TP-ROAD-068: the day own stops go with the question, so a pump already on the plan is not offered again', async () => {
    drivenCard()
    const pois = vi.spyOn(mapsApi, 'pois').mockResolvedValue({
      pois: [pump('Rasthof Dammer Berge', 52.5), pump('Schon geplant', 52)],
      source: 'openstreetmap',
      truncated: false,
    } as never)
    const { result } = await renderRoadtrip()

    // A day the rail draws no drive for has no line to measure along, and asking anyway
    // spends a request on a question that cannot be answered.
    act(() => { result.current.askRefuel(999, dry) })
    expect(pois).not.toHaveBeenCalled()

    await act(async () => { result.current.askRefuel(6, dry) })
    await waitFor(() => expect(result.current.refuel.outcome).toBe('found'))

    expect(pois).toHaveBeenCalledTimes(1)
    // The second one stands on the day own middle stop, and both are within range of the
    // dry point — so only the day stops travelling with the question keep it out.
    expect(result.current.refuel.results.map(r => r.name)).toEqual(['Rasthof Dammer Berge'])
    // Which dry point is being answered, so a second warning cannot read the first list.
    expect(result.current.refuel.openFor).toBe('6:1')
  })

  it('FE-TP-ROAD-069: while offers are on the table the map frames THEM, not the alternatives under them', async () => {
    // Somebody is being asked to accept a stop, and a stop off the edge of the map cannot
    // be judged. Averaging the two frames would have shown neither properly.
    drivenCard()
    rt.alt.open = {
      dayId: 6, index: 0, loading: false, error: false,
      // Two of them, because one road is not a choice and the picker draws nothing for it.
      routes: [
        { coordinates: [[53, 10], [51, 10]], distance: 222_000, duration: 8_400, divergence: { lat: 52, lng: 10 } },
        { coordinates: [[53, 10], [52.4, 10.6], [51, 10]], distance: 240_000, duration: 9_000, divergence: { lat: 52.4, lng: 10.6 } },
      ],
    }
    vi.spyOn(mapsApi, 'pois').mockResolvedValue({
      pois: [pump('Rasthof Dammer Berge', 52.5)], source: 'openstreetmap', truncated: false,
    } as never)
    const { result } = await renderRoadtrip()
    expect(result.current.mapFocusPoints).toEqual(result.current.alternativeFocusPoints)
    expect(result.current.mapFocusPoints.length).toBeGreaterThan(0)

    await act(async () => { result.current.askRefuel(6, dry) })
    await waitFor(() => expect(result.current.refuel.offered).toHaveLength(1))

    expect(result.current.mapFocusPoints).toEqual([[52.5, 10]])
  })

  it('FE-TP-ROAD-070: accepting one closes the offers and opens the popup at the stop OWN day and position', async () => {
    // The index the offer was measured at counts along the card, and this card begins
    // with two stops stored on the day before. Written with the card numbers the new stop
    // lands in the wrong day list, at a position that means something else there.
    drivenCard()
    vi.spyOn(mapsApi, 'pois').mockResolvedValue({
      pois: [pump('Rasthof Dammer Berge', 52.5)], source: 'openstreetmap', truncated: false,
    } as never)
    const { result } = await renderRoadtrip()

    await act(async () => { result.current.askRefuel(6, dry) })
    await waitFor(() => expect(result.current.refuel.offered).toHaveLength(1))

    // Dry on the first leg, so the stop goes in front of the one it was measured against:
    // the card second, which day 5 holds at position 2.
    act(() => { result.current.acceptRefuel(6, result.current.refuel.offered[0], { ...dry, legIndex: 0 }) })

    expect(result.current.stopDraft).toMatchObject({ dayId: 5, position: 2, dayNumber: 2 })
    expect(result.current.refuel.openFor).toBeNull()
  })

  it('FE-TP-ROAD-074: a reader changing a stop from the rail writes nothing at all', async () => {
    // The two one-field writes the rail offers used to go straight to the API while their
    // neighbour setRoadtripStay checked first. The server refused them, so nothing was
    // ever saved, but the reader got an error toast for touching a control that should
    // not have acted — and the rail redrew off a store the write never reached.
    asReader('place_edit')
    drivenCard()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.setRoadtripStopKind(1102, 'fuel') })
    await act(async () => { await result.current.setRoadtripStopFill(1102, 80) })

    expect(actions.updatePlace).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-071: a reader is not handed the stop to accept', async () => {
    asReader('day_edit')
    drivenCard()
    const { result } = await renderRoadtrip()

    act(() => { result.current.acceptRefuel(6, pump('Rasthof Dammer Berge', 52.5) as never, dry) })

    expect(result.current.stopDraft).toBeNull()
  })
})

vi.mock('../../hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (preferences: import('@trek/shared').RoadtripPreferences) => unknown) => useSettingsStore(state => select(state.settings as import('@trek/shared').RoadtripPreferences)),
  useLoadRoadtripSettings: () => ({ ready: true, failed: false }),
}))
vi.mock('../../repo/roadtripPreferencesRepo', () => ({ roadtripPreferencesRepo: { update: vi.fn(async () => ({})) } }))

it('keeps exclusive service stops in Roadtrip, hides them in Days and restores them without duplicates', async () => {
  const normal = buildPlace({ id: 101, name: 'Berlin' })
  const charging = buildPlace({ id: 102, name: 'Charger', stop_type: 'charging' })
  const visits = [buildAssignment({ id: 11, day_id: 5, place: normal }), buildAssignment({ id: 12, day_id: 5, place: charging })]
  seedTrip({ places: [normal, charging], days: [buildDay({ id: 5 })], assignments: { '5': visits } })
  useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_service_stops_in_days: false } }))
  const { result } = await renderRoadtrip()
  expect(result.current.assignments['5']).toHaveLength(2)
  act(() => result.current.toggleRoadtripMode())
  expect(result.current.assignments['5'].map(a => a.id)).toEqual([11])
  expect(result.current.places.map(p => p.id)).toEqual([101])
  expect(useTripStore.getState().assignments['5']).toHaveLength(2)
  act(() => useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_service_stops_in_days: true } })))
  expect(result.current.assignments['5']).toHaveLength(2)
  expect(result.current.places).toHaveLength(2)
})

it('preserves exclusive service stops when reordering the visible Days stops', async () => {
  const visits = [stopAt(11, 5, 0), stopAt(12, 5, 1, { place: buildPlace({ stop_type: 'charging' }) }), stopAt(13, 5, 2)]
  seedTrip({ days: [buildDay({ id: 5 })], assignments: { '5': visits } })
  useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_service_stops_in_days: false } }))
  const { result } = await renderRoadtrip()
  act(() => result.current.toggleRoadtripMode())
  await act(async () => result.current.handleReorder(5, [13, 11]))
  expect(actions.reorderAssignments).toHaveBeenCalledWith(42, 5, [13, 12, 11])
})
