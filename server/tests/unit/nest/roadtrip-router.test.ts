import { DomainError } from '../../../src/nest/common/domain-error';
import { RoadtripRouterService, RouteRefusal } from '../../../src/nest/roadtrip/roadtrip-router.service';
import type { ValhallaRelayAnswer } from '../../../src/nest/routing-relay/routing-relay.service';
import { safeFetchAdminConfigured } from '../../../src/utils/ssrfGuard';
import { oneByOne } from '../../helpers/one-by-one';
import { valhallaPolyline, valhallaRoute } from '../../helpers/valhalla';

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
const TREK_VALHALLA = 'https://valhalla.liketrek.com';
/** The routing relay: no TREK Valhalla to ask unless a case opens one. */
const relay = {
  trekValhalla: vi.fn((): string | null => null),
  serves: vi.fn((base: string) => base === TREK_VALHALLA),
  ask: vi.fn<(...args: unknown[]) => Promise<ValhallaRelayAnswer>>(),
};
function setup(settings = {}) {
  const hooks = { providersOf: vi.fn(() => ['scenic']), route: vi.fn() };
  // RRT1/RRT2 (Plan 3j Task 3, confirmed at Task 5's own HEAD) — `declaredProfiles`
  // now takes `PluginsRepository`, not a raw connection.
  const plugins = { findCapabilities: vi.fn(async () => JSON.stringify({ routeProfiles: [{ id: 'car' }] })) };
  return {
    hooks,
    router: new RoadtripRouterService(
      { getUserSettings: () => settings } as never,
      hooks as never,
      plugins as never,
      relay as never,
    ),
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(safeFetchAdminConfigured)
    .mockReset()
    .mockImplementation(async () => osrm());
  relay.trekValhalla.mockReset().mockReturnValue(null);
  relay.ask.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('server Roadtrip router', () => {
  it('reads Valhalla leg times, geometry and unmet road preferences', async () => {
    const shape = valhallaPolyline([
      [48, 10],
      [49, 11],
    ]);
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          trip: { legs: [{ shape, summary: { length: 25, time: 1200, has_toll: true, has_ferry: false } }] },
        }),
      ),
    );
    const route = await setup().router.route(1, 1, 1, points.slice(0, 2), 'driving', ['toll', 'ferry']);
    expect(route.leg.line).toEqual([
      [48, 10],
      [49, 11],
    ]);
    expect(route.parts).toEqual([{ distance: 25000, duration: 1200 }]);
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
  it('lets a drive turn round at a stop it passes through, and asks nothing extra of a single leg', async () => {
    // OSRM's car profile forbids a u-turn at an INTERMEDIATE waypoint unless asked, and
    // refuses the WHOLE request when it cannot obey: one stop on a dead end used to
    // cost a routed day all of its legs at once.
    const { router } = setup();
    await router.route(1, 1, 1, points, 'driving', []);
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(
      expect.stringContaining('continue_straight=false'),
      expect.anything(),
    );

    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 'Ok',
          routes: [
            {
              distance: 1000,
              duration: 100,
              geometry: {
                coordinates: [
                  [10, 48],
                  [11, 49],
                ],
              },
              legs: [{ distance: 1000, duration: 100 }],
            },
          ],
        }),
      ),
    );
    const pair = router.route(2, 1, 1, points.slice(0, 2), 'driving', []);
    await vi.runAllTimersAsync();
    await pair;
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(
      expect.not.stringContaining('continue_straight'),
      expect.anything(),
    );
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
    expect(await router.profiles()).toContain('plugin:scenic/car');
  });
});

describe('server Roadtrip router, a walk on foot only (CW-12)', () => {
  const shape = valhallaPolyline([
    [48, 10],
    [49, 11],
  ]);
  const valhallaLegs = (legs: unknown[]) => new Response(JSON.stringify({ trip: { legs } }));
  const walked = { shape, summary: { length: 1.4, time: 1000, has_ferry: false } };
  // Measured on Venice: the boat leg as FOSSGIS answers it, boarding at type 28 with ferry true.
  const byBoat = {
    shape,
    summary: { length: 1.9, time: 1250, has_ferry: true },
    maneuvers: [{ type: 1 }, { type: 28, ferry: true }, { type: 29 }],
  };

  it('asks Valhalla on foot with no point bound to a boat line, and names the legs that still cross by boat', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(valhallaLegs([walked, byBoat]));
    const route = await setup().router.route(1, 1, 0, points, 'walking', [], { footOnly: true });
    const [url, init] = vi.mocked(safeFetchAdminConfigured).mock.calls[0] as [string, { body: string }];
    expect(url).toBe('https://valhalla1.openstreetmap.de/route');
    const body = JSON.parse(init.body) as { locations: Array<Record<string, unknown>>; costing_options: unknown };
    expect(
      body.locations.every((location) => (location.search_filter as { exclude_ferry: boolean }).exclude_ferry),
    ).toBe(true);
    expect(body.costing_options).toEqual({ pedestrian: { use_ferry: 0 } });
    expect(route.ferryLegs).toEqual([1]);
    expect(route.parts).toEqual([
      { distance: 1400, duration: 1000 },
      { distance: 1900, duration: 1250 },
    ]);
    expect(route.snapped).toHaveLength(3);
  });

  it('reads a crossing off OSRM steps where no Valhalla is asked, and keeps the foot-only answer apart in the cache', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 'Ok',
          routes: [
            {
              distance: 3000,
              duration: 300,
              geometry: { coordinates: points.map((p) => [p.lng, p.lat]) },
              legs: [
                { distance: 1000, duration: 100, steps: [{ mode: 'walking' }] },
                { distance: 2000, duration: 200, steps: [{ mode: 'walking' }, { mode: 'ferry' }] },
              ],
            },
          ],
        }),
      ),
    );
    const { router } = setup({ routing_base_url: 'http://router.internal' });
    const route = await router.route(1, 1, 0, points, 'walking', [], { footOnly: true });
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(expect.stringContaining('steps=true'), expect.anything());
    expect(route.ferryLegs).toEqual([1]);
    expect(route.parts).toEqual([
      { distance: 1000, duration: 100 },
      { distance: 2000, duration: 200 },
    ]);
    // The same points asked without the option are another question, answered without ferries named.
    const plain = router.route(1, 1, 0, points, 'walking', []);
    await vi.runAllTimersAsync();
    expect(await plain).not.toHaveProperty('ferryLegs');
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(
      expect.stringContaining('steps=false'),
      expect.anything(),
    );
  });

  it('falls back to OSRM on foot when Valhalla fails, and leaves a drive as it was', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response('', { status: 503 }));
    const pending = setup().router.route(1, 1, 0, points, 'walking', [], { footOnly: true });
    await vi.runAllTimersAsync();
    expect((await pending).ferryLegs).toEqual([]);
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(
      expect.stringContaining('routed-foot'),
      expect.anything(),
    );

    const drive = await setup().router.route(1, 1, 0, points, 'driving', [], { footOnly: true });
    expect(drive).not.toHaveProperty('ferryLegs');
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(expect.stringContaining('routed-car'), expect.anything());
  });
});

describe('server Roadtrip router, a hike: its costing, heights and ways', () => {
  const hikeLeg = {
    shape: valhallaPolyline([
      [48, 10],
      [49, 11],
    ]),
    summary: { length: 2.5, time: 1800 },
  };
  const costingOptions = { max_hiking_difficulty: 3, step_penalty: 600 };
  const bodyOf = (call: number) =>
    JSON.parse((vi.mocked(safeFetchAdminConfigured).mock.calls[call][1] as { body: string }).body) as Record<
      string,
      unknown
    >;
  const line = (count: number) => Array.from({ length: count }, (_, index): [number, number] => [47 + index / 1e4, 11]);
  /** Valhalla's /height answer for whatever piece it was asked about: a metre a point of the line, from 500. */
  const heightAnswer = (init: RequestInit | undefined) => {
    const body = JSON.parse(String(init?.body)) as { shape: Array<{ lat: number }> };
    return new Response(
      JSON.stringify({
        range_height: body.shape.map((point, index) => [index, 500 + Math.round((point.lat - 47) * 1e4)]),
      }),
    );
  };
  const heightsByIndex = () =>
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async (_url, init) => heightAnswer(init));
  /** Every question answered with `answer`, the router asked through the queue until it is done. */
  const failing = (answer: () => Response | Promise<Response>) =>
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => answer());
  const settled = async <T>(pending: Promise<T>): Promise<T> => {
    await vi.runAllTimersAsync();
    return await pending;
  };

  it('ROUTER-HIKE-001: asks Valhalla on foot with exactly the hike costing, no point bound off the boats, and keeps it apart in the cache', async () => {
    vi.mocked(safeFetchAdminConfigured).mockImplementation(
      async () => new Response(JSON.stringify({ trip: { legs: [hikeLeg] } })),
    );
    const { router } = setup();
    const route = await router.route(1, 1, 0, points.slice(0, 2), 'walking', [], { costingOptions });
    const [url] = vi.mocked(safeFetchAdminConfigured).mock.calls[0];
    expect(url).toBe('https://valhalla1.openstreetmap.de/route');
    const body = bodyOf(0);
    expect(body.costing).toBe('pedestrian');
    expect(body.costing_options).toEqual({ pedestrian: costingOptions });
    expect((body.locations as Array<Record<string, unknown>>).every((location) => !('search_filter' in location))).toBe(
      true,
    );
    expect(route.parts).toEqual([{ distance: 2500, duration: 1800 }]);
    expect(route).not.toHaveProperty('ferryLegs');
    // The same hike again comes from the cache; the same points as a city walk or with another limit are other questions.
    await router.route(1, 1, 0, points.slice(0, 2), 'walking', [], { costingOptions });
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
    const other = router.route(1, 1, 0, points.slice(0, 2), 'walking', [], {
      costingOptions: { ...costingOptions, max_hiking_difficulty: 4 },
    });
    await vi.runAllTimersAsync();
    await other;
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
    const walk = await settled(router.route(1, 1, 0, points.slice(0, 2), 'walking', [], { footOnly: true }));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(3);
    expect(bodyOf(2).costing_options).toEqual({ pedestrian: { use_ferry: 0 } });
    expect(walk.ferryLegs).toEqual([]);
  });

  it('ROUTER-HIKE-002: refuses a hike where there is no Valhalla to ask, and never falls back to OSRM', async () => {
    const { router } = setup({ routing_base_url: 'http://router.internal' });
    const refused = router.route(1, 1, 0, points, 'walking', [], { costingOptions });
    await expect(refused).rejects.toBeInstanceOf(RouteRefusal);
    await expect(refused).rejects.toMatchObject({ why: 'no_valhalla' });
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();

    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(setup().router.route(1, 1, 0, points, 'walking', [], { costingOptions })).rejects.toThrow(
      'Routing provider returned 503',
    );
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
  });

  it('ROUTER-HIKE-003: reads Valhalla saying no way joins the points as a refusal, and any other 400 as a failure', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(JSON.stringify({ error_code: 442, error: 'No path could be found for input' }), { status: 400 }),
    );
    await expect(setup().router.route(1, 1, 0, points, 'walking', [], { costingOptions })).rejects.toMatchObject({
      name: 'RouteRefusal',
      why: 'no_way',
    });
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(JSON.stringify({ error_code: 150, error: 'Exceeded max locations' }), { status: 400 }),
    );
    const failure: unknown = await setup()
      .router.route(1, 1, 0, points, 'walking', [], { costingOptions })
      .catch((err: unknown) => err);
    expect(failure).not.toBeInstanceOf(RouteRefusal);
    expect(failure).toMatchObject({ message: 'Routing provider returned 400' });
    // A way past the instance's distance limit is refused for its length, which asking again does not change.
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(JSON.stringify({ error_code: 154, error: 'Path distance exceeds the max distance limit' }), {
        status: 400,
      }),
    );
    await expect(setup().router.route(1, 1, 0, points, 'walking', [], { costingOptions })).rejects.toMatchObject({
      name: 'RouteRefusal',
      why: 'too_long',
    });
    // A 400 that names no code of Valhalla's is a failure of the host as well.
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response('Bad request', { status: 400 }));
    const unread: unknown = await setup()
      .router.route(1, 1, 0, points, 'walking', [], { costingOptions })
      .catch((err: unknown) => err);
    expect(unread).not.toBeInstanceOf(RouteRefusal);
    expect(unread).toMatchObject({ message: 'Routing provider returned 400' });
  });

  it('ROUTER-HIKE-004: leaves a city walk falling back to OSRM on a refusal, and a drive untouched by a hike costing', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(JSON.stringify({ error_code: 171 }), { status: 400 }),
    );
    const walk = setup().router.route(1, 1, 0, points, 'walking', [], { footOnly: true });
    await vi.runAllTimersAsync();
    expect((await walk).parts).toHaveLength(2);
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(
      expect.stringContaining('routed-foot'),
      expect.anything(),
    );

    await setup().router.route(1, 1, 0, points, 'driving', [], { costingOptions });
    expect(safeFetchAdminConfigured).toHaveBeenLastCalledWith(expect.stringContaining('routed-car'), expect.anything());
  });

  it('ROUTER-HIKE-005: reads the heights in pieces of 500 that overlap by one, through the paced queue', async () => {
    heightsByIndex();
    const pending = setup().router.heights(1, line(1000));
    await vi.runAllTimersAsync();
    const measured = await pending;
    const calls = vi.mocked(safeFetchAdminConfigured).mock.calls;
    expect(calls.map(([url]) => url)).toEqual(Array(3).fill('https://valhalla1.openstreetmap.de/height'));
    expect([0, 1, 2].map((call) => (bodyOf(call).shape as unknown[]).length)).toEqual([500, 500, 2]);
    expect(bodyOf(0).range).toBe(true);
    expect((bodyOf(1).shape as Array<{ lat: number; lon: number }>)[0]).toEqual({ lat: 47 + 499 / 1e4, lon: 11 });
    expect(measured).toHaveLength(1000);
    expect(measured?.[0]).toEqual([47, 11, 500]);
    expect(measured?.[999]).toEqual([47 + 999 / 1e4, 11, 1499]);
    expect(measured?.every((point) => point.length === 3)).toBe(true);

    // A line whose last piece would hold only the point the one before ended at asks no third time.
    vi.mocked(safeFetchAdminConfigured).mockClear();
    const shorter = setup().router.heights(1, line(999));
    await vi.runAllTimersAsync();
    expect((await shorter)?.at(-1)).toEqual([47 + 998 / 1e4, 11, 1498]);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
  });

  it('ROUTER-HIKE-006: keeps the height the overlapping point already has, and a point without one flat', async () => {
    heightsByIndex();
    let calls = 0;
    vi.mocked(safeFetchAdminConfigured).mockImplementationOnce(async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body)) as { shape: unknown[] };
      // The terrain data has no height for the second point.
      return new Response(
        JSON.stringify({ range_height: body.shape.map((_, index) => [index, index === 1 ? null : 7]) }),
      );
    });
    const pending = setup().router.heights(1, line(501));
    await vi.runAllTimersAsync();
    const measured = await pending;
    expect(calls).toBe(1);
    expect(measured?.[1]).toEqual([47 + 1 / 1e4, 11]);
    expect(measured?.[499]).toEqual([47 + 499 / 1e4, 11, 7]);
    expect(measured?.[500]).toEqual([47 + 500 / 1e4, 11, 1000]);
  });

  it('ROUTER-HIKE-007: stops reading heights at a piece that fails twice or twice does not name every point', async () => {
    const failures = [
      () => failing(() => new Response('', { status: 503 })),
      () => failing(() => new Response(JSON.stringify({ range_height: [[0, 500]] }))),
      () => failing(() => new Response(JSON.stringify({ heights: [1, 2, 3] }))),
      () => vi.mocked(safeFetchAdminConfigured).mockRejectedValue(new Error('socket hang up')),
      // A transport that rejects with a bare value.
      () => vi.mocked(safeFetchAdminConfigured).mockRejectedValue('socket hang up'),
    ];
    // One failure after the other: what each read gave, and how often the host was asked for it.
    const reads = await failures.reduce<Promise<unknown[]>>(async (before, fail) => {
      const done = await before;
      vi.mocked(safeFetchAdminConfigured).mockReset();
      fail();
      const read = await settled(setup().router.heights(1, line(3)));
      return [...done, [read, vi.mocked(safeFetchAdminConfigured).mock.calls.length]];
    }, Promise.resolve([]));
    expect(reads).toEqual(failures.map(() => [line(3), 2]));
  });

  it('ROUTER-HIKE-011: asks a failed piece once more, and stops at one that fails again, the points after it flat', async () => {
    let asked = 0;
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async (_url, init) => {
      asked += 1;
      return asked === 1 ? heightAnswer(init) : new Response('', { status: 503 });
    });
    const measured = await settled(setup().router.heights(1, line(1000)));
    // The first piece, the second, and the second again; the third is never asked.
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(3);
    expect(measured).toHaveLength(1000);
    expect(measured?.slice(0, 500).every((point) => point.length === 3)).toBe(true);
    expect(measured?.slice(500).every((point) => point.length === 2)).toBe(true);
    expect(measured?.[499]).toEqual([47 + 499 / 1e4, 11, 999]);

    // A piece that fails once and answers when asked again is read.
    vi.mocked(safeFetchAdminConfigured).mockClear();
    heightsByIndex().mockResolvedValueOnce(new Response('', { status: 429 }));
    const again = await settled(setup().router.heights(1, line(3)));
    expect(again?.every((point) => point.length === 3)).toBe(true);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
  });

  it('ROUTER-HIKE-012: keeps a line read whole for five minutes per user, and asks again for one read in part', async () => {
    heightsByIndex();
    const { router } = setup();
    const first = await settled(router.heights(1, line(3)));
    expect(first?.every((point) => point.length === 3)).toBe(true);
    expect(await router.heights(1, line(3))).toEqual(first);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);

    // Another user, another line, and the same line five minutes on are asked again.
    await settled(router.heights(2, line(3)));
    await settled(router.heights(1, line(4)));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(300_001);
    await settled(router.heights(1, line(3)));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(4);

    // A line read in part is not kept: the next question asks the host again.
    failing(() => new Response('', { status: 502 })).mockClear();
    expect(await settled(router.heights(1, line(5)))).toEqual(line(5));
    heightsByIndex().mockClear();
    expect((await settled(router.heights(1, line(5))))?.every((point) => point.length === 3)).toBe(true);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);

    // Only the twenty lines read last are kept; the first of them is asked again.
    vi.mocked(safeFetchAdminConfigured).mockClear();
    // The router's one queue answers them in the order asked.
    const counts = Array.from({ length: 21 }, (_, index) => 10 + index);
    await settled(Promise.all(counts.map((count) => router.heights(3, line(count)))));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(21);
    await settled(router.heights(3, line(30)));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(21);
    await settled(router.heights(3, line(10)));
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(22);
  });

  it('ROUTER-HIKE-008: asks no heights without a Valhalla or a line to measure', async () => {
    expect(await setup({ routing_base_url: 'http://router.internal' }).router.heights(1, line(3))).toBeNull();
    expect(await setup().router.heights(1, line(1))).toBeNull();
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('ROUTER-HIKE-009: describes the ways under a line, matched on foot with every grade open, thinned to 4000 points', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          edges: [{ way_id: 11, length: 0.25 }, { way_id: 0, length: 0.1 }, { length: 0.05 }, { way_id: 12 }],
        }),
      ),
    );
    const { router } = setup({ valhalla_base_url: 'https://valhalla.internal/' });
    const ways = await router.wayIds(1, line(9001));
    expect(vi.mocked(safeFetchAdminConfigured).mock.calls[0][0]).toBe('https://valhalla.internal/trace_attributes');
    const body = bodyOf(0);
    expect(body).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
      shape_match: 'map_snap',
      filters: { attributes: ['edge.way_id', 'edge.length'], action: 'include' },
    });
    const shape = body.shape as Array<{ lat: number; lon: number }>;
    expect(shape.length).toBeLessThanOrEqual(4000);
    expect(shape[0]).toEqual({ lat: 47, lon: 11 });
    expect(shape.at(-1)).toEqual({ lat: 47 + 9000 / 1e4, lon: 11 });
    expect(ways).toEqual([
      { wayId: 11, metres: 250 },
      { wayId: null, metres: 100 },
      { wayId: null, metres: 50 },
    ]);
  });

  it('ROUTER-HIKE-010: refuses to describe a line without a Valhalla, and an answer of another kind', async () => {
    await expect(setup({ routing_base_url: 'http://router.internal' }).router.wayIds(1, line(3))).rejects.toMatchObject(
      {
        why: 'no_valhalla',
      },
    );
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(new Response(JSON.stringify({ edges: 'none' })));
    await expect(setup().router.wayIds(1, line(3))).rejects.toThrow();
  });
});

describe('server Roadtrip router: other ways on foot (RTE-02)', () => {
  const trip = (points: Array<[number, number]>) => ({
    legs: [{ shape: valhallaPolyline(points), summary: { length: 1.2, time: 900 } }],
  });

  it('ROUTER-WAYS-001: asks Valhalla once on foot under the hike’s costing, its own way first', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          trip: trip([
            [47, 11],
            [47.01, 11.01],
          ]),
          alternates: [
            {
              trip: trip([
                [47, 11],
                [47.02, 11],
                [47.01, 11.01],
              ]),
            },
          ],
        }),
      ),
    );
    const { router } = setup({ valhalla_base_url: 'https://valhalla.internal/' });
    const ways = await router.alternatesOnFoot(
      1,
      { lat: 47, lng: 11 },
      { lat: 47.01, lng: 11.01 },
      { max_hiking_difficulty: 3 },
      3,
    );
    expect(ways).toEqual([
      [
        [47, 11],
        [47.01, 11.01],
      ],
      [
        [47, 11],
        [47.02, 11],
        [47.01, 11.01],
      ],
    ]);
    const [url, init] = vi.mocked(safeFetchAdminConfigured).mock.calls[0] ?? [];
    expect(url).toBe('https://valhalla.internal/route');
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 3 } },
      alternates: 3,
      locations: [
        { lat: 47, lon: 11 },
        { lat: 47.01, lon: 11.01 },
      ],
    });
  });

  it('ROUTER-WAYS-002: an answer without alternates is the one way; no Valhalla refuses before asking', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          trip: trip([
            [47, 11],
            [47.01, 11.01],
          ]),
        }),
      ),
    );
    const ways = await setup().router.alternatesOnFoot(1, { lat: 47, lng: 11 }, { lat: 47.01, lng: 11.01 }, {}, 0);
    expect(ways).toHaveLength(1);
    const body = JSON.parse(String((vi.mocked(safeFetchAdminConfigured).mock.calls[0]?.[1] as RequestInit).body));
    expect(body.alternates).toBeUndefined();
    vi.mocked(safeFetchAdminConfigured).mockClear();
    await expect(
      setup({ routing_base_url: 'http://router.internal' }).router.alternatesOnFoot(
        1,
        { lat: 47, lng: 11 },
        { lat: 47.01, lng: 11.01 },
        {},
        3,
      ),
    ).rejects.toMatchObject({ why: 'no_valhalla' });
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });
});

describe('server Roadtrip router through the TREK services (routing relay)', () => {
  const answer = (status: number, body: unknown): ValhallaRelayAnswer => ({
    status,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(body)),
  });
  const tolled = {
    trip: {
      legs: [
        {
          shape: valhallaPolyline([
            [48, 10],
            [49, 11],
          ]),
          summary: { length: 25, time: 1200, has_toll: false },
        },
      ],
    },
  };
  const settled = async <T>(pending: Promise<T>): Promise<T> => {
    await vi.runAllTimersAsync();
    return await pending;
  };

  beforeEach(() => relay.trekValhalla.mockReturnValue(TREK_VALHALLA));

  it('ROUTER-RELAY-001: asks the TREK Valhalla through the relay by default, under the asking user', async () => {
    relay.ask.mockResolvedValueOnce(answer(200, tolled));
    const route = await setup().router.route(7, 1, 1, points.slice(0, 2), 'driving', ['toll']);
    expect(route.avoidMissed).toEqual([]);
    expect(relay.ask).toHaveBeenCalledTimes(1);
    const [userId, action, body] = relay.ask.mock.calls[0] as [number, string, { costing: string }];
    expect([userId, action, body.costing]).toEqual([7, 'route', 'auto']);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('ROUTER-RELAY-002: hands the question to FOSSGIS where the relay cannot answer', async () => {
    const refusals = [
      () => Promise.resolve(answer(429, { error: 'Too many routing requests' })),
      () => Promise.resolve(answer(502, { error: 'down' })),
      () => Promise.resolve(answer(503, { error: 'The TREK routing service is resting' })),
      () => Promise.resolve(answer(404, { error: 'Not Found' })),
      () => Promise.reject(new DomainError(503, 'The TREK routing service is not available on this instance')),
    ];
    await oneByOne([...refusals.entries()], async ([userId, refusal]) => {
      vi.mocked(safeFetchAdminConfigured)
        .mockReset()
        .mockResolvedValueOnce(new Response(JSON.stringify(tolled)));
      relay.ask.mockReset().mockImplementationOnce(refusal);
      const route = await settled(setup().router.route(userId, 1, 1, points.slice(0, 2), 'driving', ['toll']));
      expect(route.avoidMissed).toEqual([]);
      expect(vi.mocked(safeFetchAdminConfigured).mock.calls[0][0]).toBe('https://valhalla1.openstreetmap.de/route');
    });
  });

  it('ROUTER-RELAY-003: reads the TREK Valhalla saying no way joins the points as a refusal, and fails on any other error', async () => {
    const costingOptions = { max_hiking_difficulty: 3 };
    relay.ask.mockResolvedValueOnce(answer(400, { error_code: 442, error: 'No path could be found for input' }));
    const refused = setup().router.route(1, 1, 0, points.slice(0, 2), 'walking', [], { costingOptions });
    await expect(refused).rejects.toMatchObject({ why: 'no_way' });

    relay.ask.mockRejectedValueOnce(new Error('socket hang up'));
    await expect(setup().router.route(1, 1, 0, points.slice(0, 2), 'walking', [], { costingOptions })).rejects.toThrow(
      'socket hang up',
    );
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('ROUTER-RELAY-004: an admin choice of FOSSGIS or an own Valhalla never reaches the relay', async () => {
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => new Response(JSON.stringify(tolled)));
    await setup({ routing_valhalla_provider: 'fossgis' }).router.route(1, 1, 1, points.slice(0, 2), 'driving', [
      'toll',
    ]);
    expect(vi.mocked(safeFetchAdminConfigured).mock.calls[0][0]).toBe('https://valhalla1.openstreetmap.de/route');
    await settled(
      setup({ valhalla_base_url: 'https://valhalla.internal' }).router.route(2, 1, 1, points.slice(0, 2), 'driving', [
        'toll',
      ]),
    );
    expect(vi.mocked(safeFetchAdminConfigured).mock.calls[1][0]).toBe('https://valhalla.internal/route');
    expect(relay.ask).not.toHaveBeenCalled();
  });

  it('ROUTER-RELAY-005: an own OSRM alone asks no Valhalla, unless the admin picked the TREK services', async () => {
    const own = { routing_base_url: 'http://router.internal' };
    await setup(own).router.route(1, 1, 1, points, 'driving', ['toll']);
    expect(relay.ask).not.toHaveBeenCalled();

    relay.ask.mockResolvedValueOnce(answer(200, tolled));
    await setup({ ...own, routing_valhalla_provider: 'trek' }).router.route(1, 1, 1, points.slice(0, 2), 'driving', [
      'toll',
    ]);
    expect(relay.ask).toHaveBeenCalledTimes(1);
  });

  it('ROUTER-RELAY-006: reads heights and the ways under a line through the relay', async () => {
    relay.ask.mockImplementation(async (_userId, action, body) =>
      action === 'height'
        ? answer(200, {
            range_height: (body as { shape: unknown[] }).shape.map((_point, index) => [index, 400 + index]),
          })
        : answer(200, { edges: [{ way_id: 5, length: 0.3 }] }),
    );
    const { router } = setup();
    const line: Array<[number, number]> = [
      [47, 11],
      [47.001, 11],
      [47.002, 11],
    ];
    expect(await router.heights(3, line)).toEqual([
      [47, 11, 400],
      [47.001, 11, 401],
      [47.002, 11, 402],
    ]);
    expect(await router.wayIds(3, line)).toEqual([{ wayId: 5, metres: 300 }]);
    expect(relay.ask.mock.calls.map(([userId, action]) => [userId, action])).toEqual([
      [3, 'height'],
      [3, 'trace_attributes'],
    ]);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });
});

describe('server Roadtrip router: every day through Valhalla where it routes the days', () => {
  type RouteBody = { locations: Array<{ lat: number; lon: number }>; costing: string; costing_options: unknown };
  /** Valhalla's answer to a route body: one leg per pair of its locations, a kilometre and a minute each. */
  const legsFor = (body: RouteBody) =>
    valhallaRoute(
      body.locations.slice(1).map((to, index) => ({
        line: [
          [body.locations[index].lat, body.locations[index].lon],
          [to.lat, to.lon],
        ],
        km: 1,
        seconds: 60,
      })),
    );
  const answer = (status: number, body: unknown): ValhallaRelayAnswer => ({
    status,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(body)),
  });
  const day = (count: number) => Array.from({ length: count }, (_, index) => ({ lat: 47 + index / 100, lng: 11 }));
  const settled = async <T>(pending: Promise<T>): Promise<T> => {
    await vi.runAllTimersAsync();
    return await pending;
  };
  const relayBodies = () => relay.ask.mock.calls.map((call) => call[2] as RouteBody);
  const bodyOf = (init: RequestInit | undefined) => JSON.parse(String(init?.body)) as RouteBody;

  describe('with the TREK services', () => {
    beforeEach(() => {
      relay.trekValhalla.mockReturnValue(TREK_VALHALLA);
      relay.ask.mockImplementation(async (_userId, _action, body) => answer(200, legsFor(body as RouteBody)));
    });

    it.each([
      ['driving', 'auto'],
      ['walking', 'pedestrian'],
      ['cycling', 'bicycle'],
    ])(
      'ROUTER-DAY-001: routes a %s day that avoids nothing through the relay as %s, OSRM never asked',
      async (mode, costing) => {
        const route = await settled(setup().router.route(4, 1, 1, points, mode, []));
        expect(relayBodies().map((body) => [body.costing, body.costing_options, body.locations.length])).toEqual([
          [costing, { [costing]: {} }, 3],
        ]);
        expect(route.parts).toEqual([
          { distance: 1000, duration: 60 },
          { distance: 1000, duration: 60 },
        ]);
        expect(route.avoidMissed).toEqual([]);
        expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
      },
    );

    it('ROUTER-DAY-002: asks twenty locations at a time, each piece starting where the one before ended', async () => {
      const route = await settled(setup().router.route(4, 1, 1, day(25), 'driving', []));
      const asked = relayBodies().map((body) => body.locations);
      expect(asked.map((locations) => locations.length)).toEqual([20, 6]);
      expect(asked[1][0]).toEqual(asked[0][19]);
      expect(route.parts).toHaveLength(24);
    });

    it('ROUTER-DAY-003: routes the whole day with OSRM where the relay cannot answer, never with FOSSGIS', async () => {
      const refusals = [
        () => Promise.resolve(answer(401, { error: 'Unauthorized' })),
        () => Promise.resolve(answer(403, { error: 'Forbidden' })),
        () => Promise.resolve(answer(413, { error: 'Payload too large' })),
        () => Promise.resolve(answer(429, { error: 'Too many routing requests' })),
        () => Promise.resolve(answer(502, { error: 'The TREK routing service did not answer' })),
        () => Promise.resolve(answer(503, { error: 'The TREK routing service is resting' })),
        () => Promise.reject(new DomainError(503, 'The TREK routing service is not available on this instance')),
      ];
      await oneByOne([...refusals.entries()], async ([userId, refusal]) => {
        vi.mocked(safeFetchAdminConfigured).mockClear();
        relay.ask.mockReset().mockImplementationOnce(refusal);
        const route = await settled(setup().router.route(userId, 1, 1, points, 'driving', []));
        expect(route.parts.map((part) => part.duration)).toEqual([100, 200]);
        const asked = vi.mocked(safeFetchAdminConfigured).mock.calls.map(([url]) => String(url));
        expect(asked).toHaveLength(1);
        expect(asked[0]).toContain('routing.openstreetmap.de/routed-car');
      });
    });

    it('ROUTER-DAY-004: routes the whole day with OSRM where Valhalla finds no way for one of its legs', async () => {
      relay.ask.mockResolvedValueOnce(answer(400, { error_code: 442, error: 'No path could be found for input' }));
      const route = await settled(setup().router.route(4, 1, 1, points, 'walking', []));
      expect(route.parts.map((part) => part.duration)).toEqual([100, 200]);
      expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
      expect(safeFetchAdminConfigured).toHaveBeenCalledWith(
        expect.stringContaining('routed-foot/route/v1/foot/'),
        expect.anything(),
      );
    });

    it('ROUTER-DAY-005: a day that avoids something keeps FOSSGIS behind the relay and its ten locations', async () => {
      relay.ask.mockReset().mockResolvedValue(answer(503, { error: 'The TREK routing service is resting' }));
      vi.mocked(safeFetchAdminConfigured).mockImplementation(
        async (_url, init) => new Response(JSON.stringify(legsFor(bodyOf(init)))),
      );
      const route = await settled(setup().router.route(4, 1, 1, day(12), 'driving', ['toll']));
      expect(relayBodies().map((body) => body.locations.length)).toEqual([10, 3]);
      expect(vi.mocked(safeFetchAdminConfigured).mock.calls.map(([url]) => url)).toEqual(
        Array(2).fill('https://valhalla1.openstreetmap.de/route'),
      );
      expect(route.parts).toHaveLength(11);
      expect(route.avoidMissed).toEqual([]);
    });

    it('ROUTER-DAY-008: keeps no OSRM stand-in, so the same day asks the relay again once it is back', async () => {
      const { router } = setup();
      relay.ask.mockResolvedValueOnce(answer(502, { error: 'The TREK routing service did not answer' }));
      const fallen = await settled(router.route(4, 1, 1, points, 'driving', []));
      expect(fallen.parts.map((part) => part.duration)).toEqual([100, 200]);

      const back = await settled(router.route(4, 1, 1, points, 'driving', []));
      expect(back.parts.map((part) => part.duration)).toEqual([60, 60]);
      expect(relay.ask).toHaveBeenCalledTimes(2);

      expect(await settled(router.route(4, 1, 1, points, 'driving', []))).toBe(back);
      expect(relay.ask).toHaveBeenCalledTimes(2);
    });

    it('ROUTER-DAY-009: a day routed with the key is not served from the cache once the key is gone', async () => {
      const { router } = setup();
      await settled(router.route(4, 1, 1, points, 'driving', []));
      relay.trekValhalla.mockReturnValue(null);
      const plain = await settled(router.route(4, 1, 1, points, 'driving', []));
      expect(plain.parts.map((part) => part.duration)).toEqual([100, 200]);
      expect(relay.ask).toHaveBeenCalledTimes(1);
    });

    it('ROUTER-DAY-010: a walk kept off the boats goes to FOSSGIS where the relay cannot answer, as only Valhalla can plan it', async () => {
      relay.ask.mockReset().mockResolvedValue(answer(503, { error: 'The TREK routing service is resting' }));
      vi.mocked(safeFetchAdminConfigured).mockImplementation(
        async (_url, init) => new Response(JSON.stringify(legsFor(bodyOf(init)))),
      );
      const route = await settled(setup().router.route(4, 1, 1, points, 'walking', [], { footOnly: true }));
      expect(vi.mocked(safeFetchAdminConfigured).mock.calls.map(([url]) => url)).toEqual([
        'https://valhalla1.openstreetmap.de/route',
      ]);
      expect(route.ferryLegs).toEqual([]);
    });
  });

  it('ROUTER-DAY-006: an own Valhalla routes every day in pieces of twenty, and OSRM the day it cannot answer', async () => {
    const own = (url: unknown) => String(url).startsWith('https://valhalla.internal');
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async (url, init) =>
      own(url) ? new Response(JSON.stringify(legsFor(bodyOf(init)))) : osrm(),
    );
    const { router } = setup({ valhalla_base_url: 'https://valhalla.internal' });
    const route = await settled(router.route(1, 1, 1, day(21), 'cycling', []));
    const asked = vi
      .mocked(safeFetchAdminConfigured)
      .mock.calls.map(([url, init]) => [url, bodyOf(init).locations.length]);
    expect(asked).toEqual([
      ['https://valhalla.internal/route', 20],
      ['https://valhalla.internal/route', 2],
    ]);
    expect(route.parts).toHaveLength(20);

    vi.mocked(safeFetchAdminConfigured)
      .mockClear()
      .mockImplementation(async (url) => (own(url) ? new Response('', { status: 502 }) : osrm()));
    const fallen = await settled(router.route(2, 1, 1, points, 'driving', []));
    expect(fallen.parts.map((part) => part.duration)).toEqual([100, 200]);
    const urls = vi.mocked(safeFetchAdminConfigured).mock.calls.map(([url]) => url);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe('https://valhalla.internal/route');
    expect(urls[1]).toContain('routing.openstreetmap.de/routed-car');
    expect(relay.ask).not.toHaveBeenCalled();
  });

  it('ROUTER-DAY-007: with FOSSGIS chosen, a day that avoids nothing stays with OSRM as before', async () => {
    relay.trekValhalla.mockReturnValue(TREK_VALHALLA);
    const { router } = setup({ routing_valhalla_provider: 'fossgis' });
    const route = await settled(router.route(1, 1, 1, points, 'driving', []));
    expect(route.parts.map((part) => part.duration)).toEqual([100, 200]);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
    expect(safeFetchAdminConfigured).toHaveBeenCalledWith(expect.stringContaining('routed-car'), expect.anything());
    expect(relay.ask).not.toHaveBeenCalled();
  });
});
