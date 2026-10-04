import type { Platform } from '@mikro-orm/core';
import type { ExpressionBuilder, ExpressionWrapper, ReferenceExpression, SqlBool } from 'kysely';
import { coalesceParam } from '../../dialect/sql-functions';

/**
 * The visibility predicate an anonymous viewer's reads are filtered
 * through — ONE source, typed, for `reservations`/`day_accommodations`
 * (Plan 3d Task 0, R3).
 *
 * Derived from the two legacy SQL-fragment builders this file superseded
 * (`src/nest/reservations/reservation-visibility.ts`'s `publicReservationSql`
 * and `publicStaySql` — DELETED by Plan 3d Task 4, once calendar and
 * `share` were the string form's only remaining consumers and both were
 * converted in the same commit: no two live implementations of an
 * anonymous-surface security predicate, §18.2):
 *
 * - **RV1** `publicReservationSql(alias)` — `` COALESCE(${alias}.ingest_state,
 *   'live') <> 'staged' ``. A reservation is public unless an automated
 *   ingest staged it for review.
 * - **RV2** `publicStaySql(alias)` — a stay is public when nothing points at
 *   it (added by hand), or when a LIVE booking does:
 *   `(NOT EXISTS (…) OR EXISTS (… AND <RV1>))`, correlated on
 *   `CAST(vr.accommodation_id AS INTEGER) = ${alias}.id` (`accommodation_id`
 *   is TEXT with no FK, §18.1 — some rows read back as `"14.0"`).
 *
 * THREE shapes are exported, because RV1 alone needs two different query
 * APIs and RV2 needs a third that calls back into one of them. RV1 has no
 * correlated subquery, so where a caller already holds a MikroORM
 * QueryBuilder it renders as a typed filter OBJECT
 * (`publicReservationCondition`) — spreadable into any `.where({...})`
 * call at any table alias, exactly like the legacy fragment builder's own
 * runtime-alias shape, no compile-time table binding needed (rule 23: a
 * typed condition, not a string). Where a caller is instead building a raw,
 * multi-join statement through `this.kysely()` (CL2/CL7/`share`'s reads —
 * no ORM relation exists to join those rows through the QueryBuilder at
 * all), RV1 is `publicReservationExpr`, a Kysely expression-builder
 * predicate. RV2's NOT EXISTS/EXISTS pair has no MikroORM QueryBuilder
 * expression either (no relation exists from `day_accommodations` to
 * `reservations` via `accommodation_id` — R10 keeps it that way; QB's
 * `$exists` operator checks embeddable/JSON path existence, not a
 * correlated SQL subquery), so it is built with Kysely's own typed
 * `ExpressionBuilder` (`publicStayExists`) — `eb.exists`/`eb.not` (Kysely's
 * `unary('exists'|'not', …)` shortcuts), `eb.cast`, and `publicReservationExpr`
 * itself for its own inner RV1 check, all fully typed, never a `raw()` call
 * or a `sql` tagged template (both banned under `src/db/repositories/**` by
 * ESLint's `no-restricted-syntax`, checked directly against
 * `server/eslint.config.mjs`).
 *
 * **`publicStayExists` is deliberately narrow, not maximally generic** —
 * `ReservationVisibilityKyselyDB` fixes the two aliases every known
 * caller already uses (`a` for the outer stay row, `vr` for the
 * correlated reservations lookup — "Alias interpolation is a
 * caller-supplied constant ('r', 'vr', 'a'); never user input", inventory
 * §2d). `Trips.repository.ts`'s `tripSelectQuery` docstring records why a
 * shared Kysely helper across differently-joined outer queries doesn't
 * compose well ("a shared private helper can't be typed across these four
 * callbacks either… `leftJoin`'s alias widens each callback's own
 * `ExpressionBuilder` table-set in a way a separate generic method
 * signature can't match structurally") — the same limitation would bite a
 * predicate meant to serve arbitrarily-different outer queries. This
 * function instead requires exactly one contract: the caller's outer query
 * is built with `.selectFrom('day_accommodations as a')` (or any
 * `.selectFrom`/`.leftJoin` chain that puts an `a` alias with an `id`
 * column into scope) and a `reservations` table exists in the same `DB`
 * interface. A consumer whose own local Kysely `DB` interface satisfies
 * `ReservationVisibilityKyselyDB` structurally can pass its `eb` straight
 * through, extending its interface with `& ReservationVisibilityKyselyDB`
 * if needed (the same additive-intersection shape
 * `AssignmentTimeSortKyselyDB`/`RoadtripVisitsKyselyDB` already use for
 * their own narrow, per-query interfaces) — proven end-to-end (not just
 * typechecked) by this file's own test and by the string-vs-predicate
 * parity harness (`tests/unit/db/repositories/_shared/reservation-visibility.test.ts`),
 * which Tasks 2/4/5 reuse rather than re-derive.
 *
 * `ingest_state` visibility is deliberately NOT filtered for authenticated
 * reads (`reservation-visibility.ts`'s own docstring: "the staging inbox
 * has to see its own rows, or nobody can confirm them") — these two
 * exports exist ONLY for the two anonymous surfaces (the ICS feeds,
 * `share`) that need it; nothing in this file changes an authenticated
 * list.
 */

/**
 * RV1 as a typed QB filter-object condition:
 * `COALESCE(<alias>.ingest_state, 'live') <> 'staged'`. Spread into a
 * `.where({...})` call — `{ ...publicReservationCondition(platform, 'r'),
 * trip_id: tripId }` — at any table alias the caller's own query already
 * established; this needs no compile-time table binding, the same way
 * `coalesceParam` itself needs none (its `ref` argument is validated only
 * by `column()`'s identifier-shape regex, not against a live entity's
 * declared columns).
 */
export function publicReservationCondition(platform: Platform, alias: string) {
  return { [coalesceParam(platform, `${alias}.ingest_state`, 'live')]: { $ne: 'staged' } };
}

/**
 * RV1 as a Kysely predicate (L2, Plan 3d Task 0 review): the SAME
 * `COALESCE(<ref>, 'live') <> 'staged'` boolean, spelled through the
 * expression builder instead of a QB filter object — for the raw-SQL-shaped
 * statements CL2/CL7/`share.service.ts`'s reads convert onto (no ORM
 * relation joins those rows the QueryBuilder could filter through, so they
 * are built with `this.kysely()`, same as `publicStayExists` below).
 * `ref` is the caller's own already-aliased `ingest_state` column
 * (`'r.ingest_state'`, `'vr.ingest_state'`) — generic over `<DB, TB>`
 * (unlike `publicStayExists`, this needs no correlated subquery and no
 * table-set beyond whatever the caller already has in scope, so nothing
 * forces a narrow, non-generic signature the way `publicStayExists`'s
 * `ExpressionBuilder<ReservationVisibilityKyselyDB & { a: … }, 'a'>` does).
 * `publicStayExists` below calls this rather than re-spelling the
 * `COALESCE`/`<>` pair a second time — ONE implementation of RV1, not two
 * (the Task 0 review's own finding, L2).
 */
export function publicReservationExpr<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  ref: ReferenceExpression<DB, TB>,
): ExpressionWrapper<DB, TB, SqlBool> {
  return eb(eb.fn.coalesce(ref, eb.val('live')), '<>', eb.val('staged'));
}

/**
 * `reservations`/`day_accommodations`'s REAL table names, the shape
 * `publicStayExists` needs. A consumer's own local Kysely `DB` interface
 * (the `AssignmentTimeSortKyselyDB`/`RoadtripVisitsKyselyDB`/
 * `TripSelectKyselyDB` per-query-interface precedent) satisfies this by
 * structural extension — declaring `day_accommodations`/`reservations`
 * with at least these columns is enough; `Kysely<DB>` typed against it and
 * queried via `.selectFrom('day_accommodations as a')` (the fixed alias
 * every known legacy caller uses — see this file's module docstring) is
 * what actually produces the aliased `a` member `publicStayExists`
 * requires; Kysely computes that from THIS interface's `day_accommodations`
 * entry, not from a hand-declared `a` key (a table's alias is a property of
 * the QUERY, never of the `DB` interface itself).
 */
export interface ReservationVisibilityKyselyDB {
  day_accommodations: { id: number };
  reservations: { id: number; accommodation_id: number | string | null; ingest_state: string | null };
}

/**
 * RV2 as a Kysely predicate: `(NOT EXISTS (…) OR EXISTS (… AND <RV1>))`,
 * correlated on `CAST(vr.accommodation_id AS INTEGER) = a.id`. Call inside
 * a `.where((eb) => publicStayExists(eb))` on a query already
 * `.selectFrom('day_accommodations as a')` against a `Kysely<DB>` whose
 * `DB` satisfies `ReservationVisibilityKyselyDB`. The parameter type is
 * fixed to exactly the shape `.selectFrom('day_accommodations as a')`
 * itself produces (`ReservationVisibilityKyselyDB` plus the derived `a`
 * alias member) rather than generic over an arbitrary caller `DB`/`TB` —
 * `Trips.repository.ts`'s `tripSelectQuery` docstring records why a shared
 * Kysely helper generic across differently-shaped outer queries doesn't
 * compose ("a shared private helper can't be typed across these four
 * callbacks either… a separate generic method signature can't match
 * structurally"); this function accepts exactly one contract instead,
 * proven end-to-end by this file's own parity-harness test.
 */
export function publicStayExists(eb: ExpressionBuilder<ReservationVisibilityKyselyDB & { a: { id: number } }, 'a'>) {
  const linkedTo = eb
    .selectFrom('reservations as vr')
    .select('vr.id')
    .where((eb2) => eb2(eb2.cast(eb2.ref('vr.accommodation_id'), 'integer'), '=', eb2.ref('a.id')));

  return eb.or([
    eb.not(eb.exists(linkedTo)),
    eb.exists(linkedTo.where((eb2) => publicReservationExpr(eb2, 'vr.ingest_state'))),
  ]);
}
