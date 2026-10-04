import type { GoogleApiUsage } from '../entities/GoogleApiUsage.entity';
import { nowDateOffset } from '../dialect/sql-functions';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `google_api_usage` row: Google API calls counted per UTC day (#1582). */
export interface GoogleApiUsageRow {
  day: string;
  calls: number;
}

const _googleApiUsageRowKeys: AssertRowKeys<GoogleApiUsageRow, GoogleApiUsage> = true;

interface GoogleApiUsageKyselyDB {
  google_api_usage: GoogleApiUsageRow;
}

/**
 * `google_api_usage` — one row a day, nothing about who searched. Kysely
 * throughout, for the same reason as `RouteUsageDailyRepository`: GQ2's
 * `calls = calls + 1` is an ADDITIVE upsert, which `em.upsert`'s merge
 * cannot express.
 *
 * `day` is always bound by the caller (`todayUtc()`), the bare-`date('now')`
 * precedent `sql-functions.ts` documents: a JS UTC calendar date and SQLite's
 * `date('now')` are the same string.
 */
export class GoogleApiUsageRepository extends TrekRepository<GoogleApiUsage> {
  /** GQ1 (`usedToday`) — `SELECT calls FROM google_api_usage WHERE day = date('now')`, 0 when the day has no row. */
  async callsOn(day: string): Promise<number> {
    const row = await this.kysely<GoogleApiUsageKyselyDB>()
      .selectFrom('google_api_usage')
      .select('calls')
      .where('day', '=', day)
      .executeTakeFirst();
    return row?.calls ?? 0;
  }

  /**
   * GQ2 (`record`) — `INSERT INTO google_api_usage (day, calls) VALUES
   * (date('now'), 1) ON CONFLICT(day) DO UPDATE SET calls = calls + 1`.
   */
  async recordCall(day: string): Promise<void> {
    await this.kysely<GoogleApiUsageKyselyDB>()
      .insertInto('google_api_usage')
      .values({ day, calls: 1 })
      .onConflict((oc) => oc.column('day').doUpdateSet({ calls: (eb) => eb('calls', '+', 1) }))
      .execute();
  }

  /**
   * GQ3 (`status`) — `DELETE FROM google_api_usage WHERE day < date('now', ?)`,
   * `?` bound to `` `-${RETENTION_DAYS} days` `` (a module constant, so the
   * `nowDateOffset` fragment is the same shape, `RouteUsageDailyRepository
   * .purgeExpired`'s precedent).
   */
  async purgeExpired(retentionDays: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return this.nativeDelete({ day: { $lt: nowDateOffset(platform, -retentionDays) } });
  }
}
