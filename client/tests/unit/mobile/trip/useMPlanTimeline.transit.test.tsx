import { describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { act, renderHook, waitFor } from '../../../helpers/render'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { buildAssignment, buildDay, buildPlace, buildReservation, buildTrip } from '../../../helpers/factories'
import { useMPlanTimeline } from '../../../../src/mobile/screens/trip/plan/useMPlanTimeline'
import { tourRepo } from '../../../../src/repo/tourRepo'
import type { RouteSegment } from '../../../../src/types'

// FE-MOB-PLTL-HOOK-001 to FE-MOB-PLTL-HOOK-004: public transit for one leg (#2398), between two city walks (CW-08)

vi.mock('../../../../src/repo/tourRepo', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/repo/tourRepo')>()
  return { ...actual, tourRepo: { ...actual.tourRepo, detail: vi.fn() } }
})

vi.mock('../../../../src/hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({ routeSegments: [] }),
}))

vi.mock('../../../../src/api/client', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/api/client')>()
  return { ...actual, weatherApi: { ...actual.weatherApi, get: vi.fn(() => new Promise(() => {})) } }
})

const DAY = buildDay({ id: 5, trip_id: 1, day_number: 1, date: '2026-05-02' })
const assignments = {
  '5': [
    buildAssignment({ id: 11, day_id: 5, order_index: 0, place: buildPlace({ id: 1, name: 'Museum', place_time: '09:30', lat: 35.71, lng: 139.79 }) }),
    buildAssignment({ id: 12, day_id: 5, order_index: 1, place: buildPlace({ id: 2, name: 'Ueno Park', lat: 35.72, lng: 139.77 }) }),
  ],
}
const SEG = { from: [35.71, 139.79], to: [35.72, 139.77] } as unknown as RouteSegment

function planner(trip = buildTrip({ id: 1, start_date: '2026-05-01', end_date: '2026-05-05' })) {
  return buildPlanner({ trip, days: [DAY], selectedDayId: DAY.id, assignments } as never)
}

describe('useMPlanTimeline, public transit for one leg', () => {
  it('FE-MOB-PLTL-HOOK-001: seeds the automated search with the leg and opens it for the day', () => {
    const p = planner()
    const { result } = renderHook(() => useMPlanTimeline(p))

    const leg = result.current.transitLegFor(SEG)
    expect(leg).toEqual({
      from: { name: 'Museum', lat: 35.71, lng: 139.79 },
      to: { name: 'Ueno Park', lat: 35.72, lng: 139.77 },
      time: '09:30',
    })

    act(() => result.current.planTransitLeg(leg!, 11))

    expect(p.setTransportModalDayId).toHaveBeenCalledWith(5)
    expect(p.setEditingTransport).toHaveBeenCalledWith(null)
    expect(p.setTransitPrefill).toHaveBeenCalledWith(leg)
    expect(p.setTransportModalAutomated).toHaveBeenCalledWith(true)
    expect(p.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PLTL-HOOK-002: offers nothing on a trip without dates, like the desktop and the day sheet', () => {
    const p = planner(buildTrip({ id: 1, start_date: null, end_date: null }))
    const { result } = renderHook(() => useMPlanTimeline(p))

    expect(result.current.transitLegFor(SEG)).toBeNull()
  })
})

describe('useMPlanTimeline, public transit between two city walks (CW-08)', () => {
  const oldTown = buildPlace({ id: 51, name: 'Old town', lat: 52.52, lng: 13.4, route_geometry: '[[52.52,13.4],[52.51,13.42]]' })
  const harbour = buildPlace({ id: 52, name: 'Harbour', lat: 52.5, lng: 13.45, route_geometry: '[[52.5,13.45],[52.49,13.46]]' })
  const walk = (place: { id: number; name: string }) => ({
    place_id: place.id, name: place.name, tour_type: 'walk', duration: 90, planned_duration_minutes: null,
    station_count: 2, station_stay_minutes: 45, station_stays_unknown: 0,
  }) as TourListItem
  const walks = {
    '5': [
      buildAssignment({ id: 21, day_id: 5, order_index: 0, tour_place_id: 51, place: { ...oldTown, place_time: '10:00' } }),
      buildAssignment({ id: 22, day_id: 5, order_index: 1, tour_place_id: 52, place: { ...harbour, place_time: '13:00' } }),
    ],
  }
  const walkPlanner = (reservations = [] as ReturnType<typeof buildReservation>[]) => buildPlanner({
    trip: buildTrip({ id: 1, start_date: '2026-05-01', end_date: '2026-05-05' }), days: [DAY], selectedDayId: DAY.id,
    assignments: walks, reservations, places: [oldTown, harbour], toursEnabled: true, tours: [walk(oldTown), walk(harbour)],
  } as never)

  it('FE-MOB-PLTL-HOOK-003: opens the search from the last stop to the first, when the first walk ends', async () => {
    vi.mocked(tourRepo.detail).mockImplementation((_tripId, placeId) => Promise.resolve({
      waypoints: [{ lat: 0, lng: 0, role: 'via', sequence: 0, key: `${placeId}`, name: placeId === 51 ? 'Old bridge' : 'Fish market' }],
    } as never))
    const p = walkPlanner()
    const { result } = renderHook(() => useMPlanTimeline(p))

    const leg = result.current.transitLegFor({ from: [52.51, 13.42], to: [52.5, 13.45] } as unknown as RouteSegment)
    if (!leg) throw new Error('no leg between the walks')
    act(() => result.current.planTransitLeg(leg, 21))

    await waitFor(() => expect(p.setTransitPrefill).toHaveBeenCalledWith({
      from: { name: 'Old bridge', lat: 52.51, lng: 13.42 },
      to: { name: 'Fish market', lat: 52.5, lng: 13.45 },
      time: '12:15',
      walk: { dayId: 5, fromWalk: 'Old town', toWalk: 'Harbour', ends: '12:15', endsNextDay: false, endsAtLeast: false, nextStarts: '13:00' },
    }))
    expect(p.setTransportModalDayId).toHaveBeenCalledWith(5)
    expect(p.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PLTL-HOOK-004: says a saved journey arrives after the next walk starts', () => {
    const journey = buildReservation({
      id: 300, type: 'transit', title: 'Old bridge → Fish market', day_id: 5,
      reservation_time: '2026-05-02T12:20', reservation_end_time: '2026-05-02T13:10',
    })
    const { result } = renderHook(() => useMPlanTimeline(walkPlanner([journey])))

    const item = result.current.merged.find(it => it.type === 'transport')
    if (!item) throw new Error('no journey on the day')
    expect(result.current.journeyLate(item)).toEqual({ walk: 'Harbour', time: '13:00' })
  })

  it('FE-MOB-PLTL-HOOK-005: says a walk whose end runs past the next walk start, the desktop rule (TIME-02)', () => {
    const late = buildPlanner({
      ...walkPlanner(),
      tours: [{ ...walk(oldTown), planned_duration_minutes: 240 }, walk(harbour)],
    } as never)
    const { result } = renderHook(() => useMPlanTimeline(late))

    const [first, second] = result.current.merged
    expect(result.current.tourOverrun(first)).toEqual({ name: 'Harbour', time: '13:00', end: '14:00' })
    expect(result.current.tourOverrun(second)).toBeNull()
    // In time, nothing is said.
    const { result: inTime } = renderHook(() => useMPlanTimeline(walkPlanner()))
    expect(inTime.current.tourOverrun(inTime.current.merged[0])).toBeNull()
  })
})
