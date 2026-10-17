import { collateNoCase, columnIncrementedBy } from '../dialect/sql-functions';
import type { SchoolHolidayRegions } from '../entities/SchoolHolidayRegions.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A `school_holiday_regions` row as the API emits it, MINUS the synthesized
 * `country || '-MANUAL-' || id AS code` column (SH2/SH7) — computed in
 * `SchoolHolidaysService` from `country`/`id` instead of in SQL: it is pure,
 * derived data with no WHERE clause anywhere ever filtering on it (unlike
 * `VacayHolidayCalendars.region`, which stores this same string as a plain
 * value to MATCH against), so a JS template string after the read is exactly
 * as correct as the legacy SQL concatenation and needs no `concat()` dialect
 * helper.
 */
export interface SchoolHolidayRegionRow {
  id: number;
  country: string;
  name: string;
  revision: number;
}

const _schoolHolidayRegionRowKeys: AssertRowKeys<SchoolHolidayRegionRow, SchoolHolidayRegions> = true;

/**
 * `school_holiday_regions`'s single-table read/write shape (Plan 3f Task 2,
 * SH2/SH5/SH7/SH9/SH12/SH13/SH16). `country` is a `persist(false)` shadow
 * scalar of the real relation (`countryRef`, `.manyToOne(SchoolHolidayCountries)
 * .ref().joinColumn('country')`) — §14 of the plan's inventory flagged this
 * column as possibly FK-less; reading the entity directly (not assumed) shows
 * it IS FK-backed, just under the inverted naming this table's entity
 * generator produced (the relation carries the `Ref` suffix, the bare column
 * name is the plain-scalar shadow — the opposite of `SchoolHolidayPeriods
 * .region`/`.region_id`). A plain, unrestricted `find`/`findOne` (no `fields`
 * narrowing) hydrates `country` from the physical column exactly like any
 * other persist(false) shadow twin in this program (`TripPhotosRepository
 * .listTripIdsSharedForPhoto`'s docstring names the same trap for a narrowed
 * read) — every read below reads the whole row, so this never bites here.
 * Writes go through `countryRef` (the relation property), never `country`
 * itself (`persist(false)` silently drops a direct write), matching every
 * other shadow-FK write in this program (`DayNotesRepository.create`'s
 * `day: input.day_id` precedent).
 */
export class SchoolHolidayRegionsRepository extends TrekRepository<SchoolHolidayRegions> {
  /** SH2 — `SELECT *, country || '-MANUAL-' || id AS code FROM school_holiday_regions ORDER BY name, id` (code column computed by the service, see this file's own docstring). */
  async list(): Promise<SchoolHolidayRegionRow[]> {
    const regions = await this.find({}, { orderBy: { name: 'asc', id: 'asc' } });
    return regions.map((region) => toRow(region) as SchoolHolidayRegionRow);
  }

  /**
   * SH7 — same base text as SH2, single row, `WHERE id = ?`, no `ORDER BY`.
   * Named `findById`, not `find` (the base `EntityRepository.find` name is
   * already taken).
   */
  async findById(id: number): Promise<SchoolHolidayRegionRow | null> {
    const region = await this.findOne({ id });
    return region ? (toRow(region) as SchoolHolidayRegionRow) : null;
  }

  /**
   * SH5 — `SELECT id FROM school_holiday_regions WHERE country = ? LIMIT 1`
   * (`deleteCountry`'s "no region still references this country" guard).
   * Also the additive consumer Plan 3f Task 5 (`vacay.service.ts
   * #validateManualRegion`, VC45) calls, per the plan's own cross-domain
   * sequencing note — this repository lands first, so Task 5 gets a
   * populated method instead of leaving its own read raw a beat longer.
   */
  async existsForCountry(country: string): Promise<boolean> {
    const row = await this.findOne({ country }, { fields: ['id'] });
    return row !== null;
  }

  /**
   * SH9 (`checkName`'s duplicate-name guard) — `SELECT id FROM
   * school_holiday_regions WHERE country = ? AND name = ? COLLATE NOCASE
   * AND id != ?`. Uses `collateNoCase` (Plan 3f Task 0, R9) as the filter
   * KEY, the same `{ [lower(platform, col)]: value }` shape
   * `Users.repository.ts#findIdByUsernameCI` uses for its own
   * case-insensitive collision check — NOT `lower()`: the two helpers are
   * proven to agree on every input tested (Task 0's report, SQLF-061) but
   * are textually different SQL constructs matching two textually different
   * legacy statements, and the brief for this task is explicit that
   * `collateNoCase` is the one to use here, not a substitution.
   * `collateNoCase` renders the COLLATE on the column side (`name COLLATE
   * NOCASE = ?`) where the legacy statement spells it on the value side
   * (`name = ? COLLATE NOCASE`) — row-identical (SQLF-060), not just
   * assumed, per Task 0's own concern note for this task.
   */
  async findIdByNameCI(country: string, name: string, excludeId: number): Promise<number | null> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.findOne(
      { country, [collateNoCase(platform, 'name')]: name, id: { $ne: excludeId } },
      { fields: ['id'] },
    );
    return row?.id ?? null;
  }

  /**
   * SH12 — `INSERT INTO school_holiday_regions (country, name) VALUES (?,
   * ?)`. `revision` is omitted from the write, same as the legacy column
   * list — the entity's own default (`p.integer().default(1)`, verified
   * against `Migration20200101033600_create_school_holiday_countries.ts`'s
   * `revision INTEGER NOT NULL DEFAULT 1`) applies, matching the legacy
   * column default exactly. Named `insertRegion`, not `insert` (the base
   * `EntityRepository.insert` name is already taken).
   */
  async insertRegion(country: string, name: string): Promise<number> {
    return this.insert({ countryRef: country, name });
  }

  /**
   * SH13 (`updateRegion`) — `UPDATE school_holiday_regions SET name = ?,
   * revision = revision + 1 WHERE id = ? AND revision = ?`. A genuine
   * optimistic-concurrency ("lost update") guard, not a cosmetic detail:
   * this method returns the raw affected-row count (0 or 1) and does NOT
   * throw or interpret it itself — `nativeUpdate`'s own return value IS
   * that count, so nothing here can silently swallow a 0-row result the
   * way an ORM `nativeUpdate` wrapped in a helper that only returns the
   * updated entity would. `SchoolHolidaysService.updateRegion` is the one
   * that turns a 0 into `ConflictException`. `columnIncrementedBy`
   * (`InviteTokensRepository.incrementUsedCount`'s precedent) for the
   * sibling-column `revision + 1` — never a hand-spelled `raw()` call here.
   */
  async updateWithRevision(id: number, expectedRevision: number, name: string): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return this.nativeUpdate(
      { id, revision: expectedRevision },
      { name, revision: columnIncrementedBy(platform, 'revision', 1) },
    );
  }

  /**
   * SH16 — `DELETE FROM school_holiday_regions WHERE id = ?`. The caller
   * (`deleteRegion`) already re-read the region and checked its revision
   * inside the same transaction before calling this, so — same as
   * `SchoolHolidayCountriesRepository.remove` — the affected-row count is
   * never consulted.
   */
  async remove(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }
}
