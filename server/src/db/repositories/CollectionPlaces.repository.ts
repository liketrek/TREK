import { currentTimestamp } from '../dialect/sql-functions';
import type { CollectionPlaces } from '../entities/CollectionPlaces.entity';
import type { CollectionPlaceRow } from './Collections.repository';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `collection_places` (Plan 3h Task 2, part B — saved places CRUD, dedup,
 * copy-to-trip, library-wide membership lookup, label assignment). Task 1's
 * own bridge methods for this table (CL10/11/16/17/22/23/25/26/27) stay on
 * `CollectionsRepository` as its report flags — this repository is additive
 * ONLY, every method here a NEW statement in Task 2's own CL37-69 range,
 * never a re-derivation of what Task 1 already built.
 *
 * **Read/write split**: every READ here goes through `this.kysely()` rather
 * than the MikroORM entity API, even for statements the entity COULD in
 * principle express, because every read in this file's own range projects
 * at least one `persist(false)` relation-mirror column (`collection_id`/
 * `category_id`) or needs `abs()`/dynamic OR conditions Kysely expresses
 * more directly — the TRAP list's "a `persist(false)` mirror column
 * selected bare is silently dropped, with or without an active join"
 * finding (3d/3e ledgers) applies to a `qb().select([...])`/`fields: [...]`
 * read exactly as much as it does to `find`, so Kysely sidesteps the whole
 * class of bug rather than being audited statement-by-statement for it.
 * WRITES go through the MikroORM entity API (`insert`/`nativeUpdate`/
 * `nativeDelete`) wherever the target table has an entity, using the
 * entity's own relation property names (`collection`/`owner`/`category`)
 * for FK columns — {@link PlaceRatingsRepository.upsertRating}'s
 * `{ place: place_id, user: user_id }` precedent — since a write is never
 * subject to the read-side narrowing trap. The two pivot tables this file
 * also owns (`collection_place_tags`/`collection_place_labels`) have NO
 * entity of their own (`Task 0's` entity/repository population table) and
 * so go through Kysely unconditionally, both reads and writes.
 */
export class CollectionPlacesRepository extends TrekRepository<CollectionPlaces> {
  private db_() {
    return this.kysely<CollectionPlacesKyselyDB>();
  }

  // ---------------------------------------------------------------------
  // CL37/CL38 — attachTags (private helper, savePlace/updatePlace)
  // ---------------------------------------------------------------------

  /**
   * CL38 (`attachTags`, PREPARED/looped in the legacy code) — `INSERT OR
   * IGNORE INTO collection_place_tags (collection_place_id, tag_id) VALUES
   * (?, ?)`, one call per eligible tag id. Batched into ONE Kysely insert
   * with `onConflict(...).doNothing()` on the pivot's real composite
   * `PRIMARY KEY (collection_place_id, tag_id)` — the exact shape
   * `TagsRepository.insertIgnore` already established for `place_tags`
   * (the sibling pivot in the 3c-owned `places` cluster). Empty `tagIds`
   * short-circuits before any query.
   */
  async attachTags(collectionPlaceId: number, tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) return;
    await this.db_()
      .insertInto('collection_place_tags')
      .values(tagIds.map((tag_id) => ({ collection_place_id: collectionPlaceId, tag_id })))
      .onConflict((oc) => oc.columns(['collection_place_id', 'tag_id']).doNothing())
      .execute();
  }

  // ---------------------------------------------------------------------
  // CL42/CL46 — savePlace / saveFromTripPlaces inserts
  // ---------------------------------------------------------------------

  /**
   * CL42 (`savePlace`, TX) AND CL46 (`saveFromTripPlaces`, PREPARED/looped,
   * TX) — collapsed onto ONE method, not two: both legacy statements share
   * the IDENTICAL 22-column `INSERT INTO collection_places (collection_id,
   * owner_id, saved_by, name, description, lat, lng, address, category_id,
   * price, currency, notes, image_url, google_place_id, google_ftid,
   * osm_id, website, phone, status, source_trip_id, source_place_id,
   * links)` list in the SAME order — CL46's only difference is that
   * `status`/`links` are bound SQL literals (`'idea'`/`NULL`) instead of
   * placeholders, which is a caller-side VALUE difference, not a distinct
   * statement shape (unlike CL23's file-import insert, which genuinely
   * carries a different column set — `sort_order`, no `source_trip_id`/
   * `source_place_id` — and stays its own method on `CollectionsRepository`,
   * per the plan's own "do not collapse" instruction for that pair).
   * `saveFromTripPlaces`'s own call site passes `status: 'idea', links:
   * null` explicitly, reproducing the literal exactly. `em.insert()`
   * returns the generated id; `sort_order` is never in the column list
   * either statement writes, so the table's own `DEFAULT 0` fills it,
   * matching both legacy statements.
   */
  async insertSavedPlace(row: {
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
    source_trip_id: number | null;
    source_place_id: number | null;
    links: string | null;
  }): Promise<number> {
    return await this.insert({
      collection: row.collection_id,
      owner: row.owner_id,
      savedByRef: row.saved_by,
      name: row.name,
      description: row.description,
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      category: row.category_id,
      price: row.price,
      currency: row.currency,
      notes: row.notes,
      image_url: row.image_url,
      google_place_id: row.google_place_id,
      google_ftid: row.google_ftid,
      osm_id: row.osm_id,
      website: row.website,
      phone: row.phone,
      status: row.status,
      source_trip_id: row.source_trip_id,
      source_place_id: row.source_place_id,
      links: row.links,
    });
  }

  // ---------------------------------------------------------------------
  // CL47/CL48 — updatePlace
  // ---------------------------------------------------------------------

  /** CL47 (`updatePlace`'s pre-image read, dup text also `deletePlace`/`deletePlacesMany`/`setPlaceImage`) — `SELECT image_url FROM collection_places WHERE id=?`. Plain (non-FK) column — safe through the entity API, `fields: ['image_url']`. */
  async imageUrl(id: number): Promise<string | null | undefined> {
    const row = await this.findOne({ id }, { fields: ['image_url'] });
    return row?.image_url;
  }

  /**
   * CL48 (`updatePlace`, TX) — the allow-listed dynamic `UPDATE
   * collection_places SET ... WHERE id=?`, including the cross-list move
   * branch (`collection_id`/`owner_id`). `write` carries exactly the
   * columns the caller built (the service resolves `body.field !==
   * undefined` itself, `CollectionsRepository.updateFields`'s same shape)
   * — an empty `write` short-circuits, matching the legacy `if
   * (updates.length > 0)` guard. FK columns are translated to their
   * entity relation property names for the write
   * (`collection_id`→`collection`, `owner_id`→`owner`, `category_id`→
   * `category`) — `PlaceRatingsRepository.upsertRating`'s precedent for
   * writing a `persist(false)` mirror through its owning relation.
   */
  async updateFields(
    id: number,
    write: Partial<{
      name: string;
      description: string | null;
      notes: string | null;
      lat: number | null;
      lng: number | null;
      address: string | null;
      status: string;
      category_id: number | null;
      image_url: string | null;
      links: string | null;
      collection_id: number;
      owner_id: number;
    }>,
  ): Promise<void> {
    if (Object.keys(write).length === 0) return;
    const platform = this.getEntityManager().getPlatform();
    const { category_id, collection_id, owner_id, ...rest } = write;
    await this.nativeUpdate(
      { id },
      {
        ...rest,
        ...(category_id !== undefined ? { category: category_id } : {}),
        ...(collection_id !== undefined ? { collection: collection_id } : {}),
        ...(owner_id !== undefined ? { owner: owner_id } : {}),
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /** CL49 (`updatePlace`, TX) — `DELETE FROM collection_place_tags WHERE collection_place_id=?`. Pivot table, Kysely. */
  async deleteTags(collectionPlaceId: number): Promise<void> {
    await this.db_().deleteFrom('collection_place_tags').where('collection_place_id', '=', collectionPlaceId).execute();
  }

  /** CL50 (`updatePlace`'s move branch, TX, dup text also `setPlaceLabels`) — `DELETE FROM collection_place_labels WHERE collection_place_id=?`. Pivot table, Kysely. */
  async deleteLabelAssignments(collectionPlaceId: number): Promise<void> {
    await this.db_()
      .deleteFrom('collection_place_labels')
      .where('collection_place_id', '=', collectionPlaceId)
      .execute();
  }

  // ---------------------------------------------------------------------
  // CL51/CL52/CL53 — setStatus / setRating
  // ---------------------------------------------------------------------

  /** CL51 (`setStatus`) — `UPDATE collection_places SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async setStatus(id: number, status: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { status, updated_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // CL54 — deletePlace / deletePlacesMany
  // ---------------------------------------------------------------------

  /** CL54 (`deletePlace`, dup text also `deletePlacesMany`'s TX loop) — `DELETE FROM collection_places WHERE id=?` (CASCADE drops tags/labels/ratings). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  // ---------------------------------------------------------------------
  // CL56 — setStatusMany
  // ---------------------------------------------------------------------

  /**
   * CL56 (`setStatusMany`, TX) — `UPDATE collection_places SET status=?,
   * updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IS NOT ?`, distinct
   * from CL51 by the extra `status IS NOT ?` guard. Returns the affected
   * row count (0 or 1) — the caller sums it across the batch, matching the
   * legacy `res.changes` accumulation.
   */
  async setStatusIfChanged(id: number, status: string): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return await this.nativeUpdate({ id, status: { $ne: status } }, { status, updated_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // CL58 — matchingCollectionPlaces (setStatusFromTrip's own private helper)
  // ---------------------------------------------------------------------

  /**
   * CL58 (`matchingCollectionPlaces`) — `SELECT cp.id FROM collection_places
   * cp WHERE cp.collection_id IN (...) AND (${dynamic OR conditions})`.
   * RULE 23: the dynamic OR is a typed array of Kysely expressions built
   * conditionally (never a string-concatenated WHERE) — the base
   * `source_trip_id`/`source_place_id` pair is always present (an AND'd
   * sub-clause inside the outer OR, matching the legacy's own parenthesised
   * first condition), and each provider-id/coordinate-tolerance clause is
   * pushed onto the array only when the corresponding input field is
   * present, exactly reproducing the legacy `conditions.push(...)` guards.
   * `tolerance` is caller-supplied (`CollectionsRepository
   * .findDuplicateByCoords`'s own precedent), not imported from
   * `nest/places/places.helpers` here — a `db/` repository does not reach
   * into `nest/`.
   */
  async matchingByTripSource(
    collectionIds: number[],
    tripId: number,
    place: {
      id: number;
      lat: number | null;
      lng: number | null;
      google_place_id: string | null;
      google_ftid: string | null;
      osm_id: string | null;
    },
    tolerance: number,
  ): Promise<{ id: number }[]> {
    if (collectionIds.length === 0) return [];
    return await this.db_()
      .selectFrom('collection_places as cp')
      .select('cp.id')
      .where('cp.collection_id', 'in', collectionIds)
      .where((eb) => {
        const clauses = [eb.and([eb('cp.source_trip_id', '=', tripId), eb('cp.source_place_id', '=', place.id)])];
        if (place.google_place_id) clauses.push(eb('cp.google_place_id', '=', place.google_place_id));
        if (place.google_ftid) clauses.push(eb('cp.google_ftid', '=', place.google_ftid));
        if (place.osm_id) clauses.push(eb('cp.osm_id', '=', place.osm_id));
        if (place.lat != null && place.lng != null) {
          clauses.push(
            eb.and([
              eb('cp.lat', 'is not', null),
              eb('cp.lng', 'is not', null),
              eb(eb.fn('abs', [eb('cp.lat', '-', place.lat)]), '<=', tolerance),
              eb(eb.fn('abs', [eb('cp.lng', '-', place.lng)]), '<=', tolerance),
            ]),
          );
        }
        return eb.or(clauses);
      })
      .execute();
  }

  // ---------------------------------------------------------------------
  // CL59 — setPlaceImage
  // ---------------------------------------------------------------------

  /** CL59 (`setPlaceImage`) — `UPDATE collection_places SET image_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async setImageUrl(id: number, imageUrl: string | null): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { image_url: imageUrl, updated_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // CL62 — copyToTrip's per-source-id read
  // ---------------------------------------------------------------------

  /**
   * CL62 (`copyToTrip`, per source id) — `SELECT id, collection_id, name,
   * description, lat, lng, address, category_id, price, currency, notes,
   * image_url, google_place_id, google_ftid, osm_id, website, phone FROM
   * collection_places WHERE id=?`. `collection_id`/`category_id` in the
   * projection — Kysely, the class docstring's read-side rule.
   */
  async findForCopy(id: number): Promise<CollectionPlaceCopyRow | undefined> {
    return await this.db_()
      .selectFrom('collection_places')
      .select([
        'id',
        'collection_id',
        'name',
        'description',
        'lat',
        'lng',
        'address',
        'category_id',
        'price',
        'currency',
        'notes',
        'image_url',
        'google_place_id',
        'google_ftid',
        'osm_id',
        'website',
        'phone',
      ])
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // ---------------------------------------------------------------------
  // CL67 — copyToTrip's per-source tag read (loop, TX)
  // ---------------------------------------------------------------------

  /** CL67 (`copyToTrip`, loop, TX) — `SELECT tag_id FROM collection_place_tags WHERE collection_place_id=?`. Pivot table, Kysely. */
  async tagIdsFor(collectionPlaceId: number): Promise<number[]> {
    const rows = await this.db_()
      .selectFrom('collection_place_tags')
      .select('tag_id')
      .where('collection_place_id', '=', collectionPlaceId)
      .execute();
    return rows.map((r) => r.tag_id);
  }

  // ---------------------------------------------------------------------
  // CL69 — findMembership (library-wide membership lookup)
  // ---------------------------------------------------------------------

  /**
   * CL69 (`findMembership`) — `SELECT cp.id AS place_id, cp.collection_id,
   * c.name, cp.status FROM collection_places cp JOIN collections c ON
   * c.id=cp.collection_id WHERE cp.collection_id IN (...) AND (${dynamic
   * conditions})`. RULE 23, same shape as {@link matchingByTripSource}
   * above, but genuinely a DIFFERENT statement (no `source_trip_id`/
   * `source_place_id` base clause, no `osm_id` condition — the legacy
   * `findMembership` never checks it — and an extra `collections` join for
   * the list name), so this is its own method rather than a parameterised
   * reuse of `matchingByTripSource` (one repository method per legacy
   * statement). Returns `[]` when `query` carries no usable condition,
   * matching the service's own `if (conditions.length === 0) return
   * { saved: false, lists: [] };` guard — defensive here too, though the
   * caller already checks first.
   */
  async searchMembership(
    collectionIds: number[],
    query: { google_place_id?: string; google_ftid?: string; lat?: number; lng?: number },
    tolerance: number,
  ): Promise<{ place_id: number; collection_id: number; name: string; status: string }[]> {
    if (collectionIds.length === 0) return [];
    const hasCoords = query.lat != null && query.lng != null;
    if (!query.google_place_id && !query.google_ftid && !hasCoords) return [];
    return await this.kysely<CollectionPlacesMembershipKyselyDB>()
      .selectFrom('collection_places as cp')
      .innerJoin('collections as c', 'c.id', 'cp.collection_id')
      .select(['cp.id as place_id', 'cp.collection_id', 'c.name', 'cp.status'])
      .where('cp.collection_id', 'in', collectionIds)
      .where((eb) => {
        const clauses = [];
        if (query.google_place_id) clauses.push(eb('cp.google_place_id', '=', query.google_place_id));
        if (query.google_ftid) clauses.push(eb('cp.google_ftid', '=', query.google_ftid));
        if (hasCoords) {
          clauses.push(
            eb.and([
              eb('cp.lat', 'is not', null),
              eb('cp.lng', 'is not', null),
              eb(eb.fn('abs', [eb('cp.lat', '-', query.lat as number)]), '<=', tolerance),
              eb(eb.fn('abs', [eb('cp.lng', '-', query.lng as number)]), '<=', tolerance),
            ]),
          );
        }
        return eb.or(clauses);
      })
      .execute();
  }

  // ---------------------------------------------------------------------
  // CL78 — assignLabels' remove branch (TX)
  // ---------------------------------------------------------------------

  /**
   * CL78 (`assignLabels`'s remove branch, PREPARED/looped, TX) — `DELETE
   * FROM collection_place_labels WHERE collection_place_id=? AND
   * label_id=?`, per pair in the service's own nested loop (mirrors
   * `CollectionsRepository.assignPlaceLabel`'s CL24 per-pair shape, the
   * insert branch's own repository call). Pivot table, Kysely. Returns the
   * deleted row count (0 or 1) for the caller's `changed +=` accumulation.
   */
  async unassignLabel(collectionPlaceId: number, labelId: number): Promise<number> {
    const result = await this.db_()
      .deleteFrom('collection_place_labels')
      .where('collection_place_id', '=', collectionPlaceId)
      .where('label_id', '=', labelId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * `assignLabels`'s own insert branch (its own text is `CL24`'s dup, `:1488`
   * per Task 1's report) — same `INSERT OR IGNORE INTO collection_place_labels
   * (collection_place_id, label_id) VALUES (?, ?)` shape as
   * `CollectionsRepository.assignPlaceLabel`, but with a COUNT-returning
   * contract that method doesn't have (it returns `void` — `setPlaceLabels`'s
   * own call site, the sole other CL24 consumer, never needed one). `assignLabels`
   * sums the affected-row count across every pair (matching the legacy's own
   * `res.changes` accumulation — an already-assigned label contributes 0, a
   * newly-assigned one contributes 1), which `void` cannot answer. A second
   * method rather than widening Task 1's committed signature, per the
   * brief's "Task 1's methods untouched" instruction.
   */
  async assignLabel(collectionPlaceId: number, labelId: number): Promise<number> {
    const result = await this.db_()
      .insertInto('collection_place_labels')
      .values({ collection_place_id: collectionPlaceId, label_id: labelId })
      .onConflict((oc) => oc.columns(['collection_place_id', 'label_id']).doNothing())
      .executeTakeFirst();
    return Number(result.numInsertedOrUpdatedRows ?? 0);
  }

  // ---------------------------------------------------------------------
  // Plan 3h Task 6 (survivors — `places.service.ts` SV-PI2, `place-photo-
  // cache.service.ts` SV-PP6, `place-image.ts` SV-PLACEIMG-2) — additive.
  // ---------------------------------------------------------------------

  /**
   * SV-PI2 (`places.service.ts::reclaimPlaceImage`) / SV-PLACEIMG-2
   * (`CollectionsService`'s own private `reclaimPlaceImage`, replacing
   * `place-image.ts`'s free function) — `SELECT 1 FROM collection_places
   * WHERE image_url = ? LIMIT 1`. Trip-agnostic, same shape as
   * `PlacesRepository.existsByImageUrl` for its own table.
   */
  async existsByImageUrl(imageUrl: string): Promise<boolean> {
    const row = await this.db_()
      .selectFrom('collection_places')
      .select('id')
      .where('image_url', '=', imageUrl)
      .limit(1)
      .executeTakeFirst();
    return !!row;
  }

  /**
   * SV-PP6 (`place-photo-cache.service.ts::isReferenced`) — `SELECT 1 FROM
   * collection_places WHERE google_place_id = ? OR image_url = ? LIMIT 1`,
   * the same shape `PlacesRepository.existsByGoogleIdOrImageUrl` uses for
   * its own table.
   */
  async existsByGoogleIdOrImageUrl(googlePlaceId: string, imageUrl: string): Promise<boolean> {
    const row = await this.db_()
      .selectFrom('collection_places')
      .select('id')
      .where((eb) => eb.or([eb('google_place_id', '=', googlePlaceId), eb('image_url', '=', imageUrl)]))
      .limit(1)
      .executeTakeFirst();
    return !!row;
  }
}

/** {@link CollectionPlacesRepository.findForCopy}'s narrow projection (CL62). */
export interface CollectionPlaceCopyRow {
  id: number;
  collection_id: number;
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
}

interface CollectionPlacesKyselyDB {
  collection_places: Omit<CollectionPlaceRow, 'category_name' | 'category_color' | 'category_icon'>;
  collection_place_tags: { collection_place_id: number; tag_id: number };
  collection_place_labels: { collection_place_id: number; label_id: number };
}

interface CollectionPlacesMembershipKyselyDB {
  collection_places: Pick<
    CollectionPlaceRow,
    'id' | 'collection_id' | 'google_place_id' | 'google_ftid' | 'lat' | 'lng' | 'status'
  >;
  collections: { id: number; name: string };
}
