import { calculateRouteWithLegs, RoutingRefusedError } from './RouteCalculator';

// The profile a caller hands in, so a hook routing through here needs nothing else from Map/.
export type { RouteProfileKey } from './RouteCalculator';

/** How often a rate-limited route is asked for again, and how long after. */
export const ROUTE_RETRY_DELAYS_MS = [1500, 4000];

/** A pause that ends early, without throwing, when the signal aborts. */
export const sleepUnlessAborted = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted || ms <= 0) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });

/**
 * `calculateRouteWithLegs`, asked again while the host says it is busy.
 *
 * The public OSRM hosts allow about one request a second and answer 429 above that. A
 * day with a change of mode, or a quick switch between days, asks more often than that,
 * and the day route used to give up on the first refusal and keep its straight lines
 * until the next edit (reported on Discord, 16.10.2026). A rate limit is waited out, for
 * as long as the host asks when it says; a refusal the host meant is thrown at once,
 * because the same request earns the same answer. An abort ends the wait, and the next
 * attempt then throws the AbortError the caller already handles.
 */
export async function calculateRouteWithRetries(
  ...[waypoints, opts]: Parameters<typeof calculateRouteWithLegs>
): ReturnType<typeof calculateRouteWithLegs> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await calculateRouteWithLegs(waypoints, opts);
    } catch (err) {
      const rateLimit = err instanceof RoutingRefusedError && err.isRateLimit ? err : null;
      if (!rateLimit || attempt >= ROUTE_RETRY_DELAYS_MS.length || opts?.signal?.aborted) throw err;
      await sleepUnlessAborted(Math.max(ROUTE_RETRY_DELAYS_MS[attempt], rateLimit.retryAfterMs ?? 0), opts?.signal);
    }
  }
}
