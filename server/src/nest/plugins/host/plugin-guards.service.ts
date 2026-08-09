import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { AddonsService } from '../../addons/addons.service';
import { BadParams, ForbiddenResource } from './rpc-errors';
import { num } from './rpc-params';
import type { PluginRpcContext } from './rpc-kit/types';

/**
 * The resource gates every plugin RPC handler needs, lifted out of PluginRpcHost's
 * private methods and the host factory's canEditTripAs / requireAddon so that
 * decorated *.rpc.ts handlers get them by injection instead of through a closure.
 *
 * Every message string is character-identical to what the legacy router produced.
 * Do not "improve" one: rpc-host.test.ts asserts them, and shipped plugins read
 * them. Note in particular that trip READS say "trip reads" while requireActor
 * appends the word "writes", and that some domains throw their own inline variant
 * rather than calling requireActor at all.
 */
@Injectable()
export class PluginGuards {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly addons: AddonsService,
  ) {}

  /**
   * Membership-check a trip read against the HOST-bound acting user. The acting user
   * comes from the supervisor's invocation map, never from a plugin-supplied field,
   * so a plugin cannot read another user's trips by naming their id. A userless
   * context (a job, or onLoad) has no acting user and is refused.
   */
  tripRead<T>(params: Record<string, unknown>, ctx: PluginRpcContext, read: (userId: number) => T): T {
    const tripId = num(params.tripId, 'tripId');
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('trip reads require an authenticated user context');
    }
    if (!this.db.canAccessTrip(tripId, ctx.actingUserId)) {
      throw new ForbiddenResource(`no access to trip ${tripId}`);
    }
    // The read runs only for a bound, membership-checked user, so hand the id through
    // and per-user visibility filters (packing's private items) still apply.
    return read(ctx.actingUserId);
  }

  /**
   * Every write needs a HOST-bound acting user. `noun` is the domain word, and the
   * message appends "writes" to it, so pass 'tag', not 'tag writes'.
   */
  requireActor(ctx: PluginRpcContext, noun: string): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`${noun} writes require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  /** A write is allowed only if the acting user can access AND edit the trip. */
  requireTripEdit(tripId: number, userId: number, action: string): void {
    if (!this.db.canAccessTrip(tripId, userId)) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!this.canEditAs(action, tripId, userId)) throw new ForbiddenResource(`no permission to edit trip ${tripId}`);
  }

  /**
   * The trip-access + role gate every planner write uses, mirroring the app's
   * per-domain canEdit. Returns false and never throws, so the caller decides which
   * message the refusal carries.
   */
  canEditAs(action: string, tripId: number, userId: number): boolean {
    const trip = this.db.canAccessTrip(tripId, userId);
    if (!trip) return false;
    const user = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
    if (!user) return false;
    return this.permissions.checkPermission(action, user.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
  }

  /**
   * A permission that is NOT bound to a trip, so it cannot go through
   * requireTripEdit. `trip_create` is the only one today: it has no trip to check
   * against yet, which is why the owner id is passed as null.
   */
  canCreateAs(action: string, userId: number): boolean {
    const user = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
    return this.permissions.checkPermission(action, user?.role ?? 'user', null, userId, false);
  }

  /**
   * A subsystem read is refused when its addon is off, matching the app, where a
   * disabled addon means there is simply nothing to read.
   */
  requireAddon(addonId: string, noun: string): void {
    if (!this.addons.isAddonEnabled(addonId)) throw new ForbiddenResource(`the ${noun} addon is disabled`);
  }

  /**
   * The @trek/shared write schemas carry no string-length caps, so mirror the ones
   * the REST controllers add. Without this a plugin could write a field the web app
   * would reject with 400.
   */
  capStrings(input: Record<string, unknown>, limits: Record<string, number>): void {
    for (const [field, max] of Object.entries(limits)) {
      const value = input[field];
      if (typeof value === 'string' && value.length > max) {
        throw new BadParams(`${field} must be ${max} characters or fewer`);
      }
    }
  }
}
