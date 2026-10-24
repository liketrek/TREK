import type { VacayYears } from '../entities/VacayYears.entity';
import { TrekRepository } from './_shared/trek-repository';

export class VacayYearsRepository extends TrekRepository<VacayYears> {
  /**
   * VC23/VC33/VC63/VC94 — `SELECT year FROM vacay_years WHERE plan_id = ?`
   * (VC23/VC63, unordered — `applyHolidayCalendars`, `acceptInvite`'s year
   * seeding, both iterate the set without caring about order) and `... ORDER
   * BY year` (VC33/VC94 — `updatePlan`'s carry-over chain, which walks
   * consecutive years and DOES need ascending order, and `listYears`, whose
   * caller renders them in order). One method, always ordered: adding
   * `ORDER BY year` to the two order-independent call sites changes nothing
   * about the ROW SET either reads (same rows, just enumerated consistently)
   * — flagged here as a non-behavioral consolidation, not a data-shape
   * change, so four near-duplicate statements don't become four near-
   * duplicate methods.
   */
  async listForPlan(planId: number): Promise<number[]> {
    const rows = await this.find({ plan: planId }, { fields: ['year'], orderBy: { year: 'asc' } });
    return rows.map((row) => row.year);
  }

  /** VC95/VC106 — `SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?` (`addYear`'s duplicate-year guard, `deleteYear`'s "does year+1 still exist" check). */
  async exists(planId: number, year: number): Promise<boolean> {
    const row = await this.findOne({ plan: planId, year }, { fields: ['id'] });
    return row !== null;
  }

  /** VC10 — `INSERT OR IGNORE INTO vacay_years (plan_id, year) VALUES (?, ?)` (`getOwnPlan`'s lazy year-seed). */
  async insertIgnore(planId: number, year: number): Promise<void> {
    await this.upsert({ plan: planId, year }, { onConflictFields: ['plan', 'year'], onConflictAction: 'ignore' });
  }

  /**
   * VC96 — `INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)` (`addYear`'s
   * plain insert, already guarded by {@link exists} outside the transaction —
   * no `OR IGNORE` needed here, unlike {@link insertIgnore} above). Named
   * `insertYear`, not `insert` — `EntityRepository#insert` already exists
   * with an incompatible signature.
   */
  async insertYear(planId: number, year: number): Promise<void> {
    await this.insert({ plan: planId, year });
  }

  /** VC108 — `SELECT year FROM vacay_years WHERE plan_id = ? AND year < ? ORDER BY year DESC LIMIT 1` (`deleteYear`'s new-previous-year lookup). */
  async previousYear(planId: number, beforeYear: number): Promise<number | null> {
    const row = await this.findOne(
      { plan: planId, year: { $lt: beforeYear } },
      { fields: ['year'], orderBy: { year: 'desc' } },
    );
    return row?.year ?? null;
  }

  /** VC100 — `DELETE FROM vacay_years WHERE plan_id = ? AND year = ?`. */
  async deleteForPlanAndYear(planId: number, year: number): Promise<void> {
    await this.nativeDelete({ plan: planId, year });
  }
}
