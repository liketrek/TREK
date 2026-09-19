import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { useMRtCorridor } from '../../../../src/mobile/screens/trip/roadtrip/useMRtCorridor'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { RoadtripCorridor } from '../../../../src/components/Roadtrip/useRoadtripCorridor'
import type { Day } from '../../../../src/types'
import type { RoadtripDay, RoadtripRoutes } from '@trek/shared/roadtrip'

// FE-MOB-RTCOR-001 to FE-MOB-RTCOR-012

const mocks = vi.hoisted(() => ({ offline: false }))
vi.mock('../../../../src/hooks/useNetworkMode', () => ({
  useNetworkMode: () => ({ offline: mocks.offline, forced: false, setForced: vi.fn() }),
}))

const DAYS = [
  { id: 1, trip_id: 7, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 7, day_number: 2, date: '2026-05-02', title: null },
] as unknown as Day[]

/** Four stops with clocks on them, so "which one is next" has an answer. */
function stage(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 2,
    dayNumber: 2,
    date: '2026-05-02',
    stops: [
      { assignmentId: 501, ownerDayId: 2, ownerIndex: 0, placeId: 101, name: 'Start', lat: 53.55, lng: 9.99, time: null, dwellMinutes: 0, legMode: null, incomingLegMode: null, stopType: null },
      { assignmentId: 502, ownerDayId: 2, ownerIndex: 1, placeId: 102, name: 'Middle', lat: 53.5, lng: 9.8, time: null, dwellMinutes: 0, legMode: null, incomingLegMode: null, stopType: null },
      { assignmentId: 503, ownerDayId: 2, ownerIndex: 2, placeId: 103, name: 'End', lat: 53.45, lng: 9.6, time: null, dwellMinutes: 0, legMode: null, incomingLegMode: null, stopType: null },
    ],
    legs: [],
    schedule: {
      entries: [
        { arrival: '08:00', departure: '08:00', anchored: true, dayOffset: 0 },
        { arrival: '10:00', departure: '10:00', anchored: false, dayOffset: 0 },
        { arrival: '12:00', departure: null, anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    },
    legVias: [], geometry: [], distance: 300_000, duration: 14_400,
    driveWarnings: [], dayWarning: null, spills: [], dryPoints: [],
    ...over,
  } as unknown as RoadtripDay
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [stage()],
    quietDays: [], lines: [], lineDays: [], accessLines: [], vias: [], segments: [],
    totalDistance: 300_000, totalDuration: 14_400, totalStops: 3, loading: false,
    ...over,
  } as unknown as RoadtripRoutes
}

function corridor(over: Partial<RoadtripCorridor> = {}): RoadtripCorridor {
  const base = buildPlanner().roadtripCorridor as RoadtripCorridor
  return {
    ...base,
    // Two points is what `canSearch` reads as "there is a drive here".
    search: { ...base.search, spine: [{ lat: 53.55, lng: 9.99 }, { lat: 53.45, lng: 9.6 }] },
    stopsAlongKm: [0, 40, 95],
    ...over,
  }
}

function planner(over: Partial<TripPlanner> = {}): TripPlanner {
  return buildPlanner({
    tripId: 7,
    days: DAYS,
    selectedDayId: 2,
    roadtripRoutes: routes(),
    roadtripCorridor: corridor(),
    ...over,
  } as Partial<TripPlanner>)
}

function setup(p: TripPlanner = planner(), shell: MTripShellApi = buildShell()) {
  const { result, rerender } = renderHook(() => useMRtCorridor(p, shell))
  return { result, rerender, planner: p, shell }
}

/** Freezes the clock on the stage's own date, whatever zone the runner is in. */
function freezeAt(hour: number, minute: number): TripPlanner {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 4, 2, hour, minute))
  const date = new Date().toISOString().slice(0, 10)
  return planner({
    days: DAYS.map(d => (d.id === 2 ? { ...d, date } : d)) as unknown as Day[],
    roadtripRoutes: routes({ days: [stage({ date })] }),
  })
}

beforeEach(() => { mocks.offline = false })
afterEach(() => { vi.useRealTimers() })

describe('useMRtCorridor', () => {
  it('FE-MOB-RTCOR-001: searches the stage the chip rail is on', () => {
    const p = planner()
    setup(p)

    expect(p.roadtripCorridor.setDayId).toHaveBeenCalledWith('2')
  })

  it('FE-MOB-RTCOR-002: a trip with nothing routed names no day at all', () => {
    const p = planner({ roadtripRoutes: routes({ days: [] }) })
    setup(p)

    // Not '' and not the first day of the trip: there is no drive to search, and
    // writing a day id anyway would make the desktop picker jump on the next render.
    expect(p.roadtripCorridor.setDayId).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTCOR-003: asks about the stretch ahead, measured from the stop already passed', () => {
    // 11:00 on the stage's own date: the 12:00 stop is next, so the 10:00 one is behind
    // and the road still to drive starts at its 40 km.
    const p = freezeAt(11, 0)
    const { result } = setup(p)

    expect(result.current.anchored).toBe(true)
    act(() => { result.current.run() })
    expect(p.roadtripCorridor.search.search).toHaveBeenCalledWith({ fromKm: 40, toKm: 90 })
  })

  it('FE-MOB-RTCOR-004: on any other day it starts at the beginning of the stage', () => {
    // No clock reading to go on. A guess dressed up as a position would put the search
    // in the wrong half of the drive, so it asks about the first fifty kilometres.
    const p = planner()
    const { result } = setup(p)

    expect(result.current.anchored).toBe(false)
    act(() => { result.current.run() })
    expect(p.roadtripCorridor.search.search).toHaveBeenCalledWith({ fromKm: 0, toKm: 50 })
  })

  it('FE-MOB-RTCOR-005: before the first stop is behind, ahead is the whole stage from zero', () => {
    const p = freezeAt(7, 30)
    const { result } = setup(p)

    expect(result.current.anchored).toBe(false)
    act(() => { result.current.run() })
    expect(p.roadtripCorridor.search.search).toHaveBeenCalledWith({ fromKm: 0, toKm: 50 })
  })

  it('FE-MOB-RTCOR-006: a stage search asks about the whole day, with no window at all', () => {
    const p = freezeAt(11, 0)
    const { result } = setup(p, buildShell({ rtReach: 'stage' }))

    act(() => { result.current.run() })
    expect(p.roadtripCorridor.search.search).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-RTCOR-007: changing the reach throws the answer away', () => {
    const p = planner()
    const shell = buildShell()
    const { result } = setup(p, shell)

    act(() => { result.current.setReach('stage') })

    expect(shell.setRtReach).toHaveBeenCalledWith('stage')
    // Hits from the fifty kilometres ahead are not an answer to "the whole stage".
    expect(p.roadtripCorridor.clear).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTCOR-008: picking the reach it is already on changes nothing', () => {
    const p = planner()
    const shell = buildShell()
    const { result } = setup(p, shell)

    act(() => { result.current.setReach('ahead') })

    expect(shell.setRtReach).not.toHaveBeenCalled()
    expect(p.roadtripCorridor.clear).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTCOR-009: offline it cannot search, and pressing it anyway does nothing', () => {
    mocks.offline = true
    const p = planner()
    const { result } = setup(p)

    expect(result.current.offline).toBe(true)
    expect(result.current.canSearch).toBe(false)
    act(() => { result.current.run() })
    expect(p.roadtripCorridor.search.search).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTCOR-010: without a category or a routed line there is nothing to ask', () => {
    const noCategory = setup(planner({ roadtripCorridor: corridor({ categories: [] }) }))
    expect(noCategory.result.current.canSearch).toBe(false)

    const base = buildPlanner().roadtripCorridor as RoadtripCorridor
    const noLine = setup(planner({ roadtripCorridor: corridor({ search: { ...base.search, spine: [] } }) }))
    expect(noLine.result.current.canSearch).toBe(false)
  })

  it('FE-MOB-RTCOR-011: what the map draws is what the sheet lists', () => {
    const visible = [{ osm_id: 'a' }] as unknown as RoadtripCorridor['visible']
    const { result } = setup(planner({ roadtripCorridor: corridor({ visible }) }))

    // One array, not two filtered views of one list: the pins and the rows have to be
    // the same set or a row points at a pin that is not there.
    expect(result.current.hits).toBe(visible)
  })

  it('FE-MOB-RTCOR-012: "answered" needs a search to have run, not just an empty list', () => {
    const base = buildPlanner().roadtripCorridor as RoadtripCorridor
    const idle = setup(planner())
    expect(idle.result.current.answered).toBe(false)

    const ran = setup(planner({
      roadtripCorridor: corridor({ search: { ...base.search, progress: { done: 3, total: 3 } } }),
    }))
    // Nothing found is an answer. Reading it as "nothing asked yet" would hide the one
    // sentence that says so.
    expect(ran.result.current.answered).toBe(true)
  })
})
