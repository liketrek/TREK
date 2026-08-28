import { emitUserDeleted } from '../../plugin-user-lifecycle';
import type { User } from '../../types';
import { UserCleanupService } from '../auth/user-cleanup.service';
import { BudgetService } from '../budget/budget.service';
import { avatarUrl } from '../common/avatarUrl';
import { NotFoundError, ValidationError } from '../common/domain-errors';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TRIP_SELECT } from '../trips/trips.service';
import { Injectable } from '@nestjs/common';
import {
  TICKET_NOTE_PREFIX,
  ticketPayloadSchema,
  type GuestIdentityTransferCandidate,
  type GuestIdentityTransferConflict,
  type GuestIdentityTransferImpact,
  type GuestIdentityTransferResponse,
  type NewMemberIdentityCheckCompletionResponse,
  type TicketPayload,
  type TrekWsPayload,
  type TrekWsTripEventName,
} from '@trek/shared';

import { randomUUID } from 'crypto';

export interface AddMemberResult {
  member: {
    id: number;
    username: string;
    email: string;
    avatar?: string | null;
    role: string;
    avatar_url: string | null;
  };
  targetUserId: number;
  tripTitle: string;
}

export interface TransferOwnershipResult {
  tripTitle: string;
  fromEmail: string;
  toEmail: string;
}

export type GuestIdentityTransferCode =
  | 'GUEST_IDENTITY_TRANSFER_CONFLICT'
  | 'GUEST_ALREADY_TRANSFERRED'
  | 'GUEST_IDENTITY_TRANSFER_FORBIDDEN';

export class GuestIdentityTransferError extends Error {
  constructor(
    public readonly code: GuestIdentityTransferCode,
    message: string,
    public readonly conflicts: GuestIdentityTransferConflict[] = [],
  ) {
    super(message);
    this.name = 'GuestIdentityTransferError';
  }
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
    private readonly notifications: NotificationsService,
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

  broadcast<E extends TrekWsTripEventName>(
    tripId: string,
    event: E,
    payload: TrekWsPayload<E>,
    socketId: string | undefined,
  ): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /** The trip in list shape, for the re-read a handover broadcasts. Same query the
   *  trip routes use, imported rather than copied so the two cannot drift. */
  getTripForViewer(tripId: string | number, userId: number) {
    return this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId });
  }

  /** Fire-and-forget trip-invite notification (mirrors the route's dynamic import). */
  notifyInvite(tripId: string, actor: User, targetUserId: number, tripTitle: string, inviteeEmail: string): void {
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    this.notifications
      .send({
        event: 'trip_invite',
        actorId: actor.id,
        scope: 'user',
        targetId: targetUserId,
        params: { trip: tripTitle, actor: actor.email, invitee: inviteeEmail, tripId: String(tripId) },
      })
      .catch(() => {});
  }

  // ── Members ───────────────────────────────────────────────────────────────

  listMembers(tripId: string | number, tripOwnerId: number) {
    // u.is_guest rides along (#1362) so guests stay assignable everywhere a member is,
    // while the UI can badge them and suppress owner-only actions. The owner is never a guest.
    const members = this.db
      .prepare(
        `
      SELECT u.id, COALESCE(u.display_name, u.username) AS username, u.email, u.avatar, u.is_guest,
        CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END as role,
        m.added_at,
        COALESCE(ib.display_name, ib.username) as invited_by_username
      FROM trip_members m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN users ib ON ib.id = m.invited_by
      WHERE m.trip_id = ?
      ORDER BY m.added_at ASC
    `,
      )
      .all(tripOwnerId, tripId) as {
      id: number;
      username: string;
      email: string;
      avatar: string | null;
      is_guest: number;
      role: string;
      added_at: string;
      invited_by_username: string | null;
    }[];

    // Quirk fix on top of the 1:1 move: the owner row prefers display_name like
    // every member row does (the legacy query read the raw username only).
    const owner = this.db
      .prepare('SELECT id, COALESCE(display_name, username) AS username, email, avatar FROM users WHERE id = ?')
      .get(tripOwnerId) as Pick<User, 'id' | 'username' | 'email' | 'avatar'>;

    return {
      owner: { ...owner, role: 'owner', is_guest: false, avatar_url: avatarUrl(owner) },
      members: members.map((m) => ({ ...m, is_guest: !!m.is_guest, avatar_url: avatarUrl(m) })),
    };
  }

  addMember(
    tripId: string | number,
    identifier: string,
    tripOwnerId: number,
    invitedByUserId: number,
  ): AddMemberResult {
    if (!identifier) throw new ValidationError('Email or username required');

    // Guests (#1362) are not invitable accounts — exclude them so a trip-scoped guest
    // can never be resolved (and re-attached to another trip) through the invite box.
    const target = this.db
      .prepare(
        'SELECT id, username, email, avatar FROM users WHERE (email = ? OR username = ?) AND COALESCE(is_guest, 0) = 0',
      )
      .get(identifier.trim(), identifier.trim()) as Pick<User, 'id' | 'username' | 'email' | 'avatar'> | undefined;

    if (!target) throw new NotFoundError('User not found');

    if (target.id === tripOwnerId) throw new ValidationError('Trip owner is already a member');

    const existing = this.db
      .prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(tripId, target.id);
    if (existing) throw new ValidationError('User already has access');

    this.db
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(tripId, target.id, invitedByUserId);

    const tripInfo = this.db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as
      | { title: string }
      | undefined;

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
  transferOwnership(tripId: string | number, newOwnerId: number, currentOwnerId: number): TransferOwnershipResult {
    const trip = this.db.prepare('SELECT id, title, user_id FROM trips WHERE id = ?').get(tripId) as
      | { id: number; title: string; user_id: number }
      | undefined;
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.user_id !== currentOwnerId) throw new ValidationError('Only the owner can transfer ownership');
    if (newOwnerId === currentOwnerId) throw new ValidationError('You already own this trip');

    const newOwner = this.db.prepare('SELECT id, email, is_guest FROM users WHERE id = ?').get(newOwnerId) as
      | { id: number; email: string; is_guest?: number }
      | undefined;
    if (!newOwner) throw new NotFoundError('User not found');
    // A guest (#1362) can never log in, so it must never become the owner of a trip.
    if (newOwner.is_guest) throw new ValidationError('Cannot transfer ownership to a guest');

    const isMember = this.db
      .prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(tripId, newOwnerId);
    if (!isMember) throw new ValidationError('New owner must be a trip member');

    const fromEmail =
      (this.db.prepare('SELECT email FROM users WHERE id = ?').get(currentOwnerId) as { email: string } | undefined)
        ?.email || '';

    const run = this.db.transaction(() => {
      this.db.prepare('UPDATE trips SET user_id = ? WHERE id = ?').run(newOwnerId, tripId);
      // The new owner is no longer a plain member…
      this.db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(tripId, newOwnerId);
      // …and the former owner keeps access as a member.
      this.db
        .prepare(
          `INSERT OR IGNORE INTO trip_members
           (trip_id, user_id, invited_by, new_member_identity_check_completed_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .run(tripId, currentOwnerId, newOwnerId);
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
      const res = this.db
        .prepare(
          "INSERT INTO users (username, email, password_hash, role, is_guest, display_name) VALUES (?, ?, '', 'user', 1, ?)",
        )
        .run(username, email, display);
      const guestId = Number(res.lastInsertRowid);
      this.db
        .prepare(
          `INSERT INTO trip_members
           (trip_id, user_id, invited_by, new_member_identity_check_completed_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .run(tripId, guestId, invitedByUserId);
      return guestId;
    });
    const guestId = create();

    return { member: { id: guestId, username: display, email, role: 'member', is_guest: true, avatar_url: null } };
  }

  /** Confirms a user id is a guest of THIS trip, so guest mutations stay trip-scoped. */
  private guestOfTrip(tripId: string | number, guestUserId: number): boolean {
    return !!this.db
      .prepare(
        'SELECT u.id FROM users u JOIN trip_members m ON m.user_id = u.id WHERE u.id = ? AND m.trip_id = ? AND u.is_guest = 1',
      )
      .get(guestUserId, tripId);
  }

  renameGuest(tripId: string | number, guestUserId: number, name: string): boolean {
    const display = (name || '').trim();
    if (!display) throw new ValidationError('Guest name is required');
    if (display.length > 50) throw new ValidationError('Guest name must be 50 characters or fewer');
    if (!this.guestOfTrip(tripId, guestUserId)) return false;

    // Rename only the display name — no global-uniqueness dedup, so a rename to a name
    // another trip's guest already uses no longer produces "Name 2" (#1446).
    this.db
      .prepare('UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_guest = 1')
      .run(display, guestUserId);
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

  // ── New-member identity checks and Guest identity transfers ─────────────

  private requireIdentityTransferMember(tripId: string | number, userId: number): void {
    const trip = this.db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as
      | { user_id: number }
      | undefined;
    const member = this.db
      .prepare(
        `SELECT tm.id FROM trip_members tm JOIN users u ON u.id = tm.user_id
       WHERE tm.trip_id = ? AND tm.user_id = ? AND COALESCE(u.is_guest, 0) = 0`,
      )
      .get(tripId, userId);
    if (!trip || trip.user_id === userId || !member) {
      throw new GuestIdentityTransferError(
        'GUEST_IDENTITY_TRANSFER_FORBIDDEN',
        'Only non-owner account members can transfer Guest identities',
      );
    }
  }

  private scalarCount(sql: string, ...params: Array<string | number>): number {
    return Number((this.db.prepare(sql).get(...params) as { n: number } | undefined)?.n ?? 0);
  }

  private parseTicket(row: { note: string | null; ticket_json: string | null }): {
    present: boolean;
    payload: TicketPayload | null;
    storage: 'ticket_json' | 'note' | null;
  } {
    const raw =
      row.ticket_json || (row.note?.startsWith(TICKET_NOTE_PREFIX) ? row.note.slice(TICKET_NOTE_PREFIX.length) : null);
    if (!raw) return { present: false, payload: null, storage: null };
    try {
      const parsed = ticketPayloadSchema.safeParse(JSON.parse(raw));
      return {
        present: true,
        payload: parsed.success ? parsed.data : null,
        storage: row.ticket_json ? 'ticket_json' : 'note',
      };
    } catch {
      return { present: true, payload: null, storage: row.ticket_json ? 'ticket_json' : 'note' };
    }
  }

  private guestIdentityTransferPreview(
    tripId: string | number,
    guestUserId: number,
    accountMemberUserId: number,
  ): GuestIdentityTransferCandidate {
    const guest = this.db
      .prepare(
        `SELECT u.id, COALESCE(u.display_name, u.username) AS name
       FROM users u JOIN trip_members tm ON tm.user_id = u.id
       WHERE u.id = ? AND tm.trip_id = ? AND u.is_guest = 1`,
      )
      .get(guestUserId, tripId) as { id: number; name: string } | undefined;
    if (!guest) {
      const existingGuest = this.db.prepare('SELECT id FROM users WHERE id = ? AND is_guest = 1').get(guestUserId);
      if (existingGuest) {
        throw new GuestIdentityTransferError('GUEST_IDENTITY_TRANSFER_FORBIDDEN', 'Guest does not belong to this trip');
      }
      throw new GuestIdentityTransferError('GUEST_ALREADY_TRANSFERRED', 'Guest identity has already been transferred');
    }

    const conflicts: GuestIdentityTransferConflict[] = [];
    const addConflict = (type: GuestIdentityTransferConflict['type'], recordId: number): void => {
      if (!conflicts.some((conflict) => conflict.type === type && conflict.record_id === recordId)) {
        conflicts.push({ type, record_id: recordId });
      }
    };
    const expenseIds = new Set<number>();

    const shareOverlap = this.db
      .prepare(
        `SELECT bi.id FROM budget_items bi
       WHERE bi.trip_id = ?
         AND EXISTS (SELECT 1 FROM budget_item_members x WHERE x.budget_item_id = bi.id AND x.user_id = ?)
         AND EXISTS (SELECT 1 FROM budget_item_members x WHERE x.budget_item_id = bi.id AND x.user_id = ?)`,
      )
      .all(tripId, guestUserId, accountMemberUserId) as Array<{ id: number }>;
    shareOverlap.forEach((row) => addConflict('expense_share_overlap', row.id));

    const financialRows = this.db
      .prepare(
        `SELECT bi.id, bi.note, bi.ticket_json, bi.paid_by_user_id
       FROM budget_items bi
       WHERE bi.trip_id = ? AND (
         bi.paid_by_user_id = ? OR
         EXISTS (SELECT 1 FROM budget_item_members bim WHERE bim.budget_item_id = bi.id AND bim.user_id = ?) OR
         EXISTS (SELECT 1 FROM budget_item_payers bip WHERE bip.budget_item_id = bi.id AND bip.user_id = ?) OR
         bi.ticket_json IS NOT NULL OR bi.note GLOB 'TICKETJSON:*'
       )`,
      )
      .all(tripId, guestUserId, guestUserId, guestUserId) as Array<{
      id: number;
      note: string | null;
      ticket_json: string | null;
      paid_by_user_id: number | null;
    }>;

    for (const row of financialRows) {
      const guestPays =
        row.paid_by_user_id === guestUserId ||
        !!this.db
          .prepare('SELECT 1 FROM budget_item_payers WHERE budget_item_id = ? AND user_id = ?')
          .get(row.id, guestUserId);
      const memberPays =
        row.paid_by_user_id === accountMemberUserId ||
        !!this.db
          .prepare('SELECT 1 FROM budget_item_payers WHERE budget_item_id = ? AND user_id = ?')
          .get(row.id, accountMemberUserId);
      const guestShares = !!this.db
        .prepare('SELECT 1 FROM budget_item_members WHERE budget_item_id = ? AND user_id = ?')
        .get(row.id, guestUserId);
      if (guestPays || guestShares) expenseIds.add(row.id);
      if (guestPays && memberPays) addConflict('expense_payer_overlap', row.id);

      const ticket = this.parseTicket(row);
      if (!ticket.present) continue;
      if (!ticket.payload) {
        if (guestPays || guestShares) addConflict('invalid_ticket_json', row.id);
        continue;
      }
      for (const item of ticket.payload.items) {
        if (!item.parts.includes(guestUserId)) continue;
        expenseIds.add(row.id);
        if (item.parts.includes(accountMemberUserId)) addConflict('ticket_participant_overlap', row.id);
      }
    }

    const settlements = this.db
      .prepare(
        `SELECT id, from_user_id, to_user_id FROM budget_settlements
       WHERE trip_id = ? AND (from_user_id = ? OR to_user_id = ?)`,
      )
      .all(tripId, guestUserId, guestUserId) as Array<{
      id: number;
      from_user_id: number;
      to_user_id: number;
    }>;
    for (const row of settlements) {
      if (
        (row.from_user_id === guestUserId && row.to_user_id === accountMemberUserId) ||
        (row.to_user_id === guestUserId && row.from_user_id === accountMemberUserId) ||
        (row.from_user_id === guestUserId && row.to_user_id === guestUserId)
      )
        addConflict('settlement_self_payment', row.id);
    }

    const ratings = this.scalarCount(
      `SELECT COUNT(*) AS n FROM place_ratings pr JOIN places p ON p.id = pr.place_id
       WHERE p.trip_id = ? AND pr.user_id = ?`,
      tripId,
      guestUserId,
    );
    const ratingOverlaps = this.scalarCount(
      `SELECT COUNT(*) AS n FROM place_ratings guest_rating
       JOIN places p ON p.id = guest_rating.place_id
       WHERE p.trip_id = ? AND guest_rating.user_id = ?
         AND EXISTS (SELECT 1 FROM place_ratings member_rating
                     WHERE member_rating.place_id = guest_rating.place_id AND member_rating.user_id = ?)`,
      tripId,
      guestUserId,
      accountMemberUserId,
    );

    const impact: GuestIdentityTransferImpact = {
      expenses: expenseIds.size,
      payments: settlements.length,
      itinerary: this.scalarCount(
        `SELECT COUNT(DISTINCT ap.assignment_id) AS n FROM assignment_participants ap
         JOIN day_assignments da ON da.id = ap.assignment_id JOIN days d ON d.id = da.day_id
         WHERE d.trip_id = ? AND ap.user_id = ?`,
        tripId,
        guestUserId,
      ),
      bookings: this.scalarCount(
        `SELECT COUNT(*) AS n FROM reservation_travelers rt
         JOIN reservations r ON r.id = rt.reservation_id
         WHERE r.trip_id = ? AND rt.user_id = ?`,
        tripId,
        guestUserId,
      ),
      todos:
        this.scalarCount(
          'SELECT COUNT(*) AS n FROM todo_items WHERE trip_id = ? AND assigned_user_id = ?',
          tripId,
          guestUserId,
        ) +
        this.scalarCount(
          'SELECT COUNT(*) AS n FROM todo_category_assignees WHERE trip_id = ? AND user_id = ?',
          tripId,
          guestUserId,
        ),
      packing: this.scalarCount(
        `SELECT COUNT(*) AS n FROM (
           SELECT 'item:' || pi.id AS record FROM packing_items pi
            WHERE pi.trip_id = ? AND (pi.owner_id = ?
              OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = pi.id AND r.user_id = ?)
              OR EXISTS (SELECT 1 FROM packing_item_contributors c WHERE c.item_id = pi.id AND c.user_id = ?))
           UNION SELECT 'category:' || category_name FROM packing_category_assignees
            WHERE trip_id = ? AND user_id = ?
           UNION SELECT 'bag:' || pb.id FROM packing_bags pb WHERE pb.trip_id = ? AND (pb.user_id = ?
              OR EXISTS (SELECT 1 FROM packing_bag_members bm WHERE bm.bag_id = pb.id AND bm.user_id = ?))
         )`,
        tripId,
        guestUserId,
        guestUserId,
        guestUserId,
        tripId,
        guestUserId,
        tripId,
        guestUserId,
        guestUserId,
      ),
      ratings,
      rating_overlaps: ratingOverlaps,
    };
    return { guest_user_id: guest.id, name: guest.name, impact, conflicts };
  }

  listGuestIdentityTransferCandidates(
    tripId: string | number,
    accountMemberUserId: number,
  ): GuestIdentityTransferCandidate[] {
    this.requireIdentityTransferMember(tripId, accountMemberUserId);
    const guests = this.db
      .prepare(
        `SELECT u.id FROM users u JOIN trip_members tm ON tm.user_id = u.id
       WHERE tm.trip_id = ? AND u.is_guest = 1 ORDER BY tm.added_at, u.id`,
      )
      .all(tripId) as Array<{ id: number }>;
    return guests.map((guest) => this.guestIdentityTransferPreview(tripId, guest.id, accountMemberUserId));
  }

  runNewMemberIdentityCheck(
    tripId: string | number,
    accountMemberUserId: number,
  ): { required: boolean; candidates: GuestIdentityTransferCandidate[] } {
    return this.dbs.transaction(() => {
      this.requireIdentityTransferMember(tripId, accountMemberUserId);
      const membership = this.dbs.get<{ completedAt: string | null }>(
        `SELECT new_member_identity_check_completed_at AS completedAt
         FROM trip_members WHERE trip_id = ? AND user_id = ?`,
        tripId,
        accountMemberUserId,
      );
      if (membership?.completedAt) return { required: false, candidates: [] };
      const candidates = this.listGuestIdentityTransferCandidates(tripId, accountMemberUserId);
      if (candidates.length > 0) return { required: true, candidates };
      this.completeNewMemberIdentityCheck(tripId, accountMemberUserId);
      return { required: false, candidates: [] };
    });
  }

  completeNewMemberIdentityCheck(
    tripId: string | number,
    accountMemberUserId: number,
  ): NewMemberIdentityCheckCompletionResponse {
    this.requireIdentityTransferMember(tripId, accountMemberUserId);
    this.dbs.run(
      `UPDATE trip_members SET new_member_identity_check_completed_at = CURRENT_TIMESTAMP
       WHERE trip_id = ? AND user_id = ? AND new_member_identity_check_completed_at IS NULL`,
      tripId,
      accountMemberUserId,
    );
    return { success: true };
  }

  private mergeScopedJoin(
    table: string,
    parentColumn: string,
    scopedParentSql: string,
    tripId: string | number,
    guestUserId: number,
    accountMemberUserId: number,
  ): void {
    this.db
      .prepare(
        `DELETE FROM ${table} AS guest_row
       WHERE guest_row.user_id = ? AND guest_row.${parentColumn} IN (${scopedParentSql})
         AND EXISTS (SELECT 1 FROM ${table} target_row
                     WHERE target_row.${parentColumn} = guest_row.${parentColumn} AND target_row.user_id = ?)`,
      )
      .run(guestUserId, tripId, accountMemberUserId);
    this.db
      .prepare(
        `UPDATE ${table} SET user_id = ?
       WHERE user_id = ? AND ${parentColumn} IN (${scopedParentSql})`,
      )
      .run(accountMemberUserId, guestUserId, tripId);
  }

  transferGuestIdentity(
    tripId: string | number,
    guestUserId: number,
    accountMemberUserId: number,
  ): GuestIdentityTransferResponse {
    const result = this.dbs.transaction(() => {
      this.requireIdentityTransferMember(tripId, accountMemberUserId);
      const preview = this.guestIdentityTransferPreview(tripId, guestUserId, accountMemberUserId);
      if (preview.conflicts.length > 0) {
        throw new GuestIdentityTransferError(
          'GUEST_IDENTITY_TRANSFER_CONFLICT',
          'Guest identity transfer has conflicting financial records',
          preview.conflicts,
        );
      }

      this.dbs.run(
        `UPDATE budget_item_members SET user_id = ? WHERE user_id = ?
         AND budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)`,
        accountMemberUserId,
        guestUserId,
        tripId,
      );
      this.dbs.run(
        `UPDATE budget_item_payers SET user_id = ? WHERE user_id = ?
         AND budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)`,
        accountMemberUserId,
        guestUserId,
        tripId,
      );
      this.dbs.run(
        'UPDATE budget_items SET paid_by_user_id = ? WHERE trip_id = ? AND paid_by_user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.dbs.run(
        'UPDATE budget_settlements SET from_user_id = ? WHERE trip_id = ? AND from_user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.dbs.run(
        'UPDATE budget_settlements SET to_user_id = ? WHERE trip_id = ? AND to_user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );

      const tickets = this.dbs.all<{ id: number; note: string | null; ticket_json: string | null }>(
        `SELECT id, note, ticket_json FROM budget_items
         WHERE trip_id = ? AND (ticket_json IS NOT NULL OR note GLOB 'TICKETJSON:*')`,
        tripId,
      );
      for (const row of tickets) {
        const ticket = this.parseTicket(row);
        if (!ticket.payload || !ticket.storage) continue;
        let changed = false;
        for (const item of ticket.payload.items) {
          item.parts = item.parts.map((id) => {
            if (id !== guestUserId) return id;
            changed = true;
            return accountMemberUserId;
          });
        }
        if (!changed) continue;
        const json = JSON.stringify(ticket.payload);
        if (ticket.storage === 'ticket_json')
          this.dbs.run('UPDATE budget_items SET ticket_json = ? WHERE id = ?', json, row.id);
        else this.dbs.run('UPDATE budget_items SET note = ? WHERE id = ?', `${TICKET_NOTE_PREFIX}${json}`, row.id);
      }

      this.mergeScopedJoin(
        'assignment_participants',
        'assignment_id',
        'SELECT da.id FROM day_assignments da JOIN days d ON d.id = da.day_id WHERE d.trip_id = ?',
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.mergeScopedJoin(
        'reservation_travelers',
        'reservation_id',
        'SELECT id FROM reservations WHERE trip_id = ?',
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.dbs.run(
        `DELETE FROM todo_category_assignees AS guest_row
         WHERE guest_row.trip_id = ? AND guest_row.user_id = ?
           AND EXISTS (SELECT 1 FROM todo_category_assignees target_row
                       WHERE target_row.trip_id = guest_row.trip_id
                         AND target_row.category_name = guest_row.category_name AND target_row.user_id = ?)`,
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.dbs.run(
        'UPDATE todo_category_assignees SET user_id = ? WHERE trip_id = ? AND user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.dbs.run(
        'UPDATE todo_items SET assigned_user_id = ? WHERE trip_id = ? AND assigned_user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.dbs.run(
        `DELETE FROM packing_category_assignees AS guest_row
         WHERE guest_row.trip_id = ? AND guest_row.user_id = ?
           AND EXISTS (SELECT 1 FROM packing_category_assignees target_row
                       WHERE target_row.trip_id = guest_row.trip_id
                         AND target_row.category_name = guest_row.category_name AND target_row.user_id = ?)`,
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.dbs.run(
        'UPDATE packing_category_assignees SET user_id = ? WHERE trip_id = ? AND user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.mergeScopedJoin(
        'packing_bag_members',
        'bag_id',
        'SELECT id FROM packing_bags WHERE trip_id = ?',
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.mergeScopedJoin(
        'packing_item_recipients',
        'item_id',
        'SELECT id FROM packing_items WHERE trip_id = ?',
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.mergeScopedJoin(
        'packing_item_contributors',
        'item_id',
        'SELECT id FROM packing_items WHERE trip_id = ?',
        tripId,
        guestUserId,
        accountMemberUserId,
      );
      this.dbs.run(
        'UPDATE packing_bags SET user_id = ? WHERE trip_id = ? AND user_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );
      this.dbs.run(
        'UPDATE packing_items SET owner_id = ? WHERE trip_id = ? AND owner_id = ?',
        accountMemberUserId,
        tripId,
        guestUserId,
      );

      // A signed-in member's explicit opinion wins over the duplicate Guest
      // rating; non-overlapping ratings move to the member identity.
      this.dbs.run(
        `DELETE FROM place_ratings AS guest_rating
         WHERE guest_rating.user_id = ?
           AND guest_rating.place_id IN (SELECT id FROM places WHERE trip_id = ?)
           AND EXISTS (SELECT 1 FROM place_ratings member_rating
                       WHERE member_rating.place_id = guest_rating.place_id AND member_rating.user_id = ?)`,
        guestUserId,
        tripId,
        accountMemberUserId,
      );
      this.dbs.run(
        `UPDATE place_ratings SET user_id = ?
         WHERE user_id = ? AND place_id IN (SELECT id FROM places WHERE trip_id = ?)`,
        accountMemberUserId,
        guestUserId,
        tripId,
      );

      this.userCleanup.erasePluginUserData(guestUserId);
      this.dbs.run('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?', tripId, guestUserId);
      const deleted = this.dbs.run('DELETE FROM users WHERE id = ? AND is_guest = 1', guestUserId);
      if (deleted.changes !== 1) {
        throw new GuestIdentityTransferError(
          'GUEST_ALREADY_TRANSFERRED',
          'Guest identity has already been transferred',
        );
      }
      this.completeNewMemberIdentityCheck(tripId, accountMemberUserId);
      return { success: true as const, transferred_guest_user_id: guestUserId, impact: preview.impact };
    });
    emitUserDeleted(guestUserId);
    return result;
  }
}
