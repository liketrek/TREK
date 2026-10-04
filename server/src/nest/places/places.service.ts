import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { resolveCountryCodeSync } from '../atlas/atlas-geo';
import { XMLValidator } from 'fast-xml-parser';
import { TRACK_COLORS, placeMatchStrategies, type PlaceMatchCandidate } from '@trek/shared';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { MapsService, GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../maps/maps.service';
import { isDirectionsUrl, parseDirectionsUrl } from './maps-dir.helpers';
import { toRowId } from '../common/row-id';
import type { User } from '../../types';
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
import { isUploadedPlaceImage, placeImageUrl } from './place-image';
import { MAX_PLACE_IMAGE_SIZE, PLACE_IMAGE_EXTENSIONS } from '../common/place-image-upload';
import { randomUUID } from 'node:crypto';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { StorageService } from '../storage/storage.service';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { Places } from '../../db/entities/Places.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { Categories } from '../../db/entities/Categories.entity';
import { Trips } from '../../db/entities/Trips.entity';
import type { PlacesRepository, PlaceListRow, PlaceWithTagsRow as PlaceWithTags } from '../../db/repositories/Places.repository';
import type { TagsRepository } from '../../db/repositories/Tags.repository';
import type { PlaceRatingsRepository } from '../../db/repositories/PlaceRatings.repository';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import type { CategoriesRepository } from '../../db/repositories/Categories.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';
import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import type { CollectionPlacesRepository } from '../../db/repositories/CollectionPlaces.repository';

/** Rows a place delete took down with the nights booked there, for the caller to announce. */
export interface CancelledStays {
  reservationIds: number[];
  budgetItemIds: number[];
}

const noCancelledStays = (): CancelledStays => ({ reservationIds: [], budgetItemIds: [] });
import {
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
} from './places.helpers';

type Trip = TripAccess;

type ImportedPlace = { id: number; route_geometry?: string | null; route_color?: string | null };

/** Fields accepted when creating a place. */
export interface PlaceCreateInput {
  name: string; description?: string; lat?: number; lng?: number; address?: string;
  category_id?: number; price?: number; currency?: string;
  place_time?: string; end_time?: string;
  duration_minutes?: number; notes?: string; image_url?: string;
  google_place_id?: string; google_ftid?: string; osm_id?: string; amap_poi_id?: string; website?: string; phone?: string;
  email?: string | null; opening_hours?: string | null;
  /** What kind of stop this is on a drive (fuel, charging, rest_area, campsite); null for an ordinary place. */
  stop_type?: string | null;
  /** How full THIS stop fills the tank, 1-100; null to follow the traveller's own setting. */
  fill_percent?: number | null;
  transport_mode?: string; route_geometry?: string; route_color?: string; tags?: number[];
}

/** Fields accepted when patching a place. */
export interface PlaceUpdateInput {
  name?: string; description?: string; lat?: number; lng?: number; address?: string;
  category_id?: number; price?: number; currency?: string;
  place_time?: string; end_time?: string;
  duration_minutes?: number; notes?: string; image_url?: string;
  google_place_id?: string; google_ftid?: string; osm_id?: string; amap_poi_id?: string; website?: string; phone?: string;
  email?: string | null; opening_hours?: string | null;
  /** What kind of stop this is on a drive (fuel, charging, rest_area, campsite); null for an ordinary place. */
  stop_type?: string | null;
  /** How full THIS stop fills the tank, 1-100; null to follow the traveller's own setting. */
  fill_percent?: number | null;
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
 * Trip access rides TripsRepository.findAccessible (Plan 4 Task 2 — off
 * DatabaseService.canAccessTrip);
 * mutations use 'place_edit'. Pure helpers and the frozen XML parsers live in
 * places.helpers.ts. Nothing outside the Nest container consumes this domain
 * any more, so there is no places.bridge.ts: the MCP surface is the
 * DI-discovered places.mcp.ts, and TripsService / DaysMcp /
 * BookingImportService / PlacesRpc all inject this class.
 */
@Injectable()
export class PlacesService {
  constructor(
    // Plan 4 Task 4: the dead `DatabaseService` param dropped —
    // `canAccessTrip` below reuses `tripsRepo` directly and never read
    // `this.dbs`. `conflictUpdate.test.ts`'s hand-construction updated too.
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly maps: MapsService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly unsplash: UnsplashService,
    private readonly photoCache: PlacePhotoCacheService,
    private readonly journey: JourneyDomainService,
    private readonly storage: StorageService,
    private readonly accommodations: AccommodationsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(Tags) private readonly tagsRepo: TagsRepository,
    @InjectRepository(PlaceRatings) private readonly placeRatingsRepo: PlaceRatingsRepository,
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(Categories) private readonly categoriesRepo: CategoriesRepository,
    // Task 9 fix wave (B-M2 / A-L3 ruling): `DatabaseService.getTripTitle`
    // does not stay — it was the one method on that class this domain's own
    // PL28 comment said should convert like its siblings once concurrent
    // implementers stopped colliding on this file. `Trips` is already on
    // `PlacesModule`'s `forFeature` list, so this needs no module change.
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 3e Task 2 (budget) — additive, PL15/PL18/PL22 only.
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
    // Plan 3h Task 6 (survivors) — additive, SV-PI2's `reclaimPlaceImage` only.
    @InjectRepository(CollectionPlaces) private readonly collectionPlacesRepo: CollectionPlacesRepository,
  ) {}

  /**
   * The `requireTrip` gate for 13 of the 16 routes on this controller (the
   * other 3 use `TripAccessGuard` directly). `toRowId`, not `Number()` —
   * Plan 3c Task 9's whole-plan review (A-H1/M1, B-H1): `Number('1.0')`/
   * `Number('1 ')`/`Number('0x1abc's NaN half)` either authorised an id the
   * writes behind this gate (`toRowId(tripId) ?? -1`) then refused, or sent
   * a bare `NaN` into `TripsRepository.findAccessible`'s raw bind and 500'd
   * (fixed program-wide at the platform too — see `NulSafeSqlitePlatform`).
   * Parsing here answers this gate's own 404 before any read or write runs.
   *
   * **The returned `tid` is NOT threaded to every downstream call, despite
   * an earlier version of this docstring claiming it was** (Plan 4 Task 8a,
   * L-2 — confirmed false by reading every call site, not assumed): `.tid`
   * has exactly one reader today, `PlacesController.requireTrip` itself
   * (`places.controller.ts:122`), which discards it — `requireTrip` returns
   * the WHOLE `trip` object to its 13 callers, none of which read `.tid`
   * off it; every one instead passes the ORIGINAL raw `tripId` string on to
   * the write/read method it calls next (`create(tripId, …)`,
   * `importGpx(tripId, …)`, …), which `toRowId`-parses it AGAIN itself.
   * That second parse is not a bug this gate can close by itself: those
   * same methods are also called directly by `places.mcp.ts` (an entry
   * point with no `requireTrip` gate at all — its own `tripId: number`
   * input is re-stringified, `String(tripId)`, to call them), so each
   * method owns its own id validation regardless of which entry point
   * reached it, and `tid` alone cannot remove that. Threading it all the
   * way through would mean giving every one of those methods a second,
   * number-only call shape for the REST path to use instead of its shared
   * string-taking one — a real refactor, out of this gate's own scope.
   */
  async verifyTripAccess(tripId: string, userId: number): Promise<(TripAccess & { tid: number }) | undefined> {
    const tid = toRowId(tripId);
    if (tid === null) return undefined;
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    const access = await this.tripsRepo.findAccessible(tid, userId);
    if (!access) return undefined;
    return { ...access, tid };
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
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
  private async tagsOnTrip(tripId: string | number, tagIds: number[]): Promise<number[]> {
    const unique = [...new Set(tagIds)];
    if (unique.length === 0) return [];
    // PL1 — `TripMembersRepository.rosterUserIds`, injected directly (not
    // through `DatabaseService`), matching `AssignmentsService`'s AS28
    // precedent: each domain converts its own `DatabaseService`-delegated
    // callers as it lands.
    const roster = await this.tripMembersRepo.rosterUserIds(tripId);
    // PL2 — `SELECT id, user_id FROM tags WHERE id IN (${…})`.
    const owned = await this.tagsRepo.findByIds(unique);
    return owned.filter(t => roster.has(t.user_id)).map(t => t.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * Delete a custom place-image object once nothing references it any more
   * (moved in from `place-image.ts`'s free function `reclaimPlaceImage`,
   * option (a) — see `place-image.ts`'s own docstring for why that free
   * function stays, unconverted, for `collections.service.ts`'s own call
   * sites). A trip place and a collection saved-place can share the same
   * uploaded file — save-to-collection and copy-to-trip copy `image_url` by
   * reference — so this ref-counts across both tables before deleting.
   *
   * PI1 (`SELECT 1 FROM places WHERE image_url = ? LIMIT 1`) through
   * `PlacesRepository.existsByImageUrl`; PI2 (`SELECT 1 FROM collection_places
   * WHERE image_url = ? LIMIT 1`) through `CollectionPlacesRepository
   * .existsByImageUrl` (Plan 3h Task 6, closing out the carve-out), evaluated
   * only when PI1 is false — reproducing the legacy `UNION ALL … LIMIT 1`'s
   * short-circuit by evaluation order, the same pattern
   * `PlacePhotoCacheService.isReferenced` uses for the same two tables
   * (Plan 3c Task 1's PP6 ruling). `path.basename()` keeps the storage name
   * confined to the 'places' category. Best-effort: never throws (central
   * key validation rejects a hostile stored value; the catch swallows it
   * exactly like the legacy unlink guard).
   */
  private async reclaimPlaceImage(url: string | null | undefined): Promise<void> {
    if (!isUploadedPlaceImage(url)) return;
    if (await this.placesRepo.existsByImageUrl(url)) return;
    // PI2 (Plan 3h Task 6) — `CollectionPlacesRepository.existsByImageUrl`.
    if (await this.collectionPlacesRepo.existsByImageUrl(url)) return;
    await this.storage.delete('places', path.basename(url)).catch(() => {
      /* best-effort */
    });
  }

  // -------------------------------------------------------------------------
  // List places
  // -------------------------------------------------------------------------

  async list(
    tripId: string,
    filters: { search?: string; category?: string; tag?: string; assignment?: 'all' | 'unassigned' | 'assigned' },
  ) {
    // ESCAPE so a `%` or `_` the user typed matches literally instead of
    // acting as a LIKE wildcard (a bare '%' used to return the whole trip) —
    // the coercion stays here (the service), the repository binds the
    // already-built pattern verbatim (PL3).
    const searchPattern = filters.search ? `%${escapeLikePattern(filters.search)}%` : undefined;
    const places: PlaceListRow[] = await this.placesRepo.listForTrip(tripId, {
      searchPattern,
      category: filters.category,
      tag: filters.tag,
      assignment: filters.assignment,
    });

    const placeIds = places.map(p => p.id);
    const tagsByPlaceId = await this.queryHelpers.loadTagsByPlaceIds(placeIds);
    const ratingsByPlaceId = await this.queryHelpers.loadRatingsByPlaceIds(placeIds);

    return places.map(p => ({
      ...p,
      // The cached region row when the atlas resolved one, else the country the bundled
      // borders place it in, which needs no network (#2537).
      country_code: p.country_code ?? resolveCountryCodeSync(p),
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

  /**
   * Makes a picture already attached in the trip the place's own image (#1242). The file
   * is copied, not pointed at: the place keeps its picture when the attachment is deleted,
   * and the update path reclaims the copy like any other uploaded image. Returns a reason
   * string when the file cannot serve, the updated place otherwise.
   */
  async setImageFromFile(tripId: string, placeId: string, fileId: number): Promise<'not_found' | 'not_image' | 'too_large' | Awaited<ReturnType<PlacesService['update']>>> {
    const tid = toRowId(tripId);
    // PL53 — the trip's own, not-trashed attachment.
    const file = tid === null ? undefined : await this.placesRepo.findActiveTripFile(fileId, tid);
    if (!file) return 'not_found';
    const ext = path.extname(file.original_name || file.filename).toLowerCase();
    const mime = file.mime_type ?? '';
    if (!mime.startsWith('image/') || mime.includes('svg') || !PLACE_IMAGE_EXTENSIONS.includes(ext)) return 'not_image';
    if (file.file_size != null && file.file_size > MAX_PLACE_IMAGE_SIZE) return 'too_large';
    const name = `${randomUUID()}${ext}`;
    const { stream } = await this.storage.getStream('files', path.basename(file.filename));
    await this.storage.put('places', name, stream, { contentType: mime });
    const updated = await this.update(tripId, placeId, { image_url: placeImageUrl(name) } as never);
    if (!updated || isUpdateConflict(updated)) await this.reclaimPlaceImage(placeImageUrl(name));
    return updated;
  }

  // -------------------------------------------------------------------------
  // Create place
  // -------------------------------------------------------------------------

  async create(tripId: string, body: PlaceCreateInput) {
    const {
      name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, amap_poi_id, website, phone,
      email, opening_hours,
      transport_mode, route_geometry, route_color, stop_type, fill_percent, tags = [],
    } = body;

    // Rule 21 / M1 (Task 9 fix wave): `verifyTripAccess` now parses `tripId`
    // with this SAME `toRowId` and answers 404 `Trip not found` before
    // `create()` is ever reached (the controller's `requireTrip`/MCP's own
    // `tripsRepo.findAccessible` gate both run first) — so `toRowId` here
    // can never miss for a caller that went through the gate. The previous
    // `?? -1` sentinel was ruled a defect, not parity: with the gate itself
    // loosely `Number()`-parsed, a non-canonical-but-numeric id like `1.0`
    // could pass the gate and still manufacture a fresh 500 here (an FK
    // failure the legacy raw bind never produced for that input). Non-null
    // asserted, not defaulted — a null here now means a caller skipped the
    // gate, a bug to surface, not a trip id to silently coerce to -1.
    const tid = toRowId(tripId)!;

    // PL4 — the 27-column INSERT. lat/lng/price/duration_minutes/fill_percent
    // use an explicit undefined check, not `||`: 0 is a legitimate value for
    // all five (Null Island, a free entry, a drive-by stop, an empty tank)
    // and the falsy coercion silently threw it away.
    //
    // The hour stays the default for a place created without one, which is what it
    // has always been and what the column itself declares. The road trip rail reads
    // the value as a stay, and a stop added from the corridor search brings its own
    // figure — ten minutes for fuel, twenty for a rest area — so the kinds that would
    // be misread as an hour never take the default in the first place.
    const placeId = await this.placesRepo.insertPlace({
      trip_id: tid,
      name,
      description: description || null,
      lat: lat ?? null,
      lng: lng ?? null,
      address: address || null,
      category_id: category_id || null,
      price: price ?? null,
      currency: currency || null,
      place_time: place_time || null,
      end_time: end_time || null,
      duration_minutes: duration_minutes ?? 60,
      notes: notes || null,
      image_url: image_url || null,
      google_place_id: google_place_id || null,
      google_ftid: google_ftid || null,
      osm_id: osm_id || null,
      amap_poi_id: amap_poi_id || null,
      website: website || null,
      phone: phone || null,
      transport_mode: transport_mode || 'walking',
      route_geometry: route_geometry || null,
      route_color: route_color || null,
      stop_type: stop_type || null,
      fill_percent: fill_percent ?? null,
      email: email?.trim() || null,
      opening_hours: opening_hours || null,
    });

    // PL5 — `INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)`.
    if (tags && tags.length > 0) {
      await this.tagsRepo.insertIgnore(placeId, await this.tagsOnTrip(tid, tags));
    }

    // PL6 — `findWithTagsAndRatings` replaces the `getPlaceWithTags` delegation.
    return (await this.placesRepo.findWithTagsAndRatings(placeId))!;
  }

  // -------------------------------------------------------------------------
  // Get single place
  // -------------------------------------------------------------------------

  async get(tripId: string, placeId: string) {
    // PL7 — the existence gate. `toRowId` first (Task 3 review H1, absorbed
    // here): a non-canonical id must resolve to "not found" here, the same
    // answer `findWithTagsAndRatings` below would give it anyway — this
    // just skips the trip-scoped existence read for an id that can never
    // exist.
    const id = toRowId(placeId);
    if (id === null) return null;
    // Rule 21 (H1): the trip id gets the SAME `toRowId` treatment, parsed
    // once here and used for the existence read — `Number(tripId)` used to
    // disagree with this method's own place-id gate above (`0xb` = 11 is a
    // real trip's row id), which let a hex trip id find a place that
    // belongs to a DIFFERENT trip than the one in the route. A non-canonical
    // trip id answers the same legacy not-found the place-id gate does.
    const tid = toRowId(tripId);
    if (tid === null) return null;
    if (!(await this.placesRepo.existsInTrip(id, tid))) return null;
    // PL8 — `findWithTagsAndRatings` replaces the `getPlaceWithTags` delegation.
    return await this.placesRepo.findWithTagsAndRatings(id);
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
    const { result, reclaim } = await this.applyUpdate(tripId, placeId, body, ifMatch);
    if (reclaim !== undefined) await this.reclaimPlaceImage(reclaim);
    return result;
  }

  /**
   * The DB half of update(). Split out so updateMany() can run it inside the
   * same UnitOfWork transaction and settle the storage reclaims after the
   * transaction commits.
   */
  private async applyUpdate(
    tripId: string,
    placeId: string,
    body: PlaceUpdateInput,
    ifMatch?: string,
  ): Promise<{ result: PlaceWithTags | UpdateConflict | null; reclaim?: string | null }> {
    // PL9 — the pre-image read every `!== undefined` fallback below needs.
    // `toRowId` first (Task 3 review H1, absorbed here): every write in
    // this method (`updatePlace`, `tagsRepo.deleteForPlace`/`insertIgnore`)
    // uses this SAME validated `id` — a non-canonical `placeId` (`"3 "`,
    // `"3.0"`) must resolve to "not found" HERE, not pass a loose SQLite
    // affinity match and then hit a downstream write keyed on a `toRowId(x)!`
    // that returns `null`.
    const id = toRowId(placeId);
    if (id === null) return { result: null };
    // Rule 21 (H1): the trip id gets the same `toRowId` treatment, parsed
    // once here and reused for every later call in this method, including
    // PL12/PL13's `tagsOnTrip` roster read — `Number(tripId)` used to
    // disagree with those raw survivors (and with this method's own
    // place-id gate above), so a hex trip id could pass this existence read
    // against the wrong trip's place and then wipe its tags via a roster
    // read against a roster that never matched (H1, live: tags silently
    // dropped to `[]`).
    const tid = toRowId(tripId);
    if (tid === null) return { result: null };
    const existingPlace = await this.placesRepo.findInTrip(id, tid);
    if (!existingPlace) return { result: null };

    // Optimistic concurrency (#1135): when the caller sent the version it based its
    // edit on and the row has moved on since, reject instead of clobbering. Absent
    // token => unconditional update (back-compat — old clients keep last-write-wins).
    if (ifMatch !== undefined && existingPlace.updated_at != null && String(existingPlace.updated_at) !== ifMatch) {
      // PL10 — the `{conflict: true, server}` body when `If-Match` loses (#1135).
      return { result: { conflict: true, server: await this.placesRepo.findWithTagsAndRatings(id) } };
    }

    const {
      name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, amap_poi_id, website, phone,
      email, opening_hours,
      transport_mode, route_color, stop_type, fill_percent, tags,
    } = body;

    // PL11 — ONE `nativeUpdate` with a typed full partial (the ruling): the
    // SQL `COALESCE(?, col)` keep-if-null semantics (name/currency/
    // transport_mode, all three bound `x || null`) and the twenty
    // `!== undefined ? x : existing.x` pre-image fallbacks are resolved to
    // their final value HERE, in the service — the repository writes
    // exactly what it is handed.
    await this.placesRepo.updatePlace(id, {
      // COALESCE(?, name): the bound value is `name || null` (falsy clears
      // to null), and `?? existingPlace.name` is the COALESCE half itself —
      // a `nativeUpdate` writes a literal value, it does not evaluate SQL
      // COALESCE, so the keep-if-null fold has to be resolved here.
      name: (name || null) ?? existingPlace.name,
      description: description !== undefined ? description : existingPlace.description,
      lat: lat !== undefined ? lat : existingPlace.lat,
      lng: lng !== undefined ? lng : existingPlace.lng,
      address: address !== undefined ? address : existingPlace.address,
      category_id: category_id !== undefined ? category_id : existingPlace.category_id,
      price: price !== undefined ? price : existingPlace.price,
      // COALESCE(?, currency) — same fold as `name` above.
      currency: (currency || null) ?? existingPlace.currency,
      place_time: place_time !== undefined ? place_time : existingPlace.place_time,
      end_time: end_time !== undefined ? end_time : existingPlace.end_time,
      // Not COALESCE, like its neighbours: the contract says an explicit null
      // clears the planned stay length, and COALESCE made null and absent the
      // same thing, so the field advertised a reset it never performed. 0 keeps
      // working, which a `|| null` bind would have swallowed.
      duration_minutes: duration_minutes !== undefined ? duration_minutes : existingPlace.duration_minutes,
      notes: notes !== undefined ? notes : existingPlace.notes,
      image_url: image_url !== undefined ? image_url : existingPlace.image_url,
      google_place_id: google_place_id !== undefined ? google_place_id : existingPlace.google_place_id,
      google_ftid: google_ftid !== undefined ? google_ftid : existingPlace.google_ftid,
      osm_id: osm_id !== undefined ? osm_id : existingPlace.osm_id,
      amap_poi_id: amap_poi_id !== undefined ? amap_poi_id : existingPlace.amap_poi_id,
      website: website !== undefined ? website : existingPlace.website,
      phone: phone !== undefined ? phone : existingPlace.phone,
      // Empty clears, like null: the form sends what its field holds (#2472).
      email: email !== undefined ? (email?.trim() || null) : existingPlace.email,
      opening_hours: opening_hours !== undefined ? (opening_hours || null) : existingPlace.opening_hours,
      // COALESCE(?, transport_mode) — same fold as `name`/`currency` above.
      transport_mode: (transport_mode || null) ?? existingPlace.transport_mode,
      // Deliberately not COALESCE: an explicit null is how the picker resets a
      // track back to its category colour (#776).
      route_color: route_color !== undefined ? route_color : existingPlace.route_color,
      // Same shape: an explicit null is how a fuel stop becomes an ordinary place again.
      stop_type: stop_type !== undefined ? stop_type : existingPlace.stop_type,
      // And how a stop that had its own fill amount goes back to following the setting.
      fill_percent: fill_percent !== undefined ? fill_percent : existingPlace.fill_percent,
    });

    if (tags !== undefined) {
      // PL12 — `DELETE FROM place_tags WHERE place_id = ?`.
      await this.tagsRepo.deleteForPlace(id);
      if (tags.length > 0) {
        // PL13 — `INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)`.
        await this.tagsRepo.insertIgnore(id, await this.tagsOnTrip(tid, tags));
      }
    }

    // A custom uploaded thumbnail (#1136) that was just replaced or cleared leaves
    // an orphan file behind — reclaim it (in the caller, once any enclosing
    // transaction committed) if nothing references it any more.
    const reclaim = image_url !== undefined && image_url !== existingPlace.image_url
      ? existingPlace.image_url
      : undefined;

    // PL14 — `findWithTagsAndRatings` replaces the `getPlaceWithTags` delegation.
    return { result: await this.placesRepo.findWithTagsAndRatings(id), reclaim };
  }

  // -------------------------------------------------------------------------
  // Delete place
  // -------------------------------------------------------------------------

  /**
   * The expenses hanging off these places (#1298), so a caller can broadcast the
   * budget:deleted events for the rows remove()/removeMany() are about to take
   * with them. Read it BEFORE deleting — afterwards the link is gone.
   */
  async linkedExpenseIds(tripId: string | number, placeIds: Array<string | number>): Promise<number[]> {
    if (placeIds.length === 0) return [];
    // Rule 21 (H1): `toRowId` first — a non-canonical trip id never
    // affinity-matches a real `budget_items.trip_id`, so this is the same
    // "no rows" answer the raw legacy bind gave it; called independently of
    // `remove()`/`removeMany()` (the controller reads it before either), so
    // it cannot rely on a sibling method's gate having already run.
    const tid = toRowId(tripId);
    if (tid === null) return [];
    // PL15 — Plan 3e Task 2, converted: `BudgetItemsRepository.listIdsForPlaces`.
    return await this.budgetItemsRepo.listIdsForPlaces(tid, placeIds);
  }


  /**
   * The nights booked at a place, cancelled because the place is going.
   *
   * A stay whose place is deleted used to be left behind with place_id NULL: still
   * drawn in the day header, still naming a hotel through its partner booking, and
   * pointing nowhere. Through the accommodations domain rather than a DELETE here,
   * because a stay takes its partner booking, that booking's expense and the day stop
   * it wrote with it, and none of that is places' business to know.
   *
   * Runs inside the caller's transaction.
   */
  private async cancelStaysAt(tripId: number, placeId: number, into: CancelledStays): Promise<void> {
    // PL16 (Plan 3d Task 3) — `day_accommodations` is that task's table;
    // reached through `AccommodationsService.listStayIdsForPlace` (already
    // injected here) rather than a new `DayAccommodationsRepository`
    // dependency of this service's own (keeps this file's constructor, and
    // the shared positional test-helper wiring, untouched). Runs inside the
    // caller's own transaction (R4 — Plan 3d must not re-open or re-scope
    // this transaction), and keeps `id`/`tripId` as the SAME `toRowId`-parsed
    // numbers `remove`/`removeMany` already resolved (rule 21).
    const stayIds = await this.accommodations.listStayIdsForPlace(tripId, placeId);
    for (const stayId of stayIds) {
      const gone = await this.accommodations.deleteAccommodation(stayId);
      // What went down with the night is what the caller has to announce. The
      // partner booking and its expense are rows the Bookings list and the Costs
      // total are still holding; place:deleted says nothing about either, and a
      // budget item linked by reservation_id is not found by linkedExpenseIds.
      into.reservationIds.push(...gone.linkedReservationIds);
      into.budgetItemIds.push(...gone.deletedBudgetItemIds);
    }
  }

  async remove(tripId: string, placeId: string): Promise<{ deleted: boolean; cancelled: CancelledStays }> {
    const cancelled = noCancelledStays();
    // `toRowId` first (Task 3 review H1, absorbed here): the write below
    // (`deleteById`) must use the SAME id this gate's existence read used.
    const id = toRowId(placeId);
    if (id === null) return { deleted: false, cancelled };
    // Rule 21 (H1): the trip id gets the same `toRowId` treatment, parsed
    // once here and reused for the gate AND every raw survivor below
    // (`cancelStaysAt`'s PL16, the PL18 `budget_items` DELETE) —
    // `Number(tripId)` used to disagree with those raw binds, so a hex trip
    // id could pass this gate against a real trip's place while the raw
    // deletes below matched nothing, leaving the place deleted but its
    // linked expense and stay orphaned (H1, live: verified with a linked
    // expense and a stay, both survived with `place_id: null`).
    const tid = toRowId(tripId);
    if (tid === null) return { deleted: false, cancelled };
    // PL17 — the reclaim-candidate projection, read before the delete.
    const place = await this.placesRepo.reclaimInputs(id, tid);
    if (!place) return { deleted: false, cancelled };
    // The linked expense goes with the place, the same way a booking takes its
    // expense with it (#1298). One transaction, so a place can never survive
    // half-detached from its money.
    await this.uow.transactional(async () => {
      await this.cancelStaysAt(tid, id, cancelled);
      // PL18 — Plan 3e Task 2, converted: `BudgetItemsRepository.deleteForPlace`.
      await this.budgetItemsRepo.deleteForPlace(tid, id);
      // PL19 — `DELETE FROM places WHERE id = ?`.
      await this.placesRepo.deleteById(id);
    });
    await reclaimPhotoCache(this.photoCache, place.google_place_id, place.image_url);
    await this.reclaimPlaceImage(place.image_url);
    return { deleted: true, cancelled };
  }

  async removeMany(tripId: string, ids: number[]): Promise<{ deleted: number[]; cancelled: CancelledStays }> {
    const cancelled = noCancelledStays();
    if (ids.length === 0) return { deleted: [], cancelled };
    // Rule 21 (H1): the trip id gets the same `toRowId` treatment as
    // `remove()`'s, parsed once and reused for every id in the loop below.
    // Task 9 fix wave (A-8): the claim this comment used to make — "the
    // legacy raw bind produced the same shape, because the trip id didn't
    // affinity-match any row" — was WRONG for `1.0`/`1 ` (and other
    // SQLite-affinity-recognised spellings): the legacy statement DID match
    // those against a real trip, deleting for real. `toRowId`'s narrower
    // canonical-decimal check answers "nothing deleted" for those inputs
    // too, which is the deliberate rule-15 narrowing (not parity) — and, as
    // of this fix wave, moot in practice: `verifyTripAccess` already 404s
    // any non-canonical trip id before `removeMany` is ever reached, so this
    // `tid === null` branch only fires for a caller that skipped the gate.
    const tid = toRowId(tripId);
    if (tid === null) return { deleted: [], cancelled };
    const deleted: number[] = [];
    const reclaimable: { google_place_id: string | null; image_url: string | null }[] = [];
    await this.uow.transactional(async () => {
      for (const id of ids) {
        // PL20 — the reclaim-candidate projection, read before the delete
        // (same statement as PL17). `id` is already a genuine `number`
        // here (a body-validated array, not a route string) — no `toRowId`
        // gate needed, the H1 class of bug is a route-string problem.
        const row = await this.placesRepo.reclaimInputs(id, tid);
        if (!row) continue;
        await this.cancelStaysAt(tid, id, cancelled);
        // PL22 — Plan 3e Task 2, converted: `BudgetItemsRepository.deleteForPlace`.
        await this.budgetItemsRepo.deleteForPlace(tid, id);
        // PL21 — `DELETE FROM places WHERE id = ?`.
        await this.placesRepo.deleteById(id);
        deleted.push(id);
        reclaimable.push(row);
      }
    });
    // Reclaim after the transaction commits so isReferenced() sees the final place set.
    for (const row of reclaimable) {
      await reclaimPhotoCache(this.photoCache, row.google_place_id, row.image_url);
      await this.reclaimPlaceImage(row.image_url);
    }
    return { deleted, cancelled };
  }

  /**
   * Narrow a caller-supplied id list to the ones that really belong to the trip,
   * in input order. Callers need this before firing journeyService's place hooks:
   * those key on the place id alone, so an id from another trip would detach
   * that trip's journey entries even though the delete itself refuses it.
   */
  async scopedIds(tripId: string, ids: number[]): Promise<number[]> {
    // PL23 — input-order preservation lives in the repository method now.
    return this.placesRepo.scopedIds(tripId, ids);
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
    await this.uow.transactional(async () => {
      for (const id of ids) {
        // Bulk update sends no If-Match, so applyUpdate() never returns a
        // conflict here; the guard keeps the types honest.
        const { result: place, reclaim } = await this.applyUpdate(tripId, String(id), body);
        if (place && !isUpdateConflict(place)) updated.push(place);
        if (reclaim !== undefined) reclaims.push(reclaim);
      }
    });
    // Settle reclaims after the transaction commits, so the refcount sees the
    // final image_url state.
    for (const reclaim of reclaims) await this.reclaimPlaceImage(reclaim);
    return updated;
  }

  // -------------------------------------------------------------------------
  // Import deduplication
  // -------------------------------------------------------------------------

  /** Build a lookup of names/coords for places already in a trip. */
  private async buildDedupSet(tripId: string): Promise<DedupSet> {
    // PL24 — `PlacesRepository.listDedupInputs` replaces the raw statement
    // (Task 5 review L6 ruling). The JS dedup semantics below (name
    // lowercase+trim, coordinates only for unnamed rows, provider ids for
    // every row) are unchanged — only the read moved.
    const rows = await this.placesRepo.listDedupInputs(tripId);
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

  /**
   * The id of the place on this trip that `candidate` already is, or null.
   *
   * The public door onto the matching rule, for an importer that has to LINK to
   * the existing place rather than merely skip the candidate — the booking
   * importer needs the id so a hotel booking points at the hotel it already
   * created. `findDuplicatePlace` stays private behind it: it also hands back
   * `google_ftid` for the bulk importer's backfill, which is a detail of that
   * caller and not part of the question "which place is this?".
   */
  async findMatchingPlaceId(tripId: string, candidate: PlaceMatchCandidate): Promise<number | null> {
    return (await this.findDuplicatePlace(tripId, candidate))?.id ?? null;
  }

  /**
   * Walks the shared match strategies (`@trek/shared`, place-match.ts) against
   * the trip's rows, in order, first hit wins. The strategy list is the rule —
   * notably it offers coordinates only for an unnamed candidate, so this can no
   * longer disagree with `isPlaceDuplicate` about the restaurant and the bar at
   * the same address.
   *
   * What is shared is the ORDER, not the comparison. Two differences remain, both
   * of them older than this method and neither worth widening its scope for:
   *
   *  - The name is matched with SQLite `lower()`, which is ASCII-only, against a
   *    parameter `normalizePlaceName` lowercased in JavaScript, which is not. A
   *    row stored as `CAFÉ CENTRAL` therefore does not match the candidate
   *    `Café Central` here, while `isPlaceDuplicate` does match it in memory.
   *    Before the strategies, the coordinate fallback quietly covered that gap
   *    for a named candidate — sometimes with the wrong row, since it matched on
   *    position alone. The cost today is a `google_ftid` backfill that does not
   *    happen; the benefit is that it can no longer happen to a different place.
   *  - `buildDedupSet` collects coordinates only for UNNAMED rows, while the
   *    coordinate query below considers every row. An unnamed candidate can
   *    therefore match a named row here and not there. That is the behaviour
   *    `findMatchingPlaceId` wants — a booking with no place name should link to
   *    the hotel that has one — so it is stated rather than removed.
   */
  private async findDuplicatePlace(
    tripId: string,
    place: PlaceMatchCandidate,
  ): Promise<{ id: number; google_ftid: string | null } | null> {
    for (const strategy of placeMatchStrategies(place)) {
      let hit: { id: number; google_ftid: string | null } | undefined;
      if (strategy.by === 'externalId') {
        // PL25 — the same candidate id bound in all four positions.
        hit = await this.placesRepo.findDuplicateByExternalId(tripId, strategy.id);
      } else if (strategy.by === 'name') {
        // PL26 — `strategy.name` is already `.trim().toLowerCase()`'d in JS
        // (`normalizePlaceName`, `@trek/shared/place/place-match.ts`,
        // Unicode-aware) — the documented legacy disagreement with SQLite's
        // ASCII-only `lower()` (rule 18's exception clause: the legacy
        // statement itself received a JS-lowered value).
        hit = await this.placesRepo.findDuplicateByName(tripId, strategy.name);
      } else {
        // PL27 — `abs(lat - ?) <= ? AND abs(lng - ?) <= ?` through the Task 0b `absDifference` helper.
        hit = await this.placesRepo.findDuplicateByCoords(tripId, strategy.lat, strategy.lng, strategy.tolerance);
      }
      if (hit) return hit;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Import GPX
  // -------------------------------------------------------------------------

  async importGpx(tripId: string, fileBuffer: Buffer, opts: GpxImportOptions = {}): Promise<GpxImportResult | null> {
    const result = await this.importGpxRows(tripId, fileBuffer, opts);
    await this.colorizeImportedTracks(tripId, result);
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
  async exportGpx(tripId: string, opts: GpxExportOptions = {}): Promise<{ gpx: string; filename: string } | null> {
    // PL28 — `SELECT title FROM trips WHERE id = ?`, via
    // `TripsRepository.getTitle` directly (Task 9 fix wave, B-M2 / A-L3
    // ruling): `DatabaseService.getTripTitle` was a narrow, single-caller
    // delegation kept only because concurrent Task 4/7/8 implementers were
    // all editing this file's constructor at once — that risk is gone, so
    // it and its `entityManager()` mention are deleted, and this domain
    // injects `TripsRepository` directly like its other five repositories.
    // The legacy `if (!trip) return null` maps onto `title === null`.
    const title = await this.tripsRepo.getTitle(tripId);
    if (title === null) return null;

    // PL29 — the waypoint projection.
    const places = await this.placesRepo.listForGpx(tripId) as GpxExportPlace[];

    // One row per stop, ordered the way the day plan draws it, then folded
    // into days. PL30 — `DayAssignmentsRepository.listItineraryForGpx`.
    const stops = await this.dayAssignmentsRepo.listItineraryForGpx(tripId);

    const days = new Map<number, GpxExportDay>();
    for (const stop of stops) {
      let day = days.get(stop.day_number);
      if (!day) {
        day = { dayNumber: stop.day_number, date: stop.date, title: stop.title, points: [] };
        days.set(stop.day_number, day);
      }
      day.points.push({ name: stop.name, lat: stop.lat, lng: stop.lng });
    }

    const gpx = buildGpx({ tripTitle: title, places, days: [...days.values()] }, opts);
    return gpx ? { gpx, filename: gpxFilename(title) } : null;
  }

  private async importGpxRows(tripId: string, fileBuffer: Buffer, opts: GpxImportOptions = {}): Promise<GpxImportResult | null> {
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

    // Rule 21 / M1 (Task 9 fix wave): non-null asserted, not `?? -1` — the
    // controller's `requireTrip` (`verifyTripAccess`) already parsed and
    // gated this SAME `tripId` with `toRowId` before `importGpx` was ever
    // called, so a miss here can only mean a caller skipped the gate (see
    // `create()`'s comment for the full ruling). `buildDedupSet` keeps the
    // raw-bind seam (L6 ruling, PL24) — this does not touch it.
    const tid = toRowId(tripId)!;
    const dedup = await this.buildDedupSet(tripId);
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    // PL31/PL32 — one `insertPlace` call per waypoint. The legacy statement's
    // narrower 7-column INSERT (trip_id, name, description, lat, lng,
    // transport_mode='walking' literal, route_geometry) is reproduced as a
    // typed `insertPlace` partial: the literal becomes a value, and every
    // column the legacy INSERT omitted takes the same value the DB column
    // default would have produced (`duration_minutes: 60`, everything else
    // `null`) — parity by stored row, not by SQL text. Re-selected via
    // `findWithTagsAndRatings` INSIDE the same transaction the insert ran
    // in, so the read sees the still-uncommitted row.
    await this.uow.transactional(async () => {
      for (const wp of waypoints) {
        if (isPlaceDuplicate({ name: wp.name, lat: wp.lat, lng: wp.lng }, dedup)) {
          skipped++;
          continue;
        }
        const placeId = await this.placesRepo.insertPlace({
          trip_id: tid,
          name: wp.name,
          description: wp.description,
          lat: wp.lat,
          lng: wp.lng,
          address: null,
          category_id: null,
          price: null,
          currency: null,
          place_time: null,
          end_time: null,
          duration_minutes: 60,
          notes: null,
          image_url: null,
          google_place_id: null,
          google_ftid: null,
          osm_id: null,
          amap_poi_id: null,
          website: null,
          phone: null,
          transport_mode: 'walking',
          route_geometry: wp.routeGeometry || null,
          route_color: null,
          stop_type: null,
          fill_percent: null,
          email: null,
          opening_hours: null,
        });
        const place = (await this.placesRepo.findWithTagsAndRatings(placeId))!;
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
    await this.colorizeImportedTracks(tripId, result);
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

  async importKmlPlaces(tripId: string, fileBuffer: Buffer, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
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

    // PL33 — `CategoriesRepository.listIdName` (Plan 3a's repository).
    const categories = await this.categoriesRepo.listIdName();
    const categoryLookup = buildCategoryNameLookup(categories);
    // Rule 21 / M1 (Task 9 fix wave) — same ruling as `importGpxRows`: the
    // caller's `requireTrip` gate already `toRowId`-parsed this `tripId`.
    const tid = toRowId(tripId)!;
    const dedup = await this.buildDedupSet(tripId);
    const created: PlaceWithTags[] = [];
    let dupCount = 0;

    await this.uow.transactional(async () => {
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

        // PL34/PL35 — `insertPlace` with the legacy 8-column set (trip_id,
        // name, description, lat, lng, category_id, transport_mode='walking'
        // literal, route_geometry); every omitted column takes its DB-default
        // value. Re-selected via `findWithTagsAndRatings` INSIDE the same
        // transaction.
        const placeId = await this.placesRepo.insertPlace({
          trip_id: tid,
          name,
          description: parsedPlacemark.description,
          lat: parsedPlacemark.lat,
          lng: parsedPlacemark.lng,
          address: null,
          category_id: categoryId,
          price: null,
          currency: null,
          place_time: null,
          end_time: null,
          duration_minutes: 60,
          notes: null,
          image_url: null,
          google_place_id: null,
          google_ftid: null,
          osm_id: null,
          amap_poi_id: null,
          website: null,
          phone: null,
          transport_mode: 'walking',
          route_geometry: parsedPlacemark.routeGeometry,
          route_color: null,
          stop_type: null,
          fill_percent: null,
          email: null,
          opening_hours: null,
        });

        const place = (await this.placesRepo.findWithTagsAndRatings(placeId))!;
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
  private async colorizeImportedTracks(tripId: string, result: { places: ImportedPlace[] } | null): Promise<void> {
    const tracks = result?.places?.filter((p) => p.route_geometry && !p.route_color) ?? [];
    if (tracks.length === 0) return;

    // PL36+PL37 — read (`distinctRouteColors`) and write (`setRouteColor`) in
    // ONE transaction so two concurrent imports cannot both read the same set
    // of free colours.
    await this.uow.transactional(async () => {
      const taken = new Set(await this.placesRepo.distinctRouteColors(tripId));
      const free = TRACK_COLORS.filter((c) => !taken.has(c));
      for (const [i, track] of tracks.entries()) {
        // Free ones first, then wrap through the whole palette — never reuse a
        // free colour twice within the same import.
        const color = i < free.length ? free[i] : TRACK_COLORS[(i - free.length) % TRACK_COLORS.length];
        await this.placesRepo.setRouteColor(track.id, color);
        track.route_color = color;
      }
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

    // A route, once the redirect is followed. The dispatch upstream decides on
    // the raw URL, and a short link's path is `/<code>` — it matches nothing, so
    // every route shared from the Google Maps app arrived here and was answered
    // with "could not extract list ID", which is the complaint the directions
    // import was written to remove. The Share sheet on a phone produces exactly
    // this shape, and the box says a directions link works.
    //
    // Handed on with the resolved URL, so the hop is not made twice.
    if (isDirectionsUrl(resolvedUrl)) {
      return this.importGoogleDirections(tripId, resolvedUrl, opts);
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

    const { created, skipped } = await this.storeGooglePlaces(tripId, places);

    if (created.length) {
      void this.enrichImportedList(tripId, created as EnrichablePlace[], opts);
    }

    return { places: created, listName, skipped };
  }

  /**
   * The insert half every Google-shaped import shares: dedupe, write, collect.
   *
   * One implementation for the list and for the directions link, because the rules are
   * the same rules — a place already on the trip is skipped rather than doubled, and a
   * row that matches but carries no provider id is given the one this import knows.
   */
  private async storeGooglePlaces(
    tripId: string,
    places: { name: string; lat: number; lng: number; notes: string | null; googleFtid: string | null }[],
  ): Promise<{ created: PlaceWithTags[]; skipped: number }> {
    // Rule 21 / M1 (Task 9 fix wave) — same ruling as `importGpxRows`: the
    // caller's `requireTrip` gate already `toRowId`-parsed this `tripId`.
    const tid = toRowId(tripId)!;
    const dedup = await this.buildDedupSet(tripId);
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    await this.uow.transactional(async () => {
      for (const p of places) {
        // One candidate for both halves. Passing the raw parser object to the SQL
        // half used to mean its provider id never arrived — the field is
        // `googleFtid` there and `google_ftid` here — so the id strategy was
        // always empty and the name could match a different row, which then took
        // this candidate's ftid on the backfill below.
        const candidate = { name: p.name, lat: p.lat, lng: p.lng, google_ftid: p.googleFtid };
        if (isPlaceDuplicate(candidate, dedup)) {
          const duplicate = await this.findDuplicatePlace(tripId, candidate);
          // PL39 — `backfillFtid`, unscoped by trip (matching the legacy
          // statement — `duplicate` was already resolved against this trip).
          if (duplicate && !duplicate.google_ftid && p.googleFtid) {
            await this.placesRepo.backfillFtid(duplicate.id, p.googleFtid);
          }
          skipped++;
          continue;
        }
        // PL38/PL40 — `insertPlace` with the legacy 7-column set (trip_id,
        // name, lat, lng, notes, google_ftid, transport_mode='walking'
        // literal); every omitted column takes its DB-default value.
        // Re-selected via `findWithTagsAndRatings` INSIDE the same
        // transaction.
        const placeId = await this.placesRepo.insertPlace({
          trip_id: tid,
          name: p.name,
          description: null,
          lat: p.lat,
          lng: p.lng,
          address: null,
          category_id: null,
          price: null,
          currency: null,
          place_time: null,
          end_time: null,
          duration_minutes: 60,
          notes: p.notes,
          image_url: null,
          google_place_id: null,
          google_ftid: p.googleFtid,
          osm_id: null,
          amap_poi_id: null,
          website: null,
          phone: null,
          transport_mode: 'walking',
          route_geometry: null,
          route_color: null,
          stop_type: null,
          fill_percent: null,
          email: null,
          opening_hours: null,
        });
        const place = (await this.placesRepo.findWithTagsAndRatings(placeId))!;
        created.push(place);
        trackInsertedInDedupSet(candidate, dedup);
      }
    });
    return { created, skipped };
  }

  // -------------------------------------------------------------------------
  // Import a shared Google Maps directions link
  // -------------------------------------------------------------------------

  /**
   * The stops of a route somebody else planned.
   *
   * The other half of the request the list import answers: people share a drive far more
   * often than they share a list, and until now a pasted `/maps/dir/` link came back as a
   * cryptic "could not extract list ID". No API key is involved and no call is made to
   * Google for the link itself — the stops are in the URL, which is the whole reason
   * this is possible at all.
   *
   * A stop the link spells out in coordinates is taken as it stands; one that is only a
   * name is geocoded, one request each. A name nobody can place is left out rather than
   * failing the import, because a route of six stops with five findable is five stops
   * more than the traveller had.
   */
  async importGoogleDirections(tripId: string, url: string, opts?: ListImportOptions): Promise<ListImportResult | ListImportError> {
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    let parsed: URL;
    try { parsed = new URL(url); } catch { return { error: 'Invalid URL', status: 400 }; }

    // Short links are resolved hop by hop through the guard, exactly as the list import
    // does it: a maps.app.goo.gl that 302s to an internal address is still blocked.
    let resolvedUrl = url;
    if (GOOGLE_SHORT_HOSTS.includes(parsed.hostname)) {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    // Checked after resolving, not before: the host that counts is the one the link lands
    // on, and `/maps/dir/` is a path anybody could serve.
    let host = '';
    try { host = new URL(resolvedUrl).hostname; } catch { /* an unparseable hop fails the check below */ }
    if (!isGoogleMapsHost(host)) {
      return { error: 'That link is not a Google Maps link.', status: 400 };
    }

    const waypoints = parseDirectionsUrl(resolvedUrl);
    if (waypoints.length < 2) {
      return { error: 'Could not read any stops from that directions link. Open the route in Google Maps and use its Share button.', status: 400 };
    }

    const places: { name: string; lat: number; lng: number; notes: string | null; googleFtid: string | null }[] = [];
    let unplaceable = 0;
    for (const wp of waypoints) {
      if (wp.lat !== null && wp.lng !== null) {
        // A stop written as coordinates has no name of its own, and the coordinates are a
        // better label than "Stop 3": they are what the traveller can look up.
        places.push({
          name: wp.name || `${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}`,
          lat: wp.lat,
          lng: wp.lng,
          notes: null,
          googleFtid: null,
        });
        continue;
      }
      if (!wp.name) continue;
      try {
        // Through geocodeQuery, which asks the TREK index first and only falls
        // through to Nominatim for what it does not know — and does so on the
        // BACKGROUND lane. That matters here more than anywhere: this loop runs
        // up to thirty times in one request, each Nominatim call taking the next
        // slot on a 1.1 s process-wide throttle, so on the interactive lane one
        // pasted link made everybody else's place search queue behind it for
        // half a minute. An index hit costs no slot at all.
        const hit = await this.maps.geocodeQuery(wp.name);
        // The name from the link, not the one the geocoder answers with: somebody who
        // typed a nickname into Google should not find a street address on their trip.
        if (hit) places.push({ name: wp.name, lat: hit.lat, lng: hit.lng, notes: null, googleFtid: null });
        else unplaceable++;
      } catch {
        // A geocoder that is down or rate-limited costs this one stop, not the import.
        unplaceable++;
      }
    }

    if (places.length < 2) {
      return { error: 'None of the stops in that link could be placed on the map.', status: 400 };
    }

    const { created, skipped } = await this.storeGooglePlaces(tripId, places);
    if (created.length) {
      void this.enrichImportedList(tripId, created as EnrichablePlace[], opts);
    }

    // The route reads as what it is in the toast: where it starts and where it ends.
    const listName = `${places[0].name} → ${places[places.length - 1].name}`;
    // Both kinds of "not added" under one number, because from the traveller's side they
    // are one thing: this many stops in the link are not on the trip.
    return { places: created, listName, skipped: skipped + unplaceable };
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

    // Rule 21 / M1 (Task 9 fix wave) — same ruling as `importGpxRows`: the
    // caller's `requireTrip` gate already `toRowId`-parsed this `tripId`.
    const tid = toRowId(tripId)!;
    const dedup = await this.buildDedupSet(tripId);
    const created: PlaceWithTags[] = [];
    let skipped = 0;
    // PL41/PL42 — `insertPlace` with the legacy 7-column set (trip_id, name,
    // lat, lng, address, notes, transport_mode='walking' literal); every
    // omitted column takes its DB-default value. Re-selected via
    // `findWithTagsAndRatings` INSIDE the same transaction.
    await this.uow.transactional(async () => {
      for (const p of places) {
        if (isPlaceDuplicate({ name: p.name, lat: p.lat, lng: p.lng }, dedup)) {
          skipped++;
          continue;
        }
        const placeId = await this.placesRepo.insertPlace({
          trip_id: tid,
          name: p.name,
          description: null,
          lat: p.lat,
          lng: p.lng,
          address: p.address,
          category_id: null,
          price: null,
          currency: null,
          place_time: null,
          end_time: null,
          duration_minutes: 60,
          notes: p.notes,
          image_url: null,
          google_place_id: null,
          google_ftid: null,
          osm_id: null,
          amap_poi_id: null,
          website: null,
          phone: null,
          transport_mode: 'walking',
          route_geometry: null,
          route_color: null,
          stop_type: null,
          fill_percent: null,
          email: null,
          opening_hours: null,
        });
        const place = (await this.placesRepo.findWithTagsAndRatings(placeId))!;
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

    // Rule 21 / M1 (Task 9 fix wave): non-null asserted — this whole path
    // only ever runs right after this service's own import, downstream of
    // the controller's `requireTrip` gate, which already `toRowId`-parsed
    // this same `tripId` once. Deliberately NOT applied to
    // `this.realtime.broadcast` below: every broadcast call in this domain,
    // controller included, keys the room by the raw route string, and
    // changing this one call's room shape alone would desync it from what
    // the client actually joined.
    const tid = toRowId(tripId)!;

    // Asked for a Google identity rather than for the best answer: the whole
    // point here is the `google_place_id` that `pickEnrichmentMatch` selects on,
    // and the TREK index and OpenStreetMap have none to give. Without this the
    // search returns index records, every candidate is discarded for a missing
    // id, and the import quietly stays unenriched on an instance with a key.
    const { places: results } = await this.maps.searchPlaces(
      userId,
      place.name,
      lang,
      { lat: place.lat, lng: place.lng, radius: SEARCH_BIAS_RADIUS_METERS },
      { googleIdentityOnly: true },
    );
    const match = pickEnrichmentMatch(results, { lat: place.lat, lng: place.lng });
    if (!match) return;

    const gpid = trimOrNull(match.google_place_id);
    if (!gpid) return;
    const gftid = trimOrNull(match.google_ftid);

    // PL43 — `fillIfEmpty`, COALESCE-per-column so enrichment only fills
    // empty columns — never overwrites data the import already captured
    // (e.g. Naver's address) or anything the user edited.
    await this.placesRepo.fillIfEmpty(place.id, tid, {
      google_place_id: gpid,
      google_ftid: gftid,
      address: trimOrNull(match.address),
      website: trimOrNull(match.website),
      phone: trimOrNull(match.phone),
    });

    // Photo is best-effort: Google often has none, in which case getPlacePhoto
    // resolves with photoUrl: null. A missing photo (or a provider outage, which
    // still throws) must never abort the rest of the enrichment.
    try {
      const photo = await this.maps.getPlacePhoto(userId, gpid, place.lat, place.lng, place.name);
      if (photo?.photoUrl) {
        // PL44 — `fillIfEmpty`, the `image_url`-only shape.
        await this.placesRepo.fillIfEmpty(place.id, tid, { image_url: photo.photoUrl });
      }
    } catch {
      /* no photo — leave image_url as-is */
    }

    // PL45 — push the enriched row to every connected client (no socket
    // exclusion: the importer's own client should also receive the late
    // update — `socketId: undefined`, no `X-Socket-Id` to exclude).
    const updated = await this.placesRepo.findWithTagsAndRatings(place.id);
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
      if (!(await this.maps.getMapsKey(userId))) return;
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
   * The Google pass for places a file brought in (#2536). Only its points: a track
   * or a drawn path is a line, and looking a line up by its name finds a stranger.
   * Detached like the list imports, and just as quietly a no-op without a key.
   */
  enrichImportedFilePlaces(tripId: string, userId: number, places: ImportedPlace[]): void {
    const points = (places as (ImportedPlace & EnrichablePlace)[]).filter(p => !p.route_geometry);
    void this.enrichImportedPlaces(tripId, userId, points);
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
      // Rule 21 / M1 (Task 9 fix wave) — same ruling as `enrichOne`.
      const tid = toRowId(tripId)!;
      // Serial on purpose: the background lane throttles to roughly one request a
      // second anyway, so concurrency would only build a queue.
      for (const place of pending) {
        try {
          const { address } = await this.maps.reverseGeocode(String(place.lat), String(place.lng), lang, {
            lane: 'background',
            timeoutMs: 10000,
          });
          if (!address) continue;
          // PL46 — `fillIfEmpty`, the `address`-only shape.
          await this.placesRepo.fillIfEmpty(place.id, tid, { address });
          // PL47 — same broadcast shape as PL45: `socketId: undefined`, no
          // exclusion.
          const updated = await this.placesRepo.findWithTagsAndRatings(place.id);
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
    // `toRowId` first (Task 3 review H1, absorbed here) — same gate shape
    // as every other place-id route in this service.
    const id = toRowId(placeId);
    if (id === null) return { error: 'Place not found', status: 404 };
    // Rule 21 (H1): the trip id gets the same `toRowId` treatment as the
    // place id above, parsed once and used for the one downstream read —
    // `Number(tripId)` used to disagree with it and let a hex trip id read
    // a different trip's place.
    const tid = toRowId(tripId);
    if (tid === null) return { error: 'Place not found', status: 404 };
    // PL48 — same statement as PL9 (`applyUpdate`'s pre-image read).
    const place = await this.placesRepo.findInTrip(id, tid);
    if (!place) return { error: 'Place not found', status: 404 };

    return this.unsplash.searchUnsplashPhotos(place.name + (place.address ? ' ' + place.address : ''), 5, await this.unsplash.getUnsplashKey(userId));
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
  async rate(tripId: string, placeId: string, userId: number, rating: number | null): Promise<PlaceWithTags | null> {
    // `toRowId` first (Task 3 review H1, absorbed here): PL50/PL51 write
    // with this SAME id — a non-canonical `placeId` must resolve to "not
    // found" here rather than pass a loose affinity match and then write a
    // rating against an id `place_ratings`'s own FK never actually named.
    const id = toRowId(placeId);
    if (id === null) return null;
    // Rule 21 (H1): the trip id gets the same `toRowId` treatment as the
    // place id above, parsed once and used for the existence gate below —
    // `Number(tripId)` used to disagree with it and let a hex trip id rate
    // a different trip's place.
    const tid = toRowId(tripId);
    if (tid === null) return null;
    // PL49 — the existence gate.
    if (!(await this.placesRepo.existsInTrip(id, tid))) return null;
    if (rating === null) {
      // PL50 — `DELETE FROM place_ratings WHERE place_id = ? AND user_id = ?`.
      await this.placeRatingsRepo.deleteRating(id, userId);
    } else {
      // PL51 — the only explicit `ON CONFLICT … DO UPDATE` in the cluster; never touches `places.updated_at`.
      await this.placeRatingsRepo.upsertRating(id, userId, rating);
    }
    // PL52 — `findWithTagsAndRatings` replaces the `getPlaceWithTags` delegation.
    return await this.placesRepo.findWithTagsAndRatings(id);
  }

  // Journey hooks — non-fatal, mirroring the route's try/catch wrappers.
  async onCreated(tripId: string, placeId: number): Promise<void> {
    try {
      await this.journey.onPlaceCreated(Number(tripId), placeId);
    } catch { /* non-fatal */ }
  }
  async onUpdated(placeId: number): Promise<void> {
    try {
      await this.journey.onPlaceUpdated(placeId);
    } catch { /* non-fatal */ }
  }
  async onDeleted(placeId: number): Promise<void> {
    try {
      await this.journey.onPlaceDeleted(placeId);
    } catch { /* non-fatal */ }
  }
}
