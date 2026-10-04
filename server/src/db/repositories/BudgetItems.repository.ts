import type { BudgetItems } from '../entities/BudgetItems.entity';
import { columnRef } from '../dialect/sql-functions';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import { presenceSet } from './_shared/presence-set';

/** A bare `budget_items` row — every scalar column, incl. the four `persist(false)` relation mirrors (the program-wide trap this class goes through Kysely to avoid). */
export interface BudgetItemRow {
  id: number;
  trip_id: number;
  category: string;
  name: string;
  total_price: number;
  persons: number | null;
  days: number | null;
  note: string | null;
  sort_order: number | null;
  created_at: string | null;
  paid_by_user_id: number | null;
  expense_date: string | null;
  reservation_id: number | null;
  currency: string | null;
  exchange_rate: number;
  ticket_json: string | null;
  place_id: number | null;
}

const _budgetItemRowKeys: AssertRowKeys<BudgetItemRow, BudgetItems> = true;

/** BG3/BG13's receipt projection (`loadItemReceipts`). */
export interface BudgetReceiptRow {
  id: number;
  filename: string;
  original_name: string;
  file_size: number | null;
  mime_type: string | null;
  trip_id: number;
}

/** BG7's receipt-link projection (`unlinkReceipts`'s pre-read). */
export interface BudgetReceiptLinkRow {
  id: number;
  file_id: number;
  reservation_id: number | null;
  assignment_id: number | null;
  place_id: number | null;
}

/** BG88's projection: what a row needs to be converted into the trip currency. */
export interface BudgetItemMoneyRow {
  id: number;
  category: string;
  total_price: number;
  currency: string | null;
  exchange_rate: number;
}

interface BudgetKyselyDB {
  budget_items: BudgetItemRow;
  budget_item_members: { id: number; budget_item_id: number; user_id: number; paid: number; amount: number | null };
  budget_category_order: { trip_id: number; category: string; sort_order: number };
  users: { id: number; username: string; display_name: string | null; avatar: string | null };
  trip_files: { id: number; filename: string; original_name: string; file_size: number | null; mime_type: string | null; trip_id: number; deleted_at: string | null; created_at: string | null };
  file_links: { id: number; file_id: number; reservation_id: number | null; assignment_id: number | null; place_id: number | null; budget_item_id: number | null; created_at: string | null };
}

/**
 * The insert-only shape for `create` (BG25) — omits `id`/`created_at`
 * (autoincrement/`DEFAULT CURRENT_TIMESTAMP`, matching the legacy column
 * list) and `paid_by_user_id` (never written by `BudgetService` — R11/§17
 * surprise 7, only `UserCleanupService`'s UC5 touches it).
 */
interface BudgetItemsInsertKyselyDB {
  budget_items: {
    trip_id: number | string; category: string; name: string; total_price: number; currency: string | null;
    exchange_rate: number; persons: number | null; days: number | null; note: string | null; ticket_json: string | null;
    sort_order: number; expense_date: string | null; reservation_id: number | null; place_id: number | null;
  };
}

/** The insert-only shape for `insertCopy` (TP61) — a distinct column set/order from `create`'s, carrying `paid_by_user_id` verbatim (§17). */
interface BudgetItemsCopyInsertKyselyDB {
  budget_items: {
    trip_id: number | string; category: string; name: string; total_price: number; persons: number | null; days: number | null;
    note: string | null; sort_order: number | null; reservation_id: number | null; currency: string | null;
    exchange_rate: number; expense_date: string | null; ticket_json: string | null; paid_by_user_id: number | null;
  };
}

/**
 * `budget_items` — the expense rows themselves, plus this domain's own view
 * of its receipts (a join across `trip_files`/`file_links`, the same way
 * `BudgetSettlements.SETTLEMENT_SELECT` joins `users`). Kysely throughout:
 * `trip_id`/`paid_by_user_id`/`reservation_id`/`place_id` are all
 * `persist(false)` relation mirrors (§16) — the program-wide bare-`select`
 * drop trap `TripFilesRepository`'s class docstring names, avoided the same
 * way here.
 */
export class BudgetItemsRepository extends TrekRepository<BudgetItems> {
  /**
   * FL4 (`FilesService.findForeignLinkTarget`'s budget-expense branch, R12)
   * — kept from Task 1, unchanged.
   */
  async findTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('b')
      .select([columnRef(platform, 'b.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  /**
   * BG10 (`listBudgetItems`) — `SELECT bi.* FROM budget_items bi LEFT JOIN
   * budget_category_order bco ON bco.trip_id = bi.trip_id AND bco.category =
   * bi.category WHERE bi.trip_id = ? ORDER BY COALESCE(bco.sort_order,
   * 999999) ASC, bi.sort_order ASC`.
   */
  async listWithCategoryOrder(trip_id: number | string): Promise<BudgetItemRow[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items as bi')
      .leftJoin('budget_category_order as bco', (join) => join.onRef('bco.trip_id', '=', 'bi.trip_id').onRef('bco.category', '=', 'bi.category'))
      .selectAll('bi')
      .where('bi.trip_id', '=', trip_id as number)
      .orderBy((eb) => eb.fn.coalesce('bco.sort_order', eb.val(999999)), 'asc')
      .orderBy('bi.sort_order', 'asc')
      .execute();
  }

  /** BG14 — `SELECT currency FROM budget_items WHERE id = ? AND trip_id = ?`. `id: number` (Plan 4 Task 8b, U6 — the program's gate-level id parsing carry: its one caller, `freezeForeignRate`, is only reached with `BudgetController.update`'s `toRowId`-parsed id). */
  async getCurrency(id: number, trip_id: number | string): Promise<string | null | undefined> {
    const row = await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select('currency').where('id', '=', id).where('trip_id', '=', trip_id as number).executeTakeFirst();
    return row?.currency;
  }

  /** BG31/BG32/BG57 — `SELECT * FROM budget_items WHERE id = ? AND trip_id = ?`, the full-row trip-scoping guard. `id: number`, same Plan 4 Task 8b narrowing as {@link getCurrency}; `trip_id` stays `number | string`, a separate, still-accepted carry. */
  async findInTrip(id: number, trip_id: number | string): Promise<BudgetItemRow | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').selectAll().where('id', '=', id).where('trip_id', '=', trip_id as number).executeTakeFirst();
  }

  /** BG50/BG68 — `SELECT id FROM budget_items WHERE id = ? AND trip_id = ?`, the id-only trip-scoping guard. `id: number`, same Plan 4 Task 8b narrowing as {@link getCurrency}. */
  async existsInTrip(id: number, trip_id: number | string): Promise<{ id: number } | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select('id').where('id', '=', id).where('trip_id', '=', trip_id as number).executeTakeFirst();
  }

  /** BG52 (`deleteBudgetItem`'s pre-image) — `SELECT id, reservation_id FROM budget_items WHERE id = ? AND trip_id = ?`. `id: number`, same Plan 4 Task 8b narrowing as {@link getCurrency}. */
  async findForDelete(id: number, trip_id: number | string): Promise<{ id: number; reservation_id: number | null } | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select(['id', 'reservation_id']).where('id', '=', id).where('trip_id', '=', trip_id as number).executeTakeFirst();
  }

  /** BG30/BG49/BG51/BG63 — `SELECT * FROM budget_items WHERE id = ?`, the post-write re-select (no trip filter — the caller already knows `id` is in-scope, having just written it). `id: number`, same Plan 4 Task 8b narrowing as {@link getCurrency}. */
  async findById(id: number): Promise<BudgetItemRow | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').selectAll().where('id', '=', id).executeTakeFirst();
  }

  /** BG21 — `SELECT MAX(sort_order) as max FROM budget_items WHERE trip_id = ?`. */
  async maxSortOrder(trip_id: number | string): Promise<number | null> {
    const row = await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select((eb) => eb.fn.max('sort_order').as('max')).where('trip_id', '=', trip_id as number).executeTakeFirst();
    return row?.max ?? null;
  }

  /**
   * BG25 (`createBudgetItem`) — `INSERT INTO budget_items (14 cols) VALUES
   * (?×14)`. Returns the new row's id (BG30's re-select key). Named
   * `insertItem`, not `create`/`insert` — both collide with
   * `TrekRepository`/`EntityRepository`'s own same-named methods (a
   * different signature: an unpersisted-entity builder, not an INSERT).
   */
  async insertItem(row: {
    trip_id: number | string; category: string; name: string; total_price: number; currency: string | null;
    exchange_rate: number; persons: number | null; days: number | null; note: string | null; ticket_json: string | null;
    sort_order: number; expense_date: string | null; reservation_id: number | null; place_id: number | null;
  }): Promise<number> {
    const result = await this.kysely<BudgetItemsInsertKyselyDB>().insertInto('budget_items').values(row).executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /**
   * TP61 (`TripsService.copy`) — `INSERT INTO budget_items (trip_id,
   * category, name, total_price, persons, days, note, sort_order,
   * reservation_id, currency, exchange_rate, expense_date, ticket_json,
   * paid_by_user_id) VALUES (?×14)`, a distinct column set/order from
   * {@link create}'s — carries `paid_by_user_id` verbatim (§17, the "dead"
   * column survives a copy unexamined, matching legacy exactly).
   */
  async insertCopy(row: {
    trip_id: number | string; category: string; name: string; total_price: number; persons: number | null; days: number | null;
    note: string | null; sort_order: number | null; reservation_id: number | null; currency: string | null;
    exchange_rate: number; expense_date: string | null; ticket_json: string | null; paid_by_user_id: number | null;
  }): Promise<number> {
    const result = await this.kysely<BudgetItemsCopyInsertKyselyDB>().insertInto('budget_items').values(row).executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /**
   * BG33 (`updateBudgetItem`) — the 13-column presence-sentinel `UPDATE`
   * (the last two, `reservation_id`/`place_id`, link an expense to a booking
   * or a place, #2084)
   * (R11's helper — {@link presenceSet}; land here first, Tasks 3/4/5 copy
   * this shape). `category`/`name` keep the legacy `COALESCE(?, col)`
   * truthy-wins semantics (the caller passes `present = !!value`, matching
   * `data.category || null`'s fall-through-on-falsy exactly); every other
   * column is a true presence sentinel (`present = data.field !== undefined`).
   */
  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link getCurrency} (its one caller, `updateBudgetItem`, is only reached with a `toRowId`-parsed id). */
  async update(id: number, write: {
    category?: readonly [present: boolean, value: string];
    name?: readonly [present: boolean, value: string];
    total_price?: readonly [present: boolean, value: number];
    currency?: readonly [present: boolean, value: string | null];
    exchange_rate?: readonly [present: boolean, value: number];
    persons?: readonly [present: boolean, value: number | null];
    days?: readonly [present: boolean, value: number | null];
    note?: readonly [present: boolean, value: string | null];
    ticket_json?: readonly [present: boolean, value: string | null];
    sort_order?: readonly [present: boolean, value: number];
    expense_date?: readonly [present: boolean, value: string | null];
    reservation_id?: readonly [present: boolean, value: number | null];
    place_id?: readonly [present: boolean, value: number | null];
  }): Promise<void> {
    const data = presenceSet<{
      category: string; name: string; total_price: number; currency: string | null; exchange_rate: number;
      persons: number | null; days: number | null; note: string | null; ticket_json: string | null;
      sort_order: number; expense_date: string | null; reservation_id: number | null; place_id: number | null;
    }>(write);
    if (Object.keys(data).length === 0) return;
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set(data).where('id', '=', id).execute();
  }

  /** BG6/BG34 — `UPDATE budget_items SET total_price = ? WHERE id = ?`. */
  async setTotalPrice(id: number | string, total_price: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ total_price }).where('id', '=', id as number).execute();
  }

  /** BG37/BG40/BG61/BG62 — `UPDATE budget_items SET persons = ? WHERE id = ?` (`persons: null` is BG62's clear branch). */
  async setPersons(id: number | string, persons: number | null): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ persons }).where('id', '=', id as number).execute();
  }

  /** BG83 (`reorderItems`, looped) — `UPDATE budget_items SET sort_order = ? WHERE id = ? AND trip_id = ?`. */
  async setSortOrder(id: number | string, trip_id: number | string, sort_order: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ sort_order }).where('id', '=', id as number).where('trip_id', '=', trip_id as number).execute();
  }

  /** BG53 — `DELETE FROM budget_items WHERE id = ?` (no trip scoping in the statement itself — relies on the caller's prior {@link findForDelete} gate, matching legacy). `id: number`, same Plan 4 Task 8b narrowing as {@link getCurrency}. */
  async deleteById(id: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().deleteFrom('budget_items').where('id', '=', id).execute();
  }

  /** RS49 — `DELETE FROM budget_items WHERE id IN (dynamic)`, every expense the booking carried (#2084); a bound list, no interpolated SQL. */
  async deleteByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.kysely<BudgetKyselyDB>().deleteFrom('budget_items').where('id', 'in', ids).execute();
  }

  /** BG72 (`calculateSettlement`) — `SELECT * FROM budget_items WHERE trip_id = ?`. */
  async listAllForTrip(trip_id: number | string): Promise<BudgetItemRow[]> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').selectAll().where('trip_id', '=', trip_id as number).execute();
  }

  /**
   * `share.service.ts:391` SH14 (`getSharedTripData`'s share_budget read) —
   * `SELECT * FROM budget_items WHERE trip_id = ? ORDER BY category ASC`
   * (unlike BG72's `listAllForTrip` above, which has no `ORDER BY`).
   */
  async listPublicForShare(trip_id: number | string): Promise<BudgetItemRow[]> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').selectAll().where('trip_id', '=', trip_id as number).orderBy('category', 'asc').execute();
  }

  /**
   * BG88 (`tripTotals`, `getPerPersonSummary`) — `SELECT id, category,
   * total_price, currency, exchange_rate FROM budget_items WHERE trip_id = ?
   * ORDER BY id`. Replaces the BG71 aggregate (#2525): every row is now
   * converted into the trip currency in the service before anything is added.
   */
  async listMoneyRows(trip_id: number | string): Promise<BudgetItemMoneyRow[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select(['id', 'category', 'total_price', 'currency', 'exchange_rate'])
      .where('trip_id', '=', trip_id as number)
      .orderBy('id', 'asc')
      .execute();
  }

  /**
   * BG89 (`ratesForTripTotals`) — `SELECT 1 FROM budget_items WHERE trip_id = ?
   * AND currency IS NOT NULL AND currency != '' AND UPPER(currency) != ? AND
   * (exchange_rate IS NULL OR exchange_rate <= 0 OR exchange_rate = 1) LIMIT 1`.
   */
  async hasUnfrozenForeign(trip_id: number | string, trip_currency: string): Promise<boolean> {
    const row = await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select('id')
      .where('trip_id', '=', trip_id as number)
      .where('currency', 'is not', null)
      .where('currency', '!=', '')
      .where((eb) => eb(eb.fn<string>('upper', ['currency']), '!=', trip_currency))
      .where((eb) => eb.or([eb('exchange_rate', 'is', null), eb('exchange_rate', '<=', 0), eb('exchange_rate', '=', 1)]))
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  }

  /**
   * BG90's `budget_items` half (`freezeMissingRates`) — `SELECT UPPER(currency)
   * AS cur FROM budget_items WHERE trip_id = ? AND currency IS NOT NULL AND
   * currency != '' AND UPPER(currency) != ? AND (exchange_rate IS NULL OR exchange_rate <= 0 OR exchange_rate = 1)`.
   * The legacy statement UNIONed this with the settlements half; `DISTINCT`
   * here stands in for the dedupe the UNION did, and the caller merges, dedupes
   * and sorts the two lists.
   */
  async listUnfrozenForeignCurrencies(trip_id: number | string, trip_currency: string): Promise<string[]> {
    const rows = await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select((eb) => eb.fn<string>('upper', ['currency']).as('cur'))
      .distinct()
      .where('trip_id', '=', trip_id as number)
      .where('currency', 'is not', null)
      .where('currency', '!=', '')
      .where((eb) => eb(eb.fn<string>('upper', ['currency']), '!=', trip_currency))
      .where((eb) => eb.or([eb('exchange_rate', 'is', null), eb('exchange_rate', '<=', 0), eb('exchange_rate', '=', 1)]))
      .execute();
    return rows.map(r => r.cur);
  }

  /** BG91's `budget_items` half (`freezeMissingRates`) — `SELECT id FROM budget_items WHERE trip_id = ? AND UPPER(currency) = ? AND (exchange_rate IS NULL OR exchange_rate <= 0 OR exchange_rate = 1)`. */
  async listUnfrozenIdsForCurrency(trip_id: number | string, currency: string): Promise<number[]> {
    const rows = await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select('id')
      .where('trip_id', '=', trip_id as number)
      .where((eb) => eb(eb.fn<string>('upper', ['currency']), '=', currency))
      .where((eb) => eb.or([eb('exchange_rate', 'is', null), eb('exchange_rate', '<=', 0), eb('exchange_rate', '=', 1)]))
      .execute();
    return rows.map(r => r.id);
  }

  /** BG92's `budget_items` half (`freezeMissingRates`) — `UPDATE budget_items SET exchange_rate = ? WHERE trip_id = ? AND UPPER(currency) = ? AND (exchange_rate IS NULL OR exchange_rate <= 0 OR exchange_rate = 1)`, the compare-and-set write. */
  async freezeUnfrozenForCurrency(trip_id: number | string, currency: string, exchange_rate: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>()
      .updateTable('budget_items')
      .set({ exchange_rate })
      .where('trip_id', '=', trip_id as number)
      .where((eb) => eb(eb.fn<string>('upper', ['currency']), '=', currency))
      .where((eb) => eb.or([eb('exchange_rate', 'is', null), eb('exchange_rate', '<=', 0), eb('exchange_rate', '=', 1)]))
      .execute();
  }

  /** BG93 (`resyncReservationPrice`) — `SELECT total_price, currency FROM budget_items WHERE trip_id = ? AND reservation_id = ? ORDER BY id`, every expense linked to one booking (#2084). */
  async listLinkedToReservation(trip_id: number | string, reservation_id: number): Promise<{ total_price: number | null; currency: string | null }[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select(['total_price', 'currency'])
      .where('trip_id', '=', trip_id as number)
      .where('reservation_id', '=', reservation_id)
      .orderBy('id', 'asc')
      .execute();
  }

  /** BG17's `budget_items` half — `UPDATE budget_items SET currency = ? WHERE trip_id = ? AND (currency IS NULL OR currency = '')`. */
  async pinCurrency(trip_id: number | string, prev_currency: string): Promise<void> {
    await this.kysely<BudgetKyselyDB>()
      .updateTable('budget_items')
      .set({ currency: prev_currency })
      .where('trip_id', '=', trip_id as number)
      .where((eb) => eb.or([eb('currency', 'is', null), eb('currency', '=', '')]))
      .execute();
  }

  /** BG18's `budget_items` half — `SELECT DISTINCT currency AS cur FROM budget_items WHERE trip_id = ? AND currency IS NOT NULL`. */
  async listDistinctCurrencies(trip_id: number | string): Promise<string[]> {
    const rows = await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select('currency').distinct().where('trip_id', '=', trip_id as number).where('currency', 'is not', null).execute();
    return rows.map(r => r.currency as string);
  }

  /** BG19's `budget_items` half — `UPDATE budget_items SET exchange_rate = ? WHERE trip_id = ? AND currency = ?`. */
  async setExchangeRateForCurrency(trip_id: number | string, currency: string, exchange_rate: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ exchange_rate }).where('trip_id', '=', trip_id as number).where('currency', '=', currency).execute();
  }

  // ---------------------------------------------------------------------------
  // Receipts — budget's own view across `trip_files`/`file_links` (owned by
  // Plan 3e Task 1, consumed here the same way `Reservations`/`Places` are
  // consumed elsewhere: a cross-table Kysely read/write within the domain
  // that needs the join, not a new method on the owning task's repository —
  // Task 1's landed `TripFilesRepository`/`FileLinksRepository` do not carry
  // the item-scoped shapes this domain needs (see the task report's
  // deviation note).
  // ---------------------------------------------------------------------------

  /** BG3 (`loadItemReceipts`) — `SELECT f.id, f.filename, f.original_name, f.file_size, f.mime_type, f.trip_id FROM trip_files f JOIN file_links fl ON fl.file_id = f.id WHERE f.deleted_at IS NULL AND fl.budget_item_id = ? ORDER BY f.created_at ASC`. */
  async listReceipts(budget_item_id: number | string): Promise<BudgetReceiptRow[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('trip_files as f')
      .innerJoin('file_links as fl', 'fl.file_id', 'f.id')
      .select(['f.id', 'f.filename', 'f.original_name', 'f.file_size', 'f.mime_type', 'f.trip_id'])
      .where('f.deleted_at', 'is', null)
      .where('fl.budget_item_id', '=', budget_item_id as number)
      .orderBy('f.created_at', 'asc')
      .execute();
  }

  /** BG13 (`listBudgetItems`'s receipt batch) — same projection as {@link listReceipts} plus `fl.budget_item_id`, `fl.budget_item_id IN (dynamic)`. */
  async listReceiptsForItems(budget_item_ids: number[]): Promise<(BudgetReceiptRow & { budget_item_id: number })[]> {
    if (budget_item_ids.length === 0) return [];
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('trip_files as f')
      .innerJoin('file_links as fl', 'fl.file_id', 'f.id')
      .select(['f.id', 'f.filename', 'f.original_name', 'f.file_size', 'f.mime_type', 'f.trip_id', 'fl.budget_item_id'])
      .where('f.deleted_at', 'is', null)
      .where('fl.budget_item_id', 'in', budget_item_ids)
      .orderBy('f.created_at', 'asc')
      .execute();
  }

  /** BG7 (`unlinkReceipts`'s pre-read) — `SELECT fl.id, fl.file_id, fl.reservation_id, fl.assignment_id, fl.place_id FROM file_links fl JOIN trip_files f ON f.id = fl.file_id WHERE fl.budget_item_id = ? AND f.deleted_at IS NULL`. */
  async listReceiptLinks(budget_item_id: number | string): Promise<BudgetReceiptLinkRow[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('file_links as fl')
      .innerJoin('trip_files as f', 'f.id', 'fl.file_id')
      .select(['fl.id', 'fl.file_id', 'fl.reservation_id', 'fl.assignment_id', 'fl.place_id'])
      .where('fl.budget_item_id', '=', budget_item_id as number)
      .where('f.deleted_at', 'is', null)
      .execute();
  }

  /** BG8 (`unlinkReceipts`) — `UPDATE file_links SET budget_item_id = NULL WHERE id = ?`. */
  async clearLinkBudgetRef(link_id: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('file_links').set({ budget_item_id: null }).where('id', '=', link_id).execute();
  }

  /** BG9 (`unlinkReceipts`) — `DELETE FROM file_links WHERE id = ?`. */
  async deleteLink(link_id: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().deleteFrom('file_links').where('id', '=', link_id).execute();
  }

  /** BG29/BG44 — `SELECT id FROM trip_files WHERE id = ? AND trip_id = ? AND deleted_at IS NULL`, the receipt id's trip-scoping guard (security-critical). */
  async findTripFile(file_id: number, trip_id: number | string): Promise<{ id: number } | undefined> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('trip_files')
      .select('id')
      .where('id', '=', file_id)
      .where('trip_id', '=', trip_id as number)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  /** BG28/BG45 — `INSERT OR IGNORE INTO file_links (file_id, budget_item_id) VALUES (?, ?)`. */
  async insertReceiptLink(file_id: number, budget_item_id: number | string): Promise<void> {
    await this.kysely<{ file_links: { file_id: number; budget_item_id: number } }>()
      .insertInto('file_links')
      .values({ file_id, budget_item_id: budget_item_id as number })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** BG46 (`updateBudgetItem`'s `adopt`) — `UPDATE file_links SET budget_item_id = ? WHERE id = ?`, re-parenting a spare link row instead of inserting a duplicate. */
  async adoptSpareLink(link_id: number, budget_item_id: number | string): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('file_links').set({ budget_item_id: budget_item_id as number }).where('id', '=', link_id).execute();
  }

  /** BG47 — `SELECT 1 FROM file_links WHERE file_id = ? AND budget_item_id = ?`, the "already this item's receipt" short-circuit. */
  async linkAlreadyExists(file_id: number, budget_item_id: number | string): Promise<boolean> {
    const row = await this.kysely<BudgetKyselyDB>()
      .selectFrom('file_links')
      .select((eb) => eb.val(1).as('one'))
      .where('file_id', '=', file_id)
      .where('budget_item_id', '=', budget_item_id as number)
      .executeTakeFirst();
    return row !== undefined;
  }

  /** BG48 — `SELECT id FROM file_links WHERE file_id = ? AND budget_item_id IS NULL LIMIT 1` (`spare`), drives {@link adoptSpareLink}'s adopt-vs-insert branch. */
  async findSpareLink(file_id: number): Promise<{ id: number } | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('file_links').select('id').where('file_id', '=', file_id).where('budget_item_id', 'is', null).limit(1).executeTakeFirst();
  }

  // ---------------------------------------------------------------------------
  // Survivors — AC41/PL15/PL18/PL22/RS48/49/51-54/UC5 (R7). Converted here so
  // `accommodations.service.ts`/`places.service.ts`/`reservations.service.ts`/
  // `auth/user-cleanup.service.ts` gain a single repository method call in
  // place of the raw statement, never a new SQL string of their own.
  // ---------------------------------------------------------------------------

  /**
   * AC41 (`deleteAccommodation`) — `SELECT id FROM budget_items WHERE reservation_id = ?`,
   * every row: a booking can hold several expenses now (#2084), and the delete takes
   * them all.
   */
  async listIdsByReservation(reservation_id: number): Promise<{ id: number }[]> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select('id').where('reservation_id', '=', reservation_id).execute();
  }

  /** PL15 (`linkedExpenseIds`) — `SELECT id FROM budget_items WHERE trip_id = ? AND place_id IN (dynamic)`. */
  async listIdsForPlaces(trip_id: number | string, place_ids: (number | string)[]): Promise<number[]> {
    if (place_ids.length === 0) return [];
    const rows = await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select('id')
      .where('trip_id', '=', trip_id as number)
      .where('place_id', 'in', place_ids as number[])
      .execute();
    return rows.map(r => r.id);
  }

  /** PL18/PL22 — `DELETE FROM budget_items WHERE trip_id = ? AND place_id = ?`. */
  async deleteForPlace(trip_id: number | string, place_id: number | string): Promise<void> {
    await this.kysely<BudgetKyselyDB>().deleteFrom('budget_items').where('trip_id', '=', trip_id as number).where('place_id', '=', place_id as number).execute();
  }

  /** RS52/RS53 — `SELECT id FROM budget_items WHERE trip_id = ? AND reservation_id = ?`. */
  async findIdByReservationInTrip(trip_id: number | string, reservation_id: number | string): Promise<{ id: number } | undefined> {
    return await this.kysely<BudgetKyselyDB>().selectFrom('budget_items').select('id').where('trip_id', '=', trip_id as number).where('reservation_id', '=', reservation_id as number).executeTakeFirst();
  }

  /**
   * RS48/RS51 and the RS52 guard (`linkedBudgetItems`) — `SELECT id, category
   * FROM budget_items WHERE trip_id = ? AND reservation_id = ?`, every row: a
   * booking can hold several expenses now (#2084), so the delete takes them
   * all, the type change re-files each one still on the derived category, and
   * the price field is left alone once more than one is linked.
   */
  async listIdAndCategoryByReservation(trip_id: number | string, reservation_id: number | string): Promise<{ id: number; category: string }[]> {
    return await this.kysely<BudgetKyselyDB>()
      .selectFrom('budget_items')
      .select(['id', 'category'])
      .where('trip_id', '=', trip_id as number)
      .where('reservation_id', '=', reservation_id as number)
      .orderBy('id', 'asc')
      .execute();
  }

  /** RS54 — `UPDATE budget_items SET reservation_id = ? WHERE id = ?` (binds the reservation id verbatim — a string in the legacy call site, matching parity). */
  async setReservationId(id: number | string, reservation_id: number | string): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ reservation_id: reservation_id as number }).where('id', '=', id as number).execute();
  }

  /** UC5 (`UserCleanupService.cleanupUserReferences`) — `UPDATE budget_items SET paid_by_user_id = NULL WHERE paid_by_user_id = ?`. */
  async clearPaidByUser(user_id: number): Promise<void> {
    await this.kysely<BudgetKyselyDB>().updateTable('budget_items').set({ paid_by_user_id: null }).where('paid_by_user_id', '=', user_id).execute();
  }
}
