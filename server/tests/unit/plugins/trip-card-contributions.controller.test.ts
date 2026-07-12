/**
 * TripCardContributionsController (#plugins, dashboard trip-card badges): host-rendered
 * badges plugins add to the dashboard trip cards via the tripCardProvider hook. Proves
 * the gate + fail-safe behaviour AND the mandatory hardening: per-tripId access checks,
 * a badge for an un-requested/inaccessible trip is dropped, server-side normalization,
 * a URL-scheme allowlist (no click-XSS), and length/count caps.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  // trips 1 and 2 are accessible to user 5; everything else is not.
  canAccessTrip: vi.fn((tripId: number, userId: number) => (userId === 5 && (tripId === 1 || tripId === 2) ? { id: tripId } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { TripCardContributionsController } from '../../../src/nest/plugins/trip-card-contributions.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string, args: unknown[]) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string, _h: string, _fn: string, args: unknown[]) => invoke(id, args)),
  } as unknown as PluginRuntimeService;
  return { c: new TripCardContributionsController(runtime), runtime };
}
const badge = (over: Record<string, unknown> = {}) => ({ tripId: 1, id: 'b1', label: 'Visa', ...over });

describe('TripCardContributionsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); });

  it('gates: disabled / no user / no accessible trip all return [] without consulting providers', async () => {
    pluginsEnabled.mockReturnValue(false);
    let x = controller(() => [badge()]);
    expect(await x.c.get('1', req(5))).toEqual({ contributions: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    x = controller(() => [badge()]);
    expect(await x.c.get('1', req(undefined))).toEqual({ contributions: [] }); // no user
    expect(x.runtime.providersOf).not.toHaveBeenCalled();

    x = controller(() => [badge()]);
    expect(await x.c.get('99', req(5))).toEqual({ contributions: [] }); // trip 99 not accessible
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
  });

  it('passes only the accessible, deduped tripIds to the hook once', async () => {
    const { c, runtime } = controller(() => [badge()]);
    await c.get('1,2,2,99,abc', req(5)); // 99 inaccessible, abc invalid, 2 duplicated
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'tripCardProvider', 'getCards', [[1, 2]], 5, 5000);
  });

  it('drops a badge whose tripId was not requested / is inaccessible', async () => {
    const { c } = controller(() => [badge({ tripId: 1, id: 'ok' }), badge({ tripId: 2, id: 'ok2' }), badge({ tripId: 99, id: 'sneaky' })]);
    const out = (await c.get('1,2', req(5))).contributions;
    expect(out.map((o) => o.id)).toEqual(['ok', 'ok2']); // tripId 99 was never in the request → dropped
  });

  it('keeps http/https/mailto urls, DROPS javascript:/data:, caps lengths, defaults a bad tone', async () => {
    const { c } = controller(() => [
      badge({ id: 'ok', value: 'Approved', url: 'https://x.test', tone: 'success', icon: 'Check' }),
      badge({ id: 'js', url: 'javascript:alert(1)' }),
      badge({ id: 'mail', url: 'mailto:a@b.c' }),
      badge({ id: 'long', label: 'L'.repeat(200), value: 'V'.repeat(500), tone: 'nope' }),
    ]);
    const out = (await c.get('1', req(5))).contributions;
    expect(out[0]).toEqual({ pluginId: 'p1', tripId: 1, id: 'ok', label: 'Visa', value: 'Approved', icon: 'Check', tone: 'success', url: 'https://x.test' });
    expect((out[1] as { url?: string }).url).toBeUndefined();
    expect((out[2] as { url?: string }).url).toBe('mailto:a@b.c');
    expect((out[3] as { label: string }).label).toHaveLength(64);
    expect((out[3] as { value: string }).value).toHaveLength(256);
    expect((out[3] as { tone: string }).tone).toBe('default');
  });

  it('drops invalid entries and caps PER CARD (not globally) so every card keeps its badges', async () => {
    const many = [
      badge({ tripId: undefined }),
      badge({ id: '' }),
      badge({ label: '' }),
      'not-an-object',
      null,
      // 50 badges all for trip 1 → capped at the per-card limit (4), NOT dropped globally
      ...Array.from({ length: 50 }, (_, i) => badge({ tripId: 1, id: `a${i}` })),
      // and 50 for trip 2 → its own 4, proving the cap isn't a shared budget
      ...Array.from({ length: 50 }, (_, i) => badge({ tripId: 2, id: `b${i}` })),
    ];
    const { c } = controller(() => many);
    const out = (await c.get('1,2', req(5))).contributions;
    expect(out.filter((o) => o.tripId === 1)).toHaveLength(4);
    expect(out.filter((o) => o.tripId === 2)).toHaveLength(4); // trip 2 not starved by trip 1
  });

  it('merges providers and skips one that throws', async () => {
    const { c } = controller((id) => { if (id === 'p2') throw new Error('slow'); return [badge({ id: 'from-p1' })]; }, ['p1', 'p2']);
    const out = (await c.get('1', req(5))).contributions;
    expect(out.map((o) => o.id)).toEqual(['from-p1']);
  });
});
