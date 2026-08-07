import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * Adding an existing user to a trip as a member. Its own domain rather than a
 * method on auth or trip-invite: both of those call it, as does OIDC and the
 * plugin RPC host, and folding it into either would put AuthModule and
 * TripInviteModule in a cycle.
 */
@Injectable()
export class TripMembershipService {
  constructor(private readonly db: DatabaseService) {}

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
  joinTripAsMember(
    tripId: number,
    userId: number,
    invitedBy: number | null,
  ): { joined: boolean; tripId: number } {
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
