/**
 * Supervisor lifecycle edge cases (#plugins). These drive the in-memory state
 * machine directly (spawn stubbed) — no child fork — to prove the recovery paths
 * an admin depends on: re-activating a plugin that died stays possible, and a
 * crash-restart cycle doesn't leak the dead child's cron tasks.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { RpcRateLimiter } from '../../../src/nest/plugins/host/rate-limit';

function makeSupervisor() {
  const dispose = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = new PluginSupervisor((() => ({ dispose })) as any, {}, {});
  const spawn = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s as any).spawn = spawn;
  return { s, spawn, dispose };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const entry = (s: PluginSupervisor, id: string, status: string) => (s as any).running.get(id);

describe('supervisor re-activation after failure', () => {
  const supers: PluginSupervisor[] = [];
  afterEach(() => { for (const s of supers) { void s.shutdownAll().catch(() => {}); } supers.length = 0; });

  it('re-activating a plugin left in error state re-spawns instead of silently no-op-ing', () => {
    const { s, spawn } = makeSupervisor();
    supers.push(s);
    // A prior crash-auto-disable / load-error leaves a dead entry in running.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', { id: 'p', status: 'error', jobTasks: undefined, pending: new Map(), invocations: new Map(), crashes: [] });

    void s.activate('p', new Set());

    expect(spawn).toHaveBeenCalledTimes(1);           // it re-spawned, not no-op
    expect(entry(s, 'p').status).toBe('starting');    // fresh entry replaced the dead one
  });

  it('re-activating a LIVE plugin is an idempotent no-op', () => {
    const { s, spawn } = makeSupervisor();
    supers.push(s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', { id: 'p', status: 'active', jobTasks: undefined, pending: new Map(), invocations: new Map(), crashes: [] });

    void s.activate('p', new Set());

    expect(spawn).not.toHaveBeenCalled();
    expect(entry(s, 'p').status).toBe('active');      // untouched
  });
});

describe('supervisor shutdownAll is a clean stop, not a crash', () => {
  it('marks plugins stopped BEFORE killing, so a child exit during shutdown logs no phantom crash', async () => {
    const onStatus = vi.fn(); const onLog = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = new PluginSupervisor((() => ({ dispose: vi.fn() })) as any, { onStatus, onLog }, {});
    const sup = { id: 'p', status: 'active', child: {}, rpcHost: { dispose: vi.fn() }, crashes: [], jobTasks: undefined, pending: new Map(), invocations: new Map() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sup);
    // kill() simulates the child actually exiting during shutdown → fires onExit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).kill = vi.fn(async (x: any) => { (s as any).onExit(x, 0, 'SIGTERM'); });
    await s.shutdownAll();
    expect(sup.status).toBe('stopped');                                    // stopped before kill
    // onExit took the early-return path — no crash bookkeeping written to the DB hooks
    expect(onLog).not.toHaveBeenCalledWith('p', 'warn', expect.stringContaining('crashed'));
    expect(onStatus).not.toHaveBeenCalledWith('p', 'error', expect.anything());
    expect(onStatus).not.toHaveBeenCalledWith('p', 'starting', expect.anything());
  });
});

describe('supervisor crash-restart does not leak cron tasks', () => {
  it('onExit stops the dead child\'s jobTasks before re-scheduling', () => {
    const { s } = makeSupervisor();
    const stop = vi.fn();
    const sup = {
      id: 'p', status: 'active', child: {}, jobTasks: [{ stop }],
      pending: new Map(), invocations: new Map(), crashes: [],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sup);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).onExit(sup, 1, null);

    expect(stop).toHaveBeenCalledTimes(1); // the previous incarnation's tasks were stopped
    expect(sup.jobTasks).toBeUndefined();  // reference cleared so it can't be double-stopped
  });
});

describe('supervisor buffers events across a restart and replays on activation', () => {
  // A subscriber with a grant + one subscription, at an arbitrary status.
  const sub = (status: string) => ({
    id: 'p', status, granted: new Set(['events:subscribe']), events: ['trip:updated'],
  });

  it('an active subscriber gets the event immediately, nothing buffered', () => {
    const { s } = makeSupervisor();
    const invoke = vi.fn((..._a: unknown[]) => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = invoke;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sub('active'));
    s.deliverEvent(7, 'trip:updated');
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0][1]).toBe('invoke.event');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).pendingEvents.get('p')).toBeUndefined();
  });

  it('an event that fires while the subscriber is starting is buffered, then replayed on activation', () => {
    const { s } = makeSupervisor();
    const invoke = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = invoke;
    const sup = sub('starting');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sup);
    s.deliverEvent(7, 'trip:updated');
    expect(invoke).not.toHaveBeenCalled();                 // held, not delivered mid-restart
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).pendingEvents.get('p')).toHaveLength(1);
    // plugin comes back
    sup.status = 'active';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).flushPendingEvents(sup);
    expect(invoke).toHaveBeenCalledTimes(1);                // replayed exactly once
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).pendingEvents.get('p')).toBeUndefined(); // buffer drained
  });

  it('a deliberately stopped subscriber neither receives nor buffers the event', () => {
    const { s } = makeSupervisor();
    const invoke = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = invoke;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sub('stopped'));
    s.deliverEvent(7, 'trip:updated');
    expect(invoke).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).pendingEvents.get('p')).toBeUndefined();
  });

  it('flush drops expired events and re-checks the grant (nothing leaks if it was revoked while down)', () => {
    const { s } = makeSupervisor();
    const invoke = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = invoke;
    const sup = sub('active');
    // one fresh + one already-expired buffered event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).pendingEvents.set('p', [
      { tripId: 1, event: 'trip:updated', expiresAt: Date.now() + 60_000 },
      { tripId: 2, event: 'trip:updated', expiresAt: Date.now() - 1 },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).flushPendingEvents(sup);
    expect(invoke).toHaveBeenCalledTimes(1);                // only the unexpired one
    // grant revoked while down → flush delivers nothing
    invoke.mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).pendingEvents.set('p', [{ tripId: 1, event: 'trip:updated', expiresAt: Date.now() + 60_000 }]);
    sup.granted = new Set();                                // grant gone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).flushPendingEvents(sup);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('the buffer is bounded per plugin (drop-oldest past the cap)', () => {
    const { s } = makeSupervisor();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', sub('starting'));
    for (let i = 0; i < 250; i++) s.deliverEvent(i, 'trip:updated');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (s as any).pendingEvents.get('p');
    expect(q).toHaveLength(200);                            // capped
    expect(q[0].tripId).toBe(50);                           // oldest 50 dropped
  });

  it('disable() clears a plugin\'s buffered events', () => {
    const { s } = makeSupervisor();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', { id: 'p', status: 'starting', granted: new Set(), events: [], jobTasks: undefined, pending: new Map(), invocations: new Map(), crashes: [], rpcHost: { dispose: vi.fn() } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).pendingEvents.set('p', [{ tripId: 1, event: 'trip:updated', expiresAt: Date.now() + 60_000 }]);
    void s.disable('p');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).pendingEvents.get('p')).toBeUndefined();
  });
});

describe('supervisor GDPR user-data hooks are grant- and status-gated', () => {
  const withGrant = (status: string) => ({ id: 'p', status, granted: new Set(['hook:user-data']) });

  it('deliverUserErasure ACKs for an active plugin (a queued erasure is a duty, not grant-gated)', async () => {
    const { s } = makeSupervisor();
    const invoke = vi.fn(() => Promise.resolve({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = invoke;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', withGrant('active'));
    expect(await s.deliverUserErasure('p', 42)).toBe(true);
    expect(invoke).toHaveBeenCalledWith('p', 'invoke.deleteUserData', { userId: 42 }, expect.objectContaining({ actingUserId: undefined }));
    // inactive → not delivered, not acked (stays queued by the caller)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', withGrant('starting'));
    invoke.mockClear();
    expect(await s.deliverUserErasure('p', 42)).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
    // active but the grant was later DROPPED → still delivered (the row was enqueued
    // while it held the grant; refusing would strand the user's data forever)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', { id: 'p', status: 'active', granted: new Set() });
    expect(await s.deliverUserErasure('p', 42)).toBe(true);
  });

  it('deliverUserErasure resolves false when the child errors (so the row is retried)', async () => {
    const { s } = makeSupervisor();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = vi.fn(() => Promise.reject(new Error('child died')));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', withGrant('active'));
    expect(await s.deliverUserErasure('p', 42)).toBe(false);
  });

  it('collectUserExport returns the plugin payload, undefined when ungranted/inactive', async () => {
    const { s } = makeSupervisor();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = vi.fn(() => Promise.resolve({ ok: true, data: [{ v: 1 }] }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', withGrant('active'));
    expect(await s.collectUserExport('p', 42)).toEqual({ ok: true, data: [{ v: 1 }] });
    // ungranted/inactive → undefined (not applicable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', { id: 'p', status: 'active', granted: new Set() });
    expect(await s.collectUserExport('p', 42)).toBeUndefined();
    // active + granted but the export throws → { ok: false } (flagged incomplete, not omitted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = vi.fn(() => Promise.reject(new Error('timeout')));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).running.set('p', withGrant('active'));
    expect(await s.collectUserExport('p', 42)).toEqual({ ok: false });
  });
});

describe('supervisor rate-limits ctx.* dispatch', () => {
  it('refuses a throttled call with HOST_ERROR instead of dispatching it', async () => {
    const { s } = makeSupervisor();
    const dispatch = vi.fn(async () => ({ k: 'res', id: 'x', ok: true, result: 1 }));
    const send = vi.fn();
    const sup = {
      id: 'p', status: 'active', child: { send }, rpcHost: { dispatch },
      invocations: new Map(), pending: new Map(),
      rpcLimiter: new RpcRateLimiter({ burst: 1, perSec: 0, maxInFlight: 8 }, 0),
    };
    const req = { k: 'req', id: 'r1', method: 'db.query', params: {} };
    // first call within the burst -> dispatched
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s as any).onMessage(sup, req);
    expect(dispatch).toHaveBeenCalledTimes(1);
    // second call is over budget -> refused, never reaches dispatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s as any).onMessage(sup, { ...req, id: 'r2' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    const last = send.mock.calls[send.mock.calls.length - 1][0];
    expect(last).toMatchObject({ k: 'res', id: 'r2', ok: false, error: { code: 'HOST_ERROR' } });
  });
});
