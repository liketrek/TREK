import { tripCreateRequestSchema, tripUpdateRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService } from '../database/database.service';
import { ReservationsService } from '../reservations/reservations.service';
import { DaysService } from '../days/days.service';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { TripsService, NotFoundError, ValidationError } from './trips.service';

const TRIP_EDIT_ACTION = 'trip_edit';
const MEMBER_MANAGE_ACTION = 'member_manage';

/** The REST controller caps these two, while the shared schema leaves them open. */
const TRIP_STR_LIMITS: Record<string, number> = { title: 200, description: 2000 };

/**
 * The trip surface a plugin may reach (#plugins), including the cross-trip feeds and
 * the member roster.
 *
 * Two things are specific to trips. updateTrip gates two individual FIELDS behind
 * their own admin-configurable permissions, on top of trip_edit, so a plugin cannot
 * archive or re-cover a trip it may otherwise edit. And adding a member GRANTS TRIP
 * ACCESS, which is why it sits behind its own permission and the app's member_manage
 * right rather than being bundled with a lower-risk write.
 */
@PluginController()
export class TripsRpc {
  constructor(
    private readonly trips: TripsService,
    private readonly reservations: ReservationsService,
    private readonly days: DaysService,
    private readonly membership: TripMembershipService,
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
    // Appended: the hand-wired plugin-host harnesses build this positionally.
    private readonly accommodations: AccommodationsService,
    private readonly roster: TripMembersService,
  ) {}

  @PluginMethod('trips.getById', { permission: 'db:read:trips' })
  getById(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () =>
      this.db.prepare('SELECT * FROM trips WHERE id = ?').get(num(params.tripId, 'tripId')),
    );
  }

  @PluginMethod('trips.getPlaces', { permission: 'db:read:trips' })
  getPlaces(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // The trip's place POOL. Places carry no itinerary position of their own
    // (day_id/order_index live on day_assignments), so order by created_at like the
    // REST list does. trips.getDays is the day-ordered itinerary.
    return this.guards.tripRead(params, ctx, () =>
      this.db
        .prepare('SELECT * FROM places WHERE trip_id = ? ORDER BY created_at DESC')
        .all(num(params.tripId, 'tripId')),
    );
  }

  @PluginMethod('trips.getReservations', { permission: 'db:read:trips' })
  getReservations(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => this.reservations.list(String(num(params.tripId, 'tripId'))));
  }

  @PluginMethod('trips.getDays', { permission: 'db:read:trips' })
  getDays(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Days with their assignments and notes: the read half of db:write:days, without
    // which a writer cannot even discover the day ids it may edit.
    return this.guards.tripRead(
      params,
      ctx,
      () => (this.days.list(num(params.tripId, 'tripId')) as { days: unknown[] }).days,
    );
  }

  @PluginMethod('trips.getAccommodations', { permission: 'db:read:trips' })
  getAccommodations(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => this.accommodations.list(num(params.tripId, 'tripId')) as unknown[]);
  }

  @PluginMethod('trips.listMine', { permission: 'db:read:trips' })
  listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Membership is baked into the service, so there is no tripId to check, but a
    // job or onLoad with no bound user is refused exactly like costs.listMine.
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('trip reads require an authenticated user context');
    return this.trips.list(ctx.actingUserId, null);
  }

  @PluginMethod('reservations.listMine', { permission: 'db:read:trips' })
  listMyReservations(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('reservation reads require an authenticated user context');
    }
    const trips = this.trips.list(ctx.actingUserId, null) as Array<{ id: number }>;
    return trips.flatMap((t) => this.reservations.list(String(t.id)));
  }

  @PluginMethod('trips.members', { permission: 'db:read:trips' })
  members(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () =>
      this.db
        .prepare('SELECT u.id, u.username, u.display_name, u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE tm.trip_id = ?')
        .all(num(params.tripId, 'tripId')) as unknown[],
    );
  }

  @PluginMethod('trips.update', { permission: 'db:write:trips' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'trip');
    const parsed = tripUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid trip: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
    this.guards.requireTripEdit(tripId, actor, TRIP_EDIT_ACTION);
    const input = parsed.data as Record<string, unknown>;
    // Two fields carry their own permissions on top of trip_edit, exactly as the REST
    // controller gates them.
    if ('is_archived' in input && !this.guards.canEditAs('trip_archive', tripId, actor)) {
      throw new ForbiddenResource(`no permission to archive trip ${tripId}`);
    }
    if ('cover_image' in input && !this.guards.canEditAs('trip_cover_upload', tripId, actor)) {
      throw new ForbiddenResource(`no permission to change the cover of trip ${tripId}`);
    }
    const user = this.db.prepare('SELECT role FROM users WHERE id = ?').get(actor) as { role?: string } | undefined;
    try {
      // The no-rebase core, parity with the legacy host path, which never
      // re-anchored the budget currency.
      const result = this.trips.updateTrip(tripId, actor, input as Parameters<TripsService['updateTrip']>[2], user?.role ?? 'user');
      this.realtime.broadcast(tripId, 'trip:updated', { trip: result.updatedTrip });
      return result.updatedTrip;
    } catch (e) {
      if (e instanceof ValidationError) throw new BadParams(e.message);
      if (e instanceof NotFoundError) throw new ForbiddenResource(e.message);
      throw e;
    }
  }

  @PluginMethod('trips.create', { permission: 'db:create:trips' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // The capability that unlocks importers (MyMaps, booking dumps, calendar sync).
    // No broadcast: a new trip is only visible to its owner, who refetches.
    const actor = this.guards.requireActor(ctx, 'trip');
    const parsed = tripCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid trip: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
    if (!this.canCreateTrip(actor)) throw new ForbiddenResource('no permission to create trips');
    try {
      return this.trips.create(actor, parsed.data as unknown as Parameters<TripsService['create']>[1]).trip;
    } catch (e) {
      if (e instanceof ValidationError) throw new BadParams(e.message);
      throw e;
    }
  }

  /** trip_create is not trip-scoped, so it cannot go through requireTripEdit. */
  private canCreateTrip(userId: number): boolean {
    return this.guards.canCreateAs('trip_create', userId);
  }

  @PluginMethod('trips.addMember', { permission: 'db:write:members' })
  addMember(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const targetUserId = num(params.userId, 'userId');
    const actor = this.guards.requireActor(ctx, 'trip member');
    this.guards.requireTripEdit(tripId, actor, MEMBER_MANAGE_ACTION);
    const target = this.db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId) as { id: number } | undefined;
    if (!target) throw new ForbiddenResource(`no user ${targetUserId}`);
    // The acting user is recorded as the inviter.
    return this.membership.joinTripAsMember(tripId, targetUserId, actor);
  }

  @PluginMethod('trips.removeMember', { permission: 'db:write:members' })
  removeMember(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const targetUserId = num(params.userId, 'userId');
    const actor = this.guards.requireActor(ctx, 'trip member');
    this.guards.requireTripEdit(tripId, actor, MEMBER_MANAGE_ACTION);
    // Never remove the OWNER through this path: that would orphan the trip.
    // Ownership transfer is a separate, deliberate action.
    const trip = this.db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id: number } | undefined;
    if (trip && trip.user_id === targetUserId) throw new ForbiddenResource('cannot remove the trip owner');
    this.roster.removeMember(tripId, targetUserId);
    return { removed: true };
  }
}
