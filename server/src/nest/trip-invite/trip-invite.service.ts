import { TripInviteTokens } from '../../db/entities/TripInviteTokens.entity';
import type { TripInviteTokensRepository } from '../../db/repositories/TripInviteTokens.repository';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import crypto from 'crypto';

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
 *
 * Plan 4 Task 1: `get`/`createOrRotate`/`remove`/`resolve` moved off
 * `DatabaseService` onto `TripInviteTokensRepository`. Plan 4 Task 2:
 * `verifyTripAccess`'s `canAccessTrip` delegate is now
 * `TripsRepository.findAccessible` directly — `DatabaseService` is gone
 * from this file entirely.
 */
@Injectable()
export class TripInviteService {
  constructor(
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripAccessService (trip-membership) (same constructor slot) and
    // calls findAccessible.
    private readonly trips: TripAccessService,
    private readonly permissions: PermissionsService,
    private readonly membership: TripMembershipService,
    private readonly uow: UnitOfWork,
    @InjectRepository(TripInviteTokens) private readonly tripInviteTokens: TripInviteTokensRepository,
  ) {}

  async verifyTripAccess(tripId: string, userId: number) {
    return await this.trips.findAccessible(tripId, userId);
  }

  async canManage(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('share_manage', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /** The current invite link for a trip, or null if none exists. */
  async get(tripId: string | number): Promise<TripInviteInfo | null> {
    const row = await this.tripInviteTokens.findInfoByTrip(tripId);
    return row ? { token: row.token, expires_at: row.expires_at, created_at: row.created_at } : null;
  }

  /**
   * Create the trip's invite link, or rotate it to a fresh token (there is only
   * ever one row per trip). An optional expiry (days) can bound the link's life.
   */
  async createOrRotate(
    tripId: string | number,
    createdBy: number,
    expiresInDays?: number | null,
  ): Promise<TripInviteInfo> {
    const token = crypto.randomBytes(24).toString('base64url');
    // Any non-positive/absent value (0, negatives, NaN, null, undefined) means
    // "no expiry" — deliberate: the UI sends null when no bound was chosen.
    const expiresAt =
      expiresInDays && expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;

    // Probe + write + re-select are one atomic unit so a concurrent rotation
    // can't interleave between them (the trip_id UNIQUE constraint would turn
    // that into a spurious 500).
    return await this.uow.transactional(async () => {
      const existing = await this.tripInviteTokens.existsForTrip(tripId);
      if (existing) {
        await this.tripInviteTokens.updateForTrip(tripId, { token, expires_at: expiresAt, created_by: createdBy });
      } else {
        await this.tripInviteTokens.insertForTrip({
          trip_id: tripId,
          token,
          created_by: createdBy,
          expires_at: expiresAt,
        });
      }
      return (await this.get(tripId))!;
    });
  }

  /** Remove the trip's invite link entirely (disable). */
  async remove(tripId: string | number): Promise<void> {
    await this.tripInviteTokens.deleteByTrip(tripId);
  }

  /**
   * Resolve an invite token to its (still-existing, unexpired) trip. Returns null
   * for unknown/expired tokens. Only ever called for an authenticated user, so the
   * trip title is safe to return for the join confirmation screen; an anonymous
   * caller never reaches this (the endpoint is JWT-guarded).
   */
  async resolve(token: string): Promise<{ trip_id: number; title: string } | null> {
    const row = await this.tripInviteTokens.resolveTokenToTrip(token);
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
  async join(tripId: number, userId: number) {
    return await this.membership.joinTripAsMember(tripId, userId, null);
  }
}
