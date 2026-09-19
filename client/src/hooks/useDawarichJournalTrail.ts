import { useEffect, useMemo, useState } from 'react'
import type { JourneyTrack } from '@trek/shared'
import { dawarichRepo } from '../repo/dawarichRepo'
import { useAddonStore } from '../store/addonStore'
import { trailSegments } from '../components/Map/dawarichTrail'
import { isEffectivelyOffline } from '../sync/networkMode'

/**
 * The recorded route for a journal, shaped as the journey map's own tracks.
 *
 * The journey map already draws `JourneyTrack[]` — several separate polylines,
 * each with its own colour and a white casing, described in that file as
 * reading "as a recorded route rather than as the dashed line that merely
 * connects entries in time order". That is exactly what this is, so it rides
 * the existing layer instead of adding a third one.
 *
 * It is deliberately NOT the map's `trail` prop: that draws a single polyline,
 * and a day's recording is several disconnected pieces — joining them would
 * paint straight lines across gaps the traveller never travelled.
 *
 * The synthetic `place_id` is negative so it can never collide with a real
 * place's, which is what the map keys its lines on.
 */
export function useDawarichJournalTrail(
  /** Dates the journal covers, from its trips. */
  dates: Set<string>,
  enabled: boolean,
): { tracks: JourneyTrack[]; fetchedAt: string | null; status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'offline' } {
  const addonEnabled = useAddonStore(s => s.isEnabled)
  const active = enabled && addonEnabled('dawarich') && dates.size > 0

  const [tracks, setTracks] = useState<JourneyTrack[]>(EMPTY)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'offline'>('idle')

  // The window is the journal's own span. A Set has no order, so it is sorted
  // here rather than trusting insertion order.
  const window = useMemo(() => {
    if (dates.size === 0) return null
    // ISO dates: lexicographic order is chronological, and staying locale-independent
    // keeps the window identical on every runtime.
    const sorted = [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return { from: `${sorted[0]}T00:00:00Z`, to: `${sorted[sorted.length - 1]}T23:59:59Z` }
  }, [dates])

  useEffect(() => {
    if (!active || !window) {
      setTracks(EMPTY)
      setStatus('idle')
      return
    }
    if (isEffectivelyOffline()) {
      setTracks(EMPTY)
      setStatus('offline')
      return
    }

    const controller = new AbortController()
    let cancelled = false
    setStatus('loading')

    dawarichRepo
      .windowTrack(window.from, window.to, controller.signal)
      .then(track => {
        if (cancelled) return
        const segments = trailSegments(track)
        setTracks(
          segments.map((segment, index): JourneyTrack => ({
            place_id: -(index + 1),
            trip_id: 0,
            name: segment.date,
            color: segment.color,
            points: segment.points,
          })),
        )
        setFetchedAt(track.fetchedAt)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setTracks(EMPTY)
        setStatus(isEffectivelyOffline() ? 'offline' : 'unavailable')
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [active, window])

  return { tracks: active ? tracks : EMPTY, fetchedAt, status }
}

/** Stable empty identity: a fresh literal would re-render the map on every pass. */
const EMPTY: JourneyTrack[] = []
