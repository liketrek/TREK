import { useEffect, useState, useCallback, useRef } from 'react'
import type { TourListItem } from '@trek/shared'
import { toursApi } from '../api/client'

export interface ToursInvalidation {
  placeIds?: number[]
  removedPlaceIds?: number[]
}

/**
 * Place ids that are tours (a `tours` facet row exists for them), used to keep
 * them out of the Places pool while the Tours addon is on.
 * The single discriminator stays the `tours`
 * facet row \u2014 this hook just mirrors it into a client-side Set for the
 * Places filter, it does not add anything to the `places` table.
 *
 * Only fetches while `enabled` is true: with the addon off there is nothing to
 * exclude, and the Places pool must stay byte-for-byte identical to today.
 */
export function useTourPlaceIds(tripId: number, enabled: boolean) {
  const [tourData, setTourData] = useState<{ tripId: number; tours: TourListItem[] } | null>(null)
  const [requestState, setRequestState] = useState<{
    tripId: number
    loading: boolean
    error: boolean
  } | null>(null)
  const [pendingPlaceIds, setPendingPlaceIds] = useState<{ tripId: number; ids: Set<number> } | null>(null)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(false)
  const activeRequestRef = useRef({ tripId, enabled })
  activeRequestRef.current = { tripId, enabled }

  const reload = useCallback(async () => {
    if (!enabled || !mountedRef.current
      || activeRequestRef.current.tripId !== tripId
      || !activeRequestRef.current.enabled) return
    const requestId = ++requestIdRef.current
    setRequestState({ tripId, loading: true, error: false })
    try {
      const response = await toursApi.list(tripId)
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setTourData({ tripId, tours: response.tours })
      setPendingPlaceIds(current => current?.tripId === tripId ? null : current)
      setRequestState({ tripId, loading: false, error: false })
    } catch {
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      // Data is keyed by trip, so this retains only a same-trip last-good list.
      setRequestState({ tripId, loading: false, error: true })
    }
  }, [tripId, enabled])

  const invalidateTourPlaceIds = useCallback((change?: ToursInvalidation) => {
    if (!enabled || !mountedRef.current || activeRequestRef.current.tripId !== tripId
      || !activeRequestRef.current.enabled) return
    const added = change?.placeIds ?? []
    const removed = change?.removedPlaceIds ?? []
    if (removed.length) {
      setTourData(current => current?.tripId === tripId
        ? { tripId, tours: current.tours.filter(tour => !removed.includes(tour.place_id)) }
        : current)
    }
    if (added.length || removed.length) {
      setPendingPlaceIds(current => {
        const ids = new Set(current?.tripId === tripId ? current.ids : [])
        for (const id of removed) ids.delete(id)
        for (const id of added) ids.add(id)
        return ids.size ? { tripId, ids } : null
      })
    }
    void reload()
  }, [enabled, tripId, reload])

  useEffect(() => {
    mountedRef.current = true
    void reload()
    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
    }
  }, [reload])

  const upsertTour = useCallback((tour: TourListItem) => {
    if (!enabled || !mountedRef.current || activeRequestRef.current.tripId !== tripId
      || !activeRequestRef.current.enabled) return
    requestIdRef.current += 1
    setTourData(current => ({
      tripId,
      tours: [tour, ...(current?.tripId === tripId ? current.tours : [])
        .filter(item => item.place_id !== tour.place_id)],
    }))
    setRequestState({ tripId, loading: false, error: false })
  }, [enabled, tripId])

  const tourDataReady = !enabled || tourData?.tripId === tripId
  const visibleTours = enabled && tourData?.tripId === tripId ? tourData.tours : []
  const pendingIds = enabled && pendingPlaceIds?.tripId === tripId ? pendingPlaceIds.ids : []
  const currentRequest = requestState?.tripId === tripId ? requestState : null

  return {
    tours: visibleTours,
    toursLoading: enabled && (currentRequest?.loading ?? false),
    tourLoadError: enabled && (currentRequest?.error ?? false),
    tourDataReady,
    tourPlaceIds: new Set([...visibleTours.map(tour => tour.place_id), ...pendingIds]),
    reloadTourPlaceIds: reload,
    invalidateTourPlaceIds,
    upsertTour,
  }
}
