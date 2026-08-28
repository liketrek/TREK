import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LatLng } from './corridor'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'

const { useCorridorPois } = vi.hoisted(() => ({ useCorridorPois: vi.fn() }))
vi.mock('./useCorridorPois', () => ({ useCorridorPois }))

import { useRoadtripCorridor, CORRIDOR_CATEGORY_KEYS, CORRIDOR_WIDTHS_KM } from './useRoadtripCorridor'

const stop = (id: number, lat: number, lng: number): RoadtripStop => ({
  assignmentId: id,
  placeId: id * 10,
  name: `Stop ${id}`,
  lat,
  lng,
  time: null,
  dwellMinutes: null,
  legMode: null,
  incomingLegMode: null,
})

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 1,
    dayNumber: 1,
    date: null,
    title: null,
    stops: [stop(1, 53.55, 9.99), stop(2, 52.52, 13.4)],
    legs: [],
    schedule: { entries: [], warnings: [] },
    geometry: [],
    distance: 0,
    duration: 0,
    ...over,
  }
}

const routes = (days: RoadtripDay[]): RoadtripRoutes => ({
  days,
  lines: [],
  segments: [],
  totalDistance: 0,
  totalDuration: 0,
  totalStops: 0,
  loading: false,
})

/** What the corridor hook was handed on the last render. */
const lastCall = (): { line: LatLng[]; categories: string[]; widthKm: number } => {
  const calls = useCorridorPois.mock.calls
  const call = calls[calls.length - 1]
  return { line: call[0], categories: call[1], widthKm: call[2] }
}

beforeEach(() => {
  useCorridorPois.mockReset()
  useCorridorPois.mockReturnValue({
    results: [], progress: { done: 0, total: 0 }, loading: false,
    capped: false, failedAreas: 0, error: false, search: vi.fn(), clear: vi.fn(),
  })
})

describe('useRoadtripCorridor', () => {
  it('FE-ROADTRIP-CORRIDORSTATE-001: searches along the roads driven, not the line between stops', () => {
    // The motorway swings north of the straight line; searching the straight line finds
    // open country, which is the bug this replaced.
    const geometry: [number, number][] = [[53.55, 9.99], [53.6, 11.2], [52.52, 13.4]]
    renderHook(() => useRoadtripCorridor(routes([day({ geometry })])))

    expect(lastCall().line).toEqual([
      { lat: 53.55, lng: 9.99 },
      { lat: 53.6, lng: 11.2 },
      { lat: 52.52, lng: 13.4 },
    ])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-002: falls back to the stops until the day has routed', () => {
    renderHook(() => useRoadtripCorridor(routes([day({ geometry: [] })])))

    expect(lastCall().line).toEqual([
      { lat: 53.55, lng: 9.99 },
      { lat: 52.52, lng: 13.4 },
    ])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-003: opens on the first day with a drive, before anything is picked', () => {
    const { result } = renderHook(() => useRoadtripCorridor(routes([day({ dayId: 4 }), day({ dayId: 5 })])))

    expect(result.current.dayId).toBe('4')
    expect(result.current.day?.dayId).toBe(4)
  })

  it('FE-ROADTRIP-CORRIDORSTATE-004: picking a day switches which drive is searched', () => {
    const second = day({ dayId: 5, geometry: [[48.1, 11.5], [47.8, 12.1]] })
    const { result } = renderHook(() => useRoadtripCorridor(routes([day({ dayId: 4 }), second])))

    act(() => { result.current.setDayId('5') })

    expect(result.current.day?.dayId).toBe(5)
    expect(lastCall().line).toEqual([{ lat: 48.1, lng: 11.5 }, { lat: 47.8, lng: 12.1 }])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-005: follows along when the chosen day disappears', () => {
    const { result, rerender } = renderHook(
      ({ days }: { days: RoadtripDay[] }) => useRoadtripCorridor(routes(days)),
      { initialProps: { days: [day({ dayId: 4 }), day({ dayId: 5 })] } },
    )
    act(() => { result.current.setDayId('5') })
    expect(result.current.day?.dayId).toBe(5)

    rerender({ days: [day({ dayId: 4 })] })
    expect(result.current.dayId).toBe('4')
  })

  it('FE-ROADTRIP-CORRIDORSTATE-006: toggling a kind adds it and toggling again removes it', () => {
    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))
    expect(result.current.categories).toEqual(['fuel'])

    act(() => { result.current.toggleCategory('campsite') })
    expect(result.current.categories).toEqual(['fuel', 'campsite'])

    act(() => { result.current.toggleCategory('fuel') })
    expect(result.current.categories).toEqual(['campsite'])
    expect(lastCall().categories).toEqual(['campsite'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-007: the width is handed straight to the search', () => {
    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))
    expect(lastCall().widthKm).toBe(5)

    act(() => { result.current.setWidthKm(10) })
    expect(lastCall().widthKm).toBe(10)
  })

  it('FE-ROADTRIP-CORRIDORSTATE-008: a trip with no drive has nothing to search along', () => {
    const { result } = renderHook(() => useRoadtripCorridor(routes([])))

    expect(result.current.day).toBeUndefined()
    expect(result.current.dayId).toBe('')
    expect(lastCall().line).toEqual([])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-009: the offered kinds and widths are the ones the panel draws', () => {
    expect(CORRIDOR_CATEGORY_KEYS).toEqual(['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights'])
    expect(CORRIDOR_WIDTHS_KM).toEqual([2, 5, 10])
  })
})
