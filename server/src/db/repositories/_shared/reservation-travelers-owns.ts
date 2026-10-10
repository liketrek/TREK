import type { DB } from '../../kysely/db';

import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from 'kysely';

/**
 * The `TRAVELER_OWNS` predicate atlas's `AtlasService` inlines as a
 * `private static readonly` string fragment (`atlas.service.ts:1173-1175`,
 * quoted here as this file's own oracle, the same "hold the STRING side
 * fixed and independent of the production code it is proving" reasoning
 * `reservation-visibility.ts`/`packing-visibility.ts` document) — ONE
 * shared, typed predicate for the three call sites (AT6/AT45/AT46) that all
 * inline it today (Plan 3f Task 0, R7):
 *
 * ```
 * (
 *   NOT EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id)
 *   OR EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id AND rt.user_id = ?)
 * )
 * ```
 *
 * Binds exactly one parameter (the caller's own user id) and expects the
 * reservation aliased `r` — every one of AT6/AT45/AT46 already uses that
 * alias for `reservations` in its `FROM`/`JOIN` clause, so both typed forms
 * below fix it too rather than taking an arbitrary alias parameter (the
 * `ReservationVisibilityKyselyDB & { a: { id: number } }` precedent
 * `publicStayExists` sets for a single, real, already-fixed alias — not
 * `reservation-visibility.ts`'s RV1 shape, which genuinely serves more than
 * one alias in production, `r` AND `vr`).
 *
 * **Backward-compat critical (#1966).** A reservation with ZERO
 * `reservation_travelers` rows — every booking made before 4.0, before
 * per-traveler assignment existed at all — must still count for the WHOLE
 * trip (the `NOT EXISTS` arm). Only once at least one assignment row exists
 * does the second arm narrow the reservation to "assigned to me". Getting
 * this backwards either double-counts a shared trip's flights per member
 * (if the `NOT EXISTS` arm is dropped or inverted) or zeroes every pre-4.0
 * install's flown distance overnight (if the `EXISTS` arm is applied
 * without the `NOT EXISTS` fallback) — the single highest-blast-radius
 * predicate in this plan, per the plan's own risk list. **No consumer
 * converts in this task** (the brief, item 5) — Task 1 (atlas) is the only
 * consumer, at AT6/AT45/AT46, and reuses this file's own parity harness
 * (`reservation-travelers-owns.parity.test.ts`) rather than re-deriving it.
 *
 * **Two shapes, not three** (unlike `reservation-visibility.ts`'s RV1/RV2
 * split) — `TRAVELER_OWNS` is ONE OR-chain of two arms, always evaluated
 * against the same, always-aliased-`r` `reservations` row, so there is no
 * second alias shape or second predicate to support the way RV1/RV2 needed.
 *
 * - `travelerOwnsCondition` — a typed MikroORM QueryBuilder filter-object
 *   condition, spreadable into any `.where({...})` call against `Reservations`
 *   (or any query whose base/joined entity is `Reservations`, referenced by
 *   its `reservation_travelers_collection` relation property — a genuine
 *   `p.oneToMany(ReservationTravelers).mappedBy('reservation')` relation,
 *   `Reservations.entity.ts:103`, unlike RV2's blocker where
 *   `reservations.accommodation_id` has no FK/relation at all to join
 *   through). Built with MikroORM's own collection operators (`$none`/`$some`
 *   — "collection operators, sql only", `node_modules/@mikro-orm/core/enums.d.ts`'s
 *   `QueryOperator` — verified directly, not assumed: `$exists` is a
 *   DIFFERENT operator that renders `IS NOT NULL` for an embeddable/JSON
 *   path, not a correlated subquery, which is exactly why RV2 has no QB
 *   form at all), which MikroORM's SQL query compiler
 *   (`node_modules/@mikro-orm/sql/query/ObjectCriteriaNode.js`) renders as
 *   `<pk> IN (SELECT <pk> FROM reservations INNER JOIN reservation_travelers
 *   rt ON … WHERE rt.user_id = ?)` for `$some` and `<pk> NOT IN (SELECT <pk>
 *   FROM reservations INNER JOIN reservation_travelers rt ON …)` for
 *   `$none` — a semicolon-for-semicolon DIFFERENT SQL shape from the legacy
 *   correlated `NOT EXISTS`/`EXISTS` text, but row-identical on every input
 *   (an `IN`/`NOT IN` against a `INNER JOIN`-then-`SELECT pk` subquery
 *   selects exactly the same primary-key set a correlated `EXISTS` would),
 *   proven directly by this file's own parity harness rather than assumed
 *   equivalent from the operator names alone.
 * - `travelerOwnsExpr` — the Kysely-expression twin, for a caller building a
 *   raw, multi-join statement through `this.kysely()` rather than the
 *   MikroORM QueryBuilder (AT6/AT45/AT46 are exactly this shape — large,
 *   multi-table `JOIN` aggregates with `CASE WHEN` projections, never a
 *   plain `em.createQueryBuilder(Reservations, 'r')` a QB filter object could
 *   spread into on its own). Spelled as a genuine correlated `EXISTS`/`NOT
 *   EXISTS` pair, matching the legacy fragment's own shape token-for-token —
 *   the same "no ORM relation to join those rows the QueryBuilder could
 *   filter through" reasoning `publicStayExists` documents, even though a
 *   relation DOES exist here (Kysely never uses MikroORM's entity relations
 *   at all — it is a separate, relation-unaware SQL builder).
 *
 * Both forms are proven identical to the legacy fragment on the two cases
 * that matter (a reservation with zero `reservation_travelers` rows; a
 * reservation with assignments, narrowed to the caller's own) by
 * `reservation-travelers-owns.parity.test.ts` in this directory.
 */

export function travelerOwnsCondition(userId: number) {
  return {
    $or: [
      { reservation_travelers_collection: { $none: {} } },
      { reservation_travelers_collection: { $some: { user: userId } } },
    ],
  };
}

/**
 * `reservation_travelers`/`reservations`' REAL table names, the tables
 * `travelerOwnsExpr` needs (fixed alias `r` for `reservations`: see this
 * file's module docstring for why, unlike RV1's genuinely-multi-alias
 * shape). A consumer's own alias satisfies this by intersecting it, the same
 * `ReservationVisibilityKyselyDB`/`PackingVisibilityKyselyDB` precedent.
 */
export type ReservationTravelersOwnsKyselyDB = Pick<DB, 'reservation_travelers' | 'reservations'>;

/**
 * `TRAVELER_OWNS` as a Kysely predicate: `(NOT EXISTS (…) OR EXISTS (… AND
 * rt.user_id = ?))`, correlated on `rt.reservation_id = r.id`. Call inside a
 * `.where((eb) => travelerOwnsExpr(eb, userId))` on a query already carrying
 * an `r` alias for `reservations` (a base `.selectFrom('reservations as
 * r')`, or `reservations` joined in as `r` — both produce the same aliased
 * `r: { id: number }` member Kysely's type inference needs) against a
 * `Kysely<DB>` whose `DB` satisfies `ReservationTravelersOwnsKyselyDB`. The
 * parameter type is fixed to exactly that shape rather than generic over an
 * arbitrary caller `DB`/`TB`, the same `publicStayExists` precedent and for
 * the same reason (`Trips.repository.ts`'s `tripSelectQuery` docstring: a
 * shared Kysely helper generic across differently-shaped outer queries
 * doesn't compose), proven end-to-end by this file's own parity-harness
 * test rather than assumed from the type signature alone.
 */
export function travelerOwnsExpr(
  eb: ExpressionBuilder<ReservationTravelersOwnsKyselyDB & { r: { id: number } }, 'r'>,
  userId: number,
): ExpressionWrapper<ReservationTravelersOwnsKyselyDB & { r: { id: number } }, 'r', SqlBool> {
  const forThisReservation = eb
    .selectFrom('reservation_travelers as rt')
    .select('rt.reservation_id')
    .whereRef('rt.reservation_id', '=', 'r.id');

  return eb.or([eb.not(eb.exists(forThisReservation)), eb.exists(forThisReservation.where('rt.user_id', '=', userId))]);
}
