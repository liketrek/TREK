/**
 * The day and itinerary plugin surfaces after they moved onto @PluginMethod.
 *
 * They are tested together because they share the gate: assigning a place to a day
 * counts as a DAY edit in the app, so itinerary.* runs under day_edit rather than a
 * permission of its own, and both halves scope their rows to the trip before writing.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { DaysRpc } from '../../../src/nest/days/days.rpc';
import { DaysModule } from '../../../src/nest/days/days.module';
import { ItineraryRpc } from '../../../src/nest/assignments/itinerary.rpc';
import { AssignmentsModule } from '../../../src/nest/assignments/assignments.module';
import type { DaysService } from '../../../src/nest/days/days.service';
import type { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/** Trip 1 belongs to user 42; day 3, place 7 and assignment 30 sit on it. */
function build(opts: { canEdit?: boolean } = {}) {
  const days = {
    create: vi.fn((tripId: number, date?: string) => ({ id: 20, trip_id: tripId, date })),
    getDay: vi.fn((dayId: number, tripId: number) => (dayId === 3 && tripId === 1 ? { id: 3 } : undefined)),
    update: vi.fn((id: number) => ({ id })),
    remove: vi.fn(),
  } as unknown as DaysService & Record<string, ReturnType<typeof vi.fn>>;
  const assignments = {
    dayExists: vi.fn((dayId: number, tripId: number) => dayId === 3 && tripId === 1),
    placeExists: vi.fn((placeId: number, tripId: number) => placeId === 7 && tripId === 1),
    createAssignment: vi.fn(() => ({ id: 30, day_id: 3, place_id: 7 })),
    getAssignmentForTrip: vi.fn((id: number, tripId: number) => (id === 30 && tripId === 1 ? { id: 30, day_id: 3 } : undefined)),
    deleteAssignment: vi.fn(),
    reconcile: vi.fn(),
  } as unknown as AssignmentsService & Record<string, ReturnType<typeof vi.fn>>;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const guards = new PluginGuards(
    {
      canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService,
    { checkPermission: vi.fn(() => opts.canEdit ?? true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const registry = createTestPluginRegistry([new DaysRpc(days, realtime, guards), new ItineraryRpc(assignments, realtime, guards)]);
  const host = (...grants: string[]) => new PluginRpcHost('p', new Set(grants), makeDeps(), registry);
  return { days, assignments, realtime, host };
}

describe('DaysRpc', () => {
  it('DAYS-RPC-001 writes need the grant, the edit right and a bound user', async () => {
    const f = build();
    const host = f.host('db:write:days');
    expect((await host.dispatch(req('days.create', { tripId: 1, input: { date: '2027-01-01' } }), 42)).ok).toBe(true);
    expect(((await host.dispatch(req('days.create', { tripId: 2, input: {} }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const noUser = (await host.dispatch(req('days.create', { tripId: 1, input: {} }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('day writes require an authenticated user context');
  });

  it('DAYS-RPC-002 a day on another trip is refused for update and delete alike', async () => {
    const f = build();
    const host = f.host('db:write:days');
    expect(((await host.dispatch(req('days.update', { tripId: 1, dayId: 404, input: {} }), 42)) as RpcError).error.message)
      .toBe('no day 404 on trip 1');
    expect(((await host.dispatch(req('days.delete', { tripId: 1, dayId: 404 }), 42)) as RpcError).error.message)
      .toBe('no day 404 on trip 1');
    expect(f.days.remove).not.toHaveBeenCalled();
  });

  it('DAYS-RPC-003 every write broadcasts its event', async () => {
    const f = build();
    const host = f.host('db:write:days');
    await host.dispatch(req('days.create', { tripId: 1, input: {} }), 42);
    await host.dispatch(req('days.update', { tripId: 1, dayId: 3, input: { notes: 'x' } }), 42);
    await host.dispatch(req('days.delete', { tripId: 1, dayId: 3 }), 42);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual(['day:created', 'day:updated', 'day:deleted']);
  });

  it('DAYS-RPC-004 the class is listed in its module providers', () => {
    expectRegisteredProvider(DaysModule, DaysRpc);
  });
});

describe('ItineraryRpc', () => {
  it('ITIN-RPC-001 assign links a day and a place that both belong to the trip', async () => {
    const f = build();
    const res = await f.host('db:write:itinerary').dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 7 }), 42);
    expect(res.ok).toBe(true);
    expect(f.assignments.createAssignment).toHaveBeenCalledWith(3, 7, null);
  });

  it('ITIN-RPC-002 a day or place from another trip is refused, so nothing cross-links', async () => {
    const f = build();
    const host = f.host('db:write:itinerary');
    expect(((await host.dispatch(req('itinerary.assign', { tripId: 1, dayId: 404, placeId: 7 }), 42)) as RpcError).error.message)
      .toBe('no day 404 on trip 1');
    expect(((await host.dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 404 }), 42)) as RpcError).error.message)
      .toBe('no place 404 on trip 1');
    expect(f.assignments.createAssignment).not.toHaveBeenCalled();
  });

  it('ITIN-RPC-003 it runs under day_edit, not an itinerary permission of its own', async () => {
    const f = build({ canEdit: false });
    const res = (await f.host('db:write:itinerary').dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 7 }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to edit trip 1');
  });

  it('ITIN-RPC-004 notes are optional and pass through as null when absent', async () => {
    const f = build();
    await f.host('db:write:itinerary').dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 7, notes: 'lunch' }), 42);
    expect(f.assignments.createAssignment).toHaveBeenCalledWith(3, 7, 'lunch');
  });

  it('ITIN-RPC-005 unassign carries the dayId, which the client keys its eviction on', async () => {
    const f = build();
    await f.host('db:write:itinerary').dispatch(req('itinerary.unassign', { tripId: 1, assignmentId: 30 }), 42);
    expect(f.realtime.broadcast).toHaveBeenCalledWith(1, 'assignment:deleted', { assignmentId: 30, dayId: 3 });
  });

  it('ITIN-RPC-006 both writes re-mirror the journey skeletons afterwards', async () => {
    const f = build();
    const host = f.host('db:write:itinerary');
    await host.dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 7 }), 42);
    await host.dispatch(req('itinerary.unassign', { tripId: 1, assignmentId: 30 }), 42);
    expect(f.assignments.reconcile).toHaveBeenCalledTimes(2);
  });

  it('ITIN-RPC-007 an assignment on another trip is refused and nothing is deleted', async () => {
    const f = build();
    const res = (await f.host('db:write:itinerary').dispatch(req('itinerary.unassign', { tripId: 1, assignmentId: 404 }), 42)) as RpcError;
    expect(res.error.message).toBe('no assignment 404 on trip 1');
    expect(f.assignments.deleteAssignment).not.toHaveBeenCalled();
  });

  it('ITIN-RPC-008 the class is listed in its module providers', () => {
    expectRegisteredProvider(AssignmentsModule, ItineraryRpc);
  });
});
