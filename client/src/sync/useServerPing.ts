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
 * `eventName` may also be a list, for a view that reads one thing again after
 * any of several events: a burst across all of them is still one refetch.
 *
 * `rejoin: false` leaves the room re-join out. The server answers every join with
 * `joined`, opening a trip included, so a hook that reads account-wide state
 * (settings, tags, collections) would read it again on each trip opened. Those
 * events go to the user's own sockets, not to a room, so a re-join says nothing
 * about them; the return to online still counts.
 */
export function useServerPing(
  eventName: string | readonly string[],
  enabled: boolean,
  reload: () => Promise<void>,
  options: { rejoin?: boolean } = {}
): void {
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  // A string key, so a list written inline does not resubscribe on every render.
  const eventKey = typeof eventName === 'string' ? eventName : eventName.join('\n')
  const rejoin = options.rejoin ?? true

  useEffect(() => {
    if (!enabled) return
    const eventNames = new Set(eventKey.split('\n'))
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
      // 'joined' answers every room join, the re-join after a reconnect included,
      // which is the moment what is on screen is what was there before the drop:
      // whatever moved in the meantime pinged into a closed socket.
      const ping = event.type === 'joined' ? rejoin : eventNames.has(String(event.type))
      if (ping) schedule()
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
  }, [enabled, eventKey, rejoin])
}
