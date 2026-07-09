/**
 * MapMarkersController (#plugins, #587): bounded markers plugins overlay on the trip
 * map via the mapMarkerProvider hook. Mirrors the view-contributions hardening —
 * gate + fail-safe + server-side normalization: coordinate range checks, a URL-scheme
 * allowlist (no click-XSS), length + per-provider count caps, tone enum default.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { MapMarkersController } from '../../../src/nest/plugins/map-markers.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new MapMarkersController(runtime), runtime };
}
const mk = (over: Record<string, unknown> = {}) => ({ id: 'm1', lat: 48.85, lng: 2.35, ...over });

describe('MapMarkersController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / no user / non-member all return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    let x = controller(() => [mk()]);
    expect(await x.c.get('1', req(5))).toEqual({ markers: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [mk()]).c.get('1', req(undefined))).markers).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [mk()]).c.get('1', req(5))).markers).toEqual([]);
  });

  it('keeps a valid marker, stamps pluginId + default tone, keeps http/https/mailto urls', async () => {
    const { c } = controller(() => [mk({ label: 'Hotel', popupText: 'Check-in 15:00', url: 'https://ok.example', tone: 'success' })]);
    const out = (await c.get('1', req(5))).markers;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ pluginId: 'p1', id: 'm1', lat: 48.85, lng: 2.35, label: 'Hotel', tone: 'success', url: 'https://ok.example' });
  });

  it('drops out-of-range coordinates, missing id, and non-objects', async () => {
    const { c } = controller(() => [
      mk({ lat: 200 }),            // lat out of range
      mk({ lng: -999 }),           // lng out of range
      mk({ id: '' }),              // no id
      mk({ lat: 'nope' }),         // non-numeric
      null,                        // non-object
      mk({ id: 'good' }),          // the only survivor
    ]);
    const out = (await c.get('1', req(5))).markers;
    expect(out.map(m => m.id)).toEqual(['good']);
  });

  it('drops javascript:/data: urls, defaults a bad tone, caps lengths', async () => {
    const { c } = controller(() => [
      mk({ id: 'x', url: 'javascript:alert(1)', tone: 'evil', label: 'L'.repeat(500), popupText: 'P'.repeat(500) }),
    ]);
    const out = (await c.get('1', req(5))).markers;
    expect(out[0].url).toBeUndefined();       // click-XSS scheme dropped
    expect(out[0].tone).toBe('default');      // unknown tone -> default
    expect(out[0].label!.length).toBe(80);    // capped
    expect(out[0].popupText!.length).toBe(280);
  });

  it('caps the marker count at 200 per provider and skips a failing provider', async () => {
    const many = Array.from({ length: 250 }, (_, i) => mk({ id: `m${i}` }));
    const { c } = controller((id) => (id === 'bad' ? (() => { throw new Error('boom'); })() : many), ['good', 'bad']);
    const out = (await c.get('1', req(5))).markers;
    expect(out).toHaveLength(200); // good capped to 200; bad contributes nothing
  });
});
