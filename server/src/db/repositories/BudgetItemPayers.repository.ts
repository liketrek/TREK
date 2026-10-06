import type { BudgetItemPayers } from '../entities/BudgetItemPayers.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `budget_item_payers` row — every scalar column, incl. the two `persist(false)` relation mirrors. */
export interface BudgetItemPayerRow {
  id: number;
  budget_item_id: number;
  user_id: number;
  amount: number;
}

const _budgetItemPayerRowKeys: AssertRowKeys<BudgetItemPayerRow, BudgetItemPayers> = true;

/** BG2/BG12's joined projection. */
export interface BudgetItemPayerWithUserRow {
  user_id: number;
  amount: number;
  username: string;
  avatar: string | null;
}

interface BudgetItemPayersKyselyDB {
  budget_item_payers: BudgetItemPayerRow;
  users: { id: number; username: string; display_name: string | null; avatar: string | null };
}

/** The insert-only shape — `id` is autoincrement and omitted from `.values()` below, matching `FileLinksWriteKyselyDB`'s precedent. */
interface BudgetItemPayersWriteKyselyDB {
  budget_item_payers: { budget_item_id: number; user_id: number; amount: number };
}

/**
 * `budget_item_payers` — who actually paid a budget item, and how much.
 * Kysely throughout, same reasoning as `BudgetItemMembersRepository`'s class
 * docstring (`persist(false)` relation mirrors, an `INSERT OR IGNORE` with
 * no single `em.upsert` conflict target).
 */
export class BudgetItemPayersRepository extends TrekRepository<BudgetItemPayers> {
  /** BG2 — `SELECT bp.user_id, bp.amount, COALESCE(u.display_name, u.username) AS username, u.avatar FROM budget_item_payers bp JOIN users u WHERE bp.budget_item_id = ?`. */
  async listForItem(budget_item_id: number): Promise<BudgetItemPayerWithUserRow[]> {
    return await this.kysely<BudgetItemPayersKyselyDB>()
      .selectFrom('budget_item_payers as bp')
      .innerJoin('users as u', 'u.id', 'bp.user_id')
      .select([
        'bp.user_id',
        'bp.amount',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
        'u.avatar',
      ])
      .where('bp.budget_item_id', '=', budget_item_id)
      .execute();
  }

  /** BG12 (`listBudgetItems`'s payer batch) — same projection, `budget_item_id IN (dynamic)`, plus the item id for the caller to bucket rows by. */
  async listForItems(budget_item_ids: number[]): Promise<(BudgetItemPayerWithUserRow & { budget_item_id: number })[]> {
    if (budget_item_ids.length === 0) return [];
    return await this.kysely<BudgetItemPayersKyselyDB>()
      .selectFrom('budget_item_payers as bp')
      .innerJoin('users as u', 'u.id', 'bp.user_id')
      .select([
        'bp.budget_item_id',
        'bp.user_id',
        'bp.amount',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
        'u.avatar',
      ])
      .where('bp.budget_item_id', 'in', budget_item_ids)
      .execute();
  }

  /** TP64 (`TripsService.copy`'s bare payer read) — `SELECT bp.* FROM budget_item_payers bp JOIN budget_items b ON b.id = bp.budget_item_id WHERE b.trip_id = ?`. */
  async listRawForTrip(trip_id: number | string): Promise<BudgetItemPayerRow[]> {
    return await this.kysely<BudgetItemPayersKyselyDB & { budget_items: { id: number; trip_id: number } }>()
      .selectFrom('budget_item_payers as bp')
      .innerJoin('budget_items as b', 'b.id', 'bp.budget_item_id')
      .select(['bp.id', 'bp.budget_item_id', 'bp.user_id', 'bp.amount'])
      .where('b.trip_id', '=', trip_id as number)
      .execute();
  }

  /** BG74 (`calculateSettlement`'s payer read) — the `budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)` subquery, re-expressed as a join (rule 23) — same result set. */
  async listForTripWithUsers(
    trip_id: number | string,
  ): Promise<(BudgetItemPayerWithUserRow & { budget_item_id: number })[]> {
    return await this.kysely<BudgetItemPayersKyselyDB & { budget_items: { id: number; trip_id: number } }>()
      .selectFrom('budget_item_payers as bp')
      .innerJoin('budget_items as b', 'b.id', 'bp.budget_item_id')
      .innerJoin('users as u', 'u.id', 'bp.user_id')
      .select([
        'bp.budget_item_id',
        'bp.user_id',
        'bp.amount',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
        'u.avatar',
      ])
      .where('b.trip_id', '=', trip_id as number)
      .execute();
  }

  /** BG4 — `DELETE FROM budget_item_payers WHERE budget_item_id = ?` (replace-all before a re-insert). */
  async deleteForItem(budget_item_id: number): Promise<void> {
    await this.kysely<BudgetItemPayersKyselyDB>()
      .deleteFrom('budget_item_payers')
      .where('budget_item_id', '=', budget_item_id)
      .execute();
  }

  /** BG5/TP65 — `INSERT OR IGNORE INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?,?,?)`, one row per call (the legacy `prepare(...).run(...)` loop). */
  async insertIgnore(row: { budget_item_id: number; user_id: number; amount: number }): Promise<void> {
    await this.kysely<BudgetItemPayersWriteKyselyDB>()
      .insertInto('budget_item_payers')
      .values({ budget_item_id: row.budget_item_id, user_id: row.user_id, amount: row.amount })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
