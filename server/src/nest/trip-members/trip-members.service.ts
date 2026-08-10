import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import type { User } from '../../types';
import { avatarUrl } from '../common/avatarUrl';
import { UserCleanupService } from '../auth/user-cleanup.service';
import { BudgetService } from '../budget/budget.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TRIP_SELECT } from '../trips/trips.service';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { emitUserDeleted } from '../../plugin-user-lifecycle';
import { NotFoundError, ValidationError } from '../common/domain-errors';

export interface AddMemberResult {
  member: { id: number; username: string; email: string; avatar?: string | null; role: string; avatar_url: string | null };
  targetUserId: number;
  tripTitle: string;
}

export interface TransferOwnershipResult {
  tripTitle: string;
  fromEmail: string;
  toEmail: string;
}

// ── Guest members (#1362) ───────────────────────────────
//
// A guest is a credential-less users row (is_guest=1) joined into trip_members, so
// it is assignable everywhere a real member is (budget splits, packing, to-dos, day
// participants) yet can never authenticate (the auth/global-list guards exclude
// is_guest=1). The display name lives in users.username so every existing JOIN that
// renders a member name shows the guest correctly; a synthetic, non-deliverable
// email keeps the UNIQUE/NOT NULL constraints satisfied.

export interface GuestMember {
  id: number;
  username: string;
  email: string;
  role: 'member';
  is_guest: true;
  avatar_url: null;
}

/**
 * Who is on a trip: real members, the owner handover, and the credential-less
 * guests (#1362).
 *
 * Its own domain because it was one of three places that could put somebody on
 * a trip, and because it is the reason TripsService reached for the auth and
 * budget domains at all: deleting a guest erases their plugin data and re-splits
 * the expenses they were part of.
 *
 * NOT the same module as trip-membership/. That one is a deliberate leaf with no
 * imports, and AuthModule imports it — so it can never depend on auth or budget
 * without closing a cycle. This module is a sink: it imports both and nothing
 * imports it back except trips.
 */
@Injectable()
export class TripMembersService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly budget: BudgetService,
    private readonly userCleanup: UserCleanupService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  private get db() {
    return this.dbs.connection;
  }

  canAccessTrip(tripId: string | number, userId: number) {
    return this.dbs.canAccessTrip(tripId, userId) as { user_id: number } | null | undefined;
  }

  can(action: string, role: string, ownerId: number | null, userId: number, isMember: boolean): boolean {
    return this.permissions.checkPermission(action, role, ownerId, userId, isMember);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /** The trip in list shape, for the re-read a handover broadcasts. Same query the
   *  trip routes use, imported rather than copied so the two cannot drift. */
  getTripForViewer(tripId: string | number, userId: number) {
    return this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId });
  }

  /** Fire-and-forget trip-invite notification (mirrors the route's dynamic import). */
  notifyInvite(tripId: string, actor: User, targetUserId: number, tripTitle: string, inviteeEmail: string): void {
    import('../notifications/notifications.bridge').then(({ send }) => {
      send({
        event: 'trip_invite',
        actorId: actor.id,
        scope: 'user',
        targetId: targetUserId,
        params: { trip: tripTitle, actor: actor.email, invitee: inviteeEmail, tripId: String(tripId) },
      }).catch(() => {});
    });
  }

  // ── Members ───────────────────────────────────────────────────────────────

  listMembers(tripId: string | number, tripOwnerId: number) {
    // u.is_guest rides along (#1362) so guests stay assignable everywhere a member is,
    // while the UI can badge them and suppress owner-only actions. The owner is never a guest.
    const members = this.db.prepare(`
      SELECT u.id, COALESCE(u.display_name, u.username) AS username, u.email, u.avatar, u.is_guest,
        CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END as role,
        m.added_at,
        COALESCE(ib.display_name, ib.username) as invited_by_username
      FROM trip_members m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN users ib ON ib.id = m.invited_by
      WHERE m.trip_id = ?
      ORDER BY m.added_at ASC
    `).all(tripOwnerId, tripId) as { id: number; username: string; email: string; avatar: string | null; is_guest: number; role: string; added_at: string; invited_by_username: string | null }[];

    // Quirk fix on top of the 1:1 move: the owner row prefers display_name like
    // every member row does (the legacy query read the raw username only).
    const owner = this.db.prepare('SELECT id, COALESCE(display_name, username) AS username, email, avatar FROM users WHERE id = ?').get(tripOwnerId) as Pick<User, 'id' | 'username' | 'email' | 'avatar'>;

    return {
      owner: { ...owner, role: 'owner', is_guest: false, avatar_url: avatarUrl(owner) },
      members: members.map(m => ({ ...m, is_guest: !!m.is_guest, avatar_url: avatarUrl(m) })),
    };
  }

  addMember(tripId: string | number, identifier: string, tripOwnerId: number, invitedByUserId: number): AddMemberResult {
    if (!identifier) throw new ValidationError('Email or username required');

    // Guests (#1362) are not invitable accounts — exclude them so a trip-scoped guest
    // can never be resolved (and re-attached to another trip) through the invite box.
    const target = this.db.prepare(
      'SELECT id, username, email, avatar FROM users WHERE (email = ? OR username = ?) AND COALESCE(is_guest, 0) = 0'
    ).get(identifier.trim(), identifier.trim()) as Pick<User, 'id' | 'username' | 'email' | 'avatar'> | undefined;

    if (!target) throw new NotFoundError('User not found');

    if (target.id === tripOwnerId)
      throw new ValidationError('Trip owner is already a member');

    const existing = this.db.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(tripId, target.id);
    if (existing) throw new ValidationError('User already has access');

    this.db.prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(tripId, target.id, invitedByUserId);

    const tripInfo = this.db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;

    return {
      member: { ...target, role: 'member', avatar_url: avatarUrl(target) },
      targetUserId: target.id,
      tripTitle: tripInfo?.title || 'Untitled',
    };
  }

  removeMember(tripId: string | number, targetUserId: number): void {
    this.db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(tripId, targetUserId);
  }

  /**
   * Hand a trip over to one of its existing members (#973). The new owner must
   * already be a member; afterwards they hold `trips.user_id` and the former owner
   * becomes a regular member, so nobody loses access. Runs in a transaction so the
   * owner pointer and the membership rows never diverge.
   */
  transferOwnership(
    tripId: string | number,
    newOwnerId: number,
    currentOwnerId: number,
  ): TransferOwnershipResult {
    const trip = this.db.prepare('SELECT id, title, user_id FROM trips WHERE id = ?').get(tripId) as { id: number; title: string; user_id: number } | undefined;
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.user_id !== currentOwnerId) throw new ValidationError('Only the owner can transfer ownership');
    if (newOwnerId === currentOwnerId) throw new ValidationError('You already own this trip');

    const newOwner = this.db.prepare('SELECT id, email, is_guest FROM users WHERE id = ?').get(newOwnerId) as { id: number; email: string; is_guest?: number } | undefined;
    if (!newOwner) throw new NotFoundError('User not found');
    // A guest (#1362) can never log in, so it must never become the owner of a trip.
    if (newOwner.is_guest) throw new ValidationError('Cannot transfer ownership to a guest');

    const isMember = this.db.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(tripId, newOwnerId);
    if (!isMember) throw new ValidationError('New owner must be a trip member');

    const fromEmail = (this.db.prepare('SELECT email FROM users WHERE id = ?').get(currentOwnerId) as { email: string } | undefined)?.email || '';

    const run = this.db.transaction(() => {
      this.db.prepare('UPDATE trips SET user_id = ? WHERE id = ?').run(newOwnerId, tripId);
      // The new owner is no longer a plain member…
      this.db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(tripId, newOwnerId);
      // …and the former owner keeps access as a member.
      this.db.prepare('INSERT OR IGNORE INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(tripId, currentOwnerId, newOwnerId);
    });
    run();

    return { tripTitle: trip.title, fromEmail, toEmail: newOwner.email };
  }

  // ── Guest members (#1362) ───────────────────────────────────────────────────

  /** username is UNIQUE across all users — keep the typed name but disambiguate guests
   *  that happen to share it (e.g. two "Anna"s) with a numeric suffix. */
  createGuest(tripId: string | number, name: string, invitedByUserId: number): { member: GuestMember } {
    const display = (name || '').trim();
    if (!display) throw new ValidationError('Guest name is required');
    if (display.length > 50) throw new ValidationError('Guest name must be 50 characters or fewer');

    // The human name lives in display_name (not unique — two trips can each have a
    // "Jake", #1446); username is a uuid handle only for the UNIQUE constraint and is
    // never shown (member views COALESCE display_name over it).
    const email = `guest-${randomUUID()}@guests.invalid`;
    const username = `guest-${randomUUID()}`;

    const create = this.db.transaction(() => {
      const res = this.db.prepare(
        "INSERT INTO users (username, email, password_hash, role, is_guest, display_name) VALUES (?, ?, '', 'user', 1, ?)"
      ).run(username, email, display);
      const guestId = Number(res.lastInsertRowid);
      this.db.prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(tripId, guestId, invitedByUserId);
      return guestId;
    });
    const guestId = create();

    return { member: { id: guestId, username: display, email, role: 'member', is_guest: true, avatar_url: null } };
  }

  /** Confirms a user id is a guest of THIS trip, so guest mutations stay trip-scoped. */
  private guestOfTrip(tripId: string | number, guestUserId: number): boolean {
    return !!this.db.prepare(
      'SELECT u.id FROM users u JOIN trip_members m ON m.user_id = u.id WHERE u.id = ? AND m.trip_id = ? AND u.is_guest = 1'
    ).get(guestUserId, tripId);
  }

  renameGuest(tripId: string | number, guestUserId: number, name: string): boolean {
    const display = (name || '').trim();
    if (!display) throw new ValidationError('Guest name is required');
    if (display.length > 50) throw new ValidationError('Guest name must be 50 characters or fewer');
    if (!this.guestOfTrip(tripId, guestUserId)) return false;

    // Rename only the display name — no global-uniqueness dedup, so a rename to a name
    // another trip's guest already uses no longer produces "Name 2" (#1446).
    this.db.prepare('UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_guest = 1').run(display, guestUserId);
    return true;
  }

  deleteGuest(tripId: string | number, guestUserId: number): boolean {
    if (!this.guestOfTrip(tripId, guestUserId)) return false;
    // A guest is still a user id a plugin may hold data for, so erase that too — the
    // host-side per-user tables + a durable own-db erasure per granted plugin — exactly
    // like a full account deletion (otherwise a deleted guest's plugin data lingers).
    this.userCleanup.erasePluginUserData(guestUserId);
    // Quirk fix on top of the 1:1 move: the budget re-split and the user delete
    // run in one transaction, so a failure mid-flow can't leave the expense
    // divisors re-derived for a guest that still exists (or vice versa). The
    // plugin-side erasure/notification keep their order around it.
    this.db.transaction(() => {
      // Re-split the expenses they were part of before the cascade takes their member
      // rows away — the divisor is denormalized and cannot follow a foreign key (#1553).
      this.budget.removeUserFromBudgetItems(guestUserId);
      // Deleting the guest's users row cascades its membership and every assignment join
      // (trip_members, budget/packing/assignment links) via the ON DELETE foreign keys.
      this.db.prepare('DELETE FROM users WHERE id = ? AND is_guest = 1').run(guestUserId);
    })();
    emitUserDeleted(guestUserId); // deliver the erasure to any active plugin now
    return true;
  }
}
