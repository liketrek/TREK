import type { BudgetCategoryOrder } from '../entities/BudgetCategoryOrder.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type BudgetCategoryOrderKyselyDB = Pick<DB, 'budget_category_order'>;

/**
 * `budget_category_order` — a composite-PK `(trip_id, category)` table (no
 * surrogate `id`, per the entity's `[PrimaryKeyProp]?: ['trip', 'category']`
 * — `BudgetItemContributors`-class shape, R5). Kysely throughout: the
 * `ON CONFLICT(trip_id, category) DO UPDATE` upsert (BG84) has a real
 * two-column conflict target Kysely expresses directly, and every other
 * write here is a plain `INSERT OR IGNORE`/`INSERT` the entity's composite
 * key would otherwise force through `em.upsert`'s narrower single-target
 * form.
 */
export class BudgetCategoryOrderRepository extends TrekRepository<BudgetCategoryOrder> {
  /** BG22/BG41 — `SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = ?`. */
  async exists(trip_id: number | string, category: string): Promise<boolean> {
    const row = await this.kysely<BudgetCategoryOrderKyselyDB>()
      .selectFrom('budget_category_order')
      .select((eb) => eb.val(1).as('one'))
      .where('trip_id', '=', trip_id as number)
      .where('category', '=', category)
      .executeTakeFirst();
    return row !== undefined;
  }

  /** BG23/BG42 — `SELECT MAX(sort_order) as max FROM budget_category_order WHERE trip_id = ?`. */
  async maxSortOrder(trip_id: number | string): Promise<number | null> {
    const row = await this.kysely<BudgetCategoryOrderKyselyDB>()
      .selectFrom('budget_category_order')
      .select((eb) => eb.fn.max('sort_order').as('max'))
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
    return row?.max ?? null;
  }

  /** BG24/BG43 — `INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?,?,?)`. */
  async insertIgnore(trip_id: number | string, category: string, sort_order: number): Promise<void> {
    await this.kysely<BudgetCategoryOrderKyselyDB>()
      .insertInto('budget_category_order')
      .values({ trip_id: trip_id as number, category, sort_order })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** BG84 (`reorderCategories`) — `INSERT INTO budget_category_order (trip_id, category, sort_order) VALUES (?,?,?) ON CONFLICT(trip_id,category) DO UPDATE SET sort_order = excluded.sort_order`, one row per call (the legacy `prepare(...).run(...)` loop). */
  async upsertSortOrder(trip_id: number | string, category: string, sort_order: number): Promise<void> {
    await this.kysely<BudgetCategoryOrderKyselyDB>()
      .insertInto('budget_category_order')
      .values({ trip_id: trip_id as number, category, sort_order })
      .onConflict((oc) => oc.columns(['trip_id', 'category']).doUpdateSet({ sort_order }))
      .execute();
  }

  /** TP74 (`TripsService.copy`) — `SELECT category, sort_order FROM budget_category_order WHERE trip_id = ?`. */
  async listForTrip(trip_id: number | string): Promise<{ category: string; sort_order: number }[]> {
    return await this.kysely<BudgetCategoryOrderKyselyDB>()
      .selectFrom('budget_category_order')
      .select(['category', 'sort_order'])
      .where('trip_id', '=', trip_id as number)
      .execute();
  }

  /** TP75 (`TripsService.copy`) — `INSERT INTO budget_category_order (trip_id, category, sort_order) VALUES (?,?,?)`, plain (not `OR IGNORE` — the copy's own trip_id has no existing rows yet). */
  async insertCopy(trip_id: number | string, category: string, sort_order: number): Promise<void> {
    await this.kysely<BudgetCategoryOrderKyselyDB>()
      .insertInto('budget_category_order')
      .values({ trip_id: trip_id as number, category, sort_order })
      .execute();
  }
}
