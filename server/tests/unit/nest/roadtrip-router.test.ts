import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { safeFetchAdminConfigured } from '../../../src/utils/ssrfGuard';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchAdminConfigured: vi.fn() }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: () => true }));
const points = [
  { lat: 48, lng: 10 },
  { lat: 49, lng: 11 },
  { lat: 50, lng: 12 },
];
const osrm = () =>
  new Response(
    JSON.stringify({
      code: 'Ok',
      routes: [
        {
          distance: 3000,
          duration: 300,
          geometry: {
            coordinates: [
              [10, 48],
              [11, 49],
              [12, 50],
            ],
          },
          legs: [
            { distance: 1000, duration: 100 },
            { distance: 2000, duration: 200 },
          ],
        },
      ],
      waypoints: points.map((p) => ({ location: [p.lng, p.lat], distance: 25 })),
    }),
  );
function setup(settings = {}) {
  const hooks = { providersOf: vi.fn(() => ['scenic']), route: vi.fn() };
  const db = {
    connection: {
      prepare: () => ({ get: () => ({ capabilities: JSON.stringify({ routeProfiles: [{ id: 'car' }] }) }) }),
    },
  };
  return {
    hooks,
    router: new RoadtripRouterService({ getUserSettings: () => settings } as never, hooks as never, db as never),
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(safeFetchAdminConfigured)
    .mockReset()
    .mockImplementation(async () => osrm());
});
afterEach(() => vi.useRealTimers());

describe('server Roadtrip router', () => {
  it('reads Valhalla leg times, geometry and unmet road preferences', async () => {
    const encode = (value: number) => {
      let remaining = value < 0 ? ~(value << 1) : value << 1;
      let encoded = '';
      while (remaining >= 32) { encoded += String.fromCharCode((32 | (remaining & 31)) + 63); remaining >>>= 5; }
      return encoded + String.fromCharCode(remaining + 63);
    };
    const shape = encode(48000000) + encode(10000000) + encode(1000000) + encode(1000000);
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response(JSON.stringify({trip:{legs:[{shape,summary:{length:25,time:1200,has_toll:true,has_ferry:false}}]}})));
    const route = await setup().router.route(1,1,1,points.slice(0,2),'driving',['toll','ferry']);
    expect(route.leg.line).toEqual([[48,10],[49,11]]);
    expect(route.parts).toEqual([{distance:25000,duration:1200}]);
    expect(route.avoidMissed).toEqual(['toll']);
    expect(route.snapped).toHaveLength(2);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
  });
  it('uses bounded SSRF-checked requests, keeps every snap and caches per user', async () => {
    const { router } = setup();
    const route = await router.route(1, 1, 1, points, 'driving', []);
    expect(route.parts.map((p) => p.duration)).toEqual([100, 200]);
    expect(route.snapped).toHaveLength(3);
    expect(route.snapped?.[1].meters).toBe(25);
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(
      expect.stringContaining('routing.openstreetmap.de/routed-car'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    await router.route(1, 1, 1, points, 'driving', []);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
    const other = router.route(2, 1, 1, points, 'driving', []);
    await vi.runAllTimersAsync();
    await other;
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
  });
  it('keeps a private OSRM instance private and reports unsupported avoidance', async () => {
    const { router } = setup({ routing_base_url: 'http://router.internal/' });
    const route = await router.route(1, 1, 1, points, 'driving', ['toll']);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/router.internal\/route/),
      expect.anything(),
    );
    expect(route.avoidMissed).toEqual(['toll']);
  });
  it('falls back from failed Valhalla without claiming avoidance succeeded', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response('', { status: 503 }));
    const pending = setup().router.route(1, 1, 1, points, 'driving', ['ferry']);
    await vi.runAllTimersAsync();
    expect((await pending).avoidMissed).toEqual(['ferry']);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
  });
  it('does not apply car avoidance to walking routes', async () => {
    const route = await setup().router.route(1, 1, 1, points, 'walking', ['toll']);
    expect(route.avoidMissed).toEqual([]);
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(
      expect.stringContaining('routed-foot/route/v1/foot/'),
      expect.anything(),
    );
  });
  it.each([
    { code: 'NoRoute' },
    {
      code: 'Ok',
      routes: [
        {
          distance: 1,
          duration: 1,
          legs: [],
          geometry: {
            coordinates: [
              [999, 0],
              [0, 0],
            ],
          },
        },
      ],
    },
  ])('rejects malformed provider answers', async (body) => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response(JSON.stringify(body)));
    await expect(setup().router.route(1, 1, 1, points, 'driving', [])).rejects.toThrow();
  });
  it('requires a granted plugin and a declared profile, without public fallback', async () => {
    const { router, hooks } = setup();
    await expect(router.route(1, 1, 1, points, 'plugin:scenic/missing', [])).rejects.toThrow();
    expect(hooks.route).not.toHaveBeenCalled();
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });
  it('normalizes plugin output under the requesting user and trip', async () => {
    const { router, hooks } = setup();
    hooks.route.mockResolvedValue({
      coordinates: [
        [48, 10],
        [49, 11],
        [50, 12],
      ],
      distance: 3000,
      duration: 300,
      legs: [
        { distance: 1000, duration: 100 },
        { distance: 2000, duration: 200 },
      ],
      viaPoints: [],
    });
    expect((await router.route(7, 8, 9, points, 'plugin:scenic/car', [])).leg.seg.distance).toBe(3000);
    expect(hooks.route).toHaveBeenCalledWith('scenic', { tripId: 8, dayId: 9, profile: 'car', waypoints: points }, 7);
    expect(router.profiles()).toContain('plugin:scenic/car');
  });
});
