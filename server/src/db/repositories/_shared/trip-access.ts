import type { ExpressionBuilder, ExpressionWrapper, ReferenceExpression, SqlBool } from 'kysely';

/**
 * The trip-access predicate — "can `userId` see this trip?" — as ONE Kysely
 * boolean expression, generic over the caller's own `<DB, TB>` (the same
 * fully-generic shape `reservation-visibility.ts`'s `publicReservationExpr`
 * uses, for the identical reason: this predicate has no correlated
 * subquery, so nothing forces the narrower fixed-alias shape
 * `publicStayExists` needs).
 *
 * Byte-for-byte the SAME boolean `Trips.repository.ts`'s MikroORM
 * QueryBuilder helper `accessibleTripsQuery` renders (`findAccessible`'s own
 * canonical shape, per Plan 4 Task 8a): `t.user_id = ? OR m.user_id IS NOT
 * NULL`, where `m` is a `LEFT JOIN trip_members ON m.trip_id = t.id AND
 * m.user_id = ?` the caller has already built. This file does not (and
 * cannot, per `tripSelectQuery`'s own docstring on why a shared join helper
 * can't be typed across differently-joined outer queries) unify the JOIN
 * itself — only the WHERE boolean that follows it, which is the part that
 * was actually duplicated three times by hand in this program (Task 7
 * security review M1 / TRIPREPO-041): `TripsRepository.findForViewer`,
 * `.listForUser` and `.activeTrip` each re-typed the identical
 * `eb.or([eb('t.user_id', '=', user_id), eb('m.user_id', 'is not', null)])`
 * independently. Proven identical to the MikroORM form and across all three
 * Kysely call sites by `TRIPREPO-041`'s cross-method access-parity test,
 * which stays green as this refactor's own regression guard (its own
 * comment already said a future unification pass should).
 *
 * `tripUserIdRef`/`memberUserIdRef` are the caller's own already-aliased
 * column references (`'t.user_id'`, `'m.user_id'` at every known call site
 * today) — passed in, not hard-coded, so this helper stays usable if a
 * future caller joins under different aliases, the same reasoning
 * `publicReservationExpr`'s own `ref` parameter gives.
 */
export function tripAccessExpr<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  tripUserIdRef: ReferenceExpression<DB, TB>,
  memberUserIdRef: ReferenceExpression<DB, TB>,
  userId: number,
): ExpressionWrapper<DB, TB, SqlBool> {
  return eb.or([eb(tripUserIdRef, '=', userId), eb(memberUserIdRef, 'is not', null)]);
}
