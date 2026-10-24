import { useEffect, useEffectEvent } from 'react';

/**
 * How long refresh nudges are collected before the stays are read once. The
 * same window `useServerPing` folds a burst into: long enough for an assistant
 * step that books several stays at once, short enough that one booking still
 * reads as instant.
 */
export const STAYS_REFRESH_SETTLE_MS = 250;

/**
 * Runs `reload` once for each burst of `accommodations:refresh` nudges.
 *
 * The stays live in page-local state (the planner's list, the desktop day
 * panel's own copy), so the trip store cannot apply a remote stay to them. Instead
 * `remoteEventHandler` and the trip store nudge the views on every change that
 * can add, move or take away a booked night, and each view reads its stays again.
 * One assistant step can apply up to fifty changes, every one of them its own
 * event, and the planner's reload reads the reservations too, so the nudges of
 * one burst are served by a single reload instead of one each.
 *
 * As in `useServerPing`, two reloads never overlap: a burst that ends while a
 * reload is still reading waits for it and is then served by one more, so an
 * older answer cannot land over a newer one. A `reload` that returns nothing
 * counts as done at once.
 *
 * The nudge rides the legacy window event the store already sends; this hook is
 * its one listener. Moving the stays into a store slice would retire both.
 *
 * `reload` may change identity every render; the latest one is always used.
 */
export function useStaysRefresh(reload: () => Promise<unknown> | void): void {
  const onSettled = useEffectEvent(reload);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    /** A burst that ended while a reload was reading: served once that lands. */
    let pendingAfterFlight = false;
    let cancelled = false;

    const landed = (): void => {
      inFlight = false;
      if (pendingAfterFlight && !cancelled) {
        pendingAfterFlight = false;
        run();
      }
    };

    const run = (): void => {
      if (cancelled) return;
      if (inFlight) {
        pendingAfterFlight = true;
        return;
      }
      const reading = onSettled();
      if (!(reading instanceof Promise)) return; // done at once
      inFlight = true;
      void reading.then(landed, landed);
    };

    const collect = (): void => {
      if (timer) return; // already collecting this burst
      timer = setTimeout(() => {
        timer = null;
        run();
      }, STAYS_REFRESH_SETTLE_MS);
    };
    window.addEventListener('accommodations:refresh', collect);
    return () => {
      cancelled = true;
      window.removeEventListener('accommodations:refresh', collect);
      if (timer) clearTimeout(timer);
    };
  }, []);
}
