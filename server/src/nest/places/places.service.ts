import { Injectable } from '@nestjs/common';
import { XMLValidator } from 'fast-xml-parser';
import { TRACK_COLORS } from '@trek/shared';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import type { PlaceWithTags } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { MapsService } from '../maps/maps.service';
import type { Place, User } from '../../types';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { ratingAggregate } from '../common/rowShape';
import { checkSsrf, safeFetchFollow, SsrfBlockedError } from '../../utils/ssrfGuard';
import {
  buildCategoryNameLookup,
  createKmlImportSummary,
  decodeUtf8WithWarning,
  extractKmlPlacemarkNodes,
  parsePlacemarkNode,
  resolveCategoryIdForFolder,
} from './kml-import.helpers';
import { buildGpx, gpxFilename } from './gpx-export.helpers';
import type { GpxExportDay, GpxExportOptions, GpxExportPlace } from './gpx-export.helpers';
import { UnsplashService } from '../unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { type UpdateConflict, isUpdateConflict } from '../common/conflictResult';
import { reclaimPlaceImage } from './place-image';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { StorageService } from '../storage/storage.service';
import {
  COORD_DEDUP_TOLERANCE,
  ENRICH_CONCURRENCY,
  ADDRESS_BACKFILL_MAX_PLACES,
  escapeLikePattern,
  MAX_LIST_RESPONSE_BYTES,
  googleMapsFeatureIdFromItem,
  gpxParser,
  externalIdsOf,
  isPlaceDuplicate,
  kmlParser,
  mapWithConcurrency,
  pickEnrichmentMatch,
  reclaimPhotoCache,
  SEARCH_BIAS_RADIUS_METERS,
  trackInsertedInDedupSet,
  trimOrNull,
  unpackKmzToKml,
  type DedupSet,
  type EnrichablePlace,
  type GpxImportOptions,
  type GpxImportResult,
  type KmlImportOptions,
  type ListImportError,
  type ListImportOptions,
  type ListImportResult,
  type PlaceImportResult,
  type PlaceWithCategory,
} from './places.helpers';

type Trip = TripAccess;

type ImportedPlace = { id: number; route_geometry?: string | null; route_color?: string | null };

/** Fields accepted when creating a place. */
export interface PlaceCreateInput {
  name: string; description?: string; lat?: number; lng?: number; address?: string;
  category_id?: number; price?: number; currency?: string;
  place_time?: string; end_time?: string;
  duration_minutes?: number; notes?: string; image_url?: string;
  google_place_id?: string; google_ftid?: string; osm_id?: string; website?: string; phone?: string;
  transport_mode?: string; route_geometry?: string; route_color?: string; tags?: number[];
}

/** Fields accepted when patching a place. */
export interface PlaceUpdateInput {
  name?: string; description?: string; lat?: number; lng?: number; address?: string;
  category_id?: number; price?: number; currency?: string;
  place_time?: string; end_time?: string;
  duration_minutes?: number; notes?: string; image_url?: string;
  google_place_id?: string; google_ftid?: string; osm_id?: string; website?: string; phone?: string;
  transport_mode?: string; route_color?: string | null; tags?: number[];
}

/**
 * Places domain service — owns the place SQL, the GPX/KML/KMZ importers, the
 * Google/Naver list importers, the list-import enrichment, the Unsplash image
 * search and the collaborative ratings, all moved 1:1 from the legacy
 * services/placeService.ts (+ services/placeEnrichment.ts) when the domain went
 * DI-native. The COALESCE update semantics — including the deliberately
 * non-COALESCE route_color (#776) — the post-write getPlaceWithTags re-selects
 * and the If-Match conflict protocol (#1135) are preserved verbatim.
 *
 * The one deliberate departure from the legacy behaviour is the falsy-coercion
 * defaults: lat/lng/price/duration_minutes use `?? fallback`, not `|| fallback`,
 * because 0 is a legitimate value for all four and `||` silently threw it away
 * (a place on the equator lost its coordinates). Every other `x || null` is
 * string-valued, where empty-string-means-absent is the intended reading.
 *
 * Trip access rides DatabaseService.canAccessTrip;
 * mutations use 'place_edit'. Pure helpers and the frozen XML parsers live in
 * places.helpers.ts. Nothing outside the Nest container consumes this domain
 * any more, so there is no places.bridge.ts: the MCP surface is the
 * DI-discovered places.mcp.ts, and TripsService / DaysMcp /
 * BookingImportService / PlacesRpc all inject this class.
 */
@Injectable()
export class PlacesService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly maps: MapsService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly unsplash: UnsplashService,
    private readonly photoCache: PlacePhotoCacheService,
    private readonly journey: JourneyDomainService,
    private readonly storage: StorageService,
  ) {}

  verifyTripAccess(tripId: string, userId: number) {
    return this.dbs.canAccessTrip(Number(tripId), userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('place_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /**
   * The subset of `tagIds` that someone on this trip owns. A tag has no trip of
   * its own, only a `user_id`, so "belongs to this trip" resolves through the
   * roster — which keeps the shared case working: a member tags a place, another
   * member re-saves it and sends the id back, and the tag survives because its
   * owner is still on the trip. Scoping to the caller instead would quietly strip
   * a co-traveller's tag on every foreign edit.
   *
   * Off-roster ids drop silently. The place body is an open record, so an id can
   * arrive from an older client that had no business knowing it existed, and the
   * read-back join hands `tags.user_id` straight to the caller.
   */
  private tagsOnTrip(tripId: string | number, tagIds: number[]): number[] {
    const unique = [...new Set(tagIds)];
    if (unique.length === 0) return [];
    const roster = this.dbs.rosterUserIds(tripId);
    const owned = this.dbs.all<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM tags WHERE id IN (${unique.map(() => '?').join(',')})`,
      ...unique,
    );
    return owned.filter(t => roster.has(t.user_id)).map(t => t.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // -------------------------------------------------------------------------
  // List places
  // -------------------------------------------------------------------------

  list(
    tripId: string,
    filters: { search?: string; category?: string; tag?: string; assignment?: 'all' | 'unassigned' | 'assigned' },
  ) {
    let query = `
    SELECT DISTINCT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM places p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.trip_id = ?
  `;
    const params: (string | number)[] = [tripId];

    if (filters.search) {
      // ESCAPE so a `%` or `_` the user typed matches literally instead of
      // acting as a LIKE wildcard (a bare '%' used to return the whole trip).
      query += " AND (p.name LIKE ? ESCAPE '\\' OR p.address LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')";
      const searchParam = `%${escapeLikePattern(filters.search)}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (filters.category) {
      query += ' AND p.category_id = ?';
      params.push(filters.category);
    }

    if (filters.tag) {
      query += ' AND p.id IN (SELECT place_id FROM place_tags WHERE tag_id = ?)';
      params.push(filters.tag);
    }

    if (filters.assignment === 'unassigned') {
      query += ` AND p.id NOT IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)`;
      params.push(tripId);
    } else if (filters.assignment === 'assigned') {
      query += ` AND p.id IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)`;
      params.push(tripId);
    }

    query += ' ORDER BY p.created_at DESC';

    const places = this.dbs.prepare(query).all(...params) as PlaceWithCategory[];

    const placeIds = places.map(p => p.id);
    const tagsByPlaceId = this.queryHelpers.loadTagsByPlaceIds(placeIds);
    const ratingsByPlaceId = this.queryHelpers.loadRatingsByPlaceIds(placeIds);

    return places.map(p => ({
      ...p,
      category: p.category_id ? {
        id: p.category_id,
        name: p.category_name,
        color: p.category_color,
        icon: p.category_icon,
      } : null,
      tags: tagsByPlaceId[p.id] || [],
      ratings: ratingsByPlaceId[p.id] || [],
      ...ratingAggregate(ratingsByPlaceId[p.id]),
    }));
  }

  // -------------------------------------------------------------------------
  // Create place
  // -------------------------------------------------------------------------

  create(tripId: string, body: PlaceCreateInput) {
    const {
      name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone,
      transport_mode, route_geometry, route_color, tags = [],
    } = body;

    const result = this.dbs.run(`
    INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone, transport_mode,
      route_geometry, route_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      // lat/lng/price/duration_minutes use an explicit undefined check, not `||`:
      // 0 is a legitimate value for all four (Null Island, a free entry, a
      // drive-by stop) and the falsy coercion silently threw it away.
      tripId, name, description || null, lat ?? null, lng ?? null, address || null,
      category_id || null, price ?? null, currency || null,
      place_time || null, end_time || null, duration_minutes ?? 60, notes || null, image_url || null,
      google_place_id || null, google_ftid || null, osm_id || null, website || null, phone || null, transport_mode || 'walking',
      route_geometry || null, route_color || null,
    );

    const placeId = result.lastInsertRowid;

    if (tags && tags.length > 0) {
      const insertTag = this.dbs.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
      for (const tagId of this.tagsOnTrip(tripId, tags)) {
        insertTag.run(placeId, tagId);
      }
    }

    return this.dbs.getPlaceWithTags(Number(placeId))!;
  }

  // -------------------------------------------------------------------------
  // Get single place
  // -------------------------------------------------------------------------

  get(tripId: string, placeId: string) {
    const placeCheck = this.dbs.get('SELECT id FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!placeCheck) return null;
    return this.dbs.getPlaceWithTags(placeId);
  }

  // -------------------------------------------------------------------------
  // Update place
  // -------------------------------------------------------------------------

  async update(
    tripId: string,
    placeId: string,
    body: PlaceUpdateInput,
    ifMatch?: string,
  ): Promise<PlaceWithTags | UpdateConflict | null> {
    const { result, reclaim } = this.applyUpdate(tripId, placeId, body, ifMatch);
    if (reclaim !== undefined) await reclaimPlaceImage(this.storage, reclaim);
    return result;
  }

  /**
   * The synchronous DB half of update(). Split out so updateMany() can run it
   * inside a better-sqlite3 transaction (which cannot await) and settle the
   * storage reclaims after the transaction commits.
   */
  private applyUpdate(
    tripId: string,
    placeId: string,
    body: PlaceUpdateInput,
    ifMatch?: string,
  ): { result: PlaceWithTags | UpdateConflict | null; reclaim?: string | null } {
    const existingPlace = this.dbs.get<Place>('SELECT * FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!existingPlace) return { result: null };

    // Optimistic concurrency (#1135): when the caller sent the version it based its
    // edit on and the row has moved on since, reject instead of clobbering. Absent
    // token => unconditional update (back-compat — old clients keep last-write-wins).
    if (ifMatch !== undefined && existingPlace.updated_at != null && String(existingPlace.updated_at) !== ifMatch) {
      return { result: { conflict: true, server: this.dbs.getPlaceWithTags(placeId) } };
    }

    const {
      name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone,
      transport_mode, route_color, tags,
    } = body;

    this.dbs.run(`
    UPDATE places SET
      name = COALESCE(?, name),
      description = ?,
      lat = ?,
      lng = ?,
      address = ?,
      category_id = ?,
      price = ?,
      currency = COALESCE(?, currency),
      place_time = ?,
      end_time = ?,
      duration_minutes = COALESCE(?, duration_minutes),
      notes = ?,
      image_url = ?,
      google_place_id = ?,
      google_ftid = ?,
      osm_id = ?,
      website = ?,
      phone = ?,
      transport_mode = COALESCE(?, transport_mode),
      route_color = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
      name || null,
      description !== undefined ? description : existingPlace.description,
      lat !== undefined ? lat : existingPlace.lat,
      lng !== undefined ? lng : existingPlace.lng,
      address !== undefined ? address : existingPlace.address,
      category_id !== undefined ? category_id : existingPlace.category_id,
      price !== undefined ? price : existingPlace.price,
      currency || null,
      place_time !== undefined ? place_time : existingPlace.place_time,
      end_time !== undefined ? end_time : existingPlace.end_time,
      // `?? null` rather than `|| null`: with COALESCE(?, duration_minutes) a
      // falsy-coerced 0 read as "absent" and silently kept the old duration.
      duration_minutes ?? null,
      notes !== undefined ? notes : existingPlace.notes,
      image_url !== undefined ? image_url : existingPlace.image_url,
      google_place_id !== undefined ? google_place_id : existingPlace.google_place_id,
      google_ftid !== undefined ? google_ftid : existingPlace.google_ftid,
      osm_id !== undefined ? osm_id : existingPlace.osm_id,
      website !== undefined ? website : existingPlace.website,
      phone !== undefined ? phone : existingPlace.phone,
      transport_mode || null,
      // Deliberately not COALESCE: an explicit null is how the picker resets a
      // track back to its category colour (#776).
      route_color !== undefined ? route_color : existingPlace.route_color,
      placeId,
    );

    if (tags !== undefined) {
      this.dbs.run('DELETE FROM place_tags WHERE place_id = ?', placeId);
      if (tags.length > 0) {
        const insertTag = this.dbs.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
        for (const tagId of this.tagsOnTrip(tripId, tags)) {
          insertTag.run(placeId, tagId);
        }
      }
    }

    // A custom uploaded thumbnail (#1136) that was just replaced or cleared leaves
    // an orphan file behind — reclaim it (in the caller, once any enclosing
    // transaction committed) if nothing references it any more.
    const reclaim = image_url !== undefined && image_url !== existingPlace.image_url
      ? existingPlace.image_url
      : undefined;

    return { result: this.dbs.getPlaceWithTags(placeId), reclaim };
  }

  // -------------------------------------------------------------------------
  // Delete place
  // -------------------------------------------------------------------------

  /**
   * The expenses hanging off these places (#1298), so a caller can broadcast the
   * budget:deleted events for the rows remove()/removeMany() are about to take
   * with them. Read it BEFORE deleting — afterwards the link is gone.
   */
  linkedExpenseIds(tripId: string | number, placeIds: Array<string | number>): number[] {
    if (placeIds.length === 0) return [];
    const rows = this.dbs.all<{ id: number }>(
      `SELECT id FROM budget_items WHERE trip_id = ? AND place_id IN (${placeIds.map(() => '?').join(',')})`,
      tripId, ...placeIds,
    );
    return rows.map(r => r.id);
  }

  async remove(tripId: string, placeId: string): Promise<boolean> {
    const place = this.dbs.get<{ google_place_id: string | null; image_url: string | null }>(
      'SELECT google_place_id, image_url FROM places WHERE id = ? AND trip_id = ?', placeId, tripId,
    );
    if (!place) return false;
    // The linked expense goes with the place, the same way a booking takes its
    // expense with it (#1298). One transaction, so a place can never survive
    // half-detached from its money.
    this.dbs.transaction(() => {
      this.dbs.run('DELETE FROM budget_items WHERE trip_id = ? AND place_id = ?', tripId, placeId);
      this.dbs.run('DELETE FROM places WHERE id = ?', placeId);
    });
    await reclaimPhotoCache(this.photoCache, place.google_place_id, place.image_url);
    await reclaimPlaceImage(this.storage, place.image_url);
    return true;
  }

  async removeMany(tripId: string, ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const selectStmt = this.dbs.prepare('SELECT google_place_id, image_url FROM places WHERE id = ? AND trip_id = ?');
    const deleteStmt = this.dbs.prepare('DELETE FROM places WHERE id = ?');
    const deleteExpenseStmt = this.dbs.prepare('DELETE FROM budget_items WHERE trip_id = ? AND place_id = ?');
    const deleted: number[] = [];
    const reclaimable: { google_place_id: string | null; image_url: string | null }[] = [];
    this.dbs.transaction(() => {
      for (const id of ids) {
        const row = selectStmt.get(id, tripId) as { google_place_id: string | null; image_url: string | null } | undefined;
        if (!row) continue;
        deleteExpenseStmt.run(tripId, id);
        deleteStmt.run(id);
        deleted.push(id);
        reclaimable.push(row);
      }
    });
    // Reclaim after the transaction commits so isReferenced() sees the final place set.
    for (const row of reclaimable) {
      await reclaimPhotoCache(this.photoCache, row.google_place_id, row.image_url);
      await reclaimPlaceImage(this.storage, row.image_url);
    }
    return deleted;
  }

  /**
   * Narrow a caller-supplied id list to the ones that really belong to the trip,
   * in input order. Callers need this before firing journeyService's place hooks:
   * those key on the place id alone, so an id from another trip would detach
   * that trip's journey entries even though the delete itself refuses it.
   */
  scopedIds(tripId: string, ids: number[]): number[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.dbs.all<{ id: number }>(
      `SELECT id FROM places WHERE trip_id = ? AND id IN (${placeholders})`, tripId, ...ids,
    );
    const owned = new Set(rows.map((r) => r.id));
    return ids.filter((id) => owned.has(id));
  }

  // -------------------------------------------------------------------------
  // Bulk update
  // -------------------------------------------------------------------------

  /**
   * Apply the same set of fields to many places in a single transaction. Each
   * place is scoped to the trip and patched via update(), so only the provided
   * fields change and everything else is preserved. IDs that don't belong to the
   * trip are skipped. Returns the updated places.
   */
  async updateMany(tripId: string, ids: number[], body: PlaceUpdateInput): Promise<PlaceWithTags[]> {
    if (ids.length === 0) return [];
    const updated: PlaceWithTags[] = [];
    const reclaims: (string | null)[] = [];
    this.dbs.transaction(() => {
      for (const id of ids) {
        // Bulk update sends no If-Match, so applyUpdate() never returns a
        // conflict here; the guard keeps the types honest.
        const { result: place, reclaim } = this.applyUpdate(tripId, String(id), body);
        if (place && !isUpdateConflict(place)) updated.push(place);
        if (reclaim !== undefined) reclaims.push(reclaim);
      }
    });
    // Settle reclaims after the transaction commits, so the refcount sees the
    // final image_url state.
    for (const reclaim of reclaims) await reclaimPlaceImage(this.storage, reclaim);
    return updated;
  }

  // -------------------------------------------------------------------------
  // Import deduplication
  // -------------------------------------------------------------------------

  /** Build a lookup of names/coords for places already in a trip. */
  private buildDedupSet(tripId: string): DedupSet {
    const rows = this.dbs.all<{
      name: string | null; lat: number | null; lng: number | null;
      google_place_id: string | null; google_ftid: string | null; osm_id: string | null;
    }>(
      'SELECT name, lat, lng, google_place_id, google_ftid, osm_id FROM places WHERE trip_id = ?', tripId,
    );
    const names = new Set<string>();
    const coords: Array<{ lat: number; lng: number }> = [];
    // Provider ids are collected for every place, named or not: they are what lets a
    // renamed place still be recognised on a re-import (#1550).
    const externalIds = new Set<string>();
    for (const row of rows) {
      for (const id of externalIdsOf(row)) externalIds.add(id);
      if (row.name) {
        names.add(row.name.trim().toLowerCase());
      } else if (row.lat != null && row.lng != null) {
        coords.push({ lat: row.lat, lng: row.lng });
      }
    }
    return { names, coords, externalIds };
  }

  private findDuplicatePlace(
    tripId: string,
    place: {
      name: string | null | undefined; lat: number | null; lng: number | null;
      google_place_id?: string | null; google_ftid?: string | null; osm_id?: string | null;
    },
  ): { id: number; google_ftid: string | null } | null {
    // Same order as isPlaceDuplicate: the provider id wins, because it is what
    // survives a rename (#1550).
    for (const id of externalIdsOf(place)) {
      const byId = this.dbs.get<{ id: number; google_ftid: string | null }>(`
      SELECT id, google_ftid FROM places
      WHERE trip_id = ? AND (google_place_id = ? OR google_ftid = ? OR osm_id = ?)
      ORDER BY id ASC
      LIMIT 1
    `, tripId, id, id, id);
      if (byId) return byId;
    }
    const normalizedName = place.name?.trim().toLowerCase();
    if (normalizedName) {
      const duplicate = this.dbs.get<{ id: number; google_ftid: string | null }>(`
      SELECT id, google_ftid FROM places
      WHERE trip_id = ? AND lower(trim(name)) = ?
      ORDER BY id ASC
      LIMIT 1
    `, tripId, normalizedName);
      if (duplicate) return duplicate;
    }
    if (place.lat != null && place.lng != null) {
      return this.dbs.get<{ id: number; google_ftid: string | null }>(`
      SELECT id, google_ftid FROM places
      WHERE trip_id = ?
        AND lat IS NOT NULL AND lng IS NOT NULL
        AND abs(lat - ?) <= ?
        AND abs(lng - ?) <= ?
      ORDER BY id ASC
      LIMIT 1
    `, tripId, place.lat, COORD_DEDUP_TOLERANCE, place.lng, COORD_DEDUP_TOLERANCE) || null;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Import GPX
  // -------------------------------------------------------------------------

  importGpx(tripId: string, fileBuffer: Buffer, opts: GpxImportOptions = {}): GpxImportResult | null {
    const result = this.importGpxRows(tripId, fileBuffer, opts);
    this.colorizeImportedTracks(tripId, result);
    return result;
  }

  /**
   * The trip as a GPX document, the mirror of importGpx. Places without geometry
   * become waypoints, places carrying route_geometry become tracks, and each planned
   * day becomes a route of its stops in order, which is the part that has no import
   * counterpart and the reason to bother: a planned day on a handheld.
   *
   * Returns null when the selection yields nothing, so the caller answers 404 rather
   * than handing over a file that imports as nothing on the other end.
   */
  exportGpx(tripId: string, opts: GpxExportOptions = {}): { gpx: string; filename: string } | null {
    const trip = this.dbs.get<{ title: string }>('SELECT title FROM trips WHERE id = ?', tripId);
    if (!trip) return null;

    const places = this.dbs.all<GpxExportPlace>(`
      SELECT p.name, p.description, p.address, p.lat, p.lng, p.route_geometry, c.name AS category
        FROM places p
        LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.trip_id = ?
       ORDER BY p.id
    `, tripId);

    // One row per stop, ordered the way the day plan draws it, then folded into days.
    const stops = this.dbs.all<{
      day_number: number; date: string | null; title: string | null;
      name: string; lat: number; lng: number;
    }>(`
      SELECT d.day_number, d.date, d.title, p.name, p.lat, p.lng
        FROM days d
        JOIN day_assignments da ON da.day_id = d.id
        JOIN places p ON p.id = da.place_id
       WHERE d.trip_id = ? AND p.lat IS NOT NULL AND p.lng IS NOT NULL
       ORDER BY d.day_number, da.order_index
    `, tripId);

    const days = new Map<number, GpxExportDay>();
    for (const stop of stops) {
      let day = days.get(stop.day_number);
      if (!day) {
        day = { dayNumber: stop.day_number, date: stop.date, title: stop.title, points: [] };
        days.set(stop.day_number, day);
      }
      day.points.push({ name: stop.name, lat: stop.lat, lng: stop.lng });
    }

    const gpx = buildGpx({ tripTitle: trip.title, places, days: [...days.values()] }, opts);
    return gpx ? { gpx, filename: gpxFilename(trip.title) } : null;
  }

  private importGpxRows(tripId: string, fileBuffer: Buffer, opts: GpxImportOptions = {}): GpxImportResult | null {
    const { importWaypoints = true, importRoutes = true, importTracks = true, defaultName } = opts;

    const parsed = gpxParser.parse(fileBuffer.toString('utf-8'));
    const gpx = parsed?.gpx;
    if (!gpx) return null;

    const str = (v: unknown) => (v != null ? String(v).trim() : null);
    const num = (v: unknown) => { const n = Number.parseFloat(String(v)); return Number.isNaN(n) ? null : n; };

    // Routes and tracks rarely carry their own <name>. Without one they all fall back to the
    // same generic label, so name-based dedup drops every import after the first. Derive a
    // base from the source filename (the requested behaviour) and suffix an index so multiple
    // geometries from one file stay distinct.
    const rawName = str(defaultName);
    const baseName = rawName ? rawName.replace(/\.[^.]+$/, '').trim() || rawName : null;
    let geoSeq = 0;
    const geoName = (explicit: string | null, fallback: string): string => {
      if (explicit) return explicit;
      geoSeq++;
      const base = baseName || fallback;
      return geoSeq === 1 ? base : `${base} ${geoSeq}`;
    };

    type WaypointEntry = { name: string; lat: number; lng: number; description: string | null; routeGeometry?: string };
    const waypoints: WaypointEntry[] = [];

    // 1) Parse <wpt> elements (named waypoints / POIs)
    if (importWaypoints) {
      for (const wpt of gpx.wpt ?? []) {
        const lat = num(wpt['@_lat']);
        const lng = num(wpt['@_lon']);
        if (lat === null || lng === null) continue;
        waypoints.push({ lat, lng, name: str(wpt.name) || `Waypoint ${waypoints.length + 1}`, description: str(wpt.desc) });
      }
    }

    // 2) Parse <rte> routes as polyline-places (one place per route with route_geometry)
    if (importRoutes) {
      for (const rte of gpx.rte ?? []) {
        const pts = (rte.rtept ?? [])
          .map((pt: Record<string, unknown>) => ({ lat: num(pt['@_lat']), lng: num(pt['@_lon']), ele: num(pt['ele']) }))
          .filter((p: { lat: number | null; lng: number | null; ele: number | null }) => p.lat !== null && p.lng !== null) as Array<{ lat: number; lng: number; ele: number | null }>;
        if (pts.length === 0) continue;
        const hasAllEle = pts.every(p => p.ele !== null);
        const routeGeometry = pts.map(p => hasAllEle ? [p.lat, p.lng, p.ele] : [p.lat, p.lng]);
        waypoints.push({ lat: pts[0].lat, lng: pts[0].lng, name: geoName(str(rte.name), 'GPX Route'), description: str(rte.desc), routeGeometry: JSON.stringify(routeGeometry) });
      }
    }

    // 3) Extract full track geometry from <trk>
    if (importTracks) {
      for (const trk of gpx.trk ?? []) {
        const trackPoints: { lat: number; lng: number; ele: number | null }[] = [];
        for (const seg of trk.trkseg ?? []) {
          for (const pt of seg.trkpt ?? []) {
            const lat = num(pt['@_lat']);
            const lng = num(pt['@_lon']);
            if (lat === null || lng === null) continue;
            trackPoints.push({ lat, lng, ele: num(pt.ele) });
          }
        }
        if (trackPoints.length === 0) continue;
        const start = trackPoints[0];
        const hasAllEle = trackPoints.every(p => p.ele !== null);
        const routeGeometry = trackPoints.map(p => hasAllEle ? [p.lat, p.lng, p.ele] : [p.lat, p.lng]);
        waypoints.push({ lat: start.lat, lng: start.lng, name: geoName(str(trk.name), 'GPX Track'), description: str(trk.desc), routeGeometry: JSON.stringify(routeGeometry) });
      }
    }

    if (waypoints.length === 0) return null;

    const dedup = this.buildDedupSet(tripId);
    const insertStmt = this.dbs.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, transport_mode, route_geometry)
    VALUES (?, ?, ?, ?, ?, 'walking', ?)
  `);
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    this.dbs.transaction(() => {
      for (const wp of waypoints) {
        if (isPlaceDuplicate({ name: wp.name, lat: wp.lat, lng: wp.lng }, dedup)) {
          skipped++;
          continue;
        }
        const result = insertStmt.run(tripId, wp.name, wp.description, wp.lat, wp.lng, wp.routeGeometry || null);
        const place = this.dbs.getPlaceWithTags(Number(result.lastInsertRowid))!;
        created.push(place);
        trackInsertedInDedupSet({ name: wp.name, lat: wp.lat, lng: wp.lng }, dedup);
      }
    });

    return { places: created, count: created.length, skipped };
  }

  // -------------------------------------------------------------------------
  // Import KML / KMZ
  // -------------------------------------------------------------------------

  async importMapFile(tripId: string, fileBuffer: Buffer, filename: string, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
    const result = await this.importMapFileRows(tripId, fileBuffer, filename, opts);
    this.colorizeImportedTracks(tripId, result);
    return result;
  }

  private async importMapFileRows(tripId: string, fileBuffer: Buffer, filename: string, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'kmz') return this.importKmzPlaces(tripId, fileBuffer, opts);
    if (ext === 'kml') return this.importKmlPlaces(tripId, fileBuffer, opts);
    throw new Error(`Unsupported map file format: .${ext}. Please upload a .kml or .kmz file.`);
  }

  async importKmzPlaces(tripId: string, kmzBuffer: Buffer, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
    const kmlBuffer = await unpackKmzToKml(kmzBuffer);
    return this.importKmlPlaces(tripId, kmlBuffer, opts);
  }

  importKmlPlaces(tripId: string, fileBuffer: Buffer, opts: KmlImportOptions = {}): PlaceImportResult {
    const { importPoints = true, importPaths = true } = opts;
    const decoded = decodeUtf8WithWarning(fileBuffer);

    const validationResult = XMLValidator.validate(decoded.text);
    if (validationResult !== true) {
      throw new Error('Malformed KML: invalid XML structure');
    }

    const parsed = kmlParser.parse(decoded.text);
    const kmlRoot = parsed?.kml ?? parsed;

    if (!kmlRoot || typeof kmlRoot !== 'object') {
      throw new Error('Malformed KML: could not parse XML');
    }

    const placemarkNodes = extractKmlPlacemarkNodes(kmlRoot);
    const summary = createKmlImportSummary(placemarkNodes.length);

    if (decoded.warning) {
      summary.warnings.push(decoded.warning);
    }

    const categories = this.dbs.all<{ id: number; name: string }>('SELECT id, name FROM categories');
    const categoryLookup = buildCategoryNameLookup(categories);
    const dedup = this.buildDedupSet(tripId);
    const created: PlaceWithTags[] = [];
    let dupCount = 0;

    const insertStmt = this.dbs.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, category_id, transport_mode, route_geometry)
    VALUES (?, ?, ?, ?, ?, ?, 'walking', ?)
  `);

    this.dbs.transaction(() => {
      let fallbackIndex = 1;
      for (const node of placemarkNodes) {
        const parsedPlacemark = parsePlacemarkNode(node);
        const isPath = parsedPlacemark.routeGeometry !== null;

        // Unsupported geometry type (polygon, multi-geometry, no geometry, etc.)
        if (parsedPlacemark.lat === null || parsedPlacemark.lng === null) {
          summary.skippedCount += 1;
          summary.errors.push(`Skipped Placemark ${fallbackIndex}: unsupported geometry type.`);
          fallbackIndex += 1;
          continue;
        }

        // Type filtering: respect importPoints / importPaths opts
        if (isPath && !importPaths) {
          summary.skippedCount += 1;
          fallbackIndex += 1;
          continue;
        }
        if (!isPath && !importPoints) {
          summary.skippedCount += 1;
          fallbackIndex += 1;
          continue;
        }

        const fallbackName = `Placemark ${fallbackIndex}`;
        const name = parsedPlacemark.name || fallbackName;

        if (isPlaceDuplicate({ name, lat: parsedPlacemark.lat, lng: parsedPlacemark.lng }, dedup)) {
          summary.skippedCount += 1;
          dupCount++;
          fallbackIndex += 1;
          continue;
        }

        const categoryId = resolveCategoryIdForFolder(parsedPlacemark.folderName, categoryLookup);

        const result = insertStmt.run(
          tripId,
          name,
          parsedPlacemark.description,
          parsedPlacemark.lat,
          parsedPlacemark.lng,
          categoryId,
          parsedPlacemark.routeGeometry,
        );

        const place = this.dbs.getPlaceWithTags(Number(result.lastInsertRowid))!;
        created.push(place);
        trackInsertedInDedupSet({ name, lat: parsedPlacemark.lat, lng: parsedPlacemark.lng }, dedup);
        summary.createdCount += 1;
        fallbackIndex += 1;
      }
    });

    if (dupCount > 0) {
      summary.warnings.push(`${dupCount} place${dupCount > 1 ? 's' : ''} skipped (already in trip).`);
    }

    if (summary.totalPlacemarks === 0) {
      summary.errors.push('No Placemarks found in KML file.');
    }

    return { places: created, count: created.length, summary };
  }

  /**
   * Hand every freshly imported track its own colour (#776).
   *
   * The importers never assign a category, so without this every track in a
   * trip renders in the same #3b82f6 — which is the actual complaint behind
   * the request: several walks in one area are impossible to tell apart.
   *
   * Picks the palette entries the trip is not already using rather than
   * counting rows: counting collides as soon as somebody recolours a track by
   * hand or deletes one, which is exactly when distinguishability matters.
   * Once all ten are taken it wraps around — ten walks in one trip is already
   * past what a colour alone can separate.
   *
   * Only rows that carry geometry are touched, and only ones that have no
   * colour yet; plain waypoints and existing places stay untouched.
   *
   * Writes the colour into the rows AND onto the passed-in result, in place —
   * it used to hand the same object back, which read like a transformation and
   * was none.
   */
  private colorizeImportedTracks(tripId: string, result: { places: ImportedPlace[] } | null): void {
    const tracks = result?.places?.filter((p) => p.route_geometry && !p.route_color) ?? [];
    if (tracks.length === 0) return;

    // Read and write in one transaction so two concurrent imports cannot both
    // read the same set of free colours.
    this.dbs.transaction((conn) => {
      const taken = new Set(
        (conn
          .prepare('SELECT DISTINCT route_color AS c FROM places WHERE trip_id = ? AND route_color IS NOT NULL')
          .all(tripId) as { c: string }[]).map((r) => r.c),
      );
      const free = TRACK_COLORS.filter((c) => !taken.has(c));
      const stmt = conn.prepare('UPDATE places SET route_color = ? WHERE id = ?');
      tracks.forEach((track, i) => {
        // Free ones first, then wrap through the whole palette — never reuse a
        // free colour twice within the same import.
        const color = i < free.length ? free[i] : TRACK_COLORS[(i - free.length) % TRACK_COLORS.length];
        stmt.run(color, track.id);
        track.route_color = color;
      });
    });
  }

  // -------------------------------------------------------------------------
  // Import Google Maps list
  // -------------------------------------------------------------------------

  async importGoogleList(tripId: string, url: string, opts?: ListImportOptions): Promise<ListImportResult | ListImportError> {
    let listId: string | null = null;
    let resolvedUrl = url;

    // SSRF guard: validate user-supplied URL before fetching
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    // Follow redirects for short URLs (maps.app.goo.gl, goo.gl). Redirects are
    // followed manually so every hop is re-checked against the SSRF guard — a
    // short link that 302s to an internal IP is blocked even though the initial
    // host is public.
    if (url.includes('goo.gl') || url.includes('maps.app')) {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    // Pattern: /placelists/list/{ID}
    const plMatch = resolvedUrl.match(/placelists\/list\/([A-Za-z0-9_-]+)/);
    if (plMatch) listId = plMatch[1];

    // Pattern: !2s{ID} in data URL params
    if (!listId) {
      const dataMatch = resolvedUrl.match(/!2s([A-Za-z0-9_-]{15,})/);
      if (dataMatch) listId = dataMatch[1];
    }

    if (!listId) {
      // A single-place share link (…/maps/place/…) carries no list id — point the user at
      // the place search box instead of a cryptic "could not extract list ID" (#1304).
      if (resolvedUrl.includes('/maps/place/')) {
        return { error: 'That link points to a single place, not a list. To add it, paste the link into the place search box instead of using the list import.', status: 400 };
      }
      return { error: 'Could not extract list ID from URL. Please use a shared Google Maps list link.', status: 400 };
    }

    // Fetch list data from Google Maps internal API
    const apiUrl = `https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=en&gl=us&pb=!1m1!1s${encodeURIComponent(listId)}!2e2!3e2!4i500!16b1`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    });

    if (!apiRes.ok) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }

    // Cap the declared body before reading it (transit.service precedent): the
    // response is attacker-influenced via the list id, and buffering it whole
    // used to be unbounded.
    const declared = Number(apiRes.headers?.get('content-length') ?? 0);
    if (declared > MAX_LIST_RESPONSE_BYTES) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }

    const rawText = await apiRes.text();
    if (rawText.length > MAX_LIST_RESPONSE_BYTES) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }
    const jsonStr = rawText.substring(rawText.indexOf('\n') + 1);
    // The provider hands back a JS-prefixed array; a malformed body is a
    // provider problem, not a crash — surface the same 400 an unreadable
    // payload already produced instead of throwing a SyntaxError.
    let listData: unknown;
    try {
      listData = JSON.parse(jsonStr);
    } catch {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }
    if (!Array.isArray(listData)) {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }

    const meta = listData[0];
    if (!meta) {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }

    const listName = meta[4] || 'Google Maps List';
    const items = meta[8];

    if (!Array.isArray(items) || items.length === 0) {
      return { error: 'List is empty or could not be read', status: 400 };
    }

    // Parse place data from items
    const places: { name: string; lat: number; lng: number; notes: string | null; googleFtid: string | null }[] = [];
    for (const item of items) {
      const coords = item?.[1]?.[5];
      const lat = coords?.[2];
      const lng = coords?.[3];
      const name = item?.[2];
      const note = item?.[3] || null;

      if (name && typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        places.push({ name, lat, lng, notes: note || null, googleFtid: googleMapsFeatureIdFromItem(item) });
      }
    }

    if (places.length === 0) {
      return { error: 'No places with coordinates found in list', status: 400 };
    }

    const dedup = this.buildDedupSet(tripId);
    const insertStmt = this.dbs.prepare(`
    INSERT INTO places (trip_id, name, lat, lng, notes, google_ftid, transport_mode)
    VALUES (?, ?, ?, ?, ?, ?, 'walking')
  `);
    const updateGoogleFtidStmt = this.dbs.prepare('UPDATE places SET google_ftid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    this.dbs.transaction(() => {
      for (const p of places) {
        if (isPlaceDuplicate({ name: p.name, lat: p.lat, lng: p.lng, google_ftid: p.googleFtid }, dedup)) {
          const duplicate = this.findDuplicatePlace(tripId, p);
          if (duplicate && !duplicate.google_ftid && p.googleFtid) {
            updateGoogleFtidStmt.run(p.googleFtid, duplicate.id);
          }
          skipped++;
          continue;
        }
        const result = insertStmt.run(tripId, p.name, p.lat, p.lng, p.notes, p.googleFtid);
        const place = this.dbs.getPlaceWithTags(Number(result.lastInsertRowid))!;
        created.push(place);
        trackInsertedInDedupSet({ name: p.name, lat: p.lat, lng: p.lng, google_ftid: p.googleFtid }, dedup);
      }
    });

    if (created.length) {
      void this.enrichImportedList(tripId, created as EnrichablePlace[], opts);
    }

    return { places: created, listName, skipped };
  }

  // -------------------------------------------------------------------------
  // Import Naver Maps list
  // -------------------------------------------------------------------------

  async importNaverList(tripId: string, url: string, opts?: ListImportOptions): Promise<ListImportResult | ListImportError> {
    let resolvedUrl = url;
    const limit = 20;

    // SSRF guard: validate user-supplied URL before fetching
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    // Resolve naver.me short links to the canonical map.naver.com folder URL.
    // Redirects are followed manually so each hop is re-validated against the
    // SSRF guard (a short link could otherwise 302 to an internal address).
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return { error: 'Invalid URL', status: 400 }; }
    if (parsedUrl.hostname === 'naver.me') {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    const folderMatch = resolvedUrl.match(/favorite\/myPlace\/folder\/([A-Za-z0-9_-]+)/i);
    const folderId = folderMatch?.[1] || null;
    if (!folderId) {
      return { error: 'Could not extract folder ID from URL. Please use a shared Naver Maps list link.', status: 400 };
    }

    const fetchPage = async (start: number) => {
      const apiUrl = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${encodeURIComponent(folderId)}/bookmarks?placeInfo=true&start=${start}&limit=${limit}&sort=lastUseTime&mcids=ALL&createIdNo=true`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!apiRes.ok) {
        return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
      }

      // Same cap as the Google import: the URL is attacker-influenced via the
      // folder id, and this pager buffers a fresh body on every iteration, so an
      // uncapped read is worse here than there. The declared length is checked
      // before the read; the post-read check covers a chunked response that
      // carries no content-length at all.
      const declared = Number(apiRes.headers?.get('content-length') ?? 0);
      if (declared > MAX_LIST_RESPONSE_BYTES) {
        return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
      }

      try {
        const rawText = await apiRes.text();
        if (rawText.length > MAX_LIST_RESPONSE_BYTES) {
          return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
        }
        const data = JSON.parse(rawText) as {
          folder?: { bookmarkCount?: number; name?: string };
          bookmarkList?: Record<string, unknown>[];
        };
        return { data } as const;
      } catch {
        return { error: 'Invalid list data received from Naver Maps', status: 400 } as const;
      }
    };

    const firstPage = await fetchPage(0);
    if ('error' in firstPage) {
      return { error: firstPage.error, status: firstPage.status };
    }

    const listName = firstPage.data.folder?.name || 'Naver Maps List';
    const totalCount = typeof firstPage.data.folder?.bookmarkCount === 'number'
      ? firstPage.data.folder.bookmarkCount
      : (firstPage.data.bookmarkList?.length || 0);

    const allItems: Record<string, unknown>[] = [...(firstPage.data.bookmarkList || [])];
    for (let start = limit; start < totalCount; start += limit) {
      const page = await fetchPage(start);
      if ('error' in page) {
        return { error: page.error, status: page.status };
      }
      const pageItems = page.data.bookmarkList || [];
      if (!Array.isArray(pageItems) || pageItems.length === 0) break;
      allItems.push(...pageItems);
    }

    if (allItems.length === 0) {
      return { error: 'List is empty or could not be read', status: 400 };
    }

    const places: { name: string; lat: number; lng: number; notes: string | null; address: string | null }[] = [];
    for (const item of allItems) {
      const lat = Number(item?.py);
      const lng = Number(item?.px);
      const name = typeof item?.name === 'string' && item.name.trim()
        ? item.name.trim()
        : (typeof item?.displayName === 'string' ? item.displayName.trim() : '');
      const note = typeof item?.memo === 'string' && item.memo.trim() ? item.memo.trim() : null;
      const address = typeof item?.address === 'string' && item.address.trim() ? item.address.trim() : null;

      if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
        places.push({ name, lat, lng, notes: note, address });
      }
    }

    if (places.length === 0) {
      return { error: 'No places with coordinates found in list', status: 400 };
    }

    const dedup = this.buildDedupSet(tripId);
    const insertStmt = this.dbs.prepare(`
    INSERT INTO places (trip_id, name, lat, lng, address, notes, transport_mode)
    VALUES (?, ?, ?, ?, ?, ?, 'walking')
  `);
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    this.dbs.transaction(() => {
      for (const p of places) {
        if (isPlaceDuplicate({ name: p.name, lat: p.lat, lng: p.lng }, dedup)) {
          skipped++;
          continue;
        }
        const result = insertStmt.run(tripId, p.name, p.lat, p.lng, p.address, p.notes);
        const place = this.dbs.getPlaceWithTags(Number(result.lastInsertRowid))!;
        created.push(place);
        trackInsertedInDedupSet({ name: p.name, lat: p.lat, lng: p.lng }, dedup);
      }
    });

    if (created.length) {
      void this.enrichImportedList(tripId, created as EnrichablePlace[], opts);
    }

    return { places: created, listName, skipped };
  }

  // -------------------------------------------------------------------------
  // Background enrichment for list-imported places (#886)
  //
  // Google/Naver list imports only carry name + coordinates, so the imported
  // places open as bare pins (the Maps tab jumps to coordinates, no photo, no
  // open/closed). When the importer opts in and a Google Maps key is
  // configured, we re-resolve each place by name — biased to and validated
  // against the imported coordinates — to a real Google place, then fill in the
  // empty fields and persist the resolved `google_place_id` plus `google_ftid`
  // (which power on-demand opening hours and proper Maps links going forward).
  //
  // This runs detached from the import request (fire-and-forget) so a long list
  // never blocks the response, and pushes each enriched row over the websocket
  // so the sidebar fills in progressively. It only ever fills EMPTY columns, so
  // it can never clobber data the import already captured (e.g. a Naver
  // address). Moved in from the legacy services/placeEnrichment.ts when the
  // place domain went DI-native; the pure match selector stays in
  // places.helpers.ts.
  // -------------------------------------------------------------------------

  private async enrichOne(tripId: string, userId: number, place: EnrichablePlace, lang?: string): Promise<void> {
    // Already linked (shouldn't happen for list imports) — nothing to resolve.
    if (place.google_place_id) return;
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;

    const { places: results } = await this.maps.searchPlaces(userId, place.name, lang, {
      lat: place.lat,
      lng: place.lng,
      radius: SEARCH_BIAS_RADIUS_METERS,
    });
    const match = pickEnrichmentMatch(results, { lat: place.lat, lng: place.lng });
    if (!match) return;

    const gpid = trimOrNull(match.google_place_id);
    if (!gpid) return;
    const gftid = trimOrNull(match.google_ftid);

    // COALESCE so enrichment only fills empty columns — never overwrites data the
    // import already captured (e.g. Naver's address) or anything the user edited.
    this.dbs.run(
      `UPDATE places
     SET google_place_id = COALESCE(google_place_id, ?),
         google_ftid    = COALESCE(google_ftid, ?),
         address        = COALESCE(address, ?),
         website        = COALESCE(website, ?),
         phone          = COALESCE(phone, ?),
         updated_at     = CURRENT_TIMESTAMP
     WHERE id = ? AND trip_id = ?`,
      gpid, gftid, trimOrNull(match.address), trimOrNull(match.website), trimOrNull(match.phone), place.id, tripId,
    );

    // Photo is best-effort: Google often has none, in which case getPlacePhoto
    // resolves with photoUrl: null. A missing photo (or a provider outage, which
    // still throws) must never abort the rest of the enrichment.
    try {
      const photo = await this.maps.getPlacePhoto(userId, gpid, place.lat, place.lng, place.name);
      if (photo?.photoUrl) {
        this.dbs.run(
          'UPDATE places SET image_url = COALESCE(image_url, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trip_id = ?',
          photo.photoUrl, place.id, tripId,
        );
      }
    } catch {
      /* no photo — leave image_url as-is */
    }

    // Push the enriched row to every connected client (no socket exclusion: the
    // importer's own client should also receive the late update).
    const updated = this.dbs.getPlaceWithTags(place.id);
    if (updated) this.realtime.broadcast(tripId, 'place:updated', { place: updated }, undefined);
  }

  /**
   * Enrich a batch of just-imported places in the background. Never throws —
   * any per-place failure is swallowed so one bad lookup can't take down the
   * detached task or the process. No-ops when no Google Maps key is configured.
   */
  async enrichImportedPlaces(tripId: string, userId: number, places: EnrichablePlace[], lang?: string): Promise<void> {
    try {
      if (!places.length) return;
      if (!this.maps.getMapsKey(userId)) return;
      await mapWithConcurrency(places, ENRICH_CONCURRENCY, async (place) => {
        try {
          await this.enrichOne(tripId, userId, place, lang);
        } catch (err) {
          console.error(`[Places] enrichment failed for place ${place.id}:`, err instanceof Error ? err.message : err);
        }
      });
    } catch (err) {
      console.error('[Places] import enrichment pass failed:', err instanceof Error ? err.message : err);
    }
  }

  /**
   * Everything a just-imported list gets in the background, in one place so the
   * Google and Naver call sites cannot drift apart.
   *
   * The Google pass stays exactly as opt-in and key-gated as before. The address
   * backfill behind it needs neither — it is the same free Nominatim reverse
   * lookup a single pasted link has always had, which is what made a list import
   * come out thinner than the same place added one at a time (#1954).
   */
  private async enrichImportedList(tripId: string, places: EnrichablePlace[], opts?: ListImportOptions): Promise<void> {
    if (opts?.enrich && opts.userId) {
      await this.enrichImportedPlaces(tripId, opts.userId, places, opts.lang);
    }
    await this.backfillMissingAddresses(tripId, places, opts?.lang);
  }

  /**
   * Fill in the address of imported places that have none, from Nominatim.
   *
   * Runs on the background lane so it never queues in front of a user's own
   * search, writes through COALESCE so it can only fill an empty column — the
   * Google pass above may already have written a better one — and pushes each
   * row over the websocket so the sidebar fills in without a reload. Never
   * throws: one bad lookup must not take down a detached task.
   */
  async backfillMissingAddresses(tripId: string, places: EnrichablePlace[], lang?: string): Promise<void> {
    try {
      const pending = places.filter(p => !p.address && p.lat != null && p.lng != null);
      if (!pending.length) return;
      if (pending.length > ADDRESS_BACKFILL_MAX_PLACES) {
        console.warn(`[Places] address backfill skipped for trip ${tripId}: ${pending.length} places exceeds the ${ADDRESS_BACKFILL_MAX_PLACES} cap`);
        return;
      }
      // Serial on purpose: the background lane throttles to roughly one request a
      // second anyway, so concurrency would only build a queue.
      for (const place of pending) {
        try {
          const { address } = await this.maps.reverseGeocode(String(place.lat), String(place.lng), lang, {
            lane: 'background',
            timeoutMs: 10000,
          });
          if (!address) continue;
          this.dbs.run(
            'UPDATE places SET address = COALESCE(address, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trip_id = ?',
            address, place.id, tripId,
          );
          const updated = this.dbs.getPlaceWithTags(place.id);
          if (updated) this.realtime.broadcast(tripId, 'place:updated', { place: updated }, undefined);
        } catch (err) {
          console.error(`[Places] address backfill failed for place ${place.id}:`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      console.error('[Places] address backfill pass failed:', err instanceof Error ? err.message : err);
    }
  }

  // -------------------------------------------------------------------------
  // Search place image (Unsplash)
  // -------------------------------------------------------------------------

  async searchImage(tripId: string, placeId: string, userId: number) {
    const place = this.dbs.get<Place>('SELECT * FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!place) return { error: 'Place not found', status: 404 };

    return this.unsplash.searchUnsplashPhotos(place.name + (place.address ? ' ' + place.address : ''), 5, this.unsplash.getUnsplashKey(userId));
  }

  // -------------------------------------------------------------------------
  // Collaborative ratings (#1435)
  // -------------------------------------------------------------------------

  /**
   * Set (rating 1-5) or clear (rating null) the user's own vote on a trip place.
   * Ratings live in their own table so voting never bumps places.updated_at —
   * a vote must not 409 another member's offline edit. Returns the refreshed
   * place (with the new aggregate) or null when the place isn't in the trip.
   */
  rate(tripId: string, placeId: string, userId: number, rating: number | null): PlaceWithTags | null {
    const place = this.dbs.get('SELECT id FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!place) return null;
    if (rating === null) {
      this.dbs.run('DELETE FROM place_ratings WHERE place_id = ? AND user_id = ?', placeId, userId);
    } else {
      this.dbs.run(`
      INSERT INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)
      ON CONFLICT(place_id, user_id) DO UPDATE SET rating = excluded.rating
    `, placeId, userId, rating);
    }
    return this.dbs.getPlaceWithTags(placeId);
  }

  // Journey hooks — non-fatal, mirroring the route's try/catch wrappers.
  onCreated(tripId: string, placeId: number): void { try { this.journey.onPlaceCreated(Number(tripId), placeId); } catch { /* non-fatal */ } }
  onUpdated(placeId: number): void { try { this.journey.onPlaceUpdated(placeId); } catch { /* non-fatal */ } }
  onDeleted(placeId: number): void { try { this.journey.onPlaceDeleted(placeId); } catch { /* non-fatal */ } }
}
