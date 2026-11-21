import { Addons } from '../../db/entities/Addons.entity';
import { TripAddonOverrides } from '../../db/entities/TripAddonOverrides.entity';
import type { AddonsRepository } from '../../db/repositories/Addons.repository';
import type { TripAddonOverridesRepository } from '../../db/repositories/TripAddonOverrides.repository';
import { revokeUserSessions } from '../../mcp/sessionManager';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { RealtimeService } from '../realtime/realtime.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { isTripAddonRow } from './addons.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TripAddon } from '@trek/shared';

/** The refusal a member, an admin or anyone else but the owner gets for a change. */
export const TRIP_ADDON_OWNER_ONLY = 'Only the owner can change the addons of this trip';
/** The refusal for an id that names no trip addon (unknown, or a global or integration addon). */
export const TRIP_ADDON_NOT_FOUND = 'Addon not found';

/**
 * Whether a trip addon applies to one trip: the owner's choice for the trip
 * when there is one, else the instance switch.
 *
 * The trip owner may turn an addon on that the admin switched off, or off
 * where it is on everywhere else, and go back to the instance setting, which
 * drops the trip's row. Nothing of the addon's own data is touched, so a trip
 * that switches costs off and on again finds every expense where it was.
 *
 * Only the owner decides. The check is the literal `user_id` one of
 * TripOwnerGuard and not PermissionsService, which lets every admin through:
 * an admin who is no owner of the trip changes nothing here either.
 *
 * Whether an addon applies to a trip is AddonsService.isEnabledForTrip, the
 * one read every gate shares; this service owns the choice and its listing.
 */
@Injectable()
export class TripAddonsService {
  constructor(
    @InjectRepository(Addons) private readonly addons: AddonsRepository,
    @InjectRepository(TripAddonOverrides) private readonly overrides: TripAddonOverridesRepository,
    private readonly trips: TripAccessService,
    private readonly membership: TripMembershipService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
  ) {}

  /** Every trip addon as this trip sees it, in the admin's order. The caller has checked access. */
  async effectiveTripAddons(tripId: number): Promise<TripAddon[]> {
    const rows = (await this.addons.listAllOrdered()).filter(isTripAddonRow);
    const chosen = new Map((await this.overrides.listForTrip(tripId)).map((o) => [o.addon_id, o.enabled]));
    return rows.map((row) => {
      const instanceEnabled = !!row.enabled;
      const override = chosen.get(row.id);
      return {
        id: row.id,
        name: row.name,
        icon: row.icon ?? null,
        enabled: override ?? instanceEnabled,
        instanceEnabled,
        overridden: override !== undefined,
      };
    });
  }

  /**
   * The owner switches one trip addon for the trip: `true` on, `false` off,
   * `null` back to the instance setting. Answers the trip's whole list as it
   * stands after the change and sends it to every member of the trip, the
   * tab that made the change aside.
   *
   * A trip the caller cannot see is a 404 rather than a 403, so the answer
   * never confirms that the trip exists.
   */
  async setTripOverride(
    tripId: number,
    userId: number,
    addonId: string,
    enabled: boolean | null,
    socketId?: string,
  ): Promise<TripAddon[]> {
    const trip = await this.trips.findAccessible(tripId, userId);
    if (!trip) throw new DomainError(404, 'Trip not found');
    if (trip.user_id !== userId) throw new DomainError(403, TRIP_ADDON_OWNER_ONLY);
    const { addons, opened } = await this.uow.transactional(async () => {
      const addon = await this.addons.findById(addonId);
      if (!isTripAddonRow(addon)) throw new DomainError(404, TRIP_ADDON_NOT_FOUND);
      const wasOn = (await this.overrides.findForTrip(trip.id, addon.id)) ?? !!addon.enabled;
      if (enabled === null) await this.overrides.deleteOverride(trip.id, addon.id);
      else await this.overrides.upsertOverride(trip.id, addon.id, enabled);
      const after = await this.effectiveTripAddons(trip.id);
      const now = after.find((entry) => entry.id === addon.id);
      return { addons: after, opened: !wasOn && now !== undefined && now.enabled && !now.instanceEnabled };
    });
    this.realtime.broadcast(String(trip.id), 'tripAddons:changed', { addons }, socketId);
    if (opened) await this.reattachMcpSessions(trip.id);
    return addons;
  }

  /**
   * A trip switched on an addon the instance has off. A member's MCP session
   * attached its tools while the addon was off everywhere for them, and the
   * attach-time gate never runs again, so the session is ended and the client
   * starts a new one that offers the tools. Switching off needs nothing: the
   * per-call gate refuses for the trip at once.
   */
  private async reattachMcpSessions(tripId: number): Promise<void> {
    const ownerId = await this.membership.getOwnerId(tripId);
    const memberIds = await this.membership.listMemberUserIds(tripId);
    for (const userId of new Set([...(ownerId === null ? [] : [ownerId]), ...memberIds])) revokeUserSessions(userId);
  }

  /** A copied trip keeps the choices of the trip it came from. Runs inside the copy's transaction. */
  async copyOverrides(fromTripId: number, toTripId: number): Promise<void> {
    await this.overrides.copyForTrip(fromTripId, toTripId);
  }
}
