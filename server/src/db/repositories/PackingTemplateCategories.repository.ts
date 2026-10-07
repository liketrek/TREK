import type { PackingTemplateCategories } from '../entities/PackingTemplateCategories.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `packing_template_categories` row — every scalar column, incl. the `persist(false)` `template_id` relation mirror. */
export interface PackingTemplateCategoryRow {
  id: number;
  template_id: number;
  name: string;
  sort_order: number;
}

const _packingTemplateCategoryRowKeys: AssertRowKeys<PackingTemplateCategoryRow, PackingTemplateCategories> = true;

interface PackingTemplateCategoriesKyselyDB {
  packing_template_categories: PackingTemplateCategoryRow;
}

/** The insert-only shape for `insertCategory` (PK56/PK77) — `id` is autoincrement and omitted. */
interface PackingTemplateCategoriesInsertKyselyDB {
  packing_template_categories: { template_id: number | string; name: string; sort_order: number };
}

/** `packing_template_categories` — the middle tier of the packing template tree. Kysely throughout: `template_id` is `persist(false)`. */
export class PackingTemplateCategoriesRepository extends TrekRepository<PackingTemplateCategories> {
  private db() {
    return this.kysely<PackingTemplateCategoriesKyselyDB>();
  }

  /** PK66 (`getPackingTemplate`) — `SELECT * FROM packing_template_categories WHERE template_id = ? ORDER BY sort_order, id`. */
  async listForTemplate(template_id: number | string): Promise<PackingTemplateCategoryRow[]> {
    return await this.db()
      .selectFrom('packing_template_categories')
      .selectAll()
      .where('template_id', '=', template_id as number)
      .orderBy('sort_order', 'asc')
      .orderBy('id', 'asc')
      .execute();
  }

  /**
   * PK56 (`saveAsTemplate`'s per-category loop)/PK77 (`createTemplateCategory`)
   * — the same `INSERT INTO packing_template_categories (template_id, name,
   * sort_order) VALUES (?, ?, ?)`, one method, both call sites. Returns the
   * new row's id. Named `insertCategory`, not `insert` — the latter collides
   * with `TrekRepository`/`EntityRepository`'s own same-named method.
   */
  async insertCategory(template_id: number | string, name: string, sort_order: number): Promise<number> {
    const result = await this.kysely<PackingTemplateCategoriesInsertKyselyDB>()
      .insertInto('packing_template_categories')
      .values({ template_id, name, sort_order })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /** PK76 (`createTemplateCategory`) — `SELECT MAX(sort_order) as max FROM packing_template_categories WHERE template_id = ?`. */
  async maxSortOrder(template_id: number | string): Promise<number | null> {
    const row = await this.db()
      .selectFrom('packing_template_categories')
      .select((eb) => eb.fn.max('sort_order').as('max'))
      .where('template_id', '=', template_id as number)
      .executeTakeFirst();
    return row?.max ?? null;
  }

  /** PK78/PK81 — `SELECT * FROM packing_template_categories WHERE id = ?`, same text at two call sites (`createTemplateCategory`'s re-select, `updateTemplateCategory`'s re-select). */
  async findById(id: number | string): Promise<PackingTemplateCategoryRow | undefined> {
    return await this.db()
      .selectFrom('packing_template_categories')
      .selectAll()
      .where('id', '=', id as number)
      .executeTakeFirst();
  }

  /** PK79/PK82 — `SELECT * FROM packing_template_categories WHERE id = ? AND template_id = ?`, the scope-check text at two call sites (`updateTemplateCategory`, `deleteTemplateCategory`). */
  async findInTemplate(
    id: number | string,
    template_id: number | string,
  ): Promise<PackingTemplateCategoryRow | undefined> {
    return await this.db()
      .selectFrom('packing_template_categories')
      .selectAll()
      .where('id', '=', id as number)
      .where('template_id', '=', template_id as number)
      .executeTakeFirst();
  }

  /** PK80 (`updateTemplateCategory`) — `UPDATE packing_template_categories SET name = ? WHERE id = ?`. */
  async updateName(id: number | string, name: string): Promise<void> {
    await this.db()
      .updateTable('packing_template_categories')
      .set({ name })
      .where('id', '=', id as number)
      .execute();
  }

  /** PK83 (`deleteTemplateCategory`) — `DELETE FROM packing_template_categories WHERE id = ?`. */
  async delete(id: number | string): Promise<void> {
    await this.nativeDelete({ id: id as number });
  }
}
