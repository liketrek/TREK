import type { VisitedRegions } from '../entities/VisitedRegions.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** `visited_regions` — the columns `AT21`'s read needs. */
export interface VisitedRegionRow {
  region_code: string;
  region_name: string;
  country_code: string;
}

/**
 * The generated `visited_regions` table, under one alias for the reads
 * ({@link listForUser} SELECTs `created_at`) and one for `markVisited`,
 * which never binds it (see {@link VisitedCountriesRepository}).
 */
type VisitedRegionsReadKyselyDB = Pick<DB, 'visited_regions'>;
type VisitedRegionsWriteKyselyDB = Pick<DB, 'visited_regions'>;

/**
 * `visited_regions` — the user's own explicit region-level marks, plus the
 * regions `place_regions` derives (Plan 3f Task 1, atlas). `unmarkAllInCountry`
 * (AT15, filters on `country_code`) and `unmark` (AT26, filters on
 * `region_code`) are DIFFERENT statements over the same table — one deletes
 * every region in a country (`unmarkCountry`'s cascade), the other deletes
 * one specific region (`unmarkRegion`'s own delete) — never collapsed into
 * one method with a flag, matching the plan's own "two genuinely different
 * scoped checks stay two methods" ruling (R6) for this table's shape too.
 */
export class VisitedRegionsRepository extends TrekRepository<VisitedRegions> {
  private readDb() {
    return this.kysely<VisitedRegionsReadKyselyDB>();
  }

  private writeDb() {
    return this.kysely<VisitedRegionsWriteKyselyDB>();
  }

  /** AT21 (`listManuallyVisitedRegions`) — `SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC`. */
  async listForUser(userId: number): Promise<VisitedRegionRow[]> {
    return await this.readDb()
      .selectFrom('visited_regions')
      .select(['region_code', 'region_name', 'country_code'])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /** AT24 (`hasVisibleRegionForCountry`) — `SELECT region_code FROM visited_regions WHERE user_id = ? AND country_code = ?`. */
  async listRegionCodesForCountry(userId: number, countryCode: string): Promise<string[]> {
    const rows = await this.writeDb()
      .selectFrom('visited_regions')
      .select('region_code')
      .where('user_id', '=', userId)
      .where('country_code', '=', countryCode)
      .execute();
    return rows.map((r) => r.region_code);
  }

  /** AT25 (`unmarkRegion`, inside its transaction) — `SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ?`. */
  async findCountryCode(userId: number, regionCode: string): Promise<string | undefined> {
    const row = await this.writeDb()
      .selectFrom('visited_regions')
      .select('country_code')
      .where('user_id', '=', userId)
      .where('region_code', '=', regionCode)
      .executeTakeFirst();
    return row?.country_code;
  }

  /** AT17 (`markRegion`, inside its transaction) — `INSERT OR IGNORE INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)`. */
  async markVisited(userId: number, regionCode: string, regionName: string, countryCode: string): Promise<void> {
    await this.writeDb()
      .insertInto('visited_regions')
      .values({ user_id: userId, region_code: regionCode, region_name: regionName, country_code: countryCode })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** AT15 (`unmarkCountry`, inside its transaction) — `DELETE FROM visited_regions WHERE user_id = ? AND country_code = ?` (every region in the country). */
  async unmarkAllInCountry(userId: number, countryCode: string): Promise<void> {
    await this.writeDb()
      .deleteFrom('visited_regions')
      .where('user_id', '=', userId)
      .where('country_code', '=', countryCode)
      .execute();
  }

  /** AT26 (`unmarkRegion`, inside its transaction) — `DELETE FROM visited_regions WHERE user_id = ? AND region_code = ?` (one region). */
  async unmark(userId: number, regionCode: string): Promise<void> {
    await this.writeDb()
      .deleteFrom('visited_regions')
      .where('user_id', '=', userId)
      .where('region_code', '=', regionCode)
      .execute();
  }
}
