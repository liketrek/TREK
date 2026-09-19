import { useEffect, useRef } from 'react'
import { addListener, removeListener } from '../api/websocket'
import { isEffectivelyOnline, onNetworkModeChange } from './networkMode'

/**
 * How long pings are collected before one refetch goes out.
 *
 * Long enough to fold a burst into a single request (clearing twelve checked
 * items issues twelve deletes, and an import writes a whole list), short enough
 * that a single edit still reads as instant.
 */
const COALESCE_MS = 250

/**
 * Refetch when the server says something moved, without trusting the event to
 * carry what moved.
 *
 * Some events are content-free on purpose: bag weights are summed across members
 * whose items this client may not see, and a document-sync run reports counts
 * that are only meaningful read back from the server. Every such ping is a
 * refetch, which is why this coalesces bursts and never lets two requests
 * overlap: the server pings the whole room including the originating socket, so
 * a busy trip would otherwise have every client refetching once per written row.
 *
 * A ping sent while this client is disconnected is gone for good, so the two
 * moments where that can have happened count as pings of their own: the room
 * re-join after a reconnect, and the return to online.
 *
 * `reload` may change identity every render; the latest one is always used.
 */
export function useServerPing(eventName: string, enabled: boolean, reload: () => Promise<void>): void {
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
      // is also the moment what is on screen is what was there before the drop:
      // whatever moved in the meantime pinged into a closed socket.
      if (event.type !== eventName && event.type !== 'joined') return
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
  }, [enabled, eventName])
}
