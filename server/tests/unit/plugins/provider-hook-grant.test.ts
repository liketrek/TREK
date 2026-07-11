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
import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

function makeSupervisor(): PluginSupervisor {
  // createRpcHost is never called on the providersOf path (no spawn).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PluginSupervisor((() => ({})) as any, {}, {});
}
function put(s: PluginSupervisor, id: string, status: string, hooks: string[], granted: string[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s as any).running.set(id, { id, status, hooks, granted: new Set(granted) });
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

describe('runtime.invokeHook defense-in-depth', () => {
  it('refuses a plugin id that is not a granted provider of the hook, even if passed directly', async () => {
    const rt = new PluginRuntimeService();
    // one legitimate granted provider exists, so providersOf('placeDetailProvider') = ['ok']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rt as any).supervisor.running.set('ok', { id: 'ok', status: 'active', hooks: ['placeDetailProvider'], events: [], granted: new Set(['hook:place-detail-provider']) });
    await expect(rt.invokeHook('other', 'placeDetailProvider', 'getDetails', [1])).rejects.toThrow(/not a granted provider/);
  });
});
