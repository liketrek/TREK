import type { Collections } from '../entities/Collections.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';

/** `collections` — every scalar column, `getCollectionRow`'s (CL14) `SELECT *` shape. */
export interface CollectionRow {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  cover_image: string | null;
  links: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * A saved place row, `cp.*` joined to its category name/color/icon — CL10
 * (`getPlaceById`, filtered by `cp.id`) and CL16/CL17 (`getCollection`/
 * `exportCollection`'s dup-text pair, filtered by `cp.collection_id`) both
 * select this exact shape. `links` stays the raw TEXT column (`string |
 * null`) here — never `CollectionLink[]` — the service's own `parseLinks`
 * does that parsing on the way out, the same reason `CollectionRow.links`
 * below is also raw TEXT: a hand-written row interface documents the DB
 * shape, not the wire shape (`_shared/rows.ts`'s docstring).
 */
export interface CollectionPlaceRow {
  id: number;
  collection_id: number;
  owner_id: number;
  saved_by: number | null;
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
  osm_id: string | null;
  website: string | null;
  phone: string | null;
  status: string;
  source_trip_id: number | null;
  source_place_id: number | null;
  links: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

type CollectionsKyselyDB = Pick<DB, 'collections'>;

/**
 * CL29's insert table: it binds `INSERT INTO collections (owner_id, name,
 * description, color, icon, cover_image, links, sort_order)` exactly, and
 * `id`/`created_at`/`updated_at` (filled by the schema's own
 * `DEFAULT CURRENT_TIMESTAMP`/autoincrement) are `InsertOptional` in the
 * generated type.
 */
type CollectionsInsertKyselyDB = Pick<DB, 'collections'>;

type CollectionIdsKyselyDB = Pick<DB, 'collections' | 'collection_members'>;

type CollectionPlacesReadKyselyDB = Pick<DB, 'collection_places' | 'categories'>;

/**
 * CL23's insert table: it binds `INSERT INTO collection_places (21 cols)`
 * exactly, and `id`/`created_at`/`updated_at` are `InsertOptional` in the
 * generated type, as for {@link CollectionsInsertKyselyDB} above.
 */
type CollectionPlacesWriteKyselyDB = Pick<DB, 'collection_places'>;

type CollectionPlaceLabelsKyselyDB = Pick<DB, 'collection_place_labels'>;

/**
 * `collections` — the root of the collections cluster (Plan 3h Task 1, part
 * A). Owns every CL1-CL36 statement not moved to `CollectionMembersRepository`/
 * `CollectionLabelsRepository`: the `collections` table's own CRUD/reorder,
 * plus — as a pragmatic first cut, since `CollectionPlacesRepository`/
 * `CollectionPlaceTagsRepository`/`CollectionPlaceRatingsRepository` don't
 * exist yet (Task 2 builds them) — every hydration/export/import/dedup
 * statement Part A's own methods (`hydratePlaces`, `getPlaceById`,
 * `getCollection`/`exportCollection`, `writeFilePlaces`,
 * `findDuplicateCollectionPlace`) need against `collection_places`/
 * `collection_place_tags`/`collection_place_labels`/`collection_place_ratings`.
 * Task 2's own report should note whether any of these bridge methods move
 * onto its new, more specific repositories once they exist — see this
 * task's own report for the explicit flag.
 */
export class CollectionsRepository extends TrekRepository<Collections> {
  private readDb() {
    return this.kysely<CollectionsKyselyDB>();
  }

  private insertDb() {
    return this.kysely<CollectionsInsertKyselyDB>();
  }

  private idsDb() {
    return this.kysely<CollectionIdsKyselyDB>();
  }

  private placesReadDb() {
    return this.kysely<CollectionPlacesReadKyselyDB>();
  }

  private placesWriteDb() {
    return this.kysely<CollectionPlacesWriteKyselyDB>();
  }

  private placeLabelsDb() {
    return this.kysely<CollectionPlaceLabelsKyselyDB>();
  }

  /**
   * CL1 (`accessibleCollectionIds`) — `SELECT id FROM collections WHERE
   * owner_id=? UNION SELECT collection_id FROM collection_members WHERE
   * user_id=? AND status='accepted'`. Two typed selects, merged and
   * deduplicated in TS (`Set`) the same way SQL's `UNION` (not `UNION ALL`)
   * would — the legacy statement is `UNION`, so a row present in both halves
   * collapses to one id either way.
   */
  async accessibleCollectionIds(userId: number): Promise<number[]> {
    const owned = await this.idsDb().selectFrom('collections').select('id').where('owner_id', '=', userId).execute();
    const member = await this.idsDb()
      .selectFrom('collection_members')
      .select('collection_id as id')
      .where('user_id', '=', userId)
      .where('status', '=', 'accepted')
      .execute();
    return [...new Set([...owned.map((r) => r.id), ...member.map((r) => r.id)])];
  }

  /** CL5 (`ownerOf`) — `SELECT owner_id FROM collections WHERE id=?`. */
  async ownerId(id: number): Promise<number | undefined> {
    const row = await this.readDb().selectFrom('collections').select('owner_id').where('id', '=', id).executeTakeFirst();
    return row?.owner_id;
  }

  /** CL14 (`getCollectionRow`) — `SELECT * FROM collections WHERE id=?`. */
  async findRow(id: number): Promise<CollectionRow | undefined> {
    return await this.readDb().selectFrom('collections').selectAll().where('id', '=', id).executeTakeFirst();
  }

  /** CL15 (`getCollectionRow`) — `SELECT COUNT(*) AS n FROM collection_places WHERE collection_id=?`. */
  async placeCount(collectionId: number): Promise<number> {
    const row = await this.placesReadDb()
      .selectFrom('collection_places')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('collection_id', '=', collectionId)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }

  /** CL28 (`createCollection`) — `SELECT COALESCE(MAX(sort_order),-1) AS m FROM collections WHERE owner_id=?`. */
  async maxSortOrder(ownerId: number): Promise<number> {
    const row = await this.readDb()
      .selectFrom('collections')
      .select((eb) => eb.fn.coalesce(eb.fn.max('sort_order'), eb.val(-1)).as('m'))
      .where('owner_id', '=', ownerId)
      .executeTakeFirstOrThrow();
    return Number(row.m);
  }

  /**
   * CL29 (`createCollection`) — `INSERT INTO collections (owner_id, name,
   * description, color, icon, cover_image, links, sort_order) VALUES (...)`.
   * Returns the new row's id.
   */
  async insertCollection(row: {
    owner_id: number;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    cover_image: string | null;
    links: string | null;
    sort_order: number;
  }): Promise<number> {
    const inserted = await this.insertDb().insertInto('collections').values(row).returning('id').executeTakeFirstOrThrow();
    return inserted.id;
  }

  /**
   * CL30 (`updateCollection`) — the allow-listed dynamic `UPDATE collections
   * SET ... WHERE id=?`. `write` carries exactly the columns the caller
   * built (the service resolves `body.field !== undefined` itself, same
   * shape as every other repository's `presenceSet`-fed write) — an empty
   * `write` short-circuits before the `UPDATE`, matching the legacy
   * `if (updates.length > 0)` guard. `updated_at` is stamped with {@link dbNow},
   * the same text `CURRENT_TIMESTAMP` writes (it used to be `toISOString()`).
   */
  async updateFields(
    id: number,
    write: Partial<{
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      cover_image: string | null;
      links: string | null;
      sort_order: number;
    }>,
  ): Promise<void> {
    if (Object.keys(write).length === 0) return;
    await this.readDb().updateTable('collections').set({ ...write, updated_at: dbNow() }).where('id', '=', id).execute();
  }

  /** CL31 (`setCollectionCover`) — `SELECT cover_image FROM collections WHERE id=?`. */
  async coverImage(id: number): Promise<string | null | undefined> {
    const row = await this.readDb().selectFrom('collections').select('cover_image').where('id', '=', id).executeTakeFirst();
    return row?.cover_image;
  }

  /** CL32 (`setCollectionCover`) — `UPDATE collections SET cover_image=?, updated_at=<dbNow()> WHERE id=?`. */
  async setCoverImage(id: number, coverUrl: string | null): Promise<void> {
    await this.readDb().updateTable('collections').set({ cover_image: coverUrl, updated_at: dbNow() }).where('id', '=', id).execute();
  }

  /** CL35 (`deleteCollection`) — `DELETE FROM collections WHERE id=?` (CASCADE drops members + places + tags). */
  async deleteById(id: number): Promise<void> {
    await this.readDb().deleteFrom('collections').where('id', '=', id).execute();
  }

  /**
   * CL36 (`reorderCollections`, TX `:712`) — `UPDATE collections SET
   * sort_order=? WHERE id=?`, looped per visible id. The legacy statement
   * is a `this.db.prepare(...)` reused across the loop (a single compiled
   * statement, `.run()` called once per iteration) — Kysely's query builder
   * has no equivalent "compile once, bind many" primitive for an UPDATE
   * with per-row values, so this issues one `updateTable` call per pair
   * instead (informational for Task 7: the "prepare once, loop `.run()`"
   * shape does NOT survive this conversion, per-call is what the repository
   * layer supports here).
   */
  async setSortOrders(pairs: { id: number; sortOrder: number }[]): Promise<void> {
    const db = this.readDb();
    for (const { id, sortOrder } of pairs) {
      await db.updateTable('collections').set({ sort_order: sortOrder }).where('id', '=', id).execute();
    }
  }

  // -------------------------------------------------------------------------
  // Hydration / export / import / dedup bridge methods — CL6, CL8-CL11,
  // CL16/17 (collapsed), CL22-CL27. First-cut home: these touch
  // `collection_places`/`collection_place_tags`/`collection_place_labels`/
  // `collection_place_ratings`, tables Task 2's own repositories will own
  // going forward, but Part A's `hydratePlaces`/`getPlaceById`/
  // `getCollection`/`exportCollection`/`writeFilePlaces`/
  // `findDuplicateCollectionPlace` are its own methods and need somewhere to
  // land now.
  // -------------------------------------------------------------------------

  /** CL10 (`getPlaceById`) — `SELECT cp.*, c.name/color/icon AS category_* FROM collection_places cp LEFT JOIN categories c ON cp.category_id=c.id WHERE cp.id=?`. */
  async findPlaceRowById(id: number): Promise<CollectionPlaceRow | undefined> {
    return await this.placesReadDb()
      .selectFrom('collection_places as cp')
      .leftJoin('categories as c', 'c.id', 'cp.category_id')
      .select([
        'cp.id', 'cp.collection_id', 'cp.owner_id', 'cp.saved_by', 'cp.name', 'cp.description', 'cp.lat', 'cp.lng',
        'cp.address', 'cp.category_id', 'cp.price', 'cp.currency', 'cp.notes', 'cp.image_url', 'cp.google_place_id',
        'cp.google_ftid', 'cp.osm_id', 'cp.website', 'cp.phone', 'cp.status', 'cp.source_trip_id', 'cp.source_place_id',
        'cp.links', 'cp.sort_order', 'cp.created_at', 'cp.updated_at',
        'c.name as category_name', 'c.color as category_color', 'c.icon as category_icon',
      ])
      .where('cp.id', '=', id)
      .executeTakeFirst();
  }

  /**
   * CL16/CL17 (`getCollection`/`exportCollection`'s dup-text pair, collapsed
   * onto ONE repository method as the brief directs) — the same
   * `cp.*`/category-alias select as {@link findPlaceRowById}, scoped by
   * `cp.collection_id` and ordered by `cp.sort_order, cp.created_at`.
   */
  async listPlaceRows(collectionId: number): Promise<CollectionPlaceRow[]> {
    return await this.placesReadDb()
      .selectFrom('collection_places as cp')
      .leftJoin('categories as c', 'c.id', 'cp.category_id')
      .select([
        'cp.id', 'cp.collection_id', 'cp.owner_id', 'cp.saved_by', 'cp.name', 'cp.description', 'cp.lat', 'cp.lng',
        'cp.address', 'cp.category_id', 'cp.price', 'cp.currency', 'cp.notes', 'cp.image_url', 'cp.google_place_id',
        'cp.google_ftid', 'cp.osm_id', 'cp.website', 'cp.phone', 'cp.status', 'cp.source_trip_id', 'cp.source_place_id',
        'cp.links', 'cp.sort_order', 'cp.created_at', 'cp.updated_at',
        'c.name as category_name', 'c.color as category_color', 'c.icon as category_icon',
      ])
      .where('cp.collection_id', '=', collectionId)
      .orderBy('cp.sort_order')
      .orderBy('cp.created_at')
      .execute();
  }

  /** CL11 (`collectionIdOfPlace`) — `SELECT collection_id FROM collection_places WHERE id=?`. */
  async collectionIdOfPlace(placeId: number): Promise<number | undefined> {
    const row = await this.placesReadDb().selectFrom('collection_places').select('collection_id').where('id', '=', placeId).executeTakeFirst();
    return row?.collection_id;
  }

  /**
   * CL6 (`loadTagsByCollectionPlaceIds`) — `SELECT cpt.collection_place_id
   * AS pid, t.id, t.name, t.color FROM collection_place_tags cpt JOIN tags t
   * ON t.id=cpt.tag_id WHERE cpt.collection_place_id IN (...)`. Empty input
   * short-circuits to `[]` (no `IN ()` sent) — the service's own batched
   * hydration helper already guards this, but the repository guards too so
   * it is safe to call directly.
   */
  async loadTagsByPlaceIds(placeIds: number[]): Promise<{ pid: number; id: number; name: string; color: string }[]> {
    if (placeIds.length === 0) return [];
    return await this.kysely<Pick<DB, 'collection_place_tags' | 'tags'>>()
      .selectFrom('collection_place_tags as cpt')
      .innerJoin('tags as t', 't.id', 'cpt.tag_id')
      .select(['cpt.collection_place_id as pid', 't.id', 't.name', 't.color'])
      .where('cpt.collection_place_id', 'in', placeIds)
      .execute();
  }

  /** CL8 (`loadLabelIdsByPlaceIds`) — `SELECT collection_place_id AS pid, label_id FROM collection_place_labels WHERE collection_place_id IN (...)`. */
  async loadLabelIdsByPlaceIds(placeIds: number[]): Promise<{ pid: number; label_id: number }[]> {
    if (placeIds.length === 0) return [];
    const rows = await this.placeLabelsDb()
      .selectFrom('collection_place_labels')
      .select(['collection_place_id as pid', 'label_id'])
      .where('collection_place_id', 'in', placeIds)
      .execute();
    return rows;
  }

  /**
   * CL9 (`loadRatingsByCollectionPlaceIds`, #1435) — `SELECT
   * cpr.collection_place_id AS pid, cpr.user_id, u.username, u.avatar,
   * cpr.rating FROM collection_place_ratings cpr JOIN users u ON
   * u.id=cpr.user_id WHERE cpr.collection_place_id IN (...) ORDER BY
   * cpr.created_at`.
   */
  async loadRatingsByPlaceIds(
    placeIds: number[],
  ): Promise<{ pid: number; user_id: number; username: string; avatar: string | null; rating: number }[]> {
    if (placeIds.length === 0) return [];
    return await this.kysely<Pick<DB, 'collection_place_ratings' | 'users'>>()
      .selectFrom('collection_place_ratings as cpr')
      .innerJoin('users as u', 'u.id', 'cpr.user_id')
      .select(['cpr.collection_place_id as pid', 'cpr.user_id', 'u.username', 'u.avatar', 'cpr.rating'])
      .where('cpr.collection_place_id', 'in', placeIds)
      .orderBy('cpr.created_at')
      .execute();
  }

  /** CL22 (`writeFilePlaces`) — `SELECT COALESCE(MAX(sort_order),-1) AS m FROM collection_places WHERE collection_id=?`. */
  async maxPlaceSortOrder(collectionId: number): Promise<number> {
    const row = await this.placesReadDb()
      .selectFrom('collection_places')
      .select((eb) => eb.fn.coalesce(eb.fn.max('sort_order'), eb.val(-1)).as('m'))
      .where('collection_id', '=', collectionId)
      .executeTakeFirstOrThrow();
    return Number(row.m);
  }

  /**
   * CL23 (`writeFilePlaces`, PREPARED/looped in the legacy code) — `INSERT
   * INTO collection_places (21 cols incl. sort_order, no source_trip_id/
   * source_place_id) VALUES (...)`. Distinct insert shape from CL42/CL46
   * (Task 2's) — never collapsed with either. Returns the new row's id.
   */
  async insertFilePlace(row: {
    collection_id: number;
    owner_id: number;
    saved_by: number;
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
    osm_id: string | null;
    website: string | null;
    phone: string | null;
    status: string;
    links: string | null;
    sort_order: number;
  }): Promise<number> {
    const inserted = await this.placesWriteDb().insertInto('collection_places').values(row).returning('id').executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** CL24 (`writeFilePlaces`'s `assignLabel` prepared statement) — `INSERT OR IGNORE INTO collection_place_labels (collection_place_id, label_id) VALUES (?,?)`. */
  async assignPlaceLabel(collectionPlaceId: number, labelId: number): Promise<void> {
    await this.placeLabelsDb()
      .insertInto('collection_place_labels')
      .values({ collection_place_id: collectionPlaceId, label_id: labelId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** CL25 (`findDuplicateCollectionPlace`, externalId branch) — `SELECT id,name FROM collection_places WHERE collection_id=? AND (google_place_id=? OR google_ftid=? OR osm_id=?) ORDER BY id ASC LIMIT 1`. */
  async findDuplicateByExternalId(
    collectionId: number,
    externalId: string,
  ): Promise<{ id: number; name: string } | undefined> {
    return await this.placesReadDb()
      .selectFrom('collection_places')
      .select(['id', 'name'])
      .where('collection_id', '=', collectionId)
      .where((eb) => eb.or([eb('google_place_id', '=', externalId), eb('google_ftid', '=', externalId), eb('osm_id', '=', externalId)]))
      .orderBy('id', 'asc')
      .limit(1)
      .executeTakeFirst();
  }

  /** CL26 (`findDuplicateCollectionPlace`, name branch) — `SELECT id,name FROM collection_places WHERE collection_id=? AND lower(trim(name))=? ORDER BY id ASC LIMIT 1`. `normalizedName` is already `lower(trim(...))`-shaped by the caller (`_shared/../dialect/sql-functions.ts`'s `lowerTrim`/`lowerTrimParam` precedent). */
  async findDuplicateByName(collectionId: number, normalizedName: string): Promise<{ id: number; name: string } | undefined> {
    return await this.placesReadDb()
      .selectFrom('collection_places')
      .select(['id', 'name'])
      .where('collection_id', '=', collectionId)
      .where((eb) => eb(eb.fn('lower', [eb.fn('trim', ['name'])]), '=', normalizedName))
      .orderBy('id', 'asc')
      .limit(1)
      .executeTakeFirst();
  }

  /** CL27 (`findDuplicateCollectionPlace`, coord branch) — `SELECT id,name FROM collection_places WHERE collection_id=? AND lat IS NOT NULL AND lng IS NOT NULL AND abs(lat-?)<=? AND abs(lng-?)<=? ORDER BY id ASC LIMIT 1`. */
  async findDuplicateByCoords(
    collectionId: number,
    lat: number,
    lng: number,
    tolerance: number,
  ): Promise<{ id: number; name: string } | undefined> {
    return await this.placesReadDb()
      .selectFrom('collection_places')
      .select(['id', 'name'])
      .where('collection_id', '=', collectionId)
      .where('lat', 'is not', null)
      .where('lng', 'is not', null)
      .where((eb) => eb(eb.fn('abs', [eb('lat', '-', lat)]), '<=', tolerance))
      .where((eb) => eb(eb.fn('abs', [eb('lng', '-', lng)]), '<=', tolerance))
      .orderBy('id', 'asc')
      .limit(1)
      .executeTakeFirst();
  }
}
