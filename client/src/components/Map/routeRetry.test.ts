import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateRouteWithLegs, RoutingRefusedError } from './RouteCalculator';
import { calculateRouteWithRetries, ROUTE_RETRY_DELAYS_MS } from './routeRetry';

vi.mock('./RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('./RouteCalculator')>();
  return { ...actual, calculateRouteWithLegs: vi.fn() };
});

const WAYPOINTS = [
  { lat: 47.5, lng: 19.04 },
  { lat: 47.49, lng: 19.05 },
];
const ROUTED = {
  coordinates: [
    [47.5, 19.04],
    [47.49, 19.05],
  ],
  legs: [],
} as unknown as Awaited<ReturnType<typeof calculateRouteWithLegs>>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(calculateRouteWithLegs).mockReset();
});
afterEach(() => vi.useRealTimers());

describe('calculateRouteWithRetries', () => {
  it('waits out a rate limit and answers with the road (Discord, 16.10.2026)', async () => {
    vi.mocked(calculateRouteWithLegs)
      .mockRejectedValueOnce(new RoutingRefusedError(429, null))
      .mockResolvedValueOnce(ROUTED);

    const answer = calculateRouteWithRetries(WAYPOINTS, { profile: 'driving' });
    await vi.advanceTimersByTimeAsync(ROUTE_RETRY_DELAYS_MS[0]);

    await expect(answer).resolves.toBe(ROUTED);
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2);
  });

  it('waits as long as the host asks when that is longer', async () => {
    vi.mocked(calculateRouteWithLegs)
      .mockRejectedValueOnce(new RoutingRefusedError(503, 3000))
      .mockResolvedValueOnce(ROUTED);

    const answer = calculateRouteWithRetries(WAYPOINTS, {});
    await vi.advanceTimersByTimeAsync(ROUTE_RETRY_DELAYS_MS[0]);
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000 - ROUTE_RETRY_DELAYS_MS[0]);

    await expect(answer).resolves.toBe(ROUTED);
  });

  it('gives up after the last delay and throws the refusal', async () => {
    vi.mocked(calculateRouteWithLegs).mockRejectedValue(new RoutingRefusedError(429, null));

    const answer = calculateRouteWithRetries(WAYPOINTS, {});
    const settled = expect(answer).rejects.toBeInstanceOf(RoutingRefusedError);
    for (const ms of ROUTE_RETRY_DELAYS_MS) await vi.advanceTimersByTimeAsync(ms);

    await settled;
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(ROUTE_RETRY_DELAYS_MS.length + 1);
  });

  it('throws a refusal the host meant at once', async () => {
    vi.mocked(calculateRouteWithLegs).mockRejectedValue(new RoutingRefusedError(400, null));

    await expect(calculateRouteWithRetries(WAYPOINTS, {})).rejects.toBeInstanceOf(RoutingRefusedError);
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1);
  });

  it('stops waiting when the day changes', async () => {
    const controller = new AbortController();
    vi.mocked(calculateRouteWithLegs)
      .mockRejectedValueOnce(new RoutingRefusedError(429, null))
      .mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));

    const answer = calculateRouteWithRetries(WAYPOINTS, { signal: controller.signal });
    const settled = expect(answer).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(10);
    controller.abort();

    await settled;
  });
});
