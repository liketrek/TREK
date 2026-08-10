/**
 * The tags plugin surface, after it moved from the router's has() blocks onto
 * @PluginMethod. The dispatch-level cases are the ones that used to live in
 * rpc-host.test.ts: same requests, same expected codes. Only the construction line
 * and the stub identity changed, which is the diff a reviewer should be reading.
 *
 * The rest are the per-handler cases the router-level test never had room for, in
 * particular the ownership re-check on the two writes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { BadParams, ForbiddenResource } from '../../../src/nest/plugins/host/rpc-errors';
import { TagsRpc } from '../../../src/nest/tags/tags.rpc';
import { TagsModule } from '../../../src/nest/tags/tags.module';
import type { TagsService } from '../../../src/nest/tags/tags.service';
import type { PluginRpcContext } from '../../../src/nest/plugins/host/rpc-kit/types';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const ctx = (actingUserId: number | undefined): PluginRpcContext => ({
  pluginId: 'p',
  actingUserId,
  data: {} as PluginRpcContext['data'],
  // No tags handler reaches for a peer plugin, but the peers are a real collaborator on
  // the context, so they get functions that throw rather than an object whose methods
  // would silently be undefined if a handler ever did reach for one.
  plugins: {
    call: () => Promise.reject(new Error('ctx: no peer plugin router in these cases')),
    emit: () => {
      throw new Error('ctx: no peer plugin router in these cases');
    },
  },
});

/** Tag 1 belongs to user 42, nothing else does. */
function makeTags() {
  return {
    list: vi.fn((userId: number) => [{ id: 1, user_id: userId, name: 'work' }]),
    getByIdAndUser: vi.fn((id: string | number, userId: number) =>
      Number(id) === 1 && userId === 42 ? { id: 1, user_id: 42, name: 'work' } : undefined,
    ),
    create: vi.fn((userId: number, name: string, color?: string) => ({ id: 9, user_id: userId, name, color })),
    update: vi.fn((id: string | number, name?: string, color?: string) => ({ id, name, color })),
    remove: vi.fn(),
  } as unknown as TagsService & Record<string, ReturnType<typeof vi.fn>>;
}

describe('TagsRpc through the router', () => {
  let tags: ReturnType<typeof makeTags>;
  let host: PluginRpcHost;

  beforeEach(() => {
    tags = makeTags();
    host = new PluginRpcHost(
      'p',
      new Set(['db:read:tags', 'db:write:tags']),
      makeDeps(),
      createTestPluginRegistry([new TagsRpc(tags)]),
    );
  });

  it('TAGS-RPC-001 tags are the acting user\'s own; a userless context + empty name are refused', async () => {
    expect((await host.dispatch(req('tags.list'), 42)).ok).toBe(true);
    expect(tags.list).toHaveBeenCalledWith(42);
    expect((await host.dispatch(req('tags.create', { input: { name: 'work' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('tags.list'), undefined)).ok).toBe(false);
    expect((await host.dispatch(req('tags.create', { input: { name: '' } }), 42)).ok).toBe(false);
  });

  it('TAGS-RPC-002 a userless read is RESOURCE_FORBIDDEN and never touches the service', async () => {
    const res = (await host.dispatch(req('tags.list'), undefined)) as RpcError;
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('tag reads require an authenticated user context');
    expect(tags.list).not.toHaveBeenCalled();
  });

  it('TAGS-RPC-003 a blank name is BAD_PARAMS, not a refusal', async () => {
    const res = (await host.dispatch(req('tags.create', { input: { name: '   ' } }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe('tag name is required');
    expect(tags.create).not.toHaveBeenCalled();
  });

  it('TAGS-RPC-004 editing another user\'s tag is RESOURCE_FORBIDDEN', async () => {
    const res = (await host.dispatch(req('tags.update', { tagId: 2, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('no tag 2 for this user');
    expect(tags.update).not.toHaveBeenCalled();
  });

  it('TAGS-RPC-005 db:read:tags alone does not unlock a write', async () => {
    const readOnly = new PluginRpcHost(
      'p',
      new Set(['db:read:tags']),
      makeDeps(),
      createTestPluginRegistry([new TagsRpc(tags)]),
    );
    const res = (await readOnly.dispatch(req('tags.create', { input: { name: 'work' } }), 42)) as RpcError;
    expect(res.error.code).toBe('PERMISSION_DENIED');
    expect(tags.create).not.toHaveBeenCalled();
  });

  it('TAGS-RPC-006 db:write:tags alone does not unlock the read', async () => {
    const writeOnly = new PluginRpcHost(
      'p',
      new Set(['db:write:tags']),
      makeDeps(),
      createTestPluginRegistry([new TagsRpc(tags)]),
    );
    expect(((await writeOnly.dispatch(req('tags.list'), 42)) as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('TAGS-RPC-007 with no tags grant at all, every method is PERMISSION_DENIED', async () => {
    const none = new PluginRpcHost('p', new Set([]), makeDeps(), createTestPluginRegistry([new TagsRpc(tags)]));
    for (const method of ['tags.list', 'tags.create', 'tags.update', 'tags.delete']) {
      expect(((await none.dispatch(req(method, { tagId: 1 }), 42)) as RpcError).error.code).toBe('PERMISSION_DENIED');
    }
  });
});

describe('TagsRpc is reachable at all', () => {
  it('TAGS-RPC-017 the class is listed in its module providers', () => {
    // The one failure the compiler cannot see: a decorated class that no module
    // registers is invisible to discovery, and every tags.* call then comes back
    // PERMISSION_DENIED with no other symptom. Cheapest possible guard against it.
    expectRegisteredProvider(TagsModule, TagsRpc);
  });
});

describe('TagsRpc handlers', () => {
  let tags: ReturnType<typeof makeTags>;
  let rpc: TagsRpc;

  beforeEach(() => {
    tags = makeTags();
    rpc = new TagsRpc(tags);
  });

  it('TAGS-RPC-008 list returns the acting user\'s tags', () => {
    expect(rpc.list({}, ctx(42))).toEqual([{ id: 1, user_id: 42, name: 'work' }]);
  });

  it('TAGS-RPC-009 create passes name and colour through', () => {
    expect(rpc.create({ input: { name: 'work', color: '#abc' } }, ctx(42))).toEqual({
      id: 9,
      user_id: 42,
      name: 'work',
      color: '#abc',
    });
  });

  it('TAGS-RPC-010 a non-string colour is dropped rather than passed on', () => {
    rpc.create({ input: { name: 'work', color: 123 } }, ctx(42));
    expect(tags.create).toHaveBeenCalledWith(42, 'work', undefined);
  });

  it('TAGS-RPC-011 a non-object input is wrapped, so the name check still refuses it', () => {
    expect(() => rpc.create({ input: 'work' }, ctx(42))).toThrow(new BadParams('tag name is required'));
  });

  it('TAGS-RPC-012 a userless write says "writes", not "reads"', () => {
    expect(() => rpc.create({ input: { name: 'x' } }, ctx(undefined))).toThrow(
      new ForbiddenResource('tag writes require an authenticated user context'),
    );
    expect(() => rpc.update({ tagId: 1 }, ctx(undefined))).toThrow(
      new ForbiddenResource('tag writes require an authenticated user context'),
    );
    expect(() => rpc.delete({ tagId: 1 }, ctx(undefined))).toThrow(
      new ForbiddenResource('tag writes require an authenticated user context'),
    );
  });

  it('TAGS-RPC-013 update only forwards the fields it was given', () => {
    rpc.update({ tagId: 1, input: { name: 'renamed' } }, ctx(42));
    expect(tags.update).toHaveBeenCalledWith(1, 'renamed', undefined);
  });

  it('TAGS-RPC-014 a missing tagId is BAD_PARAMS before the ownership check runs', () => {
    expect(() => rpc.update({ input: { name: 'x' } }, ctx(42))).toThrow(new BadParams('tagId must be a number'));
    expect(tags.getByIdAndUser).not.toHaveBeenCalled();
  });

  it('TAGS-RPC-015 delete re-checks ownership and reports the deletion', () => {
    expect(rpc.delete({ tagId: 1 }, ctx(42))).toEqual({ deleted: true });
    expect(tags.remove).toHaveBeenCalledWith(1);
  });

  it('TAGS-RPC-016 deleting another user\'s tag never reaches remove()', () => {
    expect(() => rpc.delete({ tagId: 2 }, ctx(42))).toThrow(new ForbiddenResource('no tag 2 for this user'));
    expect(tags.remove).not.toHaveBeenCalled();
  });
});
