import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { tourRepo } from '../repo/tourRepo'
import { useTourPlaceIds } from './useTourPlaceIds'

vi.mock('../repo/tourRepo', () => ({
  tourRepo: { list: vi.fn() },
}))

const tour: TourListItem = {
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
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
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

function tourFor(placeId: number, name: string): TourListItem {
  return { ...tour, place_id: placeId, name }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(tourRepo.list).mockResolvedValue({ tours: [tour] })
})

describe('useTourPlaceIds', () => {
  it('loads one facet list for filtering and selected-tour lookup', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))

    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    expect(result.current.tours).toEqual([tour])
    expect(result.current.tourPlaceIds).toEqual(new Set([42]))
    expect(tourRepo.list).toHaveBeenCalledWith(7)
  })

  it('hands out the same Set and list until something changes, enabled or not', async () => {
    const { result, rerender } = renderHook(({ enabled }) => useTourPlaceIds(7, enabled), { initialProps: { enabled: true } })
    await waitFor(() => expect(result.current.tours).toEqual([tour]))
    const { tourPlaceIds, tours } = result.current

    rerender({ enabled: true })
    expect(result.current.tourPlaceIds).toBe(tourPlaceIds)
    expect(result.current.tours).toBe(tours)

    rerender({ enabled: false })
    const disabled = result.current.tourPlaceIds
    rerender({ enabled: false })
    expect(result.current.tourPlaceIds).toBe(disabled)
  })

  it('hides facet identity while disabled without fetching or deleting its cached data', async () => {
    const { result, rerender } = renderHook(({ enabled }) => useTourPlaceIds(7, enabled), { initialProps: { enabled: true } })
    await waitFor(() => expect(result.current.tours).toEqual([tour]))

    rerender({ enabled: false })
    expect(result.current.tourDataReady).toBe(true)
    expect(result.current.tours).toEqual([])
    expect(result.current.tourPlaceIds.size).toBe(0)
    expect(tourRepo.list).toHaveBeenCalledTimes(1)
  })

  it('inserts a fresh save immediately and replaces it after an edit', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tours).toEqual([tour]))
    const saved = { ...tour, place_id: 43, name: 'Fresh tour' }

    act(() => result.current.upsertTour(saved))
    expect(result.current.tours).toEqual([saved, tour])

    const edited = { ...saved, name: 'Fresh tour edited' }
    act(() => result.current.upsertTour(edited))
    expect(result.current.tours).toEqual([edited, tour])
  })

  it('removes a deleted Tour from the visible list before the refresh completes', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tours).toEqual([tour]))
    const refresh = deferred<{ tours: TourListItem[] }>()
    vi.mocked(tourRepo.list).mockReturnValueOnce(refresh.promise)

    act(() => result.current.invalidateTourPlaceIds({ removedPlaceIds: [tour.place_id] }))

    expect(result.current.tours).toEqual([])
    expect(result.current.tourPlaceIds.size).toBe(0)
    await act(async () => refresh.resolve({ tours: [] }))
    await waitFor(() => expect(result.current.toursLoading).toBe(false))
    expect(result.current.tourLoadError).toBe(false)
  })

  it('shows only the new trip Tours after a successful trip switch', async () => {
    const tripTwoTour = tourFor(84, 'Trip two tour')
    vi.mocked(tourRepo.list).mockImplementation(async tripId => ({
      tours: [tripId === 7 ? tour : tripTwoTour],
    }))
    const { result, rerender } = renderHook(({ tripId }) => useTourPlaceIds(tripId, true), {
      initialProps: { tripId: 7 },
    })
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    rerender({ tripId: 8 })
    expect(result.current.tours).toEqual([])
    expect(result.current.tourPlaceIds.size).toBe(0)
    expect(result.current.tourDataReady).toBe(false)
    expect(result.current.toursLoading).toBe(true)
    await waitFor(() => expect(result.current.tours).toEqual([tripTwoTour]))
    expect(result.current.tourPlaceIds).toEqual(new Set([84]))
  })

  it('keeps previous-trip data hidden when the new trip refresh fails', async () => {
    vi.mocked(tourRepo.list).mockImplementation(async tripId => {
      if (tripId === 8) throw new Error('Trip two unavailable')
      return { tours: [tour] }
    })
    const { result, rerender } = renderHook(({ tripId }) => useTourPlaceIds(tripId, true), {
      initialProps: { tripId: 7 },
    })
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))

    rerender({ tripId: 8 })
    expect(result.current.tours).toEqual([])
    expect(result.current.tourDataReady).toBe(false)
    await waitFor(() => expect(result.current.tourLoadError).toBe(true))
    expect(result.current.tours).toEqual([])
    expect(result.current.tourPlaceIds.size).toBe(0)
    expect(result.current.tourDataReady).toBe(false)
    expect(result.current.toursLoading).toBe(false)
  })

  it('ignores a late response from the previous trip', async () => {
    const tripOne = deferred<{ tours: TourListItem[] }>()
    const tripTwoTour = tourFor(84, 'Trip two tour')
    const tripTwo = deferred<{ tours: TourListItem[] }>()
    vi.mocked(tourRepo.list).mockImplementation(tripId => tripId === 7 ? tripOne.promise : tripTwo.promise)
    const { result, rerender } = renderHook(({ tripId }) => useTourPlaceIds(tripId, true), {
      initialProps: { tripId: 7 },
    })

    rerender({ tripId: 8 })
    await act(async () => tripTwo.resolve({ tours: [tripTwoTour] }))
    await waitFor(() => expect(result.current.tours).toEqual([tripTwoTour]))
    await act(async () => tripOne.resolve({ tours: [tour] }))

    expect(result.current.tours).toEqual([tripTwoTour])
    expect(result.current.tourPlaceIds).toEqual(new Set([84]))
  })

  it('lets only the latest request commit after rapid trip changes', async () => {
    const requests = new Map<string | number, ReturnType<typeof deferred<{ tours: TourListItem[] }>>>()
    vi.mocked(tourRepo.list).mockImplementation(tripId => {
      const request = deferred<{ tours: TourListItem[] }>()
      requests.set(tripId, request)
      return request.promise
    })
    const { result, rerender } = renderHook(({ tripId }) => useTourPlaceIds(tripId, true), {
      initialProps: { tripId: 1 },
    })

    rerender({ tripId: 2 })
    rerender({ tripId: 3 })
    const tripThreeTour = tourFor(93, 'Trip three tour')
    await act(async () => requests.get(3)!.resolve({ tours: [tripThreeTour] }))
    await waitFor(() => expect(result.current.tours).toEqual([tripThreeTour]))
    await act(async () => requests.get(2)!.resolve({ tours: [tourFor(92, 'Trip two tour')] }))
    await act(async () => requests.get(1)!.resolve({ tours: [tour] }))

    expect(result.current.tours).toEqual([tripThreeTour])
    expect(result.current.tourPlaceIds).toEqual(new Set([93]))
  })

  it('lets only the latest same-trip refresh commit after rapid assignment mutations', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tours).toEqual([tour]))
    const beforeMutation = deferred<{ tours: TourListItem[] }>()
    const afterMutation = deferred<{ tours: TourListItem[] }>()
    vi.mocked(tourRepo.list).mockReset()
      .mockReturnValueOnce(beforeMutation.promise)
      .mockReturnValueOnce(afterMutation.promise)

    let firstRefresh!: Promise<void>
    let secondRefresh!: Promise<void>
    act(() => {
      firstRefresh = result.current.reloadTourPlaceIds()
      secondRefresh = result.current.reloadTourPlaceIds()
    })
    const plannedTour = { ...tour, planned: true }
    await act(async () => { afterMutation.resolve({ tours: [plannedTour] }); await secondRefresh })
    await waitFor(() => expect(result.current.tours).toEqual([plannedTour]))
    await act(async () => { beforeMutation.resolve({ tours: [tour] }); await firstRefresh })

    expect(result.current.tours).toEqual([plannedTour])
    expect(result.current.tourPlaceIds).toEqual(new Set([42]))
    expect(result.current.tourLoadError).toBe(false)
  })

  it('retains same-trip last-good data and exposes a failed refresh', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    vi.mocked(tourRepo.list).mockRejectedValueOnce(new Error('Refresh unavailable'))

    await act(async () => { await result.current.reloadTourPlaceIds() })

    expect(result.current.tours).toEqual([tour])
    expect(result.current.tourPlaceIds).toEqual(new Set([42]))
    expect(result.current.tourDataReady).toBe(true)
    expect(result.current.tourLoadError).toBe(true)
    expect(result.current.toursLoading).toBe(false)
  })

  it('does not let a pending request update state after unmount', async () => {
    const request = deferred<{ tours: TourListItem[] }>()
    vi.mocked(tourRepo.list).mockReturnValue(request.promise)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderHook(() => useTourPlaceIds(7, true))
    unmount()

    await act(async () => request.resolve({ tours: [tour] }))

    expect(consoleError).not.toHaveBeenCalled()
  })

  it('distinguishes an empty successful list from a failed refresh', async () => {
    vi.mocked(tourRepo.list).mockResolvedValueOnce({ tours: [] })
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    expect(result.current.tours).toEqual([])
    expect(result.current.tourLoadError).toBe(false)

    vi.mocked(tourRepo.list).mockRejectedValueOnce(new Error('Refresh unavailable'))
    await act(async () => { await result.current.reloadTourPlaceIds() })
    expect(result.current.tours).toEqual([])
    expect(result.current.tourDataReady).toBe(true)
    expect(result.current.tourLoadError).toBe(true)
  })

  it('does not let an older refresh overwrite a successful Tour upsert', async () => {
    const { result } = renderHook(() => useTourPlaceIds(7, true))
    await waitFor(() => expect(result.current.tourDataReady).toBe(true))
    const refresh = deferred<{ tours: TourListItem[] }>()
    vi.mocked(tourRepo.list).mockReturnValueOnce(refresh.promise)
    act(() => { void result.current.reloadTourPlaceIds() })
    await waitFor(() => expect(result.current.toursLoading).toBe(true))

    const savedTour = tourFor(43, 'Saved while refreshing')
    act(() => result.current.upsertTour(savedTour))
    await act(async () => refresh.resolve({ tours: [tour] }))

    expect(result.current.tours).toEqual([savedTour, tour])
    expect(result.current.tourLoadError).toBe(false)
  })
})
