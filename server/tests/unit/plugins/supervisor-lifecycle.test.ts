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
