import { QueryFlag } from '@mikro-orm/core';
import type { Trips } from '../entities/Trips.entity';
import { coalesceParam, currentTimestamp, nowDateOffset } from '../dialect/sql-functions';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import { tripAccessExpr } from './_shared/trip-access';

/** What a trip-scoped request learns about the trip once access is verified. */
export interface TripAccess {
  id: number;
  user_id: number;
  currency: string | null;
}

/**
 * `SELECT * FROM trips WHERE id = ?`, every scalar column — the row
 * `TripReadModelService.getTripSummary` (TR-B) and, once Task 7 lands,
 * `TripsService.getRaw` (TP22) both need, `feed_token` included: the
 * `withoutFeedToken()` JS strip that guards the credential stays in the
 * SERVICE (TR-B's ruling), so this repository method must hand the column
 * back intact for that strip to have something to delete.
 */
export interface TripRawRow {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string | null;
  cover_image: string | null;
  is_archived: number | null;
  reminder_days: number | null;
  feed_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const _tripRawRowKeys: AssertRowKeys<TripRawRow, Trips> = true;

/**
 * `TRIP_SELECT`'s output row (inventory §11a) — every `TripRawRow` column
 * plus the four computed/joined columns the projection adds. `feed_token`
 * is always `null` here (SQL-side blanking via `NULL AS feed_token`/its
 * Kysely equivalent, never a JS strip) — see `TripsRepository
 * .tripSelectQuery`'s docstring.
 */
export interface TripSelectRow extends Omit<TripRawRow, 'feed_token'> {
  feed_token: null;
  day_count: number;
  place_count: number;
  is_owner: number;
  owner_username: string;
  shared_count: number;
}

/** The narrow `trips`/`users`/`days`/`places`/`trip_members` shape `tripSelectQuery` needs (`this.kysely()`'s typed `DB` argument). */
interface TripSelectKyselyDB {
  trips: {
    // `number | string`, not a bare `number`: the raw-bind seam (D4's T5
    // escape hatch) — `findForViewer`'s `WHERE t.id = ?` accepts the route's
    // unconverted id with no coercion, the same seam every QB-based method
    // in this file documents. Widening the TYPE (not spelling `sql\`...\``,
    // which `no-restricted-syntax` bans in `src/db/repositories/**`) is what
    // lets `.where('t.id', '=', trip_id)` accept a `string` here.
    id: number | string;
    user_id: number;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    currency: string | null;
    cover_image: string | null;
    is_archived: number | null;
    reminder_days: number | null;
    feed_token: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  users: { id: number; username: string };
  trip_members: { id: number; trip_id: number; user_id: number };
  days: { id: number; trip_id: number };
  places: { id: number; trip_id: number };
}

// Task 7 review L4, absorbed here (Task 8 touches the same file): the 13
// hand-listed columns of `TripSelectKyselyDB['trips']` above are a second,
// independently-typed copy of `Trips`'s own scalar columns (Kysely's typed
// `DB` argument can't be derived from the entity metadata the way `qb()`'s
// generics are) — this fails `tsc` the moment a column is added to or
// removed from `Trips` without updating this interface to match, instead of
// silently drifting (the same drift guard `_tripRawRowKeys`/`_dayRowKeys`/…
// already give every hand-written row interface in this program).
const _tripSelectKyselyDbKeys: AssertRowKeys<TripSelectKyselyDB['trips'], Trips> = true;

/** TP21's output row (inventory §11c) — `relevance` is the computed sort key, never sent to the client (the controller destructures `{id, title, start_date, end_date}` only). */
export interface ActiveTripRow {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  relevance: number;
}

/** The narrow `trips`/`trip_members` shape `activeTrip` needs. */
interface ActiveTripKyselyDB {
  trips: { id: number; title: string; start_date: string | null; end_date: string | null; user_id: number; is_archived: number | null };
  trip_members: { id: number; trip_id: number; user_id: number };
}

export class TripsRepository extends TrekRepository<Trips> {
  /**
   * The `LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
   * WHERE (t.user_id = ? OR m.user_id IS NOT NULL)` half `findAccessible`
   * and `listAccessibleIds` (Plan 3c Task 1, TB3) share — one join builder,
   * per the task brief's ruling that the two must derive from the same
   * source rather than hand-keeping two copies in sync (the cross-plan note
   * in the inventory: TB3 and `TripsService.list`'s id half are "the same
   * query with different projections"). No explicit return-type annotation,
   * for the same inference reason `TrekRepository.kysely()` gives (the
   * QueryBuilder's fluent generic parameters do not survive being spelled
   * out via a separate type alias) — every caller chains `.select()`/
   * `.where()`/`.orderBy()` straight off this method's return value.
   */
  private accessibleTripsQuery(user_id: number) {
    return this.qb('t')
      .leftJoin('t.trip_members_collection', 'm', { 'm.user': user_id })
      .andWhere({ $or: [{ 't.user': user_id }, { 'm.user': { $ne: null } }] });
  }

  /**
   * The trip if the user owns it or is a member of it, else undefined.
   *
   * Byte-for-byte the legacy `canAccessTrip` statement:
   *   SELECT t.id, t.user_id, t.currency FROM trips t
   *   LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
   *   WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
   *
   * `trip_id: number | string` (Plan 3c Task 0b): the legacy free function
   * bound whatever `req.params.tripId` resolved to straight into the
   * statement with no `Number()`/`toRowId` conversion first — the raw-bind
   * seam. `TripAccessGuard` still does `Number(tripId)` before calling this
   * (unchanged), but `DatabaseService.canAccessTrip`/`isOwner` and every
   * other of the 41 in-cluster callers pass a `number | string` through
   * unconverted, so this method (and `isOwner` below) must accept and bind
   * that raw value rather than coerce it — a coercion here would silently
   * change the `'0x10'`/`'007'`-shaped id parity the boot matrix pins
   * (`Number('0x10') === 16`, a real trip id, where SQLite's own text/integer
   * affinity comparison of the unconverted string never matches one).
   */
  async findAccessible(trip_id: number | string, user_id: number): Promise<TripAccess | undefined> {
    const row = await this.accessibleTripsQuery(user_id)
      .select(['t.id', 't.user', 't.currency'])
      // Raw condition (D4's T5 escape hatch), not `.where({ 't.id': trip_id })`:
      // MikroORM's typed filter rejects a `string` against `t.id`'s branded
      // `number` type, and coercing to `Number(trip_id)` first would be
      // exactly the parity break the class docstring above describes.
      // `t.id`/`t.user_id` are the physical column names (not translated
      // through the entity's `trip`/`user` property aliasing the way a typed
      // filter object is), so the raw text names them directly.
      .andWhere('t.id = ?', [trip_id])
      // `mapResults: false` leaves the driver's row alone: the keys are the
      // column names, which is why the result type is spelled out here rather
      // than inferred from the entity's properties.
      .execute<{ id: number; user_id: number; currency: string | null } | undefined>('get', false);
    if (!row) return undefined;
    return { id: row.id, user_id: row.user_id, currency: row.currency ?? null };
  }

  /**
   * DY35 (`days.service.ts::insert`'s dated path) — `UPDATE trips SET
   * end_date = ? WHERE id = ?`: a dated insert extends the trip by one day.
   * Plan 3c Task 7 (`TripsService`) reuses this for its own `end_date`
   * writes rather than duplicating the statement.
   */
  async setEndDate(id: number, end_date: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { end_date });
  }

  /**
   * DY38/DY42 (`DaysService.appendDated`, `DayRemovalService.renumber`) —
   * `UPDATE trips SET end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id
   * = ?`: a day added after the last date, or a deleted day that took the last
   * date along, moves the trip's end and stamps it.
   */
  async setEndDateTouched(id: number, end_date: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { end_date, updated_at: currentTimestamp(platform) });
  }

  /**
   * TP79 (`trips.service.ts::searchPlaces`, #2190) — `SELECT p.trip_id,
   * p.name FROM places p JOIN trips t ON t.id = p.trip_id LEFT JOIN
   * trip_members m ON m.trip_id = t.id AND m.user_id = :userId WHERE
   * (t.user_id = :userId OR m.user_id IS NOT NULL) AND (p.name LIKE :like
   * ESCAPE '\' OR p.address LIKE :like ESCAPE '\') ORDER BY p.trip_id, p.name
   * LIMIT 500`. `likePattern` arrives pre-escaped (`%…%`, the service's job),
   * as in PlacesRepository.listForTrip.
   */
  async searchPlaceNames(user_id: number, likePattern: string): Promise<{ trip_id: number; name: string }[]> {
    return await this.accessibleTripsQuery(user_id)
      .join('t.places_collection', 'p')
      .select(['p.trip', 'p.name'])
      .andWhere("(p.name LIKE ? ESCAPE '\\' OR p.address LIKE ? ESCAPE '\\')", [likePattern, likePattern])
      .orderBy([{ 'p.trip': 'asc' }, { 'p.name': 'asc' }])
      .limit(500)
      // The limit is on the joined place rows, like the legacy statement's.
      // Without the flag MikroORM moves a limit over a to-many join into a
      // subquery on trips and drops the LIKE filter from the outer select.
      .setFlag(QueryFlag.DISABLE_PAGINATE)
      .execute<{ trip_id: number; name: string }[]>('all', false);
  }

  /** `SELECT id FROM trips WHERE id = ? AND user_id = ?` */
  async isOwner(trip_id: number | string, user_id: number): Promise<boolean> {
    const row = await this.qb('t')
      .select(['t.id'])
      .where('t.id = ?', [trip_id])
      .andWhere({ user: user_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `SELECT user_id FROM trips WHERE id = ?` (`trip-membership.service.ts:23`,
   * TB1) — `row ? row.user_id : null` stays the caller's decision to make
   * ("owner id for budget/MCP guards"); this returns exactly that shape.
   * Raw-bind (D4's T5 escape hatch), same `number | string` seam as
   * `findAccessible`/`isOwner` above.
   */
  async getOwnerId(trip_id: number | string): Promise<number | null> {
    const row = await this.qb('t')
      .select(['t.user'])
      .where('t.id = ?', [trip_id])
      .execute<{ user_id: number } | undefined>('get', false);
    return row ? row.user_id : null;
  }

  /**
   * `SELECT id, user_id FROM trips WHERE id = ?` (`trip-membership.service.ts:66`,
   * TB4) — `joinTripAsMember`'s first check-then-act read (§18.4: the
   * sequence stays non-transactional, unchanged by this conversion). The
   * only caller (`TripMembershipService.joinTripAsMember(tripId: number, …)`)
   * always passes a real `number`, so this takes one too — no raw-bind seam
   * to preserve here, unlike `findAccessible`/`isOwner`/`getOwnerId`.
   */
  async findIdAndOwner(trip_id: number): Promise<{ id: number; user_id: number } | undefined> {
    return this.qb('t')
      .select(['t.id', 't.user'])
      .where({ id: trip_id })
      .execute<{ id: number; user_id: number } | undefined>('get', false);
  }

  /**
   * MR8 (Plan 3j Task 5, `host/rpc/meta.rpc.ts#entityTrip`'s `'trip'` arm) —
   * `SELECT id FROM trips WHERE id = ?`, a bare existence probe (the entity
   * type IS the trip, so the id resolves to itself once the row is
   * confirmed to exist).
   */
  async existsById(id: number): Promise<boolean> {
    const row = await this.qb('t')
      .select(['t.id'])
      .where({ id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * HR9 (Plan 3j Task 5, `host/rpc/host-surface.rpc.ts#sharesATrip`, private)
   * — byte-for-byte the legacy self-joined statement:
   *   SELECT 1 FROM trips t
   *     LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
   *     LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
   *    WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
   *      AND (t.user_id = ? OR m2.user_id IS NOT NULL)
   *    LIMIT 1
   * — "does ANY trip exist where both users are owner-or-member" (the
   * `users.getById` plugin RPC's own access gate — a bespoke bilateral
   * membership check, NOT `canAccessTrip`-shaped, which is why it lives here
   * rather than reusing `accessibleTripsQuery` — that builder joins ONE
   * user's membership; this needs two independent joins, one per user, so
   * neither side's `$or` can be satisfied by the other's row.
   */
  async sharesTripWith(userIdA: number, userIdB: number): Promise<boolean> {
    const row = await this.qb('t')
      .leftJoin('t.trip_members_collection', 'm1', { 'm1.user': userIdA })
      .leftJoin('t.trip_members_collection', 'm2', { 'm2.user': userIdB })
      .select(['t.id'])
      .andWhere({
        $and: [
          { $or: [{ 't.user': userIdA }, { 'm1.user': { $ne: null } }] },
          { $or: [{ 't.user': userIdB }, { 'm2.user': { $ne: null } }] },
        ],
      })
      .limit(1)
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `SELECT t.id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id
   *  AND m.user_id = :userId WHERE (t.user_id = :userId OR m.user_id IS NOT NULL)
   *  ORDER BY t.created_at DESC` (`trip-membership.service.ts:40-46`, TB3) —
   * the id half of `TripsService.list(userId, null)`, sharing `findAccessible`'s
   * join builder per the task brief's ruling (this class's `accessibleTripsQuery`
   * above).
   */
  async listAccessibleIds(user_id: number): Promise<number[]> {
    const rows = await this.accessibleTripsQuery(user_id)
      .select(['t.id'])
      .orderBy({ 't.created_at': 'desc' })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  /**
   * `SELECT title FROM trips WHERE id = ?` (`trip-members.service.ts:156`,
   * TM7) — `addMember`'s notification-body read; the caller applies its own
   * `?? 'Untitled'` fallback (D4). Raw-bind (D4's T5 escape hatch), the same
   * `number | string` seam `findAccessible` documents.
   */
  async getTitle(trip_id: number | string): Promise<string | null> {
    const row = await this.qb('t')
      .select(['t.title'])
      .where('t.id = ?', [trip_id])
      .execute<{ title: string } | undefined>('get', false);
    return row?.title ?? null;
  }

  /**
   * `SELECT id, title, user_id FROM trips WHERE id = ?`
   * (`trip-members.service.ts:180`, TM9) — `transferOwnership`'s first
   * check-then-act read (miss → 404 `'Trip not found'`; wrong owner → 400
   * `'Only the owner can transfer ownership'`, both decided by the caller).
   * Raw-bind, the same seam as `getTitle` above.
   */
  async findIdTitleOwner(trip_id: number | string): Promise<{ id: number; title: string; user_id: number } | undefined> {
    return this.qb('t')
      .select(['t.id', 't.title', 't.user'])
      .where('t.id = ?', [trip_id])
      .execute<{ id: number; title: string; user_id: number } | undefined>('get', false);
  }

  /**
   * `UPDATE trips SET user_id = ? WHERE id = ?` (`trip-members.service.ts:196`,
   * TM13) — security-sensitive: the ownership handover itself, the first of
   * `transferOwnership`'s three transactional statements. `trip_id: number`
   * (Plan 4 Task 8a, narrowed from `number | string`): its one production
   * caller already passes `trip.id`, the real row `findIdTitleOwner`
   * resolved earlier in the same transaction, never the route's raw string
   * (see `transferOwnership`'s own comment on why). `nativeUpdate`, typed
   * filter throughout — nothing here needs the raw-bind escape hatch any
   * more.
   */
  async setOwner(trip_id: number, user_id: number): Promise<void> {
    await this.nativeUpdate({ id: trip_id }, { user: user_id });
  }

  /**
   * `SELECT * FROM trips WHERE id = ?` — `TripReadModelService.getTripSummary`'s
   * trip read (`trip-read-model.service.ts:52`, TR-B) and, once Task 7 lands,
   * `TripsService.getRaw` (TP22, `trips.service.ts:389`) — one method, two
   * sites, per the inventory's own note that they are the identical
   * statement. `feed_token` comes back intact; `withoutFeedToken()` stays a
   * JS strip in each CALLER (TR-B's ruling — this repository never blanks
   * it itself, unlike `TRIP_SELECT`'s `NULL AS feed_token` SQL-side trick).
   * `.select(['t.*'])` — MikroORM's QueryBuilder recognises the bare
   * `<alias>.*` marker (verified against `QueryBuilder.js`'s own
   * `prepareFields`, not assumed) and emits every column unprefixed, the
   * same `SELECT t.*` shape the legacy statement used. Raw-bind, the same
   * `number | string` seam `getTitle`/`findIdTitleOwner` above preserve.
   */
  async findRaw(trip_id: number | string): Promise<TripRawRow | null> {
    const row = await this.qb('t')
      .select(['t.*'])
      .where('t.id = ?', [trip_id])
      .execute<TripRawRow | undefined>('get', false);
    return row ?? null;
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 7 (`TripsService`) — `TRIP_SELECT` (inventory §11a) becomes
  // ONE builder here (`tripSelectQuery`), expressed through `this.kysely()`
  // (a typed one-table-plus-joins DB interface, the same escape hatch
  // `DayAssignmentsRepository.effectiveStart`/`DayAssignmentsRepository
  // .listForTimeSort` use): three correlated scalar `COUNT(*)` subqueries a
  // QueryBuilder select list cannot express, a `CASE WHEN` projected column,
  // and `NULL AS feed_token` placed AFTER `t.*` (via `.selectAll('t')` then
  // a later `.select()` of the literal) so the duplicate key wins in the row
  // object exactly the way the legacy statement's column order does — not by
  // hand-listing every `trips` column (§18.5: that loses the "blanked once,
  // survives a schema change" guarantee the legacy comment describes).
  // Verified directly with `.compile()` against a real in-memory DB before
  // wiring in (task report, TRIP_SELECT SQL captures) — a fully seeded trip
  // (owner, member, stranger; day/place counts; `feed_token` set in the DB)
  // produces `feed_token: null`, `is_owner`, `owner_username`, all four
  // counts, byte-identical in shape to a raw run of the legacy statement.
  // ---------------------------------------------------------------------------

  /**
   * `this.kysely()`'s typed `DB` argument for every `TRIP_SELECT`-shaped
   * query below — narrowed to the columns those queries read or join
   * through, per `WebauthnChallengesRepository.claimChallenge`'s docstring
   * (entity-metadata inference is not what a hand-written statement wants).
   */
  private tripSelectQuery(user_id: number) {
    return this.kysely<TripSelectKyselyDB>()
      .selectFrom('trips as t')
      .innerJoin('users as u', 'u.id', 't.user_id')
      .selectAll('t')
      .select((eb) => [
        eb.val<string | null>(null).as('feed_token'),
        eb.selectFrom('days as d').select((eb2) => eb2.fn.countAll<number>().as('c')).whereRef('d.trip_id', '=', 't.id').as('day_count'),
        eb.selectFrom('places as p').select((eb2) => eb2.fn.countAll<number>().as('c')).whereRef('p.trip_id', '=', 't.id').as('place_count'),
        eb.case().when('t.user_id', '=', user_id).then(1).else(0).end().as('is_owner'),
        'u.username as owner_username',
        eb.selectFrom('trip_members as tm').select((eb2) => eb2.fn.countAll<number>().as('c')).whereRef('tm.trip_id', '=', 't.id').as('shared_count'),
      ]);
  }

  /**
   * DY37 (`DaysService.getTripForViewer`) — `TRIP_SELECT
   * WHERE t.id = :tripId`, with no access join: a day write that changed the
   * trip (its end date, its day count) re-reads it in list shape for its own
   * caller, who already holds access, and the rows of every viewer are the
   * same apart from `is_owner`.
   */
  async findListShapeById(trip_id: number | string, user_id: number): Promise<TripSelectRow | undefined> {
    const row = await this.tripSelectQuery(user_id).where('t.id', '=', trip_id).executeTakeFirst();
    return row as TripSelectRow | undefined;
  }

  /**
   * TP20 (`trips.service.ts::get`) — `TRIP_SELECT` scoped to one trip AND
   * the access predicate (`t.user_id = :userId OR m.user_id IS NOT NULL`),
   * i.e. "the trip if this viewer may see it, else nothing". Also serves
   * TP19 (`create`'s post-insert re-select) and TP29 (`updateTrip`'s
   * post-write re-select): both call sites are only ever reached after the
   * acting user has already passed an access check for this exact trip
   * (creator = owner; `updateTrip`'s callers all gate on `canAccessTrip`/
   * `requireTripEdit` first), so the access predicate here is always
   * trivially satisfied in those two contexts and the result is identical
   * to the legacy's unscoped `WHERE t.id = :tripId` re-select. Also serves
   * `TripMembersService.getTripForViewer` (TM1, Task 6 review's "for Task
   * 7" note) — same reasoning: every caller already holds access.
   *
   * Raw-bind (`number | string`, D4's T5 escape hatch — `TripSelectKyselyDB`'s
   * `trips.id` is typed `number | string` for exactly this): the legacy
   * statement bound the route's unconverted `tripId` with no `Number()`/
   * `toRowId` conversion, matching `findAccessible`'s documented seam.
   */
  async findForViewer(trip_id: number | string, user_id: number): Promise<TripSelectRow | undefined> {
    const row = await this.tripSelectQuery(user_id)
      .leftJoin('trip_members as m', (join) => join.onRef('m.trip_id', '=', 't.id').on('m.user_id', '=', user_id))
      .where('t.id', '=', trip_id)
      .where((eb) => tripAccessExpr(eb, 't.user_id', 'm.user_id', user_id))
      .executeTakeFirst();
    return row as TripSelectRow | undefined;
  }

  /**
   * TP16/TP17 (`trips.service.ts::list`) — `TRIP_SELECT` + the access join,
   * optionally filtered by `is_archived`, `ORDER BY t.created_at DESC`.
   * `archived === null` reproduces TP16 (no filter); any other value (0 or
   * 1, the controller's own coercion) reproduces TP17.
   */
  async listForUser(user_id: number, archived: number | null): Promise<TripSelectRow[]> {
    let query = this.tripSelectQuery(user_id)
      .leftJoin('trip_members as m', (join) => join.onRef('m.trip_id', '=', 't.id').on('m.user_id', '=', user_id))
      .where((eb) => tripAccessExpr(eb, 't.user_id', 'm.user_id', user_id));
    if (archived !== null) query = query.where('t.is_archived', '=', archived);
    const rows = await query.orderBy('t.created_at', 'desc').execute();
    return rows as TripSelectRow[];
  }

  /**
   * TP21 (`trips.service.ts::activeTrip`) — the triple `CASE WHEN …
   * relevance` projection and the double-`CASE WHEN` `ORDER BY` (one ASC,
   * one DESC). The legacy statement's `ORDER BY` items reference the
   * `relevance` SELECT-list alias (`CASE WHEN relevance < 2 …`, `CASE WHEN
   * relevance = 2 …`); reproduced here by recomputing the equivalent
   * boolean expression inline at each of the four sites (the `.select()`
   * and three `.orderBy()` calls below) rather than referencing the alias,
   * since Kysely's typed `ORDER BY` can't name a computed SELECT alias and
   * `sql`-tagged templates are banned in `src/db/repositories/**` — and a
   * shared private helper can't be typed across these four callbacks either
   * (`leftJoin`'s alias widens each callback's own `ExpressionBuilder`
   * table-set in a way a separate generic method signature can't match
   * structurally). Semantically identical to the legacy statement — SQLite
   * evaluates both forms to the same three-way ordering, verified directly
   * against `.compile()`/real rows before wiring in (task report,
   * TRIP_SELECT SQL captures): `running` = `relevance = 0`, `upcoming` =
   * `relevance = 1`, `running OR upcoming` = `relevance < 2`.
   */
  async activeTrip(user_id: number, today: string): Promise<ActiveTripRow | undefined> {
    const row = await this.kysely<ActiveTripKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('trip_members as m', (join) => join.onRef('m.trip_id', '=', 't.id').on('m.user_id', '=', user_id))
      .select(['t.id', 't.title', 't.start_date', 't.end_date'])
      .select((eb) => [
        eb.case()
          .when(eb.and([eb('t.start_date', 'is not', null), eb('t.end_date', 'is not', null), eb('t.start_date', '<=', today), eb('t.end_date', '>=', today)]))
          .then(0)
          .when(eb.and([eb('t.start_date', 'is not', null), eb('t.start_date', '>=', today)]))
          .then(1)
          .else(2)
          .end()
          .as('relevance'),
      ])
      .where((eb) => tripAccessExpr(eb, 't.user_id', 'm.user_id', user_id))
      .where('t.is_archived', '=', 0)
      .orderBy((eb) =>
        eb.case()
          .when(eb.and([eb('t.start_date', 'is not', null), eb('t.end_date', 'is not', null), eb('t.start_date', '<=', today), eb('t.end_date', '>=', today)]))
          .then(0)
          .when(eb.and([eb('t.start_date', 'is not', null), eb('t.start_date', '>=', today)]))
          .then(1)
          .else(2)
          .end(), 'asc')
      .orderBy((eb) =>
        eb.case()
          .when(eb.or([
            eb.and([eb('t.start_date', 'is not', null), eb('t.end_date', 'is not', null), eb('t.start_date', '<=', today), eb('t.end_date', '>=', today)]),
            eb.and([eb('t.start_date', 'is not', null), eb('t.start_date', '>=', today)]),
          ]))
          .then(eb.ref('t.start_date'))
          .end(), 'asc')
      .orderBy((eb) =>
        eb.case()
          .when(eb.not(eb.or([
            eb.and([eb('t.start_date', 'is not', null), eb('t.end_date', 'is not', null), eb('t.start_date', '<=', today), eb('t.end_date', '>=', today)]),
            eb.and([eb('t.start_date', 'is not', null), eb('t.start_date', '>=', today)]),
          ])))
          .then(eb.ref('t.start_date'))
          .end(), 'desc')
      .limit(1)
      .executeTakeFirst();
    return row as ActiveTripRow | undefined;
  }

  /**
   * TP18 (`trips.service.ts::create`'s INSERT) — the column set of the
   * legacy statement, written verbatim (the `||`/clamp defaults are the
   * service's own, decided before this call, per the program's D2 split).
   * Returns `em.insert()`'s PK (R6's `lastInsertRowid` replacement).
   */
  async insertTrip(input: {
    user_id: number;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    currency: string;
    reminder_days: number;
  }): Promise<number> {
    return await this.insert({
      user: input.user_id,
      title: input.title,
      description: input.description,
      start_date: input.start_date,
      end_date: input.end_date,
      currency: input.currency,
      reminder_days: input.reminder_days,
    });
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 8 (`TripsService.copy`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP37 (`trips.service.ts::copy`'s INSERT) — `INSERT INTO trips (user_id,
   * title, description, start_date, end_date, currency, cover_image,
   * is_archived, reminder_days) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`. A
   * DIFFERENT column set from `insertTrip` (TP18, `create`'s own INSERT):
   * this one also writes `cover_image` (verbatim from the source row) and
   * `is_archived` as a hard-coded literal `0` — a copy is never archived,
   * regardless of the source's own flag, so `is_archived` takes no
   * parameter at all here, matching the legacy statement's own `0` literal
   * rather than a bound value. The `title || src.title` fallback and the
   * `reminder_days ?? 3` default are the SERVICE's own decisions (already
   * resolved before this call), same split as `insertTrip`.
   */
  async insertTripCopy(input: {
    user_id: number;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    currency: string | null;
    cover_image: string | null;
    reminder_days: number;
  }): Promise<number> {
    return await this.insert({
      user: input.user_id,
      title: input.title,
      description: input.description,
      start_date: input.start_date,
      end_date: input.end_date,
      currency: input.currency,
      cover_image: input.cover_image,
      is_archived: 0,
      reminder_days: input.reminder_days,
    });
  }

  /**
   * TP25 (`trips.service.ts::updateTrip`) — `UPDATE trips SET title=?,
   * description=?, start_date=?, end_date=?, currency=?, is_archived=?,
   * cover_image=?, reminder_days=?, updated_at=CURRENT_TIMESTAMP WHERE
   * id=?`. The `||`/`!== undefined` pre-image fallbacks are the SERVICE's
   * own (R5/§18.6 — this write stays OUTSIDE the days-regeneration
   * transaction, unchanged); this takes the final, already-decided values
   * and writes them verbatim, `updated_at` stamped unconditionally like the
   * legacy statement. Named `updateTripRow` (not `updateTrip`, the
   * deliverable list's own name) to keep it unambiguous next to
   * `TripsService.updateTrip`, which calls it.
   *
   * `is_archived: number | null` (Task 7 security review L1, absorbed here
   * — not `number`): the caller's own pre-image fallback
   * (`data.is_archived !== undefined ? … : trip.is_archived`) can legitimately
   * be `null` (a stored `NULL` the request never touched), and the legacy
   * statement bound that value through unfolded — a `number`-only signature
   * here would tempt a caller to paper over that with its own `?? 0`, the
   * exact regression the review found.
   */
  async updateTripRow(id: number, data: {
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    currency: string;
    is_archived: number | null;
    cover_image: string | null;
    reminder_days: number;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { ...data, updated_at: currentTimestamp(platform) });
  }

  /** TP35 (`trips.service.ts::updateCoverImage`) — `UPDATE trips SET cover_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async setCoverImage(id: number, cover_image: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { cover_image, updated_at: currentTimestamp(platform) });
  }

  /** TP34 (`trips.service.ts::remove`) — `DELETE FROM trips WHERE id = ?` (security-sensitive: cascades the whole trip). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 5 (`FeedsService`) — additive: the anonymous ICS feed token
  // lifecycle. FD1/FD2-4/FD9/FD11 (inventory §5). `trip_id`/`user_id` are
  // always real `number`s here, unlike `findAccessible`/`getTitle`/etc above:
  // the two feed-token REST routes resolve and validate the trip id through
  // `TripAccessGuard` (`@Trip()` hands the controller the already-numeric,
  // already-access-checked `TripAccess.id`) before `FeedsService` ever runs,
  // and the MCP surface's own Zod schema types `tripId` as
  // `z.number().int().positive()` — there is no raw route-string seam to
  // preserve on this file's newest methods the way `findAccessible`'s
  // docstring describes for the pre-existing ones.
  // ---------------------------------------------------------------------------

  /**
   * FD1 (`feeds.service.ts::tripTokenRow`) — `SELECT feed_token FROM trips
   * WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members
   * WHERE user_id = ?))`. R3 (one visibility predicate, one source): reuses
   * `accessibleTripsQuery` above — the SAME join builder `findAccessible`/
   * `listAccessibleIds` already share — rather than re-deriving the
   * "reachable" predicate a third way. `null` covers both "no such trip /
   * not reachable" and "reachable but the column is NULL" on purpose: every
   * caller (`FeedsService.getTripToken`/`generateTripToken`) treats the two
   * identically (no usable token), the same collapse the legacy
   * `row?.feed_token` optional-chain already made.
   */
  async getFeedTokenIfReachable(trip_id: number, user_id: number): Promise<string | null> {
    const row = await this.accessibleTripsQuery(user_id)
      .select(['t.feed_token'])
      .andWhere({ id: trip_id })
      .execute<{ feed_token: string | null } | undefined>('get', false);
    return row ? row.feed_token : null;
  }

  /**
   * FD2/FD3/FD4 (`generateTripToken`/`rotateTripToken`/`disableTripToken`) —
   * ONE method for the three legacy statements (identical text, `token |
   * null` is the only thing that varies): `UPDATE trips SET feed_token = ?
   * WHERE <REACHABLE>`. Returns the affected row count — §18.7's 0-row case
   * (`generateTripToken` still hands back a URL for a token this write never
   * stored, past the guard; R4 mirrors that exactly, unfixed) is now visible
   * to a caller instead of a fire-and-forget `.run()`.
   *
   * `nativeUpdate`, not `accessibleTripsQuery(...).update(...)`: SQLite has
   * no `UPDATE ... JOIN` — chaining `.update()` onto a query builder that
   * already carries `accessibleTripsQuery`'s `.leftJoin()` throws
   * (`near "left": syntax error`, proven directly against a real DB before
   * choosing this shape, not assumed). The typed `FilterQuery` below reaches
   * for the SAME relation the join builder does (`trip_members_collection`,
   * `t.trip_members_collection` in `accessibleTripsQuery`) rather than a
   * hand-rolled string predicate (rule 23): MikroORM detects the to-many
   * relation in the `$or` and auto-rewrites the whole `nativeUpdate` into an
   * `UPDATE trips SET ... WHERE id IN (SELECT id FROM (SELECT DISTINCT t.id
   * FROM trips t LEFT JOIN trip_members t1 ON t.id = t1.trip_id WHERE t.id =
   * ? AND (t.user_id = ? OR t1.user_id = ?)) AS t)` — the legacy statement's
   * `IN`-subquery shape, generated from the identical join, not typed twice.
   * Proven row-identical to `accessibleTripsQuery`/`findAccessible` by
   * TRIPREPO-041's extended cross-method parity matrix (owner/member/
   * stranger/archived).
   */
  async setFeedTokenIfReachable(trip_id: number, user_id: number, token: string | null): Promise<number> {
    return await this.nativeUpdate(
      { id: trip_id, $or: [{ user: user_id }, { trip_members_collection: { user: user_id } }] },
      { feed_token: token },
    );
  }

  /**
   * FD9 (`feeds.service.ts::buildTripIcs`) — `SELECT id FROM trips WHERE
   * feed_token = ?`. The anonymous credential lookup: `token` arrives
   * untrusted, straight from the URL path, with no access check (the token
   * itself IS the access check — `idx_trips_feed_token`'s partial UNIQUE
   * index, `WHERE feed_token IS NOT NULL`, is what makes it a safe credential
   * to look up by at all: a row with a NULL token can never match, so a
   * disabled feed's old URL 404s instead of resolving to whichever trip
   * happens to have a NULL column).
   */
  async findIdByFeedToken(token: string): Promise<number | undefined> {
    const row = await this.findOne({ feed_token: token }, { fields: ['id'] });
    return row?.id;
  }

  /**
   * FD11 (`feeds.service.ts::buildUserIcs`) — `SELECT id FROM trips WHERE
   * (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id =
   * ?)) AND is_archived = 0 AND (end_date IS NULL OR end_date >= ?) ORDER BY
   * start_date ASC`. The scope of the anonymous all-trips feed: reachable
   * (`accessibleTripsQuery`, R3 again), unarchived, not yet ended (or
   * undated). Named `listReachableActiveTrips` per the task brief's ruling.
   */
  async listReachableActiveTrips(user_id: number, cutoff: string): Promise<number[]> {
    const rows = await this.accessibleTripsQuery(user_id)
      .select(['t.id'])
      .andWhere({ is_archived: 0 })
      .andWhere({ $or: [{ end_date: null }, { end_date: { $gte: cutoff } }] })
      .orderBy({ 't.start_date': 'asc' })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 5 (`PublicApiService`) — additive: the trip reads on 3d
  // (public-api joins Plan 3d for its reads on 3d tables, R3/§14.6). All
  // three convert an existing `public-api.service.ts` statement in place;
  // `reservations`/`day_accommodations` statements in that file stay raw
  // (Tasks 2/3 own those tables and had not landed when this task ran — see
  // the task report).
  // ---------------------------------------------------------------------------

  /**
   * `PublicApiService.listTrips`'s statement — `SELECT id, title,
   * description, start_date, end_date, currency, is_archived, updated_at
   * FROM trips WHERE id IN (...) ORDER BY start_date DESC, id DESC`. `ids`
   * is already the caller's own access-checked list
   * (`TripMembershipService.listAccessibleTripIds`, unchanged, not this
   * plan's file) — this method does no access check of its own, matching
   * the legacy statement, which trusted the same pre-filtered id list.
   */
  async listSummariesByIds(ids: number[]): Promise<TripSummaryProjectionRow[]> {
    if (ids.length === 0) return [];
    return this.qb('t')
      .select(['t.id', 't.title', 't.description', 't.start_date', 't.end_date', 't.currency', 't.is_archived', 't.updated_at'])
      .where({ id: { $in: ids } })
      .orderBy({ start_date: 'desc', id: 'desc' })
      .execute<TripSummaryProjectionRow[]>('all', false);
  }

  /**
   * `PublicApiService.getTrip`'s row read — the SAME 8-column projection as
   * `listSummariesByIds` above, for one trip. The caller's own
   * `db.canAccessTrip` check (unchanged, a different file) runs first; this
   * method, like the legacy statement it replaces, does no access check.
   */
  async findSummaryById(id: number): Promise<TripSummaryProjectionRow | null> {
    const row = await this.qb('t')
      .select(['t.id', 't.title', 't.description', 't.start_date', 't.end_date', 't.currency', 't.is_archived', 't.updated_at'])
      .where({ id })
      .execute<TripSummaryProjectionRow | undefined>('get', false);
    return row ?? null;
  }

  /**
   * `share.service.ts:264` SH7 (`getSharedTripData`) — `SELECT id, title,
   * description, start_date, end_date, cover_image, currency FROM trips
   * WHERE id = ?`. A different 7-column public projection from
   * `TripSummaryProjectionRow`'s 8 above (`cover_image` in, `is_archived`/
   * `updated_at` out — a public share-link viewer never sees either). No
   * access check here, matching the legacy statement — the caller's own
   * `verifyTripAccess`/token validity gates this read.
   *
   * `id: number` (Plan 4 Task 8a, rule 23): unlike `findAccessible`/
   * `isOwner`, this is never on the guard's raw-`req.params` path — its one
   * caller (`share.service.ts#getSharedTripData`) passes `shareRow.trip_id`,
   * a `number` straight off a Kysely-typed `share_tokens` row, never an
   * unconverted URL param — so the `number | string` raw-bind seam those
   * two methods' own docstrings describe does not apply here, and this one
   * narrows to a typed filter now rather than waiting on that seam's guard-
   * level parse (deferred, out of this task's scope).
   */
  async findPublicForShare(id: number): Promise<TripPublicShareRow | undefined> {
    return await this.qb('t')
      .select(['t.id', 't.title', 't.description', 't.start_date', 't.end_date', 't.cover_image', 't.currency'])
      .where({ 't.id': id })
      .execute<TripPublicShareRow | undefined>('get', false);
  }

  /**
   * `PublicApiService.buildTravellers`'s statement — the owner row (a
   * literal `1 AS is_owner`) `UNION ALL` every member row (`0 AS is_owner`),
   * `ORDER BY is_owner DESC`. A QueryBuilder `UNION ALL` of two different
   * FROMs has no single alias to chain a `.select()`/`.where()` off (unlike
   * `accessibleTripsQuery`'s single-FROM join), so this is Kysely
   * (`this.kysely()`, the same escape hatch `tripSelectQuery`'s own
   * docstring documents) — `eb.val<number>(1)`/`eb.val<number>(0)` for the
   * two literal branches, the same construct `tripSelectQuery`'s `NULL AS
   * feed_token` already uses in this file.
   */
  async listTravellerUsernames(trip_id: number): Promise<TravellerUsernameRow[]> {
    const owner = this.kysely<TravellerUsernameKyselyDB>()
      .selectFrom('trips as t')
      .innerJoin('users as u', 'u.id', 't.user_id')
      .select((eb) => ['u.username as username', eb.val<number>(1).as('is_owner')])
      .where('t.id', '=', trip_id);
    const member = this.kysely<TravellerUsernameKyselyDB>()
      .selectFrom('trip_members as m')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .select((eb) => ['u.username as username', eb.val<number>(0).as('is_owner')])
      .where('m.trip_id', '=', trip_id);
    const rows = await owner.unionAll(member).orderBy('is_owner', 'desc').execute();
    return rows as TravellerUsernameRow[];
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 2 (budget) — additive, append-only per that task's own
  // file-ownership rule.
  // ---------------------------------------------------------------------------

  /** BG15/BG16/BGM2/BGM3 — `SELECT currency FROM trips WHERE id = ?`, four legacy call sites, one statement. */
  async getCurrency(id: number | string): Promise<string | null | undefined> {
    const row = await this.kysely<{ trips: { id: number; currency: string | null } }>()
      .selectFrom('trips')
      .select('currency')
      .where('id', '=', id as number)
      .executeTakeFirst();
    return row?.currency;
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 4 (`ReminderJobsService`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * RJ2 (`reminder-jobs.service.ts`'s boot banner, inside `runOnBoot`) —
   * `SELECT COUNT(*) as c FROM trips WHERE reminder_days > 0 AND start_date
   * IS NOT NULL`.
   */
  async countActiveWithReminders(): Promise<number> {
    return this.count({ reminder_days: { $gt: 0 }, start_date: { $ne: null } });
  }

  /**
   * RJ3 (`reminder-jobs.service.ts#tripTick`) — restructured per Task 0's R9
   * ruling: the legacy statement concatenated a per-row COLUMN
   * (`t.reminder_days`) into a `date('now', '+' || t.reminder_days || '
   * days')` modifier, which no bound-parameter or JS-constant-spelled helper
   * can express. This narrows the SQL read to the same WHERE minus the date
   * comparison (`SELECT t.id, t.title, t.user_id, t.reminder_days,
   * t.start_date FROM trips t WHERE t.reminder_days > 0 AND t.start_date IS
   * NOT NULL`); the caller (`ReminderJobsService.tripTick`) does the
   * per-row date-equality check in JS against `start_date`, per R9's exact
   * verified shape.
   */
  async listReminderCandidates(): Promise<TripReminderCandidateRow[]> {
    return await this.qb('t')
      .select(['t.id', 't.title', 't.user', 't.reminder_days', 't.start_date'])
      .andWhere({ reminder_days: { $gt: 0 }, start_date: { $ne: null } })
      .execute<TripReminderCandidateRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 6 (`SystemNoticesService`) — additive.
  // ---------------------------------------------------------------------------

  /** SN3 (`systemNotices/service.ts`'s former `getActiveNoticesFor`) — `SELECT COUNT(*) AS count FROM trips WHERE user_id = ?`, feeding the `noTrips` condition kind. */
  async countForUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 1 (`AtlasService`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * AT1 (`AtlasService#getUserTrips`, the join every other atlas read
   * relies on transitively) — `SELECT DISTINCT t.* FROM trips t LEFT JOIN
   * trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.user_id =
   * ? OR m.user_id = ? ORDER BY t.start_date DESC`. Reuses
   * `accessibleTripsQuery` (Plan 3c Task 1) rather than re-deriving the
   * join: its `m.user: { $ne: null }` half is the LEFT-JOIN-then-`IS NOT
   * NULL` spelling of the legacy `m.user_id = ?` — the join's own `ON …
   * AND m.user_id = ?` already restricts every matched `m` row to this
   * user, so the two WHERE spellings pick out the identical row set. No
   * explicit `.distinct()`: `TripMembers`' own `uniques: [['trip','
   * user']]` constraint means at most one `m` row per `(trip, user)`, so
   * the join can never fan a `t` row out to more than one result row.
   */
  async listOwnedOrMember(user_id: number): Promise<TripRawRow[]> {
    return await this.accessibleTripsQuery(user_id)
      .select(['t.*'])
      .orderBy({ 't.start_date': 'desc' })
      .execute<TripRawRow[]>('all', false);
  }

  /**
   * AT39 (`AtlasService#lastTrip`) — `SELECT t.id, t.title, t.start_date,
   * t.end_date FROM trips t LEFT JOIN trip_members tm ON t.id = tm.trip_id
   * WHERE (t.user_id = ? OR tm.user_id = ?) AND COALESCE(t.start_date,
   * t.end_date) IS NOT NULL AND COALESCE(t.start_date, t.end_date) <=
   * date('now') ORDER BY COALESCE(t.end_date, t.start_date) DESC, t.id DESC
   * LIMIT 1`. `today` (`date('now')`, UTC) is resolved by the caller once
   * (`todayUtc()`) and bound here — the `activeTrip(user_id, today)`
   * precedent above for a literal `date('now')` comparison.
   */
  async lastStartedTrip(user_id: number, today: string): Promise<{ id: number; title: string; start_date: string | null; end_date: string | null } | undefined> {
    return await this.kysely<LastStartedTripKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('trip_members as tm', 'tm.trip_id', 't.id')
      .select(['t.id', 't.title', 't.start_date', 't.end_date'])
      .where((eb) => eb.or([eb('t.user_id', '=', user_id), eb('tm.user_id', '=', user_id)]))
      .where((eb) => eb(eb.fn.coalesce('t.start_date', 't.end_date'), 'is not', null))
      .where((eb) => eb(eb.fn.coalesce('t.start_date', 't.end_date'), '<=', today))
      .orderBy((eb) => eb.fn.coalesce('t.end_date', 't.start_date'), 'desc')
      .orderBy('t.id', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * AT47 (`AtlasService#nextTrip`, #2542) — `SELECT t.id, t.title,
   * t.start_date, t.end_date FROM trips t LEFT JOIN trip_members tm ON t.id =
   * tm.trip_id WHERE (t.user_id = ? OR tm.user_id = ?) AND t.start_date IS NOT
   * NULL AND t.start_date > date('now') ORDER BY t.start_date ASC, t.id ASC
   * LIMIT 1`. `today` is bound like {@link lastStartedTrip}'s; the legacy
   * `days_until` column (`CAST(julianday(start_date) - julianday(date('now'))
   * AS INTEGER)`) is computed by the caller from the same `today`.
   */
  async nextUpcomingTrip(user_id: number, today: string): Promise<{ id: number; title: string; start_date: string; end_date: string | null } | undefined> {
    const row = await this.kysely<LastStartedTripKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('trip_members as tm', 'tm.trip_id', 't.id')
      .select(['t.id', 't.title', 't.start_date', 't.end_date'])
      .where((eb) => eb.or([eb('t.user_id', '=', user_id), eb('tm.user_id', '=', user_id)]))
      .where('t.start_date', 'is not', null)
      .where('t.start_date', '>', today)
      .orderBy('t.start_date', 'asc')
      .orderBy('t.id', 'asc')
      .limit(1)
      .executeTakeFirst();
    return row as { id: number; title: string; start_date: string; end_date: string | null } | undefined;
  }

  /**
   * AT42 (`AtlasService#getTravelStats`) — `SELECT COUNT(DISTINCT t.id) as
   * trips, COUNT(DISTINCT d.id) as days FROM trips t LEFT JOIN days d ON
   * d.trip_id = t.id LEFT JOIN trip_members tm ON t.id = tm.trip_id WHERE
   * (t.user_id = ? OR tm.user_id = ?)`. Archived trips still count (the
   * legacy statement's own doc comment, `atlas.service.ts:1049-1051`) — no
   * `is_archived` filter here, on purpose.
   */
  async countTripsAndDaysForUser(user_id: number): Promise<{ trips: number; days: number }> {
    const row = await this.kysely<CountTripsAndDaysKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('days as d', 'd.trip_id', 't.id')
      .leftJoin('trip_members as tm', 'tm.trip_id', 't.id')
      .select((eb) => [eb.fn.count<number>('t.id').distinct().as('trips'), eb.fn.count<number>('d.id').distinct().as('days')])
      .where((eb) => eb.or([eb('t.user_id', '=', user_id), eb('tm.user_id', '=', user_id)]))
      .executeTakeFirst();
    return { trips: Number(row?.trips ?? 0), days: Number(row?.days ?? 0) };
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 3 (`DawarichSyncService`/`DawarichTracksService`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * DSY2 (`dawarich-sync.service.ts::listTripsToSync`) — `SELECT DISTINCT
   * t.id, t.start_date, t.end_date FROM trips t LEFT JOIN trip_members m ON
   * m.trip_id = t.id AND m.user_id = ? WHERE (t.user_id = ? OR m.user_id IS
   * NOT NULL) AND COALESCE(t.is_archived, 0) = 0 AND t.start_date IS NOT
   * NULL AND (t.end_date IS NULL OR t.end_date >= date('now', '-400 days'))
   * AND t.start_date <= date('now', '+1 day') ORDER BY t.start_date DESC`.
   * `accessibleTripsQuery` for the LEFT JOIN/OR half (the same join builder
   * `findAccessible`/`listReachableActiveTrips` share); `coalesceParam` for
   * the `COALESCE(is_archived, 0) = 0` guard (mirrors a nullable column the
   * same way the legacy statement does, even though `is_archived` is
   * effectively never NULL in practice); `nowDateOffset` (Task 0) for both
   * `date('now', …)` literal-offset forms — expressible entirely through
   * the QueryBuilder, so no `nowDateOffsetKysely` twin was needed for this
   * site (Task 0's own CONTROLLER NOTE flagged this as a possibility, not a
   * certainty).
   */
  async listTripsToSync(user_id: number): Promise<{ id: number; start_date: string | null; end_date: string | null }[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.accessibleTripsQuery(user_id)
      .select(['t.id', 't.start_date', 't.end_date'], true)
      .andWhere({ [coalesceParam(platform, 'is_archived', 0)]: 0 })
      .andWhere({ start_date: { $ne: null } })
      .andWhere({ $or: [{ end_date: null }, { end_date: { $gte: nowDateOffset(platform, -400) } }] })
      .andWhere({ start_date: { $lte: nowDateOffset(platform, 1) } })
      .orderBy({ 't.start_date': 'desc' })
      .execute<{ id: number; start_date: string | null; end_date: string | null }[]>('all', false);
  }

  /** DTR1 (`dawarich-tracks.service.ts::forTrip`) — `SELECT start_date, end_date FROM trips WHERE id = ?`. */
  async findDatesById(id: number): Promise<{ start_date: string | null; end_date: string | null } | undefined> {
    return await this.qb('t')
      .select(['t.start_date', 't.end_date'])
      .where({ id })
      .execute<{ start_date: string | null; end_date: string | null } | undefined>('get', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (`registration-invites.service.ts::listTripsForInvite`) —
  // additive, per the class's own docstring pointing at this precondition
  // ("Plan 3c is the one that builds a TripsRepository") now being met.
  // ---------------------------------------------------------------------------

  /**
   * RI2 — `SELECT id, title FROM trips ORDER BY title COLLATE NOCASE ASC`
   * (the admin invite dialog's trip picker). Kysely, `PlacesRepository
   * .listImportable`'s precedent: `ORDER BY … COLLATE NOCASE` is Kysely's
   * own `OrderByItemBuilder.collate('nocase')`, a portable Kysely builder
   * API, not a raw SQLite fragment — no `sql-functions.ts` helper needed.
   */
  async listIdTitleOrderedByTitle(): Promise<{ id: number; title: string }[]> {
    return await this.kysely<TripIdTitleKyselyDB>()
      .selectFrom('trips')
      .select(['id', 'title'])
      .orderBy('title', (ob) => ob.collate('nocase').asc())
      .execute();
  }
}

/** {@link TripsRepository.listIdTitleOrderedByTitle}'s narrow `trips` shape. */
interface TripIdTitleKyselyDB {
  trips: { id: number; title: string };
}

/** {@link TripsRepository.lastStartedTrip}'s and {@link TripsRepository.nextUpcomingTrip}'s narrow `trips`/`trip_members` shape. */
interface LastStartedTripKyselyDB {
  trips: { id: number; title: string; start_date: string | null; end_date: string | null; user_id: number };
  trip_members: { trip_id: number; user_id: number };
}

/** {@link TripsRepository.countTripsAndDaysForUser}'s narrow `trips`/`days`/`trip_members` shape. */
interface CountTripsAndDaysKyselyDB {
  trips: { id: number; user_id: number };
  days: { id: number; trip_id: number };
  trip_members: { trip_id: number; user_id: number };
}

/** {@link TripsRepository.listReminderCandidates}'s row — `t.user` selected bare (not joined here), so it aliases to the physical `user_id` column per `findAccessible`'s documented precedent. */
export interface TripReminderCandidateRow {
  id: number;
  title: string;
  user_id: number;
  reminder_days: number;
  start_date: string;
}

/** `PublicApiService.listTrips`/`getTrip`'s 8-column trip projection. */
export interface TripSummaryProjectionRow {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string | null;
  is_archived: number | null;
  updated_at: string | null;
}

/** {@link TripsRepository.findPublicForShare}'s projection (SH7). */
export interface TripPublicShareRow {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  currency: string | null;
}

/** `PublicApiService.buildTravellers`'s output row. */
export interface TravellerUsernameRow {
  username: string;
  is_owner: number;
}

/** The narrow `trips`/`users`/`trip_members` shape `listTravellerUsernames` needs. */
interface TravellerUsernameKyselyDB {
  trips: { id: number; user_id: number };
  users: { id: number; username: string };
  trip_members: { id: number; trip_id: number; user_id: number };
}
