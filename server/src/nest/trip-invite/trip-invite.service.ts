import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import type { TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import type { User } from '../../types';

type Trip = TripAccess;

export interface TripInviteInfo {
  token: string;
  expires_at: string | null;
  created_at: string;
}

/**
 * Per-trip invite links (#1143) — the legacy tripInviteService SQL folded in
 * over the injected DatabaseService (byte-identical statements and coercions).
 *
 * A trip has at most ONE invite token (mirrors the public share link: one
 * rotating token per trip). Unlike the share link, this one is NOT public —
 * opening it only does something for a logged-in user with an existing account,
 * who is then added to the trip as a member. Rotating or disabling the link
 * immediately invalidates the old URL. Trip access and the 'share_manage'
 * permission mirror the public share link exactly (the invite link lives next
 * to it in the Share area).
 */
@Injectable()
export class TripInviteService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly membership: TripMembershipService,
  ) {}

  verifyTripAccess(tripId: string, userId: number) {
    return this.dbs.canAccessTrip(tripId, userId);
  }

  canManage(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('share_manage', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /** The current invite link for a trip, or null if none exists. */
  get(tripId: string | number): TripInviteInfo | null {
    const row = this.dbs.get<{ token: string; expires_at: string | null; created_at: string }>(
      'SELECT token, expires_at, created_at FROM trip_invite_tokens WHERE trip_id = ?',
      tripId,
    );
    return row ? { token: row.token, expires_at: row.expires_at, created_at: row.created_at } : null;
  }

  /**
   * Create the trip's invite link, or rotate it to a fresh token (there is only
   * ever one row per trip). An optional expiry (days) can bound the link's life.
   */
  createOrRotate(tripId: string | number, createdBy: number, expiresInDays?: number | null): TripInviteInfo {
    const token = crypto.randomBytes(24).toString('base64url');
    // Any non-positive/absent value (0, negatives, NaN, null, undefined) means
    // "no expiry" — deliberate: the UI sends null when no bound was chosen.
    const expiresAt =
      expiresInDays && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null;

    // Probe + write + re-select are one atomic unit so a concurrent rotation
    // can't interleave between them (the trip_id UNIQUE constraint would turn
    // that into a spurious 500).
    return this.dbs.transaction(() => {
      const existing = this.dbs.get('SELECT id FROM trip_invite_tokens WHERE trip_id = ?', tripId);
      if (existing) {
        this.dbs.run(
          'UPDATE trip_invite_tokens SET token = ?, expires_at = ?, created_by = ?, created_at = CURRENT_TIMESTAMP WHERE trip_id = ?',
          token, expiresAt, createdBy, tripId,
        );
      } else {
        this.dbs.run(
          'INSERT INTO trip_invite_tokens (trip_id, token, created_by, expires_at) VALUES (?, ?, ?, ?)',
          tripId, token, createdBy, expiresAt,
        );
      }
      return this.get(tripId)!;
    });
  }

  /** Remove the trip's invite link entirely (disable). */
  remove(tripId: string | number): void {
    this.dbs.run('DELETE FROM trip_invite_tokens WHERE trip_id = ?', tripId);
  }

  /**
   * Resolve an invite token to its (still-existing, unexpired) trip. Returns null
   * for unknown/expired tokens. Only ever called for an authenticated user, so the
   * trip title is safe to return for the join confirmation screen; an anonymous
   * caller never reaches this (the endpoint is JWT-guarded).
   */
  resolve(token: string): { trip_id: number; title: string } | null {
    const row = this.dbs.get<{ trip_id: number; title: string; expires_at: string | null }>(
      `SELECT t.id AS trip_id, t.title AS title, ti.expires_at AS expires_at
       FROM trip_invite_tokens ti
       JOIN trips t ON ti.trip_id = t.id
       WHERE ti.token = ?`,
      token,
    );
    if (!row) return null;
    // Check expiry in JS, not SQL: expires_at is stored as an ISO-8601 string
    // (…T…Z) which does not compare lexicographically against SQLite's
    // space-separated datetime('now'), so a SQL `>` would keep an expired link
    // alive until the end of the day. Mirrors the admin-invite validation.
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
    return { trip_id: row.trip_id, title: row.title };
  }

  /** Join the resolved trip as the current (authenticated, non-guest) user.
   *  invited_by is null — they joined via a link, not a personal invite. */
  join(tripId: number, userId: number) { return this.membership.joinTripAsMember(tripId, userId, null); }
}
