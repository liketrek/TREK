import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CorridorPoi, CorridorSearch } from './useCorridorPois'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'

const { useCorridorPois } = vi.hoisted(() => ({ useCorridorPois: vi.fn() }))
vi.mock('./useCorridorPois', () => ({ useCorridorPois }))

import { useRoadtripCorridor } from './useRoadtripCorridor'

function poi(over: Partial<CorridorPoi> & { osm_id: string; name: string }): CorridorPoi {
  return {
    lat: 53, lng: 10, category: 'fuel', poi_type: 'fuel', address: null, website: null,
    phone: null, opening_hours: null, cuisine: null, source: 'openstreetmap',
    offRouteKm: 1, alongKm: 10, brand: null, brand_wikidata: null,
    ...over,
  } as CorridorPoi
}

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 1, dayNumber: 1, date: null, title: null,
    stops: [
      { assignmentId: 1, placeId: 10, name: 'A', lat: 53.5, lng: 9.9, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
      { assignmentId: 2, placeId: 20, name: 'B', lat: 52.5, lng: 13.4, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
    ],
    legs: [], schedule: { entries: [], warnings: [] },
    geometry: [[53.5, 9.9], [53.0, 11.0], [52.5, 13.4]],
    distance: 0, duration: 0,
    ...over,
  }
}

const routes = (days: RoadtripDay[]): RoadtripRoutes => ({
  days, lines: [], segments: [], accessLines: [], totalDistance: 0, totalDuration: 0, totalStops: 0, quietDays: [], loading: false,
})

/** The search state the mocked hook hands back, results included. */
function searchWith(results: CorridorPoi[]): CorridorSearch {
  return {
    results,
    progress: { done: 0, total: 0 },
    loading: false,
    capped: false,
    failedAreas: 0,
    truncatedAreas: 0,
    error: false,
    // The thinned line the day's geometry becomes; hits and stops are measured along it.
    spine: [{ lat: 53.5, lng: 9.9 }, { lat: 53.0, lng: 11.0 }, { lat: 52.5, lng: 13.4 }],
    search: vi.fn(),
    clear: vi.fn(),
  }
}

beforeEach(() => {
  useCorridorPois.mockReset()
})

describe('useRoadtripCorridor', () => {
  it('FE-ROADTRIP-CORRIDORSTATE-001: with no filter everything found is visible', () => {
    const hits = [poi({ osm_id: 'a', name: 'Aral' }), poi({ osm_id: 'b', name: 'Shell' })]
    useCorridorPois.mockReturnValue(searchWith(hits))

    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))

    expect(result.current.visible).toBe(hits)
  })

  it('FE-ROADTRIP-CORRIDORSTATE-002: the filter matches part of a name, ignoring case', () => {
    useCorridorPois.mockReturnValue(searchWith([
      poi({ osm_id: 'a', name: 'Aral Autohof' }),
      poi({ osm_id: 'b', name: 'Shell Nord' }),
    ]))

    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))
    act(() => result.current.setNameFilter('shell'))

    expect(result.current.visible.map(p => p.osm_id)).toEqual(['b'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-003: the brand counts as a name, because the server folds the operator into it', () => {
    useCorridorPois.mockReturnValue(searchWith([
      poi({ osm_id: 'a', name: 'Autohof Nord', brand: 'Shell' }),
      poi({ osm_id: 'b', name: 'Raststätte Süd', brand: 'Aral' }),
    ]))

    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))
    act(() => result.current.setNameFilter('Shell'))

    expect(result.current.visible.map(p => p.osm_id)).toEqual(['a'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-004: whitespace alone is not a filter', () => {
    const hits = [poi({ osm_id: 'a', name: 'Aral' })]
    useCorridorPois.mockReturnValue(searchWith(hits))

    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))
    act(() => result.current.setNameFilter('   '))

    expect(result.current.visible).toBe(hits)
  })

  it('FE-ROADTRIP-CORRIDORSTATE-005: starting a new search clears the old question', () => {
    useCorridorPois.mockReturnValue(searchWith([poi({ osm_id: 'a', name: 'Aral' })]))

    const { result, rerender } = renderHook(() => useRoadtripCorridor(routes([day()])))
    act(() => result.current.setNameFilter('aral'))
    expect(result.current.nameFilter).toBe('aral')

    // A search begins: keeping the term would hide the new hits behind the old query.
    useCorridorPois.mockReturnValue({ ...searchWith([]), loading: true })
    rerender()

    expect(result.current.nameFilter).toBe('')
  })

  it('FE-ROADTRIP-CORRIDORSTATE-007: typing while the search is still running survives the next batch', () => {
    // Hits arrive box by box and publish as they land. Clearing on every batch instead of
    // on the start of a search wiped out whatever had been typed in the meantime.
    useCorridorPois.mockReturnValue({ ...searchWith([poi({ osm_id: 'a', name: 'Aral' })]), loading: true })

    const { result, rerender } = renderHook(() => useRoadtripCorridor(routes([day()])))
    act(() => result.current.setNameFilter('shell'))

    useCorridorPois.mockReturnValue({
      ...searchWith([poi({ osm_id: 'a', name: 'Aral' }), poi({ osm_id: 'b', name: 'Shell' })]),
      loading: true,
    })
    rerender()

    expect(result.current.nameFilter).toBe('shell')
    expect(result.current.visible.map(p => p.osm_id)).toEqual(['b'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-006: the visible list keeps its identity while nothing changes', () => {
    useCorridorPois.mockReturnValue(searchWith([poi({ osm_id: 'a', name: 'Aral' })]))

    const { result, rerender } = renderHook(() => useRoadtripCorridor(routes([day()])))
    const before = result.current.visible
    rerender()

    // Both map renderers rebuild every marker when this array's identity changes.
    expect(result.current.visible).toBe(before)
  })
})
