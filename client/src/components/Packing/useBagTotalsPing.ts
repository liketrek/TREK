import { useServerPing } from '../../sync/useServerPing'

/**
 * The events after which the bags are read again. The totals ping is content-free
 * by design (#2191): totals are summed across every member, including people whose
 * items this client may not see, so the event cannot carry the new numbers without
 * leaking what produced them. A bag created, renamed, deleted or given new members
 * elsewhere (a fellow traveller, the assistant) is read back the same way, so the
 * bag list has one source instead of a second copy patched from the payloads.
 */
const BAG_RELOAD_EVENTS = [
  'packing:bag-totals',
  'packing:bag-created',
  'packing:bag-updated',
  'packing:bag-deleted',
  'packing:bag-members-updated',
] as const

/**
 * Re-read the bags when the server says they moved. `useServerPing` carries the
 * coalescing, the in-flight guard and the reconnect handling, so an assistant step
 * that touches several bags is still one read.
 */
export function useBagTotalsPing(enabled: boolean, reload: () => Promise<void>): void {
  useServerPing(BAG_RELOAD_EVENTS, enabled, reload)
}
