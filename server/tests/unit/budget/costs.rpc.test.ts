/**
 * The cost plugin surface after it moved onto @PluginMethod. This is the first
 * addon-gated domain, and the addon check sits in a different place in each of the
 * two reads: inside the membership callback for costs.getByTrip, before everything
 * for costs.listMine. Both orderings are asserted, because swapping them changes
 * which refusal a caller sees.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { CostsRpc } from '../../../src/nest/budget/costs.rpc';
import { BudgetModule } from '../../../src/nest/budget/budget.module';
import type { BudgetService } from '../../../src/nest/budget/budget.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/**
 * Trip 1 belongs to user 42, cost 5 sits on it, and the addon is on unless said otherwise.
 * `refusal` is what BudgetService.linkRefusal answers for the body's links (#2084), and
 * `linkedTo` the booking cost 5 is linked to before the write.
 */
function build(opts: { addonOn?: boolean; canEdit?: boolean; missing?: boolean; refusal?: string; linkedTo?: number | null } = {}) {
  const budget = {
    listBudgetItems: vi.fn((tripId: number) => [{ id: 5, trip_id: tripId }]),
    create: vi.fn(async (tripId: string, i: Record<string, unknown>) => ({ id: 9, trip_id: tripId, ...i })),
    // The row after the write: a link in the body moves it, otherwise it keeps its booking.
    update: vi.fn(async (_id: string, _tripId: string, i: Record<string, unknown>) => (opts.missing
      ? null
      : { id: 5, name: 'Hotel', reservation_id: 'reservation_id' in i ? i.reservation_id : (opts.linkedTo ?? null) })),
    remove: vi.fn(() => !opts.missing),
    linkRefusal: vi.fn(() => opts.refusal ?? null),
    getBudgetItem: vi.fn(() => (opts.missing ? null : { id: 5, reservation_id: opts.linkedTo ?? null })),
    resyncLinkedPrices: vi.fn(),
    resyncReservationPrice: vi.fn(),
  } as unknown as BudgetService & Record<string, ReturnType<typeof vi.fn>>;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
  } as unknown as DatabaseService;
  const guards = new PluginGuards(
    db,
    { checkPermission: vi.fn(() => opts.canEdit ?? true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => opts.addonOn ?? true) } as unknown as AddonsService,
  );
  // The leaf membership read replaced the deleted trips.bridge for listMine.
  const membership = { listAccessibleTripIds: vi.fn(() => [1, 2]) } as unknown as TripMembershipService;
  const rpc = new CostsRpc(budget, db, realtime, guards, membership);
  const host = (...grants: string[]) =>
    new PluginRpcHost('p', new Set(grants.length ? grants : ['db:read:costs', 'db:write:costs']), makeDeps(), createTestPluginRegistry([rpc]));
  return { budget, realtime, host };
}

describe('CostsRpc reads', () => {
  it('COSTS-RPC-001 getByTrip is membership-checked and addon-gated', async () => {
    const f = build();
    expect((await f.host().dispatch(req('costs.getByTrip', { tripId: 1 }), 42)).ok).toBe(true);
    expect(((await f.host().dispatch(req('costs.getByTrip', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('COSTS-RPC-002 getByTrip reports the TRIP first when both would fail', async () => {
    // The addon check runs inside the membership callback, so a caller without trip
    // access never learns whether the addon is on. Reversing the two would leak that.
    const f = build({ addonOn: false });
    const res = (await f.host().dispatch(req('costs.getByTrip', { tripId: 2 }), 42)) as RpcError;
    expect(res.error.message).toBe('no access to trip 2');
  });

  it('COSTS-RPC-003 getByTrip reports the addon once the trip checks out', async () => {
    const f = build({ addonOn: false });
    const res = (await f.host().dispatch(req('costs.getByTrip', { tripId: 1 }), 42)) as RpcError;
    expect(res.error.message).toBe('the costs addon is disabled');
    expect(f.budget.listBudgetItems).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-004 listMine checks the user first, then the addon', async () => {
    const f = build({ addonOn: false });
    // No trip to check here, so the userless refusal comes first and the addon second.
    expect(((await f.host().dispatch(req('costs.listMine'), undefined)) as RpcError).error.message)
      .toBe('cost reads require an authenticated user context');
    expect(((await f.host().dispatch(req('costs.listMine'), 42)) as RpcError).error.message)
      .toBe('the costs addon is disabled');
  });

  it('COSTS-RPC-005 listMine aggregates across every accessible trip', async () => {
    const f = build();
    const res = await f.host().dispatch(req('costs.listMine'), 42);
    expect(res.ok).toBe(true);
    expect(f.budget.listBudgetItems).toHaveBeenCalledTimes(2);
  });
});

describe('CostsRpc writes', () => {
  it('COSTS-RPC-006 every write needs the addon, trip access and budget_edit', async () => {
    const f = build();
    expect((await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel', price: 10 } }), 42)).ok).toBe(true);
    const off = build({ addonOn: false });
    expect(((await off.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError).error.message)
      .toBe('the costs addon is disabled');
    const noEdit = build({ canEdit: false });
    expect(((await noEdit.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError).error.message)
      .toBe('no permission to edit costs on trip 1');
  });

  it('COSTS-RPC-007 the refusal says "costs on trip", not the generic trip message', async () => {
    // requireTripEdit would say "no permission to edit trip 1"; shipped plugins read
    // these strings, so the cost-specific wording is kept.
    const f = build({ canEdit: false });
    for (const [method, params] of [
      ['costs.create', { tripId: 1, input: { name: 'x', price: 1 } }],
      ['costs.update', { tripId: 1, itemId: 5, input: { name: 'x' } }],
      ['costs.delete', { tripId: 1, itemId: 5 }],
    ] as const) {
      expect(((await f.host().dispatch(req(method, params), 42)) as RpcError).error.message)
        .toBe('no permission to edit costs on trip 1');
    }
  });

  it('COSTS-RPC-008 a userless write says "cost writes"', async () => {
    const f = build();
    expect(((await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), undefined)) as RpcError).error.message)
      .toBe('cost writes require an authenticated user context');
  });

  it('COSTS-RPC-009 db:read:costs does not unlock a write', async () => {
    const f = build();
    expect(((await f.host('db:read:costs').dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError).error.code)
      .toBe('PERMISSION_DENIED');
  });

  it('COSTS-RPC-010 a missing item is RESOURCE_FORBIDDEN, naming it', async () => {
    const f = build({ missing: true });
    expect(((await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 404, input: { name: 'x' } }), 42)) as RpcError).error.message)
      .toBe('no cost 404 on trip 1');
    expect(((await f.host().dispatch(req('costs.delete', { tripId: 1, itemId: 404 }), 42)) as RpcError).error.message)
      .toBe('no cost 404 on trip 1');
  });

  it('COSTS-RPC-011 each write broadcasts its event, a refused one broadcasts nothing', async () => {
    const f = build();
    await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel', price: 10 } }), 42);
    await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'x' } }), 42);
    await f.host().dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 42);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual(['budget:created', 'budget:updated', 'budget:deleted']);
    const off = build({ addonOn: false });
    await off.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42);
    expect(off.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-012 the class is listed in its module providers', () => {
    expectRegisteredProvider(BudgetModule, CostsRpc);
  });
});

// #2084: a cost can point at a booking or a place, which has to be on the same trip
// (the REST route answers 400, the MCP tool an error result, the plugin surface
// RESOURCE_FORBIDDEN, all in the same words), and the booking mirrors its costs' total.
describe('CostsRpc links to bookings and places', () => {
  it('COSTS-RPC-013 a create linking another trip\'s booking is refused in linkRefusal\'s words, before any write', async () => {
    const f = build({ refusal: 'reservation_id does not belong to this trip.' });
    const res = (await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Seat', total_price: 15, reservation_id: 4711 } }), 42)) as RpcError;
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('reservation_id does not belong to this trip.');
    expect(f.budget.linkRefusal).toHaveBeenCalledWith(1, expect.objectContaining({ reservation_id: 4711 }));
    expect(f.budget.create).not.toHaveBeenCalled();
    expect(f.budget.resyncReservationPrice).not.toHaveBeenCalled();
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-014 an update linking another trip\'s place is refused before it reads, writes or resyncs', async () => {
    const f = build({ refusal: 'place_id does not belong to this trip.', linkedTo: 77 });
    const res = (await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { place_id: 4711 } }), 42)) as RpcError;
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('place_id does not belong to this trip.');
    expect(f.budget.linkRefusal).toHaveBeenCalledWith(1, { place_id: 4711 });
    expect(f.budget.getBudgetItem).not.toHaveBeenCalled();
    expect(f.budget.update).not.toHaveBeenCalled();
    expect(f.budget.resyncLinkedPrices).not.toHaveBeenCalled();
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-015 the permission refusal still comes first, so a link check never answers a caller without budget_edit', async () => {
    const f = build({ canEdit: false, refusal: 'reservation_id does not belong to this trip.' });
    for (const [method, params] of [
      ['costs.create', { tripId: 1, input: { name: 'x', reservation_id: 4711 } }],
      ['costs.update', { tripId: 1, itemId: 5, input: { reservation_id: 4711 } }],
    ] as const) {
      expect(((await f.host().dispatch(req(method, params), 42)) as RpcError).error.message)
        .toBe('no permission to edit costs on trip 1');
    }
    expect(f.budget.linkRefusal).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-016 a cost created on a booking resyncs that booking\'s price; an unlinked one resyncs nothing', async () => {
    const f = build();
    expect((await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Seat', total_price: 15, reservation_id: 77 } }), 42)).ok).toBe(true);
    expect(f.budget.resyncReservationPrice).toHaveBeenCalledWith(1, 77);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual(['budget:created']);

    const g = build();
    await g.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Coffee', total_price: 3 } }), 42);
    expect(g.budget.resyncReservationPrice).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-017 an update moving the cost hands the booking it left and the row it wrote to resyncLinkedPrices', async () => {
    const f = build({ linkedTo: 77 });
    const res = await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { reservation_id: 78 } }), 42);
    expect(res.ok).toBe(true);
    // The row is read before the write, so the booking it leaves is still known.
    expect(f.budget.getBudgetItem).toHaveBeenCalledWith(5, 1);
    expect(vi.mocked(f.budget.getBudgetItem).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(f.budget.update).mock.invocationCallOrder[0]);
    expect(f.budget.resyncLinkedPrices).toHaveBeenCalledWith(1, 77, { id: 5, name: 'Hotel', reservation_id: 78 }, { reservation_id: 78 });
  });

  it('COSTS-RPC-018 an unlink (null) snapshots too and passes the booking it leaves', async () => {
    const f = build({ linkedTo: 77 });
    await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { reservation_id: null } }), 42);
    expect(f.budget.resyncLinkedPrices).toHaveBeenCalledWith(1, 77, { id: 5, name: 'Hotel', reservation_id: null }, { reservation_id: null });
  });

  it('COSTS-RPC-019 an update that names no booking reads nothing first, yet still lets the linked booking resync', async () => {
    // A new total or currency moves the price of the booking the cost stays on.
    const f = build({ linkedTo: 77 });
    await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { total_price: 40 } }), 42);
    expect(f.budget.getBudgetItem).not.toHaveBeenCalled();
    expect(f.budget.resyncLinkedPrices).toHaveBeenCalledWith(1, undefined, { id: 5, name: 'Hotel', reservation_id: 77 }, { total_price: 40 });
  });

  it('COSTS-RPC-020 a missing cost resyncs nothing', async () => {
    const f = build({ missing: true });
    const res = (await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 404, input: { reservation_id: 78 } }), 42)) as RpcError;
    expect(res.error.message).toBe('no cost 404 on trip 1');
    expect(f.budget.resyncLinkedPrices).not.toHaveBeenCalled();
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });
});
