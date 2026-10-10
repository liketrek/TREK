import { AccommodationsController } from '../../../src/nest/accommodations/accommodations.controller';
import { AccommodationsMcp } from '../../../src/nest/accommodations/accommodations.mcp';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { DomainError } from '../../../src/nest/common/domain-error';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import type { User } from '../../../src/types';

import { describe, it, expect, vi } from 'vitest';

/**
 * REST and MCP are adapters over the same stay use cases, so a client sees the
 * same events whichever of the two made the change. Before, the MCP tools sent
 * no reservation:created on a booking and no reservation:deleted/budget:deleted
 * on its cascade. Each case runs one write through both surfaces against the
 * same stubbed persistence and compares the event names in order.
 */

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const stop = { id: 77, day_id: 10 };
const mirror = { created: stop, moved: null, updated: [], removed: [{ id: 70, dayId: 10 }], stamped: null };

function makeService(realtime: { broadcast: ReturnType<typeof vi.fn> }, overrides: Record<string, unknown> = {}) {
  const stubs: Record<string, unknown> = {
    trips: { findAccessible: vi.fn().mockResolvedValue({ user_id: 1 }) },
    permissions: { checkPermission: vi.fn().mockResolvedValue(true) },
    realtime,
    assignments: { reconcile: vi.fn() },
    dayAssignmentsRepo: { listIdsForDay: vi.fn().mockResolvedValue([70, 77]) },
    validateAccommodationRefs: vi.fn().mockResolvedValue([]),
    getAccommodation: vi.fn().mockResolvedValue({ id: 9 }),
    createAccommodation: vi.fn().mockResolvedValue({ accommodation: { id: 9 }, mirror }),
    updateAccommodation: vi.fn().mockResolvedValue({ accommodation: { id: 9 }, mirror }),
    deleteAccommodation: vi.fn().mockResolvedValue({
      linkedReservationId: 4,
      deletedBudgetItemId: 7,
      linkedReservationIds: [4, 5],
      deletedBudgetItemIds: [7],
      mirror,
    }),
    ...overrides,
  };
  return Object.assign(
    Object.create(AccommodationsService.prototype) as object,
    stubs,
  ) as unknown as AccommodationsService;
}

function surfaces(overrides: Record<string, unknown> = {}) {
  const restRealtime = { broadcast: vi.fn() };
  const mcpRealtime = { broadcast: vi.fn() };
  const rest = new AccommodationsController(makeService(restRealtime, overrides));
  const mcpService = makeService(mcpRealtime, overrides);
  const guards = new McpToolGuardsService(
    { getOwnerId: vi.fn().mockResolvedValue(1) } as never,
    { getRole: vi.fn().mockResolvedValue('user') } as never,
    { checkPermission: vi.fn().mockResolvedValue(true) } as never,
    mcpRealtime as never,
  );
  const mcp = new AccommodationsMcp(mcpService, {} as never, guards, {} as never);
  const names = (rt: { broadcast: ReturnType<typeof vi.fn> }) => rt.broadcast.mock.calls.map((c) => c[1] as string);
  const payloadOf = (rt: { broadcast: ReturnType<typeof vi.fn> }, event: string) =>
    rt.broadcast.mock.calls.find((c) => c[1] === event)?.[2] as Record<string, unknown> | undefined;
  return { rest, mcp, restRealtime, mcpRealtime, names, payloadOf, ctx: { userId: 1, scopes: null } as never };
}

describe('accommodation events: REST == MCP', () => {
  it('ACC-PARITY-001: a booking sends the same events on both surfaces, reservation:created included', async () => {
    const s = surfaces();
    await s.rest.create(user, '5', { place_id: 2, start_day_id: 10, end_day_id: 11 }, 'sock');
    await s.mcp.createAccommodation({ tripId: 5, place_id: 2, start_day_id: 10, end_day_id: 11 }, s.ctx);
    expect(s.names(s.mcpRealtime)).toEqual(s.names(s.restRealtime));
    expect(s.names(s.restRealtime)).toEqual([
      'accommodation:created',
      'reservation:created',
      'assignment:deleted',
      'assignment:created',
      'assignment:reordered',
    ]);
    expect(s.payloadOf(s.mcpRealtime, 'reservation:created')).toEqual({ _source: 'mcp' });
  });

  it('ACC-PARITY-002: an edit sends the same events on both surfaces', async () => {
    const s = surfaces();
    await s.rest.update(user, '5', '9', { notes: 'x' }, 'sock');
    await s.mcp.updateAccommodation({ tripId: 5, accommodationId: 9, notes: 'x' }, s.ctx);
    expect(s.names(s.mcpRealtime)).toEqual(s.names(s.restRealtime));
    expect(s.names(s.restRealtime)[0]).toBe('accommodation:updated');
  });

  it('ACC-PARITY-003: a cancellation sends the reservation and budget cascade on both surfaces', async () => {
    const s = surfaces();
    await s.rest.remove(user, '5', '9', 'sock');
    await s.mcp.deleteAccommodation({ tripId: 5, accommodationId: 9 }, s.ctx);
    expect(s.names(s.mcpRealtime)).toEqual(s.names(s.restRealtime));
    expect(s.names(s.restRealtime).slice(-4)).toEqual([
      'reservation:deleted',
      'reservation:deleted',
      'budget:deleted',
      'accommodation:deleted',
    ]);
    // REST keeps its canonical payload; MCP adds it next to the keys its tool always sent.
    expect(s.payloadOf(s.restRealtime, 'accommodation:deleted')).toEqual({ accommodationId: 9 });
    expect(s.payloadOf(s.mcpRealtime, 'accommodation:deleted')).toEqual({
      accommodationId: 9,
      id: 9,
      linkedReservationId: 4,
      linkedReservationIds: [4, 5],
      _source: 'mcp',
    });
  });
});

describe('stay use cases: the shared gate and checks', () => {
  const writer = (role = 'user') => ({
    userId: 1,
    role,
    surface: 'mcp' as const,
    events: { emit: vi.fn(), emitAll: vi.fn() },
  });

  it("ACC-UC-001: a trip the writer cannot see refuses with REST's 404 and MCP's own wording", async () => {
    const svc = makeService(
      { broadcast: vi.fn() },
      { trips: { findAccessible: vi.fn().mockResolvedValue(undefined) } },
    );
    const err = await svc
      .createStay(5, { place_id: 2, start_day_id: 10, end_day_id: 11 }, writer())
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).getStatus()).toBe(404);
    expect((err as DomainError).toBody()).toEqual({ error: 'Trip not found' });
    expect((err as DomainError).mcpMessage).toBe('Trip not found or access denied.');
  });

  it('ACC-UC-002: a writer without day_edit is refused before anything is read or written', async () => {
    const createAccommodation = vi.fn();
    const svc = makeService(
      { broadcast: vi.fn() },
      { permissions: { checkPermission: vi.fn().mockResolvedValue(false) }, createAccommodation },
    );
    const err = (await svc
      .createStay(5, { place_id: 2, start_day_id: 10, end_day_id: 11 }, writer())
      .catch((e: unknown) => e)) as DomainError;
    expect(err.getStatus()).toBe(403);
    expect(err.mcpMessage).toBe('You do not have permission to perform this action on this trip.');
    expect(createAccommodation).not.toHaveBeenCalled();
  });

  it("ACC-UC-003: the permission check sees the writer's role and whether it is a member", async () => {
    const checkPermission = vi.fn().mockResolvedValue(true);
    const svc = makeService(
      { broadcast: vi.fn() },
      { permissions: { checkPermission }, trips: { findAccessible: vi.fn().mockResolvedValue({ user_id: 2 }) } },
    );
    await svc.deleteStay(5, 9, writer('admin'));
    expect(checkPermission).toHaveBeenCalledWith('day_edit', 'admin', 2, 1, true);
  });

  it('ACC-UC-004: every reference miss is listed for MCP, the first one answers REST', async () => {
    const validateAccommodationRefs = vi
      .fn()
      .mockResolvedValue([{ message: 'Place not found' }, { message: 'End day not found' }]);
    const svc = makeService({ broadcast: vi.fn() }, { validateAccommodationRefs });
    const err = (await svc
      .createStay(5, { place_id: 2, start_day_id: 10, end_day_id: 11 }, writer())
      .catch((e: unknown) => e)) as DomainError;
    expect(err.getStatus()).toBe(404);
    expect(err.toBody()).toEqual({ error: 'Place not found' });
    expect(err.mcpMessage).toBe('Place not found, End day not found');
  });

  it('ACC-UC-005: an edit checks the references it names, on MCP as on REST', async () => {
    // The MCP tool used to write a place or day it never looked up.
    const updateAccommodation = vi.fn();
    const validateAccommodationRefs = vi.fn().mockResolvedValue([{ message: 'Place not found' }]);
    const svc = makeService({ broadcast: vi.fn() }, { validateAccommodationRefs, updateAccommodation });
    const err = (await svc.updateStay(5, 9, { place_id: 99 }, writer()).catch((e: unknown) => e)) as DomainError;
    expect(err.getStatus()).toBe(404);
    expect(validateAccommodationRefs).toHaveBeenCalledWith(5, 99, undefined, undefined);
    expect(updateAccommodation).not.toHaveBeenCalled();
  });

  it('ACC-UC-006: an edit or a cancellation of a stay that is not on the trip is a 404', async () => {
    const svc = makeService({ broadcast: vi.fn() }, { getAccommodation: vi.fn().mockResolvedValue(undefined) });
    for (const run of [() => svc.updateStay(5, 9, {}, writer()), () => svc.deleteStay(5, 9, writer())]) {
      const err = (await run().catch((e: unknown) => e)) as DomainError;
      expect(err.toBody()).toEqual({ error: 'Accommodation not found' });
      expect(err.mcpMessage).toBe('Accommodation not found.');
    }
  });
});
