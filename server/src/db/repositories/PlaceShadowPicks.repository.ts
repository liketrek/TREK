import { countAll, countAllRef, maxOf, minOf, nowMinusDays } from '../dialect/sql-functions';
import type { PlaceShadowPicks } from '../entities/PlaceShadowPicks.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `place_shadow_picks` row as the API emits it. */
export interface PlaceShadowPickRow {
  id: number;
  created_at: string;
  query: string;
  lang: string | null;
  bias_lat: number | null;
  bias_lng: number | null;
  source: string;
  live_rank: number;
  live_count: number;
  picked_name: string;
  picked_lat: number;
  picked_lng: number;
  picked_place_id: string | null;
}

const _placeShadowPickRowKeys: AssertRowKeys<PlaceShadowPickRow, PlaceShadowPicks> = true;

/**
 * The column set of the legacy `record()` INSERT
 * (`place-shadow.service.ts:97-113`, PS2): `query`, `source`, `live_rank`,
 * `live_count`, `picked_name`, `picked_lat`, `picked_lng` required; the rest
 * nullable. The `round()` rounding, the `?? null` defaulting and the
 * `liveRank >= liveCount` drop all stay in `PlaceShadowService` (D4's
 * defaults rule) — this writes exactly the row it is given.
 */
export interface NewPlaceShadowPickRow {
  query: string;
  lang: string | null;
  bias_lat: number | null;
  bias_lng: number | null;
  source: string;
  live_rank: number;
  live_count: number;
  picked_name: string;
  picked_lat: number;
  picked_lng: number;
  picked_place_id: string | null;
}

export class PlaceShadowPicksRepository extends TrekRepository<PlaceShadowPicks> {
  /** `INSERT INTO place_shadow_picks (query, lang, bias_lat, bias_lng, source, live_rank, live_count, picked_name, picked_lat, picked_lng, picked_place_id) VALUES (?×11)` (PS2). `this.insert`, no read-back — the caller (`record()`) only needs to know the write happened. */
  async insertPick(row: NewPlaceShadowPickRow): Promise<void> {
    await this.insert({ ...row });
  }

  /**
   * `SELECT * FROM place_shadow_picks WHERE id > ? ORDER BY id LIMIT ?`
   * (`place-shadow.service.ts:124-131`, PS3) — `size` is the PAGE size; this
   * fetches `size + 1` rows (the keyset-pagination probe row the caller uses
   * to compute `nextAfter`), matching the legacy statement's own `LIMIT
   * size + 1` exactly. Caller does the `after ?? 0` defaulting and the
   * `min(max(1, limit), EXPORT_PAGE_SIZE)` clamp (D4's defaults rule).
   */
  async page(after: number, size: number): Promise<PlaceShadowPickRow[]> {
    const rows = await this.find({ id: { $gt: after } }, { orderBy: { id: 'asc' }, limit: size + 1 });
    return rows.map((r) => toRow(r) as PlaceShadowPickRow);
  }

  /**
   * `SELECT COUNT(*) AS total, MIN(created_at) AS oldest, MAX(created_at) AS newest
   *  FROM place_shadow_picks` (`place-shadow.service.ts:143-145`, PS4) — one
   * row, always (SQLite's bare aggregate SELECT never returns zero rows),
   * so `total` defaults to `0`/`oldest`/`newest` to `null` only for
   * type-safety against an `undefined` row, not because the query itself
   * can come back empty.
   */
  async totals(): Promise<{ total: number; oldest: string | null; newest: string | null }> {
    const platform = this.getEntityManager().getPlatform();
    // Task 9 fix wave (B-L5): a bare aggregate `SELECT` always returns one
    // row (the docstring above), so `row` is never `undefined` — the
    // previous `row?.x ?? fallback` optional-chain/nullish-coalescing pair
    // was the one partial branch in `src/db/repositories/**` (83.33%
    // coverage), unreachable, not a real "no rows" guard. Non-null
    // asserted, matching the docstring's own claim.
    const row = await this.qb('p')
      .select([
        countAll(platform, 'total'),
        minOf(platform, 'p.created_at', 'oldest'),
        maxOf(platform, 'p.created_at', 'newest'),
      ])
      .execute<{ total: number; oldest: string | null; newest: string | null } | undefined>('get', false);
    return { total: row!.total, oldest: row!.oldest, newest: row!.newest };
  }

  /**
   * `SELECT source, COUNT(*) AS count FROM place_shadow_picks GROUP BY source
   *  ORDER BY count DESC` (PS5). The `ORDER BY` is applied in SQL, by the
   * EXPRESSION, not the alias: MikroORM's QueryBuilder cannot order by an
   * ad-hoc raw-fragment alias (`countAll`'s `RawQueryFragment` return type
   * carries no alias literal for `ExtractRawAliases` to pick up, so
   * `.orderBy({ count: 'desc' })` throws "not existing property" at runtime,
   * verified directly) — `.orderBy({ [countAllRef(platform)]: 'desc' })`
   * orders by `COUNT(*)` itself, which SQLite accepts and which reproduces
   * the legacy statement's tie order exactly. A JS
   * `Array.prototype.sort((a, b) => b.count - a.count)` does NOT reproduce
   * it: SQLite's own sorter is not stable, so on a tie the legacy `ORDER BY
   * count DESC` emits ties in DESCENDING source order, while `GROUP BY
   * source` hands rows to JS in ASCENDING source order and a stable sort
   * leaves ties ascending — verified directly (Task 1 fix review M1).
   */
  async countBySource(): Promise<{ source: string; count: number }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('p')
      .select(['p.source', countAll(platform, 'count')])
      .groupBy('p.source')
      .orderBy({ [countAllRef(platform)]: 'desc' })
      .execute<{ source: string; count: number }[]>('all', false);
  }

  /** `SELECT live_rank, COUNT(*) AS count FROM place_shadow_picks GROUP BY live_rank` (PS6) — no ORDER BY, matching the legacy statement; the caller buckets the rows itself. */
  async countByLiveRank(): Promise<{ live_rank: number; count: number }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('p')
      .select(['p.live_rank', countAll(platform, 'count')])
      .groupBy('p.live_rank')
      .execute<{ live_rank: number; count: number }[]>('all', false);
  }

  /** `DELETE FROM place_shadow_picks` (PS7) — the admin wipe. Returns the affected-row count. */
  async deleteAll(): Promise<number> {
    return this.nativeDelete({});
  }

  /**
   * `` DELETE FROM place_shadow_picks WHERE created_at < datetime('now', ?) ``
   * with `` `-${retentionDays} days` `` bound as a parameter
   * (`place-shadow.service.ts:190-193`, PS8) — `nowMinusDays` renders the
   * equivalent `datetime('now', '-N days')` fragment (it cannot bind the
   * modifier as a parameter the way the legacy statement did; see the
   * helper's own docstring). Returns the affected-row count.
   */
  async purgeOlderThan(retentionDays: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return this.nativeDelete({ created_at: { $lt: nowMinusDays(platform, retentionDays) } });
  }
}
