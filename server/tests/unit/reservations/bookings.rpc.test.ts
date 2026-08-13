/**
 * The booking plugin surfaces after they moved onto @PluginMethod: reservations and
 * the lodging blocks.
 *
 * Both are cascade-heavy, which is the point of most cases here. Creating a
 * reservation can create an accommodation and a budget item; deleting one can remove
 * both again; and deleting a lodging block can take its partner reservation and its
 * budget item with it. Every one of those side effects is a broadcast the web app
 * relies on, so they are asserted by event name and order.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { ReservationsRpc } from '../../../src/nest/reservations/reservations.rpc';
import { ReservationsModule } from '../../../src/nest/reservations/reservations.module';
import { AccommodationsRpc } from '../../../src/nest/accommodations/accommodations.rpc';
import { AccommodationsModule } from '../../../src/nest/accommodations/accommodations.module';
import type { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import type { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const events = (r: { broadcast: ReturnType<typeof vi.fn> }) => r.broadcast.mock.calls.map((c) => c[1]);

/** Trip 1 belongs to user 42; reservation 5 and accommodation 11 sit on it. */
function build(opts: { canEdit?: boolean; cascade?: boolean; seenActions?: string[] } = {}) {
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const reservations = {
    create: vi.fn(() => ({ reservation: { id: 40 }, accommodationCreated: !!opts.cascade })),
    getReservation: vi.fn((id: string) => (id === '5' ? { id: 5, title: 'Hotel', type: 'lodging' } : undefined)),
    update: vi.fn(() => ({ reservation: { id: 5 }, accommodationChanged: !!opts.cascade })),
    remove: vi.fn((id: string) =>
      id === '5'
        ? { deleted: { title: 'Hotel', type: 'lodging', accommodation_id: opts.cascade ? 11 : null }, accommodationDeleted: !!opts.cascade, deletedBudgetItemId: opts.cascade ? 7 : null }
        : { deleted: null, accommodationDeleted: false, deletedBudgetItemId: null },
    ),
    syncBudgetOnCreate: vi.fn(),
    syncBudgetOnUpdate: vi.fn(),
    notifyBookingChange: vi.fn(),
  } as unknown as ReservationsService & Record<string, ReturnType<typeof vi.fn>>;
  // The lodging blocks live in AccommodationsService; AccommodationsRpc still calls its
  // injected copy `days`, which is why the fixture keeps that name.
  const days = {
    validateAccommodationRefs: vi.fn((_t: number, placeId?: number) => (placeId === 404 ? [{ message: 'place 404 is not on this trip' }] : [])),
    createAccommodation: vi.fn(() => ({ id: 60 })),
    getAccommodation: vi.fn((id: number) => (id === 11 ? { id: 11 } : undefined)),
    updateAccommodation: vi.fn(() => ({ id: 11 })),
    deleteAccommodation: vi.fn(() => ({
      linkedReservationId: opts.cascade ? 40 : null,
      deletedBudgetItemId: opts.cascade ? 7 : null,
      linkedReservationIds: opts.cascade ? [40] : [],
      deletedBudgetItemIds: opts.cascade ? [7] : [],
    })),
  } as unknown as AccommodationsService & Record<string, ReturnType<typeof vi.fn>>;
  const guards = new PluginGuards(
    {
      canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService,
    {
      checkPermission: vi.fn((action: string) => {
        opts.seenActions?.push(action);
        return opts.canEdit ?? true;
      }),
    } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const registry = createTestPluginRegistry([
    new ReservationsRpc(reservations, realtime, guards),
    new AccommodationsRpc(days, realtime, guards),
  ]);
  const host = (...grants: string[]) =>
    new PluginRpcHost('p', new Set(grants.length ? grants : ['db:write:reservations', 'db:write:accommodations']), makeDeps(), registry);
  return { reservations, days, realtime, host };
}

describe('ReservationsRpc', () => {
  it('BOOK-RPC-001 writes need the grant, reservation_edit and a bound user', async () => {
    const seen: string[] = [];
    const f = build({ seenActions: seen });
    expect((await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'Hotel', type: 'lodging' } }), 42)).ok).toBe(true);
    expect(seen).toContain('reservation_edit');
    const noUser = (await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'x', type: 'lodging' } }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('reservation writes require an authenticated user context');
  });

  it('BOOK-RPC-002 a malformed endpoints array is rejected up front', async () => {
    const f = build();
    const res = (await f.host().dispatch(
      req('reservations.create', { tripId: 1, input: { title: 'Flight', type: 'flight', endpoints: [{ nonsense: true }] } }), 42,
    )) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    // Otherwise it fails deep in the service mid-transaction, or is silently dropped.
    expect(f.reservations.create).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-003 an absent endpoints field stays absent, which means "keep"', async () => {
    const f = build();
    expect((await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'Hotel', type: 'lodging' } }), 42)).ok).toBe(true);
  });

  it('BOOK-RPC-004 a missing reservation is RESOURCE_FORBIDDEN, naming it', async () => {
    const f = build();
    expect(((await f.host().dispatch(req('reservations.update', { tripId: 1, reservationId: 404, input: { title: 'x', type: 'lodging' } }), 42)) as RpcError).error.message)
      .toBe('no reservation 404 on trip 1');
    expect(((await f.host().dispatch(req('reservations.delete', { tripId: 1, reservationId: 404 }), 42)) as RpcError).error.message)
      .toBe('no reservation 404 on trip 1');
  });

  it('BOOK-RPC-005 creating a lodging booking cascades into the accommodation event', async () => {
    const f = build({ cascade: true });
    await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'Hotel', type: 'lodging' } }), 42);
    expect(events(f.realtime)).toEqual(['accommodation:created', 'reservation:created']);
  });

  it('BOOK-RPC-006 deleting one takes its accommodation and budget item with it', async () => {
    const f = build({ cascade: true });
    await f.host().dispatch(req('reservations.delete', { tripId: 1, reservationId: 5 }), 42);
    expect(events(f.realtime)).toEqual(['accommodation:deleted', 'budget:deleted', 'reservation:deleted']);
  });

  it('BOOK-RPC-007 the budget sync and the booking notification both run', async () => {
    const f = build();
    await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'Hotel', type: 'lodging' } }), 42);
    expect(f.reservations.syncBudgetOnCreate).toHaveBeenCalled();
    expect(f.reservations.notifyBookingChange).toHaveBeenCalledWith(1, 42, 'Hotel', 'lodging');
  });

  it('BOOK-RPC-008 a refused write cascades nothing', async () => {
    const f = build({ canEdit: false, cascade: true });
    await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'x', type: 'lodging' } }), 42);
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
    expect(f.reservations.notifyBookingChange).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-008b title and type are required by the shared schema', async () => {
    const f = build();
    // The handler still carries ?? '' fallbacks behind this, kept from the router as
    // defence in depth, but the schema is what a plugin actually hits first.
    const res = (await f.host().dispatch(req('reservations.create', { tripId: 1, input: {} }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(f.reservations.create).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-008c an update without a title keeps the current one', async () => {
    const f = build();
    await f.host().dispatch(req('reservations.update', { tripId: 1, reservationId: 5, input: {} }), 42);
    // Falls back to the stored title and type rather than blanking them.
    expect(f.reservations.notifyBookingChange).toHaveBeenCalledWith(1, 42, 'Hotel', 'lodging');
  });

  it('BOOK-RPC-008d a non-lodging booking cascades nothing', async () => {
    const f = build();
    await f.host().dispatch(req('reservations.create', { tripId: 1, input: { title: 'Museum', type: 'activity' } }), 42);
    expect(events(f.realtime)).toEqual(['reservation:created']);
    f.realtime.broadcast.mockClear();
    await f.host().dispatch(req('reservations.update', { tripId: 1, reservationId: 5, input: { title: 'x', type: 'activity' } }), 42);
    expect(events(f.realtime)).toEqual(['reservation:updated']);
    f.realtime.broadcast.mockClear();
    await f.host().dispatch(req('reservations.delete', { tripId: 1, reservationId: 5 }), 42);
    expect(events(f.realtime)).toEqual(['reservation:deleted']);
  });

  it('BOOK-RPC-008e an update with a malformed endpoints array is BAD_PARAMS too', async () => {
    const f = build();
    const res = (await f.host().dispatch(
      req('reservations.update', { tripId: 1, reservationId: 5, input: { title: 'x', type: 'lodging', endpoints: [{ nonsense: true }] } }), 42,
    )) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(f.reservations.update).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-009 the class is listed in its module providers', () => {
    expectRegisteredProvider(ReservationsModule, ReservationsRpc);
  });
});

describe('AccommodationsRpc', () => {
  it('BOOK-RPC-010 lodging blocks run under day_edit, NOT reservation_edit', async () => {
    const seen: string[] = [];
    const f = build({ seenActions: seen });
    await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 7, start_day_id: 3, end_day_id: 4 } }), 42);
    // They hold db:write:accommodations but the app gates them on the day permission.
    expect(seen).toEqual(['day_edit']);
  });

  it('BOOK-RPC-011 the three ids are required, and the schema rejects them first', async () => {
    const f = build();
    // The shared schema runs before the handler's own check, so a missing id is
    // reported as a schema failure. The handler's check is the second line of
    // defence, for values the schema lets through but the service cannot use.
    const missing = (await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 7 } }), 42)) as RpcError;
    expect(missing.error.code).toBe('BAD_PARAMS');
    const zero = (await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 0, start_day_id: 0, end_day_id: 0 } }), 42)) as RpcError;
    expect(zero.error.code).toBe('BAD_PARAMS');
    expect(f.days.createAccommodation).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-012 a place or day from another trip is refused with the validator message', async () => {
    const f = build();
    const res = (await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 404, start_day_id: 3, end_day_id: 4 } }), 42)) as RpcError;
    expect(res.error.message).toBe('place 404 is not on this trip');
    expect(f.days.createAccommodation).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-013 creating a block announces the partner reservation too', async () => {
    const f = build();
    await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 7, start_day_id: 3, end_day_id: 4 } }), 42);
    expect(events(f.realtime)).toEqual(['accommodation:created', 'reservation:created']);
  });

  it('BOOK-RPC-014 deleting a block cascades to its reservation and budget item', async () => {
    const f = build({ cascade: true });
    await f.host().dispatch(req('accommodations.delete', { tripId: 1, accommodationId: 11 }), 42);
    expect(events(f.realtime)).toEqual(['reservation:deleted', 'budget:deleted', 'accommodation:deleted']);
  });

  it('BOOK-RPC-015 a missing block is RESOURCE_FORBIDDEN, naming it', async () => {
    const f = build();
    expect(((await f.host().dispatch(req('accommodations.update', { tripId: 1, accommodationId: 404, input: {} }), 42)) as RpcError).error.message)
      .toBe('no accommodation 404 on trip 1');
    expect(((await f.host().dispatch(req('accommodations.delete', { tripId: 1, accommodationId: 404 }), 42)) as RpcError).error.message)
      .toBe('no accommodation 404 on trip 1');
  });

  it('BOOK-RPC-015b optional block fields are passed through, absent ones as undefined', async () => {
    const f = build();
    await f.host().dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 7, start_day_id: 3, end_day_id: 4, check_in: '15:00', notes: 'late' } }), 42);
    expect(f.days.createAccommodation).toHaveBeenCalledWith(1, expect.objectContaining({ check_in: '15:00', notes: 'late', check_out: undefined }));
  });

  it('BOOK-RPC-015c an update with a bad ref is refused before the write', async () => {
    const f = build();
    const res = (await f.host().dispatch(req('accommodations.update', { tripId: 1, accommodationId: 11, input: { place_id: 404 } }), 42)) as RpcError;
    expect(res.error.message).toBe('place 404 is not on this trip');
    expect(f.days.updateAccommodation).not.toHaveBeenCalled();
  });

  it('BOOK-RPC-015d deleting a block without a partner cascades only its own event', async () => {
    const f = build();
    await f.host().dispatch(req('accommodations.delete', { tripId: 1, accommodationId: 11 }), 42);
    expect(events(f.realtime)).toEqual(['accommodation:deleted']);
  });

  it('BOOK-RPC-016 the class is listed in its module providers', () => {
    expectRegisteredProvider(AccommodationsModule, AccommodationsRpc);
  });
});
