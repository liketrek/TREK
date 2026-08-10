import { UA } from '../maps/maps.helpers';

/**
 * The one Nominatim client.
 *
 * There used to be two, and that is issue #576 — but not in the shape the issue
 * describes. It was never two throttles racing: atlas throttled and cached, maps
 * did neither. Five interactive maps routes fired straight at the service while
 * two atlas background loops politely waited 1.1s between calls, and Nominatim
 * saw one instance ignoring its rate limit.
 *
 * The state here is MODULE state, not provider state, and that is load-bearing
 * rather than a style choice. A second instance of the cursor is the bug: the
 * bridge instances and the DI singleton have to share one, exactly like the
 * permissions and FX caches. `GeocodingService` next door owns the cleanup
 * timer's lifecycle and nothing else.
 *
 * Every request carries `UA`, the instance-identifying User-Agent. Atlas used to
 * send a bare generic string, which is the thing #1309 established gets throttled
 * harder — so folding the two clients together had to adopt the stricter caller's
 * header, not the weaker one.
 */

const BASE = 'https://nominatim.openstreetmap.org';
const MIN_INTERVAL_MS = 1100;

let lastCall = 0;
let minIntervalMs = MIN_INTERVAL_MS;

/**
 * Test seam: the interval, in milliseconds.
 *
 * Nineteen maps cases stub fetch and drive the Nominatim paths back to back with
 * real timers. Under the real interval each of them sleeps 1.1s, which buys the
 * suite nineteen seconds of waiting and no coverage at all. `tests/setup.ts`
 * sets it to 0; GEO-002 sets it back for the cases that are about the throttle.
 * Deliberately a function rather than a NODE_ENV check — reading the environment
 * inside a Nest module is what app-config exists to prevent, and a seam that is
 * visible in the signature beats one that fires on an ambient variable.
 */
export function setGeoThrottleInterval(ms: number): void {
  minIntervalMs = ms;
}

/**
 * Two lanes over one cursor.
 *
 * Interactive calls are on the request path of /api/maps/search, /autocomplete,
 * /details, /reverse and /resolve-url. Background calls come from the atlas
 * enrichment loops, which walk every uncached place. With a single queue a
 * keystroke waits behind however many places the loop has enqueued, so
 * interactive work takes the next slot and background work yields to it.
 */
export type GeoLane = 'interactive' | 'background';

let interactiveWaiting = 0;

async function throttle(lane: GeoLane): Promise<void> {
  if (lane === 'interactive') interactiveWaiting++;
  try {
    for (;;) {
      const elapsed = Date.now() - lastCall;
      const wait = minIntervalMs - elapsed;
      if (wait <= 0) break;
      await new Promise((r) => setTimeout(r, wait));
      // A background call that woke up while an interactive one is queued gives
      // up its slot rather than taking it.
      if (lane === 'background' && interactiveWaiting > 0) {
        await new Promise((r) => setTimeout(r, minIntervalMs));
      }
    }
    lastCall = Date.now();
  } finally {
    if (lane === 'interactive') interactiveWaiting--;
  }
}

// ── Reverse-geocode cache ────────────────────────────────────────────────────

/**
 * Keyed by coordinates AND the query shape. Atlas asks at zoom 3 (country) and
 * zoom 8 (region), maps at zoom 18 (street): a key that carried coordinates alone
 * would answer a street lookup with a country. It rounds to three decimals, a
 * ~110m grid, which is the granularity the atlas cache always used.
 */
const cache = new Map<string, unknown>();
const CACHE_MAX = 50_000;
const CACHE_CLEANUP_MS = 10 * 60 * 1000;

function roundKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export function cacheKeyFor(lat: number, lng: number, shape: string): string {
  return `${shape}|${roundKey(lat, lng)}`;
}

export function getCached<T>(key: string): T | undefined {
  return cache.has(key) ? (cache.get(key) as T) : undefined;
}

/**
 * Whether the key is present at all, negative answers included.
 *
 * `getCached` cannot express the difference: a cached `undefined` and a miss
 * both read as `undefined`. Callers that only want the value do not care, but a
 * caller deciding whether to go back to the network does, and so does any test
 * asserting that a negative answer is retained.
 */
export function hasCached(key: string): boolean {
  return cache.has(key);
}

export function setCached(key: string, value: unknown): void {
  cache.set(key, value);
}

/** Test seam: the suites need a known-empty cache between cases. */
export function clearGeoCache(): void {
  cache.clear();
  lastCall = 0;
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Started by `GeocodingService.onModuleInit`, not at import time.
 *
 * The atlas module used to run this as an import-time side effect, documented as
 * a deliberate parity exception. It does not have to be one any more: the
 * container has a lifecycle hook for exactly this, and a timer nobody stops is
 * how a test process ends up hanging.
 */
export function startGeoCacheCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    if (cache.size > CACHE_MAX) {
      const keys = [...cache.keys()];
      for (const k of keys.slice(0, keys.length - CACHE_MAX)) cache.delete(k);
    }
  }, CACHE_CLEANUP_MS);
  cleanupTimer.unref?.();
}

export function stopGeoCacheCleanup(): void {
  if (!cleanupTimer) return;
  clearInterval(cleanupTimer);
  cleanupTimer = null;
}

// ── The one outbound primitive ───────────────────────────────────────────────

export interface NominatimOptions {
  lane?: GeoLane;
  /** Caller's own deadline. Built AFTER the throttle wait, never before. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * One request to Nominatim, throttled and identified.
 *
 * The abort signal is constructed after the throttle wait on purpose: building it
 * first would spend up to 1.1s of the caller's budget queueing rather than
 * fetching, which for the 2.5s identity lookup is nearly half of it.
 */
export async function nominatimFetch(
  path: 'search' | 'reverse' | 'lookup',
  params: URLSearchParams,
  opts: NominatimOptions = {},
): Promise<Response> {
  await throttle(opts.lane ?? 'interactive');
  const signal = opts.signal ?? (opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined);
  return fetch(`${BASE}/${path}?${params.toString()}`, {
    headers: { 'User-Agent': UA },
    ...(signal ? { signal } : {}),
  });
}
