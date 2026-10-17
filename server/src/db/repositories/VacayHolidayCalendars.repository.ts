import type { VacayHolidayCalendars } from '../entities/VacayHolidayCalendars.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `vacay_holiday_calendars` row as the legacy `SELECT *` returned it (Plan 3f Task 5). */
export interface VacayHolidayCalendarRow {
  id: number;
  plan_id: number;
  type: 'public_holiday' | 'school_holiday';
  region: string;
  label: string | null;
  color: string;
  sort_order: number;
}

const _vacayHolidayCalendarRowKeys: AssertRowKeys<VacayHolidayCalendarRow, VacayHolidayCalendars> = true;

/** `updateHolidayCalendar` (VC41)'s conditionally-included-fields patch — §15.9's JS-assembled SET list, mapped onto `nativeUpdate`'s own `undefined`-means-omit semantics, same shape as `VacayPlansRepository.update`. */
export interface VacayHolidayCalendarPatch {
  region?: string;
  type?: 'public_holiday' | 'school_holiday';
  label?: string | null;
  color?: string;
  sort_order?: number;
}

/**
 * Plan 3f Task 2 (`SchoolHolidaysService.deleteRegion`) appended
 * {@link VacayHolidayCalendarsRepository.existsForSchoolRegion} first — kept
 * untouched, exactly as landed; Task 5 (vacay) appends the rest of this
 * repository around it below, per the plan's own file-ownership rule for
 * this shared file (`.superpowers/sdd/2026-09-25-orm-phase3f/task-2-brief.md`
 * / `task-5-brief.md`).
 */
export class VacayHolidayCalendarsRepository extends TrekRepository<VacayHolidayCalendars> {
  /**
   * SH14 (`deleteRegion`'s cross-domain integrity guard, the reverse
   * direction of vacay's own VC45) — `SELECT id FROM vacay_holiday_calendars
   * WHERE type = 'school_holiday' AND region = ? LIMIT 1`. `region` is a
   * plain `.text()` column with no FK/relation to `SchoolHolidayRegions` at
   * all (§14/§15.9 of the plan's inventory, verified against both entities
   * directly, not assumed) — it stores the synthesized `<country>-MANUAL-
   * <id>` code as a free-form string, matched by VALUE, so this stays a
   * plain `WHERE` filter on two scalar columns, never a joined relation.
   */
  async existsForSchoolRegion(region: string): Promise<boolean> {
    const row = await this.findOne({ type: 'school_holiday', region }, { fields: ['id'] });
    return row !== null;
  }

  // ---------------------------------------------------------------------
  // Plan 3f Task 5 (`VacayService`) — additive, appended after Task 2's own
  // method above (untouched).
  // ---------------------------------------------------------------------

  /** VC22 — `SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? AND type = 'public_holiday' ORDER BY sort_order, id` (`applyHolidayCalendars`). */
  async listPublicForPlan(planId: number): Promise<VacayHolidayCalendarRow[]> {
    const rows = await this.find(
      { plan: planId, type: 'public_holiday' },
      { orderBy: { sort_order: 'asc', id: 'asc' } },
    );
    return rows.map((row) => toRow(row) as VacayHolidayCalendarRow);
  }

  /**
   * VC37/VC131 — `SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?
   * ORDER BY sort_order, id` (`updatePlan`'s re-select, `getPlanData` — two
   * identical-text call sites, one method).
   */
  async listForPlan(planId: number): Promise<VacayHolidayCalendarRow[]> {
    const rows = await this.find({ plan: planId }, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as VacayHolidayCalendarRow);
  }

  /** VC26 — `SELECT id FROM vacay_holiday_calendars WHERE plan_id = ?` (`migrateHolidayCalendars`'s one-time legacy-region migration guard — existence only, any row). */
  async existsForPlan(planId: number): Promise<boolean> {
    const row = await this.findOne({ plan: planId }, { fields: ['id'] });
    return row !== null;
  }

  /**
   * VC27/VC38 — `INSERT INTO vacay_holiday_calendars (plan_id, region, label,
   * color, sort_order) VALUES (?, ?, NULL, ?, 0)` (`migrateHolidayCalendars`,
   * `type` defaulted by the schema) and `INSERT INTO vacay_holiday_calendars
   * (plan_id, type, region, label, color, sort_order) VALUES (?, ?, ?, ?, ?,
   * ?)` (`addHolidayCalendar`, `type` explicit). One flexible method — the
   * legacy migration insert's implicit schema-default `type` and the
   * explicit insert's bound `type` write the identical column value when the
   * caller passes `'public_holiday'` for the former. Named `insertCalendar`,
   * not `insert` — `EntityRepository#insert` already exists with an
   * incompatible signature.
   */
  async insertCalendar(
    planId: number,
    type: 'public_holiday' | 'school_holiday',
    region: string,
    label: string | null,
    color: string,
    sortOrder: number,
  ): Promise<number> {
    return this.insert({ plan: planId, type, region, label, color, sort_order: sortOrder });
  }

  /**
   * VC39/VC42 — `SELECT * FROM vacay_holiday_calendars WHERE id = ?`
   * (`addHolidayCalendar`'s post-insert re-select, `updateHolidayCalendar`'s
   * post-write re-select — identical statement, two call sites). Named
   * `findById`, not `find` — `EntityRepository#find` already exists with an
   * incompatible signature.
   */
  async findById(id: number): Promise<VacayHolidayCalendarRow | null> {
    const row = await this.findOne({ id });
    return row ? (toRow(row) as VacayHolidayCalendarRow) : null;
  }

  /**
   * VC40/VC43 — `SELECT * FROM vacay_holiday_calendars WHERE id = ? AND
   * plan_id = ?` — the plan-scoping guard (`updateHolidayCalendar`'s own
   * read, `deleteHolidayCalendar`'s own read — identical statement, two call
   * sites).
   */
  async findScopedForPlan(id: number, planId: number): Promise<VacayHolidayCalendarRow | null> {
    const row = await this.findOne({ id, plan: planId });
    return row ? (toRow(row) as VacayHolidayCalendarRow) : null;
  }

  /** VC41 — `UPDATE vacay_holiday_calendars SET ${dynamic} WHERE id = ?`, §15.9's conditionally-included-fields shape (up to 5 optional columns). */
  async update(id: number, patch: VacayHolidayCalendarPatch): Promise<void> {
    if (Object.keys(patch).length === 0) return;
    await this.nativeUpdate({ id }, { ...patch });
  }

  /** VC44 — `DELETE FROM vacay_holiday_calendars WHERE id = ?` (`deleteHolidayCalendar`, called only after {@link findScopedForPlan} found a scoped row). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }
}
