import { useCallback, useEffect, useRef, useState } from 'react'
import { roadtripDayBoundaryListSchema, type RoadtripDayBoundary } from '@trek/shared'
import { apiClient } from '../../api/client'
import { addListener, removeListener } from '../../api/websocket'
import { useNetworkMode } from '../../hooks/useNetworkMode'

const EMPTY: RoadtripDayBoundary[] = []

export function useDayBoundaries(tripId: number | string | null, active: boolean, assignments?: unknown) {
  const { offline } = useNetworkMode()
  const [stored, setStored] = useState<{ tripId: number | string | null; boundaries: RoadtripDayBoundary[] }>({ tripId: null, boundaries: EMPTY })
  const [stale, setStale] = useState(false)
  const [pending, setPending] = useState(false)
  const revision = useRef(0)
  const busy = useRef(false)
  const currentTrip = useRef(tripId)
  currentTrip.current = tripId
  useEffect(() => {
    if (!tripId || !active || offline) return
    let cancelled = false
    const version = ++revision.current
    apiClient.get(`/trips/${tripId}/roadtrip/day-boundaries`).then(saved => {
      if (cancelled || revision.current !== version) return
      setStored({ tripId, boundaries: roadtripDayBoundaryListSchema.parse(saved.data).boundaries })
      setStale(false)
    }).catch(() => { if (!cancelled) setStale(true) })
    return () => { cancelled = true }
  }, [tripId, active, offline, assignments])
  useEffect(() => {
    if (!tripId || !active) return
    const receive = (event: Record<string, unknown>) => {
      if (event.type !== 'roadtripBoundary:changed' || String(event.tripId) !== String(tripId)) return
      const parsed = roadtripDayBoundaryListSchema.safeParse(event)
      if (!parsed.success) return
      revision.current++
      setStored({ tripId, boundaries: parsed.data.boundaries })
      setStale(false)
    }
    addListener(receive)
    return () => removeListener(receive)
  }, [tripId, active])
  const save = useCallback(async (day: number, boundary: RoadtripDayBoundary | null) => {
    if (!tripId || offline || busy.current) return false
    busy.current = true
    setPending(true)
    const version = ++revision.current
    try {
      const saved = boundary
        ? await apiClient.put(`/trips/${tripId}/roadtrip/day-boundaries`, { ...boundary, day_number: day })
        : await apiClient.delete(`/trips/${tripId}/roadtrip/day-boundaries/${day}`)
      if (currentTrip.current !== tripId) return false
      if (revision.current === version) setStored({ tripId, boundaries: roadtripDayBoundaryListSchema.parse(saved.data).boundaries })
      setStale(false)
      return true
    } finally {
      busy.current = false
      setPending(false)
    }
  }, [tripId, offline])
  return { boundaries: stored.tripId === tripId ? stored.boundaries : EMPTY, save, stale, pending, editable: active && !offline && !stale && stored.tripId === tripId }
}
