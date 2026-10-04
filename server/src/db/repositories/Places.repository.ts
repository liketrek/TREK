import type { Places } from '../entities/Places.entity';
import { absDifference, coalesceParam, columnRef, currentTimestamp, lowerTrim } from '../dialect/sql-functions';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
// Task 9 fix wave (B-L2): `TagRow` is Tags.repository.ts's own row type,
// byte-identical to what used to be hand-mirrored here — a second
// declaration of the same shape is exactly the duplication Sonar flags and
// the program's "single source of truth" rule (root CLAUDE.md) forbids.
import type { TagRow } from './Tags.repository';

/** A `places` row as the API emits it — every scalar column of the entity. */
export interface PlaceRow {
  id: number;
  trip_id: number;
  name: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  category_id: number | null;
  price: number | null;
  currency: string | null;
  reservation_status: string | null;
  reservation_notes: string | null;
  reservation_datetime: string | null;
  place_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  image_url: string | null;
  google_place_id: string | null;
  google_ftid: string | null;
  website: string | null;
  phone: string | null;
  transport_mode: string | null;
  created_at: string | null;
  updated_at: string | null;
  osm_id: string | null;
  route_geometry: string | null;
  route_color: string | null;
  stop_type: string | null;
  fill_percent: number | null;
  amap_poi_id: string | null;
  source: string | null;
  email: string | null;
  opening_hours: string | null;
}

const _placeRowKeys: AssertRowKeys<PlaceRow, Places> = true;

/** PL3 (`PlacesService.list`) — a `places` row joined with its category's flat columns. */
export interface PlaceWithCategoryRow extends PlaceRow {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

/** {@link PlacesRepository.listForTrip}'s row: the category join plus the atlas' cached region (#2537), null when none resolved yet. */
export interface PlaceListRow extends PlaceWithCategoryRow {
  country_code: string | null;
  region_name: string | null;
}

/** {@link PlacesRepository.findActiveTripFile}'s narrow `trip_files` shape. */
interface PlacesTripFileKyselyDB {
  trip_files: { id: number; trip_id: number; filename: string; original_name: string; mime_type: string | null; file_size: number | null; deleted_at: string | null };
}

/**
 * {@link PlacesRepository.listPublicForShare}'s projection (SH12) — the
 * `PUBLIC_PLACE_COLUMNS` allow-list plus the category join, picked out of
 * {@link PlaceWithCategoryRow} rather than re-derived (never independently
 * widen this list — see that method's docstring).
 */
export type SharePublicPlaceRow = Pick<
  PlaceWithCategoryRow,
  | 'id' | 'trip_id' | 'name' | 'description' | 'lat' | 'lng' | 'address' | 'category_id' | 'price' | 'currency'
  | 'place_time' | 'end_time' | 'duration_minutes' | 'notes' | 'image_url' | 'website' | 'phone' | 'transport_mode'
  | 'created_at' | 'updated_at' | 'category_name' | 'category_color' | 'category_icon'
>;

interface SharePublicPlaceKyselyDB {
  places: Pick<PlaceRow,
    | 'id' | 'trip_id' | 'name' | 'description' | 'lat' | 'lng' | 'address' | 'category_id' | 'price' | 'currency'
    | 'place_time' | 'end_time' | 'duration_minutes' | 'notes' | 'image_url' | 'website' | 'phone' | 'transport_mode'
    | 'created_at' | 'updated_at'
  >;
  categories: { id: number; name: string; color: string | null; icon: string | null };
}

interface PlaceRatingRow {
  user_id: number;
  username: string;
  avatar: string | null;
  rating: number;
}

/**
 * `getPlaceWithTags` (`db/database.ts:146-197`, 0b's Concern for Task 4):
 * the 11 `PlacesService` call sites move in Task 4, so `DatabaseService
 * .getPlaceWithTags` keeps its own name/shape and delegates to this method
 * NOW — no caller beyond `DatabaseService` changes in this task.
 */
export interface PlaceWithTagsRow extends PlaceRow {
  category: { id: number; name: string; color: string; icon: string } | null;
  tags: TagRow[];
  ratings: PlaceRatingRow[];
  rating_avg: number | null;
  rating_count: number;
}

export class PlacesRepository extends TrekRepository<Places> {
  /**
   * The legacy `getPlaceWithTags`'s three statements, byte-for-byte in intent
   * (`mapResults: false` on every read, matching `TripsRepository
   * .findAccessible`/`InviteTokensRepository.listWithCreatorAndTrip`):
   *
   * ```sql
   * SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
   * FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
   *
   * SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?
   *
   * SELECT pr.user_id, u.username, u.avatar, pr.rating FROM place_ratings pr
   * JOIN users u ON pr.user_id = u.id WHERE pr.place_id = ? ORDER BY pr.created_at
   * ```
   *
   * `p.category`/`p.place_tags`/`p.place_ratings_collection` are the entity's
   * own relation properties for these three joins (`Places.entity.ts`), so no
   * hand-spelled join condition is needed; `pr.user` resolves to the
   * `place_ratings.user_id` FK column the same way `TripsRepository
   * .findAccessible`'s `t.user` resolves to `trips.user_id`.
   */
  async findWithTagsAndRatings(place_id: number | string): Promise<PlaceWithTagsRow | null> {
    // Raw conditions (D4's T5 escape hatch), not `.where({ 'p.id': place_id })`:
    // MikroORM's typed filter rejects a `string` against `p.id`'s branded
    // `number` type — matching `TripsRepository.findAccessible`'s own
    // raw-bind seam (`legacy getPlaceWithTags(placeId: number | string)`
    // bound the raw value with no `Number()` conversion). `p.id` is the
    // physical column name.
    const place = await this.qb('p')
      .leftJoin('p.category', 'c')
      .select(['p.*', 'c.name as category_name', 'c.color as category_color', 'c.icon as category_icon'])
      .where('p.id = ?', [place_id])
      .execute<PlaceWithCategoryRow | undefined>('get', false);
    if (!place) return null;

    const tags = await this.qb('p')
      .join('p.place_tags', 't')
      .select(['t.*'])
      .where('p.id = ?', [place_id])
      .execute<TagRow[]>('all', false);

    // Task 0b review B1 (HIGH, live regression): `.select(['pr.user', ...])`
    // makes MikroORM resolve `pr.user` through the ACTIVE `join('pr.user',
    // 'u')` and emit the joined entity's own PK under its join alias
    // (`u__id`), not the FK scalar (`user_id`) — `ratings[].user_id` never
    // existed at runtime, silently breaking the client's
    // `ratings.find(r => r.user_id === currentUserId)` own-rating lookup.
    // `columnRef(...).as('user_id')` routes the FK column through the
    // dialect layer and aliases it back explicitly; `'pr.user_id'` (the
    // `persist(false)` scalar mirror) was tried and silently drops the
    // column, `'pr.user as user_id'` was tried and is still `u__id` — both
    // verified directly, not assumed (same finding independently reproduced
    // in `PlaceRatingsRepository.listForPlaces`'s docstring, Plan 3c Task 1).
    const platform = this.getEntityManager().getPlatform();
    const ratings = await this.qb('p')
      .join('p.place_ratings_collection', 'pr')
      .join('pr.user', 'u')
      .select([columnRef(platform, 'pr.user_id').as('user_id'), 'u.username', 'u.avatar', 'pr.rating'])
      .where('p.id = ?', [place_id])
      .orderBy({ 'pr.created_at': 'asc' })
      .execute<PlaceRatingRow[]>('all', false);

    // Task 0b review B2 (HIGH, live regression): the legacy `getPlaceWithTags`
    // returned `{ ...place, category: ... }` over the raw driver row of
    // `SELECT p.*, c.name as category_name, c.color as category_color, c.icon
    // as category_icon` — the three alias columns ride along on the wire
    // body (map popups, dashboard, shared-trip page all read them flat, per
    // the review's blast-radius list). Read them, don't strip them: spread
    // `place` whole, not `placeRest`.
    const { category_name, category_color, category_icon } = place;
    return {
      ...place,
      category: place.category_id
        ? { id: place.category_id, name: category_name!, color: category_color!, icon: category_icon! }
        : null,
      tags,
      ratings,
      rating_avg: ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null,
      rating_count: ratings.length,
    };
  }

  /**
   * `SELECT 1 FROM places WHERE google_place_id = ? OR image_url = ? LIMIT 1`
   * — the `places`-owned half of `PlacePhotoCacheService.isReferenced`
   * (`place-photo-cache.service.ts:205-211`, PP6), split per the Plan 3c
   * Task 1 PP6 ruling (option 2): the legacy single `UNION ALL … LIMIT 1`
   * statement spans this table AND `collection_places` (Plan 3h's), so the
   * service evaluates this half first and only runs the `collection_places`
   * half when this one is `false` — reproducing the legacy `UNION ALL …
   * LIMIT 1`'s short-circuit by evaluation order rather than by SQL.
   */
  async existsByGoogleIdOrImageUrl(googlePlaceId: string, imageUrl: string): Promise<boolean> {
    const row = await this.qb('p')
      .select(['p.id'])
      .where({ $or: [{ google_place_id: googlePlaceId }, { image_url: imageUrl }] })
      .limit(1)
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 4 (`PlacesService` core) — every method below is additive;
  // `findWithTagsAndRatings`/`existsByGoogleIdOrImageUrl` above are Task 0b's
  // and Task 1's, unchanged.
  // ---------------------------------------------------------------------------

  /**
   * PL0/PL7/PL49/AS5 — `SELECT id FROM places WHERE id = ? AND trip_id = ?`.
   *
   * **`id: number`, not `number | string` (Task 3 review H1, absorbed
   * here — `task-3-review.md` §9.1):** the legacy raw-bind seam other
   * guard-shaped methods in this cluster preserve (`TripsRepository
   * .findAccessible`'s precedent) is the WRONG shape for a method whose
   * caller then writes with `toRowId(placeId)!`. A non-canonical id
   * (`"3 "`, `"3.0"`, `"+3"`) matches this statement via SQLite's own
   * loose text/integer affinity — `existsInTrip` would answer `true` — while
   * `toRowId` (`/^\d+$/` + `Number.isSafeInteger`, program rule 15) rejects
   * the same string and returns `null`, so the write downstream runs
   * `toRowId(placeId)!` on a value the gate just vouched for and gets
   * `null` — exactly Task 3's H1 (`AssignmentsService.dayExists`/
   * `placeExists`/`assignmentExistsInDay`/`getAssignmentForTrip`, all four
   * kept on this seam, all four reproducing it). This method's only two
   * callers (`PlacesService.get`/`applyUpdate`'s existence half — via
   * `applyUpdate` calling `findInTrip` below — and `AssignmentsService
   * .placeExists`, once Task 4 repoints it) now run `toRowId` FIRST and
   * pass the validated `number` in, matching `DaysService.getDay`'s shape
   * (the review's cited correct precedent) — so `id` here is narrowed to
   * match what every caller actually has after its own gate, and a second
   * `toRowId(...)!` downstream can never disagree with this one.
   */
  async existsInTrip(id: number, trip_id: number): Promise<boolean> {
    const row = await this.qb('p')
      .select(['p.id'])
      .where({ 'p.id': id, 'p.trip_id': trip_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * PL9/PL48 — `SELECT * FROM places WHERE id = ? AND trip_id = ?`, byte-
   * identical statements at both legacy sites (`applyUpdate`'s pre-image
   * read and `searchImage`'s existence-plus-name read) — one method for
   * both rather than two identically-bodied ones.
   *
   * `id: number`, same H1 fix and reasoning as `existsInTrip` above: both
   * callers write with the SAME already-`toRowId`'d id this read returns
   * (`applyUpdate` feeds it straight into `updatePlace`/`tagsRepo`;
   * `searchImage` only reads, but takes the same gate shape for
   * consistency — one rule for every place-id gate in this service, not
   * one per call site).
   */
  async findInTrip(id: number, trip_id: number): Promise<PlaceRow | undefined> {
    return this.qb('p')
      .select(['p.*'])
      .where({ 'p.id': id, 'p.trip_id': trip_id })
      .execute<PlaceRow | undefined>('get', false);
  }

  /**
   * Plan 3g Task 2 (JG44) — `journey-domain.service.ts#onPlaceUpdated`'s
   * `SELECT * FROM places WHERE id = ?`, unscoped (no `trip_id` — the sync
   * engine already resolved the place from its own `journey_entries.source_place_id`
   * column, so the id alone is trusted here the same way `TripsRepository
   * .findRaw` trusts a bare trip id). ONE append to this file for JG44 per
   * the 3g plan's task split — every other method here belongs to Plan 3c.
   */
  async findRaw(id: number): Promise<PlaceRow | undefined> {
    return this.qb('p')
      .select(['p.*'])
      .where({ 'p.id': id })
      .execute<PlaceRow | undefined>('get', false);
  }

  /**
   * PL17/PL20 — `SELECT google_place_id, image_url FROM places WHERE id = ?
   * AND trip_id = ?`, the reclaim-candidate projection `remove`/`removeMany`
   * read BEFORE their delete transaction. `id: number`, same H1 fix: both
   * callers immediately follow a `true` result with `deleteById(id)` on the
   * SAME numeric id.
   */
  async reclaimInputs(id: number, trip_id: number): Promise<{ google_place_id: string | null; image_url: string | null } | undefined> {
    return this.qb('p')
      .select(['p.google_place_id', 'p.image_url'])
      .where({ 'p.id': id, 'p.trip_id': trip_id })
      .execute<{ google_place_id: string | null; image_url: string | null } | undefined>('get', false);
  }

  /** PL19/PL21 — `DELETE FROM places WHERE id = ?`, unscoped: every caller proved trip access first. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * PL23 — `` SELECT id FROM places WHERE trip_id = ? AND id IN (${…}) ``,
   * narrowed to the caller's own INPUT ORDER (not SQL result order — SQLite
   * makes no ordering promise for an `IN (...)` scan and the legacy code
   * re-filters the original `ids` array through a `Set` built from the row
   * set for exactly this reason). `$in` for the dynamic list (rule 17b, "the
   * good kind").
   */
  async scopedIds(trip_id: string | number, ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await this.qb('p')
      .select(['p.id'])
      .where('p.trip_id = ?', [trip_id])
      .andWhere({ id: { $in: ids } })
      .execute<{ id: number }[]>('all', false);
    const owned = new Set(rows.map((r) => r.id));
    return ids.filter((id) => owned.has(id));
  }

  /**
   * PL4 — the 27-column `INSERT INTO places (...)` the service's `create`
   * builds. Every value here is already fully coerced by the caller (the
   * `?? null` vs `|| null` split PL4's own legacy comment documents — 0 is
   * legitimate for `lat`/`lng`/`price`/`fill_percent`, and
   * `duration_minutes` defaults to 60 — stays the service's decision, this
   * writes exactly what it is handed, `DaysRepository.createDay`'s split).
   * `em.insert()` returns the generated PK (R6's `lastInsertRowid`
   * replacement).
   */
  async insertPlace(input: {
    trip_id: number;
    name: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    category_id: number | null;
    price: number | null;
    currency: string | null;
    place_time: string | null;
    end_time: string | null;
    duration_minutes: number;
    notes: string | null;
    image_url: string | null;
    google_place_id: string | null;
    google_ftid: string | null;
    osm_id: string | null;
    amap_poi_id: string | null;
    website: string | null;
    phone: string | null;
    transport_mode: string;
    route_geometry: string | null;
    route_color: string | null;
    stop_type: string | null;
    fill_percent: number | null;
    email: string | null;
    opening_hours: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      name: input.name,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      category: input.category_id,
      price: input.price,
      currency: input.currency,
      place_time: input.place_time,
      end_time: input.end_time,
      duration_minutes: input.duration_minutes,
      notes: input.notes,
      image_url: input.image_url,
      google_place_id: input.google_place_id,
      google_ftid: input.google_ftid,
      osm_id: input.osm_id,
      amap_poi_id: input.amap_poi_id,
      website: input.website,
      phone: input.phone,
      transport_mode: input.transport_mode,
      route_geometry: input.route_geometry,
      route_color: input.route_color,
      stop_type: input.stop_type,
      fill_percent: input.fill_percent,
      email: input.email,
      opening_hours: input.opening_hours,
    });
  }

  /**
   * PL11 — `UPDATE places SET name = COALESCE(?, name), description = ?,
   * lat = ?, lng = ?, address = ?, category_id = ?, price = ?, currency =
   * COALESCE(?, currency), place_time = ?, end_time = ?, duration_minutes =
   * ?, notes = ?, image_url = ?, google_place_id = ?, google_ftid = ?,
   * osm_id = ?, amap_poi_id = ?, website = ?, phone = ?, email = ?,
   * opening_hours = ?, transport_mode = COALESCE(?, transport_mode),
   * route_color = ?, stop_type = ?, fill_percent = ?,
   * updated_at = CURRENT_TIMESTAMP WHERE id = ?` — ONE
   * `nativeUpdate` with a typed full partial (the ruling): the SQL
   * `COALESCE(?, col)` keep-if-null semantics (`name`/`currency`/
   * `transport_mode`) and the twenty-two `!== undefined ? x : existing.x`
   * pre-image fallbacks are both already resolved to their FINAL value by
   * the caller (`PlacesService.applyUpdate`, which reads the pre-image via
   * `findInTrip` first) — this method writes exactly what it is handed,
   * plus the timestamp stamp every write gets.
   */
  async updatePlace(id: number, write: {
    // Task 9 fix wave (B-L10): `places.name` is `NOT NULL` (`PlaceRow.name:
    // string`); the caller's `(name || null) ?? existingPlace.name` fold
    // always resolves to a real string before this is called — `string |
    // null` here was a widened lie the type checker could never catch a
    // real NULL write through.
    name: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    category_id: number | null;
    price: number | null;
    currency: string | null;
    place_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    notes: string | null;
    image_url: string | null;
    google_place_id: string | null;
    google_ftid: string | null;
    osm_id: string | null;
    amap_poi_id: string | null;
    website: string | null;
    phone: string | null;
    transport_mode: string | null;
    route_color: string | null;
    stop_type: string | null;
    fill_percent: number | null;
    email: string | null;
    opening_hours: string | null;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, {
      name: write.name,
      description: write.description,
      lat: write.lat,
      lng: write.lng,
      address: write.address,
      category: write.category_id,
      price: write.price,
      currency: write.currency,
      place_time: write.place_time,
      end_time: write.end_time,
      duration_minutes: write.duration_minutes,
      notes: write.notes,
      image_url: write.image_url,
      google_place_id: write.google_place_id,
      google_ftid: write.google_ftid,
      osm_id: write.osm_id,
      amap_poi_id: write.amap_poi_id,
      website: write.website,
      phone: write.phone,
      transport_mode: write.transport_mode,
      route_color: write.route_color,
      stop_type: write.stop_type,
      fill_percent: write.fill_percent,
      email: write.email,
      opening_hours: write.opening_hours,
      updated_at: currentTimestamp(platform),
    });
  }

  /**
   * PL25 (`findDuplicatePlace`'s `externalId` strategy) — `SELECT id,
   * google_ftid FROM places WHERE trip_id = ? AND (google_place_id = ? OR
   * google_ftid = ? OR osm_id = ? OR amap_poi_id = ?) ORDER BY id ASC LIMIT
   * 1` — the same candidate id bound in all four positions, exactly as the
   * legacy statement does.
   */
  async findDuplicateByExternalId(trip_id: string, external_id: string): Promise<{ id: number; google_ftid: string | null } | undefined> {
    return this.qb('p')
      .select(['p.id', 'p.google_ftid'])
      .where('p.trip_id = ?', [trip_id])
      .andWhere({
        $or: [
          { google_place_id: external_id },
          { google_ftid: external_id },
          { osm_id: external_id },
          { amap_poi_id: external_id },
        ],
      })
      .orderBy({ 'p.id': 'asc' })
      .limit(1)
      .execute<{ id: number; google_ftid: string | null } | undefined>('get', false);
  }

  /**
   * PL26 (`findDuplicatePlace`'s `name` strategy) — `SELECT id, google_ftid
   * FROM places WHERE trip_id = ? AND lower(trim(name)) = ? ORDER BY id ASC
   * LIMIT 1`. Rule 18's documented-disagreement exception clause: the legacy
   * statement's OWN bound value is already JS-lowered+trimmed
   * (`normalizePlaceName`, `@trek/shared/place/place-match.ts`, Unicode-
   * aware), so `lowered_trimmed_name` here must be passed in ALREADY
   * lowered — never re-lowered through `lowerParam` (that would apply
   * SQLite's ASCII-only `LOWER()` a second time, on a value the caller
   * already folded fully). `lowerTrim(platform, 'p.name')` renders
   * `LOWER(TRIM(name))` (SQLite `LOWER()` is ASCII-only, program rule 18 —
   * the documented divergence PL26's legacy comment (`places.service.ts
   * :609-619`) already accepts and this repository reproduces literally,
   * not fixes).
   */
  async findDuplicateByName(trip_id: string, lowered_trimmed_name: string): Promise<{ id: number; google_ftid: string | null } | undefined> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('p')
      .select(['p.id', 'p.google_ftid'])
      .where('p.trip_id = ?', [trip_id])
      .andWhere({ [lowerTrim(platform, 'p.name')]: lowered_trimmed_name })
      .orderBy({ 'p.id': 'asc' })
      .limit(1)
      .execute<{ id: number; google_ftid: string | null } | undefined>('get', false);
  }

  /**
   * PL27 (`findDuplicatePlace`'s `coords` strategy) — `SELECT id,
   * google_ftid FROM places WHERE trip_id = ? AND lat IS NOT NULL AND lng IS
   * NOT NULL AND abs(lat - ?) <= ? AND abs(lng - ?) <= ? ORDER BY id ASC
   * LIMIT 1`. `absDifference(platform, ref, value)` renders `ABS(<col> - ?)`
   * with `value` already bound inside the fragment (`sql-functions.ts`'s own
   * docstring) — used as a filter KEY paired with `{ $lte: tolerance }`, so
   * the emitted SQL and bind order match the legacy statement exactly:
   * `ABS(lat - ?) <= ?` then `ABS(lng - ?) <= ?`, the SAME `tolerance` value
   * on both.
   */
  async findDuplicateByCoords(trip_id: string, lat: number, lng: number, tolerance: number): Promise<{ id: number; google_ftid: string | null } | undefined> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('p')
      .select(['p.id', 'p.google_ftid'])
      .where('p.trip_id = ?', [trip_id])
      .andWhere({
        lat: { $ne: null },
        lng: { $ne: null },
        [absDifference(platform, 'p.lat', lat)]: { $lte: tolerance },
        [absDifference(platform, 'p.lng', lng)]: { $lte: tolerance },
      })
      .orderBy({ 'p.id': 'asc' })
      .limit(1)
      .execute<{ id: number; google_ftid: string | null } | undefined>('get', false);
  }

  /**
   * PL29 (`exportGpx`'s waypoint read) — `SELECT p.name, p.description,
   * p.address, p.lat, p.lng, p.route_geometry, c.name AS category FROM
   * places p LEFT JOIN categories c ON c.id = p.category_id WHERE p.trip_id
   * = ? ORDER BY p.id`. PL30 (the `days`/`day_assignments` itinerary half)
   * is `DayAssignmentsRepository.listItineraryForGpx` — a different table
   * root, kept there per the task-4 brief's own pointer.
   */
  async listForGpx(trip_id: string): Promise<{
    name: string; description: string | null; address: string | null;
    lat: number | null; lng: number | null; route_geometry: string | null;
    category: string | null;
  }[]> {
    return this.qb('p')
      .leftJoin('p.category', 'c')
      .select(['p.name', 'p.description', 'p.address', 'p.lat', 'p.lng', 'p.route_geometry', 'c.name as category'])
      .where('p.trip_id = ?', [trip_id])
      .orderBy({ 'p.id': 'asc' })
      .execute<{ name: string; description: string | null; address: string | null; lat: number | null; lng: number | null; route_geometry: string | null; category: string | null }[]>('all', false);
  }

  /**
   * PL24 (`PlacesService.buildDedupSet`'s read) — `SELECT name, lat, lng,
   * google_place_id, google_ftid, osm_id, amap_poi_id FROM places WHERE
   * trip_id = ?`, the exact projection the legacy statement named. Task 4's
   * ruling left this raw under `PlacesService` because the dedup semantics
   * (names lowercased+trimmed in JS, coordinates collected only for unnamed
   * rows, provider ids collected for every row) are a JS decision, not a SQL
   * one — Task 5 review L6 pointed out that leaving the SQL itself raw
   * still contradicted the deliverable's "PL15/16/18/22 + PI2 are the only
   * allowed survivors" grep. This method is the additive repository seam
   * that resolves that: it carries only the projection, none of the JS
   * folding logic, which stays in `PlacesService.buildDedupSet` exactly as
   * it was.
   */
  async listDedupInputs(trip_id: string): Promise<{
    name: string | null; lat: number | null; lng: number | null;
    google_place_id: string | null; google_ftid: string | null; osm_id: string | null; amap_poi_id: string | null;
  }[]> {
    return this.qb('p')
      .select(['p.name', 'p.lat', 'p.lng', 'p.google_place_id', 'p.google_ftid', 'p.osm_id', 'p.amap_poi_id'])
      .where('p.trip_id = ?', [trip_id])
      .execute<{
        name: string | null; lat: number | null; lng: number | null;
        google_place_id: string | null; google_ftid: string | null; osm_id: string | null; amap_poi_id: string | null;
      }[]>('all', false);
  }

  /**
   * PI1 (`place-image.ts:27`) — `SELECT 1 FROM places WHERE image_url = ?
   * LIMIT 1`. Trip-agnostic on purpose (an uploaded image is ref-counted
   * across every trip, not just the one it was uploaded from — a place
   * copied or shared across trips can share the file).
   */
  async existsByImageUrl(imageUrl: string): Promise<boolean> {
    const row = await this.qb('p')
      .select(['p.id'])
      .where({ image_url: imageUrl })
      .limit(1)
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * PL3 (`PlacesService.list`) — the trip's places, joined with their
   * category's flat columns, filtered by up to four optional fragments
   * built as conditional `andWhere`s rather than a hand-assembled SQL
   * string (§18.3's surprise: the legacy statement's own text is not
   * knowable from the source without tracing four `if`s — this makes each
   * fragment a single, separately readable `andWhere` call instead).
   *
   * `filters.searchPattern` arrives PRE-BUILT (`%${escapeLikePattern(term)}%`,
   * the service's job, matching every other "coercions stay in the service"
   * split in this program) — this binds it verbatim into all three `LIKE …
   * ESCAPE '\'` fragments, matching the legacy's one-param-three-times bind.
   * The `ESCAPE '\'` clause is written into the raw fragment text because
   * MikroORM's `$like` operator does not add one (§18.3).
   *
   * `filters.category`/`filters.tag` bind their raw string values with no
   * `Number()` conversion (matching the legacy statement's own untyped
   * bind); the two `assignment` fragments reference `place_tags`/
   * `day_assignments`/`days` by physical table name in a subquery (neither
   * has, or needs, an entity-relation path for this shape) — the same
   * raw-SQL-subquery shape `PlacesService.list`'s own legacy string used.
   *
   * `DISTINCT` kept via `.select([...], true)` even though a place has at
   * most one category row (so it changes nothing about THIS join) — parity
   * with the legacy statement's own `SELECT DISTINCT`, not a functional
   * requirement.
   */
  async listForTrip(trip_id: string, filters: {
    searchPattern?: string;
    category?: string;
    tag?: string;
    assignment?: 'all' | 'unassigned' | 'assigned';
  }): Promise<PlaceListRow[]> {
    const qb = this.qb('p')
      .leftJoin('p.category', 'c')
      // #2537: the atlas' cached region rides along (`LEFT JOIN place_regions pr ON pr.place_id = p.id`).
      .leftJoin('p.place_regions', 'pr')
      .select([
        'p.*', 'c.name as category_name', 'c.color as category_color', 'c.icon as category_icon',
        'pr.country_code as country_code', 'pr.region_name as region_name',
      ], true)
      .where('p.trip_id = ?', [trip_id]);

    if (filters.searchPattern) {
      qb.andWhere(
        "(p.name LIKE ? ESCAPE '\\' OR p.address LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')",
        [filters.searchPattern, filters.searchPattern, filters.searchPattern],
      );
    }
    if (filters.category) {
      qb.andWhere('p.category_id = ?', [filters.category]);
    }
    if (filters.tag) {
      qb.andWhere('p.id IN (SELECT place_id FROM place_tags WHERE tag_id = ?)', [filters.tag]);
    }
    if (filters.assignment === 'unassigned') {
      qb.andWhere(
        'p.id NOT IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)',
        [trip_id],
      );
    } else if (filters.assignment === 'assigned') {
      qb.andWhere(
        'p.id IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)',
        [trip_id],
      );
    }

    qb.orderBy({ 'p.created_at': 'desc' });

    return qb.execute<PlaceListRow[]>('all', false);
  }

  /**
   * PL53 (`PlacesService.setImageFromFile`, #1242) — `SELECT filename,
   * original_name, mime_type, file_size FROM trip_files WHERE id = ? AND
   * trip_id = ? AND deleted_at IS NULL`: the attachment a place takes its
   * picture from, trash excluded.
   */
  async findActiveTripFile(id: number, trip_id: number): Promise<{ filename: string; original_name: string; mime_type: string | null; file_size: number | null } | undefined> {
    return await this.kysely<PlacesTripFileKyselyDB>()
      .selectFrom('trip_files')
      .select(['filename', 'original_name', 'mime_type', 'file_size'])
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 5 (`PlacesService` import paths) — every method below is
  // additive: `insertPlace`/`updatePlace`/`findWithTagsAndRatings`/the
  // `findDuplicateBy*` trio above are Task 4's, unchanged and reused verbatim
  // by the four importers (GPX/KML/Google/Naver) this task converts.
  // ---------------------------------------------------------------------------

  /**
   * PL36 (`colorizeImportedTracks`'s read half) — `SELECT DISTINCT
   * route_color AS c FROM places WHERE trip_id = ? AND route_color IS NOT
   * NULL`. `DISTINCT` via `.select([...], true)` (the same shape
   * `listForTrip`/PL3 uses for its own `SELECT DISTINCT`), not `$ne: null`
   * folded into a single-object filter, so the emitted `WHERE` clause reads
   * in the legacy's own `trip_id = ? AND route_color IS NOT NULL` order.
   *
   * Called and its result acted on inside the SAME `uow.transactional(...)`
   * block `setRouteColor` below writes in (the service's own PL36+PL37
   * pairing) — read and write share one transaction so two concurrent
   * imports can never both observe the same set of free colours.
   */
  async distinctRouteColors(trip_id: string | number): Promise<string[]> {
    const rows = await this.qb('p')
      .select(['p.route_color as c'], true)
      .where('p.trip_id = ? AND p.route_color IS NOT NULL', [trip_id])
      .execute<{ c: string }[]>('all', false);
    return rows.map((r) => r.c);
  }

  /**
   * PL37 (`colorizeImportedTracks`'s write half) — `UPDATE places SET
   * route_color = ? WHERE id = ?`. No `updated_at` stamp — the legacy
   * statement never wrote one for this column (#776's own deliberate
   * omission, restated in `PlacesService`'s class docstring), and this
   * method reproduces exactly that, not the "every write stamps
   * `updated_at`" shape `updatePlace`/`backfillFtid`/`fillIfEmpty` below
   * follow.
   */
  async setRouteColor(id: number, route_color: string): Promise<void> {
    await this.nativeUpdate({ id }, { route_color });
  }

  /**
   * PL39 (`storeGooglePlaces`'s dedup-backfill half) — `UPDATE places SET
   * google_ftid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, unscoped
   * by `trip_id` (matching the legacy statement exactly — the candidate id
   * was already resolved against this trip by the `findDuplicatePlace` call
   * immediately before it).
   */
  async backfillFtid(id: number, google_ftid: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { google_ftid, updated_at: currentTimestamp(platform) });
  }

  /**
   * PL43/PL44/PL46 (`enrichOne`'s two `UPDATE`s and
   * `backfillMissingAddresses`'s one) — three legacy statements, one shape:
   * `UPDATE places SET <col> = COALESCE(<col>, ?), ..., updated_at =
   * CURRENT_TIMESTAMP WHERE id = ? AND trip_id = ?`. One `nativeUpdate` per
   * CALL, built from whichever of the six columns the caller passes
   * (`fields`'s keys are all optional — a key left OFF `fields` entirely is
   * not touched at all, not even COALESCE'd against itself); every key
   * that IS present renders `COALESCE(<col>, ?)` through `coalesceParam`
   * (never an inline `raw()`), so a column already holding a value is never
   * overwritten and an empty one is filled from `fields`'s value.
   * `updated_at` is stamped unconditionally — all three legacy statements
   * stamp it, none of them conditionally.
   *
   * The three call shapes this serves (Task 5's "×3 shapes"):
   *  - PL43 (`enrichOne`'s main update) — `google_place_id`, `google_ftid`,
   *    `address`, `website`, `phone` all at once.
   *  - PL44 (`enrichOne`'s photo update) — `image_url` alone.
   *  - PL46 (`backfillMissingAddresses`) — `address` alone.
   */
  async fillIfEmpty(id: number, trip_id: number, fields: {
    google_place_id?: string | null;
    google_ftid?: string | null;
    address?: string | null;
    website?: string | null;
    phone?: string | null;
    image_url?: string | null;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const data: {
      google_place_id?: ReturnType<typeof coalesceParam>;
      google_ftid?: ReturnType<typeof coalesceParam>;
      address?: ReturnType<typeof coalesceParam>;
      website?: ReturnType<typeof coalesceParam>;
      phone?: ReturnType<typeof coalesceParam>;
      image_url?: ReturnType<typeof coalesceParam>;
      updated_at: ReturnType<typeof currentTimestamp>;
    } = { updated_at: currentTimestamp(platform) };
    if (fields.google_place_id !== undefined) data.google_place_id = coalesceParam(platform, 'google_place_id', fields.google_place_id);
    if (fields.google_ftid !== undefined) data.google_ftid = coalesceParam(platform, 'google_ftid', fields.google_ftid);
    if (fields.address !== undefined) data.address = coalesceParam(platform, 'address', fields.address);
    if (fields.website !== undefined) data.website = coalesceParam(platform, 'website', fields.website);
    if (fields.phone !== undefined) data.phone = coalesceParam(platform, 'phone', fields.phone);
    if (fields.image_url !== undefined) data.image_url = coalesceParam(platform, 'image_url', fields.image_url);
    await this.nativeUpdate({ id, trip: trip_id }, data);
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 7 (`trips.rpc.ts`) — additive (per `task-4-report.md`'s own
  // note that this method "may not exist"): every column above is Task 4/5's,
  // unchanged.
  // ---------------------------------------------------------------------------

  /**
   * RP2 (`trips.rpc.ts::getPlaces`) — `SELECT * FROM places WHERE trip_id = ?
   * ORDER BY created_at DESC`. The trip's place POOL has no itinerary
   * position of its own (`day_id`/`order_index` live on `day_assignments`),
   * so this orders by `created_at` like the REST list does — the RPC
   * method's own comment (`trips.rpc.ts`).
   */
  async listForTripOrdered(trip_id: number): Promise<PlaceRow[]> {
    return await this.qb('p')
      .select(['p.*'])
      .where({ trip: trip_id })
      .orderBy({ 'p.created_at': 'desc' })
      .execute<PlaceRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 6 (`share.service.ts`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * `share.service.ts:340` SH12 (`getSharedTripData`'s share_map place-pool
   * read) — **SECURITY-CRITICAL (#2320)**: a named 20-column allow-list,
   * never `p.*`. Withheld on purpose (matching `PUBLIC_PLACE_COLUMNS`'s own
   * doc comment in `share.service.ts`): the owner's booking-status columns
   * (`reservation_status`/`reservation_notes`/`reservation_datetime`), every
   * routing/dedup id (`google_place_id`, `google_ftid`, `osm_id`,
   * `amap_poi_id`), `route_geometry`/`route_color`/`stop_type`/
   * `fill_percent`, and `source`. Kysely, not `qb()`+`columnRef`: this read
   * joins `p.category` under alias `c`, and both `trip_id`/`category_id` are
   * `persist(false)` mirror columns — the exact trap
   * `DayAssignmentsRepository.assignmentWithPlaceSelect`'s docstring
   * documents. `ORDER BY p.created_at DESC`, matching the legacy statement.
   */
  async listPublicForShare(trip_id: number | string): Promise<SharePublicPlaceRow[]> {
    return await this.kysely<SharePublicPlaceKyselyDB>()
      .selectFrom('places as p')
      .leftJoin('categories as c', 'c.id', 'p.category_id')
      .select([
        'p.id', 'p.trip_id', 'p.name', 'p.description', 'p.lat', 'p.lng', 'p.address', 'p.category_id',
        'p.price', 'p.currency', 'p.place_time', 'p.end_time', 'p.duration_minutes', 'p.notes',
        'p.image_url', 'p.website', 'p.phone', 'p.transport_mode', 'p.created_at', 'p.updated_at',
        'c.name as category_name', 'c.color as category_color', 'c.icon as category_icon',
      ])
      .where('p.trip_id', '=', trip_id as number)
      .orderBy('p.created_at', 'desc')
      .execute();
  }

  /**
   * `share.service.ts:461` SH18 (`getSharedPlacePhotoKey`) —
   * **SECURITY-CRITICAL**: the anonymous photo-serving ownership gate.
   * `SELECT 1 FROM places WHERE trip_id = ? AND image_url = ?` — both must
   * match, proving the requested proxy URL belongs to a place on the SAME
   * trip the share token covers, never just any place anywhere with that
   * `image_url`.
   */
  async existsByTripAndImageUrl(trip_id: number | string, imageUrl: string): Promise<boolean> {
    const row = await this.kysely<{ places: { id: number; trip_id: number; image_url: string | null } }>()
      .selectFrom('places')
      .select('id')
      .where('trip_id', '=', trip_id as number)
      .where('image_url', '=', imageUrl)
      .limit(1)
      .executeTakeFirst();
    return !!row;
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 8 (`TripsService.copy`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP40 (`trips.service.ts::copy`'s places read) — `SELECT * FROM places
   * WHERE trip_id = ?`, no `ORDER BY` at all (unlike RP2's `listForTripOrdered`
   * above, which adds `ORDER BY created_at DESC` for the RPC list view). The
   * legacy statement relies on SQLite's own rowid-ascending scan order for a
   * plain, unindexed `WHERE trip_id = ?` — reproduced here the same way, by
   * NOT adding an `ORDER BY`, so the copy's places are inserted (and so
   * relatively ordered) the same way the legacy loop did.
   */
  async listAllForTrip(trip_id: number | string): Promise<PlaceRow[]> {
    return await this.qb('p')
      .select(['p.*'])
      .where('p.trip_id = ?', [trip_id])
      .execute<PlaceRow[]>('all', false);
  }

  /**
   * TP41 (`trips.service.ts::copy`'s place INSERT) — the 28-column
   * `INSERT INTO places (...)` the copy loop builds, three columns wider
   * than PL4's `insertPlace` (`reservation_status`, `reservation_notes`,
   * `reservation_datetime` — a copy carries the source place's reservation
   * fields verbatim; `PlacesService.create` never sets them at creation
   * time, which is why PL4's own column set omits them). Every value here
   * is copied straight off the source row with no coercion of its own — the
   * copy loop's job is to remap `trip_id`, nothing else.
   */
  async insertPlaceCopy(input: {
    trip_id: number;
    name: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    category_id: number | null;
    price: number | null;
    currency: string | null;
    reservation_status: string | null;
    reservation_notes: string | null;
    reservation_datetime: string | null;
    place_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    notes: string | null;
    image_url: string | null;
    google_place_id: string | null;
    google_ftid: string | null;
    website: string | null;
    phone: string | null;
    transport_mode: string | null;
    osm_id: string | null;
    amap_poi_id: string | null;
    route_geometry: string | null;
    route_color: string | null;
    stop_type: string | null;
    fill_percent: number | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      name: input.name,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      category: input.category_id,
      price: input.price,
      currency: input.currency,
      reservation_status: input.reservation_status,
      reservation_notes: input.reservation_notes,
      reservation_datetime: input.reservation_datetime,
      place_time: input.place_time,
      end_time: input.end_time,
      duration_minutes: input.duration_minutes,
      notes: input.notes,
      image_url: input.image_url,
      google_place_id: input.google_place_id,
      google_ftid: input.google_ftid,
      website: input.website,
      phone: input.phone,
      transport_mode: input.transport_mode,
      osm_id: input.osm_id,
      amap_poi_id: input.amap_poi_id,
      route_geometry: input.route_geometry,
      route_color: input.route_color,
      stop_type: input.stop_type,
      fill_percent: input.fill_percent,
    });
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 1 (`RoadtripService`/`ChargingService`) — additive, per this
  // task's own file-ownership rule ("all additive methods on Days/Places/
  // DayAssignments repositories").
  // ---------------------------------------------------------------------------

  /**
   * RT13 (`RoadtripService.trackExists`) — `SELECT id FROM places WHERE id =
   * ? AND trip_id = ? AND route_geometry IS NOT NULL AND route_geometry !=
   * ''`. Two `.andWhere()` calls (rule 23 — typed conditions, not an inline
   * SQL string) rather than one `$and` array: the two operators (`$ne: null`
   * for `IS NOT NULL`, `$ne: ''` for `!= ''`) target the SAME property, so a
   * single filter object literal cannot carry both keys.
   */
  async isTrackInTrip(id: number, trip_id: number): Promise<boolean> {
    const row = await this.qb('p')
      .select(['p.id'])
      .where({ id, trip: trip_id })
      .andWhere({ route_geometry: { $ne: null } })
      .andWhere({ route_geometry: { $ne: '' } })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /** CH1 (`ChargingService.read`) — `SELECT name, lat, lng, stop_type FROM places WHERE id = ? AND trip_id = ?`. */
  async findChargingProbe(id: number, trip_id: number): Promise<{ name: string; lat: number | null; lng: number | null; stop_type: string | null } | undefined> {
    const row = await this.qb('p')
      .select(['p.name', 'p.lat', 'p.lng', 'p.stop_type'])
      .where({ id, trip: trip_id })
      .execute<{ name: string; lat: number | null; lng: number | null; stop_type: string | null } | undefined>('get', false);
    return row ?? undefined;
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 3 (`AccommodationsService`) — additive, per this task's own
  // file-ownership rule ("additive methods on Days/Places/DayAssignments/
  // Reservations repositories where a read belongs there").
  // ---------------------------------------------------------------------------

  /** AC9 (`AccommodationsService.stampLodging`) — `SELECT stop_type FROM places WHERE id = ?`. */
  async getStopType(id: number): Promise<{ stop_type: string | null } | undefined> {
    return await this.qb('p')
      .select(['p.stop_type'])
      .where({ id })
      .execute<{ stop_type: string | null } | undefined>('get', false);
  }

  /** AC10 (`AccommodationsService.stampLodging`) — `UPDATE places SET stop_type = 'hotel' WHERE id = ?`. Does NOT stamp `places.updated_at` (matches the legacy statement, R7 class — flagged, not fixed). */
  async stampHotel(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { stop_type: 'hotel' });
  }

  /** AC31 (`AccommodationsService.createAccommodation`) — `SELECT name FROM places WHERE id = ?`, the auto-created partner booking's title source. */
  async getName(id: number): Promise<{ name: string } | undefined> {
    return await this.qb('p')
      .select(['p.name'])
      .where({ id })
      .execute<{ name: string } | undefined>('get', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 1 (`FilesService.findForeignLinkTarget`, R12) — additive,
  // append-only per that task's own file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * FL2 (`FilesService.findForeignLinkTarget`'s place branch) — `SELECT 1
   * FROM places WHERE id = ? AND trip_id = ?`, re-expressed as "what trip
   * does this row belong to" (R12, the same shape as
   * `ReservationsRepository.findTripId`'s docstring).
   */
  async findTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('p')
      .select([columnRef(platform, 'p.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 2 (budget) — additive, append-only per that task's own
  // file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * BG20 (`BudgetService.rebaseTripCurrency`'s `pinPlaces`) — `UPDATE places
   * SET currency = ?, updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND
   * price IS NOT NULL AND (currency IS NULL OR currency = '')`. Only priced
   * places are denominated; `updated_at` doubles as the optimistic-
   * concurrency token (#1135).
   */
  async pinCurrencyForTrip(trip_id: number | string, prev_currency: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { trip: trip_id as number, price: { $ne: null }, $or: [{ currency: null }, { currency: '' }] },
      { currency: prev_currency, updated_at: currentTimestamp(platform) },
    );
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 1 (`AtlasService`) — additive, append-only per that task's
  // own file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * AT2 (`AtlasService#getPlacesForTrips`) — `SELECT * FROM places WHERE
   * trip_id IN (...)`. Dynamic `IN`, empty-array short-circuit (the
   * `listAllForTrip`/single-id precedent above, widened to a batch of trip
   * ids — every atlas read that resolves a user's trips first passes the
   * whole id list through here in one call rather than one query per trip).
   */
  async listForTripIds(trip_ids: number[]): Promise<PlaceRow[]> {
    if (trip_ids.length === 0) return [];
    return await this.qb('p')
      .select(['p.*'])
      .where({ trip: { $in: trip_ids } })
      .execute<PlaceRow[]>('all', false);
  }

  /**
   * AT41 (`AtlasService#getTravelStats`) — `SELECT DISTINCT p.address,
   * p.lat, p.lng, pr.region_name FROM places p JOIN trips t ON p.trip_id =
   * t.id LEFT JOIN trip_members tm ON t.id = tm.trip_id LEFT JOIN
   * place_regions pr ON pr.place_id = p.id WHERE t.user_id = ? OR tm.user_id
   * = ?`. The resolved region rides along so `cityFromAddress` can tell the
   * city apart from the region sitting right above it in the same address
   * (#1115) — unchanged from the legacy projection.
   */
  async listAddressesForUser(user_id: number): Promise<{ address: string | null; lat: number | null; lng: number | null; region_name: string | null }[]> {
    return await this.kysely<PlacesAddressesForUserKyselyDB>()
      .selectFrom('places as p')
      .innerJoin('trips as t', 't.id', 'p.trip_id')
      .leftJoin('trip_members as tm', 'tm.trip_id', 't.id')
      .leftJoin('place_regions as pr', 'pr.place_id', 'p.id')
      .select(['p.address', 'p.lat', 'p.lng', 'pr.region_name'])
      .distinct()
      .where((eb) => eb.or([eb('t.user_id', '=', user_id), eb('tm.user_id', '=', user_id)]))
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 3 (`DawarichSuggestionsService`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * DWS7 (`dawarich-suggestions.service.ts::acceptAsPlace`) — `UPDATE places
   * SET source = 'dawarich' WHERE id = ?`. No `updated_at` stamp — the
   * legacy statement never wrote one for this column (same "no stamp"
   * shape {@link setRouteColor} above already documents for a different
   * column). Cross-domain write from the Dawarich integration (3h) into
   * this 3c-owned table.
   */
  async setSource(id: number, source: string): Promise<void> {
    await this.nativeUpdate({ id }, { source });
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 2 (`CollectionsService`) — additive, cross-domain. Flagged in
  // the task's own report per its brief: these touch `places`, a 3c-owned
  // table, from the collections cluster's own copy/import surface.
  // ---------------------------------------------------------------------------

  /**
   * CL45 (`importablePlaces`) — the trip's places as offered to the
   * collection import dialog, one row per place with two correlated scalar
   * subqueries resolving the EARLIEST day it is assigned to (a place can
   * sit on several days): `SELECT p.id AS place_id, p.name, p.address,
   * p.lat, p.lng, p.category_id, p.image_url, p.google_place_id,
   * p.google_ftid, p.osm_id, (SELECT MIN(d.day_number) FROM day_assignments
   * da JOIN days d ON d.id=da.day_id WHERE da.place_id=p.id AND
   * d.trip_id=p.trip_id) AS day_number, (SELECT d.date FROM day_assignments
   * da JOIN days d ON d.id=da.day_id WHERE da.place_id=p.id AND
   * d.trip_id=p.trip_id ORDER BY d.day_number ASC LIMIT 1) AS date FROM
   * places p WHERE p.trip_id=? ORDER BY p.name COLLATE NOCASE`. Kysely — a
   * correlated scalar subquery has no MikroORM QueryBuilder expression
   * (`JourneysRepository.listForUser`'s own `eb.selectFrom(...).whereRef
   * (...).as(...)` precedent, the closest analog: five correlated
   * subqueries over a `LEFT JOIN`). `ORDER BY ... COLLATE NOCASE` is
   * Kysely's own native `OrderByItemBuilder.collate('nocase')` — a portable
   * Kysely API, not a raw SQLite fragment, so it needs no
   * `sql-functions.ts` dialect wrapper (rule 5 covers dialect FUNCTIONS,
   * not Kysely's own builder surface).
   */
  async listImportable(tripId: number): Promise<ImportablePlaceRow[]> {
    return await this.kysely<ImportablePlacesKyselyDB>()
      .selectFrom('places as p')
      .select((eb) => [
        'p.id as place_id', 'p.name', 'p.address', 'p.lat', 'p.lng', 'p.category_id', 'p.image_url',
        'p.google_place_id', 'p.google_ftid', 'p.osm_id',
        eb
          .selectFrom('day_assignments as da')
          .innerJoin('days as d', 'd.id', 'da.day_id')
          .select((eb2) => eb2.fn.min<number | null>('d.day_number').as('m'))
          .whereRef('da.place_id', '=', 'p.id')
          .whereRef('d.trip_id', '=', 'p.trip_id')
          .as('day_number'),
        eb
          .selectFrom('day_assignments as da2')
          .innerJoin('days as d2', 'd2.id', 'da2.day_id')
          .select('d2.date')
          .whereRef('da2.place_id', '=', 'p.id')
          .whereRef('d2.trip_id', '=', 'p.trip_id')
          .orderBy('d2.day_number', 'asc')
          .limit(1)
          .as('date'),
      ])
      .where('p.trip_id', '=', tripId)
      .orderBy('p.name', (ob) => ob.collate('nocase').asc())
      .execute();
  }

  /**
   * CL57 (`setStatusFromTrip`) — `SELECT id, name, lat, lng,
   * google_place_id, google_ftid, osm_id FROM places WHERE trip_id=? AND id
   * IN (...)`. `$in` for the dynamic list (rule 17b), the same
   * `scopedIds`-shaped raw `trip_id` condition above.
   */
  async listByTripAndIds(trip_id: number, ids: number[]): Promise<PlaceMatchRow[]> {
    if (ids.length === 0) return [];
    return await this.qb('p')
      .select(['p.id', 'p.name', 'p.lat', 'p.lng', 'p.google_place_id', 'p.google_ftid', 'p.osm_id'])
      .where({ 'p.trip_id': trip_id })
      .andWhere({ id: { $in: ids } })
      .execute<PlaceMatchRow[]>('all', false);
  }

  /**
   * CL63 (`copyToTrip`'s trip dedup set) — `SELECT name, lat, lng,
   * google_place_id, google_ftid, osm_id FROM places WHERE trip_id=?`.
   */
  async dedupCandidatesForTrip(trip_id: number): Promise<Omit<PlaceMatchRow, 'id'>[]> {
    return await this.qb('p')
      .select(['p.name', 'p.lat', 'p.lng', 'p.google_place_id', 'p.google_ftid', 'p.osm_id'])
      .where({ trip: trip_id })
      .execute<Omit<PlaceMatchRow, 'id'>[]>('all', false);
  }

  /**
   * CL64 (`copyToTrip`, PREPARED/looped, TX) — `INSERT INTO places (trip_id,
   * name, description, lat, lng, address, category_id, price, currency,
   * notes, image_url, google_place_id, google_ftid, website, phone,
   * osm_id) VALUES (...)` — a genuinely NARROWER 16-column insert than
   * {@link insertPlace}'s full 27-column shape (no `place_time`/`end_time`/
   * `duration_minutes`/`transport_mode`/`route_geometry`/`route_color`/
   * `stop_type`/`fill_percent`/`amap_poi_id`): the legacy statement leaves
   * those to the table's own `DEFAULT` clauses
   * (`Migration20200101000000_baseline_schema.ts`: `duration_minutes
   * INTEGER DEFAULT 60`, `transport_mode TEXT DEFAULT 'walking'`,
   * `reservation_status TEXT DEFAULT 'none'`), unlike `insertPlace`'s own
   * caller (`PlacesService.create`), which always resolves and writes every
   * one of those columns itself. Kysely (a narrower insert-only interface,
   * `CollectionsRepository`'s own `CollectionPlacesWriteKyselyDB`
   * precedent for the identical "narrower than the full entity" shape) so
   * this genuinely different column set never widens `insertPlace`'s own
   * required-field list. Returns the generated id.
   */
  async insertFromCollectionPlace(row: {
    trip_id: number;
    name: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    category_id: number | null;
    price: number | null;
    currency: string | null;
    notes: string | null;
    image_url: string | null;
    google_place_id: string | null;
    google_ftid: string | null;
    website: string | null;
    phone: string | null;
    osm_id: string | null;
  }): Promise<number> {
    const result = await this.kysely<PlacesNarrowInsertKyselyDB>().insertInto('places').values(row).executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 4 (`maps.service.ts`'s photo-fetch method, MAP9) — additive,
  // per this task's own file-ownership rule ("additive methods on
  // Reservations/ReservationEndpoints/Days/Places/Users repositories").
  // ---------------------------------------------------------------------------

  /**
   * MAP9 — `UPDATE places SET image_url = ?, updated_at = CURRENT_TIMESTAMP
   * WHERE google_place_id = ? AND (image_url IS NULL OR image_url = '')`.
   * **SECURITY/PARITY**: the `$or` guard is what stops this from ever
   * clobbering a place's already-set/custom image — preserved exactly.
   * Unscoped by `trip_id`/`id` (matching the legacy statement): a
   * `google_place_id` can appear on more than one place row across
   * different trips, and every empty-image row sharing it is filled in one
   * statement.
   */
  async setImageUrlIfUnset(google_place_id: string, image_url: string): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return this.nativeUpdate(
      { google_place_id, $or: [{ image_url: null }, { image_url: '' }] },
      { image_url, updated_at: currentTimestamp(platform) },
    );
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (`public-api.service.ts::placesByDay`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * `SELECT da.day_id, p.name, p.address, p.lat, p.lng, p.place_time,
   * p.end_time, p.duration_minutes, p.notes, p.transport_mode, c.name AS
   * category FROM day_assignments da JOIN places p ON p.id = da.place_id
   * LEFT JOIN categories c ON c.id = p.category_id WHERE p.trip_id = ? AND
   * da.accommodation_id IS NULL ORDER BY da.day_id ASC, da.order_index ASC`.
   * Kysely — the SAME cross-table-read escape hatch `ReservationsRepository
   * .listUnplannedPlacesForPublicApi`'s precedent (3d Task 4) uses for this
   * exact `public-api.service.ts` surface; landed on `PlacesRepository`
   * rather than grouped there because the projection is place-shaped, per
   * this domain plan's own ruling.
   */
  async listAssignedForPublicApi(trip_id: number): Promise<PublicApiAssignedPlaceRow[]> {
    const rows = await this.kysely<PublicApiAssignedPlacesKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('places as p', 'p.id', 'da.place_id')
      .leftJoin('categories as c', 'c.id', 'p.category_id')
      .select([
        'da.day_id',
        'p.name', 'p.address', 'p.lat', 'p.lng', 'p.place_time', 'p.end_time',
        'p.duration_minutes', 'p.notes', 'p.transport_mode', 'c.name as category',
      ])
      .where('p.trip_id', '=', trip_id)
      .where('da.accommodation_id', 'is', null)
      .orderBy('da.day_id', 'asc')
      .orderBy('da.order_index', 'asc')
      .execute();
    return rows as PublicApiAssignedPlaceRow[];
  }
}

/** The `places` columns {@link PlacesRepository.listAssignedForPublicApi} selects, typed off {@link PlaceRow}. */
type PublicApiPlaceColumns = Pick<
  PlaceRow,
  'name' | 'address' | 'lat' | 'lng' | 'place_time' | 'end_time' | 'duration_minutes' | 'notes' | 'transport_mode'
>;

/** {@link PlacesRepository.listAssignedForPublicApi}'s projection. */
export interface PublicApiAssignedPlaceRow extends PublicApiPlaceColumns {
  day_id: number;
  category: string | null;
}

/** {@link PlacesRepository.listAssignedForPublicApi}'s narrow `day_assignments`/`places`/`categories` shape. */
interface PublicApiAssignedPlacesKyselyDB {
  day_assignments: { day_id: number; place_id: number; accommodation_id: number | null; order_index: number | null };
  places: PublicApiPlaceColumns & Pick<PlaceRow, 'id' | 'trip_id' | 'category_id'>;
  categories: { id: number; name: string };
}

/** {@link PlacesRepository.listImportable}'s row shape (CL45). */
export interface ImportablePlaceRow {
  place_id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category_id: number | null;
  image_url: string | null;
  google_place_id: string | null;
  google_ftid: string | null;
  osm_id: string | null;
  day_number: number | null;
  date: string | null;
}

/** {@link PlacesRepository.listByTripAndIds}/{@link PlacesRepository.dedupCandidatesForTrip}'s shared narrow projection (CL57/CL63). */
export interface PlaceMatchRow {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  google_ftid: string | null;
  osm_id: string | null;
}

/** {@link PlacesRepository.listImportable}'s narrow `places`/`day_assignments`/`days` shape (CL45). */
interface ImportablePlacesKyselyDB {
  places: { id: number; trip_id: number; name: string; address: string | null; lat: number | null; lng: number | null; category_id: number | null; image_url: string | null; google_place_id: string | null; google_ftid: string | null; osm_id: string | null };
  day_assignments: { place_id: number; day_id: number };
  days: { id: number; trip_id: number; day_number: number; date: string };
}

/** {@link PlacesRepository.insertFromCollectionPlace}'s narrow insert-only shape (CL64). */
interface PlacesNarrowInsertKyselyDB {
  places: {
    trip_id: number;
    name: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    category_id: number | null;
    price: number | null;
    currency: string | null;
    notes: string | null;
    image_url: string | null;
    google_place_id: string | null;
    google_ftid: string | null;
    website: string | null;
    phone: string | null;
    osm_id: string | null;
  };
}

/** {@link PlacesRepository.listAddressesForUser}'s narrow `places`/`trips`/`trip_members`/`place_regions` shape. */
interface PlacesAddressesForUserKyselyDB {
  places: { id: number; trip_id: number; address: string | null; lat: number | null; lng: number | null };
  trips: { id: number; user_id: number };
  trip_members: { trip_id: number; user_id: number };
  place_regions: { place_id: number; region_name: string | null };
}
