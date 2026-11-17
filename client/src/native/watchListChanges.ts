import { liveQuery } from 'dexie';
import { offlineDb } from '../db/offlineDb';

/** Long enough to take a run of ticks (or a synced batch) as one change, short enough to read as instant. */
const SETTLE_MS = 300;

/**
 * Calls `run` once the packing lists or the to-dos this device keeps offline
 * have changed, after they settled: a tick in the app, a tick from the watch
 * written through, or another member's tick arriving over the WebSocket (the
 * remote event handler writes it to the same tables). The watch's snapshot is
 * built from those tables, so this is what keeps the watch as current as the
 * phone instead of waiting for the next quarter-hour refresh.
 *
 * The first answer of the query is the state at subscription, not a change, and
 * is skipped. Returns the unsubscribe.
 */
export function onWatchListsChange(run: () => void, settleMs = SETTLE_MS): () => void {
  let first = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const subscription = liveQuery(() =>
    Promise.all([offlineDb.packingItems.toArray(), offlineDb.todoItems.toArray()])
  ).subscribe({
    next: () => {
      if (first) {
        first = false;
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        run();
      }, settleMs);
    },
    // A failed read changes nothing on the watch; the next write tries again.
    error: () => undefined,
  });
  return () => {
    if (timer) clearTimeout(timer);
    subscription.unsubscribe();
  };
}
