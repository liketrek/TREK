import type { PackingBags } from '../entities/PackingBags.entity';
import { presenceSet } from './_shared/presence-set';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `packing_bags` row — every scalar column, incl. the two `persist(false)` relation mirrors (`trip_id`, `user_id`). */
export interface PackingBagRow {
  id: number;
  trip_id: number;
  name: string;
  color: string;
  weight_limit_grams: number | null;
  sort_order: number | null;
  created_at: string | null;
  user_id: number | null;
}

const _packingBagRowKeys: AssertRowKeys<PackingBagRow, PackingBags> = true;

/** PK46's assignee-joined projection (`updateBag`'s re-select). */
export interface PackingBagWithAssigneeRow extends PackingBagRow {
  assigned_username: string | null;
}

/** PK40's member-with-user projection (`setBagMembers`'s re-select). */
export interface PackingBagMemberWithUserRow {
  user_id: number;
  username: string;
  avatar: string | null;
}

/** PK36's trip-wide member projection (`decorateBags`). */
export interface PackingBagMemberForTripRow {
  bag_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

interface PackingBagsKyselyDB {
  packing_bags: PackingBagRow;
  packing_bag_members: { bag_id: number; user_id: number };
  users: { id: number; username: string; display_name: string | null; avatar: string | null };
}

/** The insert-only shape for `insertMinimal` (PK32) — `id`/`created_at` are autoincrement/`DEFAULT CURRENT_TIMESTAMP` and omitted, matching the legacy 3-column list. */
interface PackingBagsMinimalInsertKyselyDB {
  packing_bags: { trip_id: number | string; name: string; color: string };
}

/** The insert-only shape for `insertBag` (PK42/TP67) — a distinct, wider column set from {@link PackingBagsMinimalInsertKyselyDB}'s. */
interface PackingBagsInsertKyselyDB {
  packing_bags: {
    trip_id: number | string;
    name: string;
    color: string;
    sort_order: number | null;
    weight_limit_grams: number | null;
  };
}

/**
 * `packing_bags` — bags themselves, plus (this class's own relation, no
 * separate entity of its own — the `TagsRepository.place_tags`/
 * `PackingItemsRepository`'s own `packing_item_recipients` precedent) the
 * `packing_bag_members` pivot (`PackingBags.entity.ts`'s
 * `packing_bag_members: () => p.manyToMany(Users)
 * .pivotTable('packing_bag_members')...`, no `.pivotEntity(...)` — no
 * entity of its own, so no standalone `PackingBagMembersRepository` can be
 * registered; its read/write methods live here instead, reached through
 * `this.kysely()`). Kysely throughout: `trip_id`/`user_id` are both
 * `persist(false)` relation mirrors.
 */
export class PackingBagsRepository extends TrekRepository<PackingBags> {
  private db() {
    return this.kysely<PackingBagsKyselyDB>();
  }

  /**
   * PK24 (`bagInTrip`)/PK25 (`bagForCloner`)/PK37 (`setBagMembers`'s
   * guard)/PK44 (`updateBag`'s guard)/PK47 (`deleteBag`'s guard) — `SELECT
   * id FROM packing_bags WHERE id = ? AND trip_id = ?` (PK24/37/44/47) /
   * `SELECT user_id FROM packing_bags WHERE id = ? AND trip_id = ?` (PK25)
   * — the SAME `WHERE` clause, five call sites, two narrower legacy
   * projections. One full-row method serves all five (rule 23's "narrow
   * read-model per statement" is about DISTINCT projections, not about
   * reproducing an accidental column subset when a caller only reads one
   * or two fields off it) — `bagInTrip` checks truthiness, `bagForCloner`
   * reads `.user_id`, the three guards check truthiness too. `id: number`
   * (Plan 4 Task 8b, U6 — the program's gate-level id parsing carry: every
   * call site is either a genuine `bag_id` value or a `toRowId`-parsed/
   * Zod-typed route id); `trip_id` stays `number | string`, a separate,
   * still-accepted carry.
   */
  async findInTrip(id: number, trip_id: number | string): Promise<PackingBagRow | undefined> {
    return await this.db()
      .selectFrom('packing_bags')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
  }

  /** PK30 (`bulkImport`'s bag-by-name resolution) — `SELECT id FROM packing_bags WHERE trip_id = ? AND name = ?`. */
  async byNameInTrip(trip_id: number | string, name: string): Promise<{ id: number } | undefined> {
    return await this.db()
      .selectFrom('packing_bags')
      .select('id')
      .where('trip_id', '=', trip_id as number)
      .where('name', '=', name)
      .executeTakeFirst();
  }

  /** PK31 (`bulkImport`, picks the next `BAG_COLORS` entry) — `SELECT COUNT(*) as c FROM packing_bags WHERE trip_id = ?`. */
  async countForTrip(trip_id: number | string): Promise<number> {
    const row = await this.db()
      .selectFrom('packing_bags')
      .select((eb) => eb.fn.countAll<number>().as('c'))
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
    return row?.c ?? 0;
  }

  /** PK41 (`createBag`) — `SELECT MAX(sort_order) as max FROM packing_bags WHERE trip_id = ?`. */
  async maxSortOrder(trip_id: number | string): Promise<number | null> {
    const row = await this.db()
      .selectFrom('packing_bags')
      .select((eb) => eb.fn.max('sort_order').as('max'))
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
    return row?.max ?? null;
  }

  /**
   * PK32 (`bulkImport`'s bag auto-create) — `INSERT INTO packing_bags
   * (trip_id, name, color) VALUES (?, ?, ?)`. `sort_order`/`weight_limit_grams`/
   * `user_id` take their SQL-level `DEFAULT`s (`0`/`NULL`/`NULL`,
   * `Migration20200101003900_create_packing_bags.ts`) by omission — unlike
   * `packing_items.updated_at` (`PackingItemsRepository.insertItem`'s
   * docstring), every column this table's own `INSERT`s omit has a genuine
   * SQL-level `DEFAULT`, so a plain Kysely insert reproduces the legacy
   * statement exactly with no MikroORM write-path detour needed. Returns
   * the new row's id.
   */
  async insertMinimal(trip_id: number | string, name: string, color: string): Promise<number> {
    const result = await this.kysely<PackingBagsMinimalInsertKyselyDB>()
      .insertInto('packing_bags')
      .values({ trip_id, name, color })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /**
   * PK42 (`createBag`) — `INSERT INTO packing_bags (trip_id, name, color,
   * sort_order, weight_limit_grams) VALUES (?×5)`, a distinct, wider column
   * set from {@link insertMinimal}'s. Returns the new row's id.
   */
  async insertBag(row: {
    trip_id: number | string;
    name: string;
    color: string;
    sort_order: number | null;
    weight_limit_grams: number | null;
  }): Promise<number> {
    const result = await this.kysely<PackingBagsInsertKyselyDB>()
      .insertInto('packing_bags')
      .values(row)
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /** PK43 (`createBag`'s post-insert re-select) — `SELECT * FROM packing_bags WHERE id = ?`. */
  async findById(id: number | string): Promise<PackingBagRow | undefined> {
    return await this.db()
      .selectFrom('packing_bags')
      .selectAll()
      .where('id', '=', id as number)
      .executeTakeFirst();
  }

  /**
   * PK45 (`updateBag`) — the 4-column presence/COALESCE `UPDATE
   * packing_bags SET name = COALESCE(?, name), color = COALESCE(?, color),
   * weight_limit_grams = CASE WHEN ? THEN ? ELSE weight_limit_grams END,
   * user_id = CASE WHEN ? THEN ? ELSE user_id END WHERE id = ?`
   * (`_shared/presence-set.ts`, the same idiom PK13's docstring names).
   * `name`/`color` keep the legacy `COALESCE(?, col)` truthy-wins
   * semantics (`present = !!value`); `weight_limit_grams`/`user_id` are
   * true presence sentinels, already resolved by the SERVICE
   * (`assignUser`'s roster check, the bodyKeys presence protocol). An
   * empty write (`{}`, or every field falsy/absent) short-circuits before
   * the `UPDATE` — `presenceSet` returns `{}` and Kysely's `set({})` emits
   * `UPDATE packing_bags SET WHERE id = ?`, a SQLite syntax error (base
   * returned 200; task-8-review.md H2) — the same guard `BudgetItems`
   * (`:222`) and `TodoItems` (`:125`) already carry.
   */
  /** `id: number`, same Plan 4 Task 8b (U6) narrowing as {@link findInTrip} (its one caller, `updateBag`, is only reached with a `toRowId`-parsed/Zod-typed id). */
  async update(
    id: number,
    write: {
      name?: readonly [present: boolean, value: string | null];
      color?: readonly [present: boolean, value: string | null];
      weight_limit_grams?: readonly [present: boolean, value: number | null];
      user_id?: readonly [present: boolean, value: number | null];
    },
  ): Promise<void> {
    const data = presenceSet<{
      name: string;
      color: string;
      weight_limit_grams: number | null;
      user_id: number | null;
    }>(write);
    if (Object.keys(data).length === 0) return;
    await this.db().updateTable('packing_bags').set(data).where('id', '=', id).execute();
  }

  /** PK46 (`updateBag`'s re-select) — `SELECT b.*, COALESCE(u.display_name, u.username) as assigned_username FROM packing_bags b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?`. `id: number`, same Plan 4 Task 8b narrowing as {@link findInTrip}. */
  async findWithAssignee(id: number): Promise<PackingBagWithAssigneeRow | undefined> {
    return await this.db()
      .selectFrom('packing_bags as b')
      .leftJoin('users as u', 'u.id', 'b.user_id')
      .selectAll('b')
      .select((eb) => eb.fn.coalesce('u.display_name', 'u.username').as('assigned_username'))
      .where('b.id', '=', id)
      .executeTakeFirst();
  }

  /** PK48 (`deleteBag`) — `DELETE FROM packing_bags WHERE id = ?`. `id: number`, same Plan 4 Task 8b narrowing as {@link findInTrip}. */
  async delete(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** PK35 (`decorateBags`) — `SELECT * FROM packing_bags WHERE trip_id = ? ORDER BY sort_order, id`. */
  async listForTrip(trip_id: number | string): Promise<PackingBagRow[]> {
    return await this.db()
      .selectFrom('packing_bags')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .orderBy('sort_order', 'asc')
      .orderBy('id', 'asc')
      .execute();
  }

  // ---------------------------------------------------------------------------
  // `packing_bag_members` — see the class docstring for why these live here.
  // ---------------------------------------------------------------------------

  /**
   * PK36 (`decorateBags`) — `SELECT bm.bag_id, bm.user_id, COALESCE(u.display_name,
   * u.username) AS username, u.avatar FROM packing_bag_members bm JOIN users u
   * JOIN packing_bags b ON bm.bag_id = b.id WHERE b.trip_id = ?`.
   */
  async listMembersForTrip(trip_id: number | string): Promise<PackingBagMemberForTripRow[]> {
    return await this.db()
      .selectFrom('packing_bag_members as bm')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .innerJoin('packing_bags as b', 'b.id', 'bm.bag_id')
      .select([
        'bm.bag_id',
        'bm.user_id',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
        'u.avatar',
      ])
      .where('b.trip_id', '=', trip_id as number)
      .execute();
  }

  /** PK26 (`bagForCloner`) — `SELECT user_id FROM packing_bag_members WHERE bag_id = ?`. */
  async listMemberIdsForBag(bag_id: number): Promise<number[]> {
    const rows = await this.db()
      .selectFrom('packing_bag_members')
      .select('user_id')
      .where('bag_id', '=', bag_id)
      .execute();
    return rows.map((r) => r.user_id);
  }

  /** PK40 (`setBagMembers`'s post-write re-select) — `SELECT bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar FROM packing_bag_members bm JOIN users u ON bm.user_id = u.id WHERE bm.bag_id = ?`. */
  async listMembersWithUserForBag(bag_id: number): Promise<PackingBagMemberWithUserRow[]> {
    return await this.db()
      .selectFrom('packing_bag_members as bm')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.user_id', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('bm.bag_id', '=', bag_id)
      .execute();
  }

  /** PK38 (`setBagMembers`'s replace-all) — `DELETE FROM packing_bag_members WHERE bag_id = ?`. */
  async deleteMembersForBag(bag_id: number): Promise<void> {
    await this.db().deleteFrom('packing_bag_members').where('bag_id', '=', bag_id).execute();
  }

  /**
   * PK39 (`setBagMembers`) — `INSERT OR IGNORE INTO packing_bag_members
   * (bag_id, user_id) VALUES (?, ?)`, the legacy `prepare(...).run(...)`
   * loop. Kysely `ON CONFLICT DO NOTHING` on the pivot's real composite
   * `PRIMARY KEY (bag_id, user_id)` (`Migration20200101012100_add_quantity_to_packing_items_user_id
   * .ts:23-29`) — no entity mapping (this class docstring), so
   * `em.upsert`/`upsertMany` cannot target it. The caller roster-scopes
   * the ids before calling; the empty-array guard here is defensive.
   */
  async insertMembersIgnore(bag_id: number, user_ids: number[]): Promise<void> {
    if (user_ids.length === 0) return;
    await this.db()
      .insertInto('packing_bag_members')
      .values(user_ids.map((user_id) => ({ bag_id, user_id })))
      .onConflict((oc) => oc.columns(['bag_id', 'user_id']).doNothing())
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 3 (`TripsService.copy`, TP66-69) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP66 (`trips.service.ts::copy`'s bags read) — `SELECT * FROM
   * packing_bags WHERE trip_id = ?`. Deliberately NOT {@link listForTrip}
   * (PK35) — that method's `ORDER BY sort_order, id` is a DIFFERENT
   * statement from this one's plain, unordered legacy text; reusing it here
   * would risk reordering the copy loop relative to a trip whose bags were
   * reordered after creation. TP67 (the insert half) reuses {@link insertBag}
   * directly — same column set, called once per row.
   */
  async listAllForTrip(trip_id: number | string): Promise<PackingBagRow[]> {
    return await this.db()
      .selectFrom('packing_bags')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .execute();
  }
}
