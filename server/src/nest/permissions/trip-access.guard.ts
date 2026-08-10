import { CanActivate, ExecutionContext, HttpException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from './permissions.service';
import type { User } from '../../types';

/** Where the guard parks the resolved trip row for `@Trip()` to pick up. */
export const TRIP_REQUEST_KEY = 'trekTrip';

/** The metadata key `@RequirePermission()` writes and the guard reads. */
export const TRIP_PERMISSION_KEY = 'trekTripPermission';

/**
 * Requires a permission on the trip the route is scoped to, on top of access.
 *
 * The action string is the same one the domain services pass to
 * `PermissionsService.checkPermission` ('day_edit', 'budget_edit', …), so a route
 * and its MCP counterpart cannot drift apart on which right they demand.
 */
export const RequirePermission = (action: string) => SetMetadata(TRIP_PERMISSION_KEY, action);

type TripRequest = Request & { user?: User; [TRIP_REQUEST_KEY]?: TripAccess };

/**
 * Resolves `:tripId` once per request, refuses what the user cannot reach, and hands
 * the trip row to the handler.
 *
 * Every trip-scoped controller used to carry its own `requireTrip` helper doing the
 * same three lines, and a `requireEdit` next to it. That is 18 copies of a security
 * check, each of which had to remember that no access is a 404 "Trip not found" and
 * never a 403 — the distinction that keeps a stranger from learning which trip ids
 * exist. One of them getting it wrong would have looked like nothing.
 *
 * The status codes and bodies here are byte-identical to those copies, because the
 * e2e suites assert them and the client branches on them.
 *
 * It deliberately does NOT replace the `verifyTripAccess`/`canEdit` methods on the
 * domain services. Of their callers, the large majority are `*.mcp.ts` tools, which
 * never pass through an HTTP guard; those methods stay exactly where they are.
 */
@Injectable()
export class TripAccessGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TripRequest>();
    const user = request.user;
    // JwtAuthGuard runs first and 401s an anonymous request, so a missing user here
    // means the route was wired without it. Refuse rather than read `user.id` off
    // undefined and turn a wiring mistake into a 500.
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const tripId = Number((request.params as Record<string, string>)?.tripId);
    const trip = Number.isFinite(tripId) ? this.db.canAccessTrip(tripId, user.id) : undefined;
    // A trip the user may not see is reported as absent, never as forbidden: a 403
    // would confirm the id exists to someone who has no business knowing.
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);

    const action = this.reflector.getAllAndOverride<string | undefined>(TRIP_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (action) {
      const shared = trip.user_id !== user.id;
      if (!this.permissions.checkPermission(action, user.role, trip.user_id, user.id, shared)) {
        throw new HttpException({ error: 'No permission' }, 403);
      }
    }

    request[TRIP_REQUEST_KEY] = trip;
    return true;
  }
}
