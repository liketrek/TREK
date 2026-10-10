import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { emitUserDeleted } from '../../plugin-user-lifecycle';
import type { User } from '../../types';
import { UserCleanupService } from '../auth/user-cleanup.service';
import { BudgetService } from '../budget/budget.service';
import { avatarUrl } from '../common/avatarUrl';
import { NotFoundError, ValidationError } from '../common/domain-errors';
import { UnitOfWork } from '../database/unit-of-work';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';

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
    private readonly budget: BudgetService,
    private readonly userCleanup: UserCleanupService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
  ) {}

  async canAccessTrip(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    const access = await this.tripsRepo.findAccessible(tripId, userId);
    return access as { user_id: number } | null | undefined;
  }

  async can(action: string, role: string, ownerId: number | null, userId: number, isMember: boolean): Promise<boolean> {
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
   *  trip routes use, imported rather than copied so the two cannot drift.
   *  Plan 3c Task 7: repointed to `TripsRepository.findForViewer` — the
   *  SQL-side `NULL AS feed_token` blanking survives the move (Task 6
   *  review's "for Task 7" note): `findForViewer`'s row always carries
   *  `feed_token: null`, which is load-bearing for the `trip:updated`
   *  broadcast a transfer sends. */
  async getTripForViewer(tripId: string | number, userId: number) {
    return this.tripsRepo.findForViewer(tripId, userId);
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

  async listMembers(tripId: string | number, tripOwnerId: number) {
    // u.is_guest rides along (#1362) so guests stay assignable everywhere a member is,
    // while the UI can badge them and suppress owner-only actions. The owner is never a guest.
    const members = await this.tripMembersRepo.listWithUserAndInviter(tripId, tripOwnerId);

    // Quirk fix on top of the 1:1 move: the owner row prefers display_name like
    // every member row does (the legacy query read the raw username only).
    const owner = await this.usersRepo.findOwnerSummary(tripOwnerId);

    return {
      owner: { ...owner, role: 'owner', is_guest: false, avatar_url: avatarUrl(owner!) },
      members: members.map((m) => ({ ...m, is_guest: !!m.is_guest, avatar_url: avatarUrl(m) })),
    };
  }

  async addMember(
    tripId: string | number,
    identifier: string,
    tripOwnerId: number,
    invitedByUserId: number,
  ): Promise<AddMemberResult> {
    if (!identifier) throw new ValidationError('Email or username required');

    // Guests (#1362) are not invitable accounts — exclude them so a trip-scoped guest
    // can never be resolved (and re-attached to another trip) through the invite box.
    const target = await this.usersRepo.findInvitableByEmailOrUsername(identifier.trim());

    if (!target) throw new NotFoundError('User not found');

    if (target.id === tripOwnerId) throw new ValidationError('Trip owner is already a member');

    const existing = await this.tripMembersRepo.exists(tripId, target.id);
    if (existing) throw new ValidationError('User already has access');

    // `Number(tripId)`, not the raw string: `addMember`'s INSERT needs the
    // real `Primary<Trips>` type (its docstring). Safe here — `tripId` has
    // already matched a real trip through the controller's `TripAccessGuard`,
    // whose own `Number(tripId)` is the seam (Task 9 fix wave, A-L1: this
    // comment previously and wrongly called it a raw-bind/SQLite-affinity
    // check — a `Number()` seam is WIDER, since `Number('0x10')`/
    // `Number('1e1')` coerce to a real integer where SQLite's own text
    // affinity never converts a hex or exponent literal).
    await this.tripMembersRepo.addMember(Number(tripId), target.id, invitedByUserId);

    const tripTitle = await this.tripsRepo.getTitle(tripId);

    return {
      member: { ...target, role: 'member', avatar_url: avatarUrl(target) },
      targetUserId: target.id,
      tripTitle: tripTitle || 'Untitled',
    };
  }

  /**
   * `tripId: number` (Plan 4 Task 8a — narrowed from `string | number`):
   * every caller now passes an already-parsed id — `trips.rpc.ts`'s `num()`,
   * `trips.mcp.ts`'s Zod-typed tool input, and `TripMembersController
   * .removeMember`'s own `toRowId` parse (added alongside this narrowing,
   * the route's one remaining raw-string caller).
   */
  async removeMember(tripId: number, targetUserId: number): Promise<void> {
    await this.tripMembersRepo.remove(tripId, targetUserId);
  }

  /**
   * Hand a trip over to one of its existing members (#973). The new owner must
   * already be a member; afterwards they hold `trips.user_id` and the former owner
   * becomes a regular member, so nobody loses access. Runs in a transaction so the
   * owner pointer and the membership rows never diverge.
   */
  async transferOwnership(
    tripId: string | number,
    newOwnerId: number,
    currentOwnerId: number,
  ): Promise<TransferOwnershipResult> {
    const trip = await this.tripsRepo.findIdTitleOwner(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.user_id !== currentOwnerId) throw new ValidationError('Only the owner can transfer ownership');
    if (newOwnerId === currentOwnerId) throw new ValidationError('You already own this trip');

    const newOwner = await this.usersRepo.findIdEmailGuest(newOwnerId);
    if (!newOwner) throw new NotFoundError('User not found');
    // A guest (#1362) can never log in, so it must never become the owner of a trip.
    if (newOwner.is_guest) throw new ValidationError('Cannot transfer ownership to a guest');

    const isMember = await this.tripMembersRepo.exists(tripId, newOwnerId);
    if (!isMember) throw new ValidationError('New owner must be a trip member');

    const fromEmail = (await this.usersRepo.getEmail(currentOwnerId)) || '';

    // Task 9 fix wave (B-L4 / A-L1): all THREE writes below now take
    // `trip.id` — the real `number` `findIdTitleOwner` already resolved
    // above, not the route's raw `tripId` string. The comment this replaced
    // claimed "`Number(tripId)` at the two writes below", but only
    // `addIgnoringConflict` (which requires a real `Primary<Trips>`) ever
    // did that; `setOwner`/`remove` used to keep binding the unconverted
    // string for their OTHER callers' sake. Plan 4 Task 8a narrowed both to
    // `number` (their last raw-string caller, `TripMembersController
    // .removeMember`, now parses once itself) — the letter of rule 21 says
    // one id, parsed once, threaded everywhere, and `trip.id` is already
    // sitting right here, already proven to be the real row.
    await this.uow.transactional(async () => {
      await this.tripsRepo.setOwner(trip.id, newOwnerId);
      // The new owner is no longer a plain member…
      await this.tripMembersRepo.remove(trip.id, newOwnerId);
      // …and the former owner keeps access as a member.
      await this.tripMembersRepo.addIgnoringConflict(trip.id, currentOwnerId, newOwnerId);
    });

    return { tripTitle: trip.title, fromEmail, toEmail: newOwner.email };
  }

  // ── Guest members (#1362) ───────────────────────────────────────────────────

  /** username is UNIQUE across all users — keep the typed name but disambiguate guests
   *  that happen to share it (e.g. two "Anna"s) with a numeric suffix. */
  async createGuest(tripId: string | number, name: string, invitedByUserId: number): Promise<{ member: GuestMember }> {
    const display = (name || '').trim();
    if (!display) throw new ValidationError('Guest name is required');
    if (display.length > 50) throw new ValidationError('Guest name must be 50 characters or fewer');

    // The human name lives in display_name (not unique — two trips can each have a
    // "Jake", #1446); username is a uuid handle only for the UNIQUE constraint and is
    // never shown (member views COALESCE display_name over it).
    const email = `guest-${randomUUID()}@guests.invalid`;
    const username = `guest-${randomUUID()}`;

    // `Number(tripId)` for the same reason `addMember`'s docstring gives:
    // `createGuest`'s route runs behind `TripOwnerGuard`, whose OWN
    // `Number(tripId)` is the seam that already matched a real trip (Task 9
    // fix wave, A-L1: corrected from "raw-bind `isOwner` check" — the guard
    // converts with `Number()` first, a WIDER seam than a raw bind, so a
    // hex-spelled trip id is authorised here too — L1's accepted widening:
    // `POST .../guests` with a hex id now creates a real guest, base 500).
    const guestId = await this.uow.transactional(async () => {
      const newGuestId = await this.usersRepo.insertGuest({ username, email, display_name: display });
      await this.tripMembersRepo.addMember(Number(tripId), newGuestId, invitedByUserId);
      return newGuestId;
    });

    return { member: { id: guestId, username: display, email, role: 'member', is_guest: true, avatar_url: null } };
  }

  /** Confirms a user id is a guest of THIS trip, so guest mutations stay trip-scoped. */
  private async guestOfTrip(tripId: string | number, guestUserId: number): Promise<boolean> {
    return this.tripMembersRepo.isGuestOfTrip(tripId, guestUserId);
  }

  async renameGuest(tripId: string | number, guestUserId: number, name: string): Promise<boolean> {
    const display = (name || '').trim();
    if (!display) throw new ValidationError('Guest name is required');
    if (display.length > 50) throw new ValidationError('Guest name must be 50 characters or fewer');
    if (!(await this.guestOfTrip(tripId, guestUserId))) return false;

    // Rename only the display name — no global-uniqueness dedup, so a rename to a name
    // another trip's guest already uses no longer produces "Name 2" (#1446).
    await this.usersRepo.renameGuest(guestUserId, display);
    return true;
  }

  async deleteGuest(tripId: string | number, guestUserId: number): Promise<boolean> {
    if (!(await this.guestOfTrip(tripId, guestUserId))) return false;
    // The plugin erasure, the budget re-split and the user delete run in one
    // transaction, so a failure mid-flow can't leave the expense divisors re-derived,
    // or the guest's plugin rows erased, for a guest that still exists (or vice
    // versa). The plugin notification goes out after the commit.
    await this.uow.transactional(async () => {
      // A guest is still a user id a plugin may hold data for, so erase that too (the
      // host-side per-user tables plus a durable own-db erasure per granted plugin), exactly
      // like a full account deletion; otherwise a deleted guest's plugin data lingers.
      await this.userCleanup.erasePluginUserData(guestUserId);
      // Re-split the expenses they were part of before the cascade takes their member
      // rows away — the divisor is denormalized and cannot follow a foreign key (#1553).
      await this.budget.removeUserFromBudgetItems(guestUserId);
      // Deleting the guest's users row cascades its membership and every assignment join
      // (trip_members, budget/packing/assignment links) via the ON DELETE foreign keys.
      await this.usersRepo.deleteGuest(guestUserId);
    });
    await emitUserDeleted(guestUserId); // deliver the erasure to any active plugin now
    return true;
  }
}
