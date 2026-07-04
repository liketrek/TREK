/**
 * The capability router is the plugin permission boundary (#plugins, M1). These
 * tests prove that an ungranted method is never reachable, a granted method
 * works, a granted trip read is still membership-checked against the acting
 * user, and bad params / unknown methods are rejected — without ever spawning a
 * child (the router runs in the host).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginRpcHost, type HostDeps } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcRequest, RpcResponse, RpcError } from '../../../src/nest/plugins/protocol/envelope';

function makeDeps(): HostDeps {
  return {
    data: {
      query: vi.fn(() => [{ n: 1 }]),
      exec: vi.fn(() => ({ changes: 1 })),
      migrate: vi.fn(() => ({ applied: true })),
      close: vi.fn(),
    } as unknown as HostDeps['data'],
    db: {
      prepare: vi.fn((sql: string) => ({
        all: () => [{ id: 7, name: 'Place' }],
        get: () =>
          sql.includes('FROM trips')
            ? { id: 1, title: 'Japan', start_date: '2027-01-01' }
            : { id: 3, username: 'ada', display_name: 'Ada', avatar: null },
      })),
    },
    // trip 1 is accessible to user 42; everything else is not
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1 } : undefined)),
    // user 42 may see user 3 (they share a trip); nobody else
    canSeeUser: vi.fn((actingUserId: number, targetUserId: number) => actingUserId === 42 && targetUserId === 3),
    broadcastToTrip: vi.fn(),
    broadcastToUser: vi.fn(),
  };
}

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const ok = (r: RpcResponse | RpcError): r is RpcResponse => r.ok === true;

describe('PluginRpcHost — capability enforcement', () => {
  let deps: HostDeps;
  beforeEach(() => { deps = makeDeps(); });

  it('registers only granted methods; an ungranted method is PERMISSION_DENIED', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const denied = await host.dispatch(req('trips.getById', { tripId: 1, asUserId: 42 }));
    expect(denied.ok).toBe(false);
    expect((denied as RpcError).error.code).toBe('PERMISSION_DENIED');
    expect(deps.canAccessTrip).not.toHaveBeenCalled();
  });

  it('a granted db:own method runs against the plugin db', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: [] }));
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual([{ n: 1 }]);
    expect(deps.data.query).toHaveBeenCalledWith('SELECT 1', []);
  });

  it('an unknown method is UNKNOWN_METHOD, not PERMISSION_DENIED', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('fs.readFile', { path: '/etc/passwd' }));
    expect((res as RpcError).error.code).toBe('UNKNOWN_METHOD');
  });

  it('db:read:trips reads a trip the acting user can access', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    // The acting user is bound by the HOST (2nd dispatch arg), never from params.
    const res = await host.dispatch(req('trips.getById', { tripId: 1 }), 42);
    expect(ok(res)).toBe(true);
    // returns the ACTUAL trip row (title/start_date), not the access-check object
    expect((res as RpcResponse).result).toMatchObject({ id: 1, title: 'Japan', start_date: '2027-01-01' });
    expect(deps.db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM trips'));
  });

  it('db:read:trips is still RESOURCE_FORBIDDEN when the user is not a member', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('trips.getById', { tripId: 1 }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('a trip read with NO bound acting user is RESOURCE_FORBIDDEN (jobs / forged calls)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    // A plugin-supplied asUserId is ignored; without a host-bound user, deny.
    const res = await host.dispatch(req('trips.getById', { tripId: 1, asUserId: 42 }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.canAccessTrip).not.toHaveBeenCalled();
  });

  it('trips.getPlaces is membership-checked before the core read', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const forbidden = await host.dispatch(req('trips.getPlaces', { tripId: 2 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.db.prepare).not.toHaveBeenCalled();

    const allowed = await host.dispatch(req('trips.getPlaces', { tripId: 1 }), 42);
    expect(ok(allowed)).toBe(true);
    expect((allowed as RpcResponse).result).toEqual([{ id: 7, name: 'Place' }]);
  });

  it('db:read:users returns only the public projection for a visible user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:users']), deps);
    const res = await host.dispatch(req('users.getById', { id: 3 }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual({ id: 3, username: 'ada', display_name: 'Ada', avatar: null });
    // the SELECT column list is host-controlled — no password/token columns
    expect(deps.db.prepare).toHaveBeenCalledWith(expect.stringContaining('id, username, display_name, avatar'));
  });

  it('db:read:users is RESOURCE_FORBIDDEN for a user the acting user cannot see (no enumeration)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:users']), deps);
    const forbidden = await host.dispatch(req('users.getById', { id: 999 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    // and with no bound acting user (job / forged call), also denied
    const noUser = await host.dispatch(req('users.getById', { id: 3 }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('ws:broadcast:trip forwards to the (namespaced) broadcaster for a member', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:trip']), deps);
    const res = await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'ping', data: { a: 1 } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.broadcastToTrip).toHaveBeenCalledWith(1, 'ping', { a: 1 });
  });

  it('ws:broadcast:trip is RESOURCE_FORBIDDEN for a non-member trip (no cross-tenant push)', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:trip']), deps);
    const forbidden = await host.dispatch(req('ws.broadcastToTrip', { tripId: 999, event: 'x', data: {} }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.broadcastToTrip).not.toHaveBeenCalled();
    // and a broadcast with no bound acting user is denied too
    const noUser = await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'x', data: {} }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('bad params are BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { args: [] }));
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
  });

  it('with no permissions, every real method is denied', async () => {
    const host = new PluginRpcHost('p', new Set<string>(), deps);
    for (const m of ['db.query', 'trips.getById', 'users.getById', 'ws.broadcastToTrip']) {
      const res = await host.dispatch(req(m, { tripId: 1, asUserId: 42, id: 3, event: 'x', sql: 'SELECT 1' }));
      expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
    }
  });

  it('ws:broadcast:user forwards only to the acting user (never an arbitrary one)', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:user']), deps);
    const res = await host.dispatch(req('ws.broadcastToUser', { userId: 42, event: 'poke', data: { x: 2 } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.broadcastToUser).toHaveBeenCalledWith(42, { event: 'poke', x: 2 });
    // broadcasting to a DIFFERENT user is refused
    const forbidden = await host.dispatch(req('ws.broadcastToUser', { userId: 9, event: 'poke', data: {} }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('non-array db args are BAD_PARAMS; a primitive ws payload is wrapped', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own', 'ws:broadcast:trip']), deps);
    const bad = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: 'nope' }));
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');

    await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'ping', data: 'primitive' }), 42);
    expect(deps.broadcastToTrip).toHaveBeenCalledWith(1, 'ping', { value: 'primitive' });
  });

  it('dispose() closes the plugin data db', () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    host.dispose();
    expect(deps.data.close).toHaveBeenCalled();
  });

  it('trips.getReservations is membership-checked and reads reservations', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('trips.getReservations', { tripId: 1 }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM reservations'));
  });

  it('an error thrown by a handler becomes HOST_ERROR', async () => {
    (deps.data.query as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('disk gone');
    });
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: [] }));
    expect((res as RpcError).error.code).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('disk gone');
  });

  it('a non-Error thrown by a handler still maps to HOST_ERROR', async () => {
    (deps.data.query as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw 'raw string';
    });
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1' }));
    expect((res as RpcError).error.code).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('internal error');
  });

  it('coerces numeric string params and tolerates a missing params object', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips', 'db:own']), deps);
    // tripId as a string -> coerced to a number; acting user is the bound host arg
    const res = await host.dispatch(req('trips.getById', { tripId: '1' }), 42);
    expect(ok(res)).toBe(true);
    // a request with no params object at all -> BAD_PARAMS (sql missing), not a crash
    const noParams = await host.dispatch({ k: 'req', id: 'y', method: 'db.query', params: undefined });
    expect((noParams as RpcError).error.code).toBe('BAD_PARAMS');
  });
});
