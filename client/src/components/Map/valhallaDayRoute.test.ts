import { encodePolyline6 } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../tests/helpers/msw/server';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings, Waypoint } from '../../types';
import { calculateAlternatives, calculateRouteWithLegs, routeEngineFor } from './RouteCalculator';
import { resetValhallaTurns } from './valhallaRoute';

const RELAY = '/api/routing/valhalla/route';
const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de/route';
const OWN_VALHALLA = 'https://valhalla.example.org';
const OSRM = {
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
} as const;
const PROFILES = [
  ['driving', 'auto'],
  ['walking', 'pedestrian'],
  ['cycling', 'bicycle'],
] as const;

type Point = { lat: number; lon: number };
type RouteBody = { locations: Point[]; costing: string; costing_options: unknown; alternates?: number };

let seed = 0;
/** Points no other test asked for, so neither route cache answers in their place. */
function freshDay(count: number): Waypoint[] {
  seed += 1;
  return Array.from({ length: count }, (_, i) => ({ lat: 40 + seed / 100, lng: 5 + i / 100 }));
}

/** Valhalla's trip through some points: one leg per pair, two kilometres and five minutes each. */
function valhallaTrip(points: Point[]) {
  const legs = points.slice(1).map((to, i) => ({
    shape: encodePolyline6([points[i], to]),
    summary: { length: 2, time: 300, has_toll: false, has_highway: false, has_ferry: false },
  }));
  return { legs, summary: { length: 2 * legs.length, time: 300 * legs.length } };
}

/** OSRM's answer for a request's coordinates: one leg per pair, a kilometre and two minutes each. */
function osrmAnswer(coords: string) {
  const points = coords.split(';').map((pair) => pair.split(',').map(Number));
  const legs = points.slice(1).map(() => ({ distance: 1000, duration: 120 }));
  return {
    code: 'Ok',
    routes: [{ geometry: { coordinates: points }, distance: 1000 * legs.length, duration: 120 * legs.length, legs }],
    waypoints: points.map((location) => ({ location, distance: 0 })),
  };
}

interface Traffic {
  relay: RouteBody[];
  fossgis: RouteBody[];
  own: RouteBody[];
  osrm: string[];
}

const answered = (body: RouteBody) => HttpResponse.json({ trip: valhallaTrip(body.locations) });

/** Every routing host answering, the relay as `relay` says; what each was asked is recorded. */
function listen(relay: (body: RouteBody) => Response = answered): Traffic {
  const traffic: Traffic = { relay: [], fossgis: [], own: [], osrm: [] };
  const valhalla =
    (asked: RouteBody[], answer: (body: RouteBody) => Response) =>
    async ({ request }: { request: Request }) => {
      const body = (await request.json()) as RouteBody;
      asked.push(body);
      return answer(body);
    };
  server.use(
    http.post(RELAY, valhalla(traffic.relay, relay)),
    http.post(FOSSGIS_VALHALLA, valhalla(traffic.fossgis, answered)),
    http.post(`${OWN_VALHALLA}/route`, valhalla(traffic.own, answered)),
    ...Object.values(OSRM).map((base) =>
      http.get(`${base}/:coords`, ({ request, params }) => {
        traffic.osrm.push(request.url);
        return HttpResponse.json(osrmAnswer(String(params.coords)));
      })
    )
  );
  return traffic;
}

const choose = (patch: Partial<Settings>) =>
  useSettingsStore.setState((st) => ({ settings: { ...st.settings, ...patch } }));

afterEach(() => {
  choose({ routing_valhalla_provider: '', valhalla_base_url: '', routing_base_url: '' });
  resetValhallaTurns();
  vi.restoreAllMocks();
});

describe('which engine routes a day', () => {
  it.each(PROFILES)('VDAY-ENGINE-001: the TREK services and an own Valhalla route every %s day', (profile) => {
    choose({ routing_valhalla_provider: 'trek' });
    expect([routeEngineFor(profile, []), routeEngineFor(profile, ['toll'])]).toEqual(['valhalla', 'valhalla']);
    choose({ routing_valhalla_provider: '', valhalla_base_url: OWN_VALHALLA });
    expect([routeEngineFor(profile, []), routeEngineFor(profile, ['toll'])]).toEqual(['valhalla', 'valhalla']);
    choose({ routing_valhalla_provider: 'custom' });
    expect(routeEngineFor(profile, [])).toBe('valhalla');
  });

  it.each(PROFILES)('VDAY-ENGINE-002: with FOSSGIS a %s day goes to Valhalla only to avoid by car', (profile) => {
    choose({ routing_valhalla_provider: 'fossgis' });
    expect(routeEngineFor(profile, [])).toBe('osrm');
    expect(routeEngineFor(profile, ['toll'])).toBe(profile === 'driving' ? 'valhalla' : 'osrm');
  });

  it('VDAY-ENGINE-003: an own OSRM alone keeps every day, and a plugin its own', () => {
    choose({ routing_base_url: 'https://osrm.example.org' });
    expect(PROFILES.map(([profile]) => routeEngineFor(profile, ['toll']))).toEqual(['osrm', 'osrm', 'osrm']);
    choose({ routing_valhalla_provider: 'trek' });
    expect(routeEngineFor('plugin:ev/fast', [])).toBe('plugin');
  });

  it('VDAY-ENGINE-004: while the relay rests the days stay planned with Valhalla, and OSRM draws them and says so', async () => {
    const traffic = listen(() => HttpResponse.json({ error: 'resting' }, { status: 503 }));
    expect((await calculateRouteWithLegs(freshDay(2), { profile: 'driving' })).engine).toBe('osrm');
    expect((await calculateRouteWithLegs(freshDay(2), { profile: 'driving' })).engine).toBe('osrm');
    expect(routeEngineFor('driving', [])).toBe('valhalla');
    expect([traffic.relay.length, traffic.osrm.length]).toEqual([1, 2]);
  });
});

describe('a day where Valhalla routes the days', () => {
  it.each(PROFILES)('VDAY-001: a %s day goes to the relay as %s, OSRM never asked', async (profile, costing) => {
    const traffic = listen();
    const route = await calculateRouteWithLegs(freshDay(3), { profile });

    expect(traffic.relay.map((body) => [body.costing, body.costing_options, body.locations.length])).toEqual([
      [costing, { [costing]: {} }, 3],
    ]);
    expect(traffic.osrm).toEqual([]);
    expect(traffic.fossgis).toEqual([]);
    expect([route.distance, route.duration, route.legs.length, route.snapped?.length]).toEqual([4000, 600, 2, 3]);
    expect(route.legs[0]).toMatchObject({ distanceText: '2 km', durationText: '5 min' });
    expect(route).not.toHaveProperty('avoidance');
    expect(route.engine).toBe('valhalla');
  });

  it('VDAY-002: the relay takes twenty locations a request, an own Valhalla too', async () => {
    let traffic = listen();
    await calculateRouteWithLegs(freshDay(12), { profile: 'driving' });
    expect(traffic.relay.map((body) => body.locations.length)).toEqual([12]);

    choose({ valhalla_base_url: OWN_VALHALLA });
    traffic = listen();
    const route = await calculateRouteWithLegs(freshDay(25), { profile: 'cycling' });
    const asked = traffic.own.map((body) => body.locations);
    expect(asked.map((locations) => locations.length)).toEqual([20, 6]);
    expect(asked[1][0]).toEqual(asked[0][19]);
    expect(route.legs).toHaveLength(24);
    expect(traffic.relay).toEqual([]);
  });

  it('VDAY-003: where the relay cannot answer, OSRM routes the whole day and FOSSGIS is never asked', async () => {
    const refusals: Array<() => Response> = [
      () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      () => HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      () => HttpResponse.json({ error: 'Too large' }, { status: 413 }),
      () => HttpResponse.json({ error: 'Too many routing requests' }, { status: 429 }),
      () => HttpResponse.json({ error: 'down' }, { status: 500 }),
      () => HttpResponse.json({ error: 'The TREK routing service is resting' }, { status: 503 }),
      () => HttpResponse.json({ error: 'Expected number, received string' }, { status: 400 }),
      () => HttpResponse.json({ error_code: 442, error: 'No path could be found for input' }, { status: 400 }),
      () => HttpResponse.error(),
    ];
    for (const refusal of refusals) {
      resetValhallaTurns();
      const traffic = listen(refusal);
      const route = await calculateRouteWithLegs(freshDay(3), { profile: 'walking' });
      expect([route.distance, route.legs.length]).toEqual([2000, 2]);
      expect([traffic.relay.length, traffic.fossgis.length, traffic.osrm.length]).toEqual([1, 0, 1]);
      expect(traffic.osrm[0]).toContain(OSRM.walking);
      expect(route).not.toHaveProperty('avoidance');
      expect(route.engine).toBe('osrm');
    }
  });

  it('VDAY-004: a relay that does not answer in time hands the day to OSRM as well', async () => {
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) =>
      ms === 12_000 ? AbortSignal.abort(new DOMException('signal timed out', 'TimeoutError')) : timeout(ms)
    );
    const traffic = listen();
    const route = await calculateRouteWithLegs(freshDay(2), { profile: 'driving' });
    expect(route.distance).toBe(1000);
    expect([traffic.fossgis.length, traffic.osrm.length]).toEqual([0, 1]);
  });

  it('VDAY-004b: an own Valhalla that does not answer in time hands the day to OSRM without a second wait', async () => {
    choose({ valhalla_base_url: OWN_VALHALLA });
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    const deadlines = vi
      .spyOn(AbortSignal, 'timeout')
      .mockImplementation((ms) =>
        ms === 12_000 ? AbortSignal.abort(new DOMException('signal timed out', 'TimeoutError')) : timeout(ms)
      );
    const traffic = listen();
    const route = await calculateRouteWithLegs(freshDay(3), { profile: 'cycling' });
    expect([route.distance, route.engine]).toEqual([2000, 'osrm']);
    expect(deadlines.mock.calls.filter(([ms]) => ms === 12_000)).toHaveLength(1);
    expect([traffic.relay.length, traffic.fossgis.length, traffic.osrm.length]).toEqual([0, 0, 1]);
  });

  it('VDAY-005: an own Valhalla that cannot answer leaves the day to OSRM', async () => {
    choose({ valhalla_base_url: OWN_VALHALLA });
    const traffic = listen();
    server.use(http.post(`${OWN_VALHALLA}/route`, () => HttpResponse.json({ error: 'down' }, { status: 502 })));
    const route = await calculateRouteWithLegs(freshDay(3), { profile: 'driving' });
    expect(route.distance).toBe(2000);
    expect([traffic.relay.length, traffic.fossgis.length, traffic.osrm.length]).toEqual([0, 0, 1]);
  });

  it('VDAY-006: a day that avoids something keeps FOSSGIS behind the relay and its ten locations', async () => {
    const traffic = listen(() => HttpResponse.json({ error: 'resting' }, { status: 503 }));
    const route = await calculateRouteWithLegs(freshDay(12), { profile: 'driving', avoid: ['toll'] });
    expect(traffic.relay).toHaveLength(1);
    expect(traffic.fossgis.map((body) => body.locations.length)).toEqual([10, 3]);
    expect(traffic.osrm).toEqual([]);
    expect(route.avoidance).toEqual({ asked: ['toll'], achieved: ['toll'] });
  });

  it('VDAY-007: with FOSSGIS chosen, a day that avoids nothing is OSRM’s as before', async () => {
    choose({ routing_valhalla_provider: 'fossgis' });
    const traffic = listen();
    const route = await calculateRouteWithLegs(freshDay(3), { profile: 'cycling' });
    expect(route.distance).toBe(2000);
    expect([traffic.relay.length, traffic.fossgis.length, traffic.osrm.length]).toEqual([0, 0, 1]);
  });
});

describe('the route cache keeps the engine apart', () => {
  it('VDAY-CACHE-001: a day kept from one engine is not handed out as the other’s', async () => {
    const points = freshDay(3);
    choose({ routing_valhalla_provider: 'trek' });
    const traffic = listen();
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(4000);

    choose({ routing_valhalla_provider: 'fossgis' });
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(2000);

    choose({ routing_valhalla_provider: 'trek' });
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(4000);
    expect([traffic.relay.length, traffic.osrm.length]).toEqual([1, 1]);
  });

  it('VDAY-CACHE-002: OSRM standing in is not filed as the Valhalla day, so the relay is asked again once it is back', async () => {
    const points = freshDay(3);
    let up = false;
    const traffic = listen((body) => (up ? answered(body) : HttpResponse.json({ error: 'down' }, { status: 503 })));
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(2000);

    up = true;
    resetValhallaTurns();
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(4000);
    expect([traffic.relay.length, traffic.osrm.length]).toEqual([2, 1]);
  });
});

describe('the route cache while the relay rests', () => {
  it('VDAY-CACHE-003: a day kept from Valhalla is still found while the relay rests, as it is offline', async () => {
    const points = freshDay(3);
    let up = true;
    const traffic = listen((body) => (up ? answered(body) : HttpResponse.json({ error: 'down' }, { status: 503 })));
    expect((await calculateRouteWithLegs(points, { profile: 'driving' })).distance).toBe(4000);

    up = false;
    await calculateRouteWithLegs(freshDay(2), { profile: 'driving' });
    const kept = await calculateRouteWithLegs(points, { profile: 'driving' });
    expect([kept.distance, kept.engine]).toEqual([4000, 'valhalla']);
    expect([traffic.relay.length, traffic.osrm.length]).toEqual([2, 1]);
  });

  it('VDAY-CACHE-004: a day that avoids something keeps its key, whichever Valhalla answered it', async () => {
    const points = freshDay(3);
    const traffic = listen();
    await calculateRouteWithLegs(points, { profile: 'driving', avoid: ['toll'] });
    choose({ routing_valhalla_provider: 'fossgis' });
    const kept = await calculateRouteWithLegs(points, { profile: 'driving', avoid: ['toll'] });
    expect(kept.engine).toBe('valhalla');
    expect([traffic.relay.length, traffic.fossgis.length, traffic.osrm.length]).toEqual([1, 0, 0]);
  });
});

describe('other ways for a leg Valhalla routes', () => {
  const from = { lat: 47, lng: 9 };
  const to = { lat: 47, lng: 9.2 };

  it('VDAY-ALT-001: the offers come from the relay, weighed like the day, and OSRM is not asked', async () => {
    const traffic = listen((body) => {
      const detour = [body.locations[0], { lat: 47.3, lon: 9.1 }, body.locations[1]];
      return HttpResponse.json({ trip: valhallaTrip(body.locations), alternates: [{ trip: valhallaTrip(detour) }] });
    });
    const routes = await calculateAlternatives(from, to, 'driving');
    expect(traffic.relay.map((body) => [body.costing, body.alternates])).toEqual([['auto', 2]]);
    expect(routes.map((route) => route.engine)).toEqual(['valhalla', 'valhalla']);
    expect(routes[1].divergence).not.toBeNull();
    expect(traffic.osrm).toEqual([]);
  });

  it('VDAY-ALT-002: where the relay cannot answer, the offers are OSRM’s like the day', async () => {
    const traffic = listen(() => HttpResponse.json({ error: 'resting' }, { status: 503 }));
    const routes = await calculateAlternatives(from, to, 'walking');
    expect(routes).toHaveLength(1);
    expect(routes[0].engine).toBeUndefined();
    expect(traffic.fossgis).toEqual([]);
    expect(traffic.osrm[0]).toContain('alternatives=3');
  });
});
