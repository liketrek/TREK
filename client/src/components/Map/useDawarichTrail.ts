import { useCallback, useEffect, useRef, useState } from 'react'
import type { DawarichTrack } from '@trek/shared'
import { dawarichRepo } from '../../repo/dawarichRepo'
import { useAddonStore } from '../../store/addonStore'
import { isEffectivelyOffline, onNetworkModeChange } from '../../sync/networkMode'

export type DawarichTrailStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'offline'

export interface DawarichTrailState {
  track: DawarichTrack | null
  status: DawarichTrailStatus
  /** ISO-8601 of the last fetch that actually returned something. */
  fetchedAt: string | null
  reload: () => void
}

/**
 * The recorded route for a trip, fetched while the overlay is on.
 *
 * Called **once** in `MapViewAuto` and mirrored into both renderers as a prop —
 * the same shape `useRoadtripHazards` uses, and for the same reason: two
 * renderers each fetching would double the load on somebody's self-hosted
 * instance and could draw two different answers.
 *
 * Refreshes on a timer while the layer is on, so a trip in progress catches up
 * without anyone reloading the page. Two minutes rather than seconds: this
 * reaches across the network to a server the user runs, and the server caches
 * for a minute anyway, so a tighter loop would buy nothing and cost them.
 */
const REFRESH_MS = 120_000

export function useDawarichTrail(
  tripId: number | undefined,
  enabled: boolean,
  range?: { from?: string; to?: string },
): DawarichTrailState {
  const addonEnabled = useAddonStore(s => s.isEnabled)
  const active = enabled && !!tripId && addonEnabled('dawarich')

  const [track, setTrack] = useState<DawarichTrack | null>(null)
  const [status, setStatus] = useState<DawarichTrailStatus>('idle')
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  // Kept in a ref so changing the window does not re-create the effect's
  // identity on every render of the parent — the object literal would.
  const rangeRef = useRef(range)
  rangeRef.current = range
  const rangeKey = `${range?.from ?? ''}|${range?.to ?? ''}`

  const reload = useCallback(() => setReloadToken(token => token + 1), [])

  useEffect(() => {
    if (!active || !tripId) {
      setTrack(null)
      setStatus('idle')
      return
    }

    let controller: AbortController | null = null
    let cancelled = false

    const load = () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal

      if (isEffectivelyOffline()) {
        setStatus('offline')
        return
      }
      // The previous line stays on screen while the next one loads: blanking it
      // makes a refresh look like the recording disappeared.
      setStatus(current => (current === 'ready' ? 'ready' : 'loading'))

      dawarichRepo
        .tripTrack(tripId, rangeRef.current, signal)
        .then(result => {
          if (cancelled || signal.aborted) return
          setTrack(result)
          setFetchedAt(result.fetchedAt)
          setStatus(result.days.length > 0 ? 'ready' : 'empty')
        })
        .catch(() => {
          if (cancelled || signal.aborted) return
          // Keep whatever was drawn. A line from two minutes ago is more useful
          // than an empty map, and the status is what says it may be stale.
          setStatus(isEffectivelyOffline() ? 'offline' : 'unavailable')
        })
    }

    load()
    const timer = window.setInterval(load, REFRESH_MS)
    const unsubscribe = onNetworkModeChange(load)
    return () => {
      cancelled = true
      controller?.abort()
      window.clearInterval(timer)
      unsubscribe()
    }
  }, [active, tripId, rangeKey, reloadToken])

  return { track: active ? track : null, status: active ? status : 'idle', fetchedAt, reload }
}
