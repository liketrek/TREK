/**
 * PluginRoutesController (#plugins): targeted routing through ONE routeProvider
 * plugin profile. Mirrors the provider-hook hardening (gate + fail-safe) plus the
 * bits unique to routing: strict request validation (waypoint count + ranges),
 * the declared-profile re-check against the DB row, and whole-result rejection
 * of malformed routes (a wrong leg count must never mis-key sidebar connectors).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled, capabilitiesRow } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
  capabilitiesRow: { value: JSON.stringify({ routeProfiles: [{ id: 'ev', label: 'EV' }] }) as string | undefined },
}));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => (capabilitiesRow.value === undefined ? undefined : { capabilities: capabilitiesRow.value }) }) },
  canAccessTrip,
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PluginRoutesController } from '../../../src/nest/plugins/plugin-routes.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: () => unknown, providers = ['ev-plug']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async () => invoke()),
  } as unknown as PluginRuntimeService;
  return { c: new PluginRoutesController(runtime), runtime };
}
const wp = (n = 3) => Array.from({ length: n }, (_, i) => ({ lat: 48 + i * 0.1, lng: 2 + i * 0.1 }));
const goodRoute = (n = 3, over: Record<string, unknown> = {}) => ({
  coordinates: [[48, 2], [48.1, 2.1], [48.2, 2.2]],
  distance: 12000,
  duration: 900,
  legs: Array.from({ length: n - 1 }, () => ({ distance: 6000, duration: 450 })),
  ...over,
});
const body = (over: Record<string, unknown> = {}) => ({ tripId: 1, dayId: 7, waypoints: wp(), ...over });

describe('PluginRoutesController', () => {
  beforeEach(() => {
    pluginsEnabled.mockReturnValue(true);
    canAccessTrip.mockReturnValue({ id: 1 } as never);
    capabilitiesRow.value = JSON.stringify({ routeProfiles: [{ id: 'ev', label: 'EV' }] });
  });

  it('gates: disabled / no user / non-member / bad profile id all return null', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => goodRoute());
    expect(await x.c.route('ev-plug', 'ev', body(), req(5))).toEqual({ route: null });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => goodRoute()).c.route('ev-plug', 'ev', body(), req(undefined))).route).toBeNull();
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => goodRoute()).c.route('ev-plug', 'ev', body(), req(5))).route).toBeNull();
    canAccessTrip.mockReturnValue({ id: 1 } as never);
    expect((await controller(() => goodRoute()).c.route('ev-plug', '../etc', body(), req(5))).route).toBeNull();
  });

  it('rejects invalid waypoint lists without invoking the plugin', async () => {
    const cases = [
      body({ waypoints: wp(1) }),                                  // too few
      body({ waypoints: wp(31) }),                                 // too many
      body({ waypoints: [{ lat: 200, lng: 2 }, { lat: 48, lng: 2 }] }), // out of range
      body({ waypoints: 'nope' }),
      body({ tripId: 'NaN' }),
    ];
    for (const b of cases) {
      const { c, runtime } = controller(() => goodRoute());
      expect((await c.route('ev-plug', 'ev', b as never, req(5))).route).toBeNull();
      expect(runtime.invokeHook).not.toHaveBeenCalled();
    }
  });

  it('refuses a plugin that is not a granted provider or a profile it never declared', async () => {
    expect((await controller(() => goodRoute(), []).c.route('ev-plug', 'ev', body(), req(5))).route).toBeNull();
    // provider ok, but the DB row declares no such profile (hand-edited or stale)
    expect((await controller(() => goodRoute()).c.route('ev-plug', 'scenic', body(), req(5))).route).toBeNull();
    capabilitiesRow.value = undefined; // plugin row vanished
    expect((await controller(() => goodRoute()).c.route('ev-plug', 'ev', body(), req(5))).route).toBeNull();
  });

  it('returns a normalized route and passes the request through to the hook', async () => {
    const { c, runtime } = controller(() => goodRoute(3, {
      legs: [{ distance: 6000, duration: 450, note: 'charge to 80%' }, { distance: 6000, duration: 450 }],
      viaPoints: [{ lat: 48.05, lng: 2.05, label: 'Fastned', tone: 'success', dwellSeconds: 1500.7 }],
    }));
    const { route } = await c.route('ev-plug', 'ev', body(), req(5));
    expect(route).not.toBeNull();
    expect(route!.pluginId).toBe('ev-plug');
    expect(route!.profile).toBe('ev');
    expect(route!.legs[0].note).toBe('charge to 80%');
    expect(route!.viaPoints[0]).toMatchObject({ label: 'Fastned', tone: 'success', dwellSeconds: 1501 });
    expect(runtime.invokeHook).toHaveBeenCalledWith(
      'ev-plug', 'routeProvider', 'getRoute',
      [{ tripId: 1, dayId: 7, profile: 'ev', waypoints: wp() }],
      5, 20_000,
    );
  });

  it('rejects a malformed route whole: wrong leg count, bad vertex, negative numbers', async () => {
    const bads = [
      goodRoute(3, { legs: [{ distance: 1, duration: 1 }] }),            // 1 leg for 3 waypoints
      goodRoute(3, { coordinates: [[48, 2], [999, 2]] }),                // out-of-range vertex
      goodRoute(3, { distance: -5 }),
      goodRoute(3, { duration: 'soon' }),
      goodRoute(3, { legs: [{ distance: 1, duration: -1 }, { distance: 1, duration: 1 }] }),
      'nope',
    ];
    for (const bad of bads) {
      expect((await controller(() => bad).c.route('ev-plug', 'ev', body(), req(5))).route).toBeNull();
    }
  });

  it('drops bad via points individually and caps counts, without failing the route', async () => {
    const vias = [
      { lat: 48, lng: 2, tone: { toString: () => 'success' }, label: 'L'.repeat(200) }, // raw tone check + cap
      { lat: 999, lng: 2, label: 'dropped' },
      ...Array.from({ length: 50 }, (_, i) => ({ lat: 48, lng: 2, label: `v${i}` })),
    ];
    const { c } = controller(() => goodRoute(3, { viaPoints: vias }));
    const { route } = await c.route('ev-plug', 'ev', body(), req(5));
    expect(route).not.toBeNull();
    expect(route!.viaPoints.length).toBeLessThanOrEqual(40);
    expect(route!.viaPoints[0].tone).toBe('default');
    expect(route!.viaPoints[0].label!.length).toBe(80);
    expect(route!.viaPoints.some(v => v.label === 'dropped')).toBe(false);
  });

  it('answers null when the provider throws or times out', async () => {
    const { c } = controller(() => { throw new Error('solver down'); });
    expect((await c.route('ev-plug', 'ev', body(), req(5))).route).toBeNull();
  });
});
