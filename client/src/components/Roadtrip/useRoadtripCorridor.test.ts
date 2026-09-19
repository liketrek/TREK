import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CorridorPoi, CorridorSearch } from './useCorridorPois'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'

const { useCorridorPois, stored } = vi.hoisted(() => ({
  useCorridorPois: vi.fn(),
  // The stored road trip preferences, read through the same selector the app uses so
  // `useVehicleRange` does its own folding of the four vehicle states.
  stored: { settings: {} as { roadtrip_vehicle?: string } },
}))
vi.mock('./useCorridorPois', () => ({ useCorridorPois }))
vi.mock('../../hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (settings: typeof stored.settings) => unknown) => select(stored.settings),
}))

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
      { assignmentId: 1, ownerDayId: 1, ownerIndex: 0, placeId: 10, name: 'A', lat: 53.5, lng: 9.9, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
      { assignmentId: 2, ownerDayId: 1, ownerIndex: 1, placeId: 20, name: 'B', lat: 52.5, lng: 13.4, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null },
    ],
    legs: [], legVias: [], driveWarnings: [], dayWarning: null, schedule: { entries: [], warnings: [] },
    geometry: [[53.5, 9.9], [53.0, 11.0], [52.5, 13.4]],
    distance: 0, duration: 0,
    ...over,
  }
}

const routes = (days: RoadtripDay[]): RoadtripRoutes => ({
  days, lines: [], lineDays: [], lineJoins: [], segments: [], accessLines: [], vias: [], totalDistance: 0, totalDuration: 0, totalStops: 0, quietDays: [], loading: false,
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
  stored.settings = {}
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

  it('FE-ROADTRIP-CORRIDORSTATE-020: narrowing to one point keeps only what is near it', () => {
    // A seven-hundred-kilometre day turns up hits along the whole of it. Picking the point
    // you mean to break at is a subtraction, because both figures are measured against
    // the same thinned line rather than being asked for separately.
    useCorridorPois.mockReturnValue(searchWith([
      poi({ osm_id: 'near', name: 'Near', alongKm: 30 }),
      poi({ osm_id: 'far', name: 'Far', alongKm: 600 }),
    ]))
    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))

    act(() => { result.current.setSectionKm(50) })
    act(() => { result.current.setSection({ dayId: 1, kind: 'stop', index: 0 }) })

    // Stop 0 sits at the start of the drive, so only the hit within 50 km survives.
    expect(result.current.visible.map(p => p.osm_id)).toEqual(['near'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-030: clearing drops the hits and every narrowing set on them', () => {
    // Nothing could do this before: a search that turned up the wrong thing kept its
    // list and its pins, and the way out was switching to the day plan and back.
    const state = searchWith([poi({ osm_id: 'a', name: 'Aral' })])
    useCorridorPois.mockReturnValue(state)
    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))

    act(() => {
      result.current.setNameFilter('aral')
      result.current.setSection({ dayId: 1, kind: 'stop', index: 0 })
      result.current.setSocketFilter('ccs')
      result.current.setMinKw(150)
    })
    act(() => { result.current.clear() })

    expect(state.clear).toHaveBeenCalledTimes(1)
    expect(result.current.nameFilter).toBe('')
    expect(result.current.section).toBeNull()
    expect(result.current.socketFilter).toBe('')
    expect(result.current.minKw).toBe(0)
    // The question stays: clearing the categories too would make asking the same thing
    // again a handful of clicks.
    expect(result.current.categories).toEqual(['fuel'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-031: an electric car looks for chargers instead of pumps', () => {
    useCorridorPois.mockReturnValue(searchWith([]))
    stored.settings = { roadtrip_vehicle: 'electric' }

    const { result } = renderHook(() => useRoadtripCorridor(routes([day()]), 42))

    expect(result.current.categories).toEqual(['charging'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-032: every other vehicle state keeps the fuel it always had', () => {
    // Four states are stored: electric, combustion, an empty string written by the
    // dialog, and no answer at all. `useVehicleRange` folds the last two into null, and
    // moving the unset case would change the panel for every traveller who never opened
    // the driving settings.
    useCorridorPois.mockReturnValue(searchWith([]))
    for (const roadtrip_vehicle of ['combustion', '', undefined]) {
      stored.settings = roadtrip_vehicle === undefined ? {} : { roadtrip_vehicle }
      const { result, unmount } = renderHook(() => useRoadtripCorridor(routes([day()]), 42))
      expect(result.current.categories).toEqual(['fuel'])
      unmount()
    }
  })

  it('FE-ROADTRIP-CORRIDORSTATE-033: a kind the traveller picked is never overruled by the preference', () => {
    // The preference is loaded per trip and lands a moment after the panel does. A
    // category somebody switched off coming back by itself makes the picker unusable.
    useCorridorPois.mockReturnValue(searchWith([]))
    const { result, rerender } = renderHook(() => useRoadtripCorridor(routes([day()]), 42))

    act(() => { result.current.toggleCategory('rest_area') })
    stored.settings = { roadtrip_vehicle: 'electric' }
    rerender()

    expect(result.current.categories).toEqual(['fuel', 'rest_area'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-034: a preference arriving over a search does not empty it', () => {
    // `useCorridorPois` drops its results whenever the categories change, so a late
    // preference must not reach either a run in flight or a list already answered.
    useCorridorPois.mockReturnValue({ ...searchWith([]), loading: true })
    const running = renderHook(() => useRoadtripCorridor(routes([day()]), 42))
    stored.settings = { roadtrip_vehicle: 'electric' }
    running.rerender()
    expect(running.result.current.categories).toEqual(['fuel'])
    running.unmount()

    stored.settings = {}
    useCorridorPois.mockReturnValue(searchWith([poi({ osm_id: 'a', name: 'Aral' })]))
    const answered = renderHook(() => useRoadtripCorridor(routes([day()]), 42))
    stored.settings = { roadtrip_vehicle: 'electric' }
    answered.rerender()
    expect(answered.result.current.categories).toEqual(['fuel'])
  })

  it('FE-ROADTRIP-CORRIDORSTATE-021: an anchor belonging to another day narrows nothing', () => {
    // The section names a day as well as an index, so switching days cannot silently
    // apply yesterday's break to today's drive.
    const hits = [poi({ osm_id: 'a', name: 'A', alongKm: 10 }), poi({ osm_id: 'b', name: 'B', alongKm: 600 })]
    useCorridorPois.mockReturnValue(searchWith(hits))
    const { result } = renderHook(() => useRoadtripCorridor(routes([day()])))

    act(() => { result.current.setSection({ dayId: 99, kind: 'stop', index: 0 }) })

    expect(result.current.visible).toBe(hits)
  })

  describe('a card that opens with the drive from the day before', () => {
    /**
     * Three stops, so "before the first" and "after the first" are different answers:
     * with two, every hit lands between them whatever the rule is. The line starts where
     * the previous day ended, 250-odd km before this card's first stop.
     */
    const stopAt = (index: number, lat: number, lng: number) => ({
      assignmentId: 10 + index, ownerDayId: 2, ownerIndex: index, placeId: 100 + index, name: `S${index}`,
      lat, lng, time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    })
    const spine = [
      { lat: 53.5, lng: 9.9 }, { lat: 53.0, lng: 11.0 }, { lat: 52.5, lng: 13.4 }, { lat: 52.0, lng: 14.5 }, { lat: 51.5, lng: 15.0 },
    ]
    const arriving = (over: Partial<RoadtripDay>) => day({
      dayId: 2,
      dayNumber: 2,
      stops: [stopAt(0, 52.5, 13.4), stopAt(1, 52.0, 14.5), stopAt(2, 51.5, 15.0)],
      geometry: spine.map(p => [p.lat, p.lng] as [number, number]),
      ...over,
    })
    const beforeFirstStop = poi({ osm_id: 'early', name: 'Rasthof', alongKm: 60 })
    const pastFirstStop = poi({ osm_id: 'late', name: 'Autohof', alongKm: 300 })

    beforeEach(() => {
      useCorridorPois.mockReturnValue({ ...searchWith([beforeFirstStop, pastFirstStop]), spine })
    })

    it('FE-ROADTRIP-CORRIDORSTATE-035: a hit on the drive from the connected day before goes in ahead of the first stop', () => {
      // Filed after the first stop, the day drove to that stop, turned back to the hit
      // and then came the same way again.
      const previousLast = { ...stopAt(4, 53.5, 9.9), ownerDayId: 1 }
      const { result } = renderHook(() => useRoadtripCorridor(routes([arriving({ arrivingFrom: previousLast })])))

      expect(result.current.insertIndexFor(beforeFirstStop)).toBe(0)
      expect(result.current.insertIndexFor(pastFirstStop)).toBe(1)
    })

    it('FE-ROADTRIP-CORRIDORSTATE-036: the same holds for the drive a night carried over', () => {
      const previousLast = { ...stopAt(4, 53.5, 9.9), ownerDayId: 1 }
      const spill = { at: 0, count: 1, fromDayNumber: 1, departure: null, leg: undefined, line: [], fromStop: previousLast }
      const { result } = renderHook(() => useRoadtripCorridor(routes([arriving({ spills: [spill] })])))

      expect(result.current.insertIndexFor(beforeFirstStop)).toBe(0)
    })

    it('FE-ROADTRIP-CORRIDORSTATE-037: a day nothing arrives on keeps its first stop first', () => {
      // Its line starts at that stop, so a hit measured ahead of it is a projection
      // wobble, and a new first stop would move where the whole day sets off from.
      const { result } = renderHook(() => useRoadtripCorridor(routes([arriving({})])))

      expect(result.current.insertIndexFor(beforeFirstStop)).toBe(1)
    })
  })
})
