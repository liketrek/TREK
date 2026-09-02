import { useEffect, useRef } from 'react'
import { addListener, removeListener } from '../../api/websocket'

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

    const handler = (event: Record<string, unknown>) => {
      if (event.type !== 'packing:bag-totals') return
      if (timer) return // already collecting this burst
      timer = setTimeout(() => {
        timer = null
        run()
      }, COALESCE_MS)
    }

    addListener(handler)
    return () => {
      cancelled = true
      removeListener(handler)
      if (timer) clearTimeout(timer)
    }
  }, [enabled])
}
