// FE-TP-FEED-001 to FE-TP-FEED-015
//
// The road trip as the planner routes and draws it, driven straight through
// useRoadtripFeed. The preference, boundary, via, routing, corridor and follow-track
// hooks are fixtures with suites of their own; what is tested here is what the feed
// asks of them and what it builds from their answers.
import { act, renderHook } from '@testing-library/react'
import { MAX_TRIP_DAYS, type RoadtripDayBoundary } from '@trek/shared'
import { PHONE_CORRIDOR_OPTIONS } from '../../components/Roadtrip/corridorSearchModel'
import { dayColor } from '../../components/Roadtrip/dayColors'
import { roadtripPreferencesRepo } from '../../repo/roadtripPreferencesRepo'
import { useAuthStore } from '../../store/authStore'
import { useRoadtripPreferencesStore } from '../../store/roadtripPreferencesStore'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildAssignment, buildDay, buildPlace, buildReservation, buildTrip, buildUser } from '../../../tests/helpers/factories'
import type { AssignmentsMap } from '../../types'
import type { Can, Translate } from './plannerTypes'
import { useRoadtripFeed } from './useRoadtripFeed'

const rt = vi.hoisted(() => ({
  prefs: { ready: true, failed: false },
  prefsArgs: [] as unknown[],
  boundaries: {
    boundaries: [] as RoadtripDayBoundary[],
    editable: false,
    stale: false,
    pending: false,
    save: vi.fn(async (_day: number, _boundary: unknown) => true),
  },
  boundaryArgs: [] as unknown[],
  vias: { byDay: {} as Record<number, Array<{ id: number; day_id: number; after_order_index: number; sequence: number; lat: number; lng: number }>> },
  viasArgs: [] as unknown[],
  routes: {
    days: [] as Array<Record<string, unknown>>,
    quietDays: [] as unknown[],
    lines: [] as unknown[],
    lineDays: [] as number[],
    boundaryPath: undefined as unknown[] | undefined,
    validateBoundaries: vi.fn((_next: unknown[]): string | null => null),
  },
  routesArgs: [] as unknown[],
  corridor: { day: undefined },
  corridorArgs: [] as unknown[],
  follow: { busy: false },
  followArgs: [] as unknown[],
  refuel: { offered: [] as unknown[] },
}))

vi.mock('../../hooks/useRoadtripSettings', () => ({
  useLoadRoadtripSettings: (...args: unknown[]) => { rt.prefsArgs = args; return rt.prefs },
}))
vi.mock('../../components/Roadtrip/useDayBoundaries', () => ({
  useDayBoundaries: (...args: unknown[]) => { rt.boundaryArgs = args; return rt.boundaries },
}))
vi.mock('../../components/Roadtrip/useRoadtripVias', () => ({
  useRoadtripVias: (...args: unknown[]) => { rt.viasArgs = args; return rt.vias },
}))
vi.mock('../../components/Roadtrip/useRefuelSearch', () => ({ useRefuelSearch: () => rt.refuel }))
vi.mock('../../components/Roadtrip/useRoadtripRoutes', () => ({
  useRoadtripRoutes: (...args: unknown[]) => { rt.routesArgs = args; return rt.routes },
}))
vi.mock('../../components/Roadtrip/useRoadtripCorridor', () => ({
  useRoadtripCorridor: (...args: unknown[]) => { rt.corridorArgs = args; return rt.corridor },
}))
vi.mock('../../components/Roadtrip/useFollowTrack', () => ({
  useFollowTrack: (...args: unknown[]) => { rt.followArgs = args; return rt.follow },
}))
vi.mock('../../repo/roadtripPreferencesRepo', () => ({
  roadtripPreferencesRepo: { update: vi.fn(async () => ({ roadtrip_max_drive_minutes: 300 })) },
}))

type Options = Parameters<typeof useRoadtripFeed>[0]

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t: Translate = (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key)
let allowed = true
const can: Can = vi.fn(() => allowed)
const trip = buildTrip({ id: 42 })

// Day 1 is stored as three rows: two stops with coordinates out of order, and a note
// without any. The plan view's own list leaves the service stop on day 2 out.
const dayOne = buildDay({ id: 1, day_number: 1, date: '2026-06-01' })
const dayTwo = buildDay({ id: 2, day_number: 2, date: '2026-06-02' })
const days = [dayOne, dayTwo]
const lake = buildPlace({ id: 1, name: 'Lake', lat: 50, lng: 10 })
const castle = buildPlace({ id: 2, name: 'Castle', lat: 50, lng: 11 })
const note = buildPlace({ id: 3, name: 'Note', lat: null, lng: null })
const pump = buildPlace({ id: 4, name: 'Pump', lat: 50, lng: 12, stop_type: 'fuel' })
const harbour = buildPlace({ id: 5, name: 'Harbour', lat: 50, lng: 13 })
const hotel = buildPlace({ id: 6, name: 'Hotel', lat: 50, lng: 14 })
const pool = buildPlace({ id: 7, name: 'Pool', lat: 50, lng: 15 })
const stored: AssignmentsMap = {
  1: [
    buildAssignment({ id: 11, day_id: 1, place: castle, order_index: 1 }),
    buildAssignment({ id: 12, day_id: 1, place: lake, order_index: 0 }),
    buildAssignment({ id: 13, day_id: 1, place: note, order_index: 2 }),
  ],
  2: [
    buildAssignment({ id: 21, day_id: 2, place: castle, order_index: 0 }),
    buildAssignment({ id: 22, day_id: 2, place: pump, order_index: 1 }),
    buildAssignment({ id: 23, day_id: 2, place: harbour, order_index: 2 }),
  ],
}
const plan: AssignmentsMap = { 1: stored[1], 2: [stored[2][0], stored[2][2]] }

function baseOptions(over: Partial<Options> = {}): Options {
  return {
    tripId: 42, trip, can, toast, t,
    isMobile: false, activeTab: 'plan', enabledAddons: { roadtrip: true }, roadtripMode: true, roadtripSettings: {},
    days, storedAssignments: stored, assignments: plan, tripAccommodations: [], reservations: [],
    places: [lake, castle], visibleConnections: [], routeProfile: 'driving', mapPlaces: [], expandedDayIds: null,
    ...over,
  }
}

function renderFeed(over: Partial<Options> = {}) {
  return renderHook((props: Options) => useRoadtripFeed(props), { initialProps: baseOptions(over) })
}

const boundary = (day: number, from: number): RoadtripDayBoundary => (
  { day_number: day, from_assignment_id: from, to_assignment_id: null, fraction: 0.5 }
)

beforeEach(() => {
  vi.clearAllMocks()
  resetAllStores()
  allowed = true
  rt.prefs = { ready: true, failed: false }
  rt.boundaries.boundaries = []
  rt.boundaries.editable = false
  rt.boundaries.stale = false
  rt.vias.byDay = {}
  rt.routes.days = []
  rt.routes.lines = []
  rt.routes.lineDays = []
  rt.routes.boundaryPath = undefined
})

describe('useRoadtripFeed', () => {
  it('FE-TP-FEED-001: with the addon off nothing is fed, and the empty lists keep their identity', () => {
    const { result, rerender } = renderFeed({ enabledAddons: { roadtrip: false } })

    expect(result.current.roadtripActive).toBe(false)
    expect(result.current.roadtripFeedActive).toBe(false)
    expect(rt.prefsArgs).toEqual([42, false])
    expect(rt.viasArgs).toEqual([42, false])
    expect(rt.boundaryArgs[1]).toBe(false)
    const [tripId, routedDays, routedAssignments, profile, , , , routedReservations] = rt.routesArgs
    expect(tripId).toBe(42)
    expect(routedDays).toEqual([])
    // Off, the plan's own list goes in, and with no days it routes nothing anyway.
    expect(routedAssignments).toBe(plan)
    expect(profile).toBe('driving')
    expect(routedReservations).toEqual([])

    rerender(baseOptions({ enabledAddons: { roadtrip: false }, days: [...days], reservations: [buildReservation()] }))
    expect(rt.routesArgs[1]).toBe(routedDays)
    expect(rt.routesArgs[7]).toBe(routedReservations)
  })

  it('FE-TP-FEED-002: on the desk the mode feeds the whole trip, from the stored lists', () => {
    const reservations = [buildReservation({ id: 5 })]
    const accommodations = [{ id: 8 }] as Options['tripAccommodations']
    const { result } = renderFeed({
      reservations, tripAccommodations: accommodations,
      roadtripSettings: { roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' },
    })

    expect(result.current.roadtripActive).toBe(true)
    expect(result.current.roadtripFeedActive).toBe(true)
    expect(result.current.dailyTimesActive).toBe(true)
    expect(rt.prefsArgs).toEqual([42, true])
    expect(rt.viasArgs).toEqual([42, true])
    expect(rt.boundaryArgs).toEqual([42, true, plan])
    expect(rt.routesArgs[1]).toBe(days)
    expect(rt.routesArgs[2]).toBe(stored)
    expect(rt.routesArgs[4]).toBe(rt.vias.byDay)
    expect(rt.routesArgs[5]).toBe(rt.boundaries.boundaries)
    expect(rt.routesArgs[6]).toBe(accommodations)
    expect(rt.routesArgs[7]).toBe(reservations)
    expect(rt.corridorArgs).toEqual([rt.routes, 42, undefined])
    expect(rt.followArgs).toEqual([42, [lake, castle], rt.routes, rt.vias])
    expect(result.current.roadtripRoutes).toBe(rt.routes)
    expect(result.current.roadtripVias).toBe(rt.vias)
    expect(result.current.roadtripCorridor).toBe(rt.corridor)
    expect(result.current.followTrack).toBe(rt.follow)
    expect(result.current.refuel).toBe(rt.refuel)
  })

  it('FE-TP-FEED-003: the days wait for the driving preferences before they are routed', () => {
    rt.prefs = { ready: false, failed: false }
    const { result } = renderFeed()

    expect(result.current.roadtripFeedActive).toBe(true)
    expect(rt.routesArgs[1]).toEqual([])
    expect(rt.routesArgs[1]).not.toBe(days)
    expect(result.current.roadtripPreferencesState).toBe(rt.prefs)
  })

  it('FE-TP-FEED-004: the phone feeds the drive once its tab was opened and keeps it fed after', () => {
    const phone = { isMobile: true, roadtripMode: false }
    const { result, rerender } = renderFeed({ ...phone, activeTab: 'plan' })
    expect(result.current.roadtripFeedActive).toBe(false)
    expect(rt.corridorArgs[2]).toBe(PHONE_CORRIDOR_OPTIONS)

    rerender(baseOptions({ ...phone, activeTab: 'roadtrip' }))
    expect(result.current.roadtripFeedActive).toBe(true)
    expect(result.current.roadtripActive).toBe(false)
    expect(rt.routesArgs[2]).toBe(stored)

    rerender(baseOptions({ ...phone, activeTab: 'plan' }))
    expect(result.current.roadtripFeedActive).toBe(true)

    // At desk width the tab is never a way in: only the mode is.
    const desk = renderFeed({ roadtripMode: false, activeTab: 'roadtrip' })
    expect(desk.result.current.roadtripFeedActive).toBe(false)
  })

  it('FE-TP-FEED-005: preferences that fail to load and boundaries gone stale each say so', () => {
    rt.prefs = { ready: false, failed: true }
    rt.boundaries.stale = true
    renderFeed()

    expect(toast.error).toHaveBeenCalledWith('common.error')
    expect(toast.error).toHaveBeenCalledWith('trip.toast.loadError')
  })

  it('FE-TP-FEED-006: day boundaries are only loaded for a drive with a valid daily window', () => {
    const none = renderFeed()
    expect(none.result.current.dailyTimesActive).toBe(false)
    expect(rt.boundaryArgs[1]).toBe(false)

    const backwards = renderFeed({ roadtripSettings: { roadtrip_day_start: '18:00', roadtrip_day_end: '08:00' } })
    expect(backwards.result.current.dailyTimesActive).toBe(false)

    const unfed = renderFeed({
      enabledAddons: { roadtrip: false },
      roadtripSettings: { roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' },
    })
    expect(unfed.result.current.dailyTimesActive).toBe(true)
    expect(rt.boundaryArgs[1]).toBe(false)
  })

  it('FE-TP-FEED-007: the boundaries reset is offered only when there is something it may reset', () => {
    rt.boundaries.boundaries = [boundary(1, 11), boundary(2, 21)]
    expect(renderFeed().result.current.resetDayBoundaries).toBeUndefined()

    rt.boundaries.editable = true
    allowed = false
    expect(renderFeed().result.current.resetDayBoundaries).toBeUndefined()

    allowed = true
    rt.boundaries.boundaries = []
    expect(renderFeed().result.current.resetDayBoundaries).toBeUndefined()
  })

  it('FE-TP-FEED-008: the reset clears every boundary and reports a failure', async () => {
    rt.boundaries.editable = true
    rt.boundaries.boundaries = [boundary(1, 11), boundary(2, 21)]
    const { result } = renderFeed()

    await act(async () => { await result.current.resetDayBoundaries!() })
    expect(rt.boundaries.save).toHaveBeenNthCalledWith(1, 1, null)
    expect(rt.boundaries.save).toHaveBeenNthCalledWith(2, 2, null)
    expect(toast.error).not.toHaveBeenCalled()

    rt.boundaries.save.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.resetDayBoundaries!() })
    expect(toast.error).toHaveBeenLastCalledWith('offline')

    rt.boundaries.save.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.resetDayBoundaries!() })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-FEED-009: the drag controls need editable boundaries, the right and a path to drag along', () => {
    rt.boundaries.editable = true
    expect(renderFeed().result.current.dayBoundaryControls).toBeUndefined()

    rt.routes.boundaryPath = []
    expect(renderFeed().result.current.dayBoundaryControls).toBeUndefined()

    rt.routes.boundaryPath = [{ dayNumber: 1 }]
    allowed = false
    expect(renderFeed().result.current.dayBoundaryControls).toBeUndefined()

    rt.boundaries.editable = false
    allowed = true
    expect(renderFeed().result.current.dayBoundaryControls).toBeUndefined()

    rt.boundaries.editable = true
    const controls = renderFeed().result.current.dayBoundaryControls!
    expect(controls.path).toBe(rt.routes.boundaryPath)
    expect(controls.hint).toBe('roadtrip.window.dragHint')
  })

  it('FE-TP-FEED-010: a dragged boundary is checked before it is saved, and a removal never is', async () => {
    rt.boundaries.editable = true
    rt.boundaries.boundaries = [boundary(1, 11), boundary(2, 21)]
    rt.routes.boundaryPath = [{ dayNumber: 1 }]
    const controls = renderFeed().result.current.dayBoundaryControls!
    const moved = boundary(2, 22)

    rt.routes.validateBoundaries.mockReturnValueOnce('tooMany')
    await expect(controls.move(2, moved)).resolves.toBe(false)
    expect(rt.routes.validateBoundaries).toHaveBeenLastCalledWith([rt.boundaries.boundaries[0], moved])
    expect(toast.error).toHaveBeenLastCalledWith(`roadtrip.window.tooMany ${JSON.stringify({ days: MAX_TRIP_DAYS })}`)
    expect(rt.boundaries.save).not.toHaveBeenCalled()

    rt.routes.validateBoundaries.mockReturnValueOnce('tooMany')
    await expect(controls.move(2, null)).resolves.toBe(true)
    expect(rt.routes.validateBoundaries).toHaveBeenLastCalledWith([rt.boundaries.boundaries[0]])
    expect(rt.boundaries.save).toHaveBeenLastCalledWith(2, null)

    rt.boundaries.save.mockResolvedValueOnce(false)
    await expect(controls.move(2, moved)).resolves.toBe(false)
    expect(rt.boundaries.save).toHaveBeenLastCalledWith(2, moved)

    rt.boundaries.save.mockRejectedValueOnce(new Error('conflict'))
    await expect(controls.move(2, moved)).resolves.toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('conflict')

    rt.boundaries.save.mockRejectedValueOnce(42)
    await expect(controls.move(2, moved)).resolves.toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-FEED-011: the rides the drive is seamed by join the connections drawn, and the via counts follow the days', () => {
    rt.vias.byDay = {
      1: [{ id: 7, day_id: 1, after_order_index: 0, sequence: 0, lat: 50, lng: 10.2 }],
      2: [],
    }
    const visibleConnections = [3]
    const plain = renderFeed({ visibleConnections })
    expect(plain.result.current.roadtripConnections).toBe(visibleConnections)
    expect(plain.result.current.roadtripViaCounts).toEqual({ 1: 1, 2: 0 })

    rt.routes.days = [
      { dayId: 1, dayNumber: 1, stops: [{ placeId: 1, carrier: { type: 'flight', reservationId: 11, role: 'departure' } }] },
      { dayId: 2, dayNumber: 2, stops: [{ placeId: 2, carrier: { type: 'flight', reservationId: 3, role: 'arrival' } }, { placeId: 5 }] },
    ]
    expect(renderFeed({ visibleConnections }).result.current.roadtripConnections).toEqual([3, 11])
  })

  it('FE-TP-FEED-012: the via helpers count stops on the stored list and measure along the drawn road', () => {
    rt.routes.days = [{ dayId: 1, dayNumber: 1, stops: [], geometry: [[50, 10], [50, 11], [50, 12]] }]
    rt.vias.byDay = {
      1: [
        { id: 7, day_id: 1, after_order_index: 0, sequence: 0, lat: 50, lng: 10.2 },
        { id: 8, day_id: 1, after_order_index: 0, sequence: 1, lat: 50, lng: 10.9 },
        { id: 9, day_id: 1, after_order_index: 1, sequence: 0, lat: 50, lng: 11.5 },
      ],
    }
    const { result } = renderFeed()
    const feed = result.current

    // Sorted by order_index, the row without coordinates left out.
    expect(feed.roadtripStopsOf(1).map(a => a.id)).toEqual([12, 11])
    expect(feed.roadtripStopsOf(99)).toEqual([])

    const beforeHalfway = feed.viaLiesBefore(1, { lat: 50, lng: 10.5 })
    expect(beforeHalfway({ lat: 50, lng: 10.2 })).toBe(true)
    expect(beforeHalfway({ lat: 50, lng: 10.9 })).toBe(false)
    // A day with no road drawn keeps every via where it was.
    expect(feed.viaLiesBefore(2, { lat: 50, lng: 10.5 })({ lat: 50, lng: 30 })).toBe(true)

    // Appending moves nothing, a place without coordinates is not a stop, and a row at
    // the end of the list is an append however many unroutable rows sit in front of it.
    expect(feed.viasAfterInsert(1, undefined, { lat: 50, lng: 10.5 })).toBeNull()
    expect(feed.viasAfterInsert(1, 1, { lat: null, lng: null })).toBeNull()
    expect(feed.viasAfterInsert(1, 1, undefined)).toBeNull()
    expect(feed.viasAfterInsert(1, 3, { lat: 50, lng: 10.5 })).toBeNull()
    expect(feed.viasAfterInsert(1, 1, { lat: 50, lng: 10.5 })).toEqual({
      vias: [{ id: 8, after_order_index: 1 }, { id: 9, after_order_index: 2 }],
      remove: [],
    })
  })

  it('FE-TP-FEED-013: folding a day takes its line, its colours and its stops off the map', () => {
    rt.routes.days = [
      { dayId: 1, dayNumber: 1, stops: [{ placeId: 1 }, { placeId: 2 }] },
      {
        dayId: 2, dayNumber: 2,
        stops: [{ placeId: 2 }, { placeId: 5 }, { placeId: 4, automaticNight: true }, { placeId: 6, bookend: true }],
      },
    ]
    rt.routes.lines = ['day 1 out', 'day 1 back', 'day 2']
    rt.routes.lineDays = [1, 1, 2]
    const mapPlaces = [lake, castle, pump, harbour, hotel, pool]
    const { result, rerender } = renderFeed({ mapPlaces })
    const ids = () => result.current.roadtripMapPlaces.map(p => p.id)

    expect(result.current.collapsedRoadtripDays.size).toBe(0)
    expect(result.current.roadtripMapLines).toBe(rt.routes.lines)
    expect(result.current.roadtripLineColors).toBeUndefined()
    // Planned on a day, or the hotel a day's drive ends at; the pool and the hidden pump stay off.
    expect(ids()).toEqual([1, 2, 5, 6])

    act(() => { result.current.toggleRoadtripDay(1) })
    expect(result.current.collapsedRoadtripDays.has(1)).toBe(true)
    expect(result.current.roadtripMapLines).toEqual(['day 2'])
    // The castle is drawn on day 2 as well, so only the lake goes.
    expect(ids()).toEqual([2, 5, 6])

    rerender(baseOptions({ mapPlaces, roadtripSettings: { roadtrip_day_colors: true } }))
    expect(result.current.roadtripLineColors).toEqual([dayColor(2)])

    act(() => { result.current.toggleRoadtripDay(1) })
    expect(result.current.collapsedRoadtripDays.size).toBe(0)
    expect(result.current.roadtripLineColors).toEqual([dayColor(1), dayColor(1), dayColor(2)])
    expect(ids()).toEqual([1, 2, 5, 6])
  })

  it('FE-TP-FEED-014: the recorded trail hides the folded dates, and keeps one set while they stay the same', () => {
    const { result, rerender } = renderFeed()
    expect(result.current.dawarichHiddenDates).toBeNull()

    act(() => { result.current.toggleRoadtripDay(1) })
    const hidden = result.current.dawarichHiddenDates
    expect([...hidden!]).toEqual(['2026-06-01'])

    rerender(baseOptions({ days: [...days] }))
    expect(result.current.dawarichHiddenDates).toBe(hidden)

    // Out of road trip mode the rail's folds no longer count; the day plan's do.
    rerender(baseOptions({ roadtripMode: false }))
    expect(result.current.dawarichHiddenDates).toBeNull()
    rerender(baseOptions({ roadtripMode: false, expandedDayIds: new Set([1]) }))
    expect([...result.current.dawarichHiddenDates!]).toEqual(['2026-06-02'])
  })

  it('FE-TP-FEED-015: a driving limit is saved for the traveller only when it may be', async () => {
    const update = vi.mocked(roadtripPreferencesRepo.update)
    const { result, rerender } = renderFeed()

    // Nobody signed in: nothing to file the preference under.
    await act(async () => { await result.current.saveRoadtripLimit('roadtrip_max_drive_minutes', 300) })
    expect(update).not.toHaveBeenCalled()

    useAuthStore.setState({ user: buildUser({ id: 9 }) })
    allowed = false
    rerender(baseOptions())
    await act(async () => { await result.current.saveRoadtripLimit('roadtrip_max_drive_minutes', 300) })
    expect(update).not.toHaveBeenCalled()

    allowed = true
    rt.prefs = { ready: false, failed: false }
    rerender(baseOptions())
    await act(async () => { await result.current.saveRoadtripLimit('roadtrip_max_drive_minutes', 300) })
    expect(update).not.toHaveBeenCalled()

    rt.prefs = { ready: true, failed: false }
    rerender(baseOptions())
    await act(async () => { await result.current.saveRoadtripLimit('roadtrip_max_drive_minutes', 300) })
    expect(update).toHaveBeenCalledWith(42, { roadtrip_max_drive_minutes: 300 })
    expect(useRoadtripPreferencesStore.getState().byTrip['9:42']).toEqual({ roadtrip_max_drive_minutes: 300 })

    update.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.saveRoadtripLimit('roadtrip_max_drive_minutes', 240) })
    expect(toast.error).toHaveBeenLastCalledWith('places.saveError')
  })
})
