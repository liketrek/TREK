import type { VacayUserYears } from '../entities/VacayUserYears.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `vacay_user_years` row as the legacy `SELECT *` returned it. */
export interface VacayUserYearRow {
  id: number;
  user_id: number;
  plan_id: number;
  year: number;
  vacation_days: number | null;
  carried_over: number | null;
}

const _vacayUserYearRowKeys: AssertRowKeys<VacayUserYearRow, VacayUserYears> = true;

export class VacayUserYearsRepository extends TrekRepository<VacayUserYears> {
  /**
   * VC34/VC98/VC109/VC123 — `SELECT * FROM vacay_user_years WHERE user_id = ?
   * AND plan_id = ? AND year = ?` (four identical-text call sites:
   * `updatePlan`'s carry-over chain, `addYear`, `deleteYear`, `getStats`).
   * Named `findForYear`, not `find` — `EntityRepository#find` already exists
   * with an incompatible signature.
   */
  async findForYear(userId: number, planId: number, year: number): Promise<VacayUserYearRow | null> {
    const row = await this.findOne({ user: userId, plan: planId, year });
    return row ? (toRow(row) as VacayUserYearRow) : null;
  }

  /** VC55 — `SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ?` (`acceptInvite`'s own-plan-to-date migration read, no `year` filter). */
  async listForUserAndPlan(userId: number, planId: number): Promise<VacayUserYearRow[]> {
    const rows = await this.find({ user: userId, plan: planId });
    return rows.map((row) => toRow(row) as VacayUserYearRow);
  }

  /**
   * VC11/VC56/VC64/VC99 — `INSERT OR IGNORE INTO vacay_user_years (user_id,
   * plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, ?, ?)`, one
   * method for all four call sites (`getOwnPlan`'s lazy seed, `acceptInvite`'s
   * carried-over migration, its all-plan-years seed, `addYear`'s per-user
   * seed) — two sites bind `vacationDays`/`carriedOver` as literal `30`/`0`
   * at the CALL SITE, one binds the actual prior values, one binds a
   * JS-computed carry-over; the VALUES an `INSERT OR IGNORE` writes are
   * identical whichever way the caller spells them (a literal `30` in the
   * legacy SQL text inserts the exact same row a bound `30` does), so a
   * single flexible method, not four near-duplicates.
   */
  async insertIgnore(
    userId: number,
    planId: number,
    year: number,
    vacationDays: number | null,
    carriedOver: number | null,
  ): Promise<void> {
    await this.upsert(
      { user: userId, plan: planId, year, vacation_days: vacationDays, carried_over: carriedOver },
      { onConflictFields: ['user', 'plan', 'year'], onConflictAction: 'ignore' },
    );
  }

  /**
   * VC35/VC126 — `INSERT INTO vacay_user_years (user_id, plan_id, year,
   * vacation_days, carried_over) VALUES (?, ?, ?, 30, ?) ON CONFLICT(user_id,
   * plan_id, year) DO UPDATE SET carried_over = ?` (`updatePlan`'s
   * carry-over recompute chain, `getStats`'s per-request write —
   * byte-identical statement, two call sites). `onConflictMergeFields:
   * ['carried_over']` is load-bearing (`PlaceRatingsRepository.upsertRating`'s
   * precedent): without it `em.upsert`'s default merge set would also touch
   * `vacation_days` on a conflict, which the legacy `DO UPDATE SET
   * carried_over = ?` never does — `vacation_days: 30` in the payload below
   * is only ever written on the INSERT branch, exactly as the legacy
   * statement's own literal `30` is.
   */
  async upsertCarriedOver(userId: number, planId: number, year: number, carriedOver: number): Promise<void> {
    await this.upsert(
      { user: userId, plan: planId, year, vacation_days: 30, carried_over: carriedOver },
      {
        onConflictFields: ['user', 'plan', 'year'],
        onConflictAction: 'merge',
        onConflictMergeFields: ['carried_over'],
      },
    );
  }

  /**
   * VC127 — `INSERT INTO vacay_user_years (user_id, plan_id, year,
   * vacation_days, carried_over) VALUES (?, ?, ?, ?, 0) ON CONFLICT(user_id,
   * plan_id, year) DO UPDATE SET vacation_days = excluded.vacation_days`
   * (`updateStats`) — a distinct conflict ACTION from {@link upsertCarriedOver}
   * (merges `vacation_days`, leaves `carried_over` untouched on conflict; the
   * literal `carried_over: 0` below is INSERT-branch-only, same reasoning).
   */
  async upsertVacationDays(userId: number, planId: number, year: number, vacationDays: number): Promise<void> {
    await this.upsert(
      { user: userId, plan: planId, year, vacation_days: vacationDays, carried_over: 0 },
      {
        onConflictFields: ['user', 'plan', 'year'],
        onConflictAction: 'merge',
        onConflictMergeFields: ['vacation_days'],
      },
    );
  }

  /** VC32 — `UPDATE vacay_user_years SET carried_over = 0 WHERE plan_id = ?` (`updatePlan`'s carry-over-disabled reset). */
  async resetCarriedOverForPlan(planId: number): Promise<void> {
    await this.nativeUpdate({ plan: planId }, { carried_over: 0 });
  }

  /** VC105 — `DELETE FROM vacay_user_years WHERE plan_id = ? AND year = ?` (`deleteYear`). */
  async deleteForYear(planId: number, year: number): Promise<void> {
    await this.nativeDelete({ plan: planId, year });
  }

  /** VC110 — `UPDATE vacay_user_years SET carried_over = ? WHERE user_id = ? AND plan_id = ? AND year = ?` (`deleteYear`'s year+1 carry-over recompute). */
  async updateCarriedOver(userId: number, planId: number, year: number, carriedOver: number): Promise<void> {
    await this.nativeUpdate({ user: userId, plan: planId, year }, { carried_over: carriedOver });
  }
}
