/**
 * TripAccessGuard — the trip-scoping check that used to be a `requireTrip` helper
 * copied into every trip-scoped controller.
 *
 * The cases here are the ones those copies each carried: an inaccessible trip is a 404
 * "Trip not found" and never a 403 (a 403 would confirm the id exists to someone with
 * no business knowing), and a mutation additionally needs its own permission. They
 * moved out of days.controller.test.ts with the check itself.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import {
  RequirePermission,
  TRIP_PERMISSION_KEY,
  TRIP_REQUEST_KEY,
  TripAccessGuard,
} from '../../../src/nest/permissions/trip-access.guard';
import { Trip } from '../../../src/nest/permissions/trip.decorator';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { User } from '../../../src/types';

const owner = { id: 42, role: 'user' } as User;
const member = { id: 7, role: 'user' } as User;
/** Trip 5 belongs to user 42; user 7 is a member of it. Nothing else is reachable. */
const TRIP = { id: 5, user_id: 42 };

function makeGuard(options: { checkPermission?: ReturnType<typeof vi.fn>; action?: string } = {}) {
  const canAccessTrip = vi.fn((tripId: number, userId: number) =>
    tripId === 5 && (userId === 42 || userId === 7) ? TRIP : undefined,
  );
  const checkPermission = options.checkPermission ?? vi.fn(() => true);
  const reflector = { getAllAndOverride: vi.fn(() => options.action) } as unknown as Reflector;
  const guard = new TripAccessGuard(
    { canAccessTrip } as unknown as DatabaseService,
    { checkPermission } as unknown as PermissionsService,
    reflector,
  );
  return { guard, canAccessTrip, checkPermission, reflector };
}

/** The slice of ExecutionContext the guard reads. */
function ctx(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as never;
}

const thrown = (run: () => unknown) => {
  try {
    run();
    return null;
  } catch (e) {
    return e instanceof HttpException ? { status: e.getStatus(), body: e.getResponse() } : e;
  }
};

describe('TripAccessGuard', () => {
  it('TRIPGUARD-001 lets a member through and parks the trip row on the request', () => {
    const { guard, canAccessTrip } = makeGuard();
    const request = { user: member, params: { tripId: '5' } } as Record<string, unknown>;
    expect(guard.canActivate(ctx(request))).toBe(true);
    expect(canAccessTrip).toHaveBeenCalledWith(5, 7);
    expect(request[TRIP_REQUEST_KEY]).toBe(TRIP);
  });

  it('TRIPGUARD-002 a trip the user cannot reach is 404 "Trip not found", never 403', () => {
    const { guard } = makeGuard();
    const stranger = { user: { id: 99, role: 'user' }, params: { tripId: '5' } };
    expect(thrown(() => guard.canActivate(ctx(stranger)))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const missing = { user: owner, params: { tripId: '404' } };
    expect(thrown(() => guard.canActivate(ctx(missing)))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('TRIPGUARD-003 a non-numeric tripId is refused without touching the database', () => {
    const { guard, canAccessTrip } = makeGuard();
    const request = { user: owner, params: { tripId: 'not-a-number' } };
    expect(thrown(() => guard.canActivate(ctx(request)))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    expect(canAccessTrip).not.toHaveBeenCalled();
  });

  it('TRIPGUARD-004 a missing tripId param is refused rather than read as NaN', () => {
    const { guard } = makeGuard();
    expect(thrown(() => guard.canActivate(ctx({ user: owner, params: {} })))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
    expect(thrown(() => guard.canActivate(ctx({ user: owner })))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
  });

  it('TRIPGUARD-005 no authenticated user is a 401, not a crash on user.id', () => {
    // JwtAuthGuard runs first, so this only happens when a route was wired without it.
    // Refusing beats turning a wiring mistake into a 500 nobody can read.
    const { guard, canAccessTrip } = makeGuard();
    expect(thrown(() => guard.canActivate(ctx({ params: { tripId: '5' } })))).toEqual({
      status: 401,
      body: { error: 'Unauthorized' },
    });
    expect(canAccessTrip).not.toHaveBeenCalled();
  });

  it('TRIPGUARD-006 without @RequirePermission the permission service is never consulted', () => {
    const { guard, checkPermission } = makeGuard();
    guard.canActivate(ctx({ user: member, params: { tripId: '5' } }));
    expect(checkPermission).not.toHaveBeenCalled();
  });

  it('TRIPGUARD-007 @RequirePermission passes the action and the shared flag through', () => {
    const checkPermission = vi.fn(() => true);
    const { guard } = makeGuard({ checkPermission, action: 'day_edit' });
    // A member editing somebody else's trip is the SHARED case…
    guard.canActivate(ctx({ user: member, params: { tripId: '5' } }));
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 42, 7, true);
    // …and the owner editing their own is not.
    guard.canActivate(ctx({ user: owner, params: { tripId: '5' } }));
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 42, 42, false);
  });

  it('TRIPGUARD-008 a refused permission is 403 "No permission", and access still came first', () => {
    const { guard } = makeGuard({ checkPermission: vi.fn(() => false), action: 'day_edit' });
    expect(thrown(() => guard.canActivate(ctx({ user: member, params: { tripId: '5' } })))).toEqual({
      status: 403,
      body: { error: 'No permission' },
    });
    // A stranger gets the 404 rather than the 403: access is checked before rights, so
    // the permission answer never leaks that the trip exists.
    expect(thrown(() => guard.canActivate(ctx({ user: { id: 99, role: 'user' }, params: { tripId: '5' } })))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
  });

  it('TRIPGUARD-009 the metadata is read from the handler first, then the class', () => {
    const { guard, reflector } = makeGuard({ action: 'day_edit' });
    guard.canActivate(ctx({ user: owner, params: { tripId: '5' } }));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(TRIP_PERMISSION_KEY, [expect.any(Function), expect.any(Function)]);
  });

  it('TRIPGUARD-010 @RequirePermission writes the action under the key the guard reads', () => {
    class Probe {
      @RequirePermission('budget_edit')
      handler() {}
    }
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, Probe.prototype.handler)).toBe('budget_edit');
  });
});

describe('@Trip() param decorator', () => {
  /**
   * Nest stores a custom param decorator's factory in ROUTE_ARGS_METADATA on the
   * controller class, keyed by `${CUSTOM_ROUTE_ARGS_METADATA}:${index}`. Pulling it
   * back out is how the factory gets exercised for real rather than asserted to be a
   * function.
   */
  function tripFactory(): (data: unknown, context: unknown) => unknown {
    class Probe {
      handler(@Trip() _trip: unknown) {}
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Probe, 'handler') as Record<
      string,
      { factory: (data: unknown, context: unknown) => unknown }
    >;
    return Object.values(args)[0].factory;
  }

  it('TRIPGUARD-011 returns the row the guard parked on the request', () => {
    expect(tripFactory()(undefined, ctx({ [TRIP_REQUEST_KEY]: TRIP }))).toBe(TRIP);
  });

  it('TRIPGUARD-012 a route without the guard is a loud throw, not an undefined trip', () => {
    // Silently handing the handler `undefined` would turn a missing guard into a
    // crash somewhere further down, with nothing pointing at the wiring.
    expect(() => tripFactory()(undefined, ctx({}))).toThrow(/without @UseGuards\(TripAccessGuard\)/);
  });
});
