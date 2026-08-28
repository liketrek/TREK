/**
 * The cost plugin surface after it moved onto @PluginMethod. This is the first
 * addon-gated domain, and the addon check sits in a different place in each of the
 * two reads: inside the membership callback for costs.getByTrip, before everything
 * for costs.listMine. Both orderings are asserted, because swapping them changes
 * which refusal a caller sees.
 */
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { BudgetModule } from '../../../src/nest/budget/budget.module';
import type { BudgetService } from '../../../src/nest/budget/budget.service';
import { CostsRpc } from '../../../src/nest/budget/costs.rpc';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { makeDeps } from '../../helpers/rpc-host-deps';

import { describe, it, expect, vi } from 'vitest';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({
  k: 'req',
  id: 'x',
  method,
  params,
});

/** Trip 1 belongs to user 42, cost 5 sits on it, and the addon is on unless said otherwise. */
function build(opts: { addonOn?: boolean; canEdit?: boolean; missing?: boolean } = {}) {
  const budget = {
    listBudgetItems: vi.fn((tripId: number) => [{ id: 5, trip_id: tripId }]),
    create: vi.fn(async (tripId: string, i: Record<string, unknown>) => ({ id: 9, trip_id: tripId, ...i })),
    update: vi.fn(async () => (opts.missing ? null : { id: 5, name: 'Hotel' })),
    remove: vi.fn(() => !opts.missing),
  } as unknown as BudgetService & Record<string, ReturnType<typeof vi.fn>>;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) =>
      tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined,
    ),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
  } as unknown as DatabaseService;
  const guards = new PluginGuards(
    db,
    { checkPermission: vi.fn(() => opts.canEdit ?? true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => opts.addonOn ?? true) } as unknown as AddonsService,
  );
  // The leaf membership read replaced the deleted trips.bridge for listMine.
  const membership = { listAccessibleTripIds: vi.fn(() => [1, 2]) } as unknown as TripMembershipService;
  const rpc = new CostsRpc(budget, db, realtime, guards, membership, {} as never);
  const host = (...grants: string[]) =>
    new PluginRpcHost(
      'p',
      new Set(grants.length ? grants : ['db:read:costs', 'db:write:costs']),
      makeDeps(),
      createTestPluginRegistry([rpc]),
    );
  return { budget, realtime, host };
}

describe('CostsRpc reads', () => {
  it('COSTS-RPC-001 getByTrip is membership-checked and addon-gated', async () => {
    const f = build();
    expect((await f.host().dispatch(req('costs.getByTrip', { tripId: 1 }), 42)).ok).toBe(true);
    expect(((await f.host().dispatch(req('costs.getByTrip', { tripId: 2 }), 42)) as RpcError).error.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
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
    expect(((await f.host().dispatch(req('costs.listMine'), undefined)) as RpcError).error.message).toBe(
      'cost reads require an authenticated user context',
    );
    expect(((await f.host().dispatch(req('costs.listMine'), 42)) as RpcError).error.message).toBe(
      'the costs addon is disabled',
    );
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
    expect(
      (await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel', price: 10 } }), 42)).ok,
    ).toBe(true);
    const off = build({ addonOn: false });
    expect(
      ((await off.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError)
        .error.message,
    ).toBe('the costs addon is disabled');
    const noEdit = build({ canEdit: false });
    expect(
      (
        (await noEdit
          .host()
          .dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError
      ).error.message,
    ).toBe('no permission to edit costs on trip 1');
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
      expect(((await f.host().dispatch(req(method, params), 42)) as RpcError).error.message).toBe(
        'no permission to edit costs on trip 1',
      );
    }
  });

  it('COSTS-RPC-008 a userless write says "cost writes"', async () => {
    const f = build();
    expect(
      (
        (await f
          .host()
          .dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), undefined)) as RpcError
      ).error.message,
    ).toBe('cost writes require an authenticated user context');
  });

  it('COSTS-RPC-009 db:read:costs does not unlock a write', async () => {
    const f = build();
    expect(
      (
        (await f
          .host('db:read:costs')
          .dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42)) as RpcError
      ).error.code,
    ).toBe('PERMISSION_DENIED');
  });

  it('COSTS-RPC-010 a missing item is RESOURCE_FORBIDDEN, naming it', async () => {
    const f = build({ missing: true });
    expect(
      ((await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 404, input: { name: 'x' } }), 42)) as RpcError)
        .error.message,
    ).toBe('no cost 404 on trip 1');
    expect(
      ((await f.host().dispatch(req('costs.delete', { tripId: 1, itemId: 404 }), 42)) as RpcError).error.message,
    ).toBe('no cost 404 on trip 1');
  });

  it('COSTS-RPC-011 each write broadcasts its event, a refused one broadcasts nothing', async () => {
    const f = build();
    await f.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel', price: 10 } }), 42);
    await f.host().dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'x' } }), 42);
    await f.host().dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 42);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual([
      'budget:created',
      'budget:updated',
      'budget:deleted',
    ]);
    const off = build({ addonOn: false });
    await off.host().dispatch(req('costs.create', { tripId: 1, input: { name: 'x', price: 1 } }), 42);
    expect(off.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('COSTS-RPC-012 the class is listed in its module providers', () => {
    expectRegisteredProvider(BudgetModule, CostsRpc);
  });
});
