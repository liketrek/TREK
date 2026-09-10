import { stripEmoji } from '../text-sanitize';

/**
 * Turning what a `searchProvider` plugin answers into rows TREK can show (#2221).
 *
 * Shared by the REST route and the MCP tool rather than written twice: the two are the
 * same question asked by a browser and by an assistant, and a cap or a url check that
 * held on one path but not the other would be a hole with a second door.
 *
 * Every hit is normalized into the record shape the core search returns (`toPlaceRecord`
 * in maps/trek-places.client.ts), because the callers read `name`, `lat`, `lng` and
 * `address` off whatever the list holds and must not need to know which index a row
 * came from.
 */
export interface SearchHit {
  osm_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** What a plugin index can answer that open data cannot. Null when it does not. */
  rating: number | null;
  website: string | null;
  phone: string | null;
  category: string | null;
  description: string | null;
  /** `plugin:<id>`, so a row can name the index it came from. */
  source: string;
  pluginId: string;
}

/** Per provider. Bounds one plugin's share of a list a person reads. */
export const MAX_HITS = 20;
/** The most one provider may be asked for, whatever the caller puts in the query. */
export const MAX_LIMIT = 20;
export const DEFAULT_LIMIT = 10;
/** Long enough for a full address line, short enough that no row can flood the list. */
export const MAX_QUERY = 200;

const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

const capOrNull = (v: unknown, n: number): string | null => {
  if (v == null) return null;
  const s = cap(v, n);
  return s === '' ? null : s;
};

/**
 * A url that may become an `<a href>`. Anything but http/https is dropped — a
 * `javascript:` or `data:` url rendered as a link is click-XSS into the search list.
 */
function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '') return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' ? raw.slice(0, 2048) : null;
  } catch {
    return null;
  }
}

/**
 * A rating a plugin index carries, on the five-point scale every such index uses.
 *
 * Clamped rather than rejected: a provider answering on a ten-point scale is a bug in
 * that provider, and dropping the whole hit over it would lose the place as well.
 */
function safeRating(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}

export function normalizeSearchHits(pluginId: string, raw: unknown): SearchHit[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: SearchHit[] = [];
  for (const h of list) {
    if (out.length >= MAX_HITS) break;
    if (!h || typeof h !== 'object') continue;
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    const name = cap(h.name, 200);
    // A hit with no name or no place on the earth cannot be shown or picked.
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    const id = cap(h.id, 100);
    out.push({
      // Namespaced so a plugin id can never collide with a real OSM id or a `gers:`
      // one from the index. Falls back to the coordinate when the plugin has no stable
      // id of its own, which still tells two rows apart.
      osm_id: `plugin:${pluginId}:${id || `${lat},${lng}`}`,
      name,
      address: cap(h.address, 300),
      lat,
      lng,
      rating: safeRating(h.rating),
      website: safeUrl(h.website),
      phone: capOrNull(h.phone, 60),
      category: capOrNull(h.category, 60),
      description: capOrNull(h.description, 500),
      source: `plugin:${pluginId}`,
      pluginId,
    });
  }
  return out;
}

/** The bias, when the caller supplied a real coordinate rather than two strings. */
export function nearFrom(latRaw: unknown, lngRaw: unknown): { lat: number; lng: number } | undefined {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
}

export function limitFrom(raw: unknown): number {
  const asked = Number(raw);
  return Number.isFinite(asked) && asked > 0 ? Math.min(MAX_LIMIT, Math.trunc(asked)) : DEFAULT_LIMIT;
}

/**
 * One list out of several providers, taking a row from each in turn.
 *
 * Interleaved rather than concatenated: with two indexes installed, a plain
 * concatenation buries the second one's best hit under twenty of the first one's.
 */
export function interleave(results: SearchHit[][]): SearchHit[] {
  const out: SearchHit[] = [];
  for (let i = 0; ; i += 1) {
    const row = results.filter(r => r.length > i);
    if (row.length === 0) return out;
    for (const r of row) out.push(r[i]);
  }
}
