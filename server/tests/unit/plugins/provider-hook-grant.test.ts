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
});
