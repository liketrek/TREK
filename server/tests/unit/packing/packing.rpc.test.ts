/**
 * The packing plugin surface after it moved onto @PluginMethod.
 *
 * The four public/private transitions (#858) are the reason this file is long. Each
 * one is asserted separately, because getting any of them wrong leaks a private item
 * to the whole trip room, and because the logic now lives once in PackingService
 * instead of three times over.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { PackingRpc } from '../../../src/nest/packing/packing.rpc';
import { PackingModule } from '../../../src/nest/packing/packing.module';
import { PackingService } from '../../../src/nest/packing/packing.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';
import { notificationsStub } from '../../helpers/notifications';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

type Item = { id: number; name?: string; is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] };

/**
 * A REAL PackingService over a fake realtime, so the broadcast fan-out under test is
 * the production one; only the data methods are stubbed.
 */
function build(opts: { canEdit?: boolean; before?: Item | undefined; updated?: Item | null } = {}) {
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const packing = new PackingService({} as never, {} as never, realtime, notificationsStub());
  const data = {
    listItems: vi.fn(() => [{ id: 70, name: 'Socks' }]),
    // The bodies here are the boring fixture; the item writes are typed as Item so a
    // case can hand back the privacy fields the real service selects (#858), which the
    // fixture itself never bothers to set.
    createItem: vi.fn((_t: string, i: Record<string, unknown>): Item => ({ id: 70, ...i })),
    getItemPrivacy: vi.fn(() => opts.before),
    updateItem: vi.fn(() => (opts.updated === undefined ? { id: 70, is_private: 0 } : opts.updated)),
    deleteItem: vi.fn((_t: string, id: string): Item | null => (id === '70' ? { id: 70, is_private: 0 } : null)),
    listBags: vi.fn(() => [{ id: 80, name: 'Backpack' }]),
    createBag: vi.fn((_t: string, b: Record<string, unknown>) => ({ id: 80, ...b })),
    updateBag: vi.fn((_t: string, id: string) => (id === '80' ? { id: 80 } : null)),
    deleteBag: vi.fn((_t: string, id: string) => id === '80'),
    setBagMembers: vi.fn((_t: string, id: string, ids: number[]) => (id === '80' ? { bagId: 80, members: ids } : null)),
  };
  Object.assign(packing, data);
  const guards = new PluginGuards(
    {
      canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService,
    { checkPermission: vi.fn(() => opts.canEdit ?? true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const rpc = new PackingRpc(packing, realtime, guards);
  const host = (...grants: string[]) => new PluginRpcHost('p', new Set(grants), makeDeps(), createTestPluginRegistry([rpc]));
  return { packing, data, realtime, rpc, host };
}

/** Every (event, onlyUserId) pair the fan-out produced, in order. */
const fanout = (realtime: { broadcast: ReturnType<typeof vi.fn> }) =>
  realtime.broadcast.mock.calls.map((c) => [c[1], c[4]]);

describe('PackingRpc through the router', () => {
  it('PACKING-RPC-001 packing.list is membership-checked and scoped to the acting user', async () => {
    const f = build();
    const host = f.host('db:read:packing');
    expect((await host.dispatch(req('packing.list', { tripId: 1 }), 42)).ok).toBe(true);
    // The user id is handed through so the #858 visibility filter applies.
    expect(f.data.listItems).toHaveBeenCalledWith(1, 42);
    expect(((await host.dispatch(req('packing.list', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('PACKING-RPC-002 create needs the write grant, the edit right and a bound user', async () => {
    const f = build();
    const host = f.host('db:write:packing');
    expect((await host.dispatch(req('packing.create', { tripId: 1, input: { name: 'Socks' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('packing.create', { tripId: 1, input: { name: '' } }), 42)).ok).toBe(false);
    expect(((await host.dispatch(req('packing.create', { tripId: 2, input: { name: 'x' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const noUser = (await host.dispatch(req('packing.create', { tripId: 1, input: { name: 'x' } }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('packing item writes require an authenticated user context');
  });

  it('PACKING-RPC-003 db:read:packing does not unlock a write', async () => {
    const f = build();
    const res = (await f.host('db:read:packing').dispatch(req('packing.create', { tripId: 1, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.code).toBe('PERMISSION_DENIED');
  });

  it('PACKING-RPC-004 a missing item is RESOURCE_FORBIDDEN, naming it', async () => {
    const f = build({ updated: null });
    const res = (await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 404, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no packing item 404 on trip 1');
  });

  it('PACKING-RPC-005 bags are gated on the write grant too, listBags included', async () => {
    const f = build();
    const host = f.host('db:write:packing');
    expect((await host.dispatch(req('packing.listBags', { tripId: 1 }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('packing.createBag', { tripId: 1, input: { name: 'Bag' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [5, 6] }), 42)).ok).toBe(true);
    expect(f.data.setBagMembers).toHaveBeenCalledWith('1', '80', [5, 6]);
  });

  it('PACKING-RPC-006 a bag name is required, and a missing bag is named', async () => {
    const f = build();
    const host = f.host('db:write:packing');
    expect(((await host.dispatch(req('packing.createBag', { tripId: 1, input: { name: ' ' } }), 42)) as RpcError).error.message).toBe('bag name is required');
    expect(((await host.dispatch(req('packing.updateBag', { tripId: 1, bagId: 404, input: {} }), 42)) as RpcError).error.message).toBe('no packing bag 404 on trip 1');
  });

  it('PACKING-RPC-007 non-numeric entries in userIds are dropped', async () => {
    const f = build();
    await f.host('db:write:packing').dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [5, 'six', null, 6] }), 42);
    expect(f.data.setBagMembers).toHaveBeenCalledWith('1', '80', [5, 6]);
  });

  it('PACKING-RPC-007b a non-string bag colour is dropped rather than stored', async () => {
    const f = build();
    await f.host('db:write:packing').dispatch(req('packing.createBag', { tripId: 1, input: { name: 'Bag', color: 42 } }), 42);
    expect(f.data.createBag).toHaveBeenCalledWith('1', { name: 'Bag', color: undefined });
  });

  it('PACKING-RPC-007c a non-array userIds becomes an empty list', async () => {
    const f = build();
    await f.host('db:write:packing').dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: 'nope' }), 42);
    expect(f.data.setBagMembers).toHaveBeenCalledWith('1', '80', []);
  });

  it('PACKING-RPC-007d a missing bag is refused across every bag write', async () => {
    const f = build();
    const host = f.host('db:write:packing');
    for (const [method, params] of [
      ['packing.updateBag', { tripId: 1, bagId: 404, input: {} }],
      ['packing.deleteBag', { tripId: 1, bagId: 404 }],
      ['packing.setBagMembers', { tripId: 1, bagId: 404, userIds: [] }],
    ] as const) {
      expect(((await host.dispatch(req(method, params), 42)) as RpcError).error.message).toBe('no packing bag 404 on trip 1');
    }
  });

  it('PACKING-RPC-007e an invalid item payload is BAD_PARAMS on create and update alike', async () => {
    const f = build();
    const host = f.host('db:write:packing');
    expect(((await host.dispatch(req('packing.create', { tripId: 1, input: { name: 42 } }), 42)) as RpcError).error.code).toBe('BAD_PARAMS');
    expect(((await host.dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { name: 42 } }), 42)) as RpcError).error.code).toBe('BAD_PARAMS');
  });

  it('PACKING-RPC-007f deleting a missing item is refused', async () => {
    const f = build();
    const res = (await f.host('db:write:packing').dispatch(req('packing.delete', { tripId: 1, itemId: 404 }), 42)) as RpcError;
    expect(res.error.message).toBe('no packing item 404 on trip 1');
  });

  it('PACKING-RPC-008 the class is listed in its module providers', () => {
    expectRegisteredProvider(PackingModule, PackingRpc);
  });
});

describe('PackingRpc keeps private items off the room (#858)', () => {
  it('PACKING-RPC-009 a common item is created for the whole room', async () => {
    const f = build();
    await f.host('db:write:packing').dispatch(req('packing.create', { tripId: 1, input: { name: 'Socks' } }), 42);
    expect(fanout(f.realtime)).toEqual([['packing:created', undefined]]);
  });

  it('PACKING-RPC-010 a private item is created only for its owner and recipients', async () => {
    const f = build();
    f.data.createItem.mockReturnValueOnce({ id: 70, is_private: 1, owner_id: 42, recipients: [{ user_id: 7 }] });
    await f.host('db:write:packing').dispatch(req('packing.create', { tripId: 1, input: { name: 'Gift', is_private: true } }), 42);
    expect(fanout(f.realtime)).toEqual([
      ['packing:created', 42],
      ['packing:created', 7],
    ]);
  });

  it('PACKING-RPC-011 private stays private: an owner-only update, never a room event', async () => {
    const f = build({ before: { id: 70, is_private: 1 }, updated: { id: 70, is_private: 1, owner_id: 42 } });
    await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { name: 'x' } }), 42);
    expect(fanout(f.realtime)).toEqual([['packing:updated', 42]]);
  });

  it('PACKING-RPC-012 public to private: dropped from the room FIRST, then re-added for the owner', async () => {
    const f = build({ before: { id: 70, is_private: 0 }, updated: { id: 70, is_private: 1, owner_id: 42 } });
    await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { is_private: true } }), 42);
    // The order matters: a member who already had the item must lose it before the
    // owner gets the private copy.
    expect(fanout(f.realtime)).toEqual([
      ['packing:deleted', undefined],
      ['packing:created', 42],
    ]);
  });

  it('PACKING-RPC-013 private to public: created for the members who lacked it, then updated for all', async () => {
    const f = build({ before: { id: 70, is_private: 1 }, updated: { id: 70, is_private: 0 } });
    await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { is_private: false } }), 42);
    expect(fanout(f.realtime)).toEqual([
      ['packing:created', undefined],
      ['packing:updated', undefined],
    ]);
  });

  it('PACKING-RPC-014 public stays public: one plain update to everyone', async () => {
    const f = build({ before: { id: 70, is_private: 0 }, updated: { id: 70, is_private: 0 } });
    await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { name: 'x' } }), 42);
    expect(fanout(f.realtime)).toEqual([['packing:updated', undefined]]);
  });

  it('PACKING-RPC-015 the privacy is read BEFORE the write, not after', async () => {
    const f = build({ before: { id: 70, is_private: 0 }, updated: { id: 70, is_private: 1, owner_id: 42 } });
    await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { is_private: true } }), 42);
    // Reading it afterwards would report "already private" and skip the room delete,
    // leaving the item on every member's screen.
    expect(f.data.getItemPrivacy.mock.invocationCallOrder[0]).toBeLessThan(f.data.updateItem.mock.invocationCallOrder[0]);
  });

  it('PACKING-RPC-016 deleting a private item tells only its viewers', async () => {
    const f = build();
    f.data.deleteItem.mockReturnValueOnce({ id: 70, is_private: 1, owner_id: 42, recipients: [{ user_id: 7 }] });
    await f.host('db:write:packing').dispatch(req('packing.delete', { tripId: 1, itemId: 70 }), 42);
    expect(fanout(f.realtime)).toEqual([
      ['packing:deleted', 42],
      ['packing:deleted', 7],
    ]);
  });

  it('PACKING-RPC-016b a stale-write conflict is BAD_PARAMS and broadcasts nothing', async () => {
    const f = build({ before: { id: 70, is_private: 0 }, updated: { conflict: true, server: { id: 70 } } as never });
    const res = (await f.host('db:write:packing').dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe('packing item was modified concurrently');
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('PACKING-RPC-017 a refused write broadcasts nothing at all', async () => {
    const f = build({ canEdit: false });
    await f.host('db:write:packing').dispatch(req('packing.create', { tripId: 1, input: { name: 'x' } }), 42);
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });
});
