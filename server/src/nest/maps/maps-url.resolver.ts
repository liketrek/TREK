/**
 * A pasted Google Maps or Amap link, turned into a coordinate.
 *
 * Short links are followed hop by hop through the SSRF guard, a Google page
 * without inline coordinates is read (capped) for the ones in its embedded map
 * data, and a Google point is reverse-geocoded through Nominatim for its
 * address. An Amap link is parsed here too, but handed back as a point for the
 * caller to reverse-geocode: inside China Amap answers that before Nominatim,
 * and choosing who answers is MapsService's job, not this resolver's.
 */
import { Injectable } from '@nestjs/common';
import { safeFetchFollow, SsrfBlockedError } from '../../utils/ssrfGuard';
import { discardBody, exceedsDeclaredLength, readCappedText } from '../../utils/cappedFetch';
import { UA, googleFtidFromMapsUrl } from './maps.helpers';
import { AMAP_SHORT_HOSTS, isAmapHost, parseAmapUrl } from './providers/amap.provider';
import { OsmClient } from './providers/osm.client';
import { GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../common/google-maps-hosts';

// A Google Maps place page is a few hundred KB; the coordinates sit in the
// embedded map data near the top, so two megabytes is plenty and keeps an
// unbounded body out of memory.
const MAX_MAPS_PAGE_BYTES = 2_000_000;

export interface ResolvedMapsUrl {
  lat: number;
  lng: number;
  name: string | null;
  address: string | null;
  google_ftid: string | null;
}

/** A Google link resolved in full, or an Amap point still to be named. */
export type MapsLink =
  | { kind: 'resolved'; result: ResolvedMapsUrl }
  | { kind: 'amap'; lat: number; lng: number; name: string | null };

// Extract coordinates from a string (URL or page body). Google Maps encodes
// them several ways: /@lat,lng,zoom · !3dlat!4dlng (map data param) · ?q=/?ll=.
function extractCoords(s: string): { lat: number; lng: number } | null {
  const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number.parseFloat(at[1]), lng: Number.parseFloat(at[2]) };
  const data = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (data) return { lat: Number.parseFloat(data[1]), lng: Number.parseFloat(data[2]) };
  const q = s.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number.parseFloat(q[1]), lng: Number.parseFloat(q[2]) };
  return null;
}

async function followRedirects(target: string, init?: RequestInit): Promise<Response> {
  try {
    return await safeFetchFollow(target, { signal: AbortSignal.timeout(10000), ...init }, { bypassInternalIpAllowed: true });
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      throw Object.assign(new Error('URL blocked by SSRF check'), { status: 403 });
    }
    throw err;
  }
}

const notFound = () => Object.assign(new Error('Could not extract coordinates from URL'), { status: 400 });

@Injectable()
export class MapsUrlResolver {
  constructor(private readonly osm: OsmClient) {}

  async resolve(url: string): Promise<MapsLink> {
    let resolvedUrl = url;

    // Follow redirects for short URLs (goo.gl, maps.app.goo.gl) and for Google Maps
    // URLs that carry no inline coordinates — e.g. ?cid= links (the format
    // get_place_details returns) and "Share"-button links. The redirect target
    // usually carries the !3d!4d data param we can then parse. Redirects are
    // followed manually so every hop is SSRF-re-checked.
    const parsed = new URL(url);
    const isShort = GOOGLE_SHORT_HOSTS.includes(parsed.hostname) || AMAP_SHORT_HOSTS.includes(parsed.hostname);
    const isGoogleMaps = isGoogleMapsHost(parsed.hostname);
    if (isShort || (isGoogleMaps && !extractCoords(url))) {
      resolvedUrl = (await followRedirects(url)).url || resolvedUrl;
    }

    let resolvedHost = '';
    try { resolvedHost = new URL(resolvedUrl).hostname; } catch { /* keep the empty host, both host branches are skipped */ }

    // Amap links first, and on their own: they spell the coordinate `lng,lat`
    // in GCJ-02, which the Google patterns below would read as a WGS-84
    // `lat,lng` and put a Shanghai restaurant in the East China Sea.
    // parseAmapUrl owns both the ordering and the datum conversion.
    if (isAmapHost(resolvedHost)) {
      const amap = parseAmapUrl(resolvedUrl);
      // A POI page without a coordinate would need a keyed detail lookup, and
      // this method has no user to resolve a key for: the same answer a Google
      // page without coordinates gets.
      if (!amap || !Number.isFinite(amap.lat) || !Number.isFinite(amap.lng)) throw notFound();
      return { kind: 'amap', lat: amap.lat, lng: amap.lng, name: amap.name };
    }

    let coords = extractCoords(resolvedUrl);

    // Still nothing (e.g. a cid page whose final URL lacks coordinates): fetch the
    // page body once and parse the coordinates out of the embedded map data.
    // Only Google's own pages get read; the resolved host is what counts, so a
    // short link that lands on maps.google.com still qualifies.
    if (!coords && isGoogleMapsHost(resolvedHost)) {
      try {
        const pageRes = await followRedirects(resolvedUrl, {
          headers: { 'User-Agent': UA },
        });
        if (exceedsDeclaredLength(pageRes, MAX_MAPS_PAGE_BYTES)) {
          // Nothing here will read it, and an unread body keeps its socket.
          discardBody(pageRes);
        } else {
          // The map data sits near the top of the document, so a truncated read
          // still finds the coordinates; an oversized page degrades to the same
          // 400 an unparseable one already produced.
          const { text } = await readCappedText(pageRes, MAX_MAPS_PAGE_BYTES);
          coords = extractCoords(text);
        }
      } catch (err) {
        if ((err as { status?: number })?.status === 403) throw err; // SSRF block, surface it
        // Otherwise fall through to the not-found error below.
      }
    }

    // Extract place name from URL path: /place/Place+Name/@...
    let placeName: string | null = null;
    const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      placeName = decodeURIComponent(placeMatch[1].replaceAll(/\+/g, ' '));
    }

    if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) throw notFound();
    const { lat, lng } = coords;

    // Reverse geocode to get address. A non-ok answer (Nominatim 5xx/429) must
    // not fail the whole resolution — the coordinates are already extracted, so
    // fall back to the URL-derived name and a null address.
    const nominatim = await this.osm.reverseRaw(lat, lng);

    const name = placeName || nominatim.name || nominatim.address?.tourism || nominatim.address?.building || null;
    const address = nominatim.display_name || null;

    return { kind: 'resolved', result: { lat, lng, name, address, google_ftid: googleFtidFromMapsUrl(resolvedUrl) } };
  }
}
