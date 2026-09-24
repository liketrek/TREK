import { roadtripPreferencesRepo } from '../../repo/roadtripPreferencesRepo'
// FE-TP-ROAD-001 to FE-TP-ROAD-154
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
import { buildUser, buildTrip, buildDay, buildPlace, buildAssignment, buildReservation } from '../../../tests/helpers/factories'
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
  // What the routing round was last called with. The round itself is a fixture, so
  // the arguments are the only place the planner's own decisions are visible: which
  // days it is willing to route, and which assignment list it builds them from.
  const routesArgs = { current: [] as unknown[] }
  // The leg router the rail hands out, and the call it routes a leg with. The router is
  // what the planner asks with; the call is what a choice is proven against.
  const legRoute = vi.fn()
  const routes = {
    legRouter: vi.fn(),
    reroute: vi.fn(),
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
    clear: vi.fn(),
  }
  const alt = {
    open: null as null | Record<string, unknown>,
    ask: vi.fn(),
    close: vi.fn(),
    prove: vi.fn(),
    settle: vi.fn(),
  }
  // Hands out a fresh copy of `alt` on every render when set, the identity the real hook
  // had before it was memoised. A stable fixture runs an effect keyed on it once and never
  // again, which is exactly how a close gate that fired on every render went unseen.
  const altFresh = { current: false }
  return { vias, routes, corridor, alt, altFresh, routesArgs, legRoute }
})

vi.mock('../../components/Roadtrip/useRoadtripVias', () => ({ useRoadtripVias: () => rt.vias }))
vi.mock('../../components/Roadtrip/useRoadtripRoutes', () => ({
  useRoadtripRoutes: (...args: unknown[]) => { rt.routesArgs.current = args; return rt.routes },
}))
vi.mock('../../components/Roadtrip/useRoadtripCorridor', () => ({ useRoadtripCorridor: () => rt.corridor }))
// Only the hook is a fixture. The drive helpers beside it stay real, since which drive a
// picker is open on is part of what these cases are about.
vi.mock('../../components/Roadtrip/useRouteAlternatives', async importOriginal => ({
  ...(await importOriginal<typeof import('../../components/Roadtrip/useRouteAlternatives')>()),
  useRouteAlternatives: () => (rt.altFresh.current ? { ...rt.alt } : rt.alt),
}))
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
    schedule: { entries: [], warnings: [] },
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
  // Reset rather than cleared: an implementation set by one case (a write that fails) would
  // otherwise carry into the next and answer for it.
  rt.vias.addMany.mockReset().mockResolvedValue(undefined)
  rt.legRoute.mockReset()
  rt.routes.legRouter.mockReset().mockImplementation(() => ({ mode: 'driving', avoid: [], engine: 'osrm', route: rt.legRoute }))
  rt.alt.prove.mockReset().mockImplementation(() => new AbortController().signal)
  rt.routes.days = []
  rt.routes.quietDays = []
  rt.routesArgs.current = []
  rt.routes.lines = []
  rt.routes.lineDays = []
  rt.corridor.day = undefined
  rt.corridor.visible = []
  rt.corridor.widthKm = 5
  rt.corridor.stopsAlongKm = []
  rt.corridor.search.spine = []
  rt.corridor.insertIndexFor.mockReturnValue(1)
  rt.alt.open = null
  rt.altFresh.current = false

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
  /** The road the rail drives from Hamburg to Berlin, and a detour north of it. */
  const RAIL_LINE: [number, number][] = [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]]
  const DETOUR: [number, number][] = [[53.55, 9.99], [53.4, 11.5], [53.3, 12.8], [52.52, 13.4]]

  const routedDay = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        { assignmentId: 11, lat: 53.55, lng: 9.99, name: 'Hamburg' },
        { assignmentId: 12, lat: 52.52, lng: 13.4, name: 'Berlin' },
      ],
      legs: [{ distance: 290_000, duration: 10_800 }],
      legLines: [RAIL_LINE],
      geometry: RAIL_LINE,
    }]
  }

  /** The picker as `useRouteAlternatives` leaves it once asked: the rail's road, then the offers. */
  const openWith = (offers: Array<Record<string, unknown>>, over: Record<string, unknown> = {}) => {
    rt.alt.open = {
      dayId: 5, drive: { kind: 'leg', index: 0 }, loading: false, error: false, proving: null,
      anchor: { dayId: 5, afterIndex: 0 },
      ends: { from: 11, to: 12 },
      engine: 'osrm',
      route: rt.legRoute,
      routes: [
        { coordinates: RAIL_LINE, distance: 290_000, duration: 10_800, divergence: null, current: true },
        ...offers,
      ],
      ...over,
    }
  }
  const detour = (over: Record<string, unknown> = {}) =>
    ({ coordinates: DETOUR, distance: 310_000, duration: 11_400, divergence: { lat: 53.3, lng: 12.8 }, ...over })
  const answer = (coordinates: [number, number][], over: Record<string, unknown> = {}) =>
    ({ coordinates, distance: 300_000, duration: 11_000, fellBack: false, ...over })

  it('FE-TP-ROAD-034: asking hands over the leg the rail drives, where a choice is filed, and the router for that leg', async () => {
    routedDay()
    // A card that opens on a stop stored on the day before: its vias are filed there.
    rt.routes.days[0].stops = [
      { assignmentId: 11, ownerDayId: 4, ownerIndex: 2, lat: 53.55, lng: 9.99, name: 'Hamburg' },
      { assignmentId: 12, lat: 52.52, lng: 13.4, name: 'Berlin' },
    ]
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, { kind: 'leg', index: 0 }) })

    const [request] = rt.alt.ask.mock.calls[0] as [Record<string, unknown>]
    expect(request).toMatchObject({
      dayId: 5,
      drive: { kind: 'leg', index: 0 },
      from: { lat: 53.55, lng: 9.99 },
      to: { lat: 52.52, lng: 13.4 },
      // "Current" is the rail's own leg: its line, its figures, nothing asked for again.
      driven: { coordinates: RAIL_LINE, distance: 290_000, duration: 10_800 },
      anchor: { dayId: 4, afterIndex: 2 },
      ends: { from: 11, to: 12 },
    })
    // The router of THAT leg, built for the card it is drawn on, not the trip-wide profile.
    const [from, to, cardDayId] = rt.routes.legRouter.mock.calls[0] as [{ assignmentId: number }, { assignmentId: number }, number]
    expect([from.assignmentId, to.assignmentId, cardDayId]).toEqual([11, 12, 5])
    expect((request.router as { route: unknown }).route).toBe(rt.legRoute)
  })

  it('FE-TP-ROAD-035: asking again for the leg already open closes it instead', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, { kind: 'leg', index: 0 }) })

    expect(rt.alt.close).toHaveBeenCalled()
    expect(rt.alt.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-036: a leg with nothing at its far end, or no road yet, is not a leg', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, { kind: 'leg', index: 1 }) })
    rt.routes.days[0].legs = []
    act(() => { result.current.askRouteAlternatives(5, { kind: 'leg', index: 0 }) })

    expect(rt.alt.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-037: choosing the road already driven changes nothing but the picker', async () => {
    routedDay()
    openWith([detour()])
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(0) })

    expect(rt.legRoute).not.toHaveBeenCalled()
    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-038: the router own preference on a bent leg is proven without pins and clears the leg in ONE write', async () => {
    // One delete per via meant a full trip re-route between each of them, so undoing a
    // detour with three vias drew three routes.
    routedDay()
    rt.vias.byDay = { 5: [via(1, 5, 0), via(2, 5, 0, 1)] }
    openWith([detour({ direct: true })])
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.legRoute).toHaveBeenCalledTimes(1)
    expect(rt.legRoute.mock.calls[0][0]).toEqual([])
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [], [0])
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-039: a clear that fails leaves the picker open and says so', async () => {
    // Swallowing it closed the picker on a leg that still carries its via and still
    // routes the old way, so the traveller believed they had undone the detour.
    routedDay()
    rt.vias.byDay = { 5: [via(1, 5, 0)] }
    openWith([detour({ direct: true })])
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    rt.vias.addMany.mockRejectedValue(new Error('offline'))
    const { result } = await renderRoadtrip()
    // The mode starts off until the addon feed answers, and that effect closes the
    // picker once on the way in. Measure from there.
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'offline')).toBe(true)
    expect(rt.alt.close).not.toHaveBeenCalled()
    expect(rt.alt.settle).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-040: another road the router drives through one pin replaces the leg with that pin', async () => {
    routedDay()
    openWith([detour()])
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    // Marked as being checked while the router is asked.
    expect(rt.alt.prove).toHaveBeenCalledWith(1)
    // The first pin is where the offer strays furthest from the road being driven.
    expect(rt.legRoute.mock.calls[0][0]).toEqual([{ lat: 53.3, lng: 12.8 }])
    // Replacing, not appending: a leg that still carries its old via routes somewhere the
    // preview never drew.
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [{ after_order_index: 0, lat: 53.3, lng: 12.8 }], [0])
    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-041: pins that will not save leave the picker open', async () => {
    routedDay()
    openWith([detour()])
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    rt.vias.addMany.mockRejectedValue(new Error('rejected'))
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(toasts.some(t => t.type === 'error' && t.message === 'rejected')).toBe(true)
    expect(rt.alt.close).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-042: choosing an index nothing was offered at does nothing', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(3) })

    expect(rt.legRoute).not.toHaveBeenCalled()
    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(rt.vias.addMany).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-116: a road one pin does not hold gets a second, in the order the road drives them', async () => {
    // The first answer passes the pin and still takes the old road for the first half.
    routedDay()
    openWith([detour()])
    rt.legRoute
      .mockResolvedValueOnce(answer([[53.55, 9.99], [53.0, 11.5], [53.3, 12.8], [52.52, 13.4]]))
      .mockResolvedValueOnce(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.legRoute).toHaveBeenCalledTimes(2)
    // The new pin goes in front of the first, because the detour reaches it first.
    const pins = [{ lat: 53.4, lng: 11.5 }, { lat: 53.3, lng: 12.8 }]
    expect(rt.legRoute.mock.calls[1][0]).toEqual(pins)
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, pins.map(p => ({ after_order_index: 0, ...p })), [0])
  })

  it('FE-TP-ROAD-117: a road the router will not drive is not saved, and the picker stays open to say so', async () => {
    routedDay()
    openWith([detour()])
    // Whatever is pinned, the router comes back on the road it was already on.
    rt.legRoute.mockResolvedValue(answer(RAIL_LINE))
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.close).not.toHaveBeenCalled()
    // Said to the bar as well, which keeps it beside the offers and announces it.
    // Exactly this sentence: nothing about a ferry the offer never took.
    expect(rt.alt.settle).toHaveBeenCalledWith('The road trip’s router won’t follow this way, so it was not saved.')
    // The desk's bar says it in its own status line, and a toast on top covered that line.
    expect(toasts.filter(x => /router|ferry|ticked/.test(x.message))).toEqual([])
  })

  it('FE-TP-ROAD-118: a ferry the router would not board says how to get it driven', async () => {
    // #2461: the way across the North Sea, pinned on the ferry, came back through Calais.
    routedDay()
    openWith([detour({ hasFerry: true, avoids: 'motorway', engine: 'valhalla' })])
    rt.legRoute.mockResolvedValue(answer(RAIL_LINE, { hasFerry: false }))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    const ferryHint = 'This way crosses by ferry. Add the ferry as a transport booking and the drive follows it. If it lands the next day, put the stops across the water on that day.'
    // The ferry is the way out here, not the motorway the offer also leaves out.
    expect(rt.alt.settle).toHaveBeenCalledWith(`The road trip’s router won’t follow this way, so it was not saved. ${ferryHint}`)
    expect(toasts.filter(x => /router|ferry|ticked/.test(x.message))).toEqual([])
  })

  it('FE-TP-ROAD-135: a way that leaves a class out says the trip has to avoid it to be driven', async () => {
    // The router holds such a way only as far as a few pins reach, so on a long leg the
    // choice was refused after the wait with no word on what would get it driven.
    routedDay()
    openWith([detour({ avoids: 'motorway', engine: 'valhalla' })])
    rt.legRoute.mockResolvedValue(answer(RAIL_LINE, { hasFerry: false }))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.settle).toHaveBeenCalledWith(
      'The road trip’s router won’t follow this way, so it was not saved. The road trip only drives this way with “Motorways” ticked under “Avoid where possible” in its settings.',
    )
    expect(toasts.filter(x => /router|ferry|ticked/.test(x.message))).toEqual([])
  })

  it('FE-TP-ROAD-139: on the phone a refused way is said as a toast too, its bar has no room for the sentence', async () => {
    const desktopWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 })
    try {
      routedDay()
      openWith([detour({ hasFerry: true, avoids: 'motorway', engine: 'valhalla' })])
      rt.legRoute.mockResolvedValue(answer(RAIL_LINE, { hasFerry: false }))
      // Road trip MODE never turns on at phone width (the drive lives on its own tab), so
      // this mounts the way the phone suites do and waits for that tab instead.
      const { result } = renderHook(() => useTripPlanner(), { wrapper })
      await act(async () => { await Promise.resolve() })
      await waitFor(() => expect(result.current.TRIP_TABS.some(tab => tab.id === 'roadtrip')).toBe(true))

      await act(async () => { await result.current.chooseRouteAlternative(1) })

      expect(rt.vias.addMany).not.toHaveBeenCalled()
      expect(toasts).toContainEqual({ message: 'The road trip’s router won’t follow this way, so it was not saved.', type: 'error' })
      expect(toasts).toContainEqual(expect.objectContaining({ message: expect.stringContaining('crosses by ferry'), type: 'info' }))
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: desktopWidth })
    }
  })

  it('FE-TP-ROAD-136: the router own road on a leg OSRM drew in its place asks the rail for the leg again, and says so', async () => {
    // Nothing bends the leg, so nothing is written, and the stand-in line stayed on the map
    // under a picker that closed as if the road had been taken.
    routedDay()
    openWith([detour({ direct: true, engine: 'valhalla' })], { engine: 'valhalla', standIn: true })
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.routes.reroute).toHaveBeenCalledTimes(1)
    expect(toasts).toContainEqual({
      message: 'The avoidance router did not answer for this leg, so the main router drew it. It is being asked again.',
      type: 'info',
    })
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-137: pins written for a leg OSRM drew route it again by themselves, and it still says why the line may wait', async () => {
    routedDay()
    openWith([detour({ engine: 'valhalla' })], { engine: 'valhalla', standIn: true })
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [{ after_order_index: 0, lat: 53.3, lng: 12.8 }], [0])
    expect(rt.routes.reroute).not.toHaveBeenCalled()
    expect(toasts).toContainEqual(expect.objectContaining({ message: expect.stringContaining('did not answer for this leg'), type: 'info' }))
  })

  it('FE-TP-ROAD-138: on a leg its own engine drew, the router own road changes nothing and asks nothing again', async () => {
    routedDay()
    openWith([detour({ direct: true })], { standIn: false })
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.routes.reroute).not.toHaveBeenCalled()
    expect(toasts).not.toContainEqual(expect.objectContaining({ message: expect.stringContaining('did not answer') }))
  })

  it('FE-TP-ROAD-119: the router own road on a leg nothing bends writes nothing and closes', async () => {
    routedDay()
    openWith([detour({ direct: true })])
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.legRoute).toHaveBeenCalledTimes(1)
    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-120: a leg that changed while the router was asked is not written to', async () => {
    routedDay()
    openWith([detour()])
    let answerNow: (value: unknown) => void = () => {}
    rt.legRoute.mockImplementation(() => new Promise(resolve => { answerNow = resolve }))
    const { result, rerender } = await renderRoadtrip()

    let choosing: Promise<void> = Promise.resolve()
    act(() => { choosing = result.current.chooseRouteAlternative(1) })
    // A stop dropped in between: the leg from Hamburg now ends somewhere else.
    rt.routes.days = [{
      ...rt.routes.days[0],
      stops: [
        { assignmentId: 11, ownerDayId: 5, ownerIndex: 0, lat: 53.55, lng: 9.99 },
        { assignmentId: 13, ownerDayId: 5, ownerIndex: 1, lat: 53.1, lng: 11.9 },
        { assignmentId: 12, ownerDayId: 5, ownerIndex: 2, lat: 52.52, lng: 13.4 },
      ],
    }]
    rerender()
    await act(async () => { answerNow(answer(DETOUR)); await choosing })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(toasts).toContainEqual({ message: 'This leg changed while the way was being checked, so nothing was saved.', type: 'error' })
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-121: offline nothing is checked and nothing is written, and it says why', async () => {
    routedDay()
    openWith([detour()])
    rt.vias.editable = false
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.alt.prove).not.toHaveBeenCalled()
    expect(rt.legRoute).not.toHaveBeenCalled()
    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(toasts).toContainEqual({ message: 'Other ways are saved online only. Reconnect to take this one.', type: 'error' })
  })

  it('FE-TP-ROAD-122: a second choice while the first is being checked is not taken', async () => {
    // The map line stays clickable while a chip's choice is checked.
    routedDay()
    openWith([detour(), detour({ coordinates: [[53.55, 9.99], [52.0, 11.5], [52.52, 13.4]] })], { proving: 1 })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(2) })

    expect(rt.alt.prove).not.toHaveBeenCalled()
    expect(rt.legRoute).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-123: an answer from the stand-in engine proves nothing, so nothing is written', async () => {
    routedDay()
    openWith([detour()], { engine: 'valhalla' })
    rt.legRoute.mockResolvedValue(answer(DETOUR, { fellBack: true }))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.settle).toHaveBeenCalledWith('The router is not answering right now.')
    expect(toasts.filter(x => /router|ferry|ticked/.test(x.message))).toEqual([])
  })

  it('FE-TP-ROAD-124: a router that fails while checking says so and writes nothing', async () => {
    routedDay()
    openWith([detour()])
    rt.legRoute.mockRejectedValue(new Error('429'))
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.settle).toHaveBeenCalledWith('The router is not answering right now.')
    expect(toasts.filter(x => /router|ferry|ticked/.test(x.message))).toEqual([])
  })

  it('FE-TP-ROAD-125: a check abandoned by closing the picker ends in silence', async () => {
    routedDay()
    openWith([detour()])
    const controller = new AbortController()
    rt.alt.prove.mockReturnValue(controller.signal)
    rt.legRoute.mockImplementation(async () => {
      controller.abort()
      throw new DOMException('aborted', 'AbortError')
    })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).not.toHaveBeenCalled()
    expect(rt.alt.settle).not.toHaveBeenCalled()
    expect(toasts).not.toContainEqual(expect.objectContaining({ message: 'The router is not answering right now.' }))
  })

  it('FE-TP-ROAD-127: a picker opened on another leg while the pins were written is left open', async () => {
    // The write lands, but the traveller has moved on to the next leg in the meantime:
    // closing now would close THAT picker. A write that fails is still said.
    routedDay()
    openWith([detour()])
    const controller = new AbortController()
    rt.alt.prove.mockReturnValue(controller.signal)
    rt.legRoute.mockResolvedValue(answer(DETOUR))
    rt.vias.addMany.mockImplementation(async () => { controller.abort() })
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.vias.addMany).toHaveBeenCalledTimes(1)
    expect(rt.alt.close).not.toHaveBeenCalled()

    const again = new AbortController()
    rt.alt.prove.mockReturnValue(again.signal)
    rt.vias.addMany.mockImplementation(async () => { again.abort(); throw new Error('rejected') })
    rt.alt.settle.mockClear()
    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(toasts).toContainEqual({ message: 'rejected', type: 'error' })
    expect(rt.alt.settle).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-126: offers are read against the engine the rail drives the leg with', async () => {
    // A trip that avoids something is driven by the second engine, and so are its offers:
    // none of them is another engine's, and the difference is printed.
    routedDay()
    openWith([detour({ engine: 'valhalla' })], { engine: 'valhalla' })
    rt.alt.open!.routes = (rt.alt.open!.routes as Array<Record<string, unknown>>).map((r, i) => (i === 0 ? { ...r, engine: 'valhalla' } : r))
    const { result } = await renderRoadtrip()

    expect(result.current.alternativeOverlays.map(o => o.otherEngine)).toEqual([false, false])
    expect(result.current.alternativeOverlays[1].slowerThanQuickest).toBe(600)
  })

  it('FE-TP-ROAD-043: the overlays and the frame come from the open leg, and empty when it closes', async () => {
    routedDay()
    rt.alt.open = {
      dayId: 5, drive: { kind: 'leg', index: 0 }, loading: false, error: false,
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
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: false, error: false }
    const { result } = await renderRoadtrip()
    rt.alt.close.mockClear()

    act(() => { result.current.toggleRoadtripMode() })

    await waitFor(() => expect(rt.alt.close).toHaveBeenCalled())
    expect(result.current.roadtripActive).toBe(false)
  })

  it('FE-TP-ROAD-045: closing the picker clears the road it had lit up', async () => {
    routedDay()
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: false, error: false }
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

  it('FE-TP-ROAD-089: a dropped hit is placed by the same rule as a clicked one', async () => {
    // Computed on the side, a drop on the drive from the day before went in after this
    // card's first stop while the click on the same hit went in ahead of it.
    corridorWithHit()
    rt.corridor.day = {
      dayId: 6,
      dayNumber: 2,
      stops: [drawn(1301, 52.52, 13.4, 6, 0), drawn(1302, 52.0, 14.5, 6, 1)],
    }
    rt.corridor.insertIndexFor.mockReturnValue(0)
    const { result } = await renderRoadtrip()

    act(() => { result.current.dropPoiOnRoute('node/7', 53.0, 11.5) })

    expect(rt.corridor.insertIndexFor).toHaveBeenCalledWith(expect.objectContaining({ alongKm: expect.any(Number) }))
    expect(result.current.stopDraft).toMatchObject({ dayId: 6, position: 0 })
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

describe('useTripPlanner road trip: a stop added by hand', () => {
  /** One routed day of two stops, and a second day beside it. */
  const routedDay = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
    }]
  }

  it('FE-TP-ROAD-075: a hand-picked place is measured onto the drive it is nearest', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    // Named by the card the stops are DRAWN on and the position in it, which is the
    // index space a stop is placed at, not the one a via is stored in.
    expect(result.current.manualStopTargetFor(53.0, 11.5)).toMatchObject({ dayId: 5, position: 1 })
  })

  it('FE-TP-ROAD-076: a place well off the road is placed all the same', async () => {
    // A via is refused past two kilometres and stays refused. The stop this answers for
    // is the charger the corridor search missed, which is exactly the one sitting
    // further off the drawn line than that: refusing it would refuse the request.
    routedDay()
    const { result } = await renderRoadtrip()

    const target = result.current.manualStopTargetFor(41.9, 12.5)
    expect(target?.offRouteKm).toBeGreaterThan(2)
    expect(target).toMatchObject({ dayId: 5 })

    await act(async () => { await result.current.addRoadtripVia(41.9, 12.5) })
    expect(rt.vias.add).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-077: a day with no drawn line is nowhere to measure against', async () => {
    routedDay()
    rt.routes.days = [{ dayId: 5, dayNumber: 1, stops: [], geometry: [] }]
    const { result } = await renderRoadtrip()

    expect(result.current.manualStopTargetFor(53.0, 11.5)).toBeNull()
  })

  it('FE-TP-ROAD-078: adding one by hand opens the place form on nothing at all', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })

    // The real form, with its own typed-ahead search: nothing is known about the place
    // yet, so nothing is prefilled and no day is fixed.
    expect(result.current.showPlaceForm).toBe(true)
    expect(result.current.prefillCoords).toBeNull()
    expect(result.current.editingPlace).toBeNull()
    expect(result.current.stopDraft).toBeNull()
    expect(actions.addPlace).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-079: the form is handed every leg of the drive to choose between', async () => {
    routedDay()
    const { result } = await renderRoadtrip()
    expect(result.current.serviceStopMode).toBeNull()

    act(() => { result.current.openManualRoadtripStop() })

    expect(result.current.serviceStopMode).toMatchObject({
      days: [{ dayId: 5, dayNumber: 1 }],
      appendDay: { dayId: 5, dayNumber: 1, position: 2 },
    })
    expect(result.current.serviceStopMode?.targetFor(53.0, 11.5)).toMatchObject({ dayId: 5, position: 1 })
  })

  it('FE-TP-ROAD-081: with nothing routed there is no leg, only the day the panel is on', async () => {
    routedDay()
    // Two stops and no line between them: the trip has places but no drive yet.
    rt.routes.days = [{ dayId: 5, dayNumber: 1, stops: [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }], geometry: [] }]
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })

    expect(result.current.serviceStopMode?.days).toEqual([])
    expect(result.current.serviceStopMode?.appendDay).toMatchObject({ dayId: 5, position: 2 })
  })

  it('FE-TP-ROAD-082: the stop lands where the SAVE says, not where the form opened', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })
    await act(async () => {
      await result.current.handleSavePlace({
        name: 'Supercharger Dammer Berge',
        lat: 52.9,
        lng: 11.4,
        stop_type: 'charging',
        duration_minutes: 30,
        // Worked out in the form from the coordinates above, long after it opened.
        _serviceStop: { dayId: 5, position: 1, offRouteKm: 3.2 },
      })
    })

    // The transport field never reaches the write.
    expect(actions.addPlace).toHaveBeenCalledWith(42, expect.not.objectContaining({ _serviceStop: expect.anything() }))
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 900, 1)
    expect(updateRouteForDay).toHaveBeenCalledWith(5)
  })

  it('FE-TP-ROAD-083: a leg named by the card is filed under the day the stop is STORED on', async () => {
    // A card can open with yesterday's last stop (`nightSpill.ts`), so the card and the
    // position in it are not the day and the position the assignment is written at.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [
        { lat: 53.55, lng: 9.99, ownerDayId: 5, ownerIndex: 2 },
        { lat: 53.0, lng: 11.5, ownerDayId: 6, ownerIndex: 0 },
        { lat: 52.52, lng: 13.4, ownerDayId: 6, ownerIndex: 1 },
      ],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
    }]
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })
    await act(async () => {
      await result.current.handleSavePlace({
        name: 'Rasthof',
        lat: 53.2,
        lng: 10.7,
        _serviceStop: { dayId: 6, position: 1, offRouteKm: 0 },
      })
    })

    // Not (42, 6, 900, 1): the stop the leg ends at is the second day's first, stored
    // at index 0 there.
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 6, 900, 0)
  })

  it('FE-TP-ROAD-084: a stop dropped into a routed day re-anchors its vias before it re-routes', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ lat: 53.55, lng: 9.99 }, { lat: 53.0, lng: 11.5 }, { lat: 52.52, lng: 13.4 }],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
    }]
    // One via on the second leg, anchored behind the stop the new one goes in front of.
    rt.vias.byDay = { 5: [via(11, 5, 1, 0, 52.8, 12.2)] }
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })
    await act(async () => {
      await result.current.handleSavePlace({
        name: 'Supercharger Dammer Berge',
        lat: 53.2,
        lng: 10.7,
        _serviceStop: { dayId: 5, position: 1, offRouteKm: 1.2 },
      })
    })

    // `after_order_index` is a POSITION in the day's stop list. Left alone, the via keeps
    // index 1 and is redrawn onto the leg the new stop just took: the road then runs
    // forward, doubles back and runs out again.
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 900, 1)
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 11, after_order_index: 2 }], remove: [] })
    // Awaited before the re-route: a correction landing after it would draw the wrong
    // road first and the right one a moment later.
    const assigned = actions.assignPlaceToDay.mock.invocationCallOrder[0] ?? 0
    const corrected = rt.vias.reanchor.mock.invocationCallOrder[0] ?? 0
    const routes = updateRouteForDay.mock.invocationCallOrder
    const routed = routes[routes.length - 1] ?? 0
    expect(assigned).toBeLessThan(corrected)
    expect(corrected).toBeLessThan(routed)
  })

  it('FE-TP-ROAD-085: the form is handed the road of each leg, to measure the place against', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })

    // One line per leg, cut out of the day's drawn road: the form measures the place
    // against each of them and offers the nearest first.
    const day = result.current.serviceStopMode?.days[0]
    expect(day?.legLines).toHaveLength(1)
    expect(day?.legLines?.[0]?.length).toBeGreaterThan(1)
  })

  it('FE-TP-ROAD-086: a stop the form could not place goes to the trip places, not onto a day', async () => {
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })
    await act(async () => {
      await result.current.handleSavePlace({
        name: 'Supercharger Dammer Berge',
        lat: null,
        lng: null,
        // A name with no coordinates cannot be measured onto a road, so the form says so
        // and sends no placement at all.
        _serviceStop: null,
      })
    })

    expect(actions.addPlace).toHaveBeenCalled()
    expect(actions.assignPlaceToDay).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-080: a reader may not add one by hand either', async () => {
    asReader('place_edit')
    routedDay()
    const { result } = await renderRoadtrip()

    act(() => { result.current.openManualRoadtripStop() })

    expect(result.current.showPlaceForm).toBe(false)
    expect(result.current.serviceStopMode).toBeNull()
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

  /**
   * A card on a trip with connected days: the drive from where day 5 ended to where day 6
   * begins is drawn at the head of card 6, in day 5's colour, with no night drive involved.
   * Day 5 ends on its third stop, so the index the via has to take differs from anything
   * card 6 could offer.
   */
  const connectedCard = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [drawn(1103, 52.52, 13.4, 6, 0), drawn(1104, 52.0, 14.5, 6, 1)],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4], [52.3, 14.0], [52.0, 14.5]],
      spills: [],
      arrivingFrom: drawn(1102, 53.55, 9.99, 5, 2),
    }]
  }

  it('FE-TP-ROAD-087: a via dropped on the drive between two connected days follows the stop that drive left from', async () => {
    // The reported bug: the click was filed after the first stop of the day the drive
    // arrives on, so that day ran out to the point, turned and came back, while the
    // stretch the traveller meant to bend stayed as it was.
    connectedCard()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.0, 11.5) })
    expect(rt.vias.add).toHaveBeenCalledWith(5, 2, 53.0, 11.5)

    // Past the first stop it is the card's own leg again.
    await act(async () => { await result.current.addRoadtripVia(52.3, 14.0) })
    expect(rt.vias.add).toHaveBeenLastCalledWith(6, 0, 52.3, 14.0)
  })

  it('FE-TP-ROAD-088: a via on the drive between connected days can be dragged along it without changing hands', async () => {
    connectedCard()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 9, 53.2, 11.0) })

    expect(rt.vias.move).toHaveBeenCalledWith(5, 9, 53.2, 11.0, 2)
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
      dayId: 6, drive: { kind: 'leg', index: 0 }, loading: false, error: false,
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

it('FE-TP-ROAD-154: a place a booking points at stays in Days while road trip stops are hidden there', async () => {
  // Every lodging booking types its place as 'hotel', and 'hotel' is a road trip stop
  // type. With "Show in Days too" off, Days dropped the booked hotel from the place list,
  // from the booking's own place picker and from the map the moment it was booked.
  const town = buildPlace({ id: 101, name: 'Cologne' })
  const hotel = buildPlace({ id: 102, name: 'Cologne Cathedral', stop_type: 'hotel' })
  const pump = buildPlace({ id: 103, name: 'Pump', stop_type: 'fuel' })
  const brauhaus = buildPlace({ id: 104, name: 'Brauhaus', stop_type: 'restaurant' })
  const campsite = buildPlace({ id: 105, name: 'Camping Rhein', stop_type: 'campsite' })
  seedTrip({
    places: [town, hotel, pump, brauhaus, campsite],
    days: [buildDay({ id: 5 }), buildDay({ id: 6 })],
    reservations: [
      buildReservation({ id: 9, type: 'restaurant', place_id: 104, day_id: 5 }),
      buildReservation({ id: 10, type: 'hotel', accommodation_id: 8, accommodation_place_id: 105 }),
    ],
  })
  vi.mocked(accommodationRepo.list).mockResolvedValue({
    accommodations: [{ id: 7, trip_id: 42, place_id: 102, start_day_id: 5, end_day_id: 6, reservation_title: null }],
  } as never)
  useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_service_stops_in_days: false } }))
  const { result } = await renderRoadtrip()

  act(() => result.current.toggleRoadtripMode())

  // The pump nobody booked stays a road trip stop, out of Days.
  await waitFor(() => expect(result.current.places.map(p => p.id)).toEqual([101, 102, 104, 105]))
  // Road trip mode keeps every place, as before.
  act(() => result.current.toggleRoadtripMode())
  expect(result.current.places.map(p => p.id)).toEqual([101, 102, 103, 104, 105])
})

/**
 * The phone's own way into the drive.
 *
 * Road trip MODE is a data switch, not a view switch: `assignments` and `places` are
 * derived from it for the whole hook, and every permanently mounted sheet of the phone
 * shell reads those same two lists. The phone has no control that turns the mode back
 * off, so it never turns it on. `roadtripMode = storedRoadtripMode && !isMobile` stays
 * exactly as it is, and the tab feeds the routing round instead.
 */
describe('useTripPlanner road trip: the phone feed', () => {
  let desktopWidth: number

  beforeEach(() => {
    desktopWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: desktopWidth })
  })

  /** The days the routing round was handed. Empty means it is standing down. */
  const fedDays = () => rt.routesArgs.current[1] as Array<{ id: number }>
  /** The assignment list the drive is built from. */
  const fedAssignments = () => rt.routesArgs.current[2] as Record<string, Array<{ id: number }>>

  /** The routed shape of one day, which `renderRoadtrip` builds for the desk suites. */
  const routeDay = (dayId: number) => {
    rt.routes.days = [{
      dayId,
      dayNumber: 1,
      schedule: { entries: [], warnings: [] },
      legs: [],
      stops: [0, 1, 2].map((i) => ({
        assignmentId: i + 1, placeId: i + 1, lat: 53 - i, lng: 10 + i,
        ownerDayId: dayId, ownerIndex: i,
      })),
    }]
  }

  /** Mount on a phone and wait until the addon feed has answered. */
  async function renderPhone() {
    const rendered = renderHook(() => useTripPlanner(), { wrapper })
    await act(async () => { await Promise.resolve() })
    // The drive tab exists on the phone and nowhere else, so its arrival doubles as
    // the proof that the addon feed landed.
    await waitFor(() => expect(rendered.result.current.TRIP_TABS.some(tab => tab.id === 'roadtrip')).toBe(true))
    return rendered
  }

  it('FE-TP-ROAD-090: the phone opens the feed and leaves the mode alone', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')

    const { result } = await renderPhone()

    // The session still carries the switch from an earlier, wider window, which is
    // the whole point: narrowing past the breakpoint must not bring the mode along.
    expect(sessionStorage.getItem('trip-roadtrip-42')).toBe('1')
    expect(result.current.roadtripMode).toBe(false)
    expect(result.current.roadtripActive).toBe(false)
    expect(result.current.roadtripFeedActive).toBe(true)
  })

  it('FE-TP-ROAD-091: a phone that never opened the drive routes nothing', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })

    const { result } = await renderPhone()

    expect(result.current.activeTab).toBe('plan')
    expect(result.current.roadtripFeedActive).toBe(false)
    // A day costs a rate-limited routing request, so the tab has to be asked for first.
    expect(fedDays()).toHaveLength(0)
  })

  it('FE-TP-ROAD-092: with the drive tab open the round is handed the trip days', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')

    const { result } = await renderPhone()

    expect(result.current.roadtripFeedActive).toBe(true)
    expect(fedDays().map(d => d.id)).toEqual([5, 6])
  })

  it('FE-TP-ROAD-093: the round is fed the STORED list, the day sheet keeps the filtered one', async () => {
    const town = buildPlace({ id: 101, name: 'Bergen' })
    const fuelStop = buildPlace({ id: 102, name: 'Tankstelle', stop_type: 'fuel' })
    const hotel = buildPlace({ id: 103, name: 'Fjordhotell' })
    seedTrip({
      places: [town, fuelStop, hotel],
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: {
        '5': [
          buildAssignment({ id: 11, day_id: 5, order_index: 0, place: town }),
          buildAssignment({ id: 12, day_id: 5, order_index: 1, place: fuelStop }),
          buildAssignment({ id: 13, day_id: 5, order_index: 2, place: hotel, accommodation_id: 9 }),
        ],
      },
    })
    useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_service_stops_in_days: false } }))
    sessionStorage.setItem('trip-tab-42', 'roadtrip')

    const { result } = await renderPhone()

    // What the day sheet, the day list and the PDF export read: the pump is switched
    // out of the plan, and the booked night is already its own overnight block.
    expect(result.current.assignments['5'].map(v => v.id)).toEqual([11])
    // What the drive is built from: the pump it stops at and the night it ends on.
    expect(fedAssignments()['5'].map(v => v.id)).toEqual([11, 12, 13])
  })

  it('FE-TP-ROAD-094: leaving the drive tab does not throw the routed legs away', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')

    const { result } = await renderPhone()
    act(() => { result.current.handleTabChange('plan') })

    expect(result.current.activeTab).toBe('plan')
    expect(result.current.roadtripFeedActive).toBe(true)
    expect(fedDays().map(d => d.id)).toEqual([5])
  })
  it('FE-TP-ROAD-095: a hit found on the phone lands in the chain, not in the full place form', async () => {
    // The sharp one. `roadtripActive` is false on a phone by design, so gating the
    // corridor branch on it sent every hit the stage map found into the ordinary place
    // form, losing the stop kind, the stay, and the position worked out just above it.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(2)
    routeDay(5)

    const { result } = await renderPhone()
    act(() => { result.current.handlePoiClick(poi() as never) })

    expect(result.current.roadtripActive).toBe(false)
    expect(result.current.stopDraft).toMatchObject({ dayId: 5, position: 2, dayNumber: 1 })
    expect(result.current.showPlaceForm).toBe(false)
  })

  it('FE-TP-ROAD-096: an ordinary POI on the phone still carries the stage it was tapped on', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')
    rt.corridor.day = { dayId: 5, dayNumber: 1 }

    const { result } = await renderPhone()
    const { alongKm: _drop, offRouteKm: _drop2, ...plain } = poi()
    act(() => { result.current.handlePoiClick(plain as never) })

    // Without the day it lands in the unplanned pool, which the stage does not show.
    expect(result.current.showPlaceForm).toBe(true)
    expect(result.current.placeFormDayId).toBe(5)
  })

  it('FE-TP-ROAD-097: a service stop opened for editing on the phone gets the place form with its own visit', async () => {
    // The stop sheet's pencil relies on this. The desk popup it would otherwise open has
    // no start time, and for a service stop the start time is the only way to pin or
    // unpin its arrival (a booked night can also be held by the booking's check-in).
    const fuelStop = buildPlace({ id: 102, name: 'Tankstelle', stop_type: 'fuel', lat: 60.39, lng: 5.32 })
    seedTrip({
      places: [fuelStop],
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: { '5': [buildAssignment({ id: 12, day_id: 5, order_index: 0, place: fuelStop })] },
    })
    // The STORED mode is on, set here rather than trusted to the suite's beforeEach: with
    // it off the form branch would be taken anyway and this test would prove nothing.
    sessionStorage.setItem('trip-roadtrip-42', '1')
    sessionStorage.setItem('trip-tab-42', 'roadtrip')

    const phone = await renderPhone()
    act(() => { phone.result.current.openPlaceEditor(fuelStop, 12) })

    expect(phone.result.current.roadtripMode).toBe(false)
    expect(phone.result.current.stopDraft).toBeNull()
    expect(phone.result.current.showPlaceForm).toBe(true)
    expect(phone.result.current.editingPlace?.id).toBe(102)
    expect(phone.result.current.editingAssignmentId).toBe(12)
    phone.unmount()

    // The very same trip at desk width opens the stop popup, so what kept the phone on
    // the form is the width alone.
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: desktopWidth })
    const desk = await renderRoadtrip()
    act(() => { desk.result.current.openPlaceEditor(fuelStop, 12) })

    expect(desk.result.current.stopDraft).toMatchObject({ dayId: 5, editing: { placeId: 102, stopType: 'fuel' } })
    expect(desk.result.current.showPlaceForm).toBe(false)
  })

  it('FE-TP-ROAD-098: a picker open on the drive tab survives the next render, with the mode still off', async () => {
    // The blocker the phone picker hit. The close gate read `roadtripActive`, which is false
    // on a phone by design, and ran on every render because the hook handed out a new
    // object each time: asking set the picker loading, the render after it closed it again.
    // The fixture hands out a fresh object per render so the gate is proven on its own,
    // whatever identity the hook keeps.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: true, error: false }
    rt.altFresh.current = true

    const { result, rerender } = await renderPhone()
    rt.alt.close.mockClear()
    rerender()
    rerender()

    expect(rt.alt.close).not.toHaveBeenCalled()
    expect(result.current.roadtripActive).toBe(false)
    expect(result.current.roadtripMode).toBe(false)
  })

  it('FE-TP-ROAD-099: leaving the drive tab on a phone closes the picker, though the feed stays on', async () => {
    // The phone's counterpart of FE-TP-ROAD-044: the overlay depends only on the picker, so
    // a tab that no longer shows the bar must not leave the other roads drawn on its map.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    sessionStorage.setItem('trip-tab-42', 'roadtrip')
    rt.alt.open = { dayId: 5, drive: { kind: 'leg', index: 0 }, routes: [], loading: false, error: false }

    const { result } = await renderPhone()
    rt.alt.close.mockClear()
    act(() => { result.current.handleTabChange('plan') })

    await waitFor(() => expect(rt.alt.close).toHaveBeenCalled())
    // The routed legs are kept (FE-TP-ROAD-094), so it is the tab that closed it, not the feed.
    expect(result.current.roadtripFeedActive).toBe(true)
  })
})

/**
 * The vias of a day are anchored by POSITION among the stops the router counts, and
 * that count is taken over the STORED list: the day list read as a plan hides the stop
 * a lodging booking put on the day and, behind the switch, the service stops, but the
 * server and the routing round count every one of them. The handlers below are
 * reachable from the place inspector and the day plan in Days mode, where the hook's
 * own list is the shorter one, and a plan measured on it deleted the via behind a
 * hidden hotel or pinned it to a leg nobody drew.
 */
describe('useTripPlanner road trip: corrections measured on the stored day', () => {
  /** A day whose last stop is the hotel a booking put there, hidden under Days. */
  const dayWithHiddenNight = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: { '5': [stopAt(11, 5, 0), stopAt(13, 5, 1), stopAt(14, 5, 2, { accommodation_id: 7 })] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
  }

  it('FE-TP-ROAD-100: removing a stop under Days counts the night the list hides, so the via behind it moves instead of going', async () => {
    dayWithHiddenNight()
    // On the leg from the second stop to the hotel.
    rt.vias.byDay = { 5: [via(1, 5, 1)] }
    const { result } = await renderRoadtrip()
    act(() => result.current.toggleRoadtripMode())
    expect(result.current.assignments['5'].map(a => a.id)).toEqual([11, 13])

    await act(async () => { await result.current.handleRemoveAssignment(5, 11) })

    expect(actions.removeAssignment).toHaveBeenCalledWith(42, 5, 11)
    // Three stops, not two: with two the day would have no leg left and every via
    // of the day would be deleted on the server.
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 1, after_order_index: 0 }], remove: [] })
  })

  it('FE-TP-ROAD-101: a drag under Days keeps a via behind the stop it was drawn after, hotel included', async () => {
    dayWithHiddenNight()
    // On the leg from the first stop to the second.
    rt.vias.byDay = { 5: [via(1, 5, 0)] }
    const { result } = await renderRoadtrip()
    act(() => result.current.toggleRoadtripMode())

    await act(async () => result.current.handleReorder(5, [13, 11]))

    expect(actions.reorderAssignments).toHaveBeenCalledWith(42, 5, [13, 11, 14])
    // The first stop is now second, and the leg from it to the hotel still exists.
    await waitFor(() => expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 1, after_order_index: 1 }], remove: [] }))
  })

  it('FE-TP-ROAD-102: a drop under Days past the last visible row still lands before the hidden hotel', async () => {
    dayWithHiddenNight()
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ lat: 53, lng: 10 }, { lat: 54, lng: 11 }, { lat: 55, lng: 12 }],
      geometry: [[53, 10], [54, 11], [55, 12]],
    }]
    // On the leg from the second stop to the hotel, past where the new stop goes.
    rt.vias.byDay = { 5: [via(1, 5, 1, 0, 54.8, 11.8)] }
    seedStore(useTripStore, { places: [buildPlace({ id: 300, lat: 54.2, lng: 11.2 })] })
    const { result } = await renderRoadtrip()
    act(() => result.current.toggleRoadtripMode())

    // Row index 2 is the hotel's row in the day as it is stored, one past the last
    // row the day plan shows.
    await act(async () => { await result.current.handleAssignToDay(300, 5, 2) })

    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 300, 2)
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 1, after_order_index: 2 }], remove: [] })
  })

  it('FE-TP-ROAD-103: a row index is translated into a stop index before the vias are corrected', async () => {
    // A row without coordinates is never a stop, so the number of rows ahead of a drop
    // is not the number of stops ahead of it.
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      assignments: { '5': [placeless(10, 5, 0), stopAt(11, 5, 1), stopAt(13, 5, 2)] },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ lat: 54, lng: 11 }, { lat: 55, lng: 12 }],
      geometry: [[54, 11], [55, 12]],
    }]
    rt.vias.byDay = { 5: [via(1, 5, 0, 0, 54.8, 11.8)] }
    seedStore(useTripStore, { places: [buildPlace({ id: 300, lat: 54.2, lng: 11.2 })] })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.handleAssignToDay(300, 5, 2) })

    // Row 2 is stop 1: the via on the only leg is now behind the new stop.
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 1, after_order_index: 1 }], remove: [] })
  })
})

describe('useTripPlanner road trip: a stop moved over under Days', () => {
  const twoDays = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: {
        '5': [stopAt(11, 5, 0), stopAt(13, 5, 1)],
        '6': [stopAt(21, 6, 0), stopAt(22, 6, 1), stopAt(23, 6, 2)],
      },
    })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    // One via on each leg of the day the stop moves onto.
    rt.vias.byDay = { 6: [via(1, 6, 0), via(2, 6, 1)] }
  }

  it('FE-TP-ROAD-113: landing in the middle of a day moves the vias behind it along', async () => {
    // A stop with a start is stored among the stops its hour falls between, which is
    // no longer the end of the day. Left alone, the via drawn for the second leg would
    // shape the first leg out of the new stop.
    twoDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.handleMoveToDay(13, 5, 6, 1) })

    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 13, 5, 6, 1)
    expect(rt.vias.reanchor).toHaveBeenCalledWith(6, { vias: [{ id: 2, after_order_index: 2 }], remove: [] })
    const moved = actions.moveAssignment.mock.invocationCallOrder[0] ?? 0
    const corrected = rt.vias.reanchor.mock.invocationCallOrder[0] ?? 0
    expect(moved).toBeLessThan(corrected)
  })

  it('FE-TP-ROAD-114: landing at the end of a day moves no via', async () => {
    twoDays()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.handleMoveToDay(13, 5, 6) })

    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 13, 5, 6, undefined)
    expect(rt.vias.reanchor).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-115: a move that fails is handed back and corrects nothing', async () => {
    // The list reports it and leaves the undo out, so the planner must not swallow it.
    twoDays()
    actions.moveAssignment.mockRejectedValue(new Error('gone'))
    const { result } = await renderRoadtrip()

    await act(async () => {
      await expect(result.current.handleMoveToDay(13, 5, 6, 1)).rejects.toThrow('gone')
    })

    expect(rt.vias.reanchor).not.toHaveBeenCalled()
  })
})

describe('useTripPlanner road trip: a booked night in the popup', () => {
  const hotel = () => buildPlace({ id: 102, name: 'Hotel Fjord', stop_type: 'hotel', lat: 60.39, lng: 5.32 })

  /** The popup as `openPlaceEditor` opens it on a booked night. */
  const editingNight = (result: { current: ReturnType<typeof useTripPlanner> }) => {
    act(() => {
      result.current.setStopDraft({
        poi: poi({ name: 'Hotel Fjord', category: 'hotel', lat: 60.39, lng: 5.32 }) as never,
        dayId: 5,
        dayNumber: 1,
        position: 1,
        editing: { placeId: 102, stopType: 'hotel', dwellMinutes: 30, accommodationId: 7, checkIn: '15:00', checkOut: '' },
        overnight: { days: [{ id: 5, number: 1, date: null }, { id: 6, number: 2, date: null }], defaultEndDayId: 6 },
      })
    })
  }

  it('FE-TP-ROAD-104: switching a booked night to a pause asks first, naming the booking that would go', async () => {
    const stay = hotel()
    seedTrip({
      places: [stay],
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: { '5': [buildAssignment({ id: 12, day_id: 5, order_index: 1, place: stay, accommodation_id: 7 })] },
      reservations: [buildReservation({ id: 9, type: 'hotel', title: 'Booking 4711', accommodation_id: 7 })],
    })
    const remove = vi.spyOn(accommodationsApi, 'delete').mockResolvedValue({} as never)
    const { result } = await renderRoadtrip()
    editingNight(result)

    await act(async () => { await result.current.saveStopDraft({ stopType: null, dwellMinutes: 45 }) })

    // Nothing has been written, and the popup is still open behind the question.
    expect(remove).not.toHaveBeenCalled()
    expect(actions.updatePlace).not.toHaveBeenCalled()
    expect(result.current.stopDraft).not.toBeNull()
    expect(result.current.stayRelease).toEqual({
      stop: { stopType: null, dwellMinutes: 45 },
      name: 'Hotel Fjord',
      booking: 'Booking 4711',
    })

    // A no leaves the traveller where they were.
    act(() => { result.current.setStayRelease(null) })
    expect(result.current.stopDraft).not.toBeNull()
    expect(remove).not.toHaveBeenCalled()

    // A yes is the very save that was asked for.
    await act(async () => { await result.current.saveStopDraft({ stopType: null, dwellMinutes: 45 }) })
    await act(async () => { await result.current.confirmStayRelease() })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 102, { stop_type: null, duration_minutes: 45 })
    expect(remove).toHaveBeenCalledWith(42, 7, { keepStop: true })
    expect(result.current.stayRelease).toBeNull()
    expect(result.current.stopDraft).toBeNull()
  })

  it('FE-TP-ROAD-105: a night without a booking of its own asks too, and names none', async () => {
    const stay = hotel()
    seedTrip({
      places: [stay],
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: { '5': [buildAssignment({ id: 12, day_id: 5, order_index: 1, place: stay, accommodation_id: 7 })] },
    })
    vi.mocked(accommodationRepo.list).mockResolvedValue({
      accommodations: [{ id: 7, trip_id: 42, place_id: 102, start_day_id: 5, end_day_id: 6, reservation_title: null }],
    } as never)
    const remove = vi.spyOn(accommodationsApi, 'delete').mockResolvedValue({} as never)
    const { result } = await renderRoadtrip()
    await waitFor(() => expect(result.current.tripAccommodations).toHaveLength(1))
    editingNight(result)

    await act(async () => { await result.current.saveStopDraft({ stopType: null, dwellMinutes: 20 }) })

    expect(remove).not.toHaveBeenCalled()
    expect(result.current.stayRelease).toMatchObject({ name: 'Hotel Fjord', booking: null })
  })

  it('FE-TP-ROAD-106: a check-in moved in the popup folds the re-seated night into the day', async () => {
    // The server seats the night by its check-in and answers with the moved stop. The
    // socket skips the session that asked, so this answer is the only way the writer's
    // own rail learns the new order before a reload.
    const stay = hotel()
    const museum = buildPlace({ id: 101, name: 'Museum', lat: 60.4, lng: 5.3 })
    const dinner = buildPlace({ id: 103, name: 'Dinner', lat: 60.41, lng: 5.31 })
    const night = buildAssignment({ id: 12, day_id: 5, order_index: 1, place: stay, accommodation_id: 7 })
    seedTrip({
      places: [museum, stay, dinner],
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: { '5': [
        buildAssignment({ id: 11, day_id: 5, order_index: 0, place: museum }),
        night,
        buildAssignment({ id: 13, day_id: 5, order_index: 2, place: dinner }),
      ] },
    })
    const update = vi.spyOn(accommodationsApi, 'update').mockResolvedValue({
      accommodation: { id: 7 },
      movedAssignment: { assignment: { ...night, order_index: 2 }, oldDayId: 5 },
    } as never)
    const { result } = await renderRoadtrip()
    editingNight(result)

    await act(async () => {
      await result.current.saveStopDraftAsNight({ endDayId: 6, checkIn: '20:00', checkOut: '' })
    })

    expect(update).toHaveBeenCalledWith(42, 7, { place_id: 102, start_day_id: 5, end_day_id: 6, check_in: '20:00', check_out: null })
    expect(useTripStore.getState().assignments['5'].find(a => a.id === 12)?.order_index).toBe(2)
    // The neighbours were renumbered as well, and the answer names only the night.
    expect(actions.refreshDays).toHaveBeenCalledWith(42)
    expect(result.current.stopDraft).toBeNull()
  })
})

describe('useTripPlanner road trip: a hit handed to the full form', () => {
  it('FE-TP-ROAD-107: saving it through the form re-anchors the vias the way the popup does', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(1)
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ lat: 53.55, lng: 9.99 }, { lat: 53.0, lng: 11.5 }, { lat: 52.52, lng: 13.4 }],
      geometry: [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]],
    }]
    // On the second leg, behind the stop the hit goes in front of.
    rt.vias.byDay = { 5: [via(11, 5, 1, 0, 52.8, 12.2)] }
    const { result } = await renderRoadtrip()

    act(() => { result.current.handlePoiClick(poi({ lat: 53.2, lng: 10.7 }) as never) })
    act(() => { result.current.stopDraftToForm({ stopType: 'fuel', dwellMinutes: 10 }) })
    await act(async () => { await result.current.handleSavePlace({ name: 'Rasthof', lat: 53.2, lng: 10.7 }) })

    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 5, 900, 1)
    // Left alone the via keeps index 1 and is redrawn onto the leg the new stop took.
    expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 11, after_order_index: 2 }], remove: [] })
    const assigned = actions.assignPlaceToDay.mock.invocationCallOrder[0] ?? 0
    const corrected = rt.vias.reanchor.mock.invocationCallOrder[0] ?? 0
    expect(assigned).toBeLessThan(corrected)
  })

  it('FE-TP-ROAD-108: the position dies with the form, so the next add from a day goes to its end', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.corridor.insertIndexFor.mockReturnValue(2)
    const { result } = await renderRoadtrip()

    act(() => { result.current.handlePoiClick(poi() as never) })
    act(() => { result.current.stopDraftToForm() })
    expect(result.current.placeFormDayId).toBe(5)
    // Closed unsaved, then opened again from another day's own "add place".
    act(() => { result.current.setShowPlaceForm(false) })
    act(() => { result.current.setPlaceFormDayId(6); result.current.setShowPlaceForm(true) })
    await act(async () => { await result.current.handleSavePlace({ name: 'Museum' }) })

    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 6, 900, null)
  })
})

describe('useTripPlanner road trip: a ride on the drive (#2428)', () => {
  /**
   * One card: Hamburg, the airport it flies from, the airport it lands at, Munich. The
   * ride draws no line of its own, so the card's geometry jumps from one terminal to the
   * other and a click under the flight path projects onto that jump. The terminals carry
   * the index of the stop after them, as `seatCarrierStops` seats them: they stand in
   * for no stored stop of their own.
   */
  const terminal = (role: 'departure' | 'arrival') => ({
    assignmentId: role === 'departure' ? -3000000140 : -3000000141,
    placeId: -70,
    ownerIndex: 1,
    lat: role === 'departure' ? 53.63 : 48.35,
    lng: role === 'departure' ? 9.99 : 11.78,
    carrier: { reservationId: 70, type: 'flight', role, title: 'LH 2020', code: role === 'departure' ? 'HAM' : 'MUC', at: null },
  })
  const flownDay = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [{ assignmentId: 1, placeId: 10, lat: 53.55, lng: 9.99 }, terminal('departure'), terminal('arrival'), { assignmentId: 2, placeId: 20, ownerIndex: 1, lat: 48.13, lng: 11.58 }],
      geometry: [[53.55, 9.99], [53.63, 9.99], [48.35, 11.78], [48.13, 11.58]],
    }]
  }

  it('FE-TP-ROAD-109: a via is filed on the road into the departure terminal, never on the ride or the road out of the arrival', async () => {
    flownDay()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.59, 9.99) })
    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53.59, 9.99)

    rt.vias.add.mockClear()
    // Under the flight path, and on the road out of the airport it lands at: a via there
    // would be stored at the next stop's position and bend that stop's road instead.
    await act(async () => { await result.current.addRoadtripVia(50.99, 10.885) })
    await act(async () => { await result.current.addRoadtripVia(48.24, 11.68) })
    expect(rt.vias.add).not.toHaveBeenCalled()
  })

  it('FE-TP-ROAD-110: a via dragged onto the road out of the arrival moves without an anchor', async () => {
    flownDay()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 3, 48.24, 11.68) })
    expect(rt.vias.move).toHaveBeenCalledWith(5, 3, 48.24, 11.68, undefined)
  })

  it('FE-TP-ROAD-111: nothing is stopped at on a flight; behind the arrival the road goes on', async () => {
    flownDay()
    const { result } = await renderRoadtrip()

    expect(result.current.manualStopTargetFor(50.99, 10.885)).toBeNull()
    expect(result.current.manualStopTargetFor(48.24, 11.68)).toMatchObject({ dayId: 5 })
  })

  it('FE-TP-ROAD-112: the ride is drawn on the map as its booking, on top of whatever the reader switched on', async () => {
    flownDay()
    const { result } = await renderRoadtrip()

    expect(result.current.roadtripConnections).toContain(70)
  })
})

describe('useTripPlanner road trip: the drive between two days (#2461)', () => {
  /** The road the rail drives from the last stop of day 5 to the first of day 6, and one north of it. */
  const SEAM_LINE: [number, number][] = [[53.25, 10.41], [52.9, 12.0], [52.52, 13.4]]
  const NORTH: [number, number][] = [[53.25, 10.41], [53.3, 11.6], [53.0, 12.9], [52.52, 13.4]]

  const lastOfDay5 = { assignmentId: 13, placeId: 1013, name: 'Lüneburg', lat: 53.25, lng: 10.41, ownerDayId: 5, ownerIndex: 2 }
  const firstOfDay6 = { assignmentId: 21, placeId: 1021, name: 'Berlin', lat: 52.52, lng: 13.4, ownerDayId: 6, ownerIndex: 0 }

  /**
   * Two connected cards. Day 5 ends on its third stop, so the drive into day 6 is filed
   * behind index 2 of day 5, which nothing on card 6 could name.
   */
  const connectedCards = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [
      {
        dayId: 5,
        dayNumber: 1,
        stops: [
          { assignmentId: 11, placeId: 1011, lat: 53.55, lng: 9.99 },
          { assignmentId: 12, placeId: 1012, lat: 53.4, lng: 10.2 },
          lastOfDay5,
        ],
        legs: [{ distance: 20_000, duration: 1_200 }, { distance: 25_000, duration: 1_500 }],
        geometry: [[53.55, 9.99], [53.4, 10.2], [53.25, 10.41]],
      },
      {
        dayId: 6,
        dayNumber: 2,
        stops: [firstOfDay6, { assignmentId: 22, placeId: 1022, lat: 52.3, lng: 14.0 }],
        legs: [{ distance: 60_000, duration: 3_000 }],
        arrivingFrom: lastOfDay5,
        arrivingLeg: { distance: 280_000, duration: 10_000 },
        arrivingLine: SEAM_LINE,
        geometry: [...SEAM_LINE, [52.3, 14.0]],
      },
    ]
  }

  const openOnSeam = (over: Record<string, unknown> = {}) => {
    rt.alt.open = {
      dayId: 6, drive: { kind: 'arriving' }, loading: false, error: false, proving: null,
      anchor: { dayId: 5, afterIndex: 2 },
      ends: { from: 13, to: 21 },
      engine: 'osrm',
      route: rt.legRoute,
      routes: [
        { coordinates: SEAM_LINE, distance: 280_000, duration: 10_000, divergence: null, current: true },
        { coordinates: NORTH, distance: 300_000, duration: 10_800, divergence: null },
      ],
      ...over,
    }
  }

  it('FE-TP-ROAD-128: asking about the drive in hands over the pair from yesterday, filed behind the stop it leaves', async () => {
    connectedCards()
    const { result } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(6, { kind: 'arriving' }) })

    const [request] = rt.alt.ask.mock.calls[0] as [Record<string, unknown>]
    expect(request).toMatchObject({
      dayId: 6,
      drive: { kind: 'arriving' },
      from: { lat: 53.25, lng: 10.41 },
      to: { lat: 52.52, lng: 13.4 },
      // The road the rail drives across the join, as the current way.
      driven: { coordinates: SEAM_LINE, distance: 280_000, duration: 10_000 },
      // Day 5, behind its last stop: where the map files a point dropped on this drive.
      anchor: { dayId: 5, afterIndex: 2 },
      ends: { from: 13, to: 21 },
    })
    // The seam's own router, asked under the card it arrives on.
    const [from, to, cardDayId] = rt.routes.legRouter.mock.calls[0] as [{ assignmentId: number }, { assignmentId: number }, number]
    expect([from.assignmentId, to.assignmentId, cardDayId]).toEqual([13, 21, 6])
  })

  it('FE-TP-ROAD-129: a card with no drive in asks nothing, and asking again closes the picker on it', async () => {
    connectedCards()
    const { result, rerender } = await renderRoadtrip()

    act(() => { result.current.askRouteAlternatives(5, { kind: 'arriving' }) })
    expect(rt.alt.ask).not.toHaveBeenCalled()

    // Open on the drive in: the first leg of the same card is another drive.
    openOnSeam()
    rerender()
    act(() => { result.current.askRouteAlternatives(6, { kind: 'leg', index: 0 }) })
    expect(rt.alt.ask).toHaveBeenCalledTimes(1)
    rt.alt.close.mockClear()

    act(() => { result.current.askRouteAlternatives(6, { kind: 'arriving' }) })
    expect(rt.alt.close).toHaveBeenCalled()
    expect(rt.alt.ask).toHaveBeenCalledTimes(1)
  })

  it('FE-TP-ROAD-130: a way chosen for the drive in is proven, then written behind the last stop of the day before', async () => {
    connectedCards()
    openOnSeam()
    rt.legRoute.mockResolvedValue({ coordinates: NORTH, distance: 300_000, duration: 10_800, fellBack: false })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.legRoute).toHaveBeenCalledTimes(1)
    const [pins] = rt.legRoute.mock.calls[0] as [Array<{ lat: number; lng: number }>]
    expect(pins).toHaveLength(1)
    // Replacing what bent that drive before, on day 5 and not on the card it is drawn on.
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [{ after_order_index: 2, ...pins[0] }], [2])
    expect(rt.alt.close).toHaveBeenCalled()
  })

  it('FE-TP-ROAD-131: taking the router own road on a bent drive in clears it in one write', async () => {
    connectedCards()
    rt.vias.byDay = { 5: [via(9, 5, 2, 0, 53.4, 11.8)] }
    openOnSeam({
      routes: [
        { coordinates: NORTH, distance: 300_000, duration: 10_800, divergence: null, current: true },
        { coordinates: SEAM_LINE, distance: 280_000, duration: 10_000, divergence: null, direct: true },
      ],
    })
    rt.legRoute.mockResolvedValue({ coordinates: SEAM_LINE, distance: 280_000, duration: 10_000, fellBack: false })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(rt.legRoute.mock.calls[0][0]).toEqual([])
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [], [2])
  })

  it('FE-TP-ROAD-134: a drive in that leaves a day of a single stop is written behind that stop', async () => {
    // Such a day draws no card, so the cards alone do not hold the stop the drive in leaves
    // from. Checked against them only, every choice on this drive was refused as a leg that
    // had changed.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    const lone = { ...lastOfDay5, ownerIndex: 0 }
    rt.routes.quietDays = [{ dayId: 5, dayNumber: 1, date: null, title: null, stops: [lone] }]
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [firstOfDay6, { assignmentId: 22, placeId: 1022, lat: 52.3, lng: 14.0 }],
      legs: [{ distance: 60_000, duration: 3_000 }],
      arrivingFrom: lone,
      arrivingLeg: { distance: 280_000, duration: 10_000 },
      arrivingLine: SEAM_LINE,
      geometry: [...SEAM_LINE, [52.3, 14.0]],
    }]
    openOnSeam({ anchor: { dayId: 5, afterIndex: 0 } })
    rt.legRoute.mockResolvedValue({ coordinates: NORTH, distance: 300_000, duration: 10_800, fellBack: false })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    const [pins] = rt.legRoute.mock.calls[0] as [Array<{ lat: number; lng: number }>]
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [{ after_order_index: 0, ...pins[0] }], [0])
    expect(toasts).not.toContainEqual(expect.objectContaining({ message: 'This leg changed while the way was being checked, so nothing was saved.' }))
  })

  /** Day 5 with three stops, a via on its first leg, and one behind its last: the drive into day 6. */
  const threeStops = () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })],
      assignments: {
        '5': [stopAt(11, 5, 0), stopAt(12, 5, 1), stopAt(13, 5, 2)],
        '6': [stopAt(21, 6, 0)],
      },
    })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.vias.byDay = { 5: [via(1, 5, 0), via(9, 5, 2, 0, 53.4, 11.8)] }
  }

  it('FE-TP-ROAD-132: a drag under Days that leaves the last stop last keeps the drive into the next day', async () => {
    // It used to be deleted: measured as a leg, the last stop leads nowhere.
    threeStops()
    const { result } = await renderRoadtrip()

    await act(async () => result.current.handleReorder(5, [12, 11, 13]))

    await waitFor(() => expect(rt.vias.reanchor).toHaveBeenCalledWith(5, { vias: [{ id: 1, after_order_index: 1 }], remove: [] }))
  })

  it('FE-TP-ROAD-133: a last stop taken out or dragged up the day takes the drive behind it along', async () => {
    // Left where it was, the via sat on a number no stop has and bent nothing, or bent
    // the drive of whichever stop came to stand there.
    threeStops()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.reorderRoadtripStop(5, 13, 0) })
    expect(rt.vias.reanchor).toHaveBeenLastCalledWith(5, { vias: [{ id: 1, after_order_index: 1 }], remove: [9] })

    await act(async () => { await result.current.handleRemoveAssignment(5, 13) })
    expect(rt.vias.reanchor).toHaveBeenLastCalledWith(5, { vias: [], remove: [9] })
  })
})

describe('useTripPlanner road trip: a booked night at the edge of a day', () => {
  const NO_VIA = 'No via point on the drive to or from your stay. Add a stop there instead.'
  const bookend = (phase: 'morning' | 'evening', over: Record<string, unknown>) => ({
    assignmentId: phase === 'morning' ? -6_000_000_010 : -6_000_000_011,
    placeId: 900,
    name: 'Hotel',
    stopType: 'hotel',
    bookend: { phase, accommodationId: 5, reservationId: null, checkingOut: phase === 'morning', checkingIn: phase === 'evening', checkOut: null },
    ...over,
  })
  /**
   * A transfer day west to east: out of one hotel, two places, into the next. Four points
   * on one straight road, so every leg is a stretch of the line of its own.
   */
  const transferDay = () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        bookend('morning', { ownerIndex: 0, lat: 53, lng: 9 }),
        { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 10, name: 'Lookout' },
        { assignmentId: 12, ownerIndex: 1, lat: 53, lng: 11, name: 'Falls' },
        bookend('evening', { ownerIndex: 2, lat: 53, lng: 12 }),
      ],
      geometry: [[53, 9], [53, 10], [53, 11], [53, 12]],
    }]
  }

  it('FE-TP-ROAD-140: a click on the drive out of the morning hotel puts no via there, and says why', async () => {
    transferDay()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53, 9.5) })

    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(toasts).toContainEqual({ message: NO_VIA, type: 'info' })
  })

  it('FE-TP-ROAD-141: nor on the drive into tonight’s hotel, while the drive between the places still takes one', async () => {
    transferDay()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53, 11.5) })
    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(toasts.filter(t => t.message === NO_VIA)).toHaveLength(1)

    await act(async () => { await result.current.addRoadtripVia(53, 10.5) })
    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53, 10.5)
  })

  it('FE-TP-ROAD-142: a via dragged onto the drive from or to a hotel keeps the leg it was on', async () => {
    transferDay()
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.moveRoadtripVia(5, 3, 53, 9.5) })
    await act(async () => { await result.current.moveRoadtripVia(5, 3, 53, 11.5) })

    expect(rt.vias.move).toHaveBeenNthCalledWith(1, 5, 3, 53, 9.5, undefined)
    expect(rt.vias.move).toHaveBeenNthCalledWith(2, 5, 3, 53, 11.5, undefined)
  })

  it('FE-TP-ROAD-143: a place added on the drive out of the hotel comes first, one on the drive into the next comes last', async () => {
    transferDay()
    const { result } = await renderRoadtrip()

    // Card positions: after the morning hotel, and in front of the evening one.
    expect(result.current.manualStopTargetFor(53, 9.5)).toMatchObject({ dayId: 5, position: 1 })
    expect(result.current.manualStopTargetFor(53, 11.5)).toMatchObject({ dayId: 5, position: 3 })
  })

  it('FE-TP-ROAD-144: a place added between the first two places lands between them, not in front of the first', async () => {
    // The morning hotel shares the first place's index. Found by that index, it stood in
    // for the place, and the new one went in one stop early.
    transferDay()
    const { result } = await renderRoadtrip()

    expect(result.current.manualStopTargetFor(53, 10.5)).toMatchObject({ dayId: 5, position: 2 })
  })

  it('FE-TP-ROAD-145: behind a terminal, and on the road after the next place, a place lands where it fell', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    const carrier = (role: 'departure' | 'arrival') =>
      ({ reservationId: 70, type: 'flight', role, title: 'LH 2020', code: null, at: null })
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 9, name: 'Hamburg' },
        { assignmentId: -3000000140, placeId: -70, ownerIndex: 1, lat: 53, lng: 10, carrier: carrier('departure') },
        { assignmentId: -3000000141, placeId: -70, ownerIndex: 1, lat: 53, lng: 11, carrier: carrier('arrival') },
        { assignmentId: 12, ownerIndex: 1, lat: 53, lng: 12, name: 'Munich' },
        { assignmentId: 13, ownerIndex: 2, lat: 53, lng: 13, name: 'Garmisch' },
      ],
      geometry: [[53, 9], [53, 10], [53, 11], [53, 12], [53, 13]],
    }]
    const { result } = await renderRoadtrip()

    // Right behind the arrival, not between the two ends of the flight.
    expect(result.current.manualStopTargetFor(53, 11.5)).toMatchObject({ dayId: 5, position: 3 })
    // Behind Munich, which shares its index with the terminals seated in front of it.
    expect(result.current.manualStopTargetFor(53, 12.5)).toMatchObject({ dayId: 5, position: 4 })
  })

  it('FE-TP-ROAD-146: the inspector speaks for the stay’s own stop, whatever bookends stand at its place', async () => {
    seedTrip({ places: [buildPlace({ id: 900 })], days: [buildDay({ id: 5 }), buildDay({ id: 6 })] })
    rt.routes.days = [
      {
        dayId: 5,
        stops: [
          { assignmentId: 21, placeId: 900, lat: 53, lng: 9, night: true },
          { assignmentId: 22, placeId: 901, lat: 53, lng: 10 },
          bookend('evening', { ownerIndex: 2, lat: 53, lng: 9 }),
        ],
      },
      {
        dayId: 6,
        stops: [bookend('morning', { assignmentId: -6_000_000_012, ownerIndex: 0, lat: 53, lng: 9 }), { assignmentId: 23, placeId: 902, lat: 53, lng: 11 }],
      },
    ]
    useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' } }))
    const { result } = await renderRoadtrip()

    act(() => { result.current.handlePlaceClick(900) })

    // One stop answers for the place, so its day end can be set there.
    expect(result.current.roadtripEndDay?.active).toBe(false)
    await act(async () => result.current.roadtripEndDay?.onToggle())
    expect(actions.setAssignmentEndDay).toHaveBeenCalledWith(42, 5, 21, true)
  })

  it('FE-TP-ROAD-147: a way chosen for the first leg after the morning hotel is still that leg', async () => {
    const LINE: [number, number][] = [[53, 10], [53, 11]]
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        bookend('morning', { ownerIndex: 0, lat: 53, lng: 9 }),
        { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 10, name: 'Lookout' },
        { assignmentId: 12, ownerIndex: 1, lat: 53, lng: 11, name: 'Falls' },
      ],
      legs: [{ distance: 70_000, duration: 3_600 }, { distance: 70_000, duration: 3_600 }],
      legLines: [[[53, 9], [53, 10]], LINE],
      geometry: [[53, 9], [53, 10], [53, 11]],
    }]
    rt.vias.byDay = { 5: [via(1, 5, 0, 0, 53.1, 10.5)] }
    rt.alt.open = {
      dayId: 5, drive: { kind: 'leg', index: 1 }, loading: false, error: false, proving: null,
      anchor: { dayId: 5, afterIndex: 0 },
      ends: { from: 11, to: 12 },
      engine: 'osrm',
      route: rt.legRoute,
      routes: [
        { coordinates: [[53, 10], [53.1, 10.5], [53, 11]], distance: 80_000, duration: 4_000, divergence: null, current: true },
        { coordinates: LINE, distance: 70_000, duration: 3_600, divergence: null, direct: true },
      ],
    }
    rt.legRoute.mockResolvedValue({ coordinates: LINE, distance: 70_000, duration: 3_600, fellBack: false })
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.chooseRouteAlternative(1) })

    expect(toasts.filter(t => t.message.includes('changed'))).toEqual([])
    expect(rt.vias.addMany).toHaveBeenCalledWith(5, [], [0])
  })

  const HAMBURG = { lat: 53.55, lng: 9.99 }
  const HOTEL = { lat: 53.0, lng: 11.5 }

  it('FE-TP-ROAD-148: the drive into the hotel handed to the next card through the night takes no via, and a place there goes first on that card', async () => {
    // The hotel was reached after midnight: tonight's hotel row of day 5 heads card 6,
    // behind the stretch driven from Hamburg, and the morning's hotel row follows it. The
    // stretch is Hamburg's leg as far as a via is stored, and bending it would bend the
    // drive to the hotel, which keeps its road.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [
        bookend('evening', { ownerDayId: 5, ownerIndex: 2, ...HOTEL }),
        bookend('morning', { assignmentId: -6_000_000_012, ownerDayId: 6, ownerIndex: 0, ...HOTEL }),
        { assignmentId: 21, placeId: 1201, ownerDayId: 6, ownerIndex: 0, lat: 51.05, lng: 13.74, name: 'Dresden' },
      ],
      spills: [{ at: 0, count: 1, fromDayNumber: 1, fromStop: drawn(1101, HAMBURG.lat, HAMBURG.lng, 5, 1) }],
      geometry: [[HAMBURG.lat, HAMBURG.lng], [53.3, 10.7], [HOTEL.lat, HOTEL.lng], [52.0, 12.6], [51.05, 13.74]],
    }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53.3, 10.7) })
    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(toasts).toContainEqual({ message: NO_VIA, type: 'info' })

    expect(result.current.manualStopTargetFor(53.3, 10.7)).toMatchObject({ dayId: 6, position: 0 })
  })

  it('FE-TP-ROAD-149: nor does the drive in from yesterday that leaves from its hotel', async () => {
    // Connected days after a quiet check-out: the drive into card 6 starts at the hotel
    // day 5 ended at, drawn at the head of card 6. It files nothing, whatever the first
    // stop behind it is.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 6, dayNumber: 2 }
    rt.routes.days = [{
      dayId: 6,
      dayNumber: 2,
      stops: [
        { assignmentId: 21, placeId: 1201, ownerDayId: 6, ownerIndex: 0, lat: 51.05, lng: 13.74, name: 'Dresden' },
        { assignmentId: 22, placeId: 1202, ownerDayId: 6, ownerIndex: 1, lat: 50.08, lng: 14.43, name: 'Prague' },
      ],
      spills: [],
      arrivingFrom: bookend('evening', { ownerDayId: 5, ownerIndex: 2, ...HOTEL }),
      geometry: [[HOTEL.lat, HOTEL.lng], [52.0, 12.6], [51.05, 13.74], [50.6, 14.1], [50.08, 14.43]],
    }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(52.0, 12.6) })
    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(toasts.filter(t => t.message === NO_VIA)).toHaveLength(1)
    expect(result.current.manualStopTargetFor(52.0, 12.6)).toMatchObject({ dayId: 6, position: 0 })

    // Past the first stop the card's own leg takes one as always.
    await act(async () => { await result.current.addRoadtripVia(50.6, 14.1) })
    expect(rt.vias.add).toHaveBeenCalledWith(6, 0, 50.6, 14.1)
  })

  it('FE-TP-ROAD-150: the hotel a day starts or ends at has its pin on the map, also when no day holds its stop', async () => {
    seedTrip({
      days: [buildDay({ id: 5, day_number: 1 })],
      places: [buildPlace({ id: 900, ...HOTEL }), buildPlace({ id: 901, lat: 53, lng: 10 })],
    })
    const place = useTripStore.getState().places.find(p => p.id === 901)!
    useTripStore.setState({ assignments: { '5': [buildAssignment({ id: 11, day_id: 5, place_id: 901, place })] } })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        { assignmentId: 11, placeId: 901, ownerIndex: 0, lat: 53, lng: 10, name: 'Lookout' },
        bookend('evening', { ownerIndex: 1, ...HOTEL }),
      ],
      geometry: [[53, 10], [HOTEL.lat, HOTEL.lng]],
    }]
    const { result } = await renderRoadtrip()

    expect(result.current.roadtripMapPlaces.map(p => p.id).sort((a, b) => a - b)).toEqual([900, 901])

    // Folded, the card takes its hotel off the map with its stops.
    act(() => { result.current.toggleRoadtripDay(5) })
    expect(result.current.roadtripMapPlaces.map(p => p.id)).toEqual([])
  })

  it('FE-TP-ROAD-151: a road driven out of the hotel and again between two places takes a via on the second pass', async () => {
    // Out of the hotel east to the lookout, then back west past the hotel to the falls:
    // the road between the hotel and the lookout is driven twice, and only the second
    // pass is a leg a via can be filed on.
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        bookend('morning', { ownerIndex: 0, lat: 53, lng: 10 }),
        { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 11, name: 'Lookout' },
        { assignmentId: 12, ownerIndex: 1, lat: 53, lng: 9, name: 'Falls' },
      ],
      geometry: [[53, 10], [53, 11], [53, 10], [53, 9]],
    }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53, 10.5) })
    expect(rt.vias.add).toHaveBeenCalledWith(5, 0, 53, 10.5)
    expect(toasts.filter(t => t.message === NO_VIA)).toEqual([])

    await act(async () => { await result.current.moveRoadtripVia(5, 3, 53, 10.5) })
    expect(rt.vias.move).toHaveBeenCalledWith(5, 3, 53, 10.5, 0)
  })

  it('FE-TP-ROAD-152: a road only the hotel’s drives use, out in the morning and back at night, still takes none', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [{
      dayId: 5,
      dayNumber: 1,
      stops: [
        bookend('morning', { ownerIndex: 0, lat: 53, lng: 10 }),
        { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 11, name: 'Lookout' },
        bookend('evening', { ownerIndex: 1, lat: 53, lng: 10 }),
      ],
      geometry: [[53, 10], [53, 11], [53, 10]],
    }]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53, 10.5) })

    expect(rt.vias.add).not.toHaveBeenCalled()
    expect(toasts).toContainEqual({ message: NO_VIA, type: 'info' })
  })

  it('FE-TP-ROAD-153: where yesterday’s drive into the hotel and today’s leg share a road, the click goes to today’s leg', async () => {
    seedTrip({ days: [buildDay({ id: 5, day_number: 1 }), buildDay({ id: 6, day_number: 2 })] })
    rt.corridor.day = { dayId: 5, dayNumber: 1 }
    rt.routes.days = [
      {
        dayId: 5,
        dayNumber: 1,
        stops: [
          { assignmentId: 11, ownerIndex: 0, lat: 53, lng: 9, name: 'Harbour' },
          bookend('evening', { ownerIndex: 1, lat: 53, lng: 10 }),
        ],
        geometry: [[53, 9], [53, 10]],
      },
      {
        dayId: 6,
        dayNumber: 2,
        stops: [
          { assignmentId: 21, ownerIndex: 0, lat: 53, lng: 9.2, name: 'Mill' },
          { assignmentId: 22, ownerIndex: 1, lat: 53, lng: 9.8, name: 'Dunes' },
        ],
        geometry: [[53, 9.2], [53, 9.8]],
      },
    ]
    const { result } = await renderRoadtrip()

    await act(async () => { await result.current.addRoadtripVia(53, 9.5) })

    expect(rt.vias.add).toHaveBeenCalledWith(6, 0, 53, 9.5)
    expect(toasts.filter(t => t.message === NO_VIA)).toEqual([])
  })
})
