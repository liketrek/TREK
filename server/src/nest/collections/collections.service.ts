import { Categories } from '../../db/entities/Categories.entity';
import { CollectionLabels } from '../../db/entities/CollectionLabels.entity';
import { CollectionMembers } from '../../db/entities/CollectionMembers.entity';
import { CollectionPlaceRatings } from '../../db/entities/CollectionPlaceRatings.entity';
import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { Collections } from '../../db/entities/Collections.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { Places } from '../../db/entities/Places.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { CategoriesRepository } from '../../db/repositories/Categories.repository';
import { CollectionLabelsRepository } from '../../db/repositories/CollectionLabels.repository';
import { CollectionMembersRepository } from '../../db/repositories/CollectionMembers.repository';
import { CollectionPlaceRatingsRepository } from '../../db/repositories/CollectionPlaceRatings.repository';
import {
  CollectionPlacesRepository,
  type CollectionPlaceCopyRow,
} from '../../db/repositories/CollectionPlaces.repository';
import { CollectionsRepository, type CollectionPlaceRow } from '../../db/repositories/Collections.repository';
import type { PlaceRatingsRepository } from '../../db/repositories/PlaceRatings.repository';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TagsRepository } from '../../db/repositories/Tags.repository';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { resolveCollectionRole, type CollectionRole } from '../../db/repositories/_shared/collection-role';
import { UnitOfWork } from '../database/unit-of-work';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { isUploadedPlaceImage } from '../places/place-image';
import {
  COORD_DEDUP_TOLERANCE,
  externalIdsOf,
  isPlaceDuplicate,
  trackInsertedInDedupSet,
  type DedupSet,
} from '../places/places.helpers';
import { RealtimeService } from '../realtime/realtime.service';
import { StorageService } from '../storage/storage.service';
import { collectionFileToGpx, gpxToCollectionFile, type ExportedCollectionFile } from './collection-gpx.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  placeMatchStrategies,
  collectionFilePlaceSchema,
  COLLECTION_FILE_FORMAT,
  COLLECTION_FILE_VERSION,
  MAX_COLLECTION_FILE_LABELS,
  type PlaceMatchCandidate,
  type CollectionFileLabel,
  type CollectionFilePlace,
  type CollectionFile,
  type CollectionImportRequest,
  type CollectionImportIntoRequest,
  type CollectionImportResult,
  type CollectionGpxExport,
  type CollectionGpxReadRequest,
  type CollectionGpxReadResult,
} from '@trek/shared';
import type {
  Collection,
  CollectionDetailResponse,
  CollectionListResponse,
  CollectionMember,
  CollectionMembership,
  CollectionPlace,
  CollectionLink,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionSavePlaceRequest,
  CollectionSaveResult,
  CollectionCopyToTripRequest,
  CollectionPlaceUpdateRequest,
  CollectionStatus,
  CollectionLabel,
  CollectionImportablesResponse,
} from '@trek/shared';

import path from 'path';

/** Links are stored as a JSON TEXT column; parse on read, stringify on write. */
function parseLinks(raw: unknown): CollectionLink[] | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as CollectionLink[]) : undefined;
  } catch {
    return undefined;
  }
}

function serializeLinks(links: CollectionLink[] | undefined): string | null {
  return links && links.length ? JSON.stringify(links) : null;
}

// ---------------------------------------------------------------------------
// Errors — thrown as plain Errors carrying a status; TrekExceptionFilter maps
// `err.status` → that HTTP code with an `{ error: message }` body.
// ---------------------------------------------------------------------------

function httpError(status: number, message: string): never {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  throw err;
}

/** Re-exported under this service's historical name — the underlying type
 *  now lives in `_shared/collection-role.ts` (R6), the ONE shared predicate
 *  `isVisible`/`isOwner`/`roleOf` all resolve through. */
export type EffectiveRole = CollectionRole;

type PlaceRow = CollectionPlaceRow;

const MAX_LABELS_PER_COLLECTION = 50;

/**
 * Collections domain service — owns the collections SQL (moved 1:1 from the
 * legacy services/collectionsService.ts: identical statements, the `??`
 * defaults, the post-write re-selects, the exact error strings and the
 * per-user broadcast fan-outs). The `place_edit` trip permission (copyToTrip)
 * goes through PermissionsService; per-user WebSocket delivery goes through
 * RealtimeService; the notification send in sendInvite goes through an injected
 * NotificationsService (collab precedent).
 */
@Injectable()
export class CollectionsService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Collections) private readonly collectionsRepo: CollectionsRepository,
    @InjectRepository(CollectionMembers) private readonly members: CollectionMembersRepository,
    @InjectRepository(CollectionLabels) private readonly labels: CollectionLabelsRepository,
    @InjectRepository(Categories) private readonly categories: CategoriesRepository,
    // Plan 3h Task 2 (part B) — savePlace onward. `collectionPlaces`/
    // `collectionPlaceRatings` own this service's own two remaining tables;
    // `trips`/`tripMembers`/`tripPlaces`/`tripPlaceRatings`/`tags`/`users`
    // are 3b/3c's, injected directly (AP1-AP6 each become a
    // `TripsRepository.findAccessible` call, replacing `this.db.canAccessTrip`).
    @InjectRepository(CollectionPlaces) private readonly collectionPlaces: CollectionPlacesRepository,
    @InjectRepository(CollectionPlaceRatings) private readonly collectionPlaceRatings: CollectionPlaceRatingsRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(TripMembers) private readonly tripMembers: TripMembersRepository,
    @InjectRepository(Places) private readonly tripPlaces: PlacesRepository,
    @InjectRepository(PlaceRatings) private readonly tripPlaceRatings: PlaceRatingsRepository,
    @InjectRepository(Tags) private readonly tags: TagsRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  /**
   * Reclaim a replaced cover object (mirrors tripService.deleteOldCover — kept
   * local so this service doesn't pull the trips import graph). Collection +
   * trip covers share the 'covers' category; basename() tolerates the stored
   * /uploads/covers/<name> URL form and any external URL the client saved
   * (central key validation rejects hostile values; the catch swallows them
   * like the old containment guard did).
   */
  private async deleteOldCollectionCover(coverImage: string | null | undefined): Promise<void> {
    if (!coverImage) return;
    await this.storage.delete('covers', path.basename(coverImage)).catch(() => {
      /* external URL or already gone */
    });
  }

  // -------------------------------------------------------------------------
  // Visibility — a user may see/edit a collection if they own it OR are an
  // accepted member. Every read/write goes through assertAccess.
  // -------------------------------------------------------------------------

  async accessibleCollectionIds(userId: number): Promise<number[]> {
    return this.collectionsRepo.accessibleCollectionIds(userId);
  }

  /** R6 — CL2/CL3/CL4 collapse onto the ONE shared predicate in `_shared/collection-role.ts`. */
  private async isVisible(userId: number, collectionId: number): Promise<boolean> {
    return (await resolveCollectionRole(this.collectionsRepo, this.members, collectionId, userId)) !== null;
  }

  async assertAccess(userId: number, collectionId: number): Promise<void> {
    if (!(await this.isVisible(userId, collectionId))) httpError(404, 'Collection not found');
  }

  async isOwner(userId: number, collectionId: number): Promise<boolean> {
    return (await resolveCollectionRole(this.collectionsRepo, this.members, collectionId, userId)) === 'owner';
  }

  /** The viewer's effective permission on a list: owner (full), or their accepted
   *  member role, or null when they have no access. */
  async roleOf(userId: number, collectionId: number): Promise<EffectiveRole> {
    return resolveCollectionRole(this.collectionsRepo, this.members, collectionId, userId);
  }

  /** Add/edit a place — owner, admin or editor. 404 hides lists you can't see,
   *  403 for a read-only (viewer) member. */
  async assertCanEdit(userId: number, collectionId: number): Promise<void> {
    const r = await this.roleOf(userId, collectionId);
    if (r === null) httpError(404, 'Collection not found');
    if (r === 'viewer') httpError(403, 'You have read-only access to this list');
  }

  /** Delete a place — owner or admin only. */
  async assertCanDelete(userId: number, collectionId: number): Promise<void> {
    const r = await this.roleOf(userId, collectionId);
    if (r === null) httpError(404, 'Collection not found');
    if (r !== 'owner' && r !== 'admin') httpError(403, 'Only an admin can delete places from this list');
  }

  private async ownerOf(collectionId: number): Promise<number> {
    const ownerId = await this.collectionsRepo.ownerId(collectionId);
    if (ownerId === undefined) httpError(404, 'Collection not found');
    return ownerId;
  }

  // -------------------------------------------------------------------------
  // Hydration helpers
  // -------------------------------------------------------------------------

  private async loadTagsByCollectionPlaceIds(
    placeIds: number[],
  ): Promise<Record<number, { id: number; name: string; color: string }[]>> {
    const out: Record<number, { id: number; name: string; color: string }[]> = {};
    const rows = await this.collectionsRepo.loadTagsByPlaceIds(placeIds);
    for (const r of rows) {
      if (!out[r.pid]) out[r.pid] = [];
      out[r.pid].push({ id: r.id, name: r.name, color: r.color });
    }
    return out;
  }

  /** A list's own label definitions, in display order. */
  private async loadLabelsByCollection(collectionId: number): Promise<CollectionLabel[]> {
    return this.labels.listByCollection(collectionId);
  }

  /** Assigned label ids per place, batched (mirrors loadTagsByCollectionPlaceIds). */
  private async loadLabelIdsByPlaceIds(placeIds: number[]): Promise<Record<number, number[]>> {
    const out: Record<number, number[]> = {};
    const rows = await this.collectionsRepo.loadLabelIdsByPlaceIds(placeIds);
    for (const r of rows) {
      if (!out[r.pid]) out[r.pid] = [];
      out[r.pid].push(r.label_id);
    }
    return out;
  }

  /** Per-voter rating rows (#1435), batched (mirrors loadTagsByCollectionPlaceIds). */
  private async loadRatingsByCollectionPlaceIds(
    placeIds: number[],
  ): Promise<Record<number, { user_id: number; username: string; avatar: string | null; rating: number }[]>> {
    const out: Record<number, { user_id: number; username: string; avatar: string | null; rating: number }[]> = {};
    const rows = await this.collectionsRepo.loadRatingsByPlaceIds(placeIds);
    for (const { pid, ...rest } of rows) {
      if (!out[pid]) out[pid] = [];
      out[pid].push(rest);
    }
    return out;
  }

  private async hydratePlaces(rows: PlaceRow[]): Promise<CollectionPlace[]> {
    const ids = rows.map((r) => r.id);
    const tagsByPlace = await this.loadTagsByCollectionPlaceIds(ids);
    const labelsByPlace = await this.loadLabelIdsByPlaceIds(ids);
    const ratingsByPlace = await this.loadRatingsByCollectionPlaceIds(ids);
    return rows.map((r) => {
      const { category_name, category_color, category_icon, ...rest } = r;
      const ratings = ratingsByPlace[r.id] || [];
      return {
        ...rest,
        links: parseLinks((r as { links?: unknown }).links),
        category: r.category_id
          ? { id: r.category_id, name: category_name ?? '', color: category_color ?? null, icon: category_icon ?? null }
          : undefined,
        tags: tagsByPlace[r.id] || [],
        label_ids: labelsByPlace[r.id] || [],
        ratings,
        rating_avg: ratings.length > 0 ? ratings.reduce((s, x) => s + x.rating, 0) / ratings.length : null,
        rating_count: ratings.length,
      } as CollectionPlace;
    });
  }

  private async getPlaceById(placeId: number): Promise<CollectionPlace> {
    const row = await this.collectionsRepo.findPlaceRowById(placeId);
    if (!row) httpError(404, 'Place not found');
    return (await this.hydratePlaces([row]))[0];
  }

  private async collectionIdOfPlace(placeId: number): Promise<number> {
    const collectionId = await this.collectionsRepo.collectionIdOfPlace(placeId);
    if (collectionId === undefined) httpError(404, 'Place not found');
    return collectionId;
  }

  private async buildMembers(collectionId: number): Promise<CollectionMember[]> {
    const owner = await this.members.ownerRow(collectionId);
    const memberRows = await this.members.memberRows(collectionId);
    const result: CollectionMember[] = [];
    if (owner) result.push({ ...owner, status: 'accepted', role: 'admin', is_owner: true });
    for (const m of memberRows) result.push({ ...m, is_owner: false } as CollectionMember);
    return result;
  }

  private async getCollectionRow(id: number): Promise<Collection> {
    const col = await this.collectionsRepo.findRow(id);
    if (!col) httpError(404, 'Collection not found');
    const placeCount = await this.collectionsRepo.placeCount(id);
    return {
      ...col,
      links: parseLinks(col.links),
      place_count: placeCount,
      members: await this.buildMembers(id),
    } as Collection;
  }

  // -------------------------------------------------------------------------
  // Lists CRUD
  // -------------------------------------------------------------------------

  async listCollections(userId: number): Promise<CollectionListResponse> {
    const ids = await this.accessibleCollectionIds(userId);
    const collections: Collection[] = (
      await Promise.all(
        ids.map(async (id) => {
          const col = await this.getCollectionRow(id);
          return { ...col, is_owner: col.owner_id === userId };
        }),
      )
    ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);

    const incomingInvites = (await this.members.pendingInvitesForUser(userId)).map((r) => ({
      collection_id: r.collection_id,
      name: r.name,
      from: { id: r.from_id, username: r.from_username },
    }));

    return { collections, incomingInvites };
  }

  async getCollection(userId: number, id: number): Promise<CollectionDetailResponse> {
    await this.assertAccess(userId, id);
    const collection = await this.getCollectionRow(id);
    const rows = await this.collectionsRepo.listPlaceRows(id);
    return {
      collection: {
        ...collection,
        is_owner: collection.owner_id === userId,
        labels: await this.loadLabelsByCollection(id),
      },
      places: await this.hydratePlaces(rows),
    };
  }

  // -------------------------------------------------------------------------
  // Export / import as a file (#2198)
  // -------------------------------------------------------------------------

  /**
   * A list as a portable file.
   *
   * Built here rather than in the browser from what the page happens to hold,
   * for two reasons: the read is access-checked like every other read, and the
   * decision about what may leave the instance is one decision in one place
   * instead of whatever the client forgot to strip. The contract in
   * `collection-file.schema.ts` says what travels and why.
   *
   * Any member may export. A list is shared with somebody so they can use it,
   * and a viewer who can read all of this on screen loses nothing by having it
   * as a file; what a viewer must not do is write, which no export does.
   */
  async exportCollection(userId: number, id: number): Promise<ExportedCollectionFile> {
    await this.assertAccess(userId, id);
    const collection = await this.getCollectionRow(id);
    const labels = await this.loadLabelsByCollection(id);
    const labelNameById = new Map(labels.map((l) => [l.id, l.name]));

    const rows = await this.collectionsRepo.listPlaceRows(id);
    const labelIdsByPlace = await this.loadLabelIdsByPlaceIds(rows.map((r) => r.id));

    const places: CollectionFilePlace[] = rows.map((row) => ({
      name: row.name,
      description: row.description ?? null,
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      address: row.address ?? null,
      notes: row.notes ?? null,
      price: row.price ?? null,
      currency: row.currency ?? null,
      website: row.website ?? null,
      phone: row.phone ?? null,
      // Only an absolute https URL survives: a /uploads path resolves on this
      // server, not the reader's. See the note in the file contract.
      image_url: typeof row.image_url === 'string' && /^https:\/\//i.test(row.image_url) ? row.image_url : null,
      google_place_id: row.google_place_id ?? null,
      google_ftid: row.google_ftid ?? null,
      osm_id: row.osm_id ?? null,
      status: row.status as CollectionStatus,
      links: parseLinks((row as { links?: unknown }).links),
      category: row.category_name ?? null,
      labels: (labelIdsByPlace[row.id] || []).map((lid) => labelNameById.get(lid)).filter((n): n is string => !!n),
    }));

    return {
      format: COLLECTION_FILE_FORMAT,
      version: COLLECTION_FILE_VERSION,
      name: collection.name,
      description: collection.description ?? null,
      color: collection.color ?? null,
      icon: collection.icon ?? null,
      exported_at: new Date().toISOString(),
      labels: labels.map((l) => ({ name: l.name, color: l.color ?? null })),
      places,
    };
  }

  /**
   * The list as GPX (#2301), written from the very file the export above
   * returns. What may leave the instance is decided once, there, and a GPX can
   * only ever carry less of it. Same access rule too, since it is the same read.
   */
  async exportCollectionGpx(userId: number, id: number): Promise<CollectionGpxExport> {
    return collectionFileToGpx(await this.exportCollection(userId, id));
  }

  /**
   * A GPX document read into the list file it amounts to. Touches no table:
   * the file goes back to the browser to be shown, and comes back through
   * importCollection like any other, so there is one import and one
   * transaction whatever the format was.
   */
  readCollectionGpx(body: CollectionGpxReadRequest): CollectionGpxReadResult {
    return gpxToCollectionFile(body.gpx, body.file_name);
  }

  /**
   * Read a file back as a new list of the caller's own.
   *
   * The places go in through the same INSERT the rest of the service uses,
   * inside one transaction, so a file that fails halfway leaves nothing
   * behind. Each place is re-validated against the file contract on the way
   * in — the body was validated once at the pipe, and this is the second pass
   * that lets one bad row be dropped instead of failing the whole import.
   *
   * A new list is empty, so every place in the file is written and the answer
   * carries no duplicate count. Adding to a list that already exists is
   * importIntoCollection below.
   */
  async importCollection(userId: number, body: CollectionImportRequest): Promise<CollectionImportResult> {
    const file = body.file;
    const name = (body.name ?? file.name).trim().slice(0, 120) || file.name;

    const result = await this.uow.transactional(async () => {
      const collection = await this.createCollection(userId, {
        name,
        description: file.description ?? null,
        color: file.color ?? undefined,
        icon: file.icon ?? undefined,
      });
      const labels = await this.labelIdsForFile(collection.id, file.labels);
      const counts = await this.writeFilePlaces(collection.id, userId, file, labels.byName, { skipDuplicates: false });
      return { collectionId: collection.id, ...counts };
    });

    const collection = await this.getCollectionRow(result.collectionId);
    return {
      collection: { ...collection, is_owner: true, labels: await this.loadLabelsByCollection(result.collectionId) },
      imported: result.imported,
      skipped: result.skipped,
    };
  }

  /**
   * Read the same file into a list that already exists (#2301 follow-up).
   *
   * Only ever adds. A place the list already holds, by the rule a single save
   * uses (provider id, then name, then position), is counted and left exactly
   * as it is: its status, notes, rating and labels belong to the people on the
   * list, and a file is not a reason to overwrite them. The list keeps its own
   * name, colour, icon and description too; what the file says about those is
   * about the list it came from.
   *
   * Editing rights, not ownership: whoever may add a place here may add a file
   * of them, and everyone on the list sees the result at once.
   */
  async importIntoCollection(
    userId: number,
    id: number,
    body: CollectionImportIntoRequest,
    socketId?: string,
  ): Promise<CollectionImportResult> {
    await this.assertCanEdit(userId, id);
    const file = body.file;

    const result = await this.uow.transactional(async () => {
      const labels = await this.labelIdsForFile(id, file.labels);
      const counts = await this.writeFilePlaces(id, userId, file, labels.byName, { skipDuplicates: true });
      return { ...counts, labelsCreated: labels.created };
    });

    // A file whose places were all already there can still have brought a label
    // with it, and that is a change the other members should see.
    if (result.imported > 0 || result.labelsCreated > 0) {
      await this.notifyCollectionUsers(id, socketId, 'collections:updated');
    }
    const collection = await this.getCollectionRow(id);
    return {
      collection: {
        ...collection,
        is_owner: collection.owner_id === userId,
        labels: await this.loadLabelsByCollection(id),
      },
      imported: result.imported,
      skipped: result.skipped,
      duplicates: result.duplicates,
    };
  }

  /**
   * The file's labels as ids in this list: the ones it already has, matched by
   * name, plus the ones it does not, created in the file's order. A file never
   * renames or recolours a label that is already there.
   */
  private async labelIdsForFile(
    collectionId: number,
    labels: CollectionFileLabel[] | undefined,
  ): Promise<{ byName: Map<string, number>; created: number }> {
    const byName = new Map<string, number>();
    for (const row of await this.labels.idNameByCollection(collectionId)) {
      byName.set(row.name.trim().toLowerCase(), row.id);
    }
    let sortOrder = (await this.labels.maxSortOrder(collectionId)) + 1;
    let created = 0;
    for (const label of (labels ?? []).slice(0, MAX_COLLECTION_FILE_LABELS)) {
      const key = label.name.trim().toLowerCase();
      if (!key || byName.has(key)) continue;
      byName.set(key, await this.insertImportedLabel(collectionId, label, sortOrder));
      sortOrder += 1;
      created += 1;
    }
    return { byName, created };
  }

  /**
   * The places of a file, written into a list that is already there to take
   * them. Both imports go through here, so a file behaves the same way
   * whichever one read it.
   *
   * `skipDuplicates` is the whole difference. A list that was just created out
   * of this file is empty and takes every place it carries, duplicates within
   * the file included, exactly as it always has; a list people have been
   * working in keeps what it has.
   *
   * New places are appended after the ones already there rather than renumbered
   * from zero, so a manual order survives an import.
   */
  private async writeFilePlaces(
    collectionId: number,
    savedBy: number,
    file: CollectionFile,
    labelIdByName: Map<string, number>,
    opts: { skipDuplicates: boolean },
  ): Promise<{ imported: number; skipped: number; duplicates: number }> {
    // The palette is instance-wide and read-only here: a file names a category,
    // it does not get to create one.
    const categoryIdByName = new Map<string, number>();
    for (const c of await this.categories.listIdName()) {
      categoryIdByName.set(c.name.trim().toLowerCase(), c.id);
    }
    const ownerId = await this.ownerOf(collectionId);
    const firstOrder = (await this.collectionsRepo.maxPlaceSortOrder(collectionId)) + 1;

    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    for (const raw of file.places) {
      const parsed = collectionFilePlaceSchema.safeParse(raw);
      if (!parsed.success) {
        skipped += 1;
        continue;
      }
      const place = parsed.data;
      // Rows written earlier in this same run count as already there, so a file
      // that lists a place twice adds it once.
      if (
        opts.skipDuplicates &&
        (await this.findDuplicateCollectionPlace(collectionId, {
          name: place.name,
          lat: place.lat ?? null,
          lng: place.lng ?? null,
          google_place_id: place.google_place_id ?? null,
          google_ftid: place.google_ftid ?? null,
          osm_id: place.osm_id ?? null,
        }))
      ) {
        duplicates += 1;
        continue;
      }
      const placeId = await this.collectionsRepo.insertFilePlace({
        collection_id: collectionId,
        owner_id: ownerId,
        saved_by: savedBy,
        name: place.name,
        description: place.description ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
        address: place.address ?? null,
        category_id: place.category ? (categoryIdByName.get(place.category.trim().toLowerCase()) ?? null) : null,
        price: place.price ?? null,
        currency: place.currency ?? null,
        notes: place.notes ?? null,
        image_url: place.image_url ?? null,
        google_place_id: place.google_place_id ?? null,
        google_ftid: place.google_ftid ?? null,
        osm_id: place.osm_id ?? null,
        website: place.website ?? null,
        phone: place.phone ?? null,
        status: place.status ?? 'idea',
        links: serializeLinks(place.links),
        sort_order: firstOrder + imported,
      });
      for (const labelName of place.labels ?? []) {
        const labelId = labelIdByName.get(labelName.trim().toLowerCase());
        if (labelId) await this.collectionsRepo.assignPlaceLabel(placeId, labelId);
      }
      imported += 1;
    }
    return { imported, skipped, duplicates };
  }

  /**
   * A label straight from a file, without createLabel's duplicate check.
   *
   * The caller de-duplicates by name, and one notification for the whole
   * import is sent by the caller rather than one per label.
   */
  private async insertImportedLabel(
    collectionId: number,
    label: CollectionFileLabel,
    sortOrder: number,
  ): Promise<number> {
    return this.labels.insertLabel({
      collection_id: collectionId,
      name: label.name.trim(),
      color: label.color ?? '#6366f1',
      sort_order: sortOrder,
    });
  }

  async createCollection(userId: number, body: CollectionCreateRequest): Promise<Collection> {
    const max = await this.collectionsRepo.maxSortOrder(userId);
    const id = await this.collectionsRepo.insertCollection({
      owner_id: userId,
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? '#6366f1',
      icon: body.icon ?? 'Bookmark',
      cover_image: body.cover_image ?? null,
      links: serializeLinks(body.links),
      sort_order: max + 1,
    });
    const col = await this.getCollectionRow(id);
    return { ...col, is_owner: true };
  }

  async updateCollection(
    userId: number,
    id: number,
    body: CollectionUpdateRequest,
    socketId?: string,
  ): Promise<Collection> {
    await this.assertCanEdit(userId, id);
    await this.collectionsRepo.updateFields(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.color !== undefined ? { color: body.color ?? null } : {}),
      ...(body.icon !== undefined ? { icon: body.icon ?? null } : {}),
      ...(body.cover_image !== undefined ? { cover_image: body.cover_image ?? null } : {}),
      ...(body.links !== undefined ? { links: serializeLinks(body.links) } : {}),
      ...(body.sort_order !== undefined ? { sort_order: body.sort_order } : {}),
    });
    await this.notifyCollectionUsers(id, socketId, 'collections:updated');
    const col = await this.getCollectionRow(id);
    return { ...col, is_owner: col.owner_id === userId };
  }

  /** Set (or clear) a list's cover image, reclaiming the previous file. */
  async setCollectionCover(
    userId: number,
    id: number,
    coverUrl: string | null,
    socketId?: string,
  ): Promise<Collection> {
    await this.assertCanEdit(userId, id);
    const prev = (await this.collectionsRepo.coverImage(id)) ?? null;
    await this.collectionsRepo.setCoverImage(id, coverUrl);
    if (prev && prev !== coverUrl) await this.deleteOldCollectionCover(prev);
    await this.notifyCollectionUsers(id, socketId, 'collections:updated');
    const col = await this.getCollectionRow(id);
    return { ...col, is_owner: col.owner_id === userId };
  }

  async deleteCollection(userId: number, id: number): Promise<void> {
    await this.assertAccess(userId, id);
    if (!(await this.isOwner(userId, id))) httpError(403, 'Only the owner can delete this list');

    // Snapshot recipients BEFORE the cascade wipes collection_members.
    const accepted = await this.members.acceptedUserIds(id);
    const pending = await this.members.pendingUserIds(id);

    await this.collectionsRepo.deleteById(id); // CASCADE drops members + places + tags

    [...new Set([...accepted, ...pending])]
      .filter((uid) => uid !== userId)
      .forEach((uid) => this.realtime.broadcastToUser(uid, { type: 'collections:deleted', collectionId: id }));
  }

  async reorderCollections(userId: number, orderedIds: number[]): Promise<void> {
    const visible = new Set(await this.accessibleCollectionIds(userId));
    await this.uow.transactional(async () => {
      await this.collectionsRepo.setSortOrders(
        orderedIds.map((cid, index) => ({ id: cid, sortOrder: index })).filter(({ id }) => visible.has(id)),
      );
    });
  }

  // -------------------------------------------------------------------------
  // Dedup (collection-scoped ports of placeService helpers)
  // -------------------------------------------------------------------------

  /**
   * A third hand-written copy of the place-matching order (alongside
   * PlacesService.findDuplicatePlace and isPlaceDuplicate), and the one that had
   * actually drifted live rather than latently: unlike findDuplicatePlace's one
   * caller, savePlace calls this directly with no isPlaceDuplicate guard in
   * front, so a named candidate that matched nothing by name fell through to a
   * coordinate match unconditionally — merging the restaurant and the bar at one
   * address. It also never read google_place_id/google_ftid/osm_id at all, even
   * though every collection_places row stores them, so a renamed place with no
   * matching name or coordinates could be saved again under its old id.
   *
   * Now walks the shared strategy list from @trek/shared, same as
   * PlacesService.findMatchingPlaceId: provider id, then name, then coordinates
   * and only when there is no name.
   */
  private async findDuplicateCollectionPlace(
    collectionId: number,
    candidate: PlaceMatchCandidate,
  ): Promise<{ id: number; name: string } | null> {
    for (const strategy of placeMatchStrategies(candidate)) {
      let hit: { id: number; name: string } | undefined;
      if (strategy.by === 'externalId') {
        hit = await this.collectionsRepo.findDuplicateByExternalId(collectionId, strategy.id);
      } else if (strategy.by === 'name') {
        hit = await this.collectionsRepo.findDuplicateByName(collectionId, strategy.name);
      } else {
        hit = await this.collectionsRepo.findDuplicateByCoords(
          collectionId,
          strategy.lat,
          strategy.lng,
          strategy.tolerance,
        );
      }
      if (hit) return hit;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Saved places CRUD
  // -------------------------------------------------------------------------

  /**
   * A tag has no list of its own, only a `user_id`, so "belongs here" resolves
   * through the people on the list — the same shape places.service uses against
   * a trip roster. Off-list tag ids drop silently rather than being stored and
   * read straight back out: the tag read-back ships `tags.user_id`, so an
   * unfiltered id answers who owns a tag the caller cannot otherwise see.
   */
  private async attachTags(collectionPlaceId: number, tagIds: number[] | undefined): Promise<void> {
    if (!tagIds || tagIds.length === 0) return;
    const unique = [...new Set(tagIds)];
    const eligible = await this.collectionMemberIds(await this.collectionIdOfPlace(collectionPlaceId));
    const owned = await this.tags.findByIds(unique);
    const eligibleTagIds = owned.filter((t) => eligible.has(t.user_id)).map((t) => t.id);
    await this.collectionPlaces.attachTags(collectionPlaceId, eligibleTagIds);
  }

  /** Owner + accepted members — the users whose votes may live in this list. */
  private async collectionMemberIds(collectionId: number): Promise<Set<number>> {
    const ids = new Set<number>([await this.ownerOf(collectionId)]);
    const accepted = await this.members.acceptedUserIds(collectionId);
    accepted.forEach((id) => ids.add(id));
    return ids;
  }

  /**
   * Carry star votes (#1435) from a trip place into a freshly saved collection
   * place. Only votes by members of the target collection come along (the saver
   * is always a member) — other trip members' opinions stay in the trip.
   */
  private async copyTripRatings(sourcePlaceId: number, collectionPlaceId: number, collectionId: number): Promise<void> {
    const eligible = await this.collectionMemberIds(collectionId);
    const rows = await this.tripPlaceRatings.listVotesForPlace(sourcePlaceId);
    for (const r of rows) {
      if (eligible.has(r.user_id))
        await this.collectionPlaceRatings.insertIgnoreRating(collectionPlaceId, r.user_id, r.rating);
    }
  }

  async savePlace(userId: number, body: CollectionSavePlaceRequest, socketId?: string): Promise<CollectionSaveResult> {
    await this.assertCanEdit(userId, body.collection_id);

    if (!body.force) {
      const dup = await this.findDuplicateCollectionPlace(body.collection_id, {
        name: body.name,
        lat: body.lat,
        lng: body.lng,
        google_place_id: body.google_place_id,
        google_ftid: body.google_ftid,
        osm_id: body.osm_id,
      });
      if (dup) return { duplicate: true, duplicateOf: dup };
    }

    const ownerId = await this.ownerOf(body.collection_id);
    // Insert + tags + ratings-copy are one logical write — atomic since the
    // post-fold quirk pass (the relocation carried them un-transacted).
    const placeId = await this.uow.transactional(async () => {
      const id = await this.collectionPlaces.insertSavedPlace({
        collection_id: body.collection_id,
        owner_id: ownerId,
        saved_by: userId,
        name: body.name,
        description: body.description ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        address: body.address ?? null,
        category_id: body.category_id ?? null,
        price: body.price ?? null,
        currency: body.currency ?? null,
        notes: body.notes ?? null,
        image_url: body.image_url ?? null,
        google_place_id: body.google_place_id ?? null,
        google_ftid: body.google_ftid ?? null,
        osm_id: body.osm_id ?? null,
        website: body.website ?? null,
        phone: body.phone ?? null,
        status: body.status ?? 'idea',
        source_trip_id: body.source_trip_id ?? null,
        source_place_id: body.source_place_id ?? null,
        links: serializeLinks(body.links),
      });

      await this.attachTags(id, body.tag_ids);
      // Carry trip ratings ONLY when the caller can actually see the source place.
      // source_place_id/source_trip_id are raw client input, so verify trip access +
      // that the place lives in that trip before reading place_ratings — otherwise a
      // member could harvest co-members' votes on places in trips they cannot access
      // (mirrors the canAccessTrip gate in saveFromTripPlace). R6's two-layer order:
      // assertCanEdit (this method's own entry guard, above) ran FIRST; the trip-access
      // check (AP1) runs SECOND, here, inside the write path — never reversed.
      if (
        body.source_place_id &&
        body.source_trip_id &&
        (await this.trips.findAccessible(body.source_trip_id, userId)) &&
        (await this.tripPlaces.existsInTrip(body.source_place_id, body.source_trip_id))
      ) {
        await this.copyTripRatings(body.source_place_id, id, body.collection_id);
      }
      return id;
    });
    await this.notifyCollectionUsers(body.collection_id, socketId, 'collections:updated');
    return { place: await this.getPlaceById(placeId) };
  }

  async saveFromTripPlace(
    userId: number,
    collectionId: number,
    tripId: number,
    placeId: number,
    force?: boolean,
    socketId?: string,
  ): Promise<CollectionSaveResult> {
    await this.assertCanEdit(userId, collectionId);
    if (!(await this.trips.findAccessible(tripId, userId))) httpError(404, 'Trip not found');

    const place = await this.tripPlaces.findInTrip(placeId, tripId);
    if (!place) httpError(404, 'Place not found');

    return this.savePlace(
      userId,
      {
        collection_id: collectionId,
        name: place.name,
        description: place.description ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
        address: place.address ?? null,
        category_id: place.category_id ?? null,
        price: place.price ?? null,
        currency: place.currency ?? null,
        notes: place.notes ?? null,
        image_url: place.image_url ?? null,
        google_place_id: place.google_place_id ?? null,
        google_ftid: place.google_ftid ?? null,
        osm_id: place.osm_id ?? null,
        website: place.website ?? null,
        phone: place.phone ?? null,
        source_trip_id: tripId,
        source_place_id: placeId,
        force,
      },
      socketId,
    );
  }

  /** The trip's places as offered to the bulk import, each already carrying the verdict
   *  saveFromTripPlaces would reach for it. Reusing findDuplicateCollectionPlace is the
   *  whole point: a row the dialog shows as new can never come back as `skipped`, and a
   *  greyed-out one is exactly a row the import would refuse. Re-deriving that rule in the
   *  client would be a second copy of it, free to drift.
   *
   *  `scheduled` is false for places no day holds. Those are what a trip leaves behind and
   *  what this import exists for, so the dialog pre-selects them. */
  async importablePlaces(userId: number, collectionId: number, tripId: number): Promise<CollectionImportablesResponse> {
    await this.assertCanEdit(userId, collectionId);
    if (!(await this.trips.findAccessible(tripId, userId))) httpError(404, 'Trip not found');

    // One row per place: a place can sit on several days, so the day columns resolve to the
    // earliest one rather than multiplying the place out across its assignments.
    const rows = await this.tripPlaces.listImportable(tripId);

    const places: CollectionImportablesResponse['places'] = [];
    for (const r of rows) {
      places.push({
        ...r,
        // Asked with the same candidate the save will use, or the picker marks a
        // place as new and the save then refuses it as a duplicate.
        already_in_list: (await this.findDuplicateCollectionPlace(collectionId, r)) != null,
        scheduled: r.day_number != null,
      });
    }
    return { places };
  }

  /** Bulk copy of several trip places into a list in one shot — one access check,
   *  one WS notify (vs saving each place individually). Mirrors saveFromTripPlace's
   *  field mapping + dedup; skips duplicates unless force. Status starts at 'idea'. */
  async saveFromTripPlaces(
    userId: number,
    collectionId: number,
    tripId: number,
    placeIds: number[],
    force?: boolean,
    socketId?: string,
  ): Promise<{ copied: number; skipped: { id: number; name: string }[] }> {
    await this.assertCanEdit(userId, collectionId);
    if (!(await this.trips.findAccessible(tripId, userId))) httpError(404, 'Trip not found');

    const ownerId = await this.ownerOf(collectionId);
    let copied = 0;
    const skipped: { id: number; name: string }[] = [];
    // The whole batch is one logical write — atomic since the post-fold quirk pass.
    await this.uow.transactional(async () => {
      for (const placeId of placeIds) {
        const p = await this.tripPlaces.findInTrip(placeId, tripId);
        if (!p) continue;
        const name = p.name;
        const lat = p.lat ?? null;
        const lng = p.lng ?? null;
        // The provider ids go with it: they are already carried into the insert
        // below, so leaving them out here would recognise less than the row that
        // gets written knows about.
        const candidate = {
          name,
          lat,
          lng,
          google_place_id: p.google_place_id ?? null,
          google_ftid: p.google_ftid ?? null,
          osm_id: p.osm_id ?? null,
        };
        if (!force && (await this.findDuplicateCollectionPlace(collectionId, candidate))) {
          skipped.push({ id: placeId, name });
          continue;
        }
        // Same 22-column insert shape as `savePlace` (CL42), with `status`/`links`
        // hardcoded ('idea'/null) exactly the way the legacy statement bound them
        // as literals rather than placeholders — see `insertSavedPlace`'s own
        // docstring for why this is the SAME method, not a second insert shape.
        const newId = await this.collectionPlaces.insertSavedPlace({
          collection_id: collectionId,
          owner_id: ownerId,
          saved_by: userId,
          name,
          description: p.description ?? null,
          lat,
          lng,
          address: p.address ?? null,
          category_id: p.category_id ?? null,
          price: p.price ?? null,
          currency: p.currency ?? null,
          notes: p.notes ?? null,
          image_url: p.image_url ?? null,
          google_place_id: p.google_place_id ?? null,
          google_ftid: p.google_ftid ?? null,
          osm_id: p.osm_id ?? null,
          website: p.website ?? null,
          phone: p.phone ?? null,
          status: 'idea',
          source_trip_id: tripId,
          source_place_id: placeId,
          links: null,
        });
        await this.copyTripRatings(placeId, newId, collectionId);
        copied++;
      }
    });
    if (copied > 0) await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return { copied, skipped };
  }

  async updatePlace(
    userId: number,
    placeId: number,
    body: CollectionPlaceUpdateRequest,
    socketId?: string,
  ): Promise<CollectionPlace> {
    const currentCollection = await this.collectionIdOfPlace(placeId);
    await this.assertCanEdit(userId, currentCollection);

    // Capture the previous thumbnail so a replaced/cleared custom upload (#1136)
    // can be reclaimed once nothing references it any more.
    const prevImage = body.image_url !== undefined ? ((await this.collectionPlaces.imageUrl(placeId)) ?? null) : null;

    const write: Parameters<CollectionPlacesRepository['updateFields']>[1] = {};
    if (body.name !== undefined) write.name = body.name;
    if (body.description !== undefined) write.description = body.description ?? null;
    if (body.notes !== undefined) write.notes = body.notes ?? null;
    if (body.lat !== undefined) write.lat = body.lat ?? null;
    if (body.lng !== undefined) write.lng = body.lng ?? null;
    if (body.address !== undefined) write.address = body.address ?? null;
    if (body.status !== undefined) write.status = body.status;
    if (body.category_id !== undefined) write.category_id = body.category_id ?? null;
    if (body.image_url !== undefined) write.image_url = body.image_url ?? null;
    if (body.links !== undefined) write.links = serializeLinks(body.links);

    let movedTo: number | null = null;
    if (body.collection_id !== undefined && body.collection_id !== currentCollection) {
      await this.assertCanEdit(userId, body.collection_id);
      write.collection_id = body.collection_id;
      write.owner_id = await this.ownerOf(body.collection_id);
      movedTo = body.collection_id;
    }

    // Field update + tag rewrite + label rewrite are one logical write — atomic
    // since the post-fold quirk pass.
    await this.uow.transactional(async () => {
      await this.collectionPlaces.updateFields(placeId, write);

      if (body.tag_ids !== undefined) {
        await this.collectionPlaces.deleteTags(placeId);
        await this.attachTags(placeId, body.tag_ids);
      }

      // Labels are collection-scoped: a move invalidates the source list's labels;
      // a provided label_ids set replaces them against the (target) collection.
      if (movedTo) await this.collectionPlaces.deleteLabelAssignments(placeId);
      if (body.label_ids !== undefined)
        await this.setPlaceLabels(placeId, movedTo ?? currentCollection, body.label_ids);
    });

    if (body.image_url !== undefined && prevImage !== (body.image_url ?? null)) {
      await this.reclaimPlaceImage(prevImage);
    }

    await this.notifyCollectionUsers(currentCollection, socketId, 'collections:updated');
    if (movedTo) await this.notifyCollectionUsers(movedTo, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  async setStatus(
    userId: number,
    placeId: number,
    status: CollectionStatus,
    socketId?: string,
  ): Promise<CollectionPlace> {
    const collectionId = await this.collectionIdOfPlace(placeId);
    await this.assertCanEdit(userId, collectionId);
    await this.collectionPlaces.setStatus(placeId, status);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  /**
   * Set (1-5) or clear (null) the user's own star vote on a saved place (#1435).
   * Gated on assertAccess, not assertCanEdit — a vote is the member's personal
   * opinion, so read-only viewers get to cast one too.
   */
  async setRating(userId: number, placeId: number, rating: number | null, socketId?: string): Promise<CollectionPlace> {
    const collectionId = await this.collectionIdOfPlace(placeId);
    await this.assertAccess(userId, collectionId);
    if (rating === null) {
      await this.collectionPlaceRatings.deleteRating(placeId, userId);
    } else {
      await this.collectionPlaceRatings.upsertRating(placeId, userId, rating);
    }
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  /**
   * Delete a custom saved-place-image object once nothing references it any
   * more (Plan 3h Task 6, replacing `place-image.ts`'s free function — see
   * that file's own doc comment). A trip place and a collection saved-place
   * can share the same uploaded file — save-to-collection and copy-to-trip
   * copy `image_url` by reference — so this ref-counts across both tables
   * before deleting, mirroring `PlacesService.reclaimPlaceImage`'s shape
   * exactly: `places` first via `PlacesRepository.existsByImageUrl`
   * (`tripPlaces`, already injected), `collection_places` second via
   * `CollectionPlacesRepository.existsByImageUrl` (`collectionPlaces`,
   * already injected), JS-level `||` short-circuit preserved by early
   * return. `path.basename()` keeps the storage name confined to the
   * 'places' category. Best-effort: never throws.
   */
  private async reclaimPlaceImage(url: string | null | undefined): Promise<void> {
    if (!isUploadedPlaceImage(url)) return;
    if (await this.tripPlaces.existsByImageUrl(url)) return;
    if (await this.collectionPlaces.existsByImageUrl(url)) return;
    await this.storage.delete('places', path.basename(url)).catch(() => {
      /* best-effort */
    });
  }

  async deletePlace(userId: number, placeId: number, socketId?: string): Promise<void> {
    const collectionId = await this.collectionIdOfPlace(placeId);
    await this.assertCanDelete(userId, collectionId);
    const image = (await this.collectionPlaces.imageUrl(placeId)) ?? null;
    await this.collectionPlaces.deleteById(placeId); // CASCADE drops tags. NO photo-cache reclaim.
    await this.reclaimPlaceImage(image);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
  }

  async deletePlacesMany(userId: number, ids: number[], socketId?: string): Promise<number[]> {
    // All-or-nothing since the post-fold quirk pass: every id is resolved and
    // permission-checked BEFORE any delete (the relocated legacy interleaved
    // checks with deletes, so a mid-list 403/404 left earlier deletes committed),
    // and the deletes then run in one transaction.
    const deleted: number[] = [];
    const touched = new Set<number>();
    const images: (string | null)[] = [];
    for (const id of ids) {
      const collectionId = await this.collectionIdOfPlace(id);
      await this.assertCanDelete(userId, collectionId);
      images.push((await this.collectionPlaces.imageUrl(id)) ?? null);
      touched.add(collectionId);
    }
    await this.uow.transactional(async () => {
      for (const id of ids) {
        await this.collectionPlaces.deleteById(id);
        deleted.push(id);
      }
    });
    for (const image of images) await this.reclaimPlaceImage(image);
    for (const cid of touched) await this.notifyCollectionUsers(cid, socketId, 'collections:updated');
    return deleted;
  }

  /**
   * Set the same status on several saved places at once (#1469).
   *
   * Same all-or-nothing shape as deletePlacesMany: every id is resolved and
   * permission-checked before the first write, so a list the caller may not edit
   * cannot leave half the batch applied. Rows that already carry the status are
   * counted as untouched rather than rewritten, which keeps updated_at honest.
   */
  async setStatusMany(
    userId: number,
    ids: number[],
    status: CollectionStatus,
    socketId?: string,
  ): Promise<{ updated: number }> {
    const touched = new Set<number>();
    for (const id of ids) {
      const collectionId = await this.collectionIdOfPlace(id);
      await this.assertCanEdit(userId, collectionId);
      touched.add(collectionId);
    }
    let updated = 0;
    await this.uow.transactional(async () => {
      for (const id of ids) {
        updated += await this.collectionPlaces.setStatusIfChanged(id, status);
      }
    });
    if (updated > 0) for (const cid of touched) await this.notifyCollectionUsers(cid, socketId, 'collections:updated');
    return { updated };
  }

  /**
   * Set a status on every saved copy of the given trip places (#1469): "I have
   * been here now" said once from the trip, instead of hunting the place down in
   * each list it was saved to.
   *
   * The match is findMembership's, so what gets updated is exactly what the
   * place dialog listed as "saved in". Lists the caller may only read are left
   * alone rather than refused — a shared list you cannot edit should not stop
   * you marking your own.
   */
  async setStatusFromTrip(
    userId: number,
    tripId: number,
    placeIds: number[],
    status: CollectionStatus,
    socketId?: string,
  ): Promise<{ updated: number; places: number }> {
    if (!(await this.trips.findAccessible(tripId, userId))) httpError(404, 'Trip not found');

    const sources = placeIds.length ? await this.tripPlaces.listByTripAndIds(tripId, placeIds) : [];
    if (sources.length === 0) return { updated: 0, places: 0 };

    const editable: number[] = [];
    for (const cid of await this.accessibleCollectionIds(userId)) {
      const role = await this.roleOf(userId, cid);
      if (role !== null && role !== 'viewer') editable.push(cid);
    }
    if (editable.length === 0) return { updated: 0, places: 0 };

    const matched = new Set<number>();
    const placesWithMatch = new Set<number>();
    for (const src of sources) {
      for (const row of await this.matchingCollectionPlaces(editable, tripId, src)) {
        matched.add(row.id);
        placesWithMatch.add(src.id);
      }
    }
    if (matched.size === 0) return { updated: 0, places: 0 };

    const { updated } = await this.setStatusMany(userId, [...matched], status, socketId);
    return { updated, places: placesWithMatch.size };
  }

  /**
   * The saved copies of one trip place. Same signals findMembership uses — a
   * provider id, or the same spot within the dedup tolerance — plus the
   * source link a place saved out of this very trip already carries, which beats
   * inferring anything. A bare name match is left out here for the same reason
   * as there: every "Starbucks" in the library would answer to it.
   */
  private async matchingCollectionPlaces(
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
  ): Promise<Array<{ id: number }>> {
    return this.collectionPlaces.matchingByTripSource(collectionIds, tripId, place, COORD_DEDUP_TOLERANCE);
  }

  /** Set (or clear) a saved place's custom thumbnail, reclaiming the previous upload. */
  async setPlaceImage(
    userId: number,
    placeId: number,
    imageUrl: string | null,
    socketId?: string,
  ): Promise<CollectionPlace> {
    const collectionId = await this.collectionIdOfPlace(placeId);
    await this.assertCanEdit(userId, collectionId);
    const prev = (await this.collectionPlaces.imageUrl(placeId)) ?? null;
    await this.collectionPlaces.setImageUrl(placeId, imageUrl);
    if (prev !== imageUrl) await this.reclaimPlaceImage(prev);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  // -------------------------------------------------------------------------
  // Copy to trip
  // -------------------------------------------------------------------------

  async copyToTrip(
    userId: number,
    body: CollectionCopyToTripRequest,
  ): Promise<{ copied: number; skipped: { id: number; name: string }[] }> {
    // R6's OPPOSITE order from `savePlace`: trip access (AP6, this method's own
    // entry guard) FIRST, then the `place_edit` permission check SECOND — each
    // method preserves its OWN legacy order independently, never forced to match.
    const trip = await this.trips.findAccessible(body.trip_id, userId);
    if (!trip) httpError(404, 'Trip not found');
    const role = (await this.users.getRole(userId)) ?? 'user';
    if (!(await this.permissions.checkPermission('place_edit', role, trip.user_id, userId, trip.user_id !== userId))) {
      httpError(403, 'Not allowed to edit this trip');
    }

    // Votes only travel for users who are members of THIS trip (owner + members),
    // so copying never surfaces a collection member with no tie to the trip.
    // Symmetric with copyTripRatings' collection-member filter (#1435).
    const tripMemberIds = new Set<number>([trip.user_id]);
    for (const memberId of await this.tripMembers.listUserIdsByTrip(body.trip_id)) {
      tripMemberIds.add(memberId);
    }

    // Visibility on every SOURCE place — no cross-user exfiltration via copy.
    const sources: CollectionPlaceCopyRow[] = [];
    for (const pid of body.place_ids) {
      const row = await this.collectionPlaces.findForCopy(pid);
      if (!row) httpError(404, 'Place not found');
      await this.assertAccess(userId, row.collection_id);
      sources.push(row);
    }

    // Trip dedup set — same helpers the importers use, so a place renamed in the
    // trip is still recognised by its provider id when it is copied again (#1550).
    const existing = await this.tripPlaces.dedupCandidatesForTrip(body.trip_id);
    const dedup: DedupSet = { names: new Set(), coords: [], externalIds: new Set() };
    for (const r of existing) {
      for (const id of externalIdsOf(r)) dedup.externalIds.add(id);
      if (r.name) dedup.names.add(r.name.trim().toLowerCase());
      else if (r.lat != null && r.lng != null) dedup.coords.push({ lat: r.lat, lng: r.lng });
    }

    let copied = 0;
    const skipped: { id: number; name: string }[] = [];
    // The whole copy is one logical write — atomic since the post-fold quirk pass.
    await this.uow.transactional(async () => {
      for (const s of sources) {
        if (
          !body.force &&
          isPlaceDuplicate(
            {
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              google_place_id: s.google_place_id,
              google_ftid: s.google_ftid,
              osm_id: s.osm_id,
            },
            dedup,
          )
        ) {
          skipped.push({ id: s.id, name: s.name });
          continue;
        }
        // CL64 — cross-domain WRITE into 3c's `places`, gated by the trip-access +
        // permission checks above (the cross-tenant guard: a caller who can see
        // the collection place but not the target trip never reaches this write).
        const newPlaceId = await this.tripPlaces.insertFromCollectionPlace({
          trip_id: body.trip_id,
          name: s.name,
          description: s.description,
          lat: s.lat,
          lng: s.lng,
          address: s.address,
          category_id: s.category_id,
          price: s.price,
          currency: s.currency,
          notes: s.notes,
          image_url: s.image_url,
          google_place_id: s.google_place_id,
          google_ftid: s.google_ftid,
          website: s.website,
          phone: s.phone,
          osm_id: s.osm_id,
        });
        const tagIds = await this.collectionPlaces.tagIdsFor(s.id);
        await this.tags.insertIgnore(newPlaceId, tagIds);
        // Ratings travel into the trip too (#1435), but only for trip members — a
        // collection voter who isn't on the trip stays out of it. Trip members keep
        // voting there; nothing is mirrored back.
        const votes = await this.collectionPlaceRatings.listForPlace(s.id);
        for (const v of votes)
          if (tripMemberIds.has(v.user_id)) await this.tripPlaceRatings.insertIgnore(newPlaceId, v.user_id, v.rating);

        trackInsertedInDedupSet(s, dedup);
        copied++;
      }
    });
    return { copied, skipped };
  }

  // -------------------------------------------------------------------------
  // Library-wide membership lookup (inspector indicator)
  // -------------------------------------------------------------------------

  async findMembership(
    userId: number,
    query: { google_place_id?: string; google_ftid?: string; name?: string; lat?: number; lng?: number },
  ): Promise<CollectionMembership> {
    const ids = await this.accessibleCollectionIds(userId);
    if (ids.length === 0) return { saved: false, lists: [] };

    // Coordinate proximity is the location signal. A bare NAME match is deliberately
    // NOT a condition on its own — "Starbucks" (or any repeated name) would otherwise
    // false-positive the inspector's "already saved" bookmark. When coords are given
    // the name still effectively matches via the same-location row below; without an
    // id or coords there is nothing strong enough to claim it's the same place.
    // RULE 23: `searchMembership` builds this OR as typed Kysely expressions, never
    // a string-built WHERE — `query.name` plays no part in the SQL either way.
    const rows = await this.collectionPlaces.searchMembership(ids, query, COORD_DEDUP_TOLERANCE);

    const lists: CollectionMembership['lists'] = [];
    for (const r of rows) {
      const role = await this.roleOf(userId, r.collection_id);
      lists.push({
        collection_id: r.collection_id,
        name: r.name,
        place_id: r.place_id,
        status: (r.status as CollectionStatus) ?? 'idea',
        can_edit: role !== null && role !== 'viewer',
      });
    }
    return { saved: rows.length > 0, lists };
  }

  // -------------------------------------------------------------------------
  // WebSocket notify
  // -------------------------------------------------------------------------

  async notifyCollectionUsers(
    collectionId: number,
    excludeSid: string | undefined,
    event:
      | 'collections:updated'
      | 'collections:accepted'
      | 'collections:declined'
      | 'collections:left' = 'collections:updated',
  ): Promise<void> {
    const ownerId = await this.collectionsRepo.ownerId(collectionId);
    if (ownerId === undefined) return;
    const userIds = [ownerId];
    const members = await this.members.acceptedUserIds(collectionId);
    members.forEach((id) => userIds.push(id));
    userIds.forEach((id) => this.realtime.broadcastToUser(id, { type: event, collectionId }, excludeSid));
  }

  // -------------------------------------------------------------------------
  // Labels — per-collection custom labels. Managing + assigning both require
  // edit rights (owner/admin/editor); filtering is a read available to every
  // member.
  // -------------------------------------------------------------------------

  private async collectionIdOfLabel(labelId: number): Promise<number> {
    const collectionId = await this.labels.collectionIdOf(labelId);
    if (collectionId === undefined) httpError(404, 'Label not found');
    return collectionId;
  }

  private async getLabelById(labelId: number): Promise<CollectionLabel> {
    return (await this.labels.findById(labelId)) as CollectionLabel;
  }

  /** Replace a place's label assignments, keeping only labels of `collectionId`. */
  private async setPlaceLabels(placeId: number, collectionId: number, labelIds: number[]): Promise<void> {
    await this.collectionPlaces.deleteLabelAssignments(placeId);
    if (labelIds.length === 0) return;
    const valid = new Set((await this.loadLabelsByCollection(collectionId)).map((l) => l.id));
    for (const id of labelIds) if (valid.has(id)) await this.collectionsRepo.assignPlaceLabel(placeId, id);
  }

  async createLabel(
    userId: number,
    collectionId: number,
    name: string,
    color?: string,
    socketId?: string,
  ): Promise<CollectionLabel> {
    await this.assertCanEdit(userId, collectionId);
    const trimmed = name.trim();
    if (!trimmed) httpError(400, 'Label name is required');
    const count = await this.labels.countByCollection(collectionId);
    if (count >= MAX_LABELS_PER_COLLECTION)
      httpError(400, `A list can have at most ${MAX_LABELS_PER_COLLECTION} labels`);
    if (await this.labels.nameExists(collectionId, trimmed)) {
      httpError(409, 'A label with this name already exists');
    }
    const nextSort = (await this.labels.maxSortOrder(collectionId)) + 1;
    const newId = await this.labels.insertLabel({
      collection_id: collectionId,
      name: trimmed,
      color: color ?? '#6366f1',
      sort_order: nextSort,
    });
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getLabelById(newId);
  }

  async updateLabel(
    userId: number,
    labelId: number,
    body: { name?: string; color?: string; sort_order?: number },
    socketId?: string,
  ): Promise<CollectionLabel> {
    const collectionId = await this.collectionIdOfLabel(labelId);
    await this.assertCanEdit(userId, collectionId);
    const write: Parameters<CollectionLabelsRepository['updateFields']>[1] = {};
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) httpError(400, 'Label name is required');
      if (await this.labels.nameExistsExcluding(collectionId, trimmed, labelId)) {
        httpError(409, 'A label with this name already exists');
      }
      write.name = trimmed;
    }
    if (body.color !== undefined) write.color = body.color;
    if (body.sort_order !== undefined) write.sort_order = body.sort_order;
    await this.labels.updateFields(labelId, write);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getLabelById(labelId);
  }

  async deleteLabel(userId: number, labelId: number, socketId?: string): Promise<void> {
    const collectionId = await this.collectionIdOfLabel(labelId);
    await this.assertCanEdit(userId, collectionId);
    await this.labels.deleteById(labelId); // CASCADE clears place assignments
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
  }

  /** Bulk add (or remove) one or more labels across a selection of places.
   *  Places are grouped by list so each list is permission-checked once, and only
   *  labels that belong to that list are applied. */
  async assignLabels(
    userId: number,
    labelIds: number[],
    placeIds: number[],
    remove: boolean,
    socketId?: string,
  ): Promise<{ changed: number }> {
    const byCollection = new Map<number, number[]>();
    for (const pid of placeIds) {
      const cid = await this.collectionIdOfPlace(pid);
      if (!byCollection.has(cid)) byCollection.set(cid, []);
      byCollection.get(cid)!.push(pid);
    }
    // All-or-nothing since the post-fold quirk pass: every touched list is
    // permission-checked BEFORE any write (the relocated legacy checked inside
    // the write loop, so a later list's 403 left earlier lists modified), and
    // the writes then run in one transaction. Broadcasts still skip lists where
    // no provided label applied.
    for (const cid of byCollection.keys()) await this.assertCanEdit(userId, cid);
    let changed = 0;
    const notified: number[] = [];
    await this.uow.transactional(async () => {
      for (const [cid, pids] of byCollection) {
        const valid = new Set((await this.loadLabelsByCollection(cid)).map((l) => l.id));
        const applicable = labelIds.filter((id) => valid.has(id));
        if (applicable.length === 0) continue;
        if (remove) {
          for (const pid of pids)
            for (const lid of applicable) changed += await this.collectionPlaces.unassignLabel(pid, lid);
        } else {
          for (const pid of pids)
            for (const lid of applicable) changed += await this.collectionPlaces.assignLabel(pid, lid);
        }
        notified.push(cid);
      }
    });
    for (const cid of notified) await this.notifyCollectionUsers(cid, socketId, 'collections:updated');
    return { changed };
  }

  // -------------------------------------------------------------------------
  // Fusion invitations (mirror vacayService, dropping the one-fusion guards)
  // -------------------------------------------------------------------------

  async sendInvite(
    collectionId: number,
    inviterId: number,
    inviterUsername: string,
    inviterEmail: string,
    targetUserId: number,
    role: 'viewer' | 'editor' | 'admin' = 'editor',
  ): Promise<{ error?: string; status?: number }> {
    if (!(await this.isOwner(inviterId, collectionId))) return { error: 'Not allowed', status: 403 };
    if (targetUserId === inviterId) return { error: 'Cannot invite yourself', status: 400 };

    const targetUser = await this.users.findIdUsername(targetUserId);
    if (!targetUser) return { error: 'User not found', status: 404 };

    const existing = await this.members.findByCollectionAndUser(collectionId, targetUserId);
    if (existing) {
      if (existing.status === 'accepted') return { error: 'Already a member', status: 400 };
      if (existing.status === 'pending') return { error: 'Invite already pending', status: 400 };
    }

    await this.members.insertInvite(collectionId, targetUserId, role);

    this.realtime.broadcastToUser(targetUserId, {
      type: 'collections:invite',
      from: { id: inviterId, username: inviterUsername },
      collectionId,
    });

    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    this.notifications
      .send({
        event: 'collection_invite',
        actorId: inviterId,
        scope: 'user',
        targetId: targetUserId,
        params: { actor: inviterEmail, collectionId: String(collectionId) },
      })
      .catch(() => {});

    return {};
  }

  async acceptInvite(
    userId: number,
    collectionId: number,
    socketId: string | undefined,
  ): Promise<{ error?: string; status?: number }> {
    const inviteId = await this.members.findPendingInvite(collectionId, userId);
    if (inviteId === undefined) return { error: 'No pending invite', status: 404 };
    await this.members.accept(inviteId);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:accepted');
    return {};
  }

  async declineInvite(userId: number, collectionId: number, socketId: string | undefined): Promise<void> {
    await this.members.deletePending(collectionId, userId);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:declined');
  }

  async cancelInvite(collectionId: number, ownerId: number, targetUserId: number): Promise<void> {
    if (!(await this.isOwner(ownerId, collectionId))) httpError(403, 'Not allowed');
    await this.members.deletePending(collectionId, targetUserId);
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:cancelled', collectionId });
  }

  async leaveCollection(userId: number, collectionId: number, socketId: string | undefined): Promise<void> {
    if (await this.isOwner(userId, collectionId)) httpError(400, 'Owner cannot leave; delete the list');
    await this.members.deleteAccepted(collectionId, userId);
    await this.notifyCollectionUsers(collectionId, socketId, 'collections:left');
  }

  /** Owner removes an already-accepted member (a "kick"). */
  async removeMember(ownerId: number, collectionId: number, targetUserId: number): Promise<void> {
    if (!(await this.isOwner(ownerId, collectionId))) httpError(403, 'Not allowed');
    if (targetUserId === ownerId) httpError(400, 'Owner cannot be removed');
    const changed = await this.members.deleteAccepted(collectionId, targetUserId);
    if (changed === 0) httpError(404, 'Member not found');
    await this.notifyCollectionUsers(collectionId, undefined, 'collections:left'); // refresh remaining members
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:removed', collectionId }); // bounce the removed user
  }

  /** Owner changes an accepted member's permission role (viewer/editor/admin). */
  async setMemberRole(
    ownerId: number,
    collectionId: number,
    targetUserId: number,
    role: 'viewer' | 'editor' | 'admin',
  ): Promise<void> {
    if (!(await this.isOwner(ownerId, collectionId))) httpError(403, 'Not allowed');
    const changed = await this.members.setRole(collectionId, targetUserId, role);
    if (changed === 0) httpError(404, 'Member not found');
    await this.notifyCollectionUsers(collectionId, undefined, 'collections:updated'); // re-gate the member live
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:updated', collectionId });
  }

  async availableUsers(ownerId: number, collectionId: number): Promise<{ id: number; username: string }[]> {
    return this.members.availableUsers(ownerId, collectionId);
  }

  async findMembershipForUser(
    userId: number,
    collectionId: number,
  ): Promise<{ is_member: boolean; is_owner: boolean; status: string | null }> {
    if (await this.isOwner(userId, collectionId)) return { is_member: true, is_owner: true, status: 'accepted' };
    const status = await this.members.statusFor(collectionId, userId);
    return { is_member: status === 'accepted', is_owner: false, status: status ?? null };
  }
}
