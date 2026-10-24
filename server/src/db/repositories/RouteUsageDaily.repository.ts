import { nowDateOffset } from '../dialect/sql-functions';
import type { RouteUsageDaily } from '../entities/RouteUsageDaily.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A `route_usage_daily` row exactly as `SELECT *` reads it (RU3's shape,
 * snake_case). Named `RouteUsageDailyRow`, not `RouteUsageDayRow` —
 * `@trek/shared` already exports a `RouteUsageDayRow` (the camelCase API
 * shape `RouteUsageService.rows()` maps this into), and `route-usage.service.ts`
 * imports both; a same-named repository export would collide.
 */
export interface RouteUsageDailyRow {
  day: string;
  profile: string;
  surface: string;
  self_hosted: number;
  requests: number;
  waypoints: number;
  km: number;
  failed: number;
}

type RouteUsageDailyKyselyDB = Pick<DB, 'route_usage_daily'>;

/**
 * `route_usage_daily` — a composite-PK `(day, profile, surface, self_hosted)`
 * table (`RouteUsageDaily.entity.ts`'s `[PrimaryKeyProp]`, matching R4).
 * Kysely throughout: RU2's `ON CONFLICT ... DO UPDATE SET count = count +
 * excluded.count` shape (an ADDITIVE upsert) is genuinely beyond `em.upsert`
 * (`onConflictAction: 'merge'` always OVERWRITES — see {@link record}'s own
 * docstring), and once RU2 needs the escape hatch, the rest of the class
 * stays there too rather than mixing QB and Kysely for the same table.
 */
export class RouteUsageDailyRepository extends TrekRepository<RouteUsageDaily> {
  /**
   * RU2 (`RouteUsageService.record`, inside the caller's own `uow.transactional`,
   * once per batch entry) — `INSERT INTO route_usage_daily (day, profile,
   * surface, self_hosted, requests, waypoints, km, failed) VALUES
   * (date('now'), ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(day, profile, surface,
   * self_hosted) DO UPDATE SET requests = requests + excluded.requests,
   * waypoints = waypoints + excluded.waypoints, km = km + excluded.km,
   * failed = failed + excluded.failed`.
   *
   * **R4**: an ADDITIVE upsert, not a blind overwrite — `em.upsert`'s
   * `onConflictAction: 'merge'` (the shape `PlaceDetailsCacheRepository
   * .upsertEntry` already uses successfully for a composite-key upsert, R8)
   * has no way to express `col = col + excluded.col`: merge always REPLACES
   * the value with
   * the new one, it cannot reference the pre-existing row's own value in the
   * SET expression. Kysely's `onConflict(...).doUpdateSet(...)`, each column
   * an `eb(col, '+', eb.ref('excluded.col'))` binary-operator expression
   * (the `DocumentSyncItemsRepository`-precedent `eb.ref('excluded.x')` shape,
   * widened here from a blind `eb.ref(...)` re-assignment to a real `+`),
   * is the only shape that renders `col = col + excluded.col`.
   *
   * `day` is a plain bound parameter, not `date('now')` spelled into the
   * statement: the caller resolves "today" ONCE per batch (`todayUtc()`,
   * the 3f/`TripsRepository.lastStartedTrip` precedent for a BARE
   * `date('now')` with no offset — Task 0's report) rather than this
   * repository re-deriving a SQLite date function inline for every entry.
   * The legacy statement re-evaluated `date('now')` on every loop
   * iteration; a batch's entries import in the same tick, so this cannot
   * observably diverge except across a real UTC-midnight boundary mid-loop,
   * which the legacy code was equally exposed to (both resolve "today" once
   * per entry's own execution instant — the JS resolution just does it a
   * few microseconds earlier, at the loop's start rather than inside each
   * statement).
   */
  async record(entry: {
    day: string;
    profile: string;
    surface: string;
    self_hosted: number;
    requests: number;
    waypoints: number;
    km: number;
    failed: number;
  }): Promise<void> {
    await this.kysely<RouteUsageDailyKyselyDB>()
      .insertInto('route_usage_daily')
      .values(entry)
      .onConflict((oc) =>
        oc.columns(['day', 'profile', 'surface', 'self_hosted']).doUpdateSet({
          requests: (eb) => eb('requests', '+', eb.ref('excluded.requests')),
          waypoints: (eb) => eb('waypoints', '+', eb.ref('excluded.waypoints')),
          km: (eb) => eb('km', '+', eb.ref('excluded.km')),
          failed: (eb) => eb('failed', '+', eb.ref('excluded.failed')),
        }),
      )
      .execute();
  }

  /** RU3 (`RouteUsageService.rows`) — `SELECT * FROM route_usage_daily ORDER BY day DESC, profile, surface`. */
  async rows(): Promise<RouteUsageDailyRow[]> {
    const result = await this.kysely<RouteUsageDailyKyselyDB>()
      .selectFrom('route_usage_daily')
      .selectAll()
      .orderBy('day', 'desc')
      .orderBy('profile', 'asc')
      .orderBy('surface', 'asc')
      .execute();
    return result;
  }

  /**
   * RU4 (`RouteUsageService.purgeExpired`) — `DELETE FROM route_usage_daily
   * WHERE day < date('now', ?)`, `?` bound to `` `-${RETENTION_DAYS} days` ``.
   * `nowDateOffset` (Task 0's groundwork helper): `RETENTION_DAYS`
   * (`route-usage.service.ts`) is a compile-time module constant, so the
   * legacy statement's bound-modifier form and a literal day-count offset
   * are the same shape at this call site. `PlaceShadowPicksRepository
   * .expireStale`'s `nativeDelete({ created_at: { $lt: nowMinusDays(...) }
   * })` is the closest working precedent for the filter shape.
   */
  async purgeExpired(retentionDays: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return this.nativeDelete({ day: { $lt: nowDateOffset(platform, -retentionDays) } });
  }

  /** RU5 (`RouteUsageService.clear`) — `DELETE FROM route_usage_daily`, unscoped (the admin's "start over"). */
  async clear(): Promise<number> {
    return this.nativeDelete({});
  }
}
