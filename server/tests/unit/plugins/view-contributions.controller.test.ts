/**
 * ViewContributionsController (#plugins, UI-contribution registry): host-rendered
 * columns/actions plugins add into a native planner view. Mirrors
 * place-details.controller (gate + fail-safe) and additionally proves the mandatory
 * hardening: server-side normalization, a URL-scheme allowlist (no click-XSS), and
 * length/count caps.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { ViewContributionsController } from '../../../src/nest/plugins/view-contributions.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new ViewContributionsController(runtime), runtime };
}
const col = (over: Record<string, unknown> = {}) => ({ kind: 'column', entityId: 1, id: 'c1', label: 'X', ...over });
const act = (over: Record<string, unknown> = {}) => ({ kind: 'action', entityId: 1, id: 'a1', label: 'Go', target: { kind: 'frame', sub: '/ui' }, ...over });

describe('ViewContributionsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / unknown view / no user / non-member all return [] (no plugin calls on the first two)', async () => {
    pluginsEnabled.mockReturnValue(false);
    let x = controller(() => [col()]);
    expect(await x.c.get('reservations', '1', req(5))).toEqual({ contributions: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    x = controller(() => [col()]);
    expect(await x.c.get('bogus', '1', req(5))).toEqual({ contributions: [] }); // view not whitelisted
    expect(x.runtime.providersOf).not.toHaveBeenCalled();

    // costs/packing/files were added to the whitelist — they must be accepted (providers consulted).
    for (const view of ['costs', 'packing', 'files']) {
      const y = controller(() => [col()]);
      expect((await y.c.get(view, '1', req(5))).contributions.length).toBe(1);
      expect(y.runtime.providersOf).toHaveBeenCalledWith('tableContributor');
    }

    expect((await controller(() => [col()]).c.get('places', '1', req(undefined))).contributions).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [col()]).c.get('day', '1', req(5))).contributions).toEqual([]);
  });

  it('column: keeps http/https/mailto urls, DROPS javascript:/data:, caps lengths, defaults a bad tone', async () => {
    const { c } = controller(() => [
      col({ id: 'ok', label: 'Crowd', value: 'Quiet', url: 'https://x.test', tone: 'success', icon: 'Users' }),
      col({ id: 'js', label: 'Evil', url: 'javascript:alert(1)' }),
      col({ id: 'data', label: 'Evil2', url: 'data:text/html,x' }),
      col({ id: 'mail', label: 'Mail', url: 'mailto:a@b.c' }),
      col({ id: 'long', label: 'L'.repeat(200), value: 'V'.repeat(500), tone: 'nope' }),
    ]);
    const out = (await c.get('reservations', '1', req(5))).contributions;
    expect(out[0]).toEqual({ kind: 'column', pluginId: 'p1', entityId: 1, id: 'ok', label: 'Crowd', value: 'Quiet', url: 'https://x.test', icon: 'Users', tone: 'success' });
    expect((out[1] as { url?: string }).url).toBeUndefined(); // javascript: rejected
    expect((out[2] as { url?: string }).url).toBeUndefined(); // data: rejected
    expect((out[3] as { url?: string }).url).toBe('mailto:a@b.c');
    expect((out[4] as { label: string }).label).toHaveLength(64);
    expect((out[4] as { value: string }).value).toHaveLength(256);
    expect((out[4] as { tone: string }).tone).toBe('default');
  });

  it('action: keeps valid frame/route targets, drops malformed ones', async () => {
    const { c } = controller(() => [
      act({ id: 'frame', target: { kind: 'frame', sub: '/ui' } }),
      act({ id: 'route', target: { kind: 'route', method: 'POST', sub: '/do' } }),
      act({ id: 'badmethod', target: { kind: 'route', method: 'DELETE', sub: '/x' } }),
      act({ id: 'nosub', target: { kind: 'frame' } }),
      act({ id: 'badkind', target: { kind: 'nope', sub: '/x' } }),
    ]);
    const out = (await c.get('reservations', '1', req(5))).contributions;
    expect(out.map((o) => o.id)).toEqual(['frame', 'route']);
  });

  it('drops entries missing entityId/id/label, non-objects, and unknown kinds', async () => {
    const { c } = controller(() => [
      col({ entityId: undefined }),
      col({ id: '' }),
      col({ label: '' }),
      { kind: 'mystery', entityId: 1, id: 'x', label: 'y' },
      'not-an-object',
      null,
      col({ id: 'good' }),
    ]);
    const out = (await c.get('places', '1', req(5))).contributions;
    expect(out.map((o) => o.id)).toEqual(['good']);
  });

  it('caps per-provider counts: <=20 columns and <=10 actions', async () => {
    const many = [
      ...Array.from({ length: 30 }, (_, i) => col({ id: `c${i}` })),
      ...Array.from({ length: 15 }, (_, i) => act({ id: `a${i}` })),
    ];
    const { c } = controller(() => many);
    const out = (await c.get('day', '1', req(5))).contributions;
    expect(out.filter((o) => o.kind === 'column')).toHaveLength(20);
    expect(out.filter((o) => o.kind === 'action')).toHaveLength(10);
  });

  it('merges providers, skips one that throws, and passes (view, tripId) + user to the hook', async () => {
    const { c, runtime } = controller((id) => { if (id === 'p2') throw new Error('slow'); return [col({ id: 'from-p1' })]; }, ['p1', 'p2']);
    const out = (await c.get('reservations', '1', req(5))).contributions;
    expect(out.map((o) => o.id)).toEqual(['from-p1']);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'tableContributor', 'getContributions', ['reservations', 1], 5, 5000);
  });
});
