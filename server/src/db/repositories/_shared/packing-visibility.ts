import type { Expression, ExpressionBuilder, ExpressionWrapper, SqlBool } from 'kysely';

/**
 * The per-actor visibility predicate packing's three-tier sharing model
 * (#858) runs every restricted read/write through (Plan 3e Task 0, R1) — ONE
 * source, typed, for `packing_items`.
 *
 * Derived byte-for-byte from `PackingService.VISIBLE_TO_ACTOR`
 * (`server/src/nest/packing/packing.service.ts:347-351`, quoted here as the
 * oracle this file's own parity harness proves against without importing
 * it, the same "hold the STRING side fixed and independent of the
 * production code it is proving" reasoning
 * `reservation-visibility.test.ts`'s docstring gives):
 *
 * ```
 * (
 *   is_private = 0
 *   OR owner_id = ?
 *   OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = packing_items.id AND r.user_id = ?)
 * )
 * ```
 *
 * An item is visible to an actor when it is Common (`is_private = 0`,
 * belongs to the whole trip), or the actor is its owner (the "bringer"), or
 * the actor is a named recipient of a Shared-with-people item. This is
 * `getItemInTrip`'s (PK11) entire security model — six call sites
 * (`updateItem`, `setItemSharing`, `addContributor`, `removeContributor`,
 * `cloneItem`, `deleteItem`) and `listItems`' viewer-filtered branch (PK5)
 * all route through it. Per the inventory's §17 surprise 2: "the single
 * highest-blast-radius conversion in the whole plan" — a mistranslation
 * makes every restricted packing item on the instance readable/writable by
 * any trip member. **No consumer converts in this task** (the brief, item
 * 1) — Task 3 (packing) is the only consumer, and reuses this file's own
 * parity harness (`packing-visibility.parity.test.ts`) rather than
 * re-deriving it.
 *
 * **Not a template for `PackingItemsRepository.bagWeightTotals`
 * (PK34/§17 surprise 10).** That aggregate deliberately sums
 * `weight_grams` across every item in a trip regardless of privacy — it
 * must NOT be built on top of either predicate below; building it that way
 * would silently ADD a privacy filter the legacy statement never had,
 * breaking the shared-bag weight-limit warning (the opposite failure mode
 * from the one this file exists to prevent).
 *
 * **No actor collapses to "Common items only", never to "unfiltered".**
 * `getItemInTrip` denies outright when `actorId == null` (its own doc
 * comment: "A missing actor denies too, rather than falling through
 * unfiltered") — that JS-level guard runs before any SQL, so the legacy
 * fragment itself is never actually evaluated with a null actor in
 * production. Both predicates below are proven safe anyway if that guard is
 * ever bypassed (the harness's fourth actor cell): they accept
 * `actorId: number | undefined` and, when it is `undefined`, omit the
 * `owner_id`/recipient clauses from the `OR` entirely rather than binding a
 * literal `null` into them. That is semantically identical to what the
 * legacy fragment does when `?` is bound `NULL` — `owner_id = NULL` and
 * `r.user_id = NULL` are SQL-NULL comparisons, always false, never true —
 * so the `OR` reduces to `is_private = 0` either way. Binding a literal
 * `null` through MikroORM's filter-object DSL was deliberately avoided
 * instead: `{ owner_id: null }` there means `owner_id IS NULL` (a
 * DIFFERENT, wrong predicate — it would make an unowned legacy item visible
 * to a null actor), not `owner_id = NULL`, so the two are not
 * interchangeable and only the "omit the clause" form is safe.
 *
 * **Two shapes, not three** (unlike `reservation-visibility.ts`'s RV1/RV2
 * split): packing's fragment is ONE OR-chain of three arms, always evaluated
 * against the same, always-unaliased `packing_items` table (`PK5`'s
 * `listItems` viewer branch and `PK11`'s `getItemInTrip` both select
 * directly from `packing_items`, no alias) — there is no second alias shape
 * to support the way reservations' `r`/`vr` split needed, so neither
 * predicate below takes an `alias` parameter.
 *
 * - `packingVisibleToActorCondition` — a typed filter-object condition
 *   (inferred, not annotated `FilterQuery<PackingItems>` — that broader
 *   union type includes the bare-primary-key shorthand MikroORM's filter
 *   DSL also accepts, which is not itself a spreadable object type, so
 *   annotating the return type with it breaks the `{ trip_id, ...cond }`
 *   spread every call site needs; the concrete inferred object literal type
 *   has no such member and spreads cleanly, the same reason
 *   `reservation-visibility.ts`'s `publicReservationCondition` leaves its
 *   own return type inferred too), spreadable into any
 *   `em.createQueryBuilder(PackingItems, ...).where({...})` call. Unlike RV2
 *   (`reservation-visibility.ts`'s `publicStayExists`), the
 *   `EXISTS` arm here does NOT need Kysely to express as a QueryBuilder
 *   condition: `PackingItems.packing_item_recipients` is a genuine
 *   `p.manyToMany(Users)` relation over the `packing_item_recipients` pivot
 *   (`PackingItems.entity.ts`), unlike `reservations.accommodation_id`
 *   (RV2's blocker — a plain TEXT column with no FK/relation at all). Filtering
 *   that relation property with a scalar user id inside an `$or` renders as a
 *   `LEFT JOIN packing_item_recipients ... OR p1.user_id = ?` (verified
 *   directly against the compiled query, not assumed — `qb.getFormattedQuery()`
 *   on a seeded fixture) — safe against duplication because `(item_id,
 *   user_id)` is the pivot's own composite `PRIMARY KEY`
 *   (`Migration20200101022900_three_tier_packing_sharing.ts:17-21`), so at
 *   most one matching pivot row can join per item per actor, never fanning a
 *   row out. This is genuinely a `LEFT JOIN`, not an `EXISTS` subquery —
 *   proven row-identical to the legacy fragment by this file's own parity
 *   harness rather than assumed equivalent from the SQL shape alone.
 * - `packingVisibleToActorExpr` — the Kysely-expression twin, for a caller
 *   building a raw, multi-join statement through `this.kysely()` rather than
 *   the MikroORM QueryBuilder. Spelled as a genuine correlated `EXISTS`
 *   (`eb.exists`), matching the legacy fragment's own shape token-for-token,
 *   rather than a join — Kysely has no ORM relation to lean on the way the QB
 *   form does, so this is built the same way `publicStayExists` is.
 *
 * Both forms are proven identical to the legacy fragment AND to each other
 * on the same 12-cell fixture matrix (owner/recipient/stranger/no-actor ×
 * common/personal/shared) by `packing-visibility.parity.test.ts` in this
 * directory.
 */

export function packingVisibleToActorCondition(actorId: number | undefined) {
  return {
    $or: [{ is_private: 0 }, ...(actorId != null ? [{ owner_id: actorId }, { packing_item_recipients: actorId }] : [])],
  };
}

/**
 * `packing_items`/`packing_item_recipients`'s REAL table names — the shape
 * `packingVisibleToActorExpr` needs. A consumer's own local Kysely `DB`
 * interface satisfies this by structural extension, the same
 * `ReservationVisibilityKyselyDB` precedent.
 */
export interface PackingVisibilityKyselyDB {
  packing_items: { id: number; is_private: number; owner_id: number | null };
  packing_item_recipients: { item_id: number; user_id: number };
}

export function packingVisibleToActorExpr(
  eb: ExpressionBuilder<PackingVisibilityKyselyDB, 'packing_items'>,
  actorId: number | undefined,
): ExpressionWrapper<PackingVisibilityKyselyDB, 'packing_items', SqlBool> {
  const conditions: Expression<SqlBool>[] = [eb('packing_items.is_private', '=', 0)];
  if (actorId != null) {
    conditions.push(eb('packing_items.owner_id', '=', actorId));
    conditions.push(
      eb.exists(
        eb
          .selectFrom('packing_item_recipients as r')
          .select('r.item_id')
          .whereRef('r.item_id', '=', 'packing_items.id')
          .where('r.user_id', '=', actorId),
      ),
    );
  }
  return eb.or(conditions);
}
