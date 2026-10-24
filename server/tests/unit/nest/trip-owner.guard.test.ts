/**
 * TripOwnerGuard — "only the owner", which `src/nest/**` had no guard for at all.
 * Ownership was asserted by hand in four routes, and the two things it protects
 * (handing a trip over, creating and deleting guests) are exactly the ones a
 * collaborator must never do however generous the trip's permissions are.
 */
import { TRIP_REQUEST_KEY } from '../../../src/nest/permissions/trip-access.guard';
import { RequireTripOwner, TRIP_OWNER_KEY, TripOwnerGuard } from '../../../src/nest/permissions/trip-owner.guard';
import type { User } from '../../../src/types';
import type { EntityManager } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { describe, it, expect, vi } from 'vitest';

const owner = { id: 42, role: 'user' } as User;
const member = { id: 7, role: 'user' } as User;
const admin = { id: 99, role: 'admin' } as User;
/** Trip 5 belongs to user 42; user 7 is a member. Nobody else can reach it. */
const TRIP = { id: 5, user_id: 42 };

/**
 * Plan 3c Task 0b (task-0a-review-security.md F-A1): the guard now injects
 * `EntityManager` and resolves `TripsRepository` inside `canActivate` (the
 * `TripAccessGuard`/`JwtAuthGuard` precedent), instead of `DatabaseService
 * .canAccessTrip` — this guard is the SOLE access check on
 * `trip-members.controller.ts`'s four owner-only routes (no class-level
 * `TripAccessGuard` there), so it gets the same direct-repository wiring.
 */
function makeGuard(meta: { message: string; param?: string } | undefined = { message: 'Only the owner can do this' }) {
  // async, not a bare sync return: `TripOwnerGuard.canActivate` awaits this
  // call, and a synchronous double would not catch a dropped `await` there
  // (task-0a mechanics review F1).
  const findAccessible = vi.fn(async (tripId: number, userId: number) =>
    tripId === 5 && (userId === 42 || userId === 7) ? TRIP : undefined,
  );
  const em = { getRepository: vi.fn(() => ({ findAccessible })) } as unknown as EntityManager;
  const reflector = { getAllAndOverride: vi.fn(() => meta) } as unknown as Reflector;
  const guard = new TripOwnerGuard(em, reflector);
  return { guard, canAccessTrip: findAccessible };
}

function ctx(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as never;
}

const thrown = async (run: () => unknown) => {
  try {
    await run();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
};

describe('TripOwnerGuard', () => {
  it('OWNER-001: the owner passes', async () => {
    const { guard } = makeGuard();
    expect(await guard.canActivate(ctx({ user: owner, params: { tripId: '5' } }))).toBe(true);
  });

  it('OWNER-002: a member of the trip is refused with the route own message', async () => {
    const { guard } = makeGuard({ message: 'Only the owner can manage guests' });
    expect(await thrown(() => guard.canActivate(ctx({ user: member, params: { tripId: '5' } })))).toEqual({
      status: 403,
      body: { error: 'Only the owner can manage guests' },
    });
  });

  it('OWNER-003: a stranger gets 404, never 403 — a 403 would confirm the id exists', async () => {
    const { guard } = makeGuard();
    expect(
      await thrown(() => guard.canActivate(ctx({ user: { id: 123, role: 'user' } as User, params: { tripId: '5' } }))),
    ).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
  });

  it('OWNER-004: an admin who does not own the trip is refused', async () => {
    // The regression this guard must not introduce. PermissionsService.checkPermission
    // returns true for every admin and the trip actions are admin-lowerable, so routing
    // ownership through it would hand admins other people's trips. The guard does not
    // inject it at all.
    const findAccessible = vi.fn(async () => TRIP);
    const em = { getRepository: vi.fn(() => ({ findAccessible })) } as unknown as EntityManager;
    const reflector = {
      getAllAndOverride: vi.fn(() => ({ message: 'Only the owner can transfer ownership' })),
    } as unknown as Reflector;
    const guard = new TripOwnerGuard(em, reflector);
    expect(await thrown(() => guard.canActivate(ctx({ user: admin, params: { tripId: '5' } })))).toEqual({
      status: 403,
      body: { error: 'Only the owner can transfer ownership' },
    });
  });

  it('OWNER-005: reads the param the metadata names, so the :id routes work', async () => {
    const { guard, canAccessTrip } = makeGuard({ message: 'no', param: 'id' });
    expect(await guard.canActivate(ctx({ user: owner, params: { id: '5' } }))).toBe(true);
    expect(canAccessTrip).toHaveBeenCalledWith(5, 42);
  });

  it('OWNER-006: reuses the row TripAccessGuard resolved instead of looking it up twice', async () => {
    const { guard, canAccessTrip } = makeGuard();
    const request = { user: owner, params: {}, [TRIP_REQUEST_KEY]: TRIP };
    expect(await guard.canActivate(ctx(request))).toBe(true);
    expect(canAccessTrip).not.toHaveBeenCalled();
  });

  it('OWNER-007: parks the row it resolved, so a later @Trip() reads it', async () => {
    const { guard } = makeGuard();
    const request: Record<string, unknown> = { user: owner, params: { tripId: '5' } };
    await guard.canActivate(ctx(request));
    expect(request[TRIP_REQUEST_KEY]).toEqual(TRIP);
  });

  it('OWNER-008: a missing user is a 401, not a 500 on undefined', async () => {
    const { guard } = makeGuard();
    expect(await thrown(() => guard.canActivate(ctx({ params: { tripId: '5' } })))).toEqual({
      status: 401,
      body: { error: 'Unauthorized' },
    });
  });

  it('OWNER-009: a non-numeric or absent id is a 404 without touching the database', async () => {
    const { guard, canAccessTrip } = makeGuard();
    expect(await thrown(() => guard.canActivate(ctx({ user: owner, params: { tripId: 'abc' } })))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
    expect(await thrown(() => guard.canActivate(ctx({ user: owner, params: {} })))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
    expect(canAccessTrip).not.toHaveBeenCalled();
  });

  it('OWNER-010: without metadata it still refuses a non-owner, with a generic message', async () => {
    // Built inline: passing undefined to makeGuard would hit its own default.
    const findAccessible = vi.fn(async () => TRIP);
    const em = { getRepository: vi.fn(() => ({ findAccessible })) } as unknown as EntityManager;
    const reflector = { getAllAndOverride: vi.fn(() => undefined) } as unknown as Reflector;
    const guard = new TripOwnerGuard(em, reflector);
    expect(await thrown(() => guard.canActivate(ctx({ user: member, params: { tripId: '5' } })))).toEqual({
      status: 403,
      body: { error: 'Only the trip owner can do this' },
    });
  });

  it('OWNER-011: @RequireTripOwner writes the message and the param under the key the guard reads', () => {
    class Probe {
      @RequireTripOwner('Only the owner can transfer ownership', { param: 'id' })
      handler() {}
    }
    expect(Reflect.getMetadata(TRIP_OWNER_KEY, Probe.prototype.handler)).toEqual({
      message: 'Only the owner can transfer ownership',
      param: 'id',
    });
  });
});
