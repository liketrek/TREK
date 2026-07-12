/**
 * PdfSectionsController (#plugins): text-only sections plugins append to a trip's
 * PDF export via the pdfSectionProvider hook. Mirrors the map-markers hardening —
 * gate + fail-safe + server-side normalization: string coercion, length caps on
 * title/paragraph/header/cell, count caps on sections/paragraphs/headers/rows,
 * rows clipped to the header width, headerless tables dropped.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined }) }, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PdfSectionsController } from '../../../src/nest/plugins/pdf-sections.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new PdfSectionsController(runtime), runtime };
}
const sec = (over: Record<string, unknown> = {}) => ({ title: 'Weather', ...over });

describe('PdfSectionsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / bad tripId / no user / non-member all return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => [sec()]);
    expect(await x.c.get('1', req(5))).toEqual({ sections: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [sec()]).c.get('abc', req(5))).sections).toEqual([]);
    expect((await controller(() => [sec()]).c.get('1', req(undefined))).sections).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [sec()]).c.get('1', req(5))).sections).toEqual([]);
  });

  it('keeps a valid section, stamps pluginId, passes the trip + acting user to the hook', async () => {
    const { c, runtime } = controller(() => [
      sec({ paragraphs: ['Sunny all week'], table: { headers: ['Day', 'Temp'], rows: [['Mon', '24°C']] } }),
    ]);
    const out = (await c.get('1', req(5))).sections;
    expect(out).toEqual([{
      pluginId: 'p1',
      title: 'Weather',
      paragraphs: ['Sunny all week'],
      table: { headers: ['Day', 'Temp'], rows: [['Mon', '24°C']] },
    }]);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'pdfSectionProvider', 'getSections', [1], 5, 5000);
  });

  it('drops non-objects, untitled sections and a non-array result; coerces + caps the title', async () => {
    const { c } = controller(() => [
      null,                                  // non-object
      sec({ title: '' }),                    // no heading
      sec({ title: undefined }),             // still no heading
      sec({ title: 'T'.repeat(500) }),       // survivor, capped
    ]);
    const out = (await c.get('1', req(5))).sections;
    expect(out).toHaveLength(1);
    expect(out[0].title.length).toBe(120);

    expect((await controller(() => ({ not: 'an array' })).c.get('1', req(5))).sections).toEqual([]);
  });

  it('caps paragraphs (count + length) and tolerates a non-array paragraphs field', async () => {
    const { c } = controller(() => [
      sec({ paragraphs: Array.from({ length: 25 }, () => 'P'.repeat(3000)) }),
      sec({ paragraphs: 'not an array' }),
    ]);
    const out = (await c.get('1', req(5))).sections;
    expect(out[0].paragraphs).toHaveLength(20);
    expect(out[0].paragraphs[0].length).toBe(2000);
    expect(out[1].paragraphs).toEqual([]);
  });

  it('normalizes the table: header/row caps, rows clipped to header width, headerless/garbage tables dropped', async () => {
    const { c } = controller(() => [
      sec({
        table: {
          headers: Array.from({ length: 10 }, () => 'H'.repeat(100)),
          rows: [
            ...Array.from({ length: 55 }, () => Array.from({ length: 12 }, () => 'C'.repeat(300))),
            'not a row',
          ],
        },
      }),
      sec({ table: { headers: [], rows: [['x']] } }), // no headers -> no width to clip to
      sec({ table: 'garbage' }),                      // not an object
    ]);
    const out = (await c.get('1', req(5))).sections;
    const table = out[0].table!;
    expect(table.headers).toHaveLength(8);
    expect(table.headers[0].length).toBe(60);
    expect(table.rows).toHaveLength(50);
    expect(table.rows[0]).toHaveLength(8);   // clipped to the header width
    expect(table.rows[0][0].length).toBe(200);
    expect(out[1].table).toBeUndefined();
    expect(out[2].table).toBeUndefined();
  });

  it('caps the section count at 5 per provider and skips a failing provider', async () => {
    const many = Array.from({ length: 8 }, (_, i) => sec({ title: `S${i}` }));
    const { c } = controller((id) => (id === 'bad' ? (() => { throw new Error('boom'); })() : many), ['good', 'bad']);
    const out = (await c.get('1', req(5))).sections;
    expect(out).toHaveLength(5); // good capped to 5; bad contributes nothing
  });
});
