/**
 * The supervisor tags every host-bound request with `_inv`, resolves the acting user
 * from it BEFORE dispatch, and then passes the request on untouched. That made `_inv`
 * visible to every handler and, in effect, a reserved param name.
 *
 * dispatch() now strips it. These tests prove the strip is invisible: the same result,
 * the same audit row, and the acting user still resolved from the host side.
 */
import { describe, it, expect, vi } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcRequest, RpcResponse } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PackingRpc } from '../../../src/nest/packing/packing.rpc';
import type { PackingService } from '../../../src/nest/packing/packing.service';
import type { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';

const req = (method: string, params: Record<string, unknown>): RpcRequest => ({ k: 'req', id: 'x', method, params });

describe('dispatch strips the supervisor _inv marker', () => {
  it('RPCINV-001 the handler never sees _inv', async () => {
    const deps = makeDeps();
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    await host.dispatch(req('db.query', { sql: 'SELECT 1', args: [], _inv: 'req-7' }));
    expect(deps.data.query).toHaveBeenCalledWith('SELECT 1', []);
  });

  it('RPCINV-002 the result is identical with and without the marker', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), makeDeps());
    const withMarker = (await host.dispatch(req('db.query', { sql: 'SELECT 1', _inv: 'req-7' }))) as RpcResponse;
    const without = (await host.dispatch(req('db.query', { sql: 'SELECT 1' }))) as RpcResponse;
    expect(withMarker.ok).toBe(true);
    expect(withMarker.result).toEqual(without.result);
  });

  it('RPCINV-003 the audit row is unchanged, because auditResource reads named fields only', async () => {
    const deps = makeDeps();
    const audit = vi.fn();
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), { ...deps, audit });
    await host.dispatch(req('trips.getById', { tripId: 1, _inv: 'req-7' }), 42);
    expect(audit).toHaveBeenCalledWith({
      pluginId: 'p',
      actingUserId: 42,
      method: 'trips.getById',
      resource: 'trip:1',
      code: 'ok',
    });
  });

  it('RPCINV-004 the acting user still comes from the host, not from the params', async () => {
    const deps = makeDeps();
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    // No acting user bound: the trip read is refused even though _inv is present.
    const res = await host.dispatch(req('trips.getById', { tripId: 1, _inv: 'req-7' }));
    expect(res.ok).toBe(false);
    expect((res as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('RPCINV-005 params without the marker are passed through untouched', async () => {
    const deps = makeDeps();
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    await host.dispatch(req('db.exec', { sql: 'INSERT INTO t VALUES (1)', args: [1] }));
    expect(deps.data.exec).toHaveBeenCalledWith('INSERT INTO t VALUES (1)', [1]);
  });

  it('RPCINV-006 a handler reading the whole payload object no longer finds _inv in it', async () => {
    // packing.setBagMembers is the one handler that reads the params object as a
    // whole (asPayload(p).userIds) rather than a named field off it, which makes it
    // the case where a stray _inv could actually change behaviour.
    const setBagMembers = vi.fn(() => ({ bagId: 80, members: [3] }));
    const packing = { setBagMembers } as unknown as PackingService;
    const guards = {
      requireActor: () => 42,
      requireTripEdit: () => undefined,
    } as unknown as PluginGuards;
    const realtime = { broadcast: vi.fn() } as unknown as RealtimeService;
    const host = new PluginRpcHost(
      'p',
      new Set(['db:write:packing']),
      makeDeps(),
      createTestPluginRegistry([new PackingRpc(packing, realtime, guards)]),
    );
    await host.dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [3], _inv: 'req-7' }), 42);
    expect(setBagMembers).toHaveBeenCalledWith('1', '80', [3]);
  });
});
