import type { VisitedCountries } from '../entities/VisitedCountries.entity';
import { TrekRepository } from './_shared/trek-repository';

/** `visited_countries` — every scalar column, `AT10`'s own read shape. */
export interface VisitedCountryRow {
  country_code: string;
  created_at: string | null;
  source: string;
}

/**
 * Two separate table shapes for the SAME `visited_countries` table, not one
 * shared interface: {@link listForUser} SELECTs `created_at`, while
 * {@link markVisited}/{@link markFromRegion} INSERT it never — the legacy
 * statements' own column lists omit it, leaving the schema's `DEFAULT
 * CURRENT_TIMESTAMP` to fill it in. Kysely validates `.values()` against
 * exactly the columns its `DB` type parameter declares (it has no notion of
 * "this column exists in the real table but is optional here" short of the
 * `Generated<>` wrapper, which — unlike every other column type in this
 * program — did not resolve `created_at` out of `InsertObject`'s required
 * set when tried here); declaring a NARROWER write-only shape that never
 * mentions `created_at` at all reproduces the legacy statement's own column
 * list exactly, with no wrapper needed.
 */
interface VisitedCountriesReadKyselyDB {
  visited_countries: { user_id: number; country_code: string; source: string; created_at: string | null };
}
interface VisitedCountriesWriteKyselyDB {
  visited_countries: { user_id: number; country_code: string; source: string };
}

/**
 * `visited_countries` — the user's own explicit "I've been here" marks
 * (Plan 3f Task 1, atlas). `markVisited` (AT12) needs the `changes > 0`
 * signal the legacy `.run(...).changes` gave (whether this call actually
 * ADDED the mark, not just re-confirmed one already there, so a caller
 * reporting "N countries added" doesn't double-count) — Kysely's
 * `InsertResult.numInsertedOrUpdatedRows` is the SQLite `changes` count
 * verbatim (`BudgetCategoryOrderRepository`'s own `insertIgnore`-vs-this
 * distinction: that one doesn't need the signal, this one does), so this one
 * write goes through Kysely rather than `em.upsert` (which has no comparable
 * "was this actually new" return).
 */
export class VisitedCountriesRepository extends TrekRepository<VisitedCountries> {
  private readDb() {
    return this.kysely<VisitedCountriesReadKyselyDB>();
  }

  private writeDb() {
    return this.kysely<VisitedCountriesWriteKyselyDB>();
  }

  /** AT10 (`listVisitedCountries`) — `SELECT country_code, created_at, source FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC`. */
  async listForUser(userId: number): Promise<VisitedCountryRow[]> {
    return await this.readDb()
      .selectFrom('visited_countries')
      .select(['country_code', 'created_at', 'source'])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * AT5/AT7/AT43 (`stats`'s no-trip early return, `stats`'s manual-country
   * merge, `getTravelStats`'s manual-country merge — three identical-text
   * call sites) — `SELECT country_code FROM visited_countries WHERE user_id
   * = ?`. Returns the bare code list; every one of the three callers only
   * ever reads `.country_code` off the legacy row shape.
   */
  async listCodesForUser(userId: number): Promise<string[]> {
    const rows = await this.writeDb()
      .selectFrom('visited_countries')
      .select('country_code')
      .where('user_id', '=', userId)
      .execute();
    return rows.map((r) => r.country_code);
  }

  /** AT8/AT9 (`countryPlaces`'s no-trip early return, `countryPlaces`'s mark lookup — identical text) — `SELECT source FROM visited_countries WHERE user_id = ? AND country_code = ?`. */
  async findSource(userId: number, countryCode: string): Promise<{ source: string } | undefined> {
    return await this.writeDb()
      .selectFrom('visited_countries')
      .select('source')
      .where('user_id', '=', userId)
      .where('country_code', '=', countryCode)
      .executeTakeFirst();
  }

  /**
   * AT12 (`markCountry`, inside its transaction) — `INSERT OR IGNORE INTO
   * visited_countries (user_id, country_code, source) VALUES (?, ?, ?)`.
   * Returns whether this call actually inserted a new row (see class
   * docstring) — the legacy `.changes > 0` this repository preserves.
   */
  async markVisited(userId: number, countryCode: string, source: 'manual' | 'dawarich'): Promise<boolean> {
    const result = await this.writeDb()
      .insertInto('visited_countries')
      .values({ user_id: userId, country_code: countryCode, source })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();
    return (result.numInsertedOrUpdatedRows ?? 0n) > 0n;
  }

  /** AT14 (`unmarkCountry`, inside its transaction) — `DELETE FROM visited_countries WHERE user_id = ? AND country_code = ?`. */
  async unmark(userId: number, countryCode: string): Promise<void> {
    await this.writeDb()
      .deleteFrom('visited_countries')
      .where('user_id', '=', userId)
      .where('country_code', '=', countryCode)
      .execute();
  }

  /**
   * AT19 (`markRegion`, inside its transaction) — `INSERT OR IGNORE INTO
   * visited_countries (user_id, country_code) VALUES (?, ?)`, a DISTINCT
   * 2-column variant of {@link markVisited}'s 3-column insert. The legacy
   * statement's column list omits `source`, letting the schema's own
   * `DEFAULT 'manual'` fill it — reproduced here by passing that literal
   * explicitly (`VisitedCountries.entity.ts`'s `source: p.text()
   * .default('manual')`, the exact same value the omitted column would
   * have taken). No `changes` signal here; the legacy statement never
   * checked it either.
   */
  async markFromRegion(userId: number, countryCode: string): Promise<void> {
    await this.writeDb()
      .insertInto('visited_countries')
      .values({ user_id: userId, country_code: countryCode, source: 'manual' })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
