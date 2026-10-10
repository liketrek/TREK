import type { HiddenCountries } from '../entities/HiddenCountries.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type HiddenCountriesKyselyDB = Pick<DB, 'hidden_countries'>;

/**
 * `hidden_countries` — the #1490 tombstone table: a country derived from a
 * place/booking that the user explicitly removed, so `stats()`/
 * `getTravelStats()` must not re-derive it on the next request (Plan 3f
 * Task 1, atlas).
 */
export class HiddenCountriesRepository extends TrekRepository<HiddenCountries> {
  private db() {
    return this.kysely<HiddenCountriesKyselyDB>();
  }

  /** AT11 (`getHiddenCountries`) — `SELECT country_code FROM hidden_countries WHERE user_id = ?`. */
  async listForUser(userId: number): Promise<string[]> {
    const rows = await this.db()
      .selectFrom('hidden_countries')
      .select('country_code')
      .where('user_id', '=', userId)
      .execute();
    return rows.map((r) => r.country_code);
  }

  /** AT16 (`unmarkCountry`, inside its transaction) — `INSERT OR IGNORE INTO hidden_countries (user_id, country_code) VALUES (?, ?)`, the tombstone itself. */
  async hide(userId: number, countryCode: string): Promise<void> {
    await this.db()
      .insertInto('hidden_countries')
      .values({ user_id: userId, country_code: countryCode })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** AT13/AT20 (`markCountry`'s and `markRegion`'s "lift a prior removal" delete — identical text, two call sites) — `DELETE FROM hidden_countries WHERE user_id = ? AND country_code = ?`. */
  async unhide(userId: number, countryCode: string): Promise<void> {
    await this.db()
      .deleteFrom('hidden_countries')
      .where('user_id', '=', userId)
      .where('country_code', '=', countryCode)
      .execute();
  }
}
