import type { HiddenRegions } from '../entities/HiddenRegions.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type HiddenRegionsKyselyDB = Pick<DB, 'hidden_regions'>;

/**
 * `hidden_regions` — the region-level sibling of `hidden_countries`'s
 * #1490 tombstone (Plan 3f Task 1, atlas): `unmarkRegion` writes one
 * unconditionally (see the doc comment on `AtlasService#unmarkRegion` at
 * HEAD, `:692-694` — unlike the country cascade, this one runs even for a
 * manually-marked region).
 */
export class HiddenRegionsRepository extends TrekRepository<HiddenRegions> {
  private db() {
    return this.kysely<HiddenRegionsKyselyDB>();
  }

  /** AT22 (`getHiddenRegions`) — `SELECT region_code FROM hidden_regions WHERE user_id = ?`. */
  async listForUser(userId: number): Promise<string[]> {
    const rows = await this.db()
      .selectFrom('hidden_regions')
      .select('region_code')
      .where('user_id', '=', userId)
      .execute();
    return rows.map((r) => r.region_code);
  }

  /** AT27 (`unmarkRegion`, inside its transaction) — `INSERT OR IGNORE INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)`. */
  async hide(userId: number, regionCode: string, countryCode: string): Promise<void> {
    await this.db()
      .insertInto('hidden_regions')
      .values({ user_id: userId, region_code: regionCode, country_code: countryCode })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** AT18 (`markRegion`, inside its transaction) — `DELETE FROM hidden_regions WHERE user_id = ? AND region_code = ?`. */
  async unhide(userId: number, regionCode: string): Promise<void> {
    await this.db()
      .deleteFrom('hidden_regions')
      .where('user_id', '=', userId)
      .where('region_code', '=', regionCode)
      .execute();
  }
}
