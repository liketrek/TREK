import type { BudgetItemMembers } from '../entities/BudgetItemMembers.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `budget_item_members` row — every scalar column, incl. the two `persist(false)` relation mirrors. */
export interface BudgetItemMemberRow {
  id: number;
  budget_item_id: number;
  user_id: number;
  paid: number;
  amount: number | null;
}

const _budgetItemMemberRowKeys: AssertRowKeys<BudgetItemMemberRow, BudgetItemMembers> = true;

/** BG1/BG11's joined projection — the member row plus the display fields `avatarUrl()` needs. */
export interface BudgetItemMemberWithUserRow {
  user_id: number;
  paid: number;
  amount: number | null;
  username: string;
  avatar: string | null;
}

interface BudgetItemMembersKyselyDB {
  budget_item_members: BudgetItemMemberRow;
  users: { id: number; username: string; display_name: string | null; avatar: string | null };
}

/** The insert-only shape — `id` is autoincrement and omitted from `.values()` below, matching `FileLinksWriteKyselyDB`'s precedent. */
interface BudgetItemMembersWriteKyselyDB {
  budget_item_members: { budget_item_id: number; user_id: number; paid: number; amount: number | null };
}

/**
 * `budget_item_members` — who splits a budget item, and whether they've
 * paid their share. Kysely throughout: `budget_item_id`/`user_id` are
 * `persist(false)` relation mirrors (the program-wide trap), and the
 * `INSERT OR IGNORE` write has no `em.upsert`-expressible single conflict
 * target that also matches every legacy column combination (some calls omit
 * `amount`, some pin it `NULL`) — Kysely's `ON CONFLICT DO NOTHING` is the
 * exact SQLite equivalent, matching the legacy statement.
 */
export class BudgetItemMembersRepository extends TrekRepository<BudgetItemMembers> {
  /** BG1 — `SELECT bm.user_id, bm.paid, bm.amount, COALESCE(u.display_name, u.username) AS username, u.avatar FROM budget_item_members bm JOIN users u WHERE bm.budget_item_id = ?`. */
  async listForItem(budget_item_id: number): Promise<BudgetItemMemberWithUserRow[]> {
    return await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.user_id', 'bm.paid', 'bm.amount', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('bm.budget_item_id', '=', budget_item_id)
      .execute();
  }

  /** BG11 (`listBudgetItems`'s member batch) — same projection as {@link listForItem}, `budget_item_id IN (dynamic)`, plus the item id for the caller to bucket rows by. */
  async listForItems(budget_item_ids: number[]): Promise<(BudgetItemMemberWithUserRow & { budget_item_id: number })[]> {
    if (budget_item_ids.length === 0) return [];
    return await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.budget_item_id', 'bm.user_id', 'bm.paid', 'bm.amount', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('bm.budget_item_id', 'in', budget_item_ids)
      .execute();
  }

  /** BG58 (`updateMembers`'s pre-image read) — `SELECT user_id, paid FROM budget_item_members WHERE budget_item_id = ?`. */
  async listUserPaid(budget_item_id: number): Promise<{ user_id: number; paid: number }[]> {
    return await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members')
      .select(['user_id', 'paid'])
      .where('budget_item_id', '=', budget_item_id)
      .execute();
  }

  /** TP62 (`TripsService.copy`'s bare member read) — `SELECT bm.* FROM budget_item_members bm JOIN budget_items b ON b.id = bm.budget_item_id WHERE b.trip_id = ?`. */
  async listRawForTrip(trip_id: number | string): Promise<BudgetItemMemberRow[]> {
    return await this.kysely<BudgetItemMembersKyselyDB & { budget_items: { id: number; trip_id: number } }>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('budget_items as b', 'b.id', 'bm.budget_item_id')
      .select(['bm.id', 'bm.budget_item_id', 'bm.user_id', 'bm.paid', 'bm.amount'])
      .where('b.trip_id', '=', trip_id as number)
      .execute();
  }

  /** BG73 (`calculateSettlement`'s member read) — the `budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)` subquery, re-expressed as a join (rule 23) — same result set. No `paid` column — unlike {@link listForItem}, this legacy statement never selected it. */
  async listForTripWithUsers(trip_id: number | string): Promise<{ budget_item_id: number; user_id: number; amount: number | null; username: string; avatar: string | null }[]> {
    return await this.kysely<BudgetItemMembersKyselyDB & { budget_items: { id: number; trip_id: number } }>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('budget_items as b', 'b.id', 'bm.budget_item_id')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.budget_item_id', 'bm.user_id', 'bm.amount', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('b.trip_id', '=', trip_id as number)
      .execute();
  }

  /**
   * BG94 (`getPerPersonSummary`, #2525) — `SELECT bm.budget_item_id,
   * bm.user_id, bm.amount, bm.paid, COALESCE(u.display_name, u.username) AS
   * username, u.avatar FROM budget_item_members bm JOIN budget_items bi ON
   * bm.budget_item_id = bi.id JOIN users u ON bm.user_id = u.id WHERE
   * bi.trip_id = ?`. Like {@link listForTripWithUsers}, plus `paid`.
   */
  async listForTripWithUsersAndPaid(trip_id: number | string): Promise<(BudgetItemMemberWithUserRow & { budget_item_id: number })[]> {
    return await this.kysely<BudgetItemMembersKyselyDB & { budget_items: { id: number; trip_id: number } }>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('budget_items as bi', 'bi.id', 'bm.budget_item_id')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.budget_item_id', 'bm.user_id', 'bm.amount', 'bm.paid', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('bi.trip_id', '=', trip_id as number)
      .execute();
  }

  /** BG64 (`removeUserFromBudgetItems`) — `SELECT DISTINCT budget_item_id FROM budget_item_members WHERE user_id = ?`. */
  async listItemIdsForUser(user_id: number): Promise<number[]> {
    const rows = await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members')
      .select('budget_item_id')
      .distinct()
      .where('user_id', '=', user_id)
      .execute();
    return rows.map(r => r.budget_item_id);
  }

  /** BG65 — `DELETE FROM budget_item_members WHERE user_id = ?`. */
  async deleteForUser(user_id: number): Promise<void> {
    await this.kysely<BudgetItemMembersKyselyDB>().deleteFrom('budget_item_members').where('user_id', '=', user_id).execute();
  }

  /** BG66 (`removeUserFromBudgetItems`'s per-item recount, looped) — `SELECT COUNT(*) AS count FROM budget_item_members WHERE budget_item_id = ?`. */
  async countForItem(budget_item_id: number): Promise<number> {
    const row = await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('budget_item_id', '=', budget_item_id)
      .executeTakeFirst();
    return row?.count ?? 0;
  }

  /** BG70 (`toggleMemberPaid`'s re-select) — `SELECT bm.user_id, bm.paid, COALESCE(u.display_name, u.username) AS username, u.avatar FROM budget_item_members bm JOIN users u WHERE bm.budget_item_id = ? AND bm.user_id = ?`. No `amount` column — unlike {@link listForItem}, this legacy statement never selected it. */
  async findMemberWithUser(budget_item_id: number, user_id: number): Promise<{ user_id: number; paid: number; username: string; avatar: string | null } | undefined> {
    return await this.kysely<BudgetItemMembersKyselyDB>()
      .selectFrom('budget_item_members as bm')
      .innerJoin('users as u', 'u.id', 'bm.user_id')
      .select(['bm.user_id', 'bm.paid', (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where('bm.budget_item_id', '=', budget_item_id)
      .where('bm.user_id', '=', user_id)
      .executeTakeFirst();
  }

  /** BG69 — `UPDATE budget_item_members SET paid = ? WHERE budget_item_id = ? AND user_id = ?`. */
  async setPaid(budget_item_id: number, user_id: number, paid: number): Promise<void> {
    await this.kysely<BudgetItemMembersKyselyDB>()
      .updateTable('budget_item_members')
      .set({ paid })
      .where('budget_item_id', '=', budget_item_id)
      .where('user_id', '=', user_id)
      .execute();
  }

  /** BG35/BG38/BG59 — `DELETE FROM budget_item_members WHERE budget_item_id = ?` (replace-all before a re-insert). */
  async deleteForItem(budget_item_id: number): Promise<void> {
    await this.kysely<BudgetItemMembersKyselyDB>().deleteFrom('budget_item_members').where('budget_item_id', '=', budget_item_id).execute();
  }

  /**
   * BG26/BG27/BG36/BG39/BG60/TP63 — `INSERT OR IGNORE INTO
   * budget_item_members (budget_item_id, user_id, paid, amount) VALUES
   * (?,?,?,?)`, one row per call (the legacy `prepare(...).run(...)` loop —
   * the service calls this once per member, matching the legacy statement
   * text exactly for every call site: some pin `paid` to 0 and pass a real
   * or `NULL` amount, one (`updateMembers`) passes an existing `paid` flag
   * with no `amount` column at all — `paid`/`amount` default here to the
   * 0/`NULL` shape the omitting call sites bound literally).
   */
  async insertIgnore(row: { budget_item_id: number; user_id: number; paid?: number; amount?: number | null }): Promise<void> {
    await this.kysely<BudgetItemMembersWriteKyselyDB>()
      .insertInto('budget_item_members')
      .values({ budget_item_id: row.budget_item_id, user_id: row.user_id, paid: row.paid ?? 0, amount: row.amount ?? null })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
