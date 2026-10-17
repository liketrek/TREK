import type { PackingTemplates } from '../entities/PackingTemplates.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `packing_templates` row — every scalar column, incl. the `persist(false)` `created_by` relation mirror. */
export interface PackingTemplateRow {
  id: number;
  name: string;
  created_by: number;
  created_at: string | null;
}

const _packingTemplateRowKeys: AssertRowKeys<PackingTemplateRow, PackingTemplates> = true;

/** PK49's trip-member listing row (`listTemplates`). */
export interface PackingTemplateSummaryRow {
  id: number;
  name: string;
  item_count: number;
}

/** PK64's admin listing row (`listPackingTemplates`). */
export interface PackingTemplateAdminRow extends PackingTemplateRow {
  created_by_name: string;
  item_count: number;
  category_count: number;
}

type PackingTemplatesKyselyDB = Pick<
  DB,
  'packing_templates' | 'packing_template_categories' | 'packing_template_items' | 'users'
>;

/** The table `insertTemplate` (PK55/PK68) inserts into; `id`/`created_at` are `InsertOptional` in the generated type. */
type PackingTemplatesInsertKyselyDB = Pick<DB, 'packing_templates'>;

/**
 * `packing_templates` — the top level of the (admin-managed) packing
 * template tree. Kysely throughout: `created_by` is `persist(false)` (the
 * physical mirror of the `createdByRef` relation).
 */
export class PackingTemplatesRepository extends TrekRepository<PackingTemplates> {
  private db() {
    return this.kysely<PackingTemplatesKyselyDB>();
  }

  /**
   * PK49 (`listTemplates`, the trip-member read) — `SELECT pt.id, pt.name,
   * (SELECT COUNT(*) FROM packing_template_items ti JOIN
   * packing_template_categories tc ON ti.category_id = tc.id WHERE
   * tc.template_id = pt.id) as item_count FROM packing_templates pt ORDER
   * BY pt.created_at DESC`. The correlated `COUNT` subquery re-expressed as
   * a join inside the correlated subquery itself (same shape,
   * `Trips.repository.ts`'s `day_count`/`place_count` precedent for a
   * correlated scalar count).
   */
  async listWithItemCount(): Promise<PackingTemplateSummaryRow[]> {
    return await this.db()
      .selectFrom('packing_templates as pt')
      .select((eb) => [
        'pt.id',
        'pt.name',
        eb
          .selectFrom('packing_template_items as ti')
          .innerJoin('packing_template_categories as tc', 'tc.id', 'ti.category_id')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('tc.template_id', '=', 'pt.id')
          .as('item_count'),
      ])
      .orderBy('pt.created_at', 'desc')
      .execute();
  }

  /**
   * PK64 (`listPackingTemplates`, the admin listing) — `SELECT pt.*,
   * u.username as created_by_name, (correlated item COUNT), (correlated
   * category COUNT) FROM packing_templates pt JOIN users u ON pt.created_by
   * = u.id ORDER BY pt.created_at DESC`.
   */
  async listAdmin(): Promise<PackingTemplateAdminRow[]> {
    return await this.db()
      .selectFrom('packing_templates as pt')
      .innerJoin('users as u', 'u.id', 'pt.created_by')
      .selectAll('pt')
      .select((eb) => [
        'u.username as created_by_name',
        eb
          .selectFrom('packing_template_items as ti')
          .innerJoin('packing_template_categories as tc', 'tc.id', 'ti.category_id')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('tc.template_id', '=', 'pt.id')
          .as('item_count'),
        eb
          .selectFrom('packing_template_categories as tc2')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('tc2.template_id', '=', 'pt.id')
          .as('category_count'),
      ])
      .orderBy('pt.created_at', 'desc')
      .execute();
  }

  /**
   * PK65/PK69/PK70/PK72/PK73 — `SELECT * FROM packing_templates WHERE id =
   * ?`, the SAME text at five call sites (`getPackingTemplate`,
   * `createPackingTemplate`'s post-insert re-select,
   * `updatePackingTemplate`'s existence check and post-write re-select,
   * `deletePackingTemplate`'s existence check). One method, five sites.
   */
  async findById(id: number | string): Promise<PackingTemplateRow | undefined> {
    return await this.db()
      .selectFrom('packing_templates')
      .selectAll()
      .where('id', '=', id as number)
      .executeTakeFirst();
  }

  /**
   * PK55 (`saveAsTemplate`)/PK68 (`createPackingTemplate`) — the same
   * `INSERT INTO packing_templates (name, created_by) VALUES (?, ?)`, one
   * method, both call sites. Returns the new row's id. Named `insertTemplate`,
   * not `insert` — the latter collides with `TrekRepository`/`EntityRepository`'s
   * own same-named method (a different signature; `BudgetItemsRepository
   * .insertItem`'s precedent).
   */
  async insertTemplate(name: string, created_by: number): Promise<number> {
    const inserted = await this.kysely<PackingTemplatesInsertKyselyDB>()
      .insertInto('packing_templates')
      .values({ name, created_by })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** PK71 (`updatePackingTemplate`) — `UPDATE packing_templates SET name = ? WHERE id = ?`. */
  async updateName(id: number | string, name: string): Promise<void> {
    await this.db()
      .updateTable('packing_templates')
      .set({ name })
      .where('id', '=', id as number)
      .execute();
  }

  /** PK74 (`deletePackingTemplate`) — `DELETE FROM packing_templates WHERE id = ?`. */
  async delete(id: number | string): Promise<void> {
    await this.nativeDelete({ id: id as number });
  }
}
