import { db, getPlaceWithTags } from '../db/database';
import { broadcast } from '../websocket';
import { getMapsKey, searchPlaces, getPlacePhoto } from './mapsService';

/**
 * Background enrichment for list-imported places (#886).
 *
 * Google/Naver list imports only carry name + coordinates, so the imported
 * places open as bare pins (the Maps tab jumps to coordinates, no photo, no
 * open/closed). When the importer opts in and a Google Maps key is configured,
 * we re-resolve each place by name — biased to and validated against the
 * imported coordinates — to a real Google place, then fill in the empty fields
 * and persist the resolved `google_place_id` (which is what powers on-demand
 * opening hours / the proper Maps link going forward).
 *
 * This runs detached from the import request (fire-and-forget) so a long list
 * never blocks the response, and pushes each enriched row over the websocket so
 * the sidebar fills in progressively. It only ever fills EMPTY columns, so it
 * can never clobber data the import already captured (e.g. a Naver address).
 */

/** A place the import produced — only the fields enrichment reads/writes. */
export interface EnrichablePlace {
  id: number;
  name: string;
  lat: number;
  lng: number;
  google_place_id?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  image_url?: string | null;
}

/** How close a search hit must be to the imported coordinates to be trusted. */
const MATCH_RADIUS_METERS = 250;
/** Bias the text search to roughly the imported area. */
const SEARCH_BIAS_RADIUS_METERS = 2000;
/** Concurrent enrichment lookups — small, to stay friendly to the Maps quota. */
const ENRICH_CONCURRENCY = 3;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Pick the search result that is the same place as the import: it must be a
 * Google result (have a google_place_id) with coordinates within
 * MATCH_RADIUS_METERS of the imported point. Returns the closest such hit, or
 * null when nothing is close enough — in which case the place is left as
 * imported rather than risking a wrong-place overwrite (common-name / romanized
 * lists). Exported for unit testing.
 */
export function pickEnrichmentMatch(
  candidates: Record<string, unknown>[],
  target: { lat: number; lng: number },
  maxMeters: number = MATCH_RADIUS_METERS,
): Record<string, unknown> | null {
  let best: { c: Record<string, unknown>; dist: number } | null = null;
  for (const c of candidates || []) {
    const gpid = c.google_place_id;
    const lat = c.lat;
    const lng = c.lng;
    if (typeof gpid !== 'string' || !gpid) continue;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const dist = haversineMeters(target, { lat, lng });
    if (dist > maxMeters) continue;
    if (!best || dist < best.dist) best = { c, dist };
  }
  return best?.c ?? null;
}

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

async function enrichOne(tripId: string, userId: number, place: EnrichablePlace, lang?: string): Promise<void> {
  // Already linked (shouldn't happen for list imports) — nothing to resolve.
  if (place.google_place_id) return;
  if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;

  const { places: results } = await searchPlaces(userId, place.name, lang, {
    lat: place.lat,
    lng: place.lng,
    radius: SEARCH_BIAS_RADIUS_METERS,
  });
  const match = pickEnrichmentMatch(results, { lat: place.lat, lng: place.lng });
  if (!match) return;

  const gpid = str(match.google_place_id);
  if (!gpid) return;

  // COALESCE so enrichment only fills empty columns — never overwrites data the
  // import already captured (e.g. Naver's address) or anything the user edited.
  db.prepare(
    `UPDATE places
       SET google_place_id = COALESCE(google_place_id, ?),
           address         = COALESCE(address, ?),
           website         = COALESCE(website, ?),
           phone           = COALESCE(phone, ?),
           updated_at      = CURRENT_TIMESTAMP
     WHERE id = ? AND trip_id = ?`,
  ).run(gpid, str(match.address), str(match.website), str(match.phone), place.id, tripId);

  // Photo is best-effort: Google often has none, and getPlacePhoto throws 404 in
  // that case — a missing photo must never abort the rest of the enrichment.
  try {
    const photo = await getPlacePhoto(userId, gpid, place.lat, place.lng, place.name);
    if (photo?.photoUrl) {
      db.prepare(
        'UPDATE places SET image_url = COALESCE(image_url, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trip_id = ?',
      ).run(photo.photoUrl, place.id, tripId);
    }
  } catch {
    /* no photo — leave image_url as-is */
  }

  // Push the enriched row to every connected client (no socket exclusion: the
  // importer's own client should also receive the late update).
  const updated = getPlaceWithTags(place.id);
  if (updated) broadcast(tripId, 'place:updated', { place: updated }, undefined);
}

/**
 * Enrich a batch of just-imported places in the background. Never throws —
 * any per-place failure is swallowed so one bad lookup can't take down the
 * detached task or the process. No-ops when no Google Maps key is configured.
 */
export async function enrichImportedPlaces(
  tripId: string,
  userId: number,
  places: EnrichablePlace[],
  lang?: string,
): Promise<void> {
  try {
    if (!places.length) return;
    if (!getMapsKey(userId)) return;
    await mapWithConcurrency(places, ENRICH_CONCURRENCY, async (place) => {
      try {
        await enrichOne(tripId, userId, place, lang);
      } catch (err) {
        console.error(`[Places] enrichment failed for place ${place.id}:`, err instanceof Error ? err.message : err);
      }
    });
  } catch (err) {
    console.error('[Places] import enrichment pass failed:', err instanceof Error ? err.message : err);
  }
}
