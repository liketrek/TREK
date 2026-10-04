import { lowerTrim, lowerTrimParam } from '../dialect/sql-functions';
import type { BucketList } from '../entities/BucketList.entity';
import { presenceSet } from './_shared/presence-set';
import { TrekRepository } from './_shared/trek-repository';

/** `bucket_list` — every scalar column, `AT30`/`AT33`/`AT34`'s `SELECT *` shape. */
export interface BucketListRow {
  id: number;
  user_id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  notes: string | null;
  created_at: string | null;
  target_date: string | null;
  visited_at: string | null;
  visited_source: string | null;
  region_code: string | null;
}

/**
 * Three separate table shapes for the SAME `bucket_list` table (the
 * `VisitedCountriesRepository`'s own docstring explains why one shared
 * shape doesn't work for both reads and writes): the full row for
 * {@link listForUser}/{@link findById}/{@link findForUser}'s `SELECT *`;
 * the exact 8-column legacy `INSERT` list for {@link insertItem} (`id`,
 * `created_at`, `visited_at`, `visited_source` are never bound —
 * `created_at` via the schema's `DEFAULT CURRENT_TIMESTAMP`, the rest via
 * SQLite's ordinary "omitted nullable column ⇒ NULL"); `id`/`user_id` plus
 * the six settable columns for {@link update}/{@link deleteForUser}, which
 * only ever `.set()`/`.where()` — never `.values()` — so no insert-only
 * column needs excluding there.
 */
interface BucketListReadKyselyDB {
  bucket_list: BucketListRow;
}
interface BucketListInsertKyselyDB {
  bucket_list: { user_id: number; name: string; lat: number | null; lng: number | null; country_code: string | null; notes: string | null; target_date: string | null; region_code: string | null };
}
interface BucketListWriteKyselyDB {
  bucket_list: { id: number; user_id: number; name: string; notes: string | null; lat: number | null; lng: number | null; country_code: string | null; target_date: string | null };
}
/** The narrow `bucket_list` shape Plan 3h Task 3's visited-tick writes (DWS9/13/15) need. */
interface BucketListVisitKyselyDB {
  bucket_list: { id: number; user_id: number; visited_at: string | null; visited_source: string | null };
}

/** The six columns `findDuplicate`'s #1898 dedup identity compares (`AT31`). */
export interface BucketListIdentity {
  name: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  target_date: string | null;
}

/**
 * `bucket_list` — a user's travel wishlist (Plan 3f Task 1, atlas). See
 * {@link findDuplicate}'s own docstring for the #1898 dedup identity;
 * {@link update}'s for the `?? null` vs `|| null` lat/lng-of-zero fix this
 * repository preserves rather than regresses.
 */
export class BucketListRepository extends TrekRepository<BucketList> {
  private readDb() {
    return this.kysely<BucketListReadKyselyDB>();
  }

  private insertDb() {
    return this.kysely<BucketListInsertKyselyDB>();
  }

  private writeDb() {
    return this.kysely<BucketListWriteKyselyDB>();
  }

  private visitDb() {
    return this.kysely<BucketListVisitKyselyDB>();
  }

  /** AT30 (`bucketList`) — `SELECT * FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC`. */
  async listForUser(userId: number): Promise<BucketListRow[]> {
    return await this.readDb().selectFrom('bucket_list').selectAll().where('user_id', '=', userId).orderBy('created_at', 'desc').execute();
  }

  /**
   * AT31 (`findDuplicateBucketItem`, #1898) — `SELECT id FROM bucket_list
   * WHERE user_id = ? AND lower(trim(name)) = lower(trim(?)) AND
   * country_code IS ? AND target_date IS ? AND lat IS ? AND lng IS ? AND id
   * IS NOT ? LIMIT 1`. Every nullable comparison (`country_code`/
   * `target_date`/`lat`/`lng`/`id`) is a bound-parameter `IS`/`IS NOT` in
   * the legacy statement — NULL-safe on BOTH sides, so "no coordinates"
   * matches "no coordinates" instead of SQL's usual `NULL = NULL` ⇒ false.
   * MikroORM's own filter-object compiler reproduces this exactly with NO
   * raw SQL needed: a bare `{ col: value }` condition renders `col = ?`
   * when `value` is non-null and the LITERAL `col is null` when `value` is
   * null (`QueryBuilderHelper.js`'s `processObjectSubCondition`, `const op =
   * cond[key] === null ? 'is' : '='`), re-evaluated FRESH on every call
   * (never a cached prepared statement, unlike the legacy `?`-bound `IS`) —
   * so passing `key.country_code`/`key.target_date`/`key.lat`/`key.lng`
   * straight through, whatever their value, reproduces the legacy
   * NULL-safe match on every one of the four columns. `id: { $ne: excludeId
   * ?? null }` gets the identical treatment for `$ne` specifically
   * (`getOperatorReplacement`'s `value[op] === null` branch): `excludeId ??
   * null` renders `id is not null` (always true — `id` is never null) when
   * `create` calls with no id to exclude, and `id != ?` (bound) when
   * `update` passes its own row's id — the same two branches the legacy
   * `IS NOT ?` bound with a possibly-null parameter produced.
   * `lowerTrim`/`lowerTrimParam` (Plan 3f Task 0, R9) reproduce
   * `lower(trim(name)) = lower(trim(?))` as a filter KEY, the
   * `SchoolHolidayRegionsRepository.findIdByNameCI`/`collateNoCase`
   * precedent for a dialect helper spread into a `findOne` filter object.
   * Proven against all-NULL AND all-set fixture rows by a dedicated parity
   * test (`bucket-list-duplicate.parity.test.ts` — see this task's report).
   */
  async findDuplicate(userId: number, key: BucketListIdentity, excludeId: number | null): Promise<number | null> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.findOne(
      {
        user: userId,
        [lowerTrim(platform, 'name')]: lowerTrimParam(platform, key.name),
        country_code: key.country_code,
        target_date: key.target_date,
        lat: key.lat,
        lng: key.lng,
        id: { $ne: excludeId ?? null },
      },
      { fields: ['id'] },
    );
    return row?.id ?? null;
  }

  /** AT32 (`createBucketItem`) — `INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date, region_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`. Returns the new row's id. */
  async insertItem(row: {
    user_id: number;
    name: string;
    lat: number | null;
    lng: number | null;
    country_code: string | null;
    notes: string | null;
    target_date: string | null;
    region_code: string | null;
  }): Promise<number> {
    const result = await this.insertDb().insertInto('bucket_list').values(row).executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /** AT33 (`createBucketItem`'s post-insert re-select, NOT user-scoped — the legacy statement's own shape) — `SELECT * FROM bucket_list WHERE id = ?`. */
  async findById(id: number | string): Promise<BucketListRow | undefined> {
    return await this.readDb().selectFrom('bucket_list').selectAll().where('id', '=', id as number).executeTakeFirst();
  }

  /** AT34/AT36/AT37 (`updateBucketItem`'s guard, its post-update re-select, `deleteBucketItem`'s guard — identical text, three call sites) — `SELECT * FROM bucket_list WHERE id = ? AND user_id = ?`. */
  async findForUser(id: number | string, userId: number): Promise<BucketListRow | undefined> {
    return await this.readDb().selectFrom('bucket_list').selectAll().where('id', '=', id as number).where('user_id', '=', userId).executeTakeFirst();
  }

  /**
   * AT35 (`updateBucketItem`) — the 6-column `UPDATE bucket_list SET name =
   * COALESCE(?, name), notes = CASE WHEN ? THEN ? ELSE notes END, lat =
   * CASE WHEN ? THEN ? ELSE lat END, lng = CASE WHEN ? THEN ? ELSE lng END,
   * country_code = CASE WHEN ? THEN ? ELSE country_code END, target_date =
   * CASE WHEN ? THEN ? ELSE target_date END WHERE id = ? AND user_id = ?`.
   * `name` keeps the legacy `COALESCE(?, name)` TRUTHY-wins semantics (the
   * caller resolves `present = !!value`, same as
   * `PackingBagsRepository.update`'s `name`/`color`); the other five are
   * true presence sentinels (`present = data.field !== undefined`), already
   * resolved by the SERVICE per `_shared/presence-set.ts`'s own contract —
   * this repository writes exactly the value it is handed, `?? null` never
   * `|| null` (the class docstring's lat/lng-of-zero fix: the SERVICE binds
   * `data.lat ?? null`, not `data.lat || null`, so an explicit `0` survives).
   * An empty write short-circuits before the `UPDATE`, the
   * `PackingBagsRepository`/`BudgetItems`/`TodoItems` precedent for
   * `presenceSet` returning `{}`.
   */
  async update(
    id: number | string,
    userId: number,
    write: {
      name?: readonly [present: boolean, value: string];
      notes?: readonly [present: boolean, value: string | null];
      lat?: readonly [present: boolean, value: number | null];
      lng?: readonly [present: boolean, value: number | null];
      country_code?: readonly [present: boolean, value: string | null];
      target_date?: readonly [present: boolean, value: string | null];
    },
  ): Promise<void> {
    const data = presenceSet<{
      name: string;
      notes: string | null;
      lat: number | null;
      lng: number | null;
      country_code: string | null;
      target_date: string | null;
    }>(write);
    if (Object.keys(data).length === 0) return;
    await this.writeDb().updateTable('bucket_list').set(data).where('id', '=', id as number).where('user_id', '=', userId).execute();
  }

  /** AT38 (`deleteBucketItem`) — `DELETE FROM bucket_list WHERE id = ? AND user_id = ?`. */
  async deleteForUser(id: number | string, userId: number): Promise<void> {
    await this.writeDb().deleteFrom('bucket_list').where('id', '=', id as number).where('user_id', '=', userId).execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 3 (`DawarichSuggestionsService`/`DawarichSyncService`) —
  // additive. Cross-domain reads/writes from the Dawarich integration (3h)
  // into this 3f-owned table.
  // ---------------------------------------------------------------------------

  /**
   * DWS9 — `acceptAsBucketTick`: `UPDATE bucket_list SET visited_at = ?,
   * visited_source = 'dawarich' WHERE id = ? AND user_id = ?`,
   * unconditional (DWS8's own `findForUser`-shaped guard read already
   * confirmed the row exists and belongs to the caller before this write).
   */
  async markVisited(id: number, userId: number, visitedAt: string): Promise<void> {
    await this.visitDb()
      .updateTable('bucket_list')
      .set({ visited_at: visitedAt, visited_source: 'dawarich' })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .execute();
  }

  /**
   * DWS12 — `scanBucketList`: `SELECT id, name, lat, lng, visited_at FROM
   * bucket_list WHERE user_id = ? ORDER BY (visited_at IS NOT NULL),
   * created_at DESC, id DESC`. The boolean-expression `ORDER BY` key is
   * portable SQL — no dialect helper needed.
   */
  async listForScan(userId: number): Promise<{ id: number; name: string; lat: number | null; lng: number | null; visited_at: string | null }[]> {
    return await this.readDb()
      .selectFrom('bucket_list')
      .select(['id', 'name', 'lat', 'lng', 'visited_at'])
      .where('user_id', '=', userId)
      .orderBy((eb) => eb('visited_at', 'is not', null))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .execute();
  }

  /**
   * DWS13 — `confirmBucketVisits` (looped inside the SERVICE's own
   * `uow.transactional` block): `UPDATE bucket_list SET visited_at = ?,
   * visited_source = 'dawarich' WHERE id = ? AND user_id = ? AND visited_at
   * IS NULL` — conditional, won't clobber an existing tick. Returns the
   * affected-row count so the caller can total how many were actually
   * updated.
   */
  async markVisitedIfUnset(id: number, userId: number, visitedAt: string): Promise<number> {
    const result = await this.visitDb()
      .updateTable('bucket_list')
      .set({ visited_at: visitedAt, visited_source: 'dawarich' })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where('visited_at', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0);
  }

  /** DWS15 — `clearBucketVisit`: `UPDATE bucket_list SET visited_at = NULL, visited_source = NULL WHERE id = ? AND user_id = ?`. Returns whether a row was actually touched. */
  async clearVisited(id: number, userId: number): Promise<boolean> {
    const result = await this.visitDb()
      .updateTable('bucket_list')
      .set({ visited_at: null, visited_source: null })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  /**
   * DSY10 — `dawarich-sync.service.ts::matchBucketList`'s bounding-box
   * pre-filter: `SELECT id, lat, lng FROM bucket_list WHERE user_id = ? AND
   * lat IS NOT NULL AND lng IS NOT NULL AND lat BETWEEN ? AND ? AND lng
   * BETWEEN ? AND ?`. A rough box only — the real distance test (haversine)
   * stays in the SERVICE, in JS. Typed `lat`/`lng` nullable to match the
   * column's own schema type; the `IS NOT NULL` conditions guarantee they
   * are never actually null in a returned row.
   */
  async listInBoundingBox(
    userId: number,
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number,
  ): Promise<{ id: number; lat: number | null; lng: number | null }[]> {
    return await this.readDb()
      .selectFrom('bucket_list')
      .select(['id', 'lat', 'lng'])
      .where('user_id', '=', userId)
      .where('lat', 'is not', null)
      .where('lng', 'is not', null)
      .where('lat', '>=', latMin)
      .where('lat', '<=', latMax)
      .where('lng', '>=', lngMin)
      .where('lng', '<=', lngMax)
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (`public-api.service.ts::listBucketList`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * `SELECT name, lat, lng, country_code, notes, target_date FROM bucket_list
   * WHERE user_id = ? ORDER BY created_at DESC, id DESC`. Deliberately NOT
   * {@link listForUser} (which `SELECT *`s and orders by `created_at DESC`
   * only, no `id` tiebreak, for the Atlas UI's own list) — a genuinely
   * different legacy statement on the same table (rule 2), not a variant
   * worth merging.
   */
  async listForPublicApi(userId: number): Promise<PublicApiBucketListItemRow[]> {
    return await this.readDb()
      .selectFrom('bucket_list')
      .select(['name', 'lat', 'lng', 'country_code', 'notes', 'target_date'])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .execute();
  }
}

/** {@link BucketListRepository.listForPublicApi}'s projection. */
export interface PublicApiBucketListItemRow {
  name: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  notes: string | null;
  target_date: string | null;
}
