import { XMLParser, XMLValidator } from 'fast-xml-parser';
import unzipper from 'unzipper';
import { db, getPlaceWithTags } from '../db/database';
import { loadTagsByPlaceIds } from './queryHelpers';
import { checkSsrf, safeFetchFollow, SsrfBlockedError } from '../utils/ssrfGuard';
import { Place } from '../types';
import {
  buildCategoryNameLookup,
  createKmlImportSummary,
  decodeUtf8WithWarning,
  extractKmlPlacemarkNodes,
  parsePlacemarkNode,
  resolveCategoryIdForFolder,
  type KmlImportSummary,
} from './kmlImport';
import { enrichImportedPlaces, type EnrichablePlace } from './placeEnrichment';
import * as placePhotoCache from './placePhotoCache';
import { searchUnsplashPhotos, getUnsplashKey } from './unsplashService';
import { type UpdateConflict, isUpdateConflict } from './conflictResult';

// Reclaim a deleted place's cached marker photo if nothing else references it.
// The cache key is the Google place_id, or — for coordinate-only places — the
// pseudo-id embedded in the stored proxy URL (/api/maps/place-photo/{id}/bytes).
function reclaimPhotoCache(googlePlaceId: string | null, imageUrl: string | null): void {
  const candidates = new Set<string>();
  if (googlePlaceId) candidates.add(googlePlaceId);
  const m = imageUrl?.match(/^\/api\/maps\/place-photo\/(.+)\/bytes$/);
  if (m) { try { candidates.add(decodeURIComponent(m[1])); } catch { /* malformed url */ } }
  for (const id of candidates) {
    try { placePhotoCache.removeIfUnreferenced(id); } catch { /* best-effort */ }
  }
}

/** Opt-in Places-API enrichment for list imports (#886). */
export interface ListImportOptions {
  enrich?: boolean;
  userId?: number;
  lang?: string;
}

interface PlaceWithCategory extends Place {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface PlaceImportResult {
  places: any[];
  count: number;
  summary: KmlImportSummary;
}

// ---------------------------------------------------------------------------
// List places
// ---------------------------------------------------------------------------

export function listPlaces(
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
    query += ' AND (p.name LIKE ? OR p.address LIKE ? OR p.description LIKE ?)';
    const searchParam = `%${filters.search}%`;
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

  const places = db.prepare(query).all(...params) as PlaceWithCategory[];

  const placeIds = places.map(p => p.id);
  const tagsByPlaceId = loadTagsByPlaceIds(placeIds);

  return places.map(p => ({
    ...p,
    category: p.category_id ? {
      id: p.category_id,
      name: p.category_name,
      color: p.category_color,
      icon: p.category_icon,
    } : null,
    tags: tagsByPlaceId[p.id] || [],
  }));
}

// ---------------------------------------------------------------------------
// Create place
// ---------------------------------------------------------------------------

export function createPlace(
  tripId: string,
  body: {
    name: string; description?: string; lat?: number; lng?: number; address?: string;
    category_id?: number; price?: number; currency?: string;
    place_time?: string; end_time?: string;
    duration_minutes?: number; notes?: string; image_url?: string;
    google_place_id?: string; google_ftid?: string; osm_id?: string; website?: string; phone?: string;
    transport_mode?: string; tags?: number[];
  },
) {
  const {
    name, description, lat, lng, address, category_id, price, currency,
    place_time, end_time,
    duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone,
    transport_mode, tags = [],
  } = body;

  const result = db.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price, currency,
      place_time, end_time,
      duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone, transport_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tripId, name, description || null, lat || null, lng || null, address || null,
    category_id || null, price || null, currency || null,
    place_time || null, end_time || null, duration_minutes || 60, notes || null, image_url || null,
    google_place_id || null, google_ftid || null, osm_id || null, website || null, phone || null, transport_mode || 'walking',
  );

  const placeId = result.lastInsertRowid;

  if (tags && tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
    for (const tagId of tags) {
      insertTag.run(placeId, tagId);
    }
  }

  return getPlaceWithTags(Number(placeId));
}

// ---------------------------------------------------------------------------
// Get single place
// ---------------------------------------------------------------------------

export function getPlace(tripId: string, placeId: string) {
  const placeCheck = db.prepare('SELECT id FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId);
  if (!placeCheck) return null;
  return getPlaceWithTags(placeId);
}

// ---------------------------------------------------------------------------
// Update place
// ---------------------------------------------------------------------------

export function updatePlace(
  tripId: string,
  placeId: string,
  body: {
    name?: string; description?: string; lat?: number; lng?: number; address?: string;
    category_id?: number; price?: number; currency?: string;
    place_time?: string; end_time?: string;
    duration_minutes?: number; notes?: string; image_url?: string;
    google_place_id?: string; google_ftid?: string; osm_id?: string; website?: string; phone?: string;
    transport_mode?: string; tags?: number[];
  },
  ifMatch?: string,
): ReturnType<typeof getPlaceWithTags> | UpdateConflict | null {
  const existingPlace = db.prepare('SELECT * FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId) as Place | undefined;
  if (!existingPlace) return null;

  // Optimistic concurrency (#1135): when the caller sent the version it based its
  // edit on and the row has moved on since, reject instead of clobbering. Absent
  // token => unconditional update (back-compat — old clients keep last-write-wins).
  if (ifMatch !== undefined && existingPlace.updated_at != null && String(existingPlace.updated_at) !== ifMatch) {
    return { conflict: true, server: getPlaceWithTags(placeId) };
  }

  const {
    name, description, lat, lng, address, category_id, price, currency,
    place_time, end_time,
    duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone,
    transport_mode, tags,
  } = body;

  db.prepare(`
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
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
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
    duration_minutes || null,
    notes !== undefined ? notes : existingPlace.notes,
    image_url !== undefined ? image_url : existingPlace.image_url,
    google_place_id !== undefined ? google_place_id : existingPlace.google_place_id,
    google_ftid !== undefined ? google_ftid : existingPlace.google_ftid,
    osm_id !== undefined ? osm_id : existingPlace.osm_id,
    website !== undefined ? website : existingPlace.website,
    phone !== undefined ? phone : existingPlace.phone,
    transport_mode || null,
    placeId,
  );

  if (tags !== undefined) {
    db.prepare('DELETE FROM place_tags WHERE place_id = ?').run(placeId);
    if (tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
      for (const tagId of tags) {
        insertTag.run(placeId, tagId);
      }
    }
  }

  return getPlaceWithTags(placeId);
}

// ---------------------------------------------------------------------------
// Delete place
// ---------------------------------------------------------------------------

export function deletePlace(tripId: string, placeId: string): boolean {
  const place = db.prepare(
    'SELECT google_place_id, image_url FROM places WHERE id = ? AND trip_id = ?'
  ).get(placeId, tripId) as { google_place_id: string | null; image_url: string | null } | undefined;
  if (!place) return false;
  db.prepare('DELETE FROM places WHERE id = ?').run(placeId);
  reclaimPhotoCache(place.google_place_id, place.image_url);
  return true;
}

export function deletePlacesMany(tripId: string, ids: number[]): number[] {
  if (ids.length === 0) return [];
  const selectStmt = db.prepare('SELECT google_place_id, image_url FROM places WHERE id = ? AND trip_id = ?');
  const deleteStmt = db.prepare('DELETE FROM places WHERE id = ?');
  const deleted: number[] = [];
  const reclaimable: { google_place_id: string | null; image_url: string | null }[] = [];
  const run = db.transaction((list: number[]) => {
    for (const id of list) {
      const row = selectStmt.get(id, tripId) as { google_place_id: string | null; image_url: string | null } | undefined;
      if (!row) continue;
      deleteStmt.run(id);
      deleted.push(id);
      reclaimable.push(row);
    }
  });
  run(ids);
  // Reclaim after the transaction commits so isReferenced() sees the final place set.
  for (const row of reclaimable) reclaimPhotoCache(row.google_place_id, row.image_url);
  return deleted;
}

// ---------------------------------------------------------------------------
// Bulk update
// ---------------------------------------------------------------------------

/**
 * Apply the same set of fields to many places in a single transaction. Each
 * place is scoped to the trip and patched via updatePlace, so only the provided
 * fields change and everything else is preserved. IDs that don't belong to the
 * trip are skipped. Returns the updated places.
 */
export function updatePlacesMany(
  tripId: string,
  ids: number[],
  body: Parameters<typeof updatePlace>[2],
): NonNullable<ReturnType<typeof getPlaceWithTags>>[] {
  if (ids.length === 0) return [];
  const updated: NonNullable<ReturnType<typeof getPlaceWithTags>>[] = [];
  const run = db.transaction((list: number[]) => {
    for (const id of list) {
      // Bulk update sends no If-Match, so updatePlace never returns a conflict
      // here; the guard keeps the types honest.
      const place = updatePlace(tripId, String(id), body);
      if (place && !isUpdateConflict(place)) updated.push(place);
    }
  });
  run(ids);
  return updated;
}

// ---------------------------------------------------------------------------
// Import GPX
// ---------------------------------------------------------------------------

const gpxParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['wpt', 'trkpt', 'rtept', 'trk', 'trkseg', 'rte'].includes(name),
});

const kmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['Placemark', 'Folder', 'Document'].includes(name),
  // Treat <description> as raw text so mixed-content HTML (e.g. <br/>, <i>)
  // is returned as a string instead of a parsed object.
  stopNodes: ['*.description'],
});

export const KMZ_DECOMPRESSED_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB

// ---------------------------------------------------------------------------
// Import deduplication helpers
// ---------------------------------------------------------------------------

const COORD_DEDUP_TOLERANCE = 0.0001; // ≈ 11 m

interface DedupSet {
  names: Set<string>;
  coords: Array<{ lat: number; lng: number }>;
}

/** Build a lookup of names/coords for places already in a trip. */
function buildDedupSet(tripId: string): DedupSet {
  const rows = db.prepare('SELECT name, lat, lng FROM places WHERE trip_id = ?').all(tripId) as Array<{
    name: string | null;
    lat: number | null;
    lng: number | null;
  }>;
  const names = new Set<string>();
  const coords: Array<{ lat: number; lng: number }> = [];
  for (const row of rows) {
    if (row.name) {
      names.add(row.name.trim().toLowerCase());
    } else if (row.lat != null && row.lng != null) {
      coords.push({ lat: row.lat, lng: row.lng });
    }
  }
  return { names, coords };
}

/**
 * Returns true if a candidate place is already represented in the dedup set.
 * Named places match by case-insensitive name; unnamed places fall back to
 * coordinate proximity.
 */
function isPlaceDuplicate(
  candidate: { name: string | null | undefined; lat: number | null; lng: number | null },
  dedup: DedupSet,
): boolean {
  const normalizedName = candidate.name?.trim().toLowerCase();
  if (normalizedName) return dedup.names.has(normalizedName);
  if (candidate.lat != null && candidate.lng != null) {
    return dedup.coords.some(
      (c) =>
        Math.abs(c.lat - candidate.lat!) <= COORD_DEDUP_TOLERANCE &&
        Math.abs(c.lng - candidate.lng!) <= COORD_DEDUP_TOLERANCE,
    );
  }
  return false;
}

/** Record a newly inserted place so subsequent candidates in the same batch are checked against it. */
function trackInsertedInDedupSet(
  place: { name: string | null | undefined; lat: number | null; lng: number | null },
  dedup: DedupSet,
): void {
  const normalizedName = place.name?.trim().toLowerCase();
  if (normalizedName) {
    dedup.names.add(normalizedName);
  } else if (place.lat != null && place.lng != null) {
    dedup.coords.push({ lat: place.lat, lng: place.lng });
  }
}

export interface GpxImportOptions {
  importWaypoints?: boolean;
  importRoutes?: boolean;
  importTracks?: boolean;
  /** Source filename used to name unnamed routes/tracks (keeps multiple imports distinct). */
  defaultName?: string;
}

export interface KmlImportOptions {
  importPoints?: boolean;
  importPaths?: boolean;
}

export function importGpx(tripId: string, fileBuffer: Buffer, opts: GpxImportOptions = {}) {
  const { importWaypoints = true, importRoutes = true, importTracks = true, defaultName } = opts;

  const parsed = gpxParser.parse(fileBuffer.toString('utf-8'));
  const gpx = parsed?.gpx;
  if (!gpx) return null;

  const str = (v: unknown) => (v != null ? String(v).trim() : null);
  const num = (v: unknown) => { const n = parseFloat(String(v)); return isNaN(n) ? null : n; };

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

  const dedup = buildDedupSet(tripId);
  const insertStmt = db.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, transport_mode, route_geometry)
    VALUES (?, ?, ?, ?, ?, 'walking', ?)
  `);
  const created: any[] = [];
  let skipped = 0;
  const insertAll = db.transaction(() => {
    for (const wp of waypoints) {
      if (isPlaceDuplicate({ name: wp.name, lat: wp.lat, lng: wp.lng }, dedup)) {
        skipped++;
        continue;
      }
      const result = insertStmt.run(tripId, wp.name, wp.description, wp.lat, wp.lng, wp.routeGeometry || null);
      const place = getPlaceWithTags(Number(result.lastInsertRowid));
      created.push(place);
      trackInsertedInDedupSet({ name: wp.name, lat: wp.lat, lng: wp.lng }, dedup);
    }
  });
  insertAll();

  return { places: created, count: created.length, skipped };
}

export function importKmlPlaces(tripId: string, fileBuffer: Buffer, opts: KmlImportOptions = {}): PlaceImportResult {
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

  const categories = db.prepare('SELECT id, name FROM categories').all() as { id: number; name: string }[];
  const categoryLookup = buildCategoryNameLookup(categories);
  const dedup = buildDedupSet(tripId);
  const created: any[] = [];
  let dupCount = 0;

  const insertStmt = db.prepare(`
    INSERT INTO places (trip_id, name, description, lat, lng, category_id, transport_mode, route_geometry)
    VALUES (?, ?, ?, ?, ?, ?, 'walking', ?)
  `);

  const insertAll = db.transaction(() => {
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

      const place = getPlaceWithTags(Number(result.lastInsertRowid));
      created.push(place);
      trackInsertedInDedupSet({ name, lat: parsedPlacemark.lat, lng: parsedPlacemark.lng }, dedup);
      summary.createdCount += 1;
      fallbackIndex += 1;
    }
  });

  insertAll();

  if (dupCount > 0) {
    summary.warnings.push(`${dupCount} place${dupCount > 1 ? 's' : ''} skipped (already in trip).`);
  }

  if (summary.totalPlacemarks === 0) {
    summary.errors.push('No Placemarks found in KML file.');
  }

  return { places: created, count: created.length, summary };
}

export async function unpackKmzToKml(
  kmzBuffer: Buffer,
  decompressedSizeLimit = KMZ_DECOMPRESSED_SIZE_LIMIT,
): Promise<Buffer> {
  let zip;
  try {
    zip = await unzipper.Open.buffer(kmzBuffer);
  } catch {
    throw new Error('Invalid KMZ archive.');
  }

  const kmlEntries = zip.files.filter((entry) => !entry.path.endsWith('/') && entry.path.toLowerCase().endsWith('.kml'));
  if (kmlEntries.length === 0) {
    throw new Error('KMZ archive does not contain a KML file.');
  }

  const preferredEntry = kmlEntries.find((entry) => entry.path.toLowerCase().endsWith('doc.kml')) || kmlEntries[0];

  if (preferredEntry.uncompressedSize > decompressedSizeLimit) {
    throw new Error('KMZ archive exceeds the maximum allowed decompressed size.');
  }

  return preferredEntry.buffer();
}

export async function importKmzPlaces(tripId: string, kmzBuffer: Buffer, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
  const kmlBuffer = await unpackKmzToKml(kmzBuffer);
  return importKmlPlaces(tripId, kmlBuffer, opts);
}

export async function importMapFile(tripId: string, fileBuffer: Buffer, filename: string, opts: KmlImportOptions = {}): Promise<PlaceImportResult> {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'kmz') return importKmzPlaces(tripId, fileBuffer, opts);
  if (ext === 'kml') return importKmlPlaces(tripId, fileBuffer, opts);
  throw new Error(`Unsupported map file format: .${ext}. Please upload a .kml or .kmz file.`);
}

// ---------------------------------------------------------------------------
// Import Google Maps list
// ---------------------------------------------------------------------------

function googleMapsHexId(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (/^0x[0-9a-f]+$/i.test(raw)) return raw.toLowerCase();
  if (!/^-?\d+$/.test(raw)) return null;
  try {
    const parsed = BigInt(raw);
    const unsigned = parsed < 0n ? (1n << 64n) + parsed : parsed;
    return `0x${unsigned.toString(16)}`;
  } catch {
    return null;
  }
}

function googleMapsFeatureIdFromItem(item: unknown): string | null {
  if (!Array.isArray(item)) return null;
  const candidates = [
    Array.isArray(item[1]) ? item[1][6] : null,
    Array.isArray(item[7]) ? item[7][1] : null,
  ];

  for (const ids of candidates) {
    if (!Array.isArray(ids) || ids.length < 2) continue;
    const first = googleMapsHexId(ids[0]);
    const second = googleMapsHexId(ids[1]);
    if (first && second) return `${first}:${second}`;
  }

  return null;
}

function findDuplicatePlace(
  tripId: string,
  place: { name: string | null | undefined; lat: number | null; lng: number | null },
): { id: number; google_ftid: string | null } | null {
  const normalizedName = place.name?.trim().toLowerCase();
  if (normalizedName) {
    const duplicate = db.prepare(`
      SELECT id, google_ftid FROM places
      WHERE trip_id = ? AND lower(trim(name)) = ?
      ORDER BY id ASC
      LIMIT 1
    `).get(tripId, normalizedName) as { id: number; google_ftid: string | null } | undefined;
    if (duplicate) return duplicate;
  }
  if (place.lat != null && place.lng != null) {
    return db.prepare(`
      SELECT id, google_ftid FROM places
      WHERE trip_id = ?
        AND lat IS NOT NULL AND lng IS NOT NULL
        AND abs(lat - ?) <= ?
        AND abs(lng - ?) <= ?
      ORDER BY id ASC
      LIMIT 1
    `).get(tripId, place.lat, COORD_DEDUP_TOLERANCE, place.lng, COORD_DEDUP_TOLERANCE) as { id: number; google_ftid: string | null } | undefined || null;
  }
  return null;
}

export async function importGoogleList(tripId: string, url: string, opts?: ListImportOptions) {
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

  const rawText = await apiRes.text();
  const jsonStr = rawText.substring(rawText.indexOf('\n') + 1);
  const listData = JSON.parse(jsonStr);

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

    if (name && typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      places.push({ name, lat, lng, notes: note || null, googleFtid: googleMapsFeatureIdFromItem(item) });
    }
  }

  if (places.length === 0) {
    return { error: 'No places with coordinates found in list', status: 400 };
  }

  const dedup = buildDedupSet(tripId);
  const insertStmt = db.prepare(`
    INSERT INTO places (trip_id, name, lat, lng, notes, google_ftid, transport_mode)
    VALUES (?, ?, ?, ?, ?, ?, 'walking')
  `);
  const updateGoogleFtidStmt = db.prepare('UPDATE places SET google_ftid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const created: any[] = [];
  let skipped = 0;
  const insertAll = db.transaction(() => {
    for (const p of places) {
      if (isPlaceDuplicate({ name: p.name, lat: p.lat, lng: p.lng }, dedup)) {
        const duplicate = findDuplicatePlace(tripId, p);
        if (duplicate && !duplicate.google_ftid && p.googleFtid) {
          updateGoogleFtidStmt.run(p.googleFtid, duplicate.id);
        }
        skipped++;
        continue;
      }
      const result = insertStmt.run(tripId, p.name, p.lat, p.lng, p.notes, p.googleFtid);
      const place = getPlaceWithTags(Number(result.lastInsertRowid));
      created.push(place);
      trackInsertedInDedupSet({ name: p.name, lat: p.lat, lng: p.lng }, dedup);
    }
  });
  insertAll();

  if (opts?.enrich && opts.userId && created.length) {
    void enrichImportedPlaces(tripId, opts.userId, created as EnrichablePlace[], opts.lang);
  }

  return { places: created, listName, skipped };
}

// ---------------------------------------------------------------------------
// Import Naver Maps list
// ---------------------------------------------------------------------------

export async function importNaverList(
  tripId: string,
  url: string,
  opts?: ListImportOptions,
): Promise<{ places: any[]; listName: string; skipped: number } | { error: string; status: number }> {
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

    try {
      const data = await apiRes.json() as {
        folder?: { bookmarkCount?: number; name?: string };
        bookmarkList?: any[];
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

  const allItems: any[] = [...(firstPage.data.bookmarkList || [])];
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

  const dedup = buildDedupSet(tripId);
  const insertStmt = db.prepare(`
    INSERT INTO places (trip_id, name, lat, lng, address, notes, transport_mode)
    VALUES (?, ?, ?, ?, ?, ?, 'walking')
  `);
  const created: any[] = [];
  let skipped = 0;
  const insertAll = db.transaction(() => {
    for (const p of places) {
      if (isPlaceDuplicate({ name: p.name, lat: p.lat, lng: p.lng }, dedup)) {
        skipped++;
        continue;
      }
      const result = insertStmt.run(tripId, p.name, p.lat, p.lng, p.address, p.notes);
      const place = getPlaceWithTags(Number(result.lastInsertRowid));
      created.push(place);
      trackInsertedInDedupSet({ name: p.name, lat: p.lat, lng: p.lng }, dedup);
    }
  });
  insertAll();

  if (opts?.enrich && opts.userId && created.length) {
    void enrichImportedPlaces(tripId, opts.userId, created as EnrichablePlace[], opts.lang);
  }

  return { places: created, listName, skipped };
}

// ---------------------------------------------------------------------------
// Search place image (Unsplash)
// ---------------------------------------------------------------------------

export async function searchPlaceImage(tripId: string, placeId: string, userId: number) {
  const place = db.prepare('SELECT * FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId) as Place | undefined;
  if (!place) return { error: 'Place not found', status: 404 };

  return searchUnsplashPhotos(place.name + (place.address ? ' ' + place.address : ''), 5, getUnsplashKey(userId));
}
