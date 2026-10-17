import { Places } from '../../db/entities/Places.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { PluginGuards } from '../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../nest-rpc/rpc-errors';
import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import type { PluginRpcContext } from '../../nest-rpc/rpc-kit/types';
import { num, schemaMessage } from '../../nest-rpc/rpc-params';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { DaysService } from '../days/days.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService } from '../reservations/reservations.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { TripsService, NotFoundError, ValidationError, withoutFeedToken } from './trips.service';
import { EntityManager } from '@mikro-orm/core';
import { tripCreateRequestSchema, tripUpdateRequestSchema } from '@trek/shared';

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
    // Plan 3c Task 7: `DatabaseService` DROPPED — RP1–RP6 were its only uses
    // in this class, and every one now resolves through `em.getRepository(...)`
    // below (same precedent as `TripReadModelService`, Task 6: "DatabaseService
    // is dropped from its constructor entirely" once a service goes fully
    // SQL-free). Every call site that hand-constructs `TripsRpc` positionally
    // drops its `db` fake/instance argument in the same slot.
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
    // Appended: the hand-wired plugin-host harnesses build this positionally.
    private readonly accommodations: AccommodationsService,
    private readonly roster: TripMembersService,
    // Plan 3c Task 7: RP1–RP6's repository calls all resolve through this,
    // the same `this.em.getRepository(...)` shape `TripsService.canAccessTrip`/
    // `.isOwner` used since Task 0b — `EntityManager` is `@Global()`, so no
    // module needs new wiring. Appended last, per this class's own convention.
    private readonly em: EntityManager,
  ) {}

  @PluginMethod('trips.getById', { permission: 'db:read:trips' })
  async getById(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return this.guards.tripRead(params, ctx, async () =>
      // db:read:trips is a read grant on the trip, not on the credential that
      // publishes it anonymously — see withoutFeedToken. RP1 — TripsRepository.findRaw.
      withoutFeedToken(await this.em.getRepository(Trips).findRaw(num(params.tripId, 'tripId'))),
    );
  }

  @PluginMethod('trips.getPlaces', { permission: 'db:read:trips' })
  async getPlaces(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // The trip's place POOL. Places carry no itinerary position of their own
    // (day_id/order_index live on day_assignments), so order by created_at like the
    // REST list does. trips.getDays is the day-ordered itinerary.
    // RP2 — PlacesRepository.listForTripOrdered (Task 4/5's repository, Task 7's own additive method).
    return this.guards.tripRead(
      params,
      ctx,
      async () => await this.em.getRepository(Places).listForTripOrdered(num(params.tripId, 'tripId')),
    );
  }

  @PluginMethod('trips.getReservations', { permission: 'db:read:trips' })
  getReservations(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, async () => this.reservations.list(String(num(params.tripId, 'tripId'))));
  }

  @PluginMethod('trips.getDays', { permission: 'db:read:trips' })
  getDays(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Days with their assignments and notes: the read half of db:write:days, without
    // which a writer cannot even discover the day ids it may edit.
    return this.guards.tripRead(
      params,
      ctx,
      async () => ((await this.days.list(num(params.tripId, 'tripId'))) as { days: unknown[] }).days,
    );
  }

  @PluginMethod('trips.getAccommodations', { permission: 'db:read:trips' })
  getAccommodations(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(
      params,
      ctx,
      async () => (await this.accommodations.list(num(params.tripId, 'tripId'))) as unknown[],
    );
  }

  @PluginMethod('trips.listMine', { permission: 'db:read:trips' })
  async listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // Membership is baked into the service, so there is no tripId to check, but a
    // job or onLoad with no bound user is refused exactly like costs.listMine.
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('trip reads require an authenticated user context');
    return await this.trips.list(ctx.actingUserId, null);
  }

  @PluginMethod('reservations.listMine', { permission: 'db:read:trips' })
  async listMyReservations(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('reservation reads require an authenticated user context');
    }
    const trips = (await this.trips.list(ctx.actingUserId, null)) as Array<{ id: number }>;
    const perTrip = await Promise.all(trips.map((t) => this.reservations.list(String(t.id))));
    return perTrip.flat();
  }

  @PluginMethod('trips.members', { permission: 'db:read:trips' })
  async members(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // RP3 — TripMembersRepository.listRawUsernameAndDisplayName: raw `username`
    // AND `display_name` as separate fields, deliberately NOT TM2's COALESCE
    // (inventory §18.10 — a plugin's roster shape and the REST/MCP roster
    // shape are two different wire shapes on purpose; do not harmonise).
    return this.guards.tripRead(
      params,
      ctx,
      async () => await this.em.getRepository(TripMembers).listRawUsernameAndDisplayName(num(params.tripId, 'tripId')),
    );
  }

  @PluginMethod('trips.update', { permission: 'db:write:trips' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'trip');
    const parsed = tripUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid trip: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
    await this.guards.requireTripEdit(tripId, actor, TRIP_EDIT_ACTION);
    const input = parsed.data as Record<string, unknown>;
    // Two fields carry their own permissions on top of trip_edit, exactly as the REST
    // controller gates them.
    if ('is_archived' in input && !(await this.guards.canEditAs('trip_archive', tripId, actor))) {
      throw new ForbiddenResource(`no permission to archive trip ${tripId}`);
    }
    if ('cover_image' in input && !(await this.guards.canEditAs('trip_cover_upload', tripId, actor))) {
      throw new ForbiddenResource(`no permission to change the cover of trip ${tripId}`);
    }
    const role = await this.em.getRepository(Users).getRole(actor); // RP4 — UsersRepository.getRole
    try {
      // The no-rebase core, parity with the legacy host path, which never
      // re-anchored the budget currency.
      const result = await this.trips.updateTrip(
        tripId,
        actor,
        input as Parameters<TripsService['updateTrip']>[2],
        role ?? 'user',
      );
      this.realtime.broadcast(tripId, 'trip:updated', { trip: result.updatedTrip });
      return result.updatedTrip;
    } catch (e) {
      if (e instanceof ValidationError) throw new BadParams(e.message);
      if (e instanceof NotFoundError) throw new ForbiddenResource(e.message);
      throw e;
    }
  }

  @PluginMethod('trips.create', { permission: 'db:create:trips' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // The capability that unlocks importers (MyMaps, booking dumps, calendar sync).
    // No broadcast: a new trip is only visible to its owner, who refetches.
    const actor = this.guards.requireActor(ctx, 'trip');
    const parsed = tripCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid trip: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
    if (!(await this.canCreateTrip(actor))) throw new ForbiddenResource('no permission to create trips');
    try {
      return (await this.trips.create(actor, parsed.data as unknown as Parameters<TripsService['create']>[1])).trip;
    } catch (e) {
      if (e instanceof ValidationError) throw new BadParams(e.message);
      throw e;
    }
  }

  /** trip_create is not trip-scoped, so it cannot go through requireTripEdit. */
  private async canCreateTrip(userId: number): Promise<boolean> {
    return this.guards.canCreateAs('trip_create', userId);
  }

  @PluginMethod('trips.addMember', { permission: 'db:write:members' })
  async addMember(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const targetUserId = num(params.userId, 'userId');
    const actor = this.guards.requireActor(ctx, 'trip member');
    await this.guards.requireTripEdit(tripId, actor, MEMBER_MANAGE_ACTION);
    // RP5 — UsersRepository.findIdAndEmail (existence check only; the `email` field is unused here).
    const target = await this.em.getRepository(Users).findIdAndEmail(targetUserId);
    if (!target) throw new ForbiddenResource(`no user ${targetUserId}`);
    // The acting user is recorded as the inviter.
    return this.membership.joinTripAsMember(tripId, targetUserId, actor);
  }

  @PluginMethod('trips.removeMember', { permission: 'db:write:members' })
  async removeMember(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const targetUserId = num(params.userId, 'userId');
    const actor = this.guards.requireActor(ctx, 'trip member');
    await this.guards.requireTripEdit(tripId, actor, MEMBER_MANAGE_ACTION);
    // Never remove the OWNER through this path: that would orphan the trip.
    // Ownership transfer is a separate, deliberate action.
    const ownerId = await this.em.getRepository(Trips).getOwnerId(tripId); // RP6 — TripsRepository.getOwnerId
    if (ownerId !== null && ownerId === targetUserId) throw new ForbiddenResource('cannot remove the trip owner');
    await this.roster.removeMember(tripId, targetUserId);
    return { removed: true };
  }
}
