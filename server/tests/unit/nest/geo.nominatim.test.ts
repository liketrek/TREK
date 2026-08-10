import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The one Nominatim client (#576).
 *
 * The interesting behaviour is not the fetch — it is the state around it. There
 * used to be two clients: atlas throttled and cached, maps did neither, and
 * Nominatim saw a single instance ignoring its published rate limit. These cases
 * pin the three properties that made folding them together worth doing: one
 * cursor for the whole process, a cache key that cannot answer a street lookup
 * with a country, and a deadline that starts when the request does rather than
 * when it is queued.
 */
import {
  cacheKeyFor,
  clearGeoCache,
  getCached,
  hasCached,
  nominatimFetch,
  setCached,
  setGeoThrottleInterval,
  startGeoCacheCleanup,
  stopGeoCacheCleanup,
} from '../../../src/nest/geo/nominatim.client';
import { GeocodingService } from '../../../src/nest/geo/geocoding.service';
import { UA } from '../../../src/nest/maps/maps.helpers';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  // tests/setup.ts zeroes this for every other suite. This one is about the
  // throttle, so it runs against the interval the real service publishes.
  setGeoThrottleInterval(1100);
  clearGeoCache();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  stopGeoCacheCleanup();
  setGeoThrottleInterval(0);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Runs `fn`, draining fake timers until it settles. */
async function drain<T>(fn: () => Promise<T>): Promise<T> {
  const p = fn();
  await vi.runAllTimersAsync();
  return p;
}

describe('nominatimFetch', () => {
  it('GEO-001: identifies the instance on every request', async () => {
    await drain(() => nominatimFetch('search', new URLSearchParams({ q: 'Berlin' })));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://nominatim.openstreetmap.org/search?q=Berlin');
    // Atlas used to send a bare generic string. Folding the two clients together
    // had to adopt the stricter caller's header, not the weaker one — #1309
    // established that a generic UA gets throttled harder.
    expect(init.headers['User-Agent']).toBe(UA);
  });

  it('GEO-002: holds a shared cursor, so a second caller waits out the rate limit', async () => {
    await drain(() => nominatimFetch('search', new URLSearchParams({ q: 'a' })));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = nominatimFetch('search', new URLSearchParams({ q: 'b' }));
    await vi.advanceTimersByTimeAsync(500);
    // Still inside the 1.1s window — this is the whole point of one client.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(700);
    await second;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('GEO-003: builds the deadline after the throttle wait, not before it', async () => {
    // Asserted on WHEN the signal is constructed rather than on when it fires:
    // AbortSignal.timeout runs on libuv, not on the mocked global setTimeout, so
    // advancing the fake clock would never abort it and the assertion would hold
    // whether or not the deadline had already been half spent.
    const madeAt: number[] = [];
    const real = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
      madeAt.push(Date.now());
      return real(ms);
    });

    await drain(() => nominatimFetch('search', new URLSearchParams({ q: 'a' })));
    const queuedAt = Date.now();

    // A queued call with a 2.5s budget: built up front, the 1.1s spent waiting
    // for the rate limit would eat nearly half of it before the socket opens.
    const queued = nominatimFetch('search', new URLSearchParams({ q: 'b' }), { timeoutMs: 2500 });
    await vi.runAllTimersAsync();
    await queued;

    expect(madeAt).toHaveLength(1);
    expect(madeAt[0] - queuedAt).toBeGreaterThanOrEqual(1100);
    expect(fetchMock.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("GEO-004: a caller's own signal wins over the timeout", async () => {
    const controller = new AbortController();
    await drain(() =>
      nominatimFetch('reverse', new URLSearchParams({ lat: '1' }), {
        signal: controller.signal,
        timeoutMs: 100,
      }),
    );
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('GEO-005: sends no signal at all when the caller asked for no deadline', async () => {
    await drain(() => nominatimFetch('lookup', new URLSearchParams({ osm_ids: 'N1' })));
    expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
  });

  it('GEO-006: a background call yields its slot to an interactive one', async () => {
    await drain(() => nominatimFetch('search', new URLSearchParams({ q: 'seed' })));

    const background = nominatimFetch('search', new URLSearchParams({ q: 'bg' }), { lane: 'background' });
    const interactive = nominatimFetch('search', new URLSearchParams({ q: 'ui' }));

    await vi.runAllTimersAsync();
    await Promise.all([background, interactive]);

    // The atlas backfill walks every uncached place; a keystroke must not queue
    // behind it.
    const order = fetchMock.mock.calls.slice(1).map(([url]) => (url as string).includes('q=ui') ? 'ui' : 'bg');
    expect(order[0]).toBe('ui');
  });
});

describe('geo cache', () => {
  it('GEO-007: keys on the query shape, not coordinates alone', async () => {
    // Atlas asks at zoom 3 (country) and zoom 8 (region), maps at zoom 18
    // (street). A coordinate-only key would answer a street lookup with a country.
    const street = cacheKeyFor(52.52, 13.405, 'zoom18');
    const country = cacheKeyFor(52.52, 13.405, 'zoom3');
    expect(street).not.toBe(country);

    setCached(country, { country: 'DE' });
    expect(getCached(street)).toBeUndefined();
    expect(getCached(country)).toEqual({ country: 'DE' });
  });

  it('GEO-008: rounds to a ~110m grid, so a nudged coordinate still hits', () => {
    expect(cacheKeyFor(52.52001, 13.40501, 'zoom18')).toBe(cacheKeyFor(52.5200, 13.4050, 'zoom18'));
    expect(cacheKeyFor(52.53, 13.405, 'zoom18')).not.toBe(cacheKeyFor(52.52, 13.405, 'zoom18'));
  });

  it('GEO-009: a cached negative answer is a HIT, not a miss', () => {
    // The earlier version asserted `undefined` before and after the write, which
    // is the same assertion twice and held with the `has` guard removed. What
    // the guard buys is that the second lookup does not go back to the network:
    // the ocean does not become a country, so a null answer is worth keeping.
    const key = cacheKeyFor(0, 0, 'zoom3');
    expect(hasCached(key)).toBe(false);

    setCached(key, undefined);

    expect(hasCached(key)).toBe(true);
    expect(getCached(key)).toBeUndefined();
  });

  it('GEO-010: the cleanup timer is idempotent and stoppable', () => {
    const spy = vi.spyOn(global, 'setInterval');
    startGeoCacheCleanup();
    startGeoCacheCleanup();
    // Started twice by two modules booting would otherwise leak an interval.
    expect(spy).toHaveBeenCalledTimes(1);

    stopGeoCacheCleanup();
    startGeoCacheCleanup();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('GEO-011b: the container owns the timer, so a shut-down app leaves none running', () => {
    const spy = vi.spyOn(global, 'clearInterval');
    const svc = new GeocodingService();
    svc.onModuleInit();
    svc.onModuleDestroy();
    // Atlas used to start this at import time and never stop it — a timer nobody
    // clears is how a test process ends up hanging past its last assertion.
    expect(spy).toHaveBeenCalled();
    svc.onModuleDestroy();
    expect(spy).toHaveBeenCalledTimes(1); // idempotent, not a double clear
    spy.mockRestore();
  });

  it('GEO-011: trims the oldest entries once the cap is passed', () => {
    startGeoCacheCleanup();
    for (let i = 0; i < 50_010; i++) setCached(`k${i}`, i);
    expect(getCached('k0')).toBe(0);

    vi.advanceTimersByTime(10 * 60 * 1000);
    // Insertion-ordered: the ten oldest go, the newest stay.
    expect(getCached('k0')).toBeUndefined();
    expect(getCached('k50009')).toBe(50_009);
  });
});
