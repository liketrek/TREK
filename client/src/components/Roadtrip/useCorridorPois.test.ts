import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LatLng } from './corridor'

const { pois } = vi.hoisted(() => ({ pois: vi.fn() }))
vi.mock('../../api/client', () => ({ mapsApi: { pois } }))
vi.mock('../../i18n', () => ({ useTranslation: () => ({ locale: 'en-US' }) }))

import { useCorridorPois } from './useCorridorPois'

/** A short drive west out of Hamburg — enough route to tile, few enough boxes to be quick. */
const LINE: LatLng[] = [
  { lat: 53.55, lng: 9.99 },
  { lat: 53.5, lng: 9.8 },
  { lat: 53.45, lng: 9.6 },
]

const hit = (id: string, lat: number, lng: number, category = 'fuel') => ({
  osm_id: id,
  name: id,
  lat,
  lng,
  category,
  poi_type: 'amenity=fuel',
  address: null,
  website: null,
  phone: null,
  opening_hours: null,
  cuisine: null,
  source: 'openstreetmap',
})

const answer = (...items: ReturnType<typeof hit>[]) => ({ pois: items, source: 'openstreetmap', truncated: false, clamped: false })

beforeEach(() => {
  pois.mockReset()
  pois.mockResolvedValue(answer())
})

describe('useCorridorPois', () => {
  it('FE-ROADTRIP-CORRIDOR-001: asks each box once for every category together', async () => {
    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel', 'charging', 'rest_area'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(pois).toHaveBeenCalled()
    // The whole point of the batching: the kinds ride along in one query per box.
    for (const call of pois.mock.calls) expect(call[0]).toBe('fuel,charging,rest_area')
    expect(result.current.progress.total).toBe(pois.mock.calls.length)
  })

  it('FE-ROADTRIP-CORRIDOR-002: keeps what is near the route and drops what is not', async () => {
    // One beside the line, one far north of it.
    pois.mockResolvedValue(answer(hit('near', 53.5, 9.81), hit('far', 54.6, 9.8)))

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 5))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results.map(r => r.osm_id)).toEqual(['near'])
    expect(result.current.results[0].offRouteKm).toBeLessThan(5)
    expect(result.current.results[0].alongKm).toBeGreaterThan(0)
  })

  it('FE-ROADTRIP-CORRIDOR-003: orders hits by how far along the drive they are', async () => {
    pois.mockResolvedValue(answer(
      hit('late', 53.45, 9.61),
      hit('early', 53.55, 9.98),
      hit('middle', 53.5, 9.8),
    ))

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 8))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results.map(r => r.osm_id)).toEqual(['early', 'middle', 'late'])
  })

  it('FE-ROADTRIP-CORRIDOR-004: the same place found in two overlapping boxes is listed once', async () => {
    pois.mockResolvedValue(answer(hit('shared', 53.5, 9.81)))

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results.filter(r => r.osm_id === 'shared')).toHaveLength(1)
  })

  it('FE-ROADTRIP-CORRIDOR-005: a box that times out is asked again before it counts as unsearched', async () => {
    let first = true
    pois.mockImplementation(async () => {
      if (first) { first = false; throw new Error('502') }
      return answer(hit('found', 53.5, 9.81))
    })

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.failedAreas).toBe(0)
    expect(result.current.error).toBe(false)
    expect(result.current.results.length).toBeGreaterThan(0)
  })

  it('FE-ROADTRIP-CORRIDOR-006: a box that fails twice is reported rather than silently skipped', async () => {
    pois.mockRejectedValue(new Error('502'))

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.failedAreas).toBeGreaterThan(0)
    // Nothing answered at all, so this is an outage and not a partial result.
    expect(result.current.error).toBe(true)
  })

  it('FE-ROADTRIP-CORRIDOR-007: a drive longer than the request budget says the tail went unsearched', async () => {
    const long: LatLng[] = Array.from({ length: 40 }, (_, i) => ({ lat: 53.5 - i * 0.25, lng: 9.9 + i * 0.35 }))

    const { result } = renderHook(() => useCorridorPois(long, ['fuel'], 5))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.capped).toBe(true)
    expect(result.current.progress.total).toBeLessThanOrEqual(16)
  })

  it('FE-ROADTRIP-CORRIDOR-008: changing what is wanted drops the answers to the old question', async () => {
    pois.mockResolvedValue(answer(hit('a', 53.5, 9.81)))

    const { result, rerender } = renderHook(
      ({ categories }: { categories: string[] }) => useCorridorPois(LINE, categories, 10),
      { initialProps: { categories: ['fuel'] } },
    )
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.results.length).toBeGreaterThan(0))

    rerender({ categories: ['campsite'] })
    await waitFor(() => expect(result.current.results).toEqual([]))
    expect(result.current.progress).toEqual({ done: 0, total: 0 })
  })

  it('FE-ROADTRIP-CORRIDOR-009: a route too short to search asks for nothing', async () => {
    const { result } = renderHook(() => useCorridorPois([LINE[0]], ['fuel'], 10))
    act(() => { result.current.search() })
    await act(async () => {})

    expect(pois).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('FE-ROADTRIP-CORRIDOR-010: with nothing selected there is nothing to look for', async () => {
    const { result } = renderHook(() => useCorridorPois(LINE, [], 10))
    act(() => { result.current.search() })
    await act(async () => {})

    expect(pois).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-CORRIDOR-011: clearing stops the run and empties the list', async () => {
    pois.mockResolvedValue(answer(hit('a', 53.5, 9.81)))

    const { result } = renderHook(() => useCorridorPois(LINE, ['fuel'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(result.current.results.length).toBeGreaterThan(0))

    act(() => { result.current.clear() })
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.failedAreas).toBe(0)
  })

  it('FE-ROADTRIP-CORRIDOR-012: leaving the view aborts the boxes still in flight', async () => {
    let seen: AbortSignal | undefined
    pois.mockImplementation((_c: string, _b: unknown, _l: string, signal: AbortSignal) => {
      seen = signal
      return new Promise(() => {})
    })

    const { result, unmount } = renderHook(() => useCorridorPois(LINE, ['fuel'], 10))
    act(() => { result.current.search() })
    await waitFor(() => expect(seen).toBeDefined())

    unmount()
    expect(seen!.aborted).toBe(true)
  })
})
