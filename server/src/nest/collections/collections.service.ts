import path from 'path';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { reclaimPlaceImage } from '../places/place-image';
import { StorageService } from '../storage/storage.service';
import {
  COORD_DEDUP_TOLERANCE,
  externalIdsOf,
  isPlaceDuplicate,
  trackInsertedInDedupSet,
  type DedupSet,
} from '../places/places.helpers';
import { placeMatchStrategies, type PlaceMatchCandidate } from '@trek/shared';
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
import { NotificationsService } from '../notifications/notifications.service';

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

export type EffectiveRole = 'owner' | 'admin' | 'editor' | 'viewer' | null;

interface PlaceRow extends CollectionPlace {
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}

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
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
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

  accessibleCollectionIds(userId: number): number[] {
    const rows = this.db.all<{ id: number }>(`
    SELECT id FROM collections WHERE owner_id = ?
    UNION
    SELECT collection_id FROM collection_members WHERE user_id = ? AND status = 'accepted'
  `, userId, userId);
    return rows.map(r => r.id);
  }

  private isVisible(userId: number, collectionId: number): boolean {
    const row = this.db.get(`
    SELECT 1 FROM collections WHERE id = ? AND owner_id = ?
    UNION
    SELECT 1 FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'
    LIMIT 1
  `, collectionId, userId, collectionId, userId);
    return !!row;
  }

  assertAccess(userId: number, collectionId: number): void {
    if (!this.isVisible(userId, collectionId)) httpError(404, 'Collection not found');
  }

  isOwner(userId: number, collectionId: number): boolean {
    const row = this.db.get('SELECT 1 FROM collections WHERE id = ? AND owner_id = ?', collectionId, userId);
    return !!row;
  }

  /** The viewer's effective permission on a list: owner (full), or their accepted
   *  member role, or null when they have no access. */
  roleOf(userId: number, collectionId: number): EffectiveRole {
    if (this.isOwner(userId, collectionId)) return 'owner';
    const row = this.db.get<{ role: string }>(
      "SELECT role FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'",
      collectionId, userId,
    );
    if (!row) return null;
    return row.role === 'admin' || row.role === 'viewer' ? row.role : 'editor';
  }

  /** Add/edit a place — owner, admin or editor. 404 hides lists you can't see,
   *  403 for a read-only (viewer) member. */
  assertCanEdit(userId: number, collectionId: number): void {
    const r = this.roleOf(userId, collectionId);
    if (r === null) httpError(404, 'Collection not found');
    if (r === 'viewer') httpError(403, 'You have read-only access to this list');
  }

  /** Delete a place — owner or admin only. */
  assertCanDelete(userId: number, collectionId: number): void {
    const r = this.roleOf(userId, collectionId);
    if (r === null) httpError(404, 'Collection not found');
    if (r !== 'owner' && r !== 'admin') httpError(403, 'Only an admin can delete places from this list');
  }

  private ownerOf(collectionId: number): number {
    const row = this.db.get<{ owner_id: number }>('SELECT owner_id FROM collections WHERE id = ?', collectionId);
    if (!row) httpError(404, 'Collection not found');
    return row.owner_id;
  }

  // -------------------------------------------------------------------------
  // Hydration helpers
  // -------------------------------------------------------------------------

  private loadTagsByCollectionPlaceIds(placeIds: number[]): Record<number, { id: number; name: string; color: string }[]> {
    const out: Record<number, { id: number; name: string; color: string }[]> = {};
    if (placeIds.length === 0) return out;
    const placeholders = placeIds.map(() => '?').join(',');
    const rows = this.db.all<{ pid: number; id: number; name: string; color: string }>(`
    SELECT cpt.collection_place_id AS pid, t.id, t.name, t.color
    FROM collection_place_tags cpt
    JOIN tags t ON t.id = cpt.tag_id
    WHERE cpt.collection_place_id IN (${placeholders})
  `, ...placeIds);
    for (const r of rows) {
      if (!out[r.pid]) out[r.pid] = [];
      out[r.pid].push({ id: r.id, name: r.name, color: r.color });
    }
    return out;
  }

  /** A list's own label definitions, in display order. */
  private loadLabelsByCollection(collectionId: number): CollectionLabel[] {
    return this.db.all<CollectionLabel>(
      'SELECT id, collection_id, name, color, sort_order FROM collection_labels WHERE collection_id = ? ORDER BY sort_order, id',
      collectionId,
    );
  }

  /** Assigned label ids per place, batched (mirrors loadTagsByCollectionPlaceIds). */
  private loadLabelIdsByPlaceIds(placeIds: number[]): Record<number, number[]> {
    const out: Record<number, number[]> = {};
    if (placeIds.length === 0) return out;
    const placeholders = placeIds.map(() => '?').join(',');
    const rows = this.db.all<{ pid: number; label_id: number }>(
      `SELECT collection_place_id AS pid, label_id FROM collection_place_labels WHERE collection_place_id IN (${placeholders})`,
      ...placeIds,
    );
    for (const r of rows) {
      if (!out[r.pid]) out[r.pid] = [];
      out[r.pid].push(r.label_id);
    }
    return out;
  }

  /** Per-voter rating rows (#1435), batched (mirrors loadTagsByCollectionPlaceIds). */
  private loadRatingsByCollectionPlaceIds(placeIds: number[]): Record<number, { user_id: number; username: string; avatar: string | null; rating: number }[]> {
    const out: Record<number, { user_id: number; username: string; avatar: string | null; rating: number }[]> = {};
    if (placeIds.length === 0) return out;
    const rows = this.db.all<{ pid: number; user_id: number; username: string; avatar: string | null; rating: number }>(`
    SELECT cpr.collection_place_id AS pid, cpr.user_id, u.username, u.avatar, cpr.rating
    FROM collection_place_ratings cpr
    JOIN users u ON u.id = cpr.user_id
    WHERE cpr.collection_place_id IN (${placeIds.map(() => '?').join(',')})
    ORDER BY cpr.created_at
  `, ...placeIds);
    for (const { pid, ...rest } of rows) {
      if (!out[pid]) out[pid] = [];
      out[pid].push(rest);
    }
    return out;
  }

  private hydratePlaces(rows: PlaceRow[]): CollectionPlace[] {
    const ids = rows.map(r => r.id);
    const tagsByPlace = this.loadTagsByCollectionPlaceIds(ids);
    const labelsByPlace = this.loadLabelIdsByPlaceIds(ids);
    const ratingsByPlace = this.loadRatingsByCollectionPlaceIds(ids);
    return rows.map(r => {
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

  private getPlaceById(placeId: number): CollectionPlace {
    const row = this.db.get<PlaceRow>(`
    SELECT cp.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM collection_places cp
    LEFT JOIN categories c ON cp.category_id = c.id
    WHERE cp.id = ?
  `, placeId);
    if (!row) httpError(404, 'Place not found');
    return this.hydratePlaces([row])[0];
  }

  private collectionIdOfPlace(placeId: number): number {
    const row = this.db.get<{ collection_id: number }>('SELECT collection_id FROM collection_places WHERE id = ?', placeId);
    if (!row) httpError(404, 'Place not found');
    return row.collection_id;
  }

  private buildMembers(collectionId: number): CollectionMember[] {
    const owner = this.db.get<Omit<CollectionMember, 'status' | 'is_owner'>>(`
    SELECT u.id AS user_id, u.username, u.email, u.avatar
    FROM collections col JOIN users u ON u.id = col.owner_id
    WHERE col.id = ?
  `, collectionId);
    const members = this.db.all<Omit<CollectionMember, 'is_owner'>>(`
    SELECT u.id AS user_id, u.username, u.email, u.avatar, cm.status, cm.role
    FROM collection_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.collection_id = ?
    ORDER BY u.username
  `, collectionId);
    const result: CollectionMember[] = [];
    if (owner) result.push({ ...owner, status: 'accepted', role: 'admin', is_owner: true });
    for (const m of members) result.push({ ...m, is_owner: false });
    return result;
  }

  private getCollectionRow(id: number): Collection {
    const col = this.db.get<Collection & { links?: unknown }>('SELECT * FROM collections WHERE id = ?', id);
    if (!col) httpError(404, 'Collection not found');
    const placeCount = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM collection_places WHERE collection_id = ?', id)!.n;
    return { ...col, links: parseLinks(col.links), place_count: placeCount, members: this.buildMembers(id) };
  }

  // -------------------------------------------------------------------------
  // Lists CRUD
  // -------------------------------------------------------------------------

  listCollections(userId: number): CollectionListResponse {
    const ids = this.accessibleCollectionIds(userId);
    const collections: Collection[] = ids
      .map(id => {
        const col = this.getCollectionRow(id);
        return { ...col, is_owner: col.owner_id === userId };
      })
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);

    const incomingInvites = this.db.all<{ collection_id: number; name: string; from_id: number; from_username: string }>(`
    SELECT cm.collection_id, c.name, u.id AS from_id, u.username AS from_username
    FROM collection_members cm
    JOIN collections c ON c.id = cm.collection_id
    JOIN users u ON u.id = c.owner_id
    WHERE cm.user_id = ? AND cm.status = 'pending'
  `, userId)
      .map(r => ({ collection_id: r.collection_id, name: r.name, from: { id: r.from_id, username: r.from_username } }));

    return { collections, incomingInvites };
  }

  getCollection(userId: number, id: number): CollectionDetailResponse {
    this.assertAccess(userId, id);
    const collection = this.getCollectionRow(id);
    const rows = this.db.all<PlaceRow>(`
    SELECT cp.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM collection_places cp
    LEFT JOIN categories c ON cp.category_id = c.id
    WHERE cp.collection_id = ?
    ORDER BY cp.sort_order, cp.created_at
  `, id);
    return {
      collection: { ...collection, is_owner: collection.owner_id === userId, labels: this.loadLabelsByCollection(id) },
      places: this.hydratePlaces(rows),
    };
  }

  createCollection(userId: number, body: CollectionCreateRequest): Collection {
    const max = this.db.get<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collections WHERE owner_id = ?', userId)!.m;
    const result = this.db.run(`
    INSERT INTO collections (owner_id, name, description, color, icon, cover_image, links, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
      userId,
      body.name,
      body.description ?? null,
      body.color ?? '#6366f1',
      body.icon ?? 'Bookmark',
      body.cover_image ?? null,
      serializeLinks(body.links),
      max + 1,
    );
    const col = this.getCollectionRow(Number(result.lastInsertRowid));
    return { ...col, is_owner: true };
  }

  updateCollection(userId: number, id: number, body: CollectionUpdateRequest, socketId?: string): Collection {
    this.assertCanEdit(userId, id);
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description ?? null); }
    if (body.color !== undefined) { updates.push('color = ?'); params.push(body.color ?? null); }
    if (body.icon !== undefined) { updates.push('icon = ?'); params.push(body.icon ?? null); }
    if (body.cover_image !== undefined) { updates.push('cover_image = ?'); params.push(body.cover_image ?? null); }
    if (body.links !== undefined) { updates.push('links = ?'); params.push(serializeLinks(body.links)); }
    if (body.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(body.sort_order); }
    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);
      this.db.run(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }
    this.notifyCollectionUsers(id, socketId, 'collections:updated');
    const col = this.getCollectionRow(id);
    return { ...col, is_owner: col.owner_id === userId };
  }

  /** Set (or clear) a list's cover image, reclaiming the previous file. */
  async setCollectionCover(userId: number, id: number, coverUrl: string | null, socketId?: string): Promise<Collection> {
    this.assertCanEdit(userId, id);
    const prev = this.db.get<{ cover_image: string | null }>('SELECT cover_image FROM collections WHERE id = ?', id)?.cover_image ?? null;
    this.db.run('UPDATE collections SET cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', coverUrl, id);
    if (prev && prev !== coverUrl) await this.deleteOldCollectionCover(prev);
    this.notifyCollectionUsers(id, socketId, 'collections:updated');
    const col = this.getCollectionRow(id);
    return { ...col, is_owner: col.owner_id === userId };
  }

  deleteCollection(userId: number, id: number): void {
    this.assertAccess(userId, id);
    if (!this.isOwner(userId, id)) httpError(403, 'Only the owner can delete this list');

    // Snapshot recipients BEFORE the cascade wipes collection_members.
    const accepted = this.db.all<{ user_id: number }>("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'accepted'", id).map(r => r.user_id);
    const pending = this.db.all<{ user_id: number }>("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'pending'", id).map(r => r.user_id);

    this.db.run('DELETE FROM collections WHERE id = ?', id); // CASCADE drops members + places + tags

    [...new Set([...accepted, ...pending])]
      .filter(uid => uid !== userId)
      .forEach(uid => this.realtime.broadcastToUser(uid, { type: 'collections:deleted', collectionId: id }));
  }

  reorderCollections(userId: number, orderedIds: number[]): void {
    const visible = new Set(this.accessibleCollectionIds(userId));
    const stmt = this.db.prepare('UPDATE collections SET sort_order = ? WHERE id = ?');
    this.db.transaction(() => {
      orderedIds.forEach((cid, index) => {
        if (visible.has(cid)) stmt.run(index, cid);
      });
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
  private findDuplicateCollectionPlace(
    collectionId: number,
    candidate: PlaceMatchCandidate,
  ): { id: number; name: string } | null {
    for (const strategy of placeMatchStrategies(candidate)) {
      let hit: { id: number; name: string } | undefined;
      if (strategy.by === 'externalId') {
        hit = this.db.get<{ id: number; name: string }>(`
      SELECT id, name FROM collection_places
      WHERE collection_id = ? AND (google_place_id = ? OR google_ftid = ? OR osm_id = ?)
      ORDER BY id ASC LIMIT 1
    `, collectionId, strategy.id, strategy.id, strategy.id);
      } else if (strategy.by === 'name') {
        hit = this.db.get<{ id: number; name: string }>(`
      SELECT id, name FROM collection_places
      WHERE collection_id = ? AND lower(trim(name)) = ?
      ORDER BY id ASC LIMIT 1
    `, collectionId, strategy.name);
      } else {
        hit = this.db.get<{ id: number; name: string }>(`
      SELECT id, name FROM collection_places
      WHERE collection_id = ? AND lat IS NOT NULL AND lng IS NOT NULL
        AND abs(lat - ?) <= ? AND abs(lng - ?) <= ?
      ORDER BY id ASC LIMIT 1
    `, collectionId, strategy.lat, strategy.tolerance, strategy.lng, strategy.tolerance);
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
  private attachTags(collectionPlaceId: number, tagIds: number[] | undefined): void {
    if (!tagIds || tagIds.length === 0) return;
    const unique = [...new Set(tagIds)];
    const eligible = this.collectionMemberIds(this.collectionIdOfPlace(collectionPlaceId));
    const owned = this.db.all<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM tags WHERE id IN (${unique.map(() => '?').join(',')})`,
      ...unique,
    );
    const stmt = this.db.prepare('INSERT OR IGNORE INTO collection_place_tags (collection_place_id, tag_id) VALUES (?, ?)');
    for (const t of owned) if (eligible.has(t.user_id)) stmt.run(collectionPlaceId, t.id);
  }

  /** Owner + accepted members — the users whose votes may live in this list. */
  private collectionMemberIds(collectionId: number): Set<number> {
    const ids = new Set<number>([this.ownerOf(collectionId)]);
    const rows = this.db.all<{ user_id: number }>("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'accepted'", collectionId);
    rows.forEach(r => ids.add(r.user_id));
    return ids;
  }

  /**
   * Carry star votes (#1435) from a trip place into a freshly saved collection
   * place. Only votes by members of the target collection come along (the saver
   * is always a member) — other trip members' opinions stay in the trip.
   */
  private copyTripRatings(sourcePlaceId: number, collectionPlaceId: number, collectionId: number): void {
    const eligible = this.collectionMemberIds(collectionId);
    const rows = this.db.all<{ user_id: number; rating: number }>('SELECT user_id, rating FROM place_ratings WHERE place_id = ?', sourcePlaceId);
    const ins = this.db.prepare('INSERT OR IGNORE INTO collection_place_ratings (collection_place_id, user_id, rating) VALUES (?, ?, ?)');
    for (const r of rows) {
      if (eligible.has(r.user_id)) ins.run(collectionPlaceId, r.user_id, r.rating);
    }
  }

  savePlace(userId: number, body: CollectionSavePlaceRequest, socketId?: string): CollectionSaveResult {
    this.assertCanEdit(userId, body.collection_id);

    if (!body.force) {
      const dup = this.findDuplicateCollectionPlace(body.collection_id, {
        name: body.name, lat: body.lat, lng: body.lng,
        google_place_id: body.google_place_id, google_ftid: body.google_ftid, osm_id: body.osm_id,
      });
      if (dup) return { duplicate: true, duplicateOf: dup };
    }

    const ownerId = this.ownerOf(body.collection_id);
    // Insert + tags + ratings-copy are one logical write — atomic since the
    // post-fold quirk pass (the relocation carried them un-transacted).
    const placeId = this.db.transaction(() => {
      const result = this.db.run(`
    INSERT INTO collection_places (
      collection_id, owner_id, saved_by, name, description, lat, lng, address,
      category_id, price, currency, notes, image_url, google_place_id, google_ftid,
      osm_id, website, phone, status, source_trip_id, source_place_id, links
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
        body.collection_id, ownerId, userId,
        body.name, body.description ?? null, body.lat ?? null, body.lng ?? null, body.address ?? null,
        body.category_id ?? null, body.price ?? null, body.currency ?? null, body.notes ?? null,
        body.image_url ?? null, body.google_place_id ?? null, body.google_ftid ?? null,
        body.osm_id ?? null, body.website ?? null, body.phone ?? null,
        body.status ?? 'idea', body.source_trip_id ?? null, body.source_place_id ?? null,
        serializeLinks(body.links),
      );

      const id = Number(result.lastInsertRowid);
      this.attachTags(id, body.tag_ids);
      // Carry trip ratings ONLY when the caller can actually see the source place.
      // source_place_id/source_trip_id are raw client input, so verify trip access +
      // that the place lives in that trip before reading place_ratings — otherwise a
      // member could harvest co-members' votes on places in trips they cannot access
      // (mirrors the canAccessTrip gate in saveFromTripPlace).
      if (
        body.source_place_id && body.source_trip_id &&
        this.db.canAccessTrip(body.source_trip_id, userId) &&
        this.db.get('SELECT 1 FROM places WHERE id = ? AND trip_id = ?', body.source_place_id, body.source_trip_id)
      ) {
        this.copyTripRatings(body.source_place_id, id, body.collection_id);
      }
      return id;
    });
    this.notifyCollectionUsers(body.collection_id, socketId, 'collections:updated');
    return { place: this.getPlaceById(placeId) };
  }

  saveFromTripPlace(
    userId: number, collectionId: number, tripId: number, placeId: number, force?: boolean, socketId?: string,
  ): CollectionSaveResult {
    this.assertCanEdit(userId, collectionId);
    if (!this.db.canAccessTrip(tripId, userId)) httpError(404, 'Trip not found');

    const place = this.db.get<Record<string, unknown>>('SELECT * FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!place) httpError(404, 'Place not found');

    return this.savePlace(userId, {
      collection_id: collectionId,
      name: place.name as string,
      description: (place.description as string | null) ?? null,
      lat: (place.lat as number | null) ?? null,
      lng: (place.lng as number | null) ?? null,
      address: (place.address as string | null) ?? null,
      category_id: (place.category_id as number | null) ?? null,
      price: (place.price as number | null) ?? null,
      currency: (place.currency as string | null) ?? null,
      notes: (place.notes as string | null) ?? null,
      image_url: (place.image_url as string | null) ?? null,
      google_place_id: (place.google_place_id as string | null) ?? null,
      google_ftid: (place.google_ftid as string | null) ?? null,
      osm_id: (place.osm_id as string | null) ?? null,
      website: (place.website as string | null) ?? null,
      phone: (place.phone as string | null) ?? null,
      source_trip_id: tripId,
      source_place_id: placeId,
      force,
    }, socketId);
  }

  /** The trip's places as offered to the bulk import, each already carrying the verdict
   *  saveFromTripPlaces would reach for it. Reusing findDuplicateCollectionPlace is the
   *  whole point: a row the dialog shows as new can never come back as `skipped`, and a
   *  greyed-out one is exactly a row the import would refuse. Re-deriving that rule in the
   *  client would be a second copy of it, free to drift.
   *
   *  `scheduled` is false for places no day holds. Those are what a trip leaves behind and
   *  what this import exists for, so the dialog pre-selects them. */
  importablePlaces(userId: number, collectionId: number, tripId: number): CollectionImportablesResponse {
    this.assertCanEdit(userId, collectionId);
    if (!this.db.canAccessTrip(tripId, userId)) httpError(404, 'Trip not found');

    // One row per place: a place can sit on several days, so the day columns resolve to the
    // earliest one rather than multiplying the place out across its assignments.
    const rows = this.db.all<{
      place_id: number; name: string; address: string | null; lat: number | null; lng: number | null;
      category_id: number | null; image_url: string | null; day_number: number | null; date: string | null;
      google_place_id: string | null; google_ftid: string | null; osm_id: string | null;
    }>(`
      SELECT p.id AS place_id, p.name, p.address, p.lat, p.lng, p.category_id, p.image_url,
             p.google_place_id, p.google_ftid, p.osm_id,
             (SELECT MIN(d.day_number) FROM day_assignments da
                JOIN days d ON d.id = da.day_id
               WHERE da.place_id = p.id AND d.trip_id = p.trip_id) AS day_number,
             (SELECT d.date FROM day_assignments da
                JOIN days d ON d.id = da.day_id
               WHERE da.place_id = p.id AND d.trip_id = p.trip_id
               ORDER BY d.day_number ASC LIMIT 1) AS date
        FROM places p
       WHERE p.trip_id = ?
       ORDER BY p.name COLLATE NOCASE
    `, tripId);

    return {
      places: rows.map(r => ({
        ...r,
        // Asked with the same candidate the save will use, or the picker marks a
        // place as new and the save then refuses it as a duplicate.
        already_in_list: this.findDuplicateCollectionPlace(collectionId, r) != null,
        scheduled: r.day_number != null,
      })),
    };
  }

  /** Bulk copy of several trip places into a list in one shot — one access check,
   *  one WS notify (vs saving each place individually). Mirrors saveFromTripPlace's
   *  field mapping + dedup; skips duplicates unless force. Status starts at 'idea'. */
  saveFromTripPlaces(
    userId: number, collectionId: number, tripId: number, placeIds: number[], force?: boolean, socketId?: string,
  ): { copied: number; skipped: { id: number; name: string }[] } {
    this.assertCanEdit(userId, collectionId);
    if (!this.db.canAccessTrip(tripId, userId)) httpError(404, 'Trip not found');

    const ownerId = this.ownerOf(collectionId);
    const insert = this.db.prepare(`
    INSERT INTO collection_places (
      collection_id, owner_id, saved_by, name, description, lat, lng, address,
      category_id, price, currency, notes, image_url, google_place_id, google_ftid,
      osm_id, website, phone, status, source_trip_id, source_place_id, links
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idea', ?, ?, NULL)
  `);
    let copied = 0;
    const skipped: { id: number; name: string }[] = [];
    // The whole batch is one logical write — atomic since the post-fold quirk pass.
    this.db.transaction(() => {
      for (const placeId of placeIds) {
        const p = this.db.get<Record<string, unknown>>('SELECT * FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
        if (!p) continue;
        const name = p.name as string;
        const lat = (p.lat as number | null) ?? null;
        const lng = (p.lng as number | null) ?? null;
        // The provider ids go with it: they are already carried into the insert
        // below, so leaving them out here would recognise less than the row that
        // gets written knows about.
        const candidate = {
          name, lat, lng,
          google_place_id: (p.google_place_id as string | null) ?? null,
          google_ftid: (p.google_ftid as string | null) ?? null,
          osm_id: (p.osm_id as string | null) ?? null,
        };
        if (!force && this.findDuplicateCollectionPlace(collectionId, candidate)) {
          skipped.push({ id: placeId, name });
          continue;
        }
        const res = insert.run(
          collectionId, ownerId, userId,
          name, (p.description as string | null) ?? null, lat, lng, (p.address as string | null) ?? null,
          (p.category_id as number | null) ?? null, (p.price as number | null) ?? null, (p.currency as string | null) ?? null, (p.notes as string | null) ?? null,
          (p.image_url as string | null) ?? null, (p.google_place_id as string | null) ?? null, (p.google_ftid as string | null) ?? null,
          (p.osm_id as string | null) ?? null, (p.website as string | null) ?? null, (p.phone as string | null) ?? null,
          tripId, placeId,
        );
        this.copyTripRatings(placeId, Number(res.lastInsertRowid), collectionId);
        copied++;
      }
    });
    if (copied > 0) this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return { copied, skipped };
  }

  async updatePlace(userId: number, placeId: number, body: CollectionPlaceUpdateRequest, socketId?: string): Promise<CollectionPlace> {
    const currentCollection = this.collectionIdOfPlace(placeId);
    this.assertCanEdit(userId, currentCollection);

    // Capture the previous thumbnail so a replaced/cleared custom upload (#1136)
    // can be reclaimed once nothing references it any more.
    const prevImage = body.image_url !== undefined
      ? this.db.get<{ image_url: string | null }>('SELECT image_url FROM collection_places WHERE id = ?', placeId)?.image_url ?? null
      : null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description ?? null); }
    if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes ?? null); }
    if (body.lat !== undefined) { updates.push('lat = ?'); params.push(body.lat ?? null); }
    if (body.lng !== undefined) { updates.push('lng = ?'); params.push(body.lng ?? null); }
    if (body.address !== undefined) { updates.push('address = ?'); params.push(body.address ?? null); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.category_id !== undefined) { updates.push('category_id = ?'); params.push(body.category_id ?? null); }
    if (body.image_url !== undefined) { updates.push('image_url = ?'); params.push(body.image_url ?? null); }
    if (body.links !== undefined) { updates.push('links = ?'); params.push(serializeLinks(body.links)); }

    let movedTo: number | null = null;
    if (body.collection_id !== undefined && body.collection_id !== currentCollection) {
      this.assertCanEdit(userId, body.collection_id);
      updates.push('collection_id = ?'); params.push(body.collection_id);
      updates.push('owner_id = ?'); params.push(this.ownerOf(body.collection_id));
      movedTo = body.collection_id;
    }

    // Field update + tag rewrite + label rewrite are one logical write — atomic
    // since the post-fold quirk pass.
    this.db.transaction(() => {
      if (updates.length > 0) {
        updates.push("updated_at = CURRENT_TIMESTAMP");
        params.push(placeId);
        this.db.run(`UPDATE collection_places SET ${updates.join(', ')} WHERE id = ?`, ...params);
      }

      if (body.tag_ids !== undefined) {
        this.db.run('DELETE FROM collection_place_tags WHERE collection_place_id = ?', placeId);
        this.attachTags(placeId, body.tag_ids);
      }

      // Labels are collection-scoped: a move invalidates the source list's labels;
      // a provided label_ids set replaces them against the (target) collection.
      if (movedTo) this.db.run('DELETE FROM collection_place_labels WHERE collection_place_id = ?', placeId);
      if (body.label_ids !== undefined) this.setPlaceLabels(placeId, movedTo ?? currentCollection, body.label_ids);
    });

    if (body.image_url !== undefined && prevImage !== (body.image_url ?? null)) {
      await reclaimPlaceImage(this.storage, prevImage);
    }

    this.notifyCollectionUsers(currentCollection, socketId, 'collections:updated');
    if (movedTo) this.notifyCollectionUsers(movedTo, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  setStatus(userId: number, placeId: number, status: CollectionStatus, socketId?: string): CollectionPlace {
    const collectionId = this.collectionIdOfPlace(placeId);
    this.assertCanEdit(userId, collectionId);
    this.db.run("UPDATE collection_places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", status, placeId);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  /**
   * Set (1-5) or clear (null) the user's own star vote on a saved place (#1435).
   * Gated on assertAccess, not assertCanEdit — a vote is the member's personal
   * opinion, so read-only viewers get to cast one too.
   */
  setRating(userId: number, placeId: number, rating: number | null, socketId?: string): CollectionPlace {
    const collectionId = this.collectionIdOfPlace(placeId);
    this.assertAccess(userId, collectionId);
    if (rating === null) {
      this.db.run('DELETE FROM collection_place_ratings WHERE collection_place_id = ? AND user_id = ?', placeId, userId);
    } else {
      this.db.run(`
      INSERT INTO collection_place_ratings (collection_place_id, user_id, rating) VALUES (?, ?, ?)
      ON CONFLICT(collection_place_id, user_id) DO UPDATE SET rating = excluded.rating
    `, placeId, userId, rating);
    }
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  async deletePlace(userId: number, placeId: number, socketId?: string): Promise<void> {
    const collectionId = this.collectionIdOfPlace(placeId);
    this.assertCanDelete(userId, collectionId);
    const image = this.db.get<{ image_url: string | null }>('SELECT image_url FROM collection_places WHERE id = ?', placeId)?.image_url ?? null;
    this.db.run('DELETE FROM collection_places WHERE id = ?', placeId); // CASCADE drops tags. NO photo-cache reclaim.
    await reclaimPlaceImage(this.storage, image);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
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
      const collectionId = this.collectionIdOfPlace(id);
      this.assertCanDelete(userId, collectionId);
      images.push(this.db.get<{ image_url: string | null }>('SELECT image_url FROM collection_places WHERE id = ?', id)?.image_url ?? null);
      touched.add(collectionId);
    }
    this.db.transaction(() => {
      for (const id of ids) {
        this.db.run('DELETE FROM collection_places WHERE id = ?', id);
        deleted.push(id);
      }
    });
    for (const image of images) await reclaimPlaceImage(this.storage, image);
    touched.forEach(cid => this.notifyCollectionUsers(cid, socketId, 'collections:updated'));
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
  setStatusMany(userId: number, ids: number[], status: CollectionStatus, socketId?: string): { updated: number } {
    const touched = new Set<number>();
    for (const id of ids) {
      const collectionId = this.collectionIdOfPlace(id);
      this.assertCanEdit(userId, collectionId);
      touched.add(collectionId);
    }
    let updated = 0;
    this.db.transaction(() => {
      for (const id of ids) {
        const res = this.db.run(
          "UPDATE collection_places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IS NOT ?",
          status, id, status,
        );
        updated += res.changes;
      }
    });
    if (updated > 0) touched.forEach(cid => this.notifyCollectionUsers(cid, socketId, 'collections:updated'));
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
  setStatusFromTrip(
    userId: number,
    tripId: number,
    placeIds: number[],
    status: CollectionStatus,
    socketId?: string,
  ): { updated: number; places: number } {
    if (!this.db.canAccessTrip(tripId, userId)) httpError(404, 'Trip not found');

    const sources = placeIds.length
      ? this.db.all<{ id: number; name: string; lat: number | null; lng: number | null; google_place_id: string | null; google_ftid: string | null; osm_id: string | null }>(`
        SELECT id, name, lat, lng, google_place_id, google_ftid, osm_id
        FROM places WHERE trip_id = ? AND id IN (${placeIds.map(() => '?').join(',')})
      `, tripId, ...placeIds)
      : [];
    if (sources.length === 0) return { updated: 0, places: 0 };

    const editable = this.accessibleCollectionIds(userId).filter(cid => {
      const role = this.roleOf(userId, cid);
      return role !== null && role !== 'viewer';
    });
    if (editable.length === 0) return { updated: 0, places: 0 };

    const matched = new Set<number>();
    const placesWithMatch = new Set<number>();
    for (const src of sources) {
      for (const row of this.matchingCollectionPlaces(editable, tripId, src)) {
        matched.add(row.id);
        placesWithMatch.add(src.id);
      }
    }
    if (matched.size === 0) return { updated: 0, places: 0 };

    const { updated } = this.setStatusMany(userId, [...matched], status, socketId);
    return { updated, places: placesWithMatch.size };
  }

  /**
   * The saved copies of one trip place. Same signals findMembership uses — a
   * provider id, or the same spot within the dedup tolerance — plus the
   * source link a place saved out of this very trip already carries, which beats
   * inferring anything. A bare name match is left out here for the same reason
   * as there: every "Starbucks" in the library would answer to it.
   */
  private matchingCollectionPlaces(
    collectionIds: number[],
    tripId: number,
    place: { id: number; lat: number | null; lng: number | null; google_place_id: string | null; google_ftid: string | null; osm_id: string | null },
  ): Array<{ id: number }> {
    const conditions: string[] = ['(cp.source_trip_id = ? AND cp.source_place_id = ?)'];
    const params: (string | number)[] = [...collectionIds, tripId, place.id];
    if (place.google_place_id) { conditions.push('cp.google_place_id = ?'); params.push(place.google_place_id); }
    if (place.google_ftid) { conditions.push('cp.google_ftid = ?'); params.push(place.google_ftid); }
    if (place.osm_id) { conditions.push('cp.osm_id = ?'); params.push(place.osm_id); }
    if (place.lat != null && place.lng != null) {
      conditions.push('(cp.lat IS NOT NULL AND cp.lng IS NOT NULL AND abs(cp.lat - ?) <= ? AND abs(cp.lng - ?) <= ?)');
      params.push(place.lat, COORD_DEDUP_TOLERANCE, place.lng, COORD_DEDUP_TOLERANCE);
    }
    return this.db.all<{ id: number }>(`
      SELECT cp.id FROM collection_places cp
      WHERE cp.collection_id IN (${collectionIds.map(() => '?').join(',')}) AND (${conditions.join(' OR ')})
    `, ...params);
  }

  /** Set (or clear) a saved place's custom thumbnail, reclaiming the previous upload. */
  async setPlaceImage(userId: number, placeId: number, imageUrl: string | null, socketId?: string): Promise<CollectionPlace> {
    const collectionId = this.collectionIdOfPlace(placeId);
    this.assertCanEdit(userId, collectionId);
    const prev = this.db.get<{ image_url: string | null }>('SELECT image_url FROM collection_places WHERE id = ?', placeId)?.image_url ?? null;
    this.db.run('UPDATE collection_places SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', imageUrl, placeId);
    if (prev !== imageUrl) await reclaimPlaceImage(this.storage, prev);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getPlaceById(placeId);
  }

  // -------------------------------------------------------------------------
  // Copy to trip
  // -------------------------------------------------------------------------

  copyToTrip(userId: number, body: CollectionCopyToTripRequest): { copied: number; skipped: { id: number; name: string }[] } {
    const trip = this.db.canAccessTrip(body.trip_id, userId);
    if (!trip) httpError(404, 'Trip not found');
    const role = this.db.get<{ role: string }>('SELECT role FROM users WHERE id = ?', userId)?.role ?? 'user';
    if (!this.permissions.checkPermission('place_edit', role, trip.user_id, userId, trip.user_id !== userId)) {
      httpError(403, 'Not allowed to edit this trip');
    }

    // Votes only travel for users who are members of THIS trip (owner + members),
    // so copying never surfaces a collection member with no tie to the trip.
    // Symmetric with copyTripRatings' collection-member filter (#1435).
    const tripMemberIds = new Set<number>([trip.user_id]);
    for (const r of this.db.all<{ user_id: number }>('SELECT user_id FROM trip_members WHERE trip_id = ?', body.trip_id)) {
      tripMemberIds.add(r.user_id);
    }

    // Visibility on every SOURCE place — no cross-user exfiltration via copy.
    const sources: Array<{ id: number; name: string; description: string | null; lat: number | null; lng: number | null;
      address: string | null; category_id: number | null; price: number | null; currency: string | null;
      notes: string | null; image_url: string | null; google_place_id: string | null; google_ftid: string | null;
      osm_id: string | null; website: string | null; phone: string | null; collection_id: number }> = [];
    for (const pid of body.place_ids) {
      const row = this.db.get<(typeof sources)[number]>(`
      SELECT id, collection_id, name, description, lat, lng, address, category_id, price, currency,
             notes, image_url, google_place_id, google_ftid, osm_id, website, phone
      FROM collection_places WHERE id = ?
    `, pid);
      if (!row) httpError(404, 'Place not found');
      this.assertAccess(userId, row.collection_id);
      sources.push(row);
    }

    // Trip dedup set — same helpers the importers use, so a place renamed in the
    // trip is still recognised by its provider id when it is copied again (#1550).
    const existing = this.db.all<{
      name: string | null; lat: number | null; lng: number | null;
      google_place_id: string | null; google_ftid: string | null; osm_id: string | null;
    }>('SELECT name, lat, lng, google_place_id, google_ftid, osm_id FROM places WHERE trip_id = ?', body.trip_id);
    const dedup: DedupSet = { names: new Set(), coords: [], externalIds: new Set() };
    for (const r of existing) {
      for (const id of externalIdsOf(r)) dedup.externalIds.add(id);
      if (r.name) dedup.names.add(r.name.trim().toLowerCase());
      else if (r.lat != null && r.lng != null) dedup.coords.push({ lat: r.lat, lng: r.lng });
    }

    const insertPlace = this.db.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price,
      currency, notes, image_url, google_place_id, google_ftid, website, phone, osm_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const insertTag = this.db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
    const insertRating = this.db.prepare('INSERT OR IGNORE INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)');

    let copied = 0;
    const skipped: { id: number; name: string }[] = [];
    // The whole copy is one logical write — atomic since the post-fold quirk pass.
    this.db.transaction(() => {
      for (const s of sources) {
        if (!body.force && isPlaceDuplicate({
          name: s.name, lat: s.lat, lng: s.lng,
          google_place_id: s.google_place_id, google_ftid: s.google_ftid, osm_id: s.osm_id,
        }, dedup)) {
          skipped.push({ id: s.id, name: s.name });
          continue;
        }
        const res = insertPlace.run(
          body.trip_id, s.name, s.description, s.lat, s.lng, s.address, s.category_id, s.price,
          s.currency, s.notes, s.image_url, s.google_place_id, s.google_ftid, s.website, s.phone, s.osm_id,
        );
        const newPlaceId = Number(res.lastInsertRowid);
        const tagIds = this.db.all<{ tag_id: number }>('SELECT tag_id FROM collection_place_tags WHERE collection_place_id = ?', s.id);
        for (const t of tagIds) insertTag.run(newPlaceId, t.tag_id);
        // Ratings travel into the trip too (#1435), but only for trip members — a
        // collection voter who isn't on the trip stays out of it. Trip members keep
        // voting there; nothing is mirrored back.
        const votes = this.db.all<{ user_id: number; rating: number }>('SELECT user_id, rating FROM collection_place_ratings WHERE collection_place_id = ?', s.id);
        for (const v of votes) if (tripMemberIds.has(v.user_id)) insertRating.run(newPlaceId, v.user_id, v.rating);

        trackInsertedInDedupSet(s, dedup);
        copied++;
      }
    });
    return { copied, skipped };
  }

  // -------------------------------------------------------------------------
  // Library-wide membership lookup (inspector indicator)
  // -------------------------------------------------------------------------

  findMembership(
    userId: number,
    query: { google_place_id?: string; google_ftid?: string; name?: string; lat?: number; lng?: number },
  ): CollectionMembership {
    const ids = this.accessibleCollectionIds(userId);
    if (ids.length === 0) return { saved: false, lists: [] };
    const placeholders = ids.map(() => '?').join(',');

    const conditions: string[] = [];
    const params: (string | number)[] = [...ids];
    if (query.google_place_id) { conditions.push('cp.google_place_id = ?'); params.push(query.google_place_id); }
    if (query.google_ftid) { conditions.push('cp.google_ftid = ?'); params.push(query.google_ftid); }
    // Coordinate proximity is the location signal. A bare NAME match is deliberately
    // NOT a condition on its own — "Starbucks" (or any repeated name) would otherwise
    // false-positive the inspector's "already saved" bookmark. When coords are given
    // the name still effectively matches via the same-location row below; without an
    // id or coords there is nothing strong enough to claim it's the same place.
    if (query.lat != null && query.lng != null) {
      conditions.push('(cp.lat IS NOT NULL AND cp.lng IS NOT NULL AND abs(cp.lat - ?) <= ? AND abs(cp.lng - ?) <= ?)');
      params.push(query.lat, COORD_DEDUP_TOLERANCE, query.lng, COORD_DEDUP_TOLERANCE);
    }
    if (conditions.length === 0) return { saved: false, lists: [] };

    const rows = this.db.all<{ place_id: number; collection_id: number; name: string; status: CollectionStatus }>(`
    SELECT cp.id AS place_id, cp.collection_id, c.name, cp.status
    FROM collection_places cp
    JOIN collections c ON c.id = cp.collection_id
    WHERE cp.collection_id IN (${placeholders}) AND (${conditions.join(' OR ')})
  `, ...params);

    return {
      saved: rows.length > 0,
      lists: rows.map(r => {
        const role = this.roleOf(userId, r.collection_id);
        return {
          collection_id: r.collection_id,
          name: r.name,
          place_id: r.place_id,
          status: r.status ?? 'idea',
          can_edit: role !== null && role !== 'viewer',
        };
      }),
    };
  }

  // -------------------------------------------------------------------------
  // WebSocket notify
  // -------------------------------------------------------------------------

  notifyCollectionUsers(
    collectionId: number,
    excludeSid: string | undefined,
    event: 'collections:updated' | 'collections:accepted' | 'collections:declined' | 'collections:left' = 'collections:updated',
  ): void {
    const owner = this.db.get<{ owner_id: number }>('SELECT owner_id FROM collections WHERE id = ?', collectionId);
    if (!owner) return;
    const userIds = [owner.owner_id];
    const members = this.db.all<{ user_id: number }>("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'accepted'", collectionId);
    members.forEach(m => userIds.push(m.user_id));
    userIds.forEach(id => this.realtime.broadcastToUser(id, { type: event, collectionId }, excludeSid));
  }

  // -------------------------------------------------------------------------
  // Labels — per-collection custom labels. Managing + assigning both require
  // edit rights (owner/admin/editor); filtering is a read available to every
  // member.
  // -------------------------------------------------------------------------

  private collectionIdOfLabel(labelId: number): number {
    const row = this.db.get<{ collection_id: number }>('SELECT collection_id FROM collection_labels WHERE id = ?', labelId);
    if (!row) httpError(404, 'Label not found');
    return row.collection_id;
  }

  private getLabelById(labelId: number): CollectionLabel {
    return this.db.get<CollectionLabel>('SELECT id, collection_id, name, color, sort_order FROM collection_labels WHERE id = ?', labelId) as CollectionLabel;
  }

  /** Replace a place's label assignments, keeping only labels of `collectionId`. */
  private setPlaceLabels(placeId: number, collectionId: number, labelIds: number[]): void {
    this.db.run('DELETE FROM collection_place_labels WHERE collection_place_id = ?', placeId);
    if (labelIds.length === 0) return;
    const valid = new Set(this.loadLabelsByCollection(collectionId).map(l => l.id));
    const stmt = this.db.prepare('INSERT OR IGNORE INTO collection_place_labels (collection_place_id, label_id) VALUES (?, ?)');
    for (const id of labelIds) if (valid.has(id)) stmt.run(placeId, id);
  }

  createLabel(userId: number, collectionId: number, name: string, color?: string, socketId?: string): CollectionLabel {
    this.assertCanEdit(userId, collectionId);
    const trimmed = name.trim();
    if (!trimmed) httpError(400, 'Label name is required');
    const count = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM collection_labels WHERE collection_id = ?', collectionId)!.n;
    if (count >= MAX_LABELS_PER_COLLECTION) httpError(400, `A list can have at most ${MAX_LABELS_PER_COLLECTION} labels`);
    if (this.db.get('SELECT 1 FROM collection_labels WHERE collection_id = ? AND lower(name) = lower(?)', collectionId, trimmed)) {
      httpError(409, 'A label with this name already exists');
    }
    const nextSort = this.db.get<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collection_labels WHERE collection_id = ?', collectionId)!.m + 1;
    const res = this.db.run('INSERT INTO collection_labels (collection_id, name, color, sort_order) VALUES (?, ?, ?, ?)',
      collectionId, trimmed, color ?? '#6366f1', nextSort);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getLabelById(Number(res.lastInsertRowid));
  }

  updateLabel(userId: number, labelId: number, body: { name?: string; color?: string; sort_order?: number }, socketId?: string): CollectionLabel {
    const collectionId = this.collectionIdOfLabel(labelId);
    this.assertCanEdit(userId, collectionId);
    const updates: string[] = [];
    const params: (string | number)[] = [];
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) httpError(400, 'Label name is required');
      if (this.db.get('SELECT 1 FROM collection_labels WHERE collection_id = ? AND lower(name) = lower(?) AND id != ?', collectionId, trimmed, labelId)) {
        httpError(409, 'A label with this name already exists');
      }
      updates.push('name = ?'); params.push(trimmed);
    }
    if (body.color !== undefined) { updates.push('color = ?'); params.push(body.color); }
    if (body.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(body.sort_order); }
    if (updates.length > 0) {
      params.push(labelId);
      this.db.run(`UPDATE collection_labels SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
    return this.getLabelById(labelId);
  }

  deleteLabel(userId: number, labelId: number, socketId?: string): void {
    const collectionId = this.collectionIdOfLabel(labelId);
    this.assertCanEdit(userId, collectionId);
    this.db.run('DELETE FROM collection_labels WHERE id = ?', labelId); // CASCADE clears place assignments
    this.notifyCollectionUsers(collectionId, socketId, 'collections:updated');
  }

  /** Bulk add (or remove) one or more labels across a selection of places.
   *  Places are grouped by list so each list is permission-checked once, and only
   *  labels that belong to that list are applied. */
  assignLabels(userId: number, labelIds: number[], placeIds: number[], remove: boolean, socketId?: string): { changed: number } {
    const byCollection = new Map<number, number[]>();
    for (const pid of placeIds) {
      const cid = this.collectionIdOfPlace(pid);
      if (!byCollection.has(cid)) byCollection.set(cid, []);
      byCollection.get(cid)!.push(pid);
    }
    // All-or-nothing since the post-fold quirk pass: every touched list is
    // permission-checked BEFORE any write (the relocated legacy checked inside
    // the write loop, so a later list's 403 left earlier lists modified), and
    // the writes then run in one transaction. Broadcasts still skip lists where
    // no provided label applied.
    for (const cid of byCollection.keys()) this.assertCanEdit(userId, cid);
    let changed = 0;
    const notified: number[] = [];
    this.db.transaction(() => {
      for (const [cid, pids] of byCollection) {
        const valid = new Set(this.loadLabelsByCollection(cid).map(l => l.id));
        const applicable = labelIds.filter(id => valid.has(id));
        if (applicable.length === 0) continue;
        if (remove) {
          const del = this.db.prepare('DELETE FROM collection_place_labels WHERE collection_place_id = ? AND label_id = ?');
          for (const pid of pids) for (const lid of applicable) changed += del.run(pid, lid).changes;
        } else {
          const ins = this.db.prepare('INSERT OR IGNORE INTO collection_place_labels (collection_place_id, label_id) VALUES (?, ?)');
          for (const pid of pids) for (const lid of applicable) changed += ins.run(pid, lid).changes;
        }
        notified.push(cid);
      }
    });
    for (const cid of notified) this.notifyCollectionUsers(cid, socketId, 'collections:updated');
    return { changed };
  }

  // -------------------------------------------------------------------------
  // Fusion invitations (mirror vacayService, dropping the one-fusion guards)
  // -------------------------------------------------------------------------

  sendInvite(
    collectionId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number,
    role: 'viewer' | 'editor' | 'admin' = 'editor',
  ): { error?: string; status?: number } {
    if (!this.isOwner(inviterId, collectionId)) return { error: 'Not allowed', status: 403 };
    if (targetUserId === inviterId) return { error: 'Cannot invite yourself', status: 400 };

    const targetUser = this.db.get('SELECT id, username FROM users WHERE id = ?', targetUserId);
    if (!targetUser) return { error: 'User not found', status: 404 };

    const existing = this.db.get<{ id: number; status: string }>('SELECT id, status FROM collection_members WHERE collection_id = ? AND user_id = ?', collectionId, targetUserId);
    if (existing) {
      if (existing.status === 'accepted') return { error: 'Already a member', status: 400 };
      if (existing.status === 'pending') return { error: 'Invite already pending', status: 400 };
    }

    this.db.run("INSERT INTO collection_members (collection_id, user_id, status, role) VALUES (?, ?, 'pending', ?)", collectionId, targetUserId, role);

    this.realtime.broadcastToUser(targetUserId, { type: 'collections:invite', from: { id: inviterId, username: inviterUsername }, collectionId });

    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    this.notifications.send({ event: 'collection_invite', actorId: inviterId, scope: 'user', targetId: targetUserId, params: { actor: inviterEmail, collectionId: String(collectionId) } }).catch(() => {});

    return {};
  }

  acceptInvite(userId: number, collectionId: number, socketId: string | undefined): { error?: string; status?: number } {
    const invite = this.db.get<{ id: number }>("SELECT id FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'", collectionId, userId);
    if (!invite) return { error: 'No pending invite', status: 404 };
    this.db.run("UPDATE collection_members SET status = 'accepted' WHERE id = ?", invite.id);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:accepted');
    return {};
  }

  declineInvite(userId: number, collectionId: number, socketId: string | undefined): void {
    this.db.run("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'", collectionId, userId);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:declined');
  }

  cancelInvite(collectionId: number, ownerId: number, targetUserId: number): void {
    if (!this.isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
    this.db.run("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'", collectionId, targetUserId);
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:cancelled', collectionId });
  }

  leaveCollection(userId: number, collectionId: number, socketId: string | undefined): void {
    if (this.isOwner(userId, collectionId)) httpError(400, 'Owner cannot leave; delete the list');
    this.db.run("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'", collectionId, userId);
    this.notifyCollectionUsers(collectionId, socketId, 'collections:left');
  }

  /** Owner removes an already-accepted member (a "kick"). */
  removeMember(ownerId: number, collectionId: number, targetUserId: number): void {
    if (!this.isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
    if (targetUserId === ownerId) httpError(400, 'Owner cannot be removed');
    const res = this.db.run("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'", collectionId, targetUserId);
    if (res.changes === 0) httpError(404, 'Member not found');
    this.notifyCollectionUsers(collectionId, undefined, 'collections:left'); // refresh remaining members
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:removed', collectionId }); // bounce the removed user
  }

  /** Owner changes an accepted member's permission role (viewer/editor/admin). */
  setMemberRole(ownerId: number, collectionId: number, targetUserId: number, role: 'viewer' | 'editor' | 'admin'): void {
    if (!this.isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
    const res = this.db.run("UPDATE collection_members SET role = ? WHERE collection_id = ? AND user_id = ? AND status = 'accepted'", role, collectionId, targetUserId);
    if (res.changes === 0) httpError(404, 'Member not found');
    this.notifyCollectionUsers(collectionId, undefined, 'collections:updated'); // re-gate the member live
    this.realtime.broadcastToUser(targetUserId, { type: 'collections:updated', collectionId });
  }

  availableUsers(ownerId: number, collectionId: number): { id: number; username: string }[] {
    return this.db.all<{ id: number; username: string }>(`
    SELECT u.id, u.username FROM users u
    WHERE u.id != ?
      AND u.id NOT IN (SELECT user_id FROM collection_members WHERE collection_id = ?)
      AND u.is_guest = 0
    ORDER BY u.username
  `, ownerId, collectionId);
  }

  findMembershipForUser(userId: number, collectionId: number): { is_member: boolean; is_owner: boolean; status: string | null } {
    if (this.isOwner(userId, collectionId)) return { is_member: true, is_owner: true, status: 'accepted' };
    const row = this.db.get<{ status: string }>('SELECT status FROM collection_members WHERE collection_id = ? AND user_id = ?', collectionId, userId);
    return { is_member: row?.status === 'accepted', is_owner: false, status: row?.status ?? null };
  }
}
