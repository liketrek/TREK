import { Trips } from '../../db/entities/Trips.entity';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { TRIP_REQUEST_KEY } from './trip-access.guard';
import { EntityManager } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, HttpException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

/** Metadata `@RequireTripOwner()` writes and the guard reads. */
export const TRIP_OWNER_KEY = 'trekTripOwner';

export interface TripOwnerOptions {
  /** Route param holding the trip id. Defaults to `tripId`; the trip routes use `id`. */
  param?: string;
}

/**
 * Owner-only, with the refusal message the route has always sent.
 *
 * The message is part of the metadata rather than a constant because the two
 * places that need this today say different things, and both strings are
 * asserted: 'Only the owner can transfer ownership' and 'Only the owner can
 * manage guests'.
 */
export const RequireTripOwner = (message: string, options: TripOwnerOptions = {}) =>
  SetMetadata(TRIP_OWNER_KEY, { message, ...options });

type TripRequest = Request & { user?: User; [TRIP_REQUEST_KEY]?: TripAccess };

/**
 * Requires that the caller *owns* the trip, not merely that they may edit it.
 *
 * Handing a trip over and creating or deleting guests are the two things a
 * collaborator must never do, however generous the trip's permission settings
 * are. Until now each route asserted `access.user_id !== user.id` by hand, and
 * `src/nest/**` had no owner guard at all.
 *
 * It deliberately does NOT consult PermissionsService. `checkPermission` returns
 * true for every admin, and the permission actions are admin-lowerable, so
 * routing ownership through it would quietly hand any admin the ability to
 * transfer other people's trips — the opposite of what these four routes are
 * for. The check here is the literal one the routes did: `trip.user_id === user.id`.
 *
 * Absent access is a 404, never a 403, for the same reason TripAccessGuard does
 * it that way: a 403 would confirm the id exists to someone who has no business
 * knowing. A 403 only ever goes to somebody who can already see the trip.
 *
 * Injects `EntityManager`, not `DatabaseService` (Plan 3c Task 0b, the
 * `task-0a-review-security.md` F-A1 correction): `trip-members.controller.ts`
 * has no class-level `TripAccessGuard` (its own docstring explains why —
 * guards run before pipes and the e2e suite pins the error ordering), so on
 * its four owner-only routes `request[TRIP_REQUEST_KEY]` is never parked and
 * THIS guard's own lookup at `:73` below is the sole access check standing
 * between a stranger and those routes — the same `TripAccessGuard` precedent
 * applies here for the same reason (`EntityManager` is `@Global()`, no
 * module needs new wiring; `@InjectRepository(Trips)` would).
 */
@Injectable()
export class TripOwnerGuard implements CanActivate {
  constructor(
    private readonly em: EntityManager,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TripRequest>();
    const user = request.user;
    // JwtAuthGuard runs first and 401s an anonymous request, so a missing user
    // here means the route was wired without it. Refuse rather than read
    // `user.id` off undefined and turn a wiring mistake into a 500.
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const meta = this.reflector.getAllAndOverride<{ message: string; param?: string } | undefined>(TRIP_OWNER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const message = meta?.message ?? 'Only the trip owner can do this';

    // Reuse the row TripAccessGuard already resolved when the route carries both,
    // so a request never costs two lookups of the same trip.
    let trip = request[TRIP_REQUEST_KEY];
    if (!trip) {
      const tripId = Number((request.params as Record<string, string>)?.[meta?.param ?? 'tripId']);
      trip = Number.isFinite(tripId)
        ? ((await this.em.getRepository(Trips).findAccessible(tripId, user.id)) ?? undefined)
        : undefined;
      if (trip) request[TRIP_REQUEST_KEY] = trip;
    }
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);

    if (trip.user_id !== user.id) throw new HttpException({ error: message }, 403);
    return true;
  }
}
