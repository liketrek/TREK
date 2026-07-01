import fs from 'fs';
import path from 'path';
import { db, canAccessTrip } from '../db/database';
import { broadcastToUser } from '../websocket';
import { checkPermission } from './permissions';
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
  CollectionStatus,
} from '@trek/shared';

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

/**
 * Reclaim a replaced cover file. Path-confined to uploads/covers (mirrors
 * tripService.deleteOldCover — kept local so this service doesn't pull the
 * trips import graph). Collection + trip covers share the same directory.
 */
function deleteOldCollectionCover(coverImage: string | null | undefined): void {
  if (!coverImage) return;
  const coversDir = path.resolve(__dirname, '../../uploads/covers');
  const resolved = path.resolve(path.join(coversDir, path.basename(coverImage)));
  if (resolved.startsWith(coversDir + path.sep) && fs.existsSync(resolved)) fs.unlinkSync(resolved);
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

// ---------------------------------------------------------------------------
// Visibility — a user may see/edit a collection if they own it OR are an
// accepted member. Every read/write goes through assertAccess.
// ---------------------------------------------------------------------------

export function accessibleCollectionIds(userId: number): number[] {
  const rows = db.prepare(`
    SELECT id FROM collections WHERE owner_id = ?
    UNION
    SELECT collection_id FROM collection_members WHERE user_id = ? AND status = 'accepted'
  `).all(userId, userId) as { id: number }[];
  return rows.map(r => r.id);
}

function isVisible(userId: number, collectionId: number): boolean {
  const row = db.prepare(`
    SELECT 1 FROM collections WHERE id = ? AND owner_id = ?
    UNION
    SELECT 1 FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'
    LIMIT 1
  `).get(collectionId, userId, collectionId, userId);
  return !!row;
}

export function assertAccess(userId: number, collectionId: number): void {
  if (!isVisible(userId, collectionId)) httpError(404, 'Collection not found');
}

export function isOwner(userId: number, collectionId: number): boolean {
  const row = db.prepare('SELECT 1 FROM collections WHERE id = ? AND owner_id = ?').get(collectionId, userId);
  return !!row;
}

export type EffectiveRole = 'owner' | 'admin' | 'editor' | 'viewer' | null;
/** The viewer's effective permission on a list: owner (full), or their accepted
 *  member role, or null when they have no access. */
export function roleOf(userId: number, collectionId: number): EffectiveRole {
  if (isOwner(userId, collectionId)) return 'owner';
  const row = db.prepare("SELECT role FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'")
    .get(collectionId, userId) as { role: string } | undefined;
  if (!row) return null;
  return row.role === 'admin' || row.role === 'viewer' ? row.role : 'editor';
}
/** Add/edit a place — owner, admin or editor. 404 hides lists you can't see,
 *  403 for a read-only (viewer) member. */
export function assertCanEdit(userId: number, collectionId: number): void {
  const r = roleOf(userId, collectionId);
  if (r === null) httpError(404, 'Collection not found');
  if (r === 'viewer') httpError(403, 'You have read-only access to this list');
}
/** Delete a place — owner or admin only. */
export function assertCanDelete(userId: number, collectionId: number): void {
  const r = roleOf(userId, collectionId);
  if (r === null) httpError(404, 'Collection not found');
  if (r !== 'owner' && r !== 'admin') httpError(403, 'Only an admin can delete places from this list');
}

function ownerOf(collectionId: number): number {
  const row = db.prepare('SELECT owner_id FROM collections WHERE id = ?').get(collectionId) as { owner_id: number } | undefined;
  if (!row) httpError(404, 'Collection not found');
  return row.owner_id;
}

// ---------------------------------------------------------------------------
// Hydration helpers
// ---------------------------------------------------------------------------

interface PlaceRow extends CollectionPlace {
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}

function loadTagsByCollectionPlaceIds(placeIds: number[]): Record<number, { id: number; name: string; color: string }[]> {
  const out: Record<number, { id: number; name: string; color: string }[]> = {};
  if (placeIds.length === 0) return out;
  const placeholders = placeIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT cpt.collection_place_id AS pid, t.id, t.name, t.color
    FROM collection_place_tags cpt
    JOIN tags t ON t.id = cpt.tag_id
    WHERE cpt.collection_place_id IN (${placeholders})
  `).all(...placeIds) as { pid: number; id: number; name: string; color: string }[];
  for (const r of rows) {
    if (!out[r.pid]) out[r.pid] = [];
    out[r.pid].push({ id: r.id, name: r.name, color: r.color });
  }
  return out;
}

function hydratePlaces(rows: PlaceRow[]): CollectionPlace[] {
  const ids = rows.map(r => r.id);
  const tagsByPlace = loadTagsByCollectionPlaceIds(ids);
  return rows.map(r => {
    const { category_name, category_color, category_icon, ...rest } = r;
    return {
      ...rest,
      links: parseLinks((r as { links?: unknown }).links),
      category: r.category_id
        ? { id: r.category_id, name: category_name ?? '', color: category_color ?? null, icon: category_icon ?? null }
        : undefined,
      tags: tagsByPlace[r.id] || [],
    } as CollectionPlace;
  });
}

function getPlaceById(placeId: number): CollectionPlace {
  const row = db.prepare(`
    SELECT cp.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM collection_places cp
    LEFT JOIN categories c ON cp.category_id = c.id
    WHERE cp.id = ?
  `).get(placeId) as PlaceRow | undefined;
  if (!row) httpError(404, 'Place not found');
  return hydratePlaces([row])[0];
}

function collectionIdOfPlace(placeId: number): number {
  const row = db.prepare('SELECT collection_id FROM collection_places WHERE id = ?').get(placeId) as { collection_id: number } | undefined;
  if (!row) httpError(404, 'Place not found');
  return row.collection_id;
}

function buildMembers(collectionId: number): CollectionMember[] {
  const owner = db.prepare(`
    SELECT u.id AS user_id, u.username, u.email, u.avatar
    FROM collections col JOIN users u ON u.id = col.owner_id
    WHERE col.id = ?
  `).get(collectionId) as Omit<CollectionMember, 'status' | 'is_owner'> | undefined;
  const members = db.prepare(`
    SELECT u.id AS user_id, u.username, u.email, u.avatar, cm.status, cm.role
    FROM collection_members cm JOIN users u ON u.id = cm.user_id
    WHERE cm.collection_id = ?
    ORDER BY u.username
  `).all(collectionId) as Omit<CollectionMember, 'is_owner'>[];
  const result: CollectionMember[] = [];
  if (owner) result.push({ ...owner, status: 'accepted', role: 'admin', is_owner: true });
  for (const m of members) result.push({ ...m, is_owner: false });
  return result;
}

function getCollectionRow(id: number): Collection {
  const col = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as (Collection & { links?: unknown }) | undefined;
  if (!col) httpError(404, 'Collection not found');
  const placeCount = (db.prepare('SELECT COUNT(*) AS n FROM collection_places WHERE collection_id = ?').get(id) as { n: number }).n;
  return { ...col, links: parseLinks(col.links), place_count: placeCount, members: buildMembers(id) };
}

// ---------------------------------------------------------------------------
// Lists CRUD
// ---------------------------------------------------------------------------

export function listCollections(userId: number): CollectionListResponse {
  const ids = accessibleCollectionIds(userId);
  const collections: Collection[] = ids
    .map(id => {
      const col = getCollectionRow(id);
      return { ...col, is_owner: col.owner_id === userId };
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);

  const incomingInvites = (db.prepare(`
    SELECT cm.collection_id, c.name, u.id AS from_id, u.username AS from_username
    FROM collection_members cm
    JOIN collections c ON c.id = cm.collection_id
    JOIN users u ON u.id = c.owner_id
    WHERE cm.user_id = ? AND cm.status = 'pending'
  `).all(userId) as { collection_id: number; name: string; from_id: number; from_username: string }[])
    .map(r => ({ collection_id: r.collection_id, name: r.name, from: { id: r.from_id, username: r.from_username } }));

  return { collections, incomingInvites };
}

export function getCollection(userId: number, id: number): CollectionDetailResponse {
  assertAccess(userId, id);
  const collection = getCollectionRow(id);
  const rows = db.prepare(`
    SELECT cp.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM collection_places cp
    LEFT JOIN categories c ON cp.category_id = c.id
    WHERE cp.collection_id = ?
    ORDER BY cp.sort_order, cp.created_at
  `).all(id) as PlaceRow[];
  return { collection: { ...collection, is_owner: collection.owner_id === userId }, places: hydratePlaces(rows) };
}

export function createCollection(userId: number, body: CollectionCreateRequest): Collection {
  const max = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collections WHERE owner_id = ?').get(userId) as { m: number }).m;
  const result = db.prepare(`
    INSERT INTO collections (owner_id, name, description, color, icon, cover_image, links, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    body.name,
    body.description ?? null,
    body.color ?? '#6366f1',
    body.icon ?? 'Bookmark',
    body.cover_image ?? null,
    serializeLinks(body.links),
    max + 1,
  );
  const col = getCollectionRow(Number(result.lastInsertRowid));
  return { ...col, is_owner: true };
}

export function updateCollection(userId: number, id: number, body: CollectionUpdateRequest, socketId?: string): Collection {
  assertCanEdit(userId, id);
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
    db.prepare(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  notifyCollectionUsers(id, socketId, 'collections:updated');
  const col = getCollectionRow(id);
  return { ...col, is_owner: col.owner_id === userId };
}

/** Set (or clear) a list's cover image, reclaiming the previous file. */
export function setCollectionCover(userId: number, id: number, coverUrl: string | null, socketId?: string): Collection {
  assertCanEdit(userId, id);
  const prev = (db.prepare('SELECT cover_image FROM collections WHERE id = ?').get(id) as { cover_image: string | null } | undefined)?.cover_image ?? null;
  db.prepare('UPDATE collections SET cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(coverUrl, id);
  if (prev && prev !== coverUrl) deleteOldCollectionCover(prev);
  notifyCollectionUsers(id, socketId, 'collections:updated');
  const col = getCollectionRow(id);
  return { ...col, is_owner: col.owner_id === userId };
}

export function deleteCollection(userId: number, id: number): void {
  assertAccess(userId, id);
  if (!isOwner(userId, id)) httpError(403, 'Only the owner can delete this list');

  // Snapshot recipients BEFORE the cascade wipes collection_members.
  const accepted = (db.prepare("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'accepted'").all(id) as { user_id: number }[]).map(r => r.user_id);
  const pending = (db.prepare("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'pending'").all(id) as { user_id: number }[]).map(r => r.user_id);

  db.prepare('DELETE FROM collections WHERE id = ?').run(id); // CASCADE drops members + places + tags

  [...new Set([...accepted, ...pending])]
    .filter(uid => uid !== userId)
    .forEach(uid => broadcastToUser(uid, { type: 'collections:deleted', collectionId: id }));
}

export function reorderCollections(userId: number, orderedIds: number[]): void {
  const visible = new Set(accessibleCollectionIds(userId));
  const stmt = db.prepare('UPDATE collections SET sort_order = ? WHERE id = ?');
  orderedIds.forEach((cid, index) => {
    if (visible.has(cid)) stmt.run(index, cid);
  });
}

// ---------------------------------------------------------------------------
// Dedup (collection-scoped ports of placeService helpers)
// ---------------------------------------------------------------------------

const COORD_DEDUP_TOLERANCE = 0.0001; // ≈ 11 m

interface DedupSet {
  names: Set<string>;
  coords: Array<{ lat: number; lng: number }>;
}

function buildDedupSet(collectionId: number): DedupSet {
  const rows = db.prepare('SELECT name, lat, lng FROM collection_places WHERE collection_id = ?').all(collectionId) as Array<{
    name: string | null; lat: number | null; lng: number | null;
  }>;
  const names = new Set<string>();
  const coords: Array<{ lat: number; lng: number }> = [];
  for (const row of rows) {
    if (row.name) names.add(row.name.trim().toLowerCase());
    else if (row.lat != null && row.lng != null) coords.push({ lat: row.lat, lng: row.lng });
  }
  return { names, coords };
}

function isCollectionPlaceDuplicate(
  candidate: { name: string | null | undefined; lat: number | null | undefined; lng: number | null | undefined },
  dedup: DedupSet,
): boolean {
  const normalizedName = candidate.name?.trim().toLowerCase();
  if (normalizedName) return dedup.names.has(normalizedName);
  if (candidate.lat != null && candidate.lng != null) {
    return dedup.coords.some(c =>
      Math.abs(c.lat - candidate.lat!) <= COORD_DEDUP_TOLERANCE &&
      Math.abs(c.lng - candidate.lng!) <= COORD_DEDUP_TOLERANCE,
    );
  }
  return false;
}

function findDuplicateCollectionPlace(
  collectionId: number,
  candidate: { name: string | null | undefined; lat: number | null | undefined; lng: number | null | undefined },
): { id: number; name: string } | null {
  const normalizedName = candidate.name?.trim().toLowerCase();
  if (normalizedName) {
    const dup = db.prepare(`
      SELECT id, name FROM collection_places
      WHERE collection_id = ? AND lower(trim(name)) = ?
      ORDER BY id ASC LIMIT 1
    `).get(collectionId, normalizedName) as { id: number; name: string } | undefined;
    if (dup) return dup;
  }
  if (candidate.lat != null && candidate.lng != null) {
    return (db.prepare(`
      SELECT id, name FROM collection_places
      WHERE collection_id = ? AND lat IS NOT NULL AND lng IS NOT NULL
        AND abs(lat - ?) <= ? AND abs(lng - ?) <= ?
      ORDER BY id ASC LIMIT 1
    `).get(collectionId, candidate.lat, COORD_DEDUP_TOLERANCE, candidate.lng, COORD_DEDUP_TOLERANCE) as { id: number; name: string } | undefined) || null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Saved places CRUD
// ---------------------------------------------------------------------------

function attachTags(collectionPlaceId: number, tagIds: number[] | undefined): void {
  if (!tagIds || tagIds.length === 0) return;
  const stmt = db.prepare('INSERT OR IGNORE INTO collection_place_tags (collection_place_id, tag_id) VALUES (?, ?)');
  for (const tid of tagIds) stmt.run(collectionPlaceId, tid);
}

export function savePlace(userId: number, body: CollectionSavePlaceRequest, socketId?: string): CollectionSaveResult {
  assertCanEdit(userId, body.collection_id);

  if (!body.force) {
    const dup = findDuplicateCollectionPlace(body.collection_id, { name: body.name, lat: body.lat, lng: body.lng });
    if (dup) return { duplicate: true, duplicateOf: dup };
  }

  const ownerId = ownerOf(body.collection_id);
  const result = db.prepare(`
    INSERT INTO collection_places (
      collection_id, owner_id, saved_by, name, description, lat, lng, address,
      category_id, price, currency, notes, image_url, google_place_id, google_ftid,
      osm_id, website, phone, status, source_trip_id, source_place_id, links
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.collection_id, ownerId, userId,
    body.name, body.description ?? null, body.lat ?? null, body.lng ?? null, body.address ?? null,
    body.category_id ?? null, body.price ?? null, body.currency ?? null, body.notes ?? null,
    body.image_url ?? null, body.google_place_id ?? null, body.google_ftid ?? null,
    body.osm_id ?? null, body.website ?? null, body.phone ?? null,
    body.status ?? 'idea', body.source_trip_id ?? null, body.source_place_id ?? null,
    serializeLinks(body.links),
  );

  const placeId = Number(result.lastInsertRowid);
  attachTags(placeId, body.tag_ids);
  notifyCollectionUsers(body.collection_id, socketId, 'collections:updated');
  return { place: getPlaceById(placeId) };
}

export function saveFromTripPlace(
  userId: number, collectionId: number, tripId: number, placeId: number, force?: boolean,
): CollectionSaveResult {
  assertCanEdit(userId, collectionId);
  if (!canAccessTrip(tripId, userId)) httpError(404, 'Trip not found');

  const place = db.prepare('SELECT * FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId) as Record<string, unknown> | undefined;
  if (!place) httpError(404, 'Place not found');

  return savePlace(userId, {
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
  });
}

export function updatePlace(userId: number, placeId: number, body: import('@trek/shared').CollectionPlaceUpdateRequest, socketId?: string): CollectionPlace {
  const currentCollection = collectionIdOfPlace(placeId);
  assertCanEdit(userId, currentCollection);

  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
  if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description ?? null); }
  if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes ?? null); }
  if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
  if (body.category_id !== undefined) { updates.push('category_id = ?'); params.push(body.category_id ?? null); }
  if (body.links !== undefined) { updates.push('links = ?'); params.push(serializeLinks(body.links)); }

  let movedTo: number | null = null;
  if (body.collection_id !== undefined && body.collection_id !== currentCollection) {
    assertCanEdit(userId, body.collection_id);
    updates.push('collection_id = ?'); params.push(body.collection_id);
    updates.push('owner_id = ?'); params.push(ownerOf(body.collection_id));
    movedTo = body.collection_id;
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(placeId);
    db.prepare(`UPDATE collection_places SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  if (body.tag_ids !== undefined) {
    db.prepare('DELETE FROM collection_place_tags WHERE collection_place_id = ?').run(placeId);
    attachTags(placeId, body.tag_ids);
  }

  notifyCollectionUsers(currentCollection, socketId, 'collections:updated');
  if (movedTo) notifyCollectionUsers(movedTo, socketId, 'collections:updated');
  return getPlaceById(placeId);
}

export function setStatus(userId: number, placeId: number, status: CollectionStatus, socketId?: string): CollectionPlace {
  const collectionId = collectionIdOfPlace(placeId);
  assertCanEdit(userId, collectionId);
  db.prepare("UPDATE collection_places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, placeId);
  notifyCollectionUsers(collectionId, socketId, 'collections:updated');
  return getPlaceById(placeId);
}

export function deletePlace(userId: number, placeId: number, socketId?: string): void {
  const collectionId = collectionIdOfPlace(placeId);
  assertCanDelete(userId, collectionId);
  db.prepare('DELETE FROM collection_places WHERE id = ?').run(placeId); // CASCADE drops tags. NO photo-cache reclaim.
  notifyCollectionUsers(collectionId, socketId, 'collections:updated');
}

export function deletePlacesMany(userId: number, ids: number[], socketId?: string): number[] {
  const deleted: number[] = [];
  const touched = new Set<number>();
  for (const id of ids) {
    const collectionId = collectionIdOfPlace(id);
    assertCanDelete(userId, collectionId);
    db.prepare('DELETE FROM collection_places WHERE id = ?').run(id);
    deleted.push(id);
    touched.add(collectionId);
  }
  touched.forEach(cid => notifyCollectionUsers(cid, socketId, 'collections:updated'));
  return deleted;
}

// ---------------------------------------------------------------------------
// Copy to trip
// ---------------------------------------------------------------------------

export function copyToTrip(userId: number, body: CollectionCopyToTripRequest): { copied: number; skipped: { id: number; name: string }[] } {
  const trip = canAccessTrip(body.trip_id, userId) as { id: number; user_id: number } | undefined;
  if (!trip) httpError(404, 'Trip not found');
  const role = (db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined)?.role ?? 'user';
  if (!checkPermission('place_edit', role, trip.user_id, userId, trip.user_id !== userId)) {
    httpError(403, 'Not allowed to edit this trip');
  }

  // Visibility on every SOURCE place — no cross-user exfiltration via copy.
  const sources: Array<{ id: number; name: string; description: string | null; lat: number | null; lng: number | null;
    address: string | null; category_id: number | null; price: number | null; currency: string | null;
    notes: string | null; image_url: string | null; google_place_id: string | null; google_ftid: string | null;
    osm_id: string | null; website: string | null; phone: string | null; collection_id: number }> = [];
  for (const pid of body.place_ids) {
    const row = db.prepare(`
      SELECT id, collection_id, name, description, lat, lng, address, category_id, price, currency,
             notes, image_url, google_place_id, google_ftid, osm_id, website, phone
      FROM collection_places WHERE id = ?
    `).get(pid) as (typeof sources)[number] | undefined;
    if (!row) httpError(404, 'Place not found');
    assertAccess(userId, row.collection_id);
    sources.push(row);
  }

  // Trip dedup set (mirrors placeService.buildDedupSet).
  const existing = db.prepare('SELECT name, lat, lng FROM places WHERE trip_id = ?').all(body.trip_id) as Array<{ name: string | null; lat: number | null; lng: number | null }>;
  const dedup: DedupSet = { names: new Set(), coords: [] };
  for (const r of existing) {
    if (r.name) dedup.names.add(r.name.trim().toLowerCase());
    else if (r.lat != null && r.lng != null) dedup.coords.push({ lat: r.lat, lng: r.lng });
  }

  const insertPlace = db.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price,
      currency, notes, image_url, google_place_id, google_ftid, website, phone, osm_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTag = db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');

  let copied = 0;
  const skipped: { id: number; name: string }[] = [];
  for (const s of sources) {
    if (!body.force && isCollectionPlaceDuplicate({ name: s.name, lat: s.lat, lng: s.lng }, dedup)) {
      skipped.push({ id: s.id, name: s.name });
      continue;
    }
    const res = insertPlace.run(
      body.trip_id, s.name, s.description, s.lat, s.lng, s.address, s.category_id, s.price,
      s.currency, s.notes, s.image_url, s.google_place_id, s.google_ftid, s.website, s.phone, s.osm_id,
    );
    const newPlaceId = Number(res.lastInsertRowid);
    const tagIds = db.prepare('SELECT tag_id FROM collection_place_tags WHERE collection_place_id = ?').all(s.id) as { tag_id: number }[];
    for (const t of tagIds) insertTag.run(newPlaceId, t.tag_id);

    if (s.name) dedup.names.add(s.name.trim().toLowerCase());
    else if (s.lat != null && s.lng != null) dedup.coords.push({ lat: s.lat, lng: s.lng });
    copied++;
  }
  return { copied, skipped };
}

// ---------------------------------------------------------------------------
// Library-wide membership lookup (inspector indicator)
// ---------------------------------------------------------------------------

export function findMembership(
  userId: number,
  query: { google_place_id?: string; google_ftid?: string; name?: string; lat?: number; lng?: number },
): CollectionMembership {
  const ids = accessibleCollectionIds(userId);
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

  const rows = db.prepare(`
    SELECT cp.id AS place_id, cp.collection_id, c.name
    FROM collection_places cp
    JOIN collections c ON c.id = cp.collection_id
    WHERE cp.collection_id IN (${placeholders}) AND (${conditions.join(' OR ')})
  `).all(...params) as { place_id: number; collection_id: number; name: string }[];

  return { saved: rows.length > 0, lists: rows.map(r => ({ collection_id: r.collection_id, name: r.name, place_id: r.place_id })) };
}

// ---------------------------------------------------------------------------
// WebSocket notify
// ---------------------------------------------------------------------------

export function notifyCollectionUsers(collectionId: number, excludeSid: string | undefined, event = 'collections:updated'): void {
  const owner = db.prepare('SELECT owner_id FROM collections WHERE id = ?').get(collectionId) as { owner_id: number } | undefined;
  if (!owner) return;
  const userIds = [owner.owner_id];
  const members = db.prepare("SELECT user_id FROM collection_members WHERE collection_id = ? AND status = 'accepted'").all(collectionId) as { user_id: number }[];
  members.forEach(m => userIds.push(m.user_id));
  userIds.forEach(id => broadcastToUser(id, { type: event, collectionId }, excludeSid));
}

// ---------------------------------------------------------------------------
// Fusion invitations (mirror vacayService, dropping the one-fusion guards)
// ---------------------------------------------------------------------------

export function sendInvite(
  collectionId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number,
  role: 'viewer' | 'editor' | 'admin' = 'editor',
): { error?: string; status?: number } {
  if (!isOwner(inviterId, collectionId)) return { error: 'Not allowed', status: 403 };
  if (targetUserId === inviterId) return { error: 'Cannot invite yourself', status: 400 };

  const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser) return { error: 'User not found', status: 404 };

  const existing = db.prepare('SELECT id, status FROM collection_members WHERE collection_id = ? AND user_id = ?').get(collectionId, targetUserId) as { id: number; status: string } | undefined;
  if (existing) {
    if (existing.status === 'accepted') return { error: 'Already a member', status: 400 };
    if (existing.status === 'pending') return { error: 'Invite already pending', status: 400 };
  }

  db.prepare("INSERT INTO collection_members (collection_id, user_id, status, role) VALUES (?, ?, 'pending', ?)").run(collectionId, targetUserId, role);

  broadcastToUser(targetUserId, { type: 'collections:invite', from: { id: inviterId, username: inviterUsername }, collectionId });

  import('../services/notificationService').then(({ send }) => {
    send({ event: 'collection_invite', actorId: inviterId, scope: 'user', targetId: targetUserId, params: { actor: inviterEmail, collectionId: String(collectionId) } }).catch(() => {});
  }).catch(() => {});

  return {};
}

export function acceptInvite(userId: number, collectionId: number, socketId: string | undefined): { error?: string; status?: number } {
  const invite = db.prepare("SELECT id FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'").get(collectionId, userId) as { id: number } | undefined;
  if (!invite) return { error: 'No pending invite', status: 404 };
  db.prepare("UPDATE collection_members SET status = 'accepted' WHERE id = ?").run(invite.id);
  notifyCollectionUsers(collectionId, socketId, 'collections:accepted');
  return {};
}

export function declineInvite(userId: number, collectionId: number, socketId: string | undefined): void {
  db.prepare("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'").run(collectionId, userId);
  notifyCollectionUsers(collectionId, socketId, 'collections:declined');
}

export function cancelInvite(collectionId: number, ownerId: number, targetUserId: number): void {
  if (!isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
  db.prepare("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'pending'").run(collectionId, targetUserId);
  broadcastToUser(targetUserId, { type: 'collections:cancelled', collectionId });
}

export function leaveCollection(userId: number, collectionId: number, socketId: string | undefined): void {
  if (isOwner(userId, collectionId)) httpError(400, 'Owner cannot leave; delete the list');
  db.prepare("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'").run(collectionId, userId);
  notifyCollectionUsers(collectionId, socketId, 'collections:left');
}

/** Owner removes an already-accepted member (a "kick"). */
export function removeMember(ownerId: number, collectionId: number, targetUserId: number): void {
  if (!isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
  if (targetUserId === ownerId) httpError(400, 'Owner cannot be removed');
  const res = db.prepare("DELETE FROM collection_members WHERE collection_id = ? AND user_id = ? AND status = 'accepted'").run(collectionId, targetUserId);
  if (res.changes === 0) httpError(404, 'Member not found');
  notifyCollectionUsers(collectionId, undefined, 'collections:left'); // refresh remaining members
  broadcastToUser(targetUserId, { type: 'collections:removed', collectionId }); // bounce the removed user
}

/** Owner changes an accepted member's permission role (viewer/editor/admin). */
export function setMemberRole(ownerId: number, collectionId: number, targetUserId: number, role: 'viewer' | 'editor' | 'admin'): void {
  if (!isOwner(ownerId, collectionId)) httpError(403, 'Not allowed');
  const res = db.prepare("UPDATE collection_members SET role = ? WHERE collection_id = ? AND user_id = ? AND status = 'accepted'").run(role, collectionId, targetUserId);
  if (res.changes === 0) httpError(404, 'Member not found');
  notifyCollectionUsers(collectionId, undefined, 'collections:updated'); // re-gate the member live
  broadcastToUser(targetUserId, { type: 'collections:updated', collectionId });
}

export function availableUsers(ownerId: number, collectionId: number): { id: number; username: string }[] {
  return db.prepare(`
    SELECT u.id, u.username FROM users u
    WHERE u.id != ?
      AND u.id NOT IN (SELECT user_id FROM collection_members WHERE collection_id = ?)
      AND u.is_guest = 0
    ORDER BY u.username
  `).all(ownerId, collectionId) as { id: number; username: string }[];
}

export function findMembershipForUser(userId: number, collectionId: number): { is_member: boolean; is_owner: boolean; status: string | null } {
  if (isOwner(userId, collectionId)) return { is_member: true, is_owner: true, status: 'accepted' };
  const row = db.prepare('SELECT status FROM collection_members WHERE collection_id = ? AND user_id = ?').get(collectionId, userId) as { status: string } | undefined;
  return { is_member: row?.status === 'accepted', is_owner: false, status: row?.status ?? null };
}
