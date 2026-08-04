// FE-COMP-POIEXPLORE-001 to FE-COMP-POIEXPLORE-018
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import { mapsApi } from '../../api/client'
import { usePoiExplore, type Bbox } from './usePoiExplore'
import type { Poi } from './poiCategories'

type PoiResponse = Awaited<ReturnType<typeof mapsApi.pois>>

const BBOX: Bbox = { south: 48.1, west: 16.3, north: 48.3, east: 16.4 }

function poi(over: Partial<Poi> = {}): Poi {
  return {
    osm_id: 'node/1',
    name: 'Café Central',
    lat: 48.21,
    lng: 16.36,
    category: 'cafe',
    poi_type: 'cafe',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    cuisine: null,
    source: 'openstreetmap',
    ...over,
  }
}

function response(pois: Poi[]): PoiResponse {
  return { pois, source: 'openstreetmap', truncated: false }
}

// Hand-controlled promise so a test can hold a request "in flight" and decide
// exactly when — and in which order — it settles.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider>{children}</TranslationProvider>
)

function setup() {
  return renderHook(() => usePoiExplore(), { wrapper })
}

const spyOnPois = () => vi.spyOn(mapsApi, 'pois')
let pois: ReturnType<typeof spyOnPois>

beforeEach(() => {
  pois = spyOnPois().mockResolvedValue(response([poi()]))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePoiExplore', () => {
  it('FE-COMP-POIEXPLORE-001: starts with nothing selected, loaded or failed', () => {
    const { result } = setup()
    expect(result.current.active.size).toBe(0)
    expect(result.current.pois).toEqual([])
    expect(result.current.loadingKeys.size).toBe(0)
    expect(result.current.errorKeys.size).toBe(0)
    expect(result.current.moved).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-002: panning with nothing active does not offer "search this area"', () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    expect(result.current.moved).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-003: toggling before the map reported a viewport selects but does not fetch', () => {
    const { result } = setup()
    act(() => { result.current.toggle('cafe') })
    expect(result.current.active.has('cafe')).toBe(true)
    expect(pois).not.toHaveBeenCalled()
  })

  it('FE-COMP-POIEXPLORE-004: toggling fetches the category for the current viewport', async () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })

    await waitFor(() => expect(result.current.pois).toHaveLength(1))
    expect(pois).toHaveBeenCalledWith('cafe', BBOX, 'en-US', expect.any(AbortSignal))
    expect(result.current.pois[0].osm_id).toBe('node/1')
  })

  it('FE-COMP-POIEXPLORE-005: the spinner is on while the request is in flight and off when it lands', async () => {
    const d = deferred<PoiResponse>()
    pois.mockReturnValue(d.promise)
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })

    expect(result.current.loadingKeys.has('cafe')).toBe(true)

    await act(async () => { d.resolve(response([poi()])) })
    await waitFor(() => expect(result.current.loadingKeys.has('cafe')).toBe(false))
  })

  it('FE-COMP-POIEXPLORE-006: toggling the active category turns it off and drops its markers', async () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.pois).toHaveLength(1))

    act(() => { result.current.toggle('cafe') })
    expect(result.current.active.size).toBe(0)
    expect(result.current.pois).toEqual([])
    expect(pois).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-POIEXPLORE-007: the pill is single-select — a second category replaces the first', async () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.pois).toHaveLength(1))

    pois.mockResolvedValue(response([poi({ osm_id: 'node/2', category: 'bar', name: 'Loos Bar' })]))
    act(() => { result.current.toggle('bar') })
    // The previous category's markers vanish immediately, before the new results land.
    expect(result.current.active).toEqual(new Set(['bar']))
    expect(result.current.pois).toEqual([])

    await waitFor(() => expect(result.current.pois).toHaveLength(1))
    expect(result.current.pois[0].osm_id).toBe('node/2')
  })

  it('FE-COMP-POIEXPLORE-008: panning with a category active marks the results stale', async () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.pois).toHaveLength(1))
    expect(result.current.moved).toBe(false)

    act(() => { result.current.onViewportChange({ ...BBOX, south: 48.0 }) })
    expect(result.current.moved).toBe(true)
  })

  it('FE-COMP-POIEXPLORE-009: searchArea refetches the active category for the new viewport', async () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.pois).toHaveLength(1))

    const moved: Bbox = { south: 40, west: 10, north: 41, east: 11 }
    act(() => { result.current.onViewportChange(moved) })
    act(() => { result.current.searchArea() })

    expect(result.current.moved).toBe(false)
    await waitFor(() => expect(pois).toHaveBeenCalledTimes(2))
    expect(pois).toHaveBeenLastCalledWith('cafe', moved, 'en-US', expect.any(AbortSignal))
  })

  it('FE-COMP-POIEXPLORE-010: searchArea without a viewport is a no-op', () => {
    const { result } = setup()
    act(() => { result.current.searchArea() })
    expect(pois).not.toHaveBeenCalled()
    expect(result.current.moved).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-011: searchArea with nothing active fetches nothing', () => {
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.searchArea() })
    expect(pois).not.toHaveBeenCalled()
  })

  it('FE-COMP-POIEXPLORE-012: a failed fetch surfaces a retryable error instead of a silent empty', async () => {
    pois.mockRejectedValue(new Error('all Overpass mirrors down'))
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })

    await waitFor(() => expect(result.current.errorKeys.has('cafe')).toBe(true))
    expect(result.current.pois).toEqual([])
    expect(result.current.loadingKeys.has('cafe')).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-013: a retry that succeeds clears the error flag', async () => {
    pois.mockRejectedValueOnce(new Error('timeout'))
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.errorKeys.has('cafe')).toBe(true))

    act(() => { result.current.searchArea() })
    await waitFor(() => expect(result.current.pois).toHaveLength(1))
    expect(result.current.errorKeys.has('cafe')).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-014: switching category clears a previous error flag', async () => {
    pois.mockRejectedValueOnce(new Error('timeout'))
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    await waitFor(() => expect(result.current.errorKeys.has('cafe')).toBe(true))

    act(() => { result.current.toggle('bar') })
    expect(result.current.errorKeys.size).toBe(0)
    await waitFor(() => expect(result.current.pois).toHaveLength(1))
  })

  it('FE-COMP-POIEXPLORE-015: results that land after the category was switched off are dropped', async () => {
    const d = deferred<PoiResponse>()
    pois.mockReturnValue(d.promise)
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    act(() => { result.current.toggle('cafe') })
    expect(result.current.active.size).toBe(0)

    await act(async () => { d.resolve(response([poi()])) })
    expect(result.current.pois).toEqual([])
  })

  it('FE-COMP-POIEXPLORE-016: a superseded request is not reported as a failure', async () => {
    const first = deferred<PoiResponse>()
    pois.mockReturnValueOnce(first.promise)
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })

    pois.mockResolvedValue(response([poi({ osm_id: 'node/9', category: 'bar' })]))
    act(() => { result.current.toggle('bar') })

    // The abandoned cafe request rejects with axios' cancellation error.
    await act(async () => { first.reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })) })

    await waitFor(() => expect(result.current.pois).toHaveLength(1))
    expect(result.current.errorKeys.size).toBe(0)
    expect(result.current.pois[0].osm_id).toBe('node/9')
  })

  it('FE-COMP-POIEXPLORE-017: the abandoned category stops loading when the selection moves on', async () => {
    const first = deferred<PoiResponse>()
    pois.mockReturnValueOnce(first.promise)
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    expect(result.current.loadingKeys.has('cafe')).toBe(true)

    pois.mockResolvedValue(response([poi({ osm_id: 'node/9', category: 'bar' })]))
    act(() => { result.current.toggle('bar') })

    await act(async () => { first.reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })) })

    await waitFor(() => expect(result.current.loadingKeys.has('cafe')).toBe(false))
    expect(result.current.loadingKeys.has('bar')).toBe(false)
  })

  it('FE-COMP-POIEXPLORE-018: turning the category off stops its spinner as well', async () => {
    const d = deferred<PoiResponse>()
    pois.mockReturnValue(d.promise)
    const { result } = setup()
    act(() => { result.current.onViewportChange(BBOX) })
    act(() => { result.current.toggle('cafe') })
    act(() => { result.current.toggle('cafe') })

    await act(async () => { d.reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })) })

    await waitFor(() => expect(result.current.loadingKeys.size).toBe(0))
  })
})
