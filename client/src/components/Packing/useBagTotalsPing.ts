import { useEffect, useRef } from 'react'
import { addListener, removeListener } from '../../api/websocket'
import { isEffectivelyOnline, onNetworkModeChange } from '../../sync/networkMode'

/**
 * How long pings are collected before one refetch goes out.
 *
 * Long enough to fold a burst into a single request — clearing twelve checked
 * items issues twelve deletes, and an import writes a whole list — short enough
 * that a single edit still reads as instant.
 */
const COALESCE_MS = 250

/**
 * Re-read the bag weights when the server says they moved (#2191).
 *
 * The ping is content-free by design: totals are summed across every member,
 * including people whose items this client may not see, so the event cannot
 * carry the new numbers without leaking what produced them. That makes every
 * ping a refetch, which is why this coalesces bursts and never lets two
 * requests overlap — the server pings the whole room, the originating socket
 * included, so a busy trip would otherwise have every client refetching once
 * per written item.
 *
 * A ping sent while this client is disconnected is gone for good, and bags have
 * no offline cache to sync back, so the two moments where that can have happened
 * count as pings of their own: the room re-join after a reconnect, and the
 * return to online.
 *
 * `reload` may change identity every render; the latest one is always used.
 */
export function useBagTotalsPing(enabled: boolean, reload: () => Promise<void>): void {
  const reloadRef = useRef(reload)
  reloadRef.current = reload

  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false
    /** A ping that arrived while a refetch was running: serve it once that lands. */
    let pendingAfterFlight = false
    let cancelled = false

    const run = (): void => {
      if (cancelled) return
      if (inFlight) {
        pendingAfterFlight = true
        return
      }
      inFlight = true
      void reloadRef.current().finally(() => {
        inFlight = false
        if (pendingAfterFlight && !cancelled) {
          pendingAfterFlight = false
          run()
        }
      })
    }

    const schedule = (): void => {
      if (timer) return // already collecting this burst
      timer = setTimeout(() => {
        timer = null
        run()
      }, COALESCE_MS)
    }

    const handler = (event: Record<string, unknown>) => {
      // 'joined' is the room re-join the socket sends on every reconnect, so it
      // is also the moment the totals on screen are the ones from before the
      // drop: whatever moved them in the meantime pinged into a closed socket.
      if (event.type !== 'packing:bag-totals' && event.type !== 'joined') return
      schedule()
    }

    let wasOnline = isEffectivelyOnline()
    const onMode = (): void => {
      const online = isEffectivelyOnline()
      // Only the way back matters: that is when the surfaces stop summing what
      // this client can see and go back to trusting the server numbers.
      if (online && !wasOnline) schedule()
      wasOnline = online
    }

    addListener(handler)
    const unsubscribeMode = onNetworkModeChange(onMode)
    return () => {
      cancelled = true
      removeListener(handler)
      unsubscribeMode()
      if (timer) clearTimeout(timer)
    }
  }, [enabled])
}
