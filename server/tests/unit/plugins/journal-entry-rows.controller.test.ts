/**
 * JournalEntryRowsController (#plugins): extra rows plugins render under a journal
 * entry via the journalEntryProvider hook. Mirrors the place-details gate (entry ->
 * journey -> canAccessJourney + the Journey addon) and the map-markers hardening:
 * fail-safe + server-side normalization — row count cap, label/value length caps,
 * a URL-scheme allowlist (no click-XSS).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { entryJourney, canAccessJourney, isAddonEnabled, pluginsEnabled } = vi.hoisted(() => ({
  entryJourney: vi.fn((entryId: number) => (entryId === 7 ? { journey_id: 3 } : undefined)),
  canAccessJourney: vi.fn((journeyId: number, userId: number) => (journeyId === 3 && userId === 5 ? { id: 3 } : null)),
  isAddonEnabled: vi.fn(() => true),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: (entryId: number) => entryJourney(entryId) }) },
  canAccessTrip: vi.fn(),
}));
vi.mock('../../../src/services/journeyService', () => ({ canAccessJourney }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { JournalEntryRowsController } from '../../../src/nest/plugins/journal-entry-rows.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new JournalEntryRowsController(runtime), runtime };
}
const row = (over: Record<string, unknown> = {}) => ({ label: 'Distance', value: '12 km', ...over });

describe('JournalEntryRowsController', () => {
  beforeEach(() => {
    pluginsEnabled.mockReturnValue(true);
    isAddonEnabled.mockReturnValue(true);
    canAccessJourney.mockReturnValue({ id: 3 } as never);
  });

  it('gates: runtime disabled / journey addon off return [] without touching the runtime', async () => {
    pluginsEnabled.mockReturnValue(false);
    let x = controller(() => [row()]);
    expect(await x.c.get('7', req(5))).toEqual({ providers: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    isAddonEnabled.mockReturnValue(false);
    x = controller(() => [row()]);
    expect(await x.c.get('7', req(5))).toEqual({ providers: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
  });

  it('gates: bad entryId / no user / unknown entry / no journey access all return []', async () => {
    expect((await controller(() => [row()]).c.get('abc', req(5))).providers).toEqual([]);
    expect((await controller(() => [row()]).c.get('7', req(undefined))).providers).toEqual([]);
    expect((await controller(() => [row()]).c.get('999', req(5))).providers).toEqual([]); // entry not found
    canAccessJourney.mockReturnValue(null as never);
    expect((await controller(() => [row()]).c.get('7', req(5))).providers).toEqual([]);   // no access
  });

  it('keeps valid rows, groups them per plugin, passes the entry + acting user to the hook', async () => {
    const { c, runtime } = controller(() => [row({ url: 'https://ok.example' }), row({ label: 'Steps', value: '9000', url: 'mailto:x@y.z' })]);
    const res = await c.get('7', req(5));
    expect(res.providers).toEqual([{
      pluginId: 'p1',
      items: [
        { label: 'Distance', value: '12 km', url: 'https://ok.example' },
        { label: 'Steps', value: '9000', url: 'mailto:x@y.z' },
      ],
    }]);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'journalEntryProvider', 'getRows', [7], 5, 5000);
  });

  it('drops javascript:/empty/unparseable urls, caps lengths, drops label-less rows and non-objects', async () => {
    const { c } = controller(() => [
      row({ label: 'L'.repeat(200), value: 'V'.repeat(500), url: 'javascript:alert(1)' }),
      row({ url: '' }),
      row({ url: 'not a url' }),
      { label: '', value: 'orphan' },        // no label
      { value: 42 },                         // still no label
      null,                                  // non-object
    ]);
    const items = (await c.get('7', req(5))).providers[0].items;
    expect(items).toHaveLength(3);
    expect(items[0].label.length).toBe(60);
    expect(items[0].value!.length).toBe(200);
    expect(items[0].url).toBeUndefined();    // click-XSS scheme dropped
    expect(items[1].url).toBeUndefined();
    expect(items[2].url).toBeUndefined();
    expect(items[2].value).toBe('12 km');
  });

  it('caps at 12 rows per provider, omits empty providers, skips a failing one, tolerates non-arrays', async () => {
    const many = Array.from({ length: 15 }, (_, i) => row({ label: `r${i}` }));
    const { c } = controller((id) => {
      if (id === 'bad') throw new Error('boom');
      if (id === 'empty') return [{ value: 'no label' }]; // normalizes to nothing
      if (id === 'garbage') return 'not an array';
      return many;
    }, ['good', 'bad', 'empty', 'garbage']);
    const res = await c.get('7', req(5));
    expect(res.providers).toHaveLength(1);   // only 'good' survives
    expect(res.providers[0].items).toHaveLength(12);
  });
});
