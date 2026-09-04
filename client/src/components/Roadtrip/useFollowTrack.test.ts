import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'
import type { RoadtripVias } from './useRoadtripVias'
import type { TrackPlace } from './useFollowTrack'

const { calculateRouteWithLegs } = vi.hoisted(() => ({ calculateRouteWithLegs: vi.fn() }))
vi.mock('../Map/RouteCalculator', () => ({ calculateRouteWithLegs }))

import { useFollowTrack } from './useFollowTrack'

/**
 * The hook is the part that talks to two services and has to survive both of them going
 * wrong halfway. The refinement itself is `followTrack`'s business and tested there; what
 * matters here is what reaches the day and what reaches the traveller.
 */

const START = { lat: 52, lng: 13 }
const END = { lat: 52, lng: 14 }

/** A track arching north away from the straight line between the day's two stops. */
function arc(points = 60, bulgeDeg = 0.1): [number, number][] {
  return Array.from({ length: points + 1 }, (_, i) => [
    52 + bulgeDeg * Math.sin((Math.PI * i) / points),
    13 + i / points,
  ])
}

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 7, dayNumber: 1, date: null, title: null,
    stops: [
      { assignmentId: 1, placeId: 10, name: 'A', lat: START.lat, lng: START.lng, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
      { assignmentId: 2, placeId: 20, name: 'B', lat: END.lat, lng: END.lng, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
    ],
    legs: [], legVias: [], driveWarnings: [], dayWarning: null, schedule: { entries: [], warnings: [] },
    geometry: [[START.lat, START.lng], [END.lat, END.lng]],
    distance: 0, duration: 0,
    ...over,
  }
}

const routes = (days: RoadtripDay[]): RoadtripRoutes => ({
  days, lines: [], segments: [], accessLines: [], vias: [], totalDistance: 0, totalDuration: 0, totalStops: 0, quietDays: [], loading: false,
})

function viasStub(over: Partial<RoadtripVias> = {}): RoadtripVias {
  return {
    byDay: {},
    trackByDay: {},
    add: vi.fn(),
    addMany: vi.fn().mockResolvedValue(undefined),
    move: vi.fn(),
    remove: vi.fn(),
    reanchor: vi.fn(),
    ...over,
  }
}

const TRACK: TrackPlace = { id: 3, name: 'Atlantic Road', route_geometry: JSON.stringify(arc()), route_color: '#0ea5e9' }
const PLAIN: TrackPlace = { id: 4, name: 'A hotel', route_geometry: null }
const FAR: TrackPlace = { id: 5, name: 'Somewhere else', route_geometry: JSON.stringify(arc().map(([la, ln]) => [la + 4, ln])) }

/**
 * A router with no idea about roads: it drives straight from waypoint to waypoint.
 *
 * Which is exactly what makes the refinement work for its living — each via added bends
 * the answer a little closer to the arc, so the loop converges instead of running to its
 * cap the way a fixed answer would.
 */
function answersStraight(): void {
  calculateRouteWithLegs.mockImplementation(async (waypoints: { lat: number; lng: number }[]) => ({
    coordinates: waypoints.map(w => [w.lat, w.lng]),
    distance: 0, duration: 0, legs: [],
  }))
}

beforeEach(() => {
  calculateRouteWithLegs.mockReset()
})

describe('useFollowTrack', () => {
  it('FE-FOLLOWHOOK-001: nothing is parsed while the dialog is closed', () => {
    const { result } = renderHook(() => useFollowTrack(1, [TRACK, PLAIN], routes([day()]), viasStub()))
    expect(result.current.dayId).toBeNull()
    // Tens of thousands of points per track, for a dialog nobody opened.
    expect(result.current.tracks).toEqual([])
    // But it still knows there is something to open, without parsing a single point.
    expect(result.current.available).toBe(true)
  })

  it('FE-FOLLOWHOOK-011: the track a day follows is read back from the day, not remembered', () => {
    // The whole point of storing it: a field that only ever held what this session did
    // would look right until somebody refreshed the page.
    const vias = viasStub({ trackByDay: { 7: { day_id: 7, place_id: 3, stray_km: 0.8 } } });
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))

    expect(result.current.namesByDay).toEqual({ 7: 'Atlantic Road' })
    act(() => { result.current.open(7) })
    expect(result.current.current).toEqual({ name: 'Atlantic Road', strayKm: 0.8 })
  })

  it('FE-FOLLOWHOOK-012: a stored track whose place is gone names nothing', () => {
    // The row cascades with the place, so this is belt and braces — but a label that
    // outlived its line would be a day claiming to follow something invisible.
    const vias = viasStub({ trackByDay: { 7: { day_id: 7, place_id: 999, stray_km: null } } })
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    expect(result.current.current).toBeNull()
  })

  it('FE-FOLLOWHOOK-010: a trip that imported nothing offers no way in', () => {
    const { result } = renderHook(() => useFollowTrack(1, [PLAIN], routes([day()]), viasStub()))
    expect(result.current.available).toBe(false)
  })

  it('FE-FOLLOWHOOK-002: opening lists only the places that carry a line, nearest first', () => {
    const { result } = renderHook(() => useFollowTrack(1, [FAR, PLAIN, TRACK], routes([day()]), viasStub()))
    act(() => { result.current.open(7) })

    expect(result.current.tracks.map(t => t.id)).toEqual([3, 5])
    expect(result.current.tracks[0].name).toBe('Atlantic Road')
    expect(result.current.tracks[0].color).toBe('#0ea5e9')
    expect(result.current.tracks[0].lengthKm).toBeGreaterThan(60)
    expect(result.current.tracks[0].gapKm).toBeLessThan(result.current.tracks[1].gapKm)
  })

  it('FE-FOLLOWHOOK-003: applying writes the plan onto the day, legs and all', async () => {
    answersStraight()
    const vias = viasStub()
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    await act(async () => { await result.current.apply(3) })

    expect(vias.addMany).toHaveBeenCalledTimes(1)
    const [dayId, written, legs, track] = (vias.addMany as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(dayId).toBe(7)
    expect(legs).toEqual([0])
    // The chain and the name it came from land in one write: a day claiming to follow a
    // road whose vias never arrived would be worse than a day claiming nothing.
    expect(track).toMatchObject({ place_id: 3 })
    expect(written.length).toBeGreaterThan(0)
    // Every via hangs behind the first stop, because the day has exactly one leg.
    expect(written.every((v: { after_order_index: number }) => v.after_order_index === 0)).toBe(true)
    expect(result.current.outcome?.vias).toBe(written.length)
    expect(result.current.busy).toBe(false)
  })

  it('FE-FOLLOWHOOK-004: a track the drive already follows writes nothing but says so', async () => {
    // The router answers with the track itself, so there is nothing left to pull onto.
    calculateRouteWithLegs.mockResolvedValue({ coordinates: arc(), distance: 0, duration: 0, legs: [] })
    const vias = viasStub()
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    await act(async () => { await result.current.apply(3) })

    expect(result.current.outcome).toEqual({ vias: 0, strayKm: 0, capped: false })
    // Still a write: the legs are cleared so a second track does not stack, and the name
    // is recorded even though the drive needed no bending to follow it.
    expect(vias.addMany).toHaveBeenCalledWith(7, [], [0], { place_id: 3, stray_km: 0 })
  })

  it('FE-FOLLOWHOOK-005: a routing outage is reported rather than written as an empty plan', async () => {
    calculateRouteWithLegs.mockRejectedValue(new Error('429'))
    const vias = viasStub()
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    await act(async () => { await result.current.apply(3) })

    expect(result.current.error).toBe('route')
    expect(result.current.busy).toBe(false)
    expect(vias.addMany).not.toHaveBeenCalled()
    // One retry, because a refinement is several calls against a rate-limited host.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
  }, 10000)

  it('FE-FOLLOWHOOK-006: a save that fails says so instead of claiming the day changed', async () => {
    answersStraight()
    const vias = viasStub({ addMany: vi.fn().mockRejectedValue(new Error('boom')) })
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    await act(async () => { await result.current.apply(3) })

    expect(result.current.error).toBe('save')
    expect(result.current.outcome).toBeNull()
    expect(result.current.busy).toBe(false)
  }, 10000)

  it('FE-FOLLOWHOOK-007: clearing drops the vias of every leg of the day', async () => {
    const vias = viasStub({ byDay: { 7: [{ id: 1 }, { id: 2 }] as never } })
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })
    expect(result.current.viaCount).toBe(2)

    await act(async () => { await result.current.clear() })
    // null, not nothing: dropping the points is also dropping the claim.
    expect(vias.addMany).toHaveBeenCalledWith(7, [], [0], null)
    expect(result.current.outcome).toEqual({ vias: 0, strayKm: 0, capped: false })
  })

  it('FE-FOLLOWHOOK-008: closing abandons a run rather than letting it land afterwards', async () => {
    let release: ((value: unknown) => void) | null = null
    calculateRouteWithLegs.mockImplementation(() => new Promise(resolve => { release = resolve }))
    const vias = viasStub()
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([day()]), vias))
    act(() => { result.current.open(7) })

    let running: Promise<void> | null = null
    act(() => { running = result.current.apply(3) })
    await waitFor(() => { expect(result.current.busy).toBe(true) })

    act(() => { result.current.close() })
    await act(async () => {
      release?.({ coordinates: [[START.lat, START.lng], [END.lat, END.lng]], distance: 0, duration: 0, legs: [] })
      await running
    })

    // The day is left exactly as it was: an abandoned plan is not half a chain of vias.
    expect(vias.addMany).not.toHaveBeenCalled()
    expect(result.current.dayId).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('FE-FOLLOWHOOK-009: a day with nothing to drive between is not applied to', async () => {
    answersStraight()
    const vias = viasStub()
    const lonely = day({ stops: [day().stops[0]] })
    const { result } = renderHook(() => useFollowTrack(1, [TRACK], routes([lonely]), vias))
    act(() => { result.current.open(7) })
    await act(async () => { await result.current.apply(3) })

    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
    expect(vias.addMany).not.toHaveBeenCalled()
  })
})
