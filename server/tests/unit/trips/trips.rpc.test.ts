/**
 * The trip plugin surface after it moved onto @PluginMethod: the trip-scoped reads,
 * the two cross-trip feeds, the roster, the update, the create and the two member
 * operations.
 *
 * Two things get their own cases. trips.update gates two individual FIELDS behind
 * permissions of their own on top of trip_edit, and adding a member GRANTS TRIP
 * ACCESS, which is why it sits behind its own permission rather than any other write.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { TripsRpc } from '../../../src/nest/trips/trips.rpc';
import { TripsModule } from '../../../src/nest/trips/trips.module';
import { NotFoundError, ValidationError } from '../../../src/nest/trips/trips.service';
import type { TripsService } from '../../../src/nest/trips/trips.service';
import type { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import type { DaysService } from '../../../src/nest/days/days.service';
import type { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import type { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import type { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

const ALL_TRIP_GRANTS = ['db:read:trips', 'db:write:trips', 'db:create:trips', 'db:write:members'];

/** Trip 1 belongs to user 42. `allow` decides each individual permission check. */
export function build(opts: { allow?: (action: string) => boolean; updateThrows?: Error } = {}) {
  const trips = {
    list: vi.fn(() => [{ id: 1, title: 'Japan' }]),
    updateTrip: vi.fn(() => {
      if (opts.updateThrows) throw opts.updateThrows;
      return { updatedTrip: { id: 1, title: 'Japan' } };
    }),
    create: vi.fn((userId: number) => ({ trip: { id: 99, user_id: userId } })),
    removeMember: vi.fn(),
  } as unknown as TripsService & Record<string, ReturnType<typeof vi.fn>>;
  const reservations = { list: vi.fn(() => [{ id: 5 }]) } as unknown as ReservationsService & Record<string, ReturnType<typeof vi.fn>>;
  const days = {
    list: vi.fn(() => ({ days: [{ id: 3 }] })),
  } as unknown as DaysService & Record<string, ReturnType<typeof vi.fn>>;
  // The stays left the day service when accommodations became their own domain.
  const accommodations = {
    list: vi.fn(() => [{ id: 11 }]),
  } as unknown as AccommodationsService & Record<string, ReturnType<typeof vi.fn>>;
  // Membership left TripsService for its own domain.
  const roster = {
    removeMember: vi.fn(),
  } as unknown as TripMembersService & Record<string, ReturnType<typeof vi.fn>>;
  const membership = { joinTripAsMember: vi.fn(() => ({ joined: true })) } as unknown as TripMembershipService & Record<string, ReturnType<typeof vi.fn>>;
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
    prepare: vi.fn((sql: string) => ({
      get: (arg: number) => {
        if (sql.includes('FROM users WHERE')) return arg === 404 ? undefined : { id: arg, role: 'user' };
        if (sql.includes('SELECT user_id FROM trips')) return { user_id: 42 };
        return { id: 1, title: 'Japan' };
      },
      all: () => [{ id: 7, name: 'Place' }],
    })),
  } as unknown as DatabaseService;
  const permissions = { checkPermission: vi.fn((a: string) => (opts.allow ? opts.allow(a) : true)) } as unknown as PermissionsService;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const guards = new PluginGuards(db, permissions, { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService);
  const rpc = new TripsRpc(trips, reservations, days, membership, db, realtime, guards, accommodations, roster);
  const host = (...grants: string[]) =>
    new PluginRpcHost('p', new Set(grants.length ? grants : ALL_TRIP_GRANTS), makeDeps(), createTestPluginRegistry([rpc]));
  return { trips, reservations, days, accommodations, roster, membership, realtime, permissions, host };
}

describe('TripsRpc reads', () => {
  it('TRIPS-RPC-001 every trip-scoped read is membership-checked', async () => {
    const f = build();
    const host = f.host();
    for (const method of ['trips.getById', 'trips.getPlaces', 'trips.getReservations', 'trips.getDays', 'trips.getAccommodations', 'trips.members']) {
      expect((await host.dispatch(req(method, { tripId: 1 }), 42)).ok).toBe(true);
      expect(((await host.dispatch(req(method, { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    }
  });

  it('TRIPS-RPC-002 the cross-trip feeds refuse a userless context instead of listing everything', async () => {
    const f = build();
    const host = f.host();
    expect((await host.dispatch(req('trips.listMine'), 42)).ok).toBe(true);
    expect((await host.dispatch(req('reservations.listMine'), 42)).ok).toBe(true);
    expect(((await host.dispatch(req('trips.listMine'), undefined)) as RpcError).error.message)
      .toBe('trip reads require an authenticated user context');
    expect(((await host.dispatch(req('reservations.listMine'), undefined)) as RpcError).error.message)
      .toBe('reservation reads require an authenticated user context');
    expect(f.trips.list).toHaveBeenCalledWith(42, null);
  });

  it('TRIPS-RPC-003 the reservation feed spans the accessible trips', async () => {
    const f = build();
    await f.host().dispatch(req('reservations.listMine'), 42);
    expect(f.reservations.list).toHaveBeenCalledWith('1');
  });

  it('TRIPS-RPC-004 getDays returns the days array, not the wrapper the service returns', async () => {
    const f = build();
    const res = await f.host().dispatch(req('trips.getDays', { tripId: 1 }), 42);
    expect((res as { result: unknown }).result).toEqual([{ id: 3 }]);
  });
});

describe('TripsRpc writes', () => {
  it('TRIPS-RPC-005 update needs the grant, trip_edit and a bound user', async () => {
    const f = build();
    const host = f.host();
    expect((await host.dispatch(req('trips.update', { tripId: 1, input: { title: 'New' } }), 42)).ok).toBe(true);
    const noUser = (await host.dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('trip writes require an authenticated user context');
    const readOnly = (await f.host('db:read:trips').dispatch(req('trips.update', { tripId: 1, input: {} }), 42)) as RpcError;
    expect(readOnly.error.code).toBe('PERMISSION_DENIED');
  });

  it('TRIPS-RPC-006 archiving needs trip_archive on top of trip_edit', async () => {
    const f = build({ allow: (a) => a !== 'trip_archive' });
    const res = (await f.host().dispatch(req('trips.update', { tripId: 1, input: { is_archived: true } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to archive trip 1');
    expect(f.trips.updateTrip).not.toHaveBeenCalled();
  });

  it('TRIPS-RPC-007 changing the cover needs trip_cover_upload on top of trip_edit', async () => {
    const f = build({ allow: (a) => a !== 'trip_cover_upload' });
    const res = (await f.host().dispatch(req('trips.update', { tripId: 1, input: { cover_image: '/uploads/covers/a.jpg' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to change the cover of trip 1');
  });

  it('TRIPS-RPC-008 a plain edit is unaffected by those two field permissions', async () => {
    const f = build({ allow: (a) => a !== 'trip_archive' && a !== 'trip_cover_upload' });
    expect((await f.host().dispatch(req('trips.update', { tripId: 1, input: { title: 'New' } }), 42)).ok).toBe(true);
  });

  it('TRIPS-RPC-009 service errors map onto the right RPC codes', async () => {
    const invalid = build({ updateThrows: new ValidationError('bad dates') });
    expect(((await invalid.host().dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), 42)) as RpcError).error)
      .toMatchObject({ code: 'BAD_PARAMS', message: 'bad dates' });
    const missing = build({ updateThrows: new NotFoundError('trip not found') });
    expect(((await missing.host().dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), 42)) as RpcError).error)
      .toMatchObject({ code: 'RESOURCE_FORBIDDEN', message: 'trip not found' });
  });

  it('TRIPS-RPC-010 an over-long title is capped like the REST controller caps it', async () => {
    const f = build();
    const res = (await f.host().dispatch(req('trips.update', { tripId: 1, input: { title: 'x'.repeat(201) } }), 42)) as RpcError;
    expect(res.error.message).toBe('title must be 200 characters or fewer');
  });

  it('TRIPS-RPC-011 create runs under trip_create and never broadcasts', async () => {
    const f = build();
    expect((await f.host().dispatch(req('trips.create', { input: { title: 'Japan' } }), 42)).ok).toBe(true);
    expect(f.permissions.checkPermission).toHaveBeenCalledWith('trip_create', 'user', null, 42, false);
    // A new trip is only visible to its owner, who refetches.
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('TRIPS-RPC-012 without trip_create the trip is refused', async () => {
    const f = build({ allow: (a) => a !== 'trip_create' });
    const res = (await f.host().dispatch(req('trips.create', { input: { title: 'Japan' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to create trips');
    expect(f.trips.create).not.toHaveBeenCalled();
  });
});

describe('TripsRpc membership', () => {
  it('TRIPS-RPC-013 adding a member needs member_manage and records the inviter', async () => {
    const f = build();
    expect((await f.host().dispatch(req('trips.addMember', { tripId: 1, userId: 7 }), 42)).ok).toBe(true);
    expect(f.membership.joinTripAsMember).toHaveBeenCalledWith(1, 7, 42);
  });

  it('TRIPS-RPC-014 member management is its own grant, separate from every other write', async () => {
    const f = build();
    const res = (await f.host('db:write:trips').dispatch(req('trips.addMember', { tripId: 1, userId: 7 }), 42)) as RpcError;
    // Adding a member GRANTS TRIP ACCESS, so db:write:trips must not be enough.
    expect(res.error.code).toBe('PERMISSION_DENIED');
  });

  it('TRIPS-RPC-015 an unknown target user is refused', async () => {
    const f = build();
    const res = (await f.host().dispatch(req('trips.addMember', { tripId: 1, userId: 404 }), 42)) as RpcError;
    expect(res.error.message).toBe('no user 404');
    expect(f.membership.joinTripAsMember).not.toHaveBeenCalled();
  });

  it('TRIPS-RPC-016 the owner can never be removed through this path', async () => {
    const f = build();
    // The stub reports user 42 as the owner of trip 1.
    const res = (await f.host().dispatch(req('trips.removeMember', { tripId: 1, userId: 42 }), 42)) as RpcError;
    expect(res.error.message).toBe('cannot remove the trip owner');
    expect(f.roster.removeMember).not.toHaveBeenCalled();
  });

  it('TRIPS-RPC-017 a non-owner member is removed', async () => {
    const f = build();
    expect((await f.host().dispatch(req('trips.removeMember', { tripId: 1, userId: 7 }), 42)).ok).toBe(true);
    expect(f.roster.removeMember).toHaveBeenCalledWith(1, 7);
  });

  it('TRIPS-RPC-018 without member_manage nothing changes', async () => {
    const f = build({ allow: (a) => a !== 'member_manage' });
    const res = (await f.host().dispatch(req('trips.addMember', { tripId: 1, userId: 7 }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to edit trip 1');
  });

  it('TRIPS-RPC-019 the class is listed in its module providers', () => {
    expectRegisteredProvider(TripsModule, TripsRpc);
  });
});
