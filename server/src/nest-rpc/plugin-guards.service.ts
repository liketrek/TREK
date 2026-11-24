import { Trips } from '../db/entities/Trips.entity';
import { Users } from '../db/entities/Users.entity';
import type { TripsRepository } from '../db/repositories/Trips.repository';
import type { UsersRepository } from '../db/repositories/Users.repository';
import { AddonsService } from '../nest/addons/addons.service';
import { PermissionsService } from '../nest/permissions/permissions.service';
import { BadParams, ForbiddenResource } from './rpc-errors';
import type { PluginRpcContext } from './rpc-kit/types';
import { rowIdParam } from './rpc-params';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** The trip addon a read or write belongs to, and the word its refusal names it by. */
export interface RpcAddon {
  addonId: string;
  noun: string;
}

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
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripsRepository directly (same constructor slot) and
    // calls findAccessible.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly permissions: PermissionsService,
    private readonly addons: AddonsService,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  /**
   * Membership-check a trip read against the HOST-bound acting user. The acting user
   * comes from the supervisor's invocation map, never from a plugin-supplied field,
   * so a plugin cannot read another user's trips by naming their id. A userless
   * context (a job, or onLoad) has no acting user and is refused.
   */
  async tripRead<T>(
    params: Record<string, unknown>,
    ctx: PluginRpcContext,
    read: (userId: number) => T,
    addon?: RpcAddon,
  ): Promise<T> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('trip reads require an authenticated user context');
    }
    if (!(await this.trips.findAccessible(tripId, ctx.actingUserId))) {
      throw new ForbiddenResource(`no access to trip ${tripId}`);
    }
    if (addon) await this.requireAddon(addon.addonId, addon.noun, { tripId, userId: ctx.actingUserId });
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

  /**
   * A write is allowed only if the acting user can access AND edit the trip,
   * and, given the addon the write belongs to, only while it is on for the trip.
   */
  async requireTripEdit(tripId: number, userId: number, action: string, addon?: RpcAddon): Promise<void> {
    if (!(await this.trips.findAccessible(tripId, userId))) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!(await this.canEditAs(action, tripId, userId)))
      throw new ForbiddenResource(`no permission to edit trip ${tripId}`);
    if (addon) await this.requireAddon(addon.addonId, addon.noun, { tripId, userId });
  }

  /**
   * The trip-access + role gate every planner write uses, mirroring the app's
   * per-domain canEdit. Returns false and never throws, so the caller decides which
   * message the refusal carries.
   */
  async canEditAs(action: string, tripId: number, userId: number): Promise<boolean> {
    const trip = await this.trips.findAccessible(tripId, userId);
    if (!trip) return false;
    // UsersRepository.getRole (PG3, Plan 3j Task 1) — `SELECT role FROM users
    // WHERE id = ?`, converted. Its `string | null` return already folds "no
    // row" and "row with a null role" into one value (the `role` column is
    // `NOT NULL DEFAULT 'user'`, so the second case cannot occur against the
    // real schema), so a null role here IS the "row is gone" refusal the
    // legacy `!user` check made. The `?? 'user'` fallback below is kept
    // verbatim rather than dropped, even though it is now unreachable code,
    // so a future change to getRole's contract can't silently resurrect the
    // old defensive gap.
    const role = await this.users.getRole(userId);
    if (role === null) return false;
    return this.permissions.checkPermission(action, role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
  }

  /**
   * A permission that is NOT bound to a trip, so it cannot go through
   * requireTripEdit. `trip_create` is the only one today: it has no trip to check
   * against yet, which is why the owner id is passed as null.
   */
  async canCreateAs(action: string, userId: number): Promise<boolean> {
    // Same converted read as canEditAs (PG4, identical statement text). No
    // early refusal here, unchanged from the legacy branch: a vanished row
    // falls back to role 'user' rather than refusing outright, exactly like
    // `user?.role ?? 'user'` did — `trip_create`'s 'everybody' default means
    // that fallback alone is enough to let the call through today.
    const role = await this.users.getRole(userId);
    return this.permissions.checkPermission(action, role ?? 'user', null, userId, false);
  }

  /**
   * A subsystem read is refused when its addon is off, matching the app, where a
   * disabled addon means there is simply nothing to read.
   *
   * Given the trip a call is about and the acting user, it asks what applies to
   * that trip (the owner's choice, else the instance switch), once the user may
   * see the trip. For a trip the user cannot see it reads the instance switch,
   * so the answer never tells the plugin what a stranger's trip chose; the
   * access check that follows refuses the call anyway.
   */
  async requireAddon(addonId: string, noun: string, trip?: { tripId: number; userId?: number }): Promise<void> {
    const forTrip =
      trip?.userId !== undefined && (await this.trips.findAccessible(trip.tripId, trip.userId)) ? trip.tripId : null;
    const on =
      forTrip === null
        ? await this.addons.isAddonEnabled(addonId)
        : await this.addons.isEnabledForTrip(forTrip, addonId);
    if (!on) throw new ForbiddenResource(`the ${noun} addon is disabled`);
  }

  /**
   * For a read across all of a user's trips: the ids of the trips the addon
   * applies to, in the order given. Refused only when it applies to none of
   * them and the instance has it off, as requireAddon refuses.
   */
  async tripsWithAddon(addonId: string, noun: string, tripIds: readonly number[]): Promise<number[]> {
    const on = await Promise.all(tripIds.map((id) => this.addons.isEnabledForTrip(id, addonId)));
    const kept = tripIds.filter((_id, i) => on[i]);
    if (kept.length === 0 && !(await this.addons.isAddonEnabled(addonId))) {
      throw new ForbiddenResource(`the ${noun} addon is disabled`);
    }
    return kept;
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
