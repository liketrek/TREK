import type { PackingItems } from '../entities/PackingItems.entity';
import { currentTimestamp } from '../dialect/sql-functions';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import { presenceSet } from './_shared/presence-set';
import { packingVisibleToActorExpr, type PackingVisibilityKyselyDB } from './_shared/packing-visibility';

/** A bare `packing_items` row — every scalar column, incl. the three `persist(false)` relation mirrors (`trip_id`, `bag_id`, `owner_id`) — the program-wide trap this class goes through Kysely throughout to avoid. */
export interface PackingItemRow {
  id: number;
  trip_id: number;
  name: string;
  checked: number | null;
  category: string | null;
  sort_order: number | null;
  created_at: string | null;
  weight_grams: number | null;
  bag_id: number | null;
  quantity: number;
  updated_at: string | null;
  is_private: number;
  owner_id: number | null;
  packed_quantity: number | null;
}

const _packingItemRowKeys: AssertRowKeys<PackingItemRow, PackingItems> = true;

/** PK2's recipient projection (`enrichItems`). */
export interface PackingItemRecipientRow {
  item_id: number;
  user_id: number;
  username: string;
}

/** PK54's privacy-filtered export projection (`saveAsTemplate`) — name, category, weight, count and the joined bag name (#1131). */
export interface PackingItemExportRow {
  name: string;
  category: string | null;
  weight_grams: number | null;
  quantity: number;
  bag_name: string | null;
}

/**
 * `packing_items`'s own Kysely shape, extended from `_shared/packing-visibility.ts`'s
 * `PackingVisibilityKyselyDB` (Task 0, R1) — `PackingItemRow` is a structural
 * superset of that file's narrower `{id, is_private, owner_id}` requirement,
 * so `packingVisibleToActorExpr` type-checks directly against a query built
 * from this interface (the `CalendarStayKyselyDB extends
 * ReservationVisibilityKyselyDB` precedent, `Reservations.repository.ts`).
 */
interface PackingItemsKyselyDB extends PackingVisibilityKyselyDB {
  packing_items: PackingItemRow;
  packing_item_recipients: { item_id: number; user_id: number };
  users: { id: number; username: string; display_name: string | null };
  packing_bags: { id: number; name: string };
}

/**
 * `packing_items` — the checklist rows themselves, plus (this class's own
 * relation, no separate entity of its own — §16/the `TagsRepository
 * .place_tags` precedent) the `packing_item_recipients` pivot. Kysely
 * throughout: `trip_id`/`bag_id`/`owner_id` are all `persist(false)`
 * relation mirrors (§16), the program-wide bare-`select` drop trap
 * `TripFilesRepository`'s class docstring names.
 *
 * **`packing_item_recipients` lives here, not on its own
 * `PackingItemRecipientsRepository`.** The inventory's own proposal (§2's
 * "Proposed repositories") expected a standalone class, but the pivot has
 * NO MikroORM entity of its own (`PackingItems.entity.ts`'s
 * `packing_item_recipients: () => p.manyToMany(Users)
 * .pivotTable('packing_item_recipients')...` — no `.pivotEntity(...)`,
 * unlike `packing_item_contributors`'s) — `TrekRepository`/`@InjectRepository`
 * both require a mapped entity to construct a repository at all, so a
 * separate class cannot be registered. Exactly the `Places.place_tags` ↔
 * `TagsRepository` shape (`Tags.repository.ts`'s own class docstring): the
 * pivot's read/write methods live on the repository of the entity that
 * declares the owning side of the relation (`PackingItems`), reached
 * through `this.kysely()` (D3's sanctioned escape hatch for a table with no
 * entity mapping). Flagged as a deviation from the inventory's proposal in
 * the task-3 report, not a defect.
 */
export class PackingItemsRepository extends TrekRepository<PackingItems> {
  private db() {
    return this.kysely<PackingItemsKyselyDB>();
  }

  /**
   * PK1 (`enrichItems`'s owner-name read) — legacy: `SELECT id, username
   * FROM users WHERE id IN (SELECT owner_id FROM packing_items WHERE id IN
   * (${…}))`. The caller (`PackingService.enrichItems`) already holds every
   * item's own `owner_id` (it just read the rows) — the inner subquery's
   * whole job is producing that same distinct owner-id set, so it collapses
   * to a plain `id IN (?)` over `users` once the service derives the ids in
   * JS from the rows it already has (rule 23: a typed condition over a
   * known list, not a nested dynamic subquery) — same result set, one fewer
   * round trip through `packing_items`.
   */
  async listOwnersForIds(owner_ids: number[]): Promise<{ id: number; username: string }[]> {
    if (owner_ids.length === 0) return [];
    return await this.db().selectFrom('users').select(['id', 'username']).where('id', 'in', owner_ids).execute();
  }

  /**
   * PK2 (`enrichItems`'s recipient read) — `SELECT r.item_id, r.user_id,
   * COALESCE(u.display_name, u.username) AS username FROM
   * packing_item_recipients r JOIN users u ON u.id = r.user_id WHERE
   * r.item_id IN (${…})`.
   */
  async listRecipientsForItems(item_ids: number[]): Promise<PackingItemRecipientRow[]> {
    if (item_ids.length === 0) return [];
    return await this.db()
      .selectFrom('packing_item_recipients as r')
      .innerJoin('users as u', 'u.id', 'r.user_id')
      .select(['r.item_id', 'r.user_id', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username')])
      .where('r.item_id', 'in', item_ids)
      .execute();
  }

  /** PK4 (`listItems`'s no-viewer branch) — `SELECT * FROM packing_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC`, unfiltered — only for genuinely viewer-less internal reads. */
  async listForTrip(trip_id: number | string): Promise<PackingItemRow[]> {
    return await this.db().selectFrom('packing_items').selectAll().where('trip_id', '=', trip_id as number).orderBy('sort_order', 'asc').orderBy('created_at', 'asc').execute();
  }

  /**
   * `share.service.ts:386` SH13 (`getSharedTripData`'s share_packing read)
   * — **SECURITY-CRITICAL (#858)**: `SELECT * FROM packing_items WHERE
   * trip_id = ? AND is_private = 0 ORDER BY sort_order ASC` — a public
   * viewer is neither owner nor recipient, so only Common items may
   * surface. `ORDER BY sort_order ASC` only (unlike PK4's `listForTrip`,
   * which also orders by `created_at` — the legacy public statement never
   * added that second key).
   */
  async listPublicForShare(trip_id: number | string): Promise<PackingItemRow[]> {
    return await this.db()
      .selectFrom('packing_items')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .where('is_private', '=', 0)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  /**
   * PK5 (`listItems`'s viewer-filtered branch, T5) — `SELECT * FROM
   * packing_items WHERE trip_id = ? AND (${VISIBLE_TO_ACTOR}) ORDER BY
   * sort_order ASC, created_at ASC`. **Security-critical (#858
   * three-tier sharing)** — built directly on Task 0's shared
   * `packingVisibleToActorExpr` predicate (`_shared/packing-visibility.ts`),
   * never a re-spelled fragment (R1).
   */
  async listVisibleToActor(trip_id: number | string, actorId: number): Promise<PackingItemRow[]> {
    return await this.db()
      .selectFrom('packing_items')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .where((eb) => packingVisibleToActorExpr(eb, actorId))
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .execute();
  }

  /** PK6 (`getItemPrivacy`) — `SELECT is_private, owner_id FROM packing_items WHERE id = ? AND trip_id = ?`. `id: number` (Plan 4 Task 8b, U6 — the program's gate-level id parsing carry: its one caller, `PackingService.getItemPrivacy`, is only reached with a `toRowId`-parsed id); `trip_id` stays `number | string`, a separate, still-accepted carry. */
  async getPrivacy(id: number, trip_id: number | string): Promise<{ is_private: number; owner_id: number | null } | undefined> {
    return await this.db().selectFrom('packing_items').select(['is_private', 'owner_id']).where('id', '=', id).where('trip_id', '=', trip_id as number).executeTakeFirst();
  }

  /** PK7/PK28/PK51 (`createItem`/`bulkImport`/`applyTemplate`) — `SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?`, one method, three call sites. */
  async maxSortOrder(trip_id: number | string): Promise<number | null> {
    const row = await this.db().selectFrom('packing_items').select((eb) => eb.fn.max('sort_order').as('max')).where('trip_id', '=', trip_id as number).executeTakeFirst();
    return row?.max ?? null;
  }

  /**
   * PK8 (`createItem`) / PK29 (`bulkImport`'s per-row loop) — the same
   * 11-column `INSERT INTO packing_items (trip_id, name, checked, category,
   * sort_order, quantity, weight_grams, bag_id, is_private, owner_id,
   * updated_at) VALUES (?×10, CURRENT_TIMESTAMP)` (the two legacy statements
   * differ only in column ORDER, not in the column set or bound values — one
   * method, both call sites, called once per row for `bulkImport`'s loop
   * exactly as the legacy `stmt.run(...)` was). Returns the new row's id.
   *
   * **MikroORM's own `insert()`, not Kysely** (unlike every read above): the
   * legacy statement binds `updated_at` to the literal SQL keyword
   * `CURRENT_TIMESTAMP` (the column carries no SQL-level `DEFAULT` of its
   * own, `Migration20200101022400_optimistic_concurrency_token_for_offline_conflict_detection.ts`),
   * and `currentTimestamp(platform)`'s `RawQueryFragment` is a MikroORM-only
   * construct — handed into a Kysely statement it stringifies to a literal
   * `?` and the statement fails at execution (`sql-functions.ts`'s own
   * Plan 3d Task 0 review note, H1/L1). Every `currentTimestamp(platform)`
   * call in this program goes through a MikroORM write path
   * (`nativeUpdate`/`upsert`/`insert`), never Kysely's `.set()`/`.values()` —
   * `bag`/`owner` are the relation property names for the `bag_id`/`owner_id`
   * `persist(false)` mirrors (`ReservationsRepository.updateReservation`'s
   * `day`/`place` precedent).
   */
  async insertItem(row: {
    trip_id: number | string; name: string; checked: number; category: string; sort_order: number;
    quantity: number; weight_grams: number | null; bag_id: number | null; is_private: number; owner_id: number | null;
  }): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    const id = await this.insert({
      trip: row.trip_id,
      name: row.name,
      checked: row.checked,
      category: row.category,
      sort_order: row.sort_order,
      quantity: row.quantity,
      weight_grams: row.weight_grams,
      bag: row.bag_id,
      is_private: row.is_private,
      owner: row.owner_id,
      updated_at: currentTimestamp(platform),
    });
    return Number(id);
  }

  /**
   * PK52 (`applyTemplate`'s per-row loop) — `INSERT INTO packing_items
   * (trip_id, name, checked, category, sort_order, is_private, owner_id,
   * weight_grams, quantity, bag_id, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?,
   * ?, ?, ?, CURRENT_TIMESTAMP)` — `checked` is always 0; weight, count and
   * bag ride along from the template since #1131. MikroORM's own `insert()`,
   * same reason as {@link insertItem}'s docstring. Returns the new row's id.
   */
  async insertFromTemplate(row: {
    trip_id: number | string; name: string; category: string; sort_order: number; is_private: number; owner_id: number | null;
    weight_grams: number | null; quantity: number; bag_id: number | null;
  }): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    const id = await this.insert({
      trip: row.trip_id,
      name: row.name,
      checked: 0,
      category: row.category,
      sort_order: row.sort_order,
      is_private: row.is_private,
      owner: row.owner_id,
      weight_grams: row.weight_grams,
      quantity: row.quantity,
      bag: row.bag_id,
      updated_at: currentTimestamp(platform),
    });
    return Number(id);
  }

  /**
   * PK9 (`createItem`)/PK17 (`setItemSharing`) — `INSERT OR IGNORE INTO
   * packing_item_recipients (item_id, user_id) VALUES (?, ?)`, the legacy
   * `prepare(...).run(...)` loop, same text at both call sites. Kysely
   * `ON CONFLICT DO NOTHING` on the pivot's real composite `PRIMARY KEY
   * (item_id, user_id)` (`Migration20200101022900_three_tier_packing_sharing
   * .ts:17-21`) — the table has no entity mapping (this class docstring),
   * so `em.upsert`/`upsertMany` cannot target it. The caller
   * roster-scopes and excludes the owner before calling; the empty-array
   * guard here is defensive, matching every other batch-write method in
   * this program.
   */
  async insertRecipientsIgnore(item_id: number, user_ids: number[]): Promise<void> {
    if (user_ids.length === 0) return;
    await this.db()
      .insertInto('packing_item_recipients')
      .values(user_ids.map((user_id) => ({ item_id, user_id })))
      .onConflict((oc) => oc.columns(['item_id', 'user_id']).doNothing())
      .execute();
  }

  /** PK10/PK14/PK19/PK21/PK23/PK33/PK53 — `SELECT * FROM packing_items WHERE id = ?`, the shared post-write re-select text, seven call sites. `id: number` (Plan 4 Task 8b, U6 — every call site is already a real row id: an insert's own return value, or a `toRowId`-parsed/Zod-typed id threaded down from the other narrowed methods on this class). */
  async findById(id: number): Promise<PackingItemRow | undefined> {
    return await this.db().selectFrom('packing_items').selectAll().where('id', '=', id).executeTakeFirst();
  }

  /**
   * PK11 (`getItemInTrip`, T1) — `SELECT * FROM packing_items WHERE id = ?
   * AND trip_id = ? AND (${VISIBLE_TO_ACTOR})`. **The single
   * highest-blast-radius conversion in the whole plan (§17 surprise 2)** —
   * six call sites (`updateItem`, `setItemSharing`, `addContributor`,
   * `removeContributor`, `cloneItem`, `deleteItem`), all routed through
   * Task 0's shared `packingVisibleToActorExpr` predicate, never a
   * re-spelled fragment. A missing actor id returns `undefined` without
   * querying (matching the legacy JS-level guard — "a missing actor denies
   * too, rather than falling through unfiltered"). `id: number` (Plan 4
   * Task 8b, U6 — the program's gate-level id parsing carry: all six call
   * sites now thread a `toRowId`-parsed/Zod-typed id); `trip_id` stays
   * `number | string`, a separate, still-accepted carry.
   */
  async findVisibleInTrip(id: number, trip_id: number | string, actorId: number | undefined): Promise<PackingItemRow | undefined> {
    if (actorId == null) return undefined;
    return await this.db()
      .selectFrom('packing_items')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id as number)
      .where((eb) => packingVisibleToActorExpr(eb, actorId))
      .executeTakeFirst();
  }

  /**
   * PK13 (`updateItem`, T3) — the presence-sentinel `UPDATE
   * packing_items SET name = COALESCE(?, name), checked = ?,
   * packed_quantity = ?, category = COALESCE(?, category),
   * weight_grams = CASE WHEN ? THEN ? ELSE weight_grams END, bag_id = CASE
   * WHEN ? THEN ? ELSE bag_id END, quantity = ?,
   * is_private = CASE WHEN ? THEN ? ELSE is_private END,
   * owner_id = CASE WHEN ? THEN ? ELSE owner_id END, updated_at =
   * CURRENT_TIMESTAMP WHERE id = ?` (`_shared/presence-set.ts`, R11 — Task
   * 2's landed shape, copied here rather than re-derived). `name`/`category`
   * keep the legacy `COALESCE(?, col)` truthy-wins semantics (the service
   * passes `present = !!value`, matching `data.name || null`'s
   * fall-through-on-falsy exactly); every other column is a true presence
   * sentinel (`present = bodyKeys.includes(...)`), except `checked`,
   * `packed_quantity` and `quantity`, which the service always settles
   * together (#2296, `resolvePackedState`) and passes as present; `owner_id`'s
   * presence is the claim-owner-on-privatize flag. `updated_at` is NOT
   * gated by presence — the legacy statement always stamps it, unlike
   * `BudgetItemsRepository.update`'s early-return guard (budget's row has
   * no `updated_at` column at all).
   */
  /** `id: number`, same Plan 4 Task 8b (U6) narrowing as {@link findById} (its one caller, `updateItem`, is only reached with a `toRowId`-parsed/Zod-typed id). */
  async update(id: number, write: {
    name?: readonly [present: boolean, value: string | null];
    checked?: readonly [present: boolean, value: number];
    packed_quantity?: readonly [present: boolean, value: number | null];
    category?: readonly [present: boolean, value: string | null];
    weight_grams?: readonly [present: boolean, value: number | null];
    bag_id?: readonly [present: boolean, value: number | null];
    quantity?: readonly [present: boolean, value: number];
    is_private?: readonly [present: boolean, value: number];
    owner_id?: readonly [present: boolean, value: number | null];
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const data = presenceSet<{
      name: string | null; checked: number; packed_quantity: number | null; category: string | null; weight_grams: number | null;
      bag: number | null; quantity: number; is_private: number; owner: number | null;
    }>({
      name: write.name,
      checked: write.checked,
      packed_quantity: write.packed_quantity,
      category: write.category,
      weight_grams: write.weight_grams,
      bag: write.bag_id,
      quantity: write.quantity,
      is_private: write.is_private,
      owner: write.owner_id,
    });
    await this.nativeUpdate({ id }, { ...data, updated_at: currentTimestamp(platform) });
  }

  /**
   * PK15 (`setItemSharing`) — `UPDATE packing_items SET is_private = ?,
   * owner_id = COALESCE(owner_id, ?), updated_at = CURRENT_TIMESTAMP WHERE
   * id = ?`. The service resolves the `COALESCE(owner_id, ?)` keep-if-set
   * semantics: `owner_id` is passed only when the pre-image's `owner_id` was
   * `null` (an unowned legacy item being claimed), otherwise omitted so the
   * column is left untouched — the same presence-object shape as
   * {@link update}, one key. `id: number`, same Plan 4 Task 8b narrowing as
   * {@link findById}.
   */
  async updateSharing(id: number, is_private: number, claimOwnerId?: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const data = presenceSet<{ owner: number }>({ owner: claimOwnerId !== undefined ? [true, claimOwnerId] : undefined });
    await this.nativeUpdate({ id }, { is_private, ...data, updated_at: currentTimestamp(platform) });
  }

  /** PK16 (`setItemSharing`'s replace-all) — `DELETE FROM packing_item_recipients WHERE item_id = ?`. */
  async deleteRecipientsForItem(item_id: number): Promise<void> {
    await this.db().deleteFrom('packing_item_recipients').where('item_id', '=', item_id).execute();
  }

  /** PK27 (`deleteItem`) — `DELETE FROM packing_items WHERE id = ?`. `id: number`, same Plan 4 Task 8b narrowing as {@link findById}. */
  async delete(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * PK34 (`bagWeightTotals`, T6) — `SELECT bag_id, SUM(COALESCE(weight_grams,
   * 0) * COALESCE(quantity, 1)) AS total FROM packing_items WHERE trip_id = ?
   * GROUP BY bag_id`. **Deliberately NOT built on {@link listVisibleToActor}/
   * {@link findVisibleInTrip}** (§17 surprise 10) — this aggregate crosses
   * the privacy boundary on purpose (the sum includes every item in the
   * trip, private ones included; only the resulting integer is exposed,
   * never a name/category/owner) to keep a shared bag's weight-limit warning
   * accurate for every member, not just what the viewer can see. A shared
   * helper that accidentally unified this with the visibility-filtered reads
   * would silently ADD a privacy filter here — the opposite failure mode
   * from PK5/PK11's.
   */
  async bagWeightTotals(trip_id: number | string): Promise<{ bag_id: number | null; total: number | null }[]> {
    return await this.db()
      .selectFrom('packing_items')
      .select((eb) => {
        // `COALESCE(weight_grams, 0) * COALESCE(quantity, 1)`
        const lineWeight = eb(eb.fn.coalesce('weight_grams', eb.val(0)), '*', eb.fn.coalesce('quantity', eb.val(1)));
        return ['bag_id', eb.fn.sum<number>(lineWeight).as('total')];
      })
      .where('trip_id', '=', trip_id as number)
      .groupBy('bag_id')
      .execute();
  }

  /**
   * PK54 (`saveAsTemplate`) — `SELECT i.name, i.category, i.weight_grams,
   * i.quantity, b.name AS bag_name FROM packing_items i LEFT JOIN
   * packing_bags b ON b.id = i.bag_id WHERE i.trip_id = ? AND (i.is_private
   * = 0 OR i.owner_id = ?) ORDER BY i.sort_order ASC` (weight, count and
   * bag name ride into the template since #1131).
   * **Security-critical, its own two-arm predicate — NOT
   * `packingVisibleToActorExpr`/`packingVisibleToActorCondition`.** A
   * template is a durable, shareable artifact, so it may only capture what
   * the actor's own list contains: Common items plus the actor's own
   * (Personal or Shared) items. The three-arm `VISIBLE_TO_ACTOR` predicate
   * additionally admits items the actor is merely a RECIPIENT of — reusing
   * it here would let a recipient publish someone else's Shared item into a
   * template neither of them wrote, an over-broad capture the legacy
   * statement never allowed (matches `PlacesService`'s own-list-only
   * trip-copy filter, PK54's own note).
   */
  async listExportable(trip_id: number | string, userId: number): Promise<PackingItemExportRow[]> {
    return await this.db()
      .selectFrom('packing_items as i')
      .leftJoin('packing_bags as b', 'b.id', 'i.bag_id')
      .select(['i.name', 'i.category', 'i.weight_grams', 'i.quantity', 'b.name as bag_name'])
      .where('i.trip_id', '=', trip_id as number)
      .where((eb) => eb.or([eb('i.is_private', '=', 0), eb('i.owner_id', '=', userId)]))
      .orderBy('i.sort_order', 'asc')
      .execute();
  }

  /** PK62 (`reorderItems`, looped inside its transaction) — `UPDATE packing_items SET sort_order = ? WHERE id = ? AND trip_id = ?`. */
  async setSortOrder(id: number, trip_id: number | string, sort_order: number): Promise<void> {
    await this.nativeUpdate({ id, trip: trip_id as number }, { sort_order });
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 3 (`TripsService.copy`, TP66-69) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP68 (`trips.service.ts::copy`'s packing-items read) — `SELECT * FROM
   * packing_items WHERE trip_id = ? AND (is_private = 0 OR owner_id = ?)`.
   * **Security-sensitive: the privacy filter** (matches PK54/`listExportable`'s
   * own-list-only rule — the copier may carry over the Common list plus
   * their own items, never a recipient's or another member's restricted
   * item). A distinct method from `listExportable`: this one is the FULL
   * row (the copy loop reads `bag_id`/`weight_grams`/`owner_id` off it,
   * `listExportable`'s narrower `{name, category}` projection is
   * `saveAsTemplate`'s own shape) and carries no `ORDER BY` (the legacy
   * statement has none, unlike `listExportable`'s `sort_order ASC`).
   */
  async listOwnListForCopy(trip_id: number | string, userId: number): Promise<PackingItemRow[]> {
    return await this.db()
      .selectFrom('packing_items')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .where((eb) => eb.or([eb('is_private', '=', 0), eb('owner_id', '=', userId)]))
      .execute();
  }

  /**
   * TP69 (`trips.service.ts::copy`'s packing-items insert, looped) —
   * `INSERT INTO packing_items (trip_id, name, checked, category,
   * sort_order, weight_grams, bag_id, is_private, owner_id, updated_at)
   * VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)` — a distinct
   * column set from {@link insertItem}/{@link insertFromTemplate}
   * (`checked` is always 0; `quantity` takes its SQL default — 1, matching
   * the legacy statement's own omission of it). MikroORM's own `insert()`,
   * same reason as {@link insertItem}'s docstring (a hand-set
   * `CURRENT_TIMESTAMP`, not a SQL-level column default). Restricted items
   * stay restricted, owned by the copier; recipient rows are not carried
   * over (the caller's own note, unchanged).
   */
  async insertCopy(row: { trip_id: number | string; name: string; category: string | null; sort_order: number | null; weight_grams: number | null; bag_id: number | null; is_private: number; owner_id: number | null }): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    const id = await this.insert({
      trip: row.trip_id,
      name: row.name,
      checked: 0,
      category: row.category,
      sort_order: row.sort_order,
      weight_grams: row.weight_grams,
      bag: row.bag_id,
      is_private: row.is_private,
      owner: row.owner_id,
      updated_at: currentTimestamp(platform),
    });
    return Number(id);
  }
}
