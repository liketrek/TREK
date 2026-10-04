import type { VacayCompanyHolidays } from '../entities/VacayCompanyHolidays.entity';
import { TrekRepository } from './_shared/trek-repository';

export class VacayCompanyHolidaysRepository extends TrekRepository<VacayCompanyHolidays> {
  /**
   * VC29/VC67 — `SELECT date, fraction FROM vacay_company_holidays WHERE
   * plan_id = ?` (`updatePlan`'s make-room-on-enable, narrower columns) and
   * `SELECT date, note, fraction FROM vacay_company_holidays WHERE plan_id = ?`
   * (`dissolvePlan`'s migration read, wider columns). One method returning all
   * three columns — `updatePlan` destructures only `date`/`fraction` off the
   * result, same rows either way. `fraction` is the half-holiday size (#2439).
   */
  async listForPlan(planId: number): Promise<{ date: string; note: string | null; fraction: number }[]> {
    const rows = await this.find({ plan: planId }, { fields: ['date', 'note', 'fraction'] });
    return rows.map((row) => ({ date: row.date, note: row.note ?? null, fraction: row.fraction }));
  }

  /** VC93/VC112 — `SELECT date, fraction FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ? ORDER BY date` (`getSharedCalendars`) and `SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ?` (`getEntries`, unordered, full row). Two distinct statements — two methods. */
  async listDatesForRange(planId: number, start: string, end: string): Promise<{ date: string; fraction: number }[]> {
    const rows = await this.find({ plan: planId, date: { $gte: start, $lt: end } }, { fields: ['date', 'fraction'], orderBy: { date: 'asc' } });
    return rows.map((row) => ({ date: row.date, fraction: row.fraction }));
  }

  /** VC112 — `SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ?` (`getEntries`, full row, unordered). */
  async listForRange(planId: number, start: string, end: string): Promise<{ id: number; plan_id: number; date: string; note: string | null; fraction: number }[]> {
    const rows = await this.find({ plan: planId, date: { $gte: start, $lt: end } });
    return rows.map((row) => ({ id: row.id, plan_id: row.plan_id, date: row.date, note: row.note ?? null, fraction: row.fraction }));
  }

  /** VC24-sibling: VC25 — `DELETE FROM vacay_company_holidays WHERE plan_id = ? AND date = ?` (`applyHolidayCalendars`'s auto-clear). */
  async deleteForPlanAndDate(planId: number, date: string): Promise<void> {
    await this.nativeDelete({ plan: planId, date });
  }

  /** VC104 — `DELETE FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ?` (`deleteYear`, the intersection-of-member-windows range). */
  async deleteForRange(planId: number, start: string, end: string): Promise<void> {
    await this.nativeDelete({ plan: planId, date: { $gte: start, $lt: end } });
  }

  /** VC70/VC73 — `INSERT OR IGNORE INTO vacay_company_holidays (plan_id, date, note, fraction) VALUES (?, ?, ?, ?)` (`dissolvePlan`'s two migration branches — identical statement). */
  async insertIgnore(planId: number, date: string, note: string, fraction: number): Promise<void> {
    await this.upsert({ plan: planId, date, note, fraction }, { onConflictFields: ['plan', 'date'], onConflictAction: 'ignore' });
  }

  /**
   * VC118/VC132 — `SELECT id, fraction FROM vacay_company_holidays WHERE
   * plan_id = ? AND date = ?` (`toggleCompanyHoliday`'s existing-row read) and
   * `SELECT fraction FROM vacay_company_holidays WHERE plan_id = ? AND date = ?`
   * (`toggleEntry`'s half-company-holiday read, #2439). Named
   * `findByPlanAndDate`, not `find` — `EntityRepository#find` already exists
   * with an incompatible signature.
   */
  async findByPlanAndDate(planId: number, date: string): Promise<{ id: number; fraction: number } | null> {
    const row = await this.findOne({ plan: planId, date }, { fields: ['id', 'fraction'] });
    return row ? { id: row.id, fraction: row.fraction } : null;
  }

  /** VC133 — `UPDATE vacay_company_holidays SET fraction = ? WHERE id = ?` (`toggleCompanyHoliday`'s whole/half conversion, #2439). */
  async updateFraction(id: number, fraction: number): Promise<void> {
    await this.nativeUpdate({ id }, { fraction });
  }

  /** VC119 — `DELETE FROM vacay_company_holidays WHERE id = ?` (`toggleCompanyHoliday`'s clear-on-repeat-click). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** VC120 — `INSERT INTO vacay_company_holidays (plan_id, date, note, fraction) VALUES (?, ?, ?, ?)` (`toggleCompanyHoliday`'s new row). */
  async insertHoliday(planId: number, date: string, note: string, fraction: number): Promise<void> {
    await this.insert({ plan: planId, date, note, fraction });
  }
}
