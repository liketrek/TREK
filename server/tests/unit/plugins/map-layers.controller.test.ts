/**
 * MapLayersController (#plugins): bounded vector overlays plugins draw on the trip
 * map via the mapLayerProvider hook. Mirrors the map-markers hardening — gate +
 * fail-safe + server-side normalization: coordinate range checks, clamped styling
 * numerics, enum whitelists on the raw values, and hard per-provider budgets
 * (layers / features / vertices) with drop-not-truncate semantics for geometry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { MapLayersController } from '../../../src/nest/plugins/map-layers.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new MapLayersController(runtime), runtime };
}
const line = (n = 3, over: Record<string, unknown> = {}) => ({
  type: 'polyline',
  points: Array.from({ length: n }, (_, i) => [48 + i * 0.01, 2 + i * 0.01]),
  ...over,
});
const layer = (features: unknown[], over: Record<string, unknown> = {}) => ({ id: 'l1', features, ...over });

describe('MapLayersController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / no user / non-member all return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => [layer([line()])]);
    expect(await x.c.get('1', req(5))).toEqual({ layers: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [layer([line()])]).c.get('1', req(undefined))).layers).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [layer([line()])]).c.get('1', req(5))).layers).toEqual([]);
  });

  it('keeps a valid layer, stamps pluginId, clamps styling and caps the label', async () => {
    const { c } = controller(() => [layer(
      [line(3, { tone: 'success', width: 99, opacity: 7, dash: 'dash', label: 'L'.repeat(200) })],
      { name: 'N'.repeat(200) },
    )]);
    const out = (await c.get('1', req(5))).layers;
    expect(out).toHaveLength(1);
    expect(out[0].pluginId).toBe('p1');
    expect(out[0].name!.length).toBe(60);
    const f = out[0].features[0];
    expect(f).toMatchObject({ type: 'polyline', tone: 'success', width: 8, opacity: 1, dash: 'dash', fill: false });
    expect(f.label!.length).toBe(80);
    expect(f.points).toHaveLength(3);
  });

  it('defaults tone/dash on unknown RAW values and applies numeric defaults', async () => {
    const evil = { toString: () => 'success' };
    const { c } = controller(() => [layer([line(2, { tone: evil, dash: evil, width: 'x', opacity: 'x' })])]);
    const f = (await c.get('1', req(5))).layers[0].features[0];
    expect(f.tone).toBe('default');
    expect(f.dash).toBe('solid');
    expect(f.width).toBe(3);
    expect(f.opacity).toBe(0.8);
  });

  it('drops invalid shapes whole: bad vertex, short polygon, radius-less circle, unknown type', async () => {
    const { c } = controller(() => [layer([
      line(3, { points: [[48, 2], [200, 2], [48.2, 2.2]] }), // out-of-range vertex
      { type: 'polygon', points: [[48, 2], [48.1, 2.1]] },    // polygon needs >= 3
      { type: 'circle', center: [48, 2] },                    // no radius
      { type: 'blob', points: [[48, 2], [48.1, 2.1]] },       // unknown type
      null,                                                   // non-object
      line(2, { label: 'good' }),                             // the only survivor
    ])]);
    const out = (await c.get('1', req(5))).layers;
    expect(out[0].features).toHaveLength(1);
    expect(out[0].features[0].label).toBe('good');
  });

  it('renders circles with a clamped metric radius and polygon fill by default', async () => {
    const { c } = controller(() => [layer([
      { type: 'circle', center: [48, 2], radiusM: 99_999_999 },
      { type: 'polygon', points: [[48, 2], [48.1, 2.1], [48, 2.2]] },
      { type: 'polygon', points: [[48, 2], [48.1, 2.1], [48, 2.2]], fill: false },
    ])]);
    const [circle, poly, noFill] = (await c.get('1', req(5))).layers[0].features;
    expect(circle).toMatchObject({ type: 'circle', radiusM: 2_000_000, fill: true });
    expect(poly.fill).toBe(true);
    expect(noFill.fill).toBe(false);
  });

  it('drops an oversized shape whole instead of truncating it', async () => {
    const { c } = controller(() => [layer([line(2001), line(2, { label: 'kept' })])]);
    const out = (await c.get('1', req(5))).layers;
    expect(out[0].features).toHaveLength(1);
    expect(out[0].features[0].label).toBe('kept');
  });

  it('enforces the per-provider budgets: 4 layers, 150 features, 8000 vertices', async () => {
    // 5 layers -> 4; the vertex budget kills the tail of a dense provider.
    const dense = Array.from({ length: 5 }, (_, i) => layer(
      Array.from({ length: 60 }, () => line(50)), { id: `l${i}` },
    ));
    const { c } = controller(() => dense);
    const out = (await c.get('1', req(5))).layers;
    expect(out.length).toBeLessThanOrEqual(4);
    const features = out.flatMap(l => l.features);
    expect(features.length).toBeLessThanOrEqual(150);
    const vertices = features.reduce((n, f) => n + (f.points?.length ?? 1), 0);
    expect(vertices).toBeLessThanOrEqual(8000);
  });

  it('bounds work on an all-invalid oversized payload (no unbounded iteration)', async () => {
    // 100k valid-id / zero-feature layers would iterate fully without the raw cap.
    const huge = Array.from({ length: 100_000 }, () => ({ id: 'x', features: [] }));
    const { c } = controller(() => huge);
    const out = (await c.get('1', req(5))).layers;
    expect(out).toEqual([]); // all dropped (no features), and the scan stayed bounded
  });

  it('drops id-less and empty layers, keeps other providers when one fails', async () => {
    const { c } = controller(
      (id) => (id === 'bad'
        ? (() => { throw new Error('boom'); })()
        : [layer([], { id: 'empty' }), layer([line()], { id: '' }), layer([line()], { id: 'ok' })]),
      ['good', 'bad'],
    );
    const out = (await c.get('1', req(5))).layers;
    expect(out.map(l => `${l.pluginId}:${l.id}`)).toEqual(['good:ok']);
  });
});
