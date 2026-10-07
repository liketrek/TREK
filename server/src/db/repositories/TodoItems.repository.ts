import { columnRef, currentTimestamp, nowMinusHours } from '../dialect/sql-functions';
import type { TodoItems } from '../entities/TodoItems.entity';
import { presenceSet } from './_shared/presence-set';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `todo_items` row — every scalar column, incl. the two `persist(false)` relation mirrors (`trip_id`, `assigned_user_id`). */
export interface TodoItemRow {
  id: number;
  trip_id: number;
  name: string;
  checked: number | null;
  category: string | null;
  sort_order: number | null;
  due_date: string | null;
  description: string | null;
  assigned_user_id: number | null;
  priority: number | null;
  created_at: string | null;
  reminded_at: string | null;
}

const _todoItemRowKeys: AssertRowKeys<TodoItemRow, TodoItems> = true;

interface TodoItemsKyselyDB {
  todo_items: TodoItemRow;
}

/** The insert-only shape for `insertItem` (TD3) — omits `id`/`created_at`/`reminded_at` (autoincrement / `DEFAULT CURRENT_TIMESTAMP` / never written here). */
interface TodoItemsInsertKyselyDB {
  todo_items: {
    trip_id: number | string;
    name: string;
    checked: number;
    category: string | null;
    sort_order: number;
    due_date: string | null;
    description: string | null;
    assigned_user_id: number | null;
    priority: number;
  };
}

/** The insert-only shape for `insertCopy` (TP73) — a distinct column set from {@link TodoItemsRepository.insertItem}'s: no `assigned_user_id` parameter at all (always written `NULL`, never taken from the caller). */
interface TodoItemsCopyInsertKyselyDB {
  todo_items: {
    trip_id: number | string;
    name: string;
    checked: number;
    category: string | null;
    sort_order: number | null;
    due_date: string | null;
    description: string | null;
    assigned_user_id: null;
    priority: number | null;
  };
}

/** `isoDate` + 1 calendar day, in UTC — turns {@link TodoItemsRepository.listDueForReminder}'s inclusive cutoff into an exclusive `$lt` bound (L2, task-7-review.md). */
function dayAfter(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * `todo_items` — Kysely throughout: `trip_id`/`assigned_user_id` are
 * `persist(false)` relation mirrors (the program-wide bare-`select`/`fields`
 * drop trap — `TripFilesRepository`'s class docstring, restated at Task 2's
 * `BudgetItemsRepository`/Task 6's TC-form), avoided the same way here by
 * going through Kysely for every statement rather than the QueryBuilder.
 */
export class TodoItemsRepository extends TrekRepository<TodoItems> {
  /** TD1 (`listItems`) — `SELECT * FROM todo_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC`. */
  async listForTrip(trip_id: number | string): Promise<TodoItemRow[]> {
    return await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .execute();
  }

  /** TD2 (`createItem`) — `SELECT MAX(sort_order) as max FROM todo_items WHERE trip_id = ?`. */
  async maxSortOrder(trip_id: number | string): Promise<number | null> {
    const row = await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .select((eb) => eb.fn.max('sort_order').as('max'))
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
    return row?.max ?? null;
  }

  /**
   * TD3 (`createItem`) — `INSERT INTO todo_items (trip_id, name, checked,
   * category, sort_order, due_date, description, assigned_user_id, priority)
   * VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`. Returns the new row's id (TD4's
   * re-select key). Named `insertItem`, not `create`/`insert` — both collide
   * with `TrekRepository`/`EntityRepository`'s own same-named methods (a
   * different signature: an unpersisted-entity builder, not an INSERT).
   */
  async insertItem(row: {
    trip_id: number | string;
    name: string;
    category: string | null;
    sort_order: number;
    due_date: string | null;
    description: string | null;
    assigned_user_id: number | null;
    priority: number;
  }): Promise<number> {
    const result = await this.kysely<TodoItemsInsertKyselyDB>()
      .insertInto('todo_items')
      .values({ ...row, checked: 0 })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /** TD4/TD7 (`createItem`/`updateItem`'s post-write re-select) — `SELECT * FROM todo_items WHERE id = ?` (no trip filter — the caller already knows `id` is in-scope, having just written it). */
  async findById(id: number | string): Promise<TodoItemRow | undefined> {
    return await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .selectAll()
      .where('id', '=', id as number)
      .executeTakeFirst();
  }

  /**
   * TD5 (`updateItem`'s trip-scoping guard) — `SELECT * FROM todo_items
   * WHERE id = ? AND trip_id = ?`. `id: number` (Plan 4 Task 8b, U6 — the
   * program's own gate-level id parsing carry: narrowed from `number |
   * string` now that `TodoController.update`/`.remove` parse `:id` once via
   * `toRowId` and thread the number down; `trip_id` stays `number | string`,
   * a separate, still-accepted carry — see `todo.service.ts`'s own note).
   */
  async findInTrip(id: number, trip_id: number | string): Promise<TodoItemRow | undefined> {
    return await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
  }

  /** TD8 (`deleteItem`'s trip-scoping guard) — `SELECT id FROM todo_items WHERE id = ? AND trip_id = ?`. `id: number`, same Plan 4 Task 8b narrowing as {@link findInTrip}. */
  async existsInTrip(id: number, trip_id: number | string): Promise<{ id: number } | undefined> {
    return await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .select('id')
      .where('id', '=', id)
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
  }

  /**
   * TD6 (`updateItem`) — the 7-column presence-sentinel `UPDATE` (R11's
   * helper — {@link presenceSet}, copying Task 2's `BudgetItemsRepository
   * .update` shape). `name`/`category` keep the legacy `COALESCE(?, col)`
   * truthy-wins semantics (the caller passes `present = !!value`, matching
   * `data.name || null` / `data.category || null`'s fall-through-on-falsy
   * exactly); every other column is a true presence sentinel bound off the
   * legacy `bodyKeys` array (`present = bodyKeys.includes('<col>')`).
   */
  async update(
    id: number,
    write: {
      name?: readonly [present: boolean, value: string];
      checked?: readonly [present: boolean, value: number];
      category?: readonly [present: boolean, value: string | null];
      due_date?: readonly [present: boolean, value: string | null];
      description?: readonly [present: boolean, value: string | null];
      assigned_user_id?: readonly [present: boolean, value: number | null];
      priority?: readonly [present: boolean, value: number];
    },
  ): Promise<void> {
    const data = presenceSet<{
      name: string;
      checked: number;
      category: string | null;
      due_date: string | null;
      description: string | null;
      assigned_user_id: number | null;
      priority: number;
    }>(write);
    if (Object.keys(data).length === 0) return;
    await this.kysely<TodoItemsKyselyDB>().updateTable('todo_items').set(data).where('id', '=', id).execute();
  }

  /** TD9 (`deleteItem`) — `DELETE FROM todo_items WHERE id = ?` (no trip scoping in the statement itself — relies on the caller's prior {@link existsInTrip} gate, matching legacy). `id: number`, same Plan 4 Task 8b narrowing as {@link findInTrip}. */
  async deleteById(id: number): Promise<void> {
    await this.kysely<TodoItemsKyselyDB>().deleteFrom('todo_items').where('id', '=', id).execute();
  }

  /** TD10 (`reorderItems`, looped) — `UPDATE todo_items SET sort_order = ? WHERE id = ? AND trip_id = ?`. */
  async setSortOrder(id: number | string, trip_id: number | string, sort_order: number): Promise<void> {
    await this.kysely<TodoItemsKyselyDB>()
      .updateTable('todo_items')
      .set({ sort_order })
      .where('id', '=', id as number)
      .where('trip_id', '=', trip_id as number)
      .execute();
  }

  /** TP72 (`TripsService.copy`) — `SELECT * FROM todo_items WHERE trip_id = ?`. */
  async listAllForTrip(trip_id: number | string): Promise<TodoItemRow[]> {
    return await this.kysely<TodoItemsKyselyDB>()
      .selectFrom('todo_items')
      .selectAll()
      .where('trip_id', '=', trip_id as number)
      .execute();
  }

  /**
   * TP73 (`TripsService.copy`) — `INSERT INTO todo_items (trip_id, name,
   * checked, category, sort_order, due_date, description, assigned_user_id,
   * priority) VALUES (?, ?, 0, ?, ?, ?, ?, NULL, ?)`. `assigned_user_id` is
   * hard-coded `NULL` here, never taken from the caller — the copy
   * deliberately does not carry the old assignee across, since the new trip
   * has no roster yet (`TripsService.copy`'s own comment, kept exactly).
   */
  async insertCopy(row: {
    trip_id: number | string;
    name: string;
    category: string | null;
    sort_order: number | null;
    due_date: string | null;
    description: string | null;
    priority: number | null;
  }): Promise<number> {
    const result = await this.kysely<TodoItemsCopyInsertKyselyDB>()
      .insertInto('todo_items')
      .values({ ...row, checked: 0, assigned_user_id: null })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 4 (`ReminderJobsService#todoTick`) — additive. `this.qb()`,
  // not Kysely: RJ5's dedup window needs `nowMinusHours` (a raw MikroORM
  // `RawQueryFragment` from `sql-functions.ts`, which composes with a
  // QueryBuilder/native filter but not with Kysely — the Kysely `sql` tag is
  // banned under `src/db/repositories/**`), and the join needs `columnRef`
  // to read `trip_id`/`assigned_user_id` (both `persist(false)` mirrors of
  // the real `trip`/`assignedUser` relations — a bare select silently drops
  // them, per `RoadtripDayBoundariesRepository`'s documented trap). `ti.trip`
  // is ALSO the join target here, so it is never itself selected (that
  // aliases off the JOINED row's own PK instead of the FK scalar —
  // `PlaceRatingsRepository.listForPlaces`'s documented trap); `t.user` is
  // safe to select bare (its target, `users`, is not separately joined in
  // this query), aliasing to the physical `user_id` column per
  // `TripsRepository.findAccessible`'s precedent.
  // ---------------------------------------------------------------------------

  /**
   * RJ4 (`reminder-jobs.service.ts#todoTick`) — restructured per Task 0's R9
   * ruling. Legacy: `SELECT ti.id, ti.trip_id, ti.name, ti.due_date,
   * ti.assigned_user_id, t.title AS trip_title, t.user_id AS trip_owner_id
   * FROM todo_items ti JOIN trips t ON t.id = ti.trip_id WHERE ti.checked = 0
   * AND ti.due_date IS NOT NULL AND ti.due_date <> '' AND date(ti.due_date)
   * <= date('now', '+' || ? || ' days') AND date(ti.due_date) >= date('now')
   * AND (ti.reminded_at IS NULL OR ti.reminded_at <= datetime('now', '-20
   * hours'))`.
   *
   * The `date('now', '+' || ? || ' days')`/`date('now')` bounds are
   * JS-computed by the caller (`todayDate`/`cutoffDate`, both `Date.UTC`-
   * based `YYYY-MM-DD` text — matching SQLite's own UTC `date('now')`, per
   * the same reasoning RJ3's restructuring documents) and bound directly
   * against `ti.due_date`. `due_date` is an unconstrained `z.string()` on
   * the wire, not always canonical `YYYY-MM-DD` text, so `date(ti.due_date)`'s
   * normalization is NOT a no-op: a time-bearing due date on the cutoff day
   * itself (`2026-07-14T09:00`) sorts lexically AFTER the bare cutoff date
   * string, so a plain `$lte: cutoffDate` drops it a day early (L2,
   * task-7-review.md). `date(ti.due_date) <= cutoffDate` is reproduced as an
   * exclusive `$lt` against the day AFTER cutoff instead of re-adding the
   * `date()` wrap (Kysely `sql` is banned under repositories). The
   * `datetime('now', '-20 hours')` dedup bound stays genuinely in SQL, via
   * `nowMinusHours` (Task 0's R9 helper) — RJ5's brief explicitly calls for
   * it, not a JS equivalent.
   */
  async listDueForReminder(todayDate: string, cutoffDate: string): Promise<TodoReminderRow[]> {
    const platform = this.getEntityManager().getPlatform();
    const rows = await this.qb('ti')
      .join('ti.trip', 't')
      .select([
        'ti.id',
        columnRef(platform, 'ti.trip_id'),
        'ti.name',
        'ti.due_date',
        columnRef(platform, 'ti.assigned_user_id'),
        't.title',
        't.user',
      ])
      .andWhere({ checked: 0 })
      .andWhere({ due_date: { $ne: null } })
      .andWhere({ due_date: { $ne: '' } })
      .andWhere({ due_date: { $gte: todayDate } })
      .andWhere({ due_date: { $lt: dayAfter(cutoffDate) } })
      .andWhere({ $or: [{ reminded_at: null }, { reminded_at: { $lte: nowMinusHours(platform, 20) } }] })
      .execute<TodoReminderQueryRow[]>('all', false);
    return rows.map((row) => ({
      id: row.id,
      trip_id: row.trip_id,
      name: row.name,
      due_date: row.due_date,
      assigned_user_id: row.assigned_user_id,
      trip_title: row.title,
      trip_owner_id: row.user_id,
    }));
  }

  /**
   * RJ5 (`reminder-jobs.service.ts#todoTick`, looped) — `UPDATE todo_items
   * SET reminded_at = CURRENT_TIMESTAMP WHERE id = ?`. Stays AFTER the
   * notification send in call order (plan3f-inputs.md correction #8 — a
   * documented, not-fixed-by-this-plan at-least-once ordering, unlike
   * `notifications.service.ts#respond`'s deliberately claim-then-act shape).
   */
  async markReminded(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { reminded_at: currentTimestamp(platform) });
  }
}

/** {@link TodoItemsRepository.listDueForReminder}'s raw QB row — before the `trip_title`/`trip_owner_id` rename. */
interface TodoReminderQueryRow {
  id: number;
  trip_id: number;
  name: string;
  due_date: string;
  assigned_user_id: number | null;
  title: string;
  user_id: number;
}

/** {@link TodoItemsRepository.listDueForReminder}'s output row. */
export interface TodoReminderRow {
  id: number;
  trip_id: number;
  name: string;
  due_date: string;
  assigned_user_id: number | null;
  trip_title: string;
  trip_owner_id: number;
}
