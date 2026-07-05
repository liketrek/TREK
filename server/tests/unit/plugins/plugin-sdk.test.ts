/**
 * The child-side SDK (#plugins, M1). Pure plumbing: every ctx method turns into
 * an RPC call, config is frozen, and log is a fire-and-forget event. Runs
 * in-process against a fake transport (no fork needed).
 */
import { describe, it, expect, vi } from 'vitest';
import { createPluginContext, definePlugin, type ChildTransport } from '../../../src/nest/plugins/runtime/plugin-sdk';

function fakeTransport() {
  const rpc = vi.fn(async () => ({ ok: true }));
  const emit = vi.fn();
  const transport = { rpc, emit } as unknown as ChildTransport;
  return { transport, rpc, emit };
}

describe('createPluginContext', () => {
  it('maps each ctx method onto the right RPC call', async () => {
    const { transport, rpc } = fakeTransport();
    // An invocation-scoped ctx: trip reads carry `_inv` so the host can bind the
    // acting user to this invocation.
    const ctx = createPluginContext('p', {}, transport, 'inv-1');

    await ctx.db.query('SELECT 1', 'a');
    expect(rpc).toHaveBeenCalledWith('db.query', { sql: 'SELECT 1', args: ['a'] });

    await ctx.db.migrate('001', 'CREATE TABLE t (x)');
    expect(rpc).toHaveBeenCalledWith('db.migrate', { id: '001', sql: 'CREATE TABLE t (x)' });

    await ctx.trips.getById(1);
    expect(rpc).toHaveBeenCalledWith('trips.getById', { tripId: 1, _inv: 'inv-1' });

    await ctx.ws.broadcastToTrip(1, 'ping', { a: 1 });
    expect(rpc).toHaveBeenCalledWith('ws.broadcastToTrip', { tripId: 1, event: 'ping', data: { a: 1 } });

    await ctx.users.getById(3);
    expect(rpc).toHaveBeenCalledWith('users.getById', { id: 3, _inv: 'inv-1' });

    await ctx.db.exec('DELETE FROM t');
    expect(rpc).toHaveBeenCalledWith('db.exec', { sql: 'DELETE FROM t', args: [] });

    await ctx.trips.getPlaces(1);
    expect(rpc).toHaveBeenCalledWith('trips.getPlaces', { tripId: 1, _inv: 'inv-1' });

    await ctx.trips.getReservations(1);
    expect(rpc).toHaveBeenCalledWith('trips.getReservations', { tripId: 1, _inv: 'inv-1' });

    await ctx.costs.getByTrip(1);
    expect(rpc).toHaveBeenCalledWith('costs.getByTrip', { tripId: 1, _inv: 'inv-1' });

    await ctx.costs.listMine();
    expect(rpc).toHaveBeenCalledWith('costs.listMine', { _inv: 'inv-1' });

    await ctx.costs.create(1, { name: 'Hotel' });
    expect(rpc).toHaveBeenCalledWith('costs.create', { tripId: 1, input: { name: 'Hotel' }, _inv: 'inv-1' });

    await ctx.costs.update(1, 5, { name: 'Hostel' });
    expect(rpc).toHaveBeenCalledWith('costs.update', { tripId: 1, itemId: 5, input: { name: 'Hostel' }, _inv: 'inv-1' });

    await ctx.costs.delete(1, 5);
    expect(rpc).toHaveBeenCalledWith('costs.delete', { tripId: 1, itemId: 5, _inv: 'inv-1' });

    await ctx.ws.broadcastToUser(9, 'poke', { x: 2 });
    expect(rpc).toHaveBeenCalledWith('ws.broadcastToUser', { userId: 9, event: 'poke', data: { x: 2 } });
  });

  it('log warn and error also emit events', () => {
    const { transport, emit } = fakeTransport();
    const ctx = createPluginContext('p', {}, transport);
    ctx.log.warn('careful');
    ctx.log.error('bad', { code: 1 });
    expect(emit).toHaveBeenCalledWith('log', { level: 'warn', msg: 'careful', meta: undefined });
    expect(emit).toHaveBeenCalledWith('log', { level: 'error', msg: 'bad', meta: { code: 1 } });
  });

  it('freezes config so a plugin cannot mutate its instance settings object', () => {
    const ctx = createPluginContext('p', { api_key: 'secret' }, fakeTransport().transport);
    expect(ctx.config.api_key).toBe('secret');
    expect(() => {
      (ctx.config as Record<string, unknown>).api_key = 'tampered';
    }).toThrow();
  });

  it('log is a fire-and-forget event, not an RPC round-trip', () => {
    const { transport, rpc, emit } = fakeTransport();
    const ctx = createPluginContext('p', {}, transport);
    ctx.log.info('hello', { n: 1 });
    expect(emit).toHaveBeenCalledWith('log', { level: 'info', msg: 'hello', meta: { n: 1 } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('definePlugin returns the definition unchanged', () => {
    const def = { onLoad: async () => {} };
    expect(definePlugin(def)).toBe(def);
  });
});
