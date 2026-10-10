import type { TodoCategoryAssignees } from '../entities/TodoCategoryAssignees.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** TD11/TD14's joined projection — the assignee row plus the display fields the picker needs. */
export interface TodoCategoryAssigneeRow {
  user_id: number;
  username: string;
  avatar: string | null;
}

type TodoCategoryAssigneesKyselyDB = Pick<DB, 'todo_category_assignees' | 'users'>;

type TodoCategoryAssigneesInsertKyselyDB = Pick<DB, 'todo_category_assignees'>;

/**
 * `todo_category_assignees` — which trip members are pinned to a to-do
 * category, driving the picker `TodoService.getCategoryAssignees`/
 * `updateCategoryAssignees` render. Kysely throughout: `trip_id`/`user_id`
 * are `persist(false)` relation mirrors (the program-wide trap), and the
 * `INSERT OR IGNORE` write has no single `em.upsert`-expressible conflict
 * target worth reaching for over Kysely's `ON CONFLICT DO NOTHING` (the
 * `BudgetItemMembersRepository.insertIgnore` precedent) — the entity's own
 * three-column unique (`trip`, `category_name`, `user`) is the constraint
 * SQLite's `INSERT OR IGNORE` already ignores a conflict against.
 */
export class TodoCategoryAssigneesRepository extends TrekRepository<TodoCategoryAssignees> {
  /** TD11 (`getCategoryAssignees`) — `SELECT tca.category_name, tca.user_id, u.username, u.avatar FROM todo_category_assignees tca JOIN users u ON tca.user_id = u.id WHERE tca.trip_id = ?`. */
  async listForTrip(trip_id: number | string): Promise<(TodoCategoryAssigneeRow & { category_name: string })[]> {
    return await this.kysely<TodoCategoryAssigneesKyselyDB>()
      .selectFrom('todo_category_assignees as tca')
      .innerJoin('users as u', 'u.id', 'tca.user_id')
      .select(['tca.category_name', 'tca.user_id', 'u.username', 'u.avatar'])
      .where('tca.trip_id', '=', trip_id as number)
      .execute();
  }

  /** TD12 (`updateCategoryAssignees`) — `DELETE FROM todo_category_assignees WHERE trip_id = ? AND category_name = ?` (replace-all before a re-insert). */
  async deleteForCategory(trip_id: number | string, category_name: string): Promise<void> {
    await this.kysely<TodoCategoryAssigneesKyselyDB>()
      .deleteFrom('todo_category_assignees')
      .where('trip_id', '=', trip_id as number)
      .where('category_name', '=', category_name)
      .execute();
  }

  /**
   * TD13 (`updateCategoryAssignees`, looped, roster-filtered) — `INSERT OR
   * IGNORE INTO todo_category_assignees (trip_id, category_name, user_id)
   * VALUES (?, ?, ?)`. The service filters `userIds` against
   * `DatabaseService.rosterUserIds` before calling this once per surviving
   * id — dropped rather than rejected: a copied trip carries assignee ids
   * across before its members exist, and a 400 would make the picker
   * unusable there. Kept exactly (`TodoService.updateCategoryAssignees`'s
   * own comment).
   */
  async insertIgnore(trip_id: number | string, category_name: string, user_id: number): Promise<void> {
    await this.kysely<TodoCategoryAssigneesInsertKyselyDB>()
      .insertInto('todo_category_assignees')
      .values({ trip_id: trip_id as number, category_name, user_id })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** TD14 (`updateCategoryAssignees`'s post-write re-select) — `SELECT tca.user_id, u.username, u.avatar FROM todo_category_assignees tca JOIN users u ON tca.user_id = u.id WHERE tca.trip_id = ? AND tca.category_name = ?`. */
  async listForCategory(trip_id: number | string, category_name: string): Promise<TodoCategoryAssigneeRow[]> {
    return await this.kysely<TodoCategoryAssigneesKyselyDB>()
      .selectFrom('todo_category_assignees as tca')
      .innerJoin('users as u', 'u.id', 'tca.user_id')
      .select(['tca.user_id', 'u.username', 'u.avatar'])
      .where('tca.trip_id', '=', trip_id as number)
      .where('tca.category_name', '=', category_name)
      .execute();
  }
}
