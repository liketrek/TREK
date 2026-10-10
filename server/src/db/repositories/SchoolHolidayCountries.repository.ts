import type { SchoolHolidayCountries } from '../entities/SchoolHolidayCountries.entity';
import type { DB } from '../kysely/db';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `school_holiday_countries` row as the API emits it (SH1/SH3 — `SchoolHolidayCountryRequest`'s exact shape, `@trek/shared`). */
export interface SchoolHolidayCountryRow {
  code: string;
  name: string;
}

const _schoolHolidayCountryRowKeys: AssertRowKeys<SchoolHolidayCountryRow, SchoolHolidayCountries> = true;

/** `school_holiday_countries`'s single-table read/write shape (Plan 3f Task 2, SH1/SH3/SH4/SH6). */
export class SchoolHolidayCountriesRepository extends TrekRepository<SchoolHolidayCountries> {
  /** SH1 — `SELECT code, name FROM school_holiday_countries ORDER BY name, code`. */
  async list(): Promise<SchoolHolidayCountryRow[]> {
    const countries = await this.find({}, { orderBy: { name: 'asc', code: 'asc' } });
    return countries.map((country) => toRow(country) as SchoolHolidayCountryRow);
  }

  /**
   * SH3 — `SELECT code, name FROM school_holiday_countries WHERE code = ?`.
   * Named `findByCode`, not `find` (the base `EntityRepository.find` name is
   * already taken — every other repository in this program follows the same
   * `findById`/`findByCode`-style rename, e.g. `CategoriesRepository
   * .findById`).
   */
  async findByCode(code: string): Promise<SchoolHolidayCountryRow | null> {
    const country = await this.findOne({ code });
    return country ? (toRow(country) as SchoolHolidayCountryRow) : null;
  }

  /**
   * SH4 — `INSERT OR IGNORE INTO school_holiday_countries (code, name)
   * VALUES (?, ?)`. `code` is the table's own PRIMARY KEY (no separate
   * `uniques` constraint to name), so a plain `ON CONFLICT DO NOTHING` with
   * no column list (the `BudgetCategoryOrderRepository.insertIgnore`
   * precedent) covers it. Returns whether a row was actually inserted
   * (`result.changes > 0` in the legacy code) — `numInsertedOrUpdatedRows`
   * is Kysely's dialect-general affected-row count, 0 when the conflict
   * target (an existing `code`) already existed and the insert was
   * ignored — the `TripPhotosRepository.insertIgnore` precedent for
   * reporting this back to the caller as a boolean instead of swallowing it.
   */
  async insertIgnore(country: SchoolHolidayCountryRow): Promise<boolean> {
    const result = await this.kysely<SchoolHolidayCountriesKyselyDB>()
      .insertInto('school_holiday_countries')
      .values({ code: country.code, name: country.name })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();
    return (result?.numInsertedOrUpdatedRows ?? 0n) > 0n;
  }

  /**
   * SH6 — `DELETE FROM school_holiday_countries WHERE code = ?`. The legacy
   * caller (`SchoolHolidaysService.deleteCountry`) always pre-checks
   * existence (SH3, via `country()`) and the absence of any referencing
   * region (SH5) inside the same transaction before calling this, so the
   * affected-row count is never consulted — matching that, this returns
   * `void`, not a count.
   */
  async remove(code: string): Promise<void> {
    await this.nativeDelete({ code });
  }
}

type SchoolHolidayCountriesKyselyDB = Pick<DB, 'school_holiday_countries'>;
