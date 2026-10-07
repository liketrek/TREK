import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'

const mocks = vi.hoisted(() => {
  const listeners = new Set<(event: Record<string, unknown>) => void>()
  const toursApi = { list: vi.fn() }
  const handleRemoteEvent = vi.fn()
  const loadFiles = vi.fn()
  const useTripStore = Object.assign(vi.fn(() => ({ loadFiles })), {
    getState: () => ({ handleRemoteEvent }),
  })
  return {
    listeners,
    toursApi,
    handleRemoteEvent,
    loadFiles,
    useTripStore,
    joinTrip: vi.fn(),
    leaveTrip: vi.fn(),
    addListener: vi.fn((listener: (event: Record<string, unknown>) => void) => listeners.add(listener)),
    removeListener: vi.fn((listener: (event: Record<string, unknown>) => void) => listeners.delete(listener)),
  }
})

vi.mock('../api/client', () => ({ toursApi: mocks.toursApi }))
vi.mock('../api/websocket', () => ({
  joinTrip: mocks.joinTrip,
  leaveTrip: mocks.leaveTrip,
  addListener: mocks.addListener,
  removeListener: mocks.removeListener,
}))
vi.mock('../store/tripStore', () => ({ useTripStore: mocks.useTripStore }))

import { useTourPlaceIds } from './useTourPlaceIds'
import { useTripWebSocket } from './useTripWebSocket'

const baseTour: TourListItem = {
  place_id: 42,
  name: 'Ridge walk',
  tour_type: 'hike',
  distance: 4,
  elevation_gain: 100,
  elevation_loss: 80,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  tour_group_id: null,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

function emit(event: Record<string, unknown>): void {
  for (const listener of [...mocks.listeners]) listener(event)
}

function renderTrip(tripId: number, enabled = true) {
  return renderHook(() => {
    const tours = useTourPlaceIds(tripId, enabled)
    useTripWebSocket(tripId, tours.invalidateTourPlaceIds)
    return tours
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  mocks.listeners.clear()
  mocks.addListener.mockClear()
  mocks.removeListener.mockClear()
  mocks.joinTrip.mockClear()
  mocks.leaveTrip.mockClear()
  mocks.handleRemoteEvent.mockClear()
  mocks.loadFiles.mockClear()
  mocks.toursApi.list.mockReset().mockResolvedValue({ tours: [baseTour] })
})

describe('Tours websocket invalidation', () => {
  it('refreshes the active trip read model and Places exclusion after tours:changed', async () => {
    const nextTour = { ...baseTour, place_id: 84, name: 'Trip 7 new tour' }
    const refresh = deferred<{ tours: TourListItem[] }>()
    mocks.toursApi.list.mockResolvedValueOnce({ tours: [baseTour] }).mockReturnValueOnce(refresh.promise)
    const { result } = renderTrip(7)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    expect(result.current.tourPlaceIds).toEqual(new Set([42]))

    act(() => emit({ type: 'tours:changed', tripId: 7, placeIds: [84] }))

    expect(result.current.tourPlaceIds).toEqual(new Set([42, 84]))
    await act(async () => refresh.resolve({ tours: [nextTour] }))
    await waitFor(() => expect(result.current.tourPlaceIds).toEqual(new Set([84])))
    expect(result.current.tours).toEqual([nextTour])
    expect(mocks.toursApi.list).toHaveBeenCalledTimes(2)
  })

  it('ignores events for another trip and events without an explicit trip id', async () => {
    const { result } = renderTrip(7)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    act(() => {
      emit({ type: 'tours:changed', tripId: 8, placeIds: [84] })
      emit({ type: 'tours:changed', placeIds: [84] })
    })

    expect(mocks.toursApi.list).toHaveBeenCalledOnce()
    expect(result.current.tourPlaceIds).toEqual(new Set([42]))
  })

  it.each(['place:deleted', 'assignment:created', 'assignment:deleted', 'day:deleted'])(
    'refreshes the matching trip after %s changes Tours membership or planned status', async type => {
      const { result } = renderTrip(7)
      await waitFor(() => expect(result.current.tourDataReady).toBe(true))

      act(() => emit({ type, tripId: 7, placeId: 42 }))

      await waitFor(() => expect(mocks.toursApi.list).toHaveBeenCalledTimes(2))
    },
  )

  it.each(['place:deleted', 'assignment:created', 'assignment:deleted', 'day:deleted'])(
    'refreshes the matching trip after %s changes Tours membership or planned status', async type => {
      const { result } = renderTrip(7)
      await waitFor(() => expect(result.current.tourDataReady).toBe(true))

      act(() => emit({ type, tripId: 7 }))

      await waitFor(() => expect(mocks.toursApi.list).toHaveBeenCalledTimes(2))
    },
  )

  it('lets the latest rapid invalidation refresh win without leaking prior results', async () => {
    const first = deferred<{ tours: TourListItem[] }>()
    const second = deferred<{ tours: TourListItem[] }>()
    const newest = { ...baseTour, place_id: 99, name: 'Newest' }
    mocks.toursApi.list.mockResolvedValueOnce({ tours: [baseTour] })
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { result } = renderTrip(7)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    act(() => {
      emit({ type: 'tours:changed', tripId: 7, placeIds: [98] })
      emit({ type: 'tours:changed', tripId: 7, placeIds: [99] })
    })
    expect(result.current.tourPlaceIds).toEqual(new Set([42, 98, 99]))
    await act(async () => second.resolve({ tours: [newest] }))
    await waitFor(() => expect(result.current.tours).toEqual([newest]))
    await act(async () => first.resolve({ tours: [baseTour] }))

    expect(result.current.tours).toEqual([newest])
    expect(result.current.tourPlaceIds).toEqual(new Set([99]))
    expect(mocks.toursApi.list).toHaveBeenCalledTimes(3)
  })

  it('removes a pending Tour exclusion when its Place is deleted before refresh completes', async () => {
    const staleRefresh = deferred<{ tours: TourListItem[] }>()
    const deleteRefresh = deferred<{ tours: TourListItem[] }>()
    mocks.toursApi.list.mockResolvedValueOnce({ tours: [] })
      .mockReturnValueOnce(staleRefresh.promise)
      .mockReturnValueOnce(deleteRefresh.promise)
    const { result } = renderTrip(7)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    act(() => emit({ type: 'tours:changed', tripId: 7, placeIds: [84] }))
    expect(result.current.tourPlaceIds).toEqual(new Set([84]))
    act(() => emit({ type: 'place:deleted', tripId: 7, placeId: 84 }))
    expect(result.current.tourPlaceIds).toEqual(new Set())

    await act(async () => deleteRefresh.resolve({ tours: [] }))
    await act(async () => staleRefresh.resolve({ tours: [{ ...baseTour, place_id: 84 }] }))
    expect(result.current.tourPlaceIds).toEqual(new Set())
    expect(mocks.toursApi.list).toHaveBeenCalledTimes(3)
  })

  it('keeps same-trip last-good Tours and exposes error on refresh failure', async () => {
    const { result } = renderTrip(7)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    mocks.toursApi.list.mockRejectedValueOnce(new Error('refresh unavailable'))

    act(() => emit({ type: 'tours:changed', tripId: 7, placeIds: [84] }))

    await waitFor(() => expect(result.current.tourLoadError).toBe(true))
    expect(result.current.tours).toEqual([baseTour])
    expect(result.current.tourPlaceIds).toEqual(new Set([42, 84]))
  })

  it('leaves ordinary Place event handling intact and Tours-off refresh is a no-op', async () => {
    const { result } = renderTrip(7, false)
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    act(() => emit({ type: 'place:created', tripId: 7, place: { id: 93, name: 'Ordinary place' } }))
    act(() => emit({ type: 'tours:changed', tripId: 7 }))

    expect(mocks.handleRemoteEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'place:created', tripId: 7 }))
    expect(mocks.toursApi.list).not.toHaveBeenCalled()
    expect(result.current.tours).toEqual([])
    expect(result.current.tourPlaceIds.size).toBe(0)
  })
})