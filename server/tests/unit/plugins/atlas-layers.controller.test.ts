/**
 * AtlasLayersController (#plugins): country tint layers plugins draw over the
 * Atlas world map via the atlasLayerProvider hook. USER-SCOPED — no tripId, the
 * acting user is host-bound and the hook takes no target parameter. Mirrors the
 * map-markers hardening — gate + fail-safe + server-side normalization: ISO
 * alpha-2 code validation (uppercase-coerced), tone enum default, length caps,
 * layer/country count caps.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip: vi.fn() }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { AtlasLayersController } from '../../../src/nest/plugins/atlas-layers.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new AtlasLayersController(runtime), runtime };
}
const layer = (over: Record<string, unknown> = {}) => ({ id: 'l1', countries: [{ code: 'FR' }], ...over });

describe('AtlasLayersController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); });

  it('gates: disabled / no user return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => [layer()]);
    expect(await x.c.get(req(5))).toEqual({ layers: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [layer()]).c.get(req(undefined))).layers).toEqual([]);
  });

  it('keeps a valid layer, stamps pluginId, invokes the hook with NO target parameter', async () => {
    const { c, runtime } = controller(() => [
      layer({ name: 'Wishlist', countries: [{ code: 'FR', tone: 'success', label: 'Paris trip' }] }),
    ]);
    const out = (await c.get(req(5))).layers;
    expect(out).toEqual([{
      pluginId: 'p1',
      id: 'l1',
      name: 'Wishlist',
      countries: [{ code: 'FR', tone: 'success', label: 'Paris trip' }],
    }]);
    // user-scoped: empty args, the acting user is bound host-side
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'atlasLayerProvider', 'getLayers', [], 5, 5000);
  });

  it('uppercase-coerces codes, drops anything that is not ISO alpha-2, defaults a bad tone', async () => {
    const { c } = controller(() => [
      layer({
        countries: [
          { code: 'de' },                    // lowercased -> DE
          { code: 'DEU' },                   // alpha-3 -> dropped
          { code: '1x' },                    // digits -> dropped
          { code: '' },                      // empty -> dropped
          null,                              // non-object -> dropped
          { code: 'JP', tone: 'evil', label: 'L'.repeat(200) },
        ],
      }),
    ]);
    const out = (await c.get(req(5))).layers[0].countries;
    expect(out.map((x) => x.code)).toEqual(['DE', 'JP']);
    expect(out[0].tone).toBe('default');
    expect(out[0].label).toBeUndefined();
    expect(out[1].tone).toBe('default');     // unknown tone -> default
    expect(out[1].label!.length).toBe(80);   // capped
  });

  it('drops id-less layers and non-objects, caps the name, tolerates non-array results', async () => {
    const { c } = controller(() => [
      layer({ id: '' }),                     // no id -> can't key it
      null,                                  // non-object
      layer({ id: 'ok', name: 'N'.repeat(200), countries: 'not an array' }),
    ]);
    const out = (await c.get(req(5))).layers;
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('ok');
    expect(out[0].name!.length).toBe(60);
    expect(out[0].countries).toEqual([]);

    expect((await controller(() => 'garbage').c.get(req(5))).layers).toEqual([]);
  });

  it('caps at 3 layers per plugin and 300 countries per layer, and skips a failing provider', async () => {
    const many = Array.from({ length: 5 }, (_, i) => layer({
      id: `l${i}`,
      countries: Array.from({ length: 350 }, () => ({ code: 'US' })),
    }));
    const { c } = controller((id) => (id === 'bad' ? (() => { throw new Error('boom'); })() : many), ['good', 'bad']);
    const out = (await c.get(req(5))).layers;
    expect(out).toHaveLength(3);             // good capped to 3; bad contributes nothing
    expect(out[0].countries).toHaveLength(300);
  });
});
