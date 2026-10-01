/**
 * Audit fix (#1429 provider hooks): a plugin may only be dispatched a provider hook
 * if it BOTH implements it (reported by the child at load) AND holds the matching
 * hook:* grant the admin consented to. providersOf() is the enforcement point; the
 * child reports Object.keys(def.hooks) with no knowledge of grants, so without this
 * host-side intersection the hook:* consent would be dead code.
 *
 * providersOf only reads status/hooks/granted, so we inject bare Supervised entries
 * into the private running map rather than spawning real children.
 */
import { describe, it, expect } from 'vitest';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { db } from '../../../src/db/database';

function makeSupervisor(): PluginSupervisor {
  // createRpcHost is never called on the providersOf path (no spawn).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PluginSupervisor((() => ({})) as any, {}, {});
}
function put(s: PluginSupervisor, id: string, status: string, hooks: string[], granted: string[], hookFns: Record<string, string[]> = {}): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s as any).running.set(id, { id, status, hooks, hookFns, granted: new Set(granted) });
}

describe('providersOf enforces the hook:* grant', () => {
  it('returns a plugin only when it implements the hook AND holds the matching grant', () => {
    const s = makeSupervisor();
    put(s, 'granted', 'active', ['placeDetailProvider'], ['hook:place-detail-provider']);
    put(s, 'ungranted', 'active', ['placeDetailProvider'], ['db:write:places']); // implements it, but hook not granted
    put(s, 'notactive', 'starting', ['placeDetailProvider'], ['hook:place-detail-provider']); // granted, but not active
    put(s, 'warner', 'active', ['warningProvider'], ['hook:trip-warning-provider']);
    expect(s.providersOf('placeDetailProvider')).toEqual(['granted']);
    expect(s.providersOf('warningProvider')).toEqual(['warner']);
  });

  it('a hook name with no permission mapping resolves to nobody', () => {
    const s = makeSupervisor();
    put(s, 'x', 'active', ['mysteryProvider'], ['hook:mystery', 'db:own']);
    expect(s.providersOf('mysteryProvider')).toEqual([]);
  });

  it('maps the pdf-section / atlas-layer / journal-entry hooks to their grants', () => {
    const s = makeSupervisor();
    put(s, 'pdf', 'active', ['pdfSectionProvider'], ['hook:pdf-section-provider']);
    put(s, 'atlas', 'active', ['atlasLayerProvider'], ['hook:atlas-layer-provider']);
    put(s, 'journal', 'active', ['journalEntryProvider'], ['hook:journal-entry-provider']);
    put(s, 'crossed', 'active', ['pdfSectionProvider'], ['hook:atlas-layer-provider']); // wrong grant
    expect(s.providersOf('pdfSectionProvider')).toEqual(['pdf']);
    expect(s.providersOf('atlasLayerProvider')).toEqual(['atlas']);
    expect(s.providersOf('journalEntryProvider')).toEqual(['journal']);
  });

  it('maps mapLayerProvider to hook:map-layer-provider (not the marker grant)', () => {
    const s = makeSupervisor();
    put(s, 'layers', 'active', ['mapLayerProvider'], ['hook:map-layer-provider']);
    // The marker grant must not bleed into the layer hook — they are separate consents.
    put(s, 'markersOnly', 'active', ['mapLayerProvider'], ['hook:map-marker-provider']);
    expect(s.providersOf('mapLayerProvider')).toEqual(['layers']);
  });

  it('maps routeProvider to hook:route-provider', () => {
    const s = makeSupervisor();
    put(s, 'ev', 'active', ['routeProvider'], ['hook:route-provider']);
    put(s, 'ungranted', 'active', ['routeProvider'], ['hook:map-layer-provider']); // wrong grant
    expect(s.providersOf('routeProvider')).toEqual(['ev']);
  });

  it('maps poiCategoryProvider to hook:poi-category-provider (not the search grant)', () => {
    const s = makeSupervisor();
    put(s, 'trails', 'active', ['poiCategoryProvider'], ['hook:poi-category-provider']);
    // A search provider only sees words the user typed; the viewport is its own consent.
    put(s, 'searchOnly', 'active', ['poiCategoryProvider'], ['hook:search-provider']);
    expect(s.providersOf('poiCategoryProvider')).toEqual(['trails']);
  });

  it('maps dayScheduleProvider to hook:day-schedule-provider', () => {
    const s = makeSupervisor();
    put(s, 'times', 'active', ['dayScheduleProvider'], ['hook:day-schedule-provider']);
    put(s, 'ungranted', 'active', ['dayScheduleProvider'], ['hook:route-provider']); // wrong grant
    expect(s.providersOf('dayScheduleProvider')).toEqual(['times']);
  });

  it('maps dayTintProvider to hook:day-tint-provider', () => {
    const s = makeSupervisor();
    put(s, 'segments', 'active', ['dayTintProvider'], ['hook:day-tint-provider']);
    put(s, 'ungranted', 'active', ['dayTintProvider'], ['hook:day-schedule-provider']); // wrong grant
    expect(s.providersOf('dayTintProvider')).toEqual(['segments']);
  });

  it('returns tint providers in insertion order — the controller lets the first win a contested day', () => {
    const s = makeSupervisor();
    put(s, 'first', 'active', ['dayTintProvider'], ['hook:day-tint-provider']);
    put(s, 'second', 'active', ['dayTintProvider'], ['hook:day-tint-provider']);
    expect(s.providersOf('dayTintProvider')).toEqual(['first', 'second']);
  });

  it('maps notificationChannel to hook:notification-channel', () => {
    const s = makeSupervisor();
    put(s, 'gotify', 'active', ['notificationChannel'], ['hook:notification-channel']);
    // Implements the hook but was never granted it — must not become a channel.
    put(s, 'sneaky', 'active', ['notificationChannel'], ['notify:send', 'http:outbound']);
    // Granted, but disabled — a channel must not survive being turned off.
    put(s, 'off', 'stopped', ['notificationChannel'], ['hook:notification-channel']);
    expect(s.providersOf('notificationChannel')).toEqual(['gotify']);
  });
});

describe('providersOf narrowed to one optional function (#2221)', () => {
  it('keeps only the providers whose hook reported that function at load, with every other gate still on', () => {
    const s = makeSupervisor();
    const both = { searchProvider: ['search', 'suggest'] };
    put(s, 'typeahead', 'active', ['searchProvider'], ['hook:search-provider'], both);
    put(s, 'search-only', 'active', ['searchProvider'], ['hook:search-provider'], { searchProvider: ['search'] });
    put(s, 'ungranted', 'active', ['searchProvider'], ['hook:poi-category-provider'], both);
    put(s, 'restarting', 'starting', ['searchProvider'], ['hook:search-provider'], both);
    // A function of another hook of the same plugin does not count for this one.
    put(s, 'crossed', 'active', ['searchProvider', 'photoProvider'], ['hook:search-provider'], { searchProvider: ['search'], photoProvider: ['suggest'] });
    expect(s.providersOf('searchProvider', 'suggest')).toEqual(['typeahead']);
    expect(s.providersOf('searchProvider')).toEqual(['typeahead', 'search-only', 'crossed']);
  });

  it('reads the functions off the loaded report the way it reads anything from a child: warily', async () => {
    const s = makeSupervisor();
    const starting = () => ({
      id: 'p', status: 'starting', granted: new Set(['hook:search-provider']), hooks: [], hookFns: {}, jobs: [],
      events: [], exports: [], mcpTools: [], subscriptions: [], pending: new Map(), invocations: new Map(), crashes: [],
    });
    const sup = starting();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sup);
    // Parsed from JSON, as it crosses the IPC channel, so `__proto__` is an own key here.
    const hookFns = JSON.parse('{"searchProvider":["search","suggest",7],"__proto__":["suggest"],"mysteryProvider":["suggest"],"photoProvider":"suggest"}');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s as any).onMessage(sup, { k: 'evt', topic: 'loaded', data: { hooks: ['searchProvider'], hookFns } });
    expect(sup.status).toBe('active');
    expect(sup.hookFns).toEqual({ searchProvider: ['search', 'suggest'] });
    expect(Object.getPrototypeOf(sup.hookFns)).toBe(Object.prototype);
    expect(s.providersOf('searchProvider', 'suggest')).toEqual(['p']);

    // A report with no usable functions at all still activates; it just offers none.
    const bare = starting();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', bare);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s as any).onMessage(bare, { k: 'evt', topic: 'loaded', data: { hooks: ['searchProvider'], hookFns: ['suggest'] } });
    expect(bare.status).toBe('active');
    expect(bare.hookFns).toEqual({});
    expect(s.providersOf('searchProvider', 'suggest')).toEqual([]);
    expect(s.providersOf('searchProvider')).toEqual(['p']);
  });
});

describe('runtime.invokeHook defense-in-depth', () => {
  it('refuses a plugin id that is not a granted provider of the hook, even if passed directly', async () => {
    const rt = createPluginRuntime(new DatabaseService(db));
    // one legitimate granted provider exists, so providersOf('placeDetailProvider') = ['ok']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rt as any).supervisor.running.set('ok', { id: 'ok', status: 'active', hooks: ['placeDetailProvider'], events: [], granted: new Set(['hook:place-detail-provider']) });
    await expect(rt.invokeHook('other', 'placeDetailProvider', 'getDetails', [1])).rejects.toThrow(/not a granted provider/);
  });
});
