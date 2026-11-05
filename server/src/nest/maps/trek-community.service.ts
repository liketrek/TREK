import { readCapped } from '../../utils/cappedFetch';
import { trekCommunityByKeys, trekPlacesBaseUrl, trekPlacesById } from './trek-places.client';
import { identifiedFetch } from './trek-places.fetch';
import { Injectable } from '@nestjs/common';

/** A published picture's path as the service writes it; anything else is never fetched. */
const IMAGE_PATH = /^\/v1\/contrib\/img\/[A-Za-z0-9_-]{8,64}\.webp$/;
const IMAGE_MAX_BYTES = 4_000_000;
const IMAGE_TIMEOUT_MS = 8000;

/** The service's key of an OSM details id: `relation:3389505` is `osm:relation/3389505`. */
export function communityKeyOf(placeId: string): string | null {
  const match = /^(node|way|relation):(\d+)$/.exec(placeId);
  return match ? `osm:${match[1]}/${match[2]}` : null;
}

/**
 * The picture store path of a URL the service gave out: as it is when relative,
 * the path when absolute on the configured service, null for anything else.
 * The service writes absolute URLs once TREK_CONTRIB_PUBLIC_URL is set.
 */
function storePath(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  let path = url;
  if (!url.startsWith('/')) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== new URL(trekPlacesBaseUrl()).origin || parsed.search) return null;
      path = parsed.pathname;
    } catch {
      return null;
    }
  }
  return IMAGE_PATH.test(path) ? path : null;
}

/**
 * The pictures the TREK community published for a place, read from the TREK
 * Places API: which ones (cover first, then the order review set) and their
 * bytes. An index place carries them on its own row, an OSM place gets them
 * from /v1/community. The caller checks that the API is switched on.
 */
@Injectable()
export class TrekCommunityService {
  /** Paths of the place's published pictures, cover first; empty when there are none or the API fails. */
  async photoPaths(placeId: string): Promise<string[]> {
    let images: { url?: string; cover?: boolean }[] | null | undefined;
    try {
      if (placeId.startsWith('gers:')) {
        images = (await trekPlacesById(placeId.slice('gers:'.length)))?.images;
      } else {
        const key = communityKeyOf(placeId);
        if (key) images = (await trekCommunityByKeys([key]))[key]?.images;
      }
    } catch {
      // The service being down must never cost the place its other pictures.
      return [];
    }
    if (!Array.isArray(images)) return [];
    const ordered = [...images.filter((i) => i?.cover), ...images.filter((i) => !i?.cover)];
    return ordered.map((i) => storePath(i?.url)).filter((u): u is string => u !== null);
  }

  /**
   * The bytes of one published picture, fetched with this installation's key,
   * or null. Only a path of the service's own picture store is accepted: the
   * value comes from the service's answer and becomes an authenticated download.
   */
  async imageBytes(path: string): Promise<Buffer | null> {
    if (!IMAGE_PATH.test(path)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    try {
      const res = await identifiedFetch(
        new URL(trekPlacesBaseUrl() + path),
        { Accept: 'image/webp' },
        controller.signal,
      );
      if (!res.ok) return null;
      const declared = Number(res.headers.get('content-length') ?? 0);
      if (declared > IMAGE_MAX_BYTES) {
        await res.body?.cancel();
        return null;
      }
      // A chunked answer declares no length, so the read itself stops at the cap.
      const { bytes, truncated } = await readCapped(res, IMAGE_MAX_BYTES);
      return bytes.length && !truncated ? bytes : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
