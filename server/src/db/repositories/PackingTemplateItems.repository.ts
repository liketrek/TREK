import type { PackingTemplateItems } from '../entities/PackingTemplateItems.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `packing_template_items` row — every scalar column, incl. the `persist(false)` `category_id` relation mirror. */
export interface PackingTemplateItemRow {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  weight_grams: number | null;
  quantity: number;
  bag_name: string | null;
}

const _packingTemplateItemRowKeys: AssertRowKeys<PackingTemplateItemRow, PackingTemplateItems> = true;

/** PK50's apply-template projection (`applyTemplate`). */
export interface PackingTemplateApplyRow {
  name: string;
  category: string;
  weight_grams: number | null;
  quantity: number;
  bag_name: string | null;
}

interface PackingTemplateItemsKyselyDB {
  packing_template_items: PackingTemplateItemRow;
  packing_template_categories: { id: number; template_id: number; name: string; sort_order: number };
}

/** The insert-only shape for `insertTemplateItem` (PK57/PK86) — `id` is autoincrement and omitted. */
interface PackingTemplateItemsInsertKyselyDB {
  packing_template_items: { category_id: number | string; name: string; sort_order: number; weight_grams?: number | null; quantity?: number; bag_name?: string | null };
}

/** `packing_template_items` — the leaf tier of the packing template tree. Kysely throughout: `category_id` is `persist(false)`. */
export class PackingTemplateItemsRepository extends TrekRepository<PackingTemplateItems> {
  private db() {
    return this.kysely<PackingTemplateItemsKyselyDB>();
  }

  /**
   * PK50 (`applyTemplate`) — `SELECT ti.name, tc.name as category,
   * ti.weight_grams, ti.quantity, ti.bag_name FROM
   * packing_template_items ti JOIN packing_template_categories tc ON
   * ti.category_id = tc.id WHERE tc.template_id = ? ORDER BY tc.sort_order,
   * ti.sort_order`. `template_id: number` (Plan 4 Task 8b, U6 — the
   * program's gate-level id parsing carry: its one caller, `applyTemplate`,
   * is only reached with a `toRowId`-parsed/Zod-typed id).
   */
  async listForApply(template_id: number): Promise<PackingTemplateApplyRow[]> {
    return await this.db()
      .selectFrom('packing_template_items as ti')
      .innerJoin('packing_template_categories as tc', 'tc.id', 'ti.category_id')
      .select(['ti.name', 'tc.name as category', 'ti.weight_grams', 'ti.quantity', 'ti.bag_name'])
      .where('tc.template_id', '=', template_id)
      .orderBy('tc.sort_order', 'asc')
      .orderBy('ti.sort_order', 'asc')
      .execute();
  }

  /**
   * PK67 (`getPackingTemplate`) — `SELECT ti.* FROM packing_template_items
   * ti JOIN packing_template_categories tc ON ti.category_id = tc.id WHERE
   * tc.template_id = ? ORDER BY ti.sort_order, ti.id`.
   */
  async listForTemplate(template_id: number | string): Promise<PackingTemplateItemRow[]> {
    return await this.db()
      .selectFrom('packing_template_items as ti')
      .innerJoin('packing_template_categories as tc', 'tc.id', 'ti.category_id')
      .selectAll('ti')
      .where('tc.template_id', '=', template_id as number)
      .orderBy('ti.sort_order', 'asc')
      .orderBy('ti.id', 'asc')
      .execute();
  }

  /**
   * PK57 (`saveAsTemplate`'s per-item loop)/PK86 (`createTemplateItem`) —
   * `INSERT INTO packing_template_items (category_id, name, sort_order)
   * VALUES (?, ?, ?)` (PK86), and since #1131 PK57's `INSERT INTO
   * packing_template_items (category_id, name, sort_order, weight_grams,
   * quantity, bag_name) VALUES (?, ?, ?, ?, ?, ?)`. One method, both call
   * sites; the optional keys PK86 leaves out stay `undefined`, which
   * Kysely drops from the column list, so they take their SQL defaults.
   * Returns the new row's id. Named `insertTemplateItem`, not `insert` —
   * the latter collides with `TrekRepository`/`EntityRepository`'s own
   * same-named method.
   */
  async insertTemplateItem(row: {
    category_id: number | string;
    name: string;
    sort_order: number;
    weight_grams?: number | null;
    quantity?: number;
    bag_name?: string | null;
  }): Promise<number> {
    const result = await this.kysely<PackingTemplateItemsInsertKyselyDB>()
      .insertInto('packing_template_items')
      .values({
        category_id: row.category_id,
        name: row.name,
        sort_order: row.sort_order,
        weight_grams: row.weight_grams,
        quantity: row.quantity,
        bag_name: row.bag_name,
      })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /** PK85 (`createTemplateItem`) — `SELECT MAX(sort_order) as max FROM packing_template_items WHERE category_id = ?`. */
  async maxSortOrder(category_id: number | string): Promise<number | null> {
    const row = await this.db().selectFrom('packing_template_items').select((eb) => eb.fn.max('sort_order').as('max')).where('category_id', '=', category_id as number).executeTakeFirst();
    return row?.max ?? null;
  }

  /** PK87/PK89 — `SELECT * FROM packing_template_items WHERE id = ?`, same text at two call sites (`createTemplateItem`'s re-select, `updateTemplateItem`'s re-select). */
  async findById(id: number | string): Promise<PackingTemplateItemRow | undefined> {
    return await this.db().selectFrom('packing_template_items').selectAll().where('id', '=', id as number).executeTakeFirst();
  }

  /**
   * PK63 (`scopedTemplateItem`) — `SELECT ti.* FROM packing_template_items
   * ti JOIN packing_template_categories tc ON ti.category_id = tc.id WHERE
   * ti.id = ? AND tc.template_id = ?`, the template-scoping guard shared by
   * `updateTemplateItem` and `deleteTemplateItem` (two call sites).
   */
  async findScoped(id: number | string, template_id: number | string): Promise<PackingTemplateItemRow | undefined> {
    return await this.db()
      .selectFrom('packing_template_items as ti')
      .innerJoin('packing_template_categories as tc', 'tc.id', 'ti.category_id')
      .selectAll('ti')
      .where('ti.id', '=', id as number)
      .where('tc.template_id', '=', template_id as number)
      .executeTakeFirst();
  }

  /** PK88 (`updateTemplateItem`) — `UPDATE packing_template_items SET name = ? WHERE id = ?`. */
  async updateName(id: number | string, name: string): Promise<void> {
    await this.db().updateTable('packing_template_items').set({ name }).where('id', '=', id as number).execute();
  }

  /** PK90 (`deleteTemplateItem`) — `DELETE FROM packing_template_items WHERE id = ?`. */
  async delete(id: number | string): Promise<void> {
    await this.nativeDelete({ id: id as number });
  }
}
