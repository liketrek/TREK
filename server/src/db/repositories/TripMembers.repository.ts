import { caseWhenEquals, coalesce } from '../dialect/sql-functions';
import type { TripMembers } from '../entities/TripMembers.entity';
import { Trips } from '../entities/Trips.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * One row of `TripMembersService.listMembers` (`trip-members.service.ts:117-125`,
 * TM2). `is_guest` stays the raw SQLite integer here — the `!!m.is_guest`
 * boolean coercion is a service-layer default (D4), same split every other
 * repository in this program keeps.
 */
export interface MemberWithUserAndInviterRow {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  is_guest: number;
  role: string;
  added_at: string | null;
  invited_by_username: string | null;
}

export class TripMembersRepository extends TrekRepository<TripMembers> {
  /**
   * The user ids a trip may refer to: its members plus the owner. Byte-for-byte
   * the legacy `DatabaseService.rosterUserIds`'s statement in intent —
   * `SELECT user_id FROM trip_members WHERE trip_id = ? UNION SELECT user_id
   * FROM trips WHERE id = ?` — as two reads merged through a `Set` (which
   * already dedupes, the same guarantee `UNION` gives) rather than one `UNION`
   * statement: the two `SELECT`s read different tables with no FK between
   * them, so a single-entity `QueryBuilder` (rooted on `TripMembers`) cannot
   * express the second half without losing rows on a trip that has no
   * members yet — an inner join from `trip_members` would produce zero rows
   * for exactly the case (an owner-only trip) the legacy statement's second
   * `SELECT` exists to cover. `trips` has no `TripMembersRepository` field to
   * reach it through, so this repository asks the `EntityManager` for
   * `TripsRepository` the same way `DatabaseService`/the guards resolve a
   * repository outside their own entity — one `EntityManager`, two
   * repositories, two independent reads.
   */
  async rosterUserIds(trip_id: number | string): Promise<Set<number>> {
    // Raw conditions (D4's T5 escape hatch), not `.where({ 'm.trip': trip_id })`:
    // MikroORM's typed filter rejects a `string` against the relation's
    // branded id type, and coercing to `Number(trip_id)` first would change
    // the raw-bind id-shape parity `TripsRepository`'s docstring describes.
    // `m.trip_id`/`t.id` are the physical column names.
    const members = await this.qb('m')
      .select(['m.user'])
      .where('m.trip_id = ?', [trip_id])
      .execute<{ user_id: number }[]>('all', false);

    const trips = this.getEntityManager().getRepository(Trips);
    const owner = await trips
      .qb('t')
      .select(['t.user'])
      .where('t.id = ?', [trip_id])
      .execute<{ user_id: number } | undefined>('get', false);

    const ids = new Set(members.map((m) => m.user_id));
    if (owner) ids.add(owner.user_id);
    return ids;
  }

  /**
   * `SELECT user_id FROM trip_members WHERE trip_id = ? ORDER BY added_at ASC`
   * (`trip-membership.service.ts:29-31`, TB2) — the owner is excluded by
   * construction (the table has no row for the owner), matching the legacy
   * statement exactly. Raw-bind (D4's T5 escape hatch), the same
   * `number | string` seam `TripsRepository.findAccessible` documents.
   */
  async listUserIdsByTrip(trip_id: number | string): Promise<number[]> {
    const rows = await this.qb('m')
      .select(['m.user'])
      .where('m.trip_id = ?', [trip_id])
      .orderBy({ 'm.added_at': 'asc' })
      .execute<{ user_id: number }[]>('all', false);
    return rows.map((r) => r.user_id);
  }

  /**
   * `SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?`
   * (`trip-membership.service.ts:70`, TB5 — `joinTripAsMember`'s
   * already-a-member check, one leg of a non-transactional check-then-act
   * sequence, §18.4: unchanged by this conversion; also `trip-members
   * .service.ts:151`, TM5 — `addMember`'s own "already has access" check,
   * the SAME non-transactional shape against TM6's insert). `TripMembershipService
   * .joinTripAsMember`'s `tripId` is always a real `number`; `TripMembersService
   * .addMember`'s is still the route's unconverted `tripId`
   * (`string | number`) — raw-bind (D4's T5 escape hatch, the same seam
   * `TripsRepository.findAccessible` documents) covers both without forking
   * the statement into two methods.
   */
  async exists(trip_id: number | string, user_id: number): Promise<boolean> {
    const row = await this.qb('m')
      .select(['m.id'])
      .where('m.trip_id = ?', [trip_id])
      .andWhere({ user: user_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)`
   * (`trip-membership.service.ts:72`, TB6 — the third leg of the same
   * non-transactional sequence as `exists` above; also `trip-members
   * .service.ts:155`, TM6 — `addMember`'s own insert, and `:227`, TM17 —
   * `createGuest`'s membership row for the new guest, inside its own
   * transaction). `invitedBy` may be `null`. `trip_id: number`, not
   * `number | string`: unlike `exists`'s WHERE-comparison shape, `insert`'s
   * typed `EntityData` requires the relation's real `Primary<Trips>` type.
   * This is still exact parity for `TripMembersService`'s two still-string
   * `tripId` callers (TM6/TM17): by the time either call happens, the
   * route's `tripId` has already matched a real trip through one of the
   * four raw-bind access primitives earlier in the SAME request (the
   * controller's inline `canAccessTrip` check for `addMember`;
   * `TripOwnerGuard`'s `isOwner`/`findAccessible` for `createGuest`'s
   * owner-only route) — which only succeeds for a string SQLite's own
   * affinity rules already recognise as numeric, and `Number(...)` of
   * exactly that class of string always agrees with SQLite's own
   * numeric-affinity conversion. The two call sites document this and pass
   * `Number(tripId)`, not a widened raw bind.
   */
  async addMember(trip_id: number, user_id: number, invitedBy: number | null): Promise<void> {
    await this.insert({ trip: trip_id, user: user_id, invited_by: invitedBy });
  }

  /**
   * `SELECT u.id, COALESCE(u.display_name, u.username) AS username, u.email,
   *  u.avatar, u.is_guest, CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END
   *  as role, m.added_at, COALESCE(ib.display_name, ib.username) as
   *  invited_by_username FROM trip_members m JOIN users u ON u.id = m.user_id
   *  LEFT JOIN users ib ON ib.id = m.invited_by WHERE m.trip_id = ?
   *  ORDER BY m.added_at ASC` (`trip-members.service.ts:117-125`, TM2) —
   * the self-join on `users` (once as `u` for the member, once as `ib` for
   * the inviter) via `TripMembers.entity.ts`'s `invitedByRef` relation,
   * which exists precisely for this join. Every joined-alias column is
   * selected with an explicit inline `as <name>` (the `PlaceRatingsRepository
   * .listForPlaces`/`AssignmentParticipantsRepository.insertIgnore`
   * precedent — rule 19's trap: selecting a joined alias's bare `.id`
   * without an explicit alias risks MikroORM's own `<alias>__<col>` prefix
   * for a relation-property select, verified NOT to reproduce the legacy's
   * bare `id`/`email`/`avatar`/`is_guest`/`added_at` keys otherwise), never
   * left to MikroORM's own column-collision aliasing.
   */
  async listWithUserAndInviter(trip_id: number | string, owner_id: number): Promise<MemberWithUserAndInviterRow[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('m')
      .join('m.user', 'u')
      .leftJoin('m.invitedByRef', 'ib')
      .select([
        'u.id as id',
        coalesce(platform, 'u.display_name', 'u.username').as('username'),
        'u.email as email',
        'u.avatar as avatar',
        'u.is_guest as is_guest',
        caseWhenEquals(platform, 'u.id', owner_id, 'owner', 'member').as('role'),
        'm.added_at as added_at',
        coalesce(platform, 'ib.display_name', 'ib.username').as('invited_by_username'),
      ])
      .where('m.trip_id = ?', [trip_id])
      .orderBy({ 'm.added_at': 'asc' })
      .execute<MemberWithUserAndInviterRow[]>('all', false);
  }

  /**
   * `SELECT u.id FROM users u JOIN trip_members m ON m.user_id = u.id
   *  WHERE u.id = ? AND m.trip_id = ? AND u.is_guest = 1`
   *  (`trip-members.service.ts:235-237`, TM18) — security-sensitive: the
   * scoping guard that keeps guest mutations trip-local (#1362). Rooted on
   * `TripMembers` (this repository's entity) rather than `Users`: the
   * legacy statement's `users u JOIN trip_members m` becomes `trip_members m
   * JOIN users u` here, the same join and the same result set, only rooted
   * the other way because that is this repository's entity.
   *
   * Raw-bind on `user_id` (not `.andWhere({ user: user_id })`) plus a
   * `Number.isFinite` short-circuit guard — the same reason `remove()` below
   * has both: `renameGuest`/`deleteGuest`'s callers still do a bare
   * `Number.parseInt(userId)` on the route's `:userId`, unvalidated — a
   * non-numeric id parses to `NaN`. **Mechanism (Task 6 review's I1,
   * captured by wrapping `better-sqlite3.prepare`, not assumed): MikroORM
   * formats every query with ALL parameters inlined as escaped literals —
   * the params array that reaches better-sqlite3 is always empty — so a
   * non-finite `NaN`/`Infinity` renders as a bare, unquoted SQL token and
   * SQLite fails at PREPARE time (`no such column: NaN`, a 500), before any
   * statement runs. A raw `?` placeholder does not avoid this (a typed
   * filter has the identical failure) because the inlining happens during
   * formatting, not at the bind step.** The legacy statement bound it as a
   * genuine better-sqlite3 parameter, matching zero rows (404 `'Guest not
   * found'`, not a crash) — only skipping the query for a non-finite
   * `user_id` reproduces that byte for byte.
   */
  async isGuestOfTrip(trip_id: number | string, user_id: number): Promise<boolean> {
    if (!Number.isFinite(user_id)) return false;
    const row = await this.qb('m')
      .join('m.user', 'u')
      .select(['u.id as id'])
      .where('m.trip_id = ?', [trip_id])
      .andWhere('m.user_id = ?', [user_id])
      .andWhere({ 'u.is_guest': 1 })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `INSERT OR IGNORE INTO trip_members (trip_id, user_id, invited_by)
   *  VALUES (?, ?, ?)` (`trip-members.service.ts:200`, TM15) —
   * security-sensitive: `transferOwnership`'s third statement, giving the
   * former owner membership back. `upsert` with `onConflictAction: 'ignore'`
   * on the table's real unique key, named by entity property (`trip`/`user`,
   * `AssignmentParticipantsRepository.insertIgnore`'s precedent for a
   * relation-backed `onConflictFields` list) — `UNIQUE(trip_id, user_id)`
   * per `TripMembersSchema`'s own `uniques` declaration, not assumed.
   * `trip_id: number`, the same reasoning as `addMember`'s docstring above
   * (an `upsert` is INSERT-shaped; the caller passes `Number(tripId)`,
   * justified there — `transferOwnership`'s route is `TripOwnerGuard`-gated,
   * so `tripId` has already matched a real trip through the raw-bind
   * `isOwner`/`findAccessible` primitive earlier in the same request).
   */
  async addIgnoringConflict(trip_id: number, user_id: number, invitedBy: number | null): Promise<void> {
    // `invitedByRef`, not `invited_by`: the latter is a `persist(false)` mirror
    // column (like `trip_id`/`user_id`) that `upsert` — unlike `insert` above,
    // per `addMember`'s test — silently drops when building its INSERT.
    // `invitedByRef` is the real, joined-column-backed relation property.
    await this.upsert(
      { trip: trip_id, user: user_id, invitedByRef: invitedBy },
      { onConflictFields: ['trip', 'user'], onConflictAction: 'ignore' },
    );
  }

  /**
   * `DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?`
   * (`trip-members.service.ts:166`, TM8 `removeMember`; `:198`, TM14
   * `transferOwnership`'s "no longer a plain member" step —
   * security-sensitive). `trip_id: number` (Plan 4 Task 8a, narrowed from
   * `number | string` — its last raw-string caller,
   * `TripMembersController.removeMember`, now parses its route param once
   * itself before calling this), so `trip_id` is a typed `.where({ trip:
   * trip_id })` filter below; `user_id` stays a raw `m.user_id = ?`
   * placeholder — NOT the same seam, a different reason entirely:
   * `TripMembersController.removeMember` still does a bare
   * `Number.parseInt(userId)` on the route's `:userId`, unvalidated (rule
   * 15's exact trap — a non-numeric id parses to `NaN`), and a typed filter
   * cannot carry a `NaN` through this ORM layer intact (see below).
   *
   * **`Number.isFinite` guard, checked directly against a compiled boot, not
   * assumed:** a typed `.andWhere({ user: user_id })` filter renders `NaN` as
   * a literal, unquoted SQL token (`WHERE … AND user_id = NaN`), which
   * SQLite's parser reads as a column reference and rejects at PREPARE time
   * (`no such column: NaN`, a 500). Switching to a raw `m.user_id = ?`
   * placeholder does NOT fix this (Task 6 review's I1, captured by wrapping
   * `better-sqlite3.prepare`): MikroORM formats every query with ALL
   * parameters inlined as escaped literals — the params array that reaches
   * better-sqlite3 is always empty — so `NaN` renders as that same bare
   * token regardless of whether the predicate was written as a typed filter
   * or a raw `?` placeholder (reproduced directly: still `no such column:
   * NaN` at prepare time, before any bind happens — the inlining happens
   * during formatting, not at the bind step). The legacy statement bound
   * `targetUserId` (`NaN`) straight into a real better-sqlite3 parameter,
   * which silently matches zero rows and returns 200 `{ success: true }` —
   * only skipping the query entirely for a non-finite `user_id` reproduces
   * that, byte for byte, since neither the typed filter nor the raw
   * placeholder route can pass `NaN` through the ORM layer intact.
   */
  async remove(trip_id: number, user_id: number): Promise<void> {
    if (!Number.isFinite(user_id)) return;
    await this.qb('m').delete().where({ trip: trip_id }).andWhere('m.user_id = ?', [user_id]).execute('run');
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 7 (`trips.rpc.ts::members`) — additive: no other repository
  // is rooted at `trip_members` joined to `users`, and RP3's shape is
  // deliberately NOT `listWithUserAndInviter`'s (TM2's COALESCE'd
  // `username`), so it gets its own method here rather than a variant
  // parameter on TM2's.
  // ---------------------------------------------------------------------------

  /**
   * RP3 (`trips.rpc.ts::members`) — `SELECT u.id, u.username, u.display_name,
   * u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE
   * tm.trip_id = ?`. Emits raw `username` AND `display_name` as SEPARATE
   * fields — deliberately NOT `listWithUserAndInviter`'s (TM2) COALESCE'd
   * single `username` (the ruling: "do not harmonise" — a plugin reading
   * `trips.members` and the REST/MCP roster are two different wire shapes on
   * purpose, inventory §18.10).
   */
  async listRawUsernameAndDisplayName(
    trip_id: number | string,
  ): Promise<{ id: number; username: string; display_name: string | null; avatar: string | null }[]> {
    return await this.qb('m')
      .join('m.user', 'u')
      .select(['u.id', 'u.username', 'u.display_name', 'u.avatar'])
      .where('m.trip_id = ?', [trip_id])
      .execute<{ id: number; username: string; display_name: string | null; avatar: string | null }[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (UC4, `user-cleanup.service.ts::cleanupUserReferences`) —
  // additive: the table's own Plan 3c ownership, mis-filed by an earlier
  // ledger under Plan 3g/3j and left unconverted.
  // ---------------------------------------------------------------------------

  /**
   * UC4 — `UPDATE trip_members SET invited_by = NULL WHERE invited_by = ?`
   * (GDPR erasure: severs every membership row's reference to a user being
   * deleted, without deleting the membership itself). Filtered and set
   * through `invitedByRef`, the real joined-column relation property —
   * `invited_by` itself is the `persist(false)` mirror `addIgnoringConflict`'s
   * docstring above already names.
   */
  async clearInvitedBy(userId: number): Promise<void> {
    await this.nativeUpdate({ invitedByRef: userId }, { invitedByRef: null });
  }
}
