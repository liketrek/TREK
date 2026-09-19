import { useServerPing } from '../../sync/useServerPing'

/**
 * Re-read the bag weights when the server says they moved (#2191).
 *
 * The ping is content-free by design: totals are summed across every member,
 * including people whose items this client may not see, so the event cannot
 * carry the new numbers without leaking what produced them. `useServerPing`
 * carries the coalescing, the in-flight guard and the reconnect handling.
 */
export function useBagTotalsPing(enabled: boolean, reload: () => Promise<void>): void {
  useServerPing('packing:bag-totals', enabled, reload)
}
