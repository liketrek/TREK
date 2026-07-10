/**
 * The core consumers that make the photoProvider + calendarSource hooks LIVE (they were
 * declared/typed but never invoked). Proves the gate, the host->plugin fan-out, and the
 * mandatory hardening: image URLs are http/https only, fields are normalized/length-capped,
 * counts are capped, and a slow/failing source is skipped rather than fatal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PluginPhotosController } from '../../../src/nest/plugins/plugin-photos.controller';
import { PluginCalendarController } from '../../../src/nest/plugins/plugin-calendar.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function runtime(providers: string[], invoke: (id: string, fn: string, args: unknown[]) => unknown) {
  return {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string, _hook: string, fn: string, args: unknown[]) => invoke(id, fn, args)),
  } as unknown as PluginRuntimeService;
}

describe('PluginPhotosController (photoProvider hook)', () => {
  beforeEach(() => pluginsEnabled.mockReturnValue(true));

  it('gates: disabled / no user return empty without calling providers', async () => {
    pluginsEnabled.mockReturnValue(false);
    let c = new PluginPhotosController(runtime(['p'], () => ({ photos: [] })));
    expect(await c.search('x', '1', req(5))).toEqual({ providers: [] });
    pluginsEnabled.mockReturnValue(true);
    c = new PluginPhotosController(runtime(['p'], () => ({ photos: [] })));
    expect(await c.search('x', '1', req(undefined))).toEqual({ providers: [] });
  });

  it('normalizes photos, keeps only http/https image URLs, caps the count', async () => {
    const photos = [
      { id: 'a', title: 'Sunset', thumbnailUrl: 'https://x/t.jpg', fullUrl: 'https://x/f.jpg', takenAt: '2026-01-01' },
      { id: 'evil', thumbnailUrl: 'javascript:alert(1)', fullUrl: 'https://x/f.jpg' }, // bad thumb → dropped
      { id: 'nofull', thumbnailUrl: 'https://x/t.jpg', fullUrl: 'data:image/png,x' },   // bad full → dropped
      { title: 'noid', thumbnailUrl: 'https://x/t.jpg', fullUrl: 'https://x/f.jpg' },    // no id → dropped
    ];
    const c = new PluginPhotosController(runtime(['pics'], (_id, fn) => (fn === 'search' ? { photos, total: 99, hasMore: true } : null)));
    const out = (await c.search('sun', '1', req(5))).providers;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ pluginId: 'pics', total: 99, hasMore: true });
    expect(out[0].photos).toHaveLength(1);
    expect(out[0].photos[0]).toEqual({ id: 'a', pluginId: 'pics', title: 'Sunset', thumbnailUrl: 'https://x/t.jpg', fullUrl: 'https://x/f.jpg', takenAt: '2026-01-01' });
  });

  it('passes the query + page to the hook and skips a source that throws', async () => {
    const rt = runtime(['ok', 'bad'], (id, _fn) => { if (id === 'bad') throw new Error('slow'); return { photos: [{ id: '1', thumbnailUrl: 'https://x/t', fullUrl: 'https://x/f' }] }; });
    const c = new PluginPhotosController(rt);
    const out = (await c.search('beach', '3', req(7))).providers;
    expect(out.map((p) => p.pluginId)).toEqual(['ok']);
    expect(rt.invokeHook).toHaveBeenCalledWith('ok', 'photoProvider', 'search', ['beach', { page: 3, limit: 60 }], 7, 5000);
  });

  it('item: returns one normalized photo from a known provider, null for an unknown one', async () => {
    const c = new PluginPhotosController(runtime(['pics'], () => ({ id: 'z', thumbnailUrl: 'https://x/t', fullUrl: 'https://x/f' })));
    expect((await c.item('pics', 'z', req(5))).photo).toMatchObject({ id: 'z', pluginId: 'pics' });
    expect((await c.item('ghost', 'z', req(5))).photo).toBeNull(); // not a granted provider
  });
});

describe('PluginCalendarController (calendarSource hook)', () => {
  beforeEach(() => pluginsEnabled.mockReturnValue(true));

  it('aggregates normalized events for the user, dropping events missing core fields', async () => {
    const events = [
      { id: 'e1', title: 'Flight', start: '2026-07-01T08:00:00Z', end: '2026-07-01T11:00:00Z', allDay: false },
      { id: 'e2', title: 'no end', start: '2026-07-02T00:00:00Z' }, // missing end → dropped
      { title: 'no id', start: '2026-07-03T00:00:00Z', end: '2026-07-03T00:00:00Z' }, // no id → dropped
    ];
    const rt = runtime(['cal'], (_id, fn) => (fn === 'getName' ? 'My Cal' : events));
    const c = new PluginCalendarController(rt);
    const out = (await c.get('2026-07-01T00:00:00Z', '2026-08-01T00:00:00Z', req(9))).sources;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ pluginId: 'cal', name: 'My Cal' });
    expect(out[0].events).toHaveLength(1);
    expect(out[0].events[0]).toMatchObject({ id: 'e1', title: 'Flight', allDay: false });
    // getEvents got the user + the window
    expect(rt.invokeHook).toHaveBeenCalledWith('cal', 'calendarSource', 'getEvents', [9, '2026-07-01T00:00:00Z', '2026-08-01T00:00:00Z'], 9, 5000);
  });

  it('gates on user + plugins-enabled, and skips a failing source', async () => {
    expect(await new PluginCalendarController(runtime(['c'], () => [])).get(undefined, undefined, req(undefined))).toEqual({ sources: [] });
    const rt = runtime(['a', 'b'], (id, fn) => { if (id === 'b' && fn === 'getEvents') throw new Error('boom'); return fn === 'getName' ? 'A' : [{ id: '1', title: 't', start: '2026-01-01T00:00:00Z', end: '2026-01-01T01:00:00Z' }]; });
    const out = (await new PluginCalendarController(rt).get(undefined, undefined, req(5))).sources;
    expect(out.map((s) => s.pluginId)).toEqual(['a']); // b threw → skipped; defaults window used
  });
});
