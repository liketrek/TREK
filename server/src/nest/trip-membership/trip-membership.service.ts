import { DatabaseService } from '../database/database.service';
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
 * closes a real cycle. This module imports nothing, so it is the one place
 * those id-level reads can live — the fold that deleted trips.bridge.
 */
@Injectable()
export class TripMembershipService {
  constructor(private readonly db: DatabaseService) {}

  /** The trip owner's user id, or null when the trip does not exist. */
  getOwnerId(tripId: string | number): number | null {
    const row = this.db.get<{ user_id: number }>('SELECT user_id FROM trips WHERE id = ?', tripId);
    return row ? row.user_id : null;
  }

  /** Member user ids (owner excluded), in added_at order like listMembers. */
  listMemberUserIds(tripId: string | number): number[] {
    return this.db
      .all<{ user_id: number }>('SELECT user_id FROM trip_members WHERE trip_id = ? ORDER BY added_at ASC', tripId)
      .map((r) => r.user_id);
  }

  /**
   * Ids of every trip the user owns or is a member of, newest first — the id
   * half of TripsService.list(userId, null), same WHERE and ORDER BY.
   */
  listAccessibleTripIds(userId: number): number[] {
    return this.db
      .prepare(
        `
        SELECT t.id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE (t.user_id = :userId OR m.user_id IS NOT NULL)
        ORDER BY t.created_at DESC
      `,
      )
      .all({ userId })
      .map((r) => (r as { id: number }).id);
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
   */
  joinTripAsMember(tripId: number, userId: number, invitedBy: number | null): { joined: boolean; tripId: number } {
    const trip = this.db.get<{ id: number; user_id: number }>('SELECT id, user_id FROM trips WHERE id = ?', tripId);
    if (!trip) return { joined: false, tripId };
    // The owner already has full access; never add them as a member.
    if (trip.user_id === userId) return { joined: false, tripId };
    const existing = this.db.get('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?', tripId, userId);
    if (existing) return { joined: false, tripId };
    this.db.run('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)', tripId, userId, invitedBy);
    return { joined: true, tripId };
  }
}
