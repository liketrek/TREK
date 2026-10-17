import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * Adding an existing user to a trip as a member, plus the leaf membership
 * READS. Its own domain rather than a method on auth or trip-invite: both of
 * those call it, as does OIDC and the plugin RPC host, and folding it into
 * either would put AuthModule and TripInviteModule in a cycle.
 *
 * The reads exist for the same reason: BudgetMcp and CostsRpc need "who is on
 * this trip" / "which trips can this user see", but every service that owns
 * the hydrated answer (TripsService, TripMembersService, TripReadModelService)
 * lives in a module that imports the budget domain, so injecting one there
 * closes a real cycle. This module imports nothing but `TripsRepository`/
 * `TripMembersRepository` (Plan 3c Task 1: `MikroOrmModule.forFeature`, no
 * service import — see `trip-membership.module.ts`), so it stays the one
 * place those id-level reads can live — the fold that deleted trips.bridge.
 */
@Injectable()
export class TripMembershipService {
  constructor(
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(TripMembers) private readonly tripMembers: TripMembersRepository,
  ) {}

  /** The trip owner's user id, or null when the trip does not exist. */
  async getOwnerId(tripId: string | number): Promise<number | null> {
    return this.trips.getOwnerId(tripId);
  }

  /** Member user ids (owner excluded), in added_at order like listMembers. */
  async listMemberUserIds(tripId: string | number): Promise<number[]> {
    return this.tripMembers.listUserIdsByTrip(tripId);
  }

  /**
   * Ids of every trip the user owns or is a member of, newest first — the id
   * half of TripsService.list(userId, null), same WHERE and ORDER BY.
   */
  async listAccessibleTripIds(userId: number): Promise<number[]> {
    return this.trips.listAccessibleIds(userId);
  }

  /**
   * Add an existing user to a trip as a member, by user id.
   *
   * Idempotent and safe: it skips the trip owner and anyone who is already a
   * member, and no-ops if the trip no longer exists. Shared by trip invite-link
   * joins (#1143) and the trip-bound admin invite auto-join (#1402). The caller is
   * responsible for authenticating/creating the user first, so the id always
   * belongs to a real (non-guest) account.
   *
   * Returns whether a new membership row was actually created.
   *
   * Non-transactional check-then-act, unchanged (Plan 3c inventory §18.4,
   * program rule 11): two concurrent joins can both pass the "already a
   * member" check and both insert. Pinned by a concurrency test, not fixed.
   */
  async joinTripAsMember(
    tripId: number,
    userId: number,
    invitedBy: number | null,
  ): Promise<{ joined: boolean; tripId: number }> {
    const trip = await this.trips.findIdAndOwner(tripId);
    if (!trip) return { joined: false, tripId };
    // The owner already has full access; never add them as a member.
    if (trip.user_id === userId) return { joined: false, tripId };
    const existing = await this.tripMembers.exists(tripId, userId);
    if (existing) return { joined: false, tripId };
    await this.tripMembers.addMember(tripId, userId, invitedBy);
    return { joined: true, tripId };
  }
}
