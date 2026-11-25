import { readEnv } from '../../app-config';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import type { UnsplashPhoto } from '../unsplash/unsplash.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * A single POI entry as Amap's place/text returns it (we only care about these).
 * The envelope is HTTP 200 with the verdict in the body: `status: "1"` means ok,
 * anything else is an infocode we log and treat as "no results" so the caller
 * (TripsService.searchCoverImages) can fall back to Unsplash.
 */
interface AmapPoi {
  name?: string;
  photos?: { url?: string; title?: string | null; provider?: unknown }[];
}

interface AmapPlaceTextResponse {
  status?: string;
  info?: string;
  infocode?: string;
  pois?: AmapPoi[];
  count?: string;
}

const AMAP_TIMEOUT_MS = 8_000;
const AMAP_MAX_PHOTOS_PER_POI = 3;
const AMAP_MAX_TOTAL_PHOTOS = 9;
const AMAP_PHOTO_ATTRIBUTION = '© 高德地图';

@Injectable()
export class AmapPhotoService {
  private readonly logger = new Logger(AmapPhotoService.name);

  /**
   * Search POI photos on Amap.
   *
   * Amap's `place/text` with `extensions=all` returns every matching POI along with
   * the photos Amap has indexed for it — no separate "image search" endpoint. We
   * flatten all those POIs' photos, dedupe by URL, and hand the caller a list in
   * the exact same shape UnsplashService returns. That way TripsService's cover
   * picker renders either source interchangeably, and the international fallback
   * (Unsplash) still works when Amap has no key.
   *
   * Returns an empty list — not an error — when:
   *   - the caller has no Amap key configured
   *   - Amap itself answers with a non-zero infocode (quota exhausted, key type mismatch, ...)
   *   - Amap finds no POI with photos for the query
   *
   * The empty result keeps the Unsplash fallback alive. We only let a real JSON
   * parse error bubble, because that would signal something unexpected that the
   * caller should know about.
   *
   * `key` is resolved by the caller: the cover search owns the precedence
   * (operator env, the instance setting, then the caller's own column), and the
   * `users` table is not this domain's to read.
   */
  async searchCoverPhotos(
    query: string,
    perPage = 9,
    key: string | null = null,
  ): Promise<{ photos: UnsplashPhoto[]; hadKey: boolean }> {
    const trimmed = query.trim();
    if (!trimmed) return { photos: [], hadKey: false };

    if (!key) {
      this.logger.debug('Amap key not configured, skipping POI photo search');
      return { photos: [], hadKey: false };
    }

    const params = new URLSearchParams({
      keywords: trimmed,
      // extensions=all adds photos alongside the base POI fields; 'base' would skip them.
      extensions: 'all',
      offset: '20',
      page: '1',
      output: 'JSON',
      key,
    });
    const baseUrl = readEnv().maps.amapApiBase || 'https://restapi.amap.com';
    const url = `${baseUrl}/v3/place/text?${params.toString()}`;

    let data: AmapPlaceTextResponse;
    try {
      const response = await safeFetchFollow(
        url,
        { headers: { 'User-Agent': 'TREK-AmapPhoto/5.1' }, signal: AbortSignal.timeout(AMAP_TIMEOUT_MS) },
        { bypassInternalIpAllowed: true },
      );
      if (!response.ok) {
        this.logger.warn(`Amap POI photo search failed HTTP ${response.status}`);
        return { photos: [], hadKey: true };
      }
      data = (await response.json()) as AmapPlaceTextResponse;
    } catch (err) {
      this.logger.warn(`Amap POI photo search transport error: ${(err as Error).message}`);
      return { photos: [], hadKey: true };
    }

    // Amap is HTTP 200 for everything; the verdict lives in the body.
    if (data.status !== '1') {
      this.logger.debug(`Amap refused photo search: status=${data.status} info=${data.info} infocode=${data.infocode}`);
      return { photos: [], hadKey: true };
    }

    const seen = new Set<string>();
    const photos: UnsplashPhoto[] = [];

    for (const poi of data.pois ?? []) {
      if (!Array.isArray(poi.photos)) continue;
      for (const photo of poi.photos.slice(0, AMAP_MAX_PHOTOS_PER_POI)) {
        const url = photo.url?.trim();
        if (!url || !/^https?:\/\//i.test(url)) continue;
        if (seen.has(url)) continue;
        seen.add(url);
        photos.push({
          id: `amap:${url.slice(-24)}`,
          url,
          thumb: url,
          description: poi.name || photo.title || null,
          photographer: null, // Amap does not surface the author
          link: null,
        });
        if (photos.length >= Math.min(perPage, AMAP_MAX_TOTAL_PHOTOS)) return { photos, hadKey: true };
      }
    }

    return { photos, hadKey: true };
  }

  /** The attribution text TREK shows beside an Amap-sourced cover. */
  readonly attribution = AMAP_PHOTO_ATTRIBUTION;
}
