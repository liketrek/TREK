import type { PackingCategoryAssignees } from '../entities/PackingCategoryAssignees.entity';
import { TrekRepository } from './_shared/trek-repository';

/** PK58/PK61's joined projection. */
export interface PackingCategoryAssigneeRow {
  category_name: string;
  user_id: number;
  username: string;
  avatar: string | null;
}

interface PackingCategoryAssigneesKyselyDB {
  packing_category_assignees: { id: number; trip_id: number; category_name: string; user_id: number };
  users: { id: number; username: string; display_name: string | null; avatar: string | null };
}

interface PackingCategoryAssigneesInsertKyselyDB {
  packing_category_assignees: { trip_id: number | string; category_name: string; user_id: number };
}

/**
 * `packing_category_assignees` — who is "on the hook" for a packing
 * category. A surrogate `id` PK plus a `(trip, category_name, user)`
 * unique index (§16), unlike `packing_item_contributors`'s genuine
 * composite PK.
 *
 * `insertIgnore` used `upsertMany` with `onConflictAction: 'ignore'`
 * originally (the `AssignmentParticipantsRepository.insertIgnore` shape).
 * That form hydrates each row back through MikroORM's identity map after
 * the write, matching it against the condition it was given — and REST
 * hands this repository the raw route string for `trip_id` (the service
 * never parses it, rule 21's documented carry), so the post-write re-match
 * looked for `{"trip":"1", ...}` (a string) against rows the DB has as
 * `trip_id = 1` (an integer) and threw `Cannot find matching entity for
 * condition`, 500ing every non-empty roster (task-8-review.md H1). Kysely's
 * `INSERT OR IGNORE` has no such re-match step — it is the
 * `TodoCategoryAssigneesRepository.insertIgnore` /
 * `BudgetItemMembersRepository.insertIgnore` shape, and SQLite's own
 * column-affinity conversion (rule 15) accepts the string `trip_id`
 * exactly as the legacy raw-SQL statement did.
 */
export class PackingCategoryAssigneesRepository extends TrekRepository<PackingCategoryAssignees> {
  /**
   * PK58 (`getCategoryAssignees`) — `SELECT pca.category_name, pca.user_id,
   * COALESCE(u.display_name, u.username) AS username, u.avatar FROM
   * packing_category_assignees pca JOIN users u ON pca.user_id = u.id
   * WHERE pca.trip_id = ?`.
   */
  async listForTrip(trip_id: number | string): Promise<PackingCategoryAssigneeRow[]> {
    return await this.kysely<PackingCategoryAssigneesKyselyDB>()
      .selectFrom('packing_category_assignees as pca')
      .innerJoin('users as u', 'u.id', 'pca.user_id')
      .select([
        'pca.category_name',
        'pca.user_id',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
        'u.avatar',
      ])
      .where('pca.trip_id', '=', trip_id as number)
      .execute();
  }

  /** PK59 (`updateCategoryAssignees`'s replace-all) — `DELETE FROM packing_category_assignees WHERE trip_id = ? AND category_name = ?`. */
  async deleteForCategory(trip_id: number | string, category_name: string): Promise<void> {
    await this.nativeDelete({ trip: trip_id as number, category_name });
  }

  /**
   * PK60 (`updateCategoryAssignees`) — `INSERT OR IGNORE INTO
   * packing_category_assignees (trip_id, category_name, user_id) VALUES
   * (?, ?, ?)`, the legacy `prepare(...).run(...)` loop, one Kysely insert
   * per surviving id against the entity's real unique index
   * (`UNIQUE(trip_id, category_name, user_id)`,
   * `Migration20200101003700_create_packing_category_assignees.ts:9`). The
   * caller roster-scopes the ids before calling; the empty-array guard here
   * is defensive.
   */
  async insertIgnore(trip_id: number | string, category_name: string, user_ids: number[]): Promise<void> {
    if (user_ids.length === 0) return;
    for (const user_id of user_ids) {
      await this.kysely<PackingCategoryAssigneesInsertKyselyDB>()
        .insertInto('packing_category_assignees')
        .values({ trip_id, category_name, user_id })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }

  /** PK61 (`updateCategoryAssignees`'s post-write re-select) — `SELECT pca.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar FROM packing_category_assignees pca JOIN users u ON pca.user_id = u.id WHERE pca.trip_id = ? AND pca.category_name = ?`. */
  async listForCategory(
    trip_id: number | string,
    category_name: string,
  ): Promise<Omit<PackingCategoryAssigneeRow, 'category_name'>[]> {
    return await this.kysely<PackingCategoryAssigneesKyselyDB>()
      .selectFrom('packing_category_assignees as pca')
      .innerJoin('users as u', 'u.id', 'pca.user_id')
      .select(['pca.user_id', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('pca.trip_id', '=', trip_id as number)
      .where('pca.category_name', '=', category_name)
      .execute();
  }
}
