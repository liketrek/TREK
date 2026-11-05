import { mapsApi } from '../api/client';
import { isEffectivelyOffline } from '../sync/networkMode';

/** A spot the map search found for a place that so far is only a name and an address. */
export interface MapMatch {
  lat: number;
  lng: number;
  /** What the search found, as the reader sees it: its name, and its address when it has one. */
  label: string;
  /** The found place's own address, for a stay whose booking named none. */
  address?: string;
}

/**
 * The ways to ask for a stay, best first: name and address together, then the
 * name alone, then the address alone. A booking site's romanized address (an
 * Agoda stay in Japan, say) often matches nothing, and asked together with the
 * hotel's name it sinks the name too; the name alone usually finds the hotel.
 */
export function stayQueries(name: string, address: string | null | undefined): string[] {
  const n = name.trim();
  const a = (address ?? '').trim();
  const queries = [n && a ? `${n} ${a}` : '', n, a].filter((q) => q.length >= 3);
  return [...new Set(queries)];
}

/**
 * The first spot the map search knows for one of `queries`, asked in order.
 * Online only, on purpose: offline there is no search to ask, and the answer
 * is null rather than a guess.
 */
export async function findOnMap(queries: string[], lang?: string): Promise<MapMatch | null> {
  if (isEffectivelyOffline()) return null;
  for (const query of queries) {
    const res = lang ? await mapsApi.search(query, lang) : await mapsApi.search(query);
    for (const row of res?.places ?? []) {
      const place = row as { lat?: unknown; lng?: unknown; name?: unknown; address?: unknown };
      const lat = typeof place.lat === 'number' ? place.lat : NaN;
      const lng = typeof place.lng === 'number' ? place.lng : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const parts = [place.name, place.address].filter((v): v is string => typeof v === 'string' && v.trim() !== '');
      const address = typeof place.address === 'string' && place.address.trim() ? place.address : undefined;
      return { lat, lng, label: parts.join(', ') || query, ...(address ? { address } : {}) };
    }
  }
  return null;
}
