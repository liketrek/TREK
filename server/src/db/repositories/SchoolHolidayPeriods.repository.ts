import type { SchoolHolidayPeriods } from '../entities/SchoolHolidayPeriods.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { SchoolHolidayPeriod } from '@trek/shared';

/**
 * `school_holiday_periods`'s single-table read/write shape (Plan 3f Task 2,
 * SH8/SH10/SH11/SH15). No `AssertRowKeys` pairing here (unlike this
 * program's usual `toRow(entity) as Row` shape): the legacy SH8 statement
 * itself renames `start_date`/`end_date` to `startDate`/`endDate` via SQL
 * aliasing (the API's own `SchoolHolidayPeriod` shape, `@trek/shared`), so
 * the equivalent here is a plain field-renaming `.map()` after a narrowed
 * `find` (the `McpTokensRepository.listByUserAndKind` precedent for a
 * `fields`-narrowed-then-mapped projection), not a row interface whose keys
 * are expected to match the entity's column names 1:1.
 */
export class SchoolHolidayPeriodsRepository extends TrekRepository<SchoolHolidayPeriods> {
  /**
   * SH8 — `SELECT name, start_date AS startDate, end_date AS endDate FROM
   * school_holiday_periods WHERE region_id = ? ORDER BY start_date,
   * end_date, name`. `id`/`region_id` are not selected — the legacy
   * projection never returns them — so `fields` narrows to exactly the
   * three legacy columns; none of the three is a `persist(false)` shadow
   * scalar (that trap only applies to `region_id`, not selected here), so
   * narrowing is safe.
   */
  async listForRegion(region_id: number): Promise<SchoolHolidayPeriod[]> {
    const periods = await this.find(
      { region: region_id },
      { fields: ['name', 'start_date', 'end_date'], orderBy: { start_date: 'asc', end_date: 'asc', name: 'asc' } },
    );
    return periods.map((period) => ({ name: period.name, startDate: period.start_date, endDate: period.end_date }));
  }

  /**
   * SH10/SH15 — `DELETE FROM school_holiday_periods WHERE region_id = ?`,
   * the replace-all half of `writePeriods` (called from both `createRegion`
   * and `updateRegion`, plus `deleteRegion`'s own cleanup) and always
   * called from inside the surrounding `uow.transactional` block, same as
   * the legacy code.
   */
  async deleteForRegion(region_id: number): Promise<void> {
    await this.nativeDelete({ region: region_id });
  }

  /**
   * SH11 — `INSERT INTO school_holiday_periods (region_id, name,
   * start_date, end_date) VALUES (?, ?, ?, ?)`, the legacy `.prepare()`
   * -then-loop shape (the ONE such shape in this whole plan) — one batched
   * `insertMany` call here instead of N round trips, same end state (every
   * period row written), called only from inside the surrounding
   * transaction (never on its own). Named `insertPeriods`, not `insertMany`
   * (the base `EntityRepository.insertMany` name is already taken). Empty
   * `holidays` is a legitimate legacy no-op (the loop over an empty array
   * writes nothing) — guarded here rather than handed to `insertMany`,
   * matching every other batch-write method in this program
   * (`AssignmentParticipantsRepository.insertIgnore`'s precedent).
   */
  async insertPeriods(region_id: number, holidays: SchoolHolidayPeriod[]): Promise<void> {
    if (holidays.length === 0) return;
    await this.insertMany(
      holidays.map((holiday) => ({
        region: region_id,
        name: holiday.name,
        start_date: holiday.startDate,
        end_date: holiday.endDate,
      })),
    );
  }
}
