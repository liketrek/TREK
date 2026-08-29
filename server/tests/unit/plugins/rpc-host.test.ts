/**
 * The capability router is the plugin permission boundary (#plugins, M1).
 *
 * Every handler now lives on a decorated *.rpc.ts class in its own domain, and each of
 * those has its own suite. What is left here is the router itself: an ungranted method
 * is never reachable, an unknown one is told apart from a denied one, a thrown error
 * maps to the right wire code, and the audit sink sees the call — without ever
 * spawning a child (the router runs in the host).
 */
import { PluginRpcHost, BadParams, ForbiddenResource, type HostDeps } from '../../../src/nest/plugins/host/rpc-host';
import { PluginController, PluginMethod, PluginOpenMethod } from '../../../src/nest/plugins/host/rpc-kit/decorators';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import type { PluginRpcContext } from '../../../src/nest/plugins/host/rpc-kit/types';
import type { RpcRequest, RpcResponse, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

import { describe, it, expect, vi } from 'vitest';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({
  k: 'req',
  id: 'x',
  method,
  params,
});
/**
 * A request as it arrives when the child never set `params`: the IPC hop is JSON, which
 * drops an undefined field, so the key is genuinely absent by the time the router sees
 * it. `RpcRequest` declares `params` as required, so leaving it out only type-checks
 * through this cast — writing `params: undefined` instead would put the key back and
 * stop covering the case the host's `req.params ?? {}` exists for.
 */
const reqWithoutParams = (method: string): RpcRequest => ({ k: 'req', id: 'x', method }) as RpcRequest;
const ok = (r: RpcResponse | RpcError): r is RpcResponse => r.ok === true;
const code = (r: RpcResponse | RpcError): string => (r as RpcError).error.code;

/**
 * A throwaway controller over two real wire methods, so the router can be exercised
 * without dragging a domain's services in. `tags.list` and `tags.create` are used
 * because their permissions differ, which is what the split-grant cases need.
 */
@PluginController()
class ProbeRpc {
  constructor(private readonly behaviour: (params: Record<string, unknown>, ctx: PluginRpcContext) => unknown) {}

  @PluginMethod('tags.list', { permission: 'db:read:tags' })
  read(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.behaviour(params, ctx);
  }

  @PluginMethod('tags.create', { permission: 'db:write:tags' })
  write(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.behaviour(params, ctx);
  }

  @PluginOpenMethod('events.emit')
  open(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.behaviour(params, ctx);
  }
}

const makeHost = (
  granted: string[],
  behaviour: (params: Record<string, unknown>, ctx: PluginRpcContext) => unknown = () => ({ done: true }),
  deps: HostDeps = makeDeps(),
): PluginRpcHost => new PluginRpcHost('p', new Set(granted), deps, createTestPluginRegistry([new ProbeRpc(behaviour)]));

describe('PluginRpcHost — capability enforcement', () => {
  it('RPCHOST-001 registers only granted methods; an ungranted one is PERMISSION_DENIED', async () => {
    const seen = vi.fn(() => ({ done: true }));
    const host = makeHost(['db:read:tags'], seen);
    expect(ok(await host.dispatch(req('tags.list'), 42))).toBe(true);
    expect(code(await host.dispatch(req('tags.create'), 42))).toBe('PERMISSION_DENIED');
    // The refusal happens before the handler, so the domain never runs at all.
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('RPCHOST-002 an unknown method is UNKNOWN_METHOD, not PERMISSION_DENIED', async () => {
    const host = makeHost(['db:read:tags']);
    const res = await host.dispatch(req('fs.readFile', { path: '/etc/passwd' }));
    expect(code(res)).toBe('UNKNOWN_METHOD');
    expect((res as RpcError).error.message).toBe('unknown method fs.readFile');
  });

  it('RPCHOST-003 a denied known method names the missing permission AND the plugin', async () => {
    // The old template interpolated the plugin id where the permission belonged
    // ('tags.list requires a permission "p" was not granted'), so an operator read
    // their plugin's NAME as an unknown permission. The message must name both.
    const res = await makeHost([]).dispatch(req('tags.list'), 42);
    expect((res as RpcError).error.message).toBe(
      'tags.list requires the "db:read:tags" permission, which was not granted to plugin "p"',
    );
  });

  it('RPCHOST-004 with no permissions at all, every permissioned method is denied', async () => {
    const host = makeHost([]);
    for (const method of ['tags.list', 'tags.create']) {
      expect(code(await host.dispatch(req(method), 42))).toBe('PERMISSION_DENIED');
    }
  });

  it('RPCHOST-005 an unconditional method needs no grant', async () => {
    expect(ok(await makeHost([]).dispatch(req('events.emit'), 42))).toBe(true);
  });

  it('RPCHOST-006 the host-bound acting user reaches the handler, never a params field', async () => {
    let seen: PluginRpcContext | undefined;
    const host = makeHost(['db:read:tags'], (_p, ctx) => {
      seen = ctx;
      return null;
    });
    await host.dispatch(req('tags.list', { asUserId: 999 }), 42);
    expect(seen?.actingUserId).toBe(42);
    expect(seen?.pluginId).toBe('p');
    await host.dispatch(req('tags.list'), undefined);
    expect(seen?.actingUserId).toBeUndefined();
  });

  it('RPCHOST-007 the context exposes the plugin db handle and the inter-plugin peers', async () => {
    const deps = makeDeps();
    let seen: PluginRpcContext | undefined;
    const host = makeHost(
      ['db:read:tags'],
      (_p, ctx) => {
        seen = ctx;
        return null;
      },
      deps,
    );
    await host.dispatch(req('tags.list'), 42);
    expect(seen?.data).toBe(deps.data);
    await seen?.plugins.call('other', 'sum', [1], 42);
    expect(deps.callPlugin).toHaveBeenCalledWith('other', 'sum', [1], 42);
    seen?.plugins.emit('ping', { a: 1 });
    expect(deps.emitPluginEvent).toHaveBeenCalledWith('ping', { a: 1 });
  });

  it('RPCHOST-008 BadParams and ForbiddenResource map to their own wire codes', async () => {
    expect(
      code(
        await makeHost(['db:read:tags'], () => {
          throw new BadParams('sql must be a string');
        }).dispatch(req('tags.list'), 42),
      ),
    ).toBe('BAD_PARAMS');
    expect(
      code(
        await makeHost(['db:read:tags'], () => {
          throw new ForbiddenResource('no access to trip 9');
        }).dispatch(req('tags.list'), 42),
      ),
    ).toBe('RESOURCE_FORBIDDEN');
  });

  it('RPCHOST-009 any other error becomes HOST_ERROR with its message', async () => {
    const res = await makeHost(['db:read:tags'], () => {
      throw new Error('disk gone');
    }).dispatch(req('tags.list'), 42);
    expect(code(res)).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('disk gone');
  });

  it('RPCHOST-010 a non-Error throw still maps to HOST_ERROR, with a generic message', async () => {
    const res = await makeHost(['db:read:tags'], () => {
      throw 'raw string';
    }).dispatch(req('tags.list'), 42);
    expect(code(res)).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('internal error');
  });

  it('RPCHOST-011 an async handler is awaited before the response is built', async () => {
    const host = makeHost(['db:read:tags'], async () => {
      await Promise.resolve();
      return { late: true };
    });
    expect(((await host.dispatch(req('tags.list'), 42)) as RpcResponse).result).toEqual({ late: true });
  });

  it('RPCHOST-012 a rejected promise is mapped like a throw', async () => {
    const host = makeHost(['db:read:tags'], async () => {
      throw new BadParams('async refusal');
    });
    expect(code(await host.dispatch(req('tags.list'), 42))).toBe('BAD_PARAMS');
  });

  it('RPCHOST-013 missing params are treated as an empty object, not a crash', async () => {
    let seen: Record<string, unknown> | undefined;
    const host = makeHost(['db:read:tags'], (params) => {
      seen = params;
      return null;
    });
    expect(ok(await host.dispatch(reqWithoutParams('tags.list'), 42))).toBe(true);
    expect(seen).toEqual({});
  });

  it('RPCHOST-014 the audit sink sees the outcome of an auditable call, denials included', async () => {
    const audit = vi.fn();
    const deps = { ...makeDeps(), audit };
    expect(ok(await makeHost(['db:read:tags'], () => null, deps).dispatch(req('tags.list'), 42))).toBe(true);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ pluginId: 'p', actingUserId: 42, method: 'tags.list', code: 'ok' }),
    );
    audit.mockClear();
    await makeHost([], () => null, deps).dispatch(req('tags.list'), 42);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ method: 'tags.list', code: 'PERMISSION_DENIED' }));
  });

  it('RPCHOST-015 a throwing audit sink never breaks the call it was auditing', async () => {
    const audit = vi.fn(() => {
      throw new Error('audit table is gone');
    });
    const host = makeHost(['db:read:tags'], () => ({ done: true }), { ...makeDeps(), audit });
    expect(ok(await host.dispatch(req('tags.list'), 42))).toBe(true);
  });

  it('RPCHOST-016 dispose() closes the plugin data db, and a second close is harmless', () => {
    const deps = makeDeps();
    const host = makeHost(['db:read:tags'], () => null, deps);
    host.dispose();
    expect(deps.data.close).toHaveBeenCalled();
    (deps.data.close as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('already closed');
    });
    expect(() => host.dispose()).not.toThrow();
  });

  it('RPCHOST-017 a method the registry does not own is rejected, not silently answered', async () => {
    // The registry is the ONLY source of handlers now, so a class that was never
    // listed in its module makes every one of its methods PERMISSION_DENIED. This is
    // the failure mode that has no other symptom, which is why each domain suite also
    // asserts its class is in the module providers.
    const bare = new PluginRpcHost('p', new Set(['db:read:tags']), makeDeps(), createTestPluginRegistry([]));
    expect(code(await bare.dispatch(req('tags.list'), 42))).toBe('PERMISSION_DENIED');
  });
});
