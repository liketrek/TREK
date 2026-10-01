import { normalizePlaceWebsite } from '@trek/shared';
import { haversineMetres, OVERPASS_QUERY_TIMEOUT_S } from './maps.helpers';

/** What "near" means when the caller does not say: a short walk. */
export const NEARBY_DEFAULT_RADIUS_M = 500;
/** Google's own ceiling for one nearby answer, and the most a picker lists. */
export const NEARBY_DEFAULT_LIMIT = 20;

/** The OSM keys a place worth visiting is tagged with. Street furniture is not among them. */
const NEARBY_OSM_KEYS = 'amenity|tourism|shop|leisure|historic';

export interface NearbyOsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Named places of any kind around a point (#976). Without a category the answer
 * can be large in a city centre, so the circle is the caller's and the row count
 * is capped at a few times the limit: enough to sort by distance, not the square
 * kilometre.
 */
export function nearbyOverpassQuery(lat: number, lng: number, radius: number, limit: number): string {
  const around = `(around:${Math.round(radius)},${lat},${lng})`;
  return `[out:json][timeout:${OVERPASS_QUERY_TIMEOUT_S}];\nnwr${around}[name][~"^(${NEARBY_OSM_KEYS})$"~"."];\nout center tags ${limit * 3};`;
}

/** The OSM kind of a place, as `category` in the other search answers: a shop reads `shop_<type>`. */
function osmKind(tags: Record<string, string>): string | null {
  for (const key of NEARBY_OSM_KEYS.split('|')) {
    const value = tags[key];
    if (!value || value === 'yes') continue;
    return key === 'shop' ? `shop_${value}` : value;
  }
  return null;
}

/** Overpass elements as the place records a search answers with, nearest first. */
export function overpassNearbyRecords(
  elements: NearbyOsmElement[],
  origin: { lat: number; lng: number },
  lang: string,
  limit: number,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags[`name:${lang}`] || tags.int_name || tags.name;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || lat == null || lng == null) continue;
    // Shut for good is not somewhere to go, the same rule the POI search keeps.
    if (tags.disused === 'yes' || tags.abandoned === 'yes') continue;
    const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']]
      .filter(Boolean)
      .join(' ');
    out.push({
      google_place_id: null,
      osm_id: `${el.type}:${el.id}`,
      name,
      address,
      lat,
      lng,
      rating: null,
      website: normalizePlaceWebsite(tags.website) ?? normalizePlaceWebsite(tags['contact:website']),
      phone: tags.phone || tags['contact:phone'] || null,
      category: osmKind(tags),
      source: 'openstreetmap',
    });
  }
  return nearestFirst(out, origin, limit);
}

/**
 * Stamps each record with its distance from the point and keeps the nearest.
 * Every source goes through here, so the answer reads the same whoever gave it.
 */
export function nearestFirst(
  records: Record<string, unknown>[],
  origin: { lat: number; lng: number },
  limit: number,
): Record<string, unknown>[] {
  return records
    .filter(r => typeof r.lat === 'number' && typeof r.lng === 'number')
    .map(r => ({ ...r, distance_m: Math.round(haversineMetres(origin.lat, origin.lng, r.lat as number, r.lng as number)) }))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, limit);
}

/**
 * The cache key for one nearby question. Rounded to about ten metres, so the same
 * photo location asked twice (an import of a whole album) costs one lookup.
 */
export function nearbyCacheKey(lat: number, lng: number, radius: number, limit: number, lang: string): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}|${radius}|${limit}|${lang}`;
}
