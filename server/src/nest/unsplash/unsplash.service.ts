import { Readable } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { safeFetch } from '../../utils/ssrfGuard';
import { exceedsDeclaredLength, readCapped } from '../../utils/cappedFetch';
import { resolveApiKey } from '../settings/instance-api-keys';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { StorageService } from '../storage/storage.service';

interface UnsplashSearchResponse {
  results?: {
    id: string;
    urls?: { regular?: string; small?: string; thumb?: string };
    description?: string | null;
    alt_description?: string | null;
    user?: { name?: string };
    links?: { html?: string };
  }[];
  errors?: string[];
  error?: string;
}

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumb: string;
  description: string | null;
  photographer: string | null;
  link: string | null;
}

const UNSPLASH_IMAGE_HOST = 'images.unsplash.com';
const MAX_COVER_BYTES = 15 * 1024 * 1024;
// Unsplash is a third party on the request path; safeFetch adds no deadline of
// its own, so both the search and the cover download carry one.
const UNSPLASH_TIMEOUT_MS = 10_000;
const COVER_EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Unsplash search and cover download.
 *
 * Its own module rather than a method on trips or places: both call it, and the
 * key resolution reads the env AND the database, so it needs the injected
 * connection either way.
 */
@Injectable()
export class UnsplashService {
  constructor(
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly storage: StorageService,
  ) {}

  /**
 * Resolve an Unsplash access key for a request, in precedence order:
 * the `UNSPLASH_ACCESS_KEY` env var (instance-wide override, matching the
 * SMTP/OIDC env-over-DB convention) → the instance-wide value the admin panel
 * saves → the caller's own stored key. Mirrors `resolveMapsKey`, including what
 * it dropped: "any admin's stored key" read a stranger's credential and made
 * the answer depend on who asked (#1939). Returns null when none is set, in
 * which case the search falls back to the unauthenticated endpoint.
 */
  getUnsplashKey(userId: number): string | null {
    return resolveApiKey(this.db, 'unsplash_api_key', userId, this.env.env().integrations.unsplashAccessKey).key;
  }

  async searchUnsplashPhotos(query: string, perPage = 9, accessKey?: string | null) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { error: 'Search query is required', status: 400 };
  }

  const params = new URLSearchParams({
    page: '1',
    query: trimmed,
    per_page: String(perPage),
  });
  // With an access key, use Unsplash's official, authenticated API — datacenter
  // (VPS) IPs get blocked on the unauthenticated web endpoint (#1449). Without
  // one, fall back to the web endpoint so zero-config search still works.
  const response = accessKey
    ? await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout(UNSPLASH_TIMEOUT_MS),
      })
    : await fetch(`https://unsplash.com/napi/search/photos?${params.toString()}`, {
        signal: AbortSignal.timeout(UNSPLASH_TIMEOUT_MS),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
          Accept: '*/*',
          'Accept-Language': 'en-US',
          Referer: `https://unsplash.com/s/photos/${encodeURIComponent(trimmed)}`,
          'client-geo-region': 'global',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Site': 'same-origin',
        },
      });
  let data: UnsplashSearchResponse;
  try {
    data = await response.json() as UnsplashSearchResponse;
  } catch {
    return { error: 'Unsplash search unavailable', status: response.ok ? 502 : response.status };
  }

  if (!response.ok) {
    return { error: data.errors?.[0] || data.error || 'Unsplash search unavailable', status: response.status };
  }

  const photos: UnsplashPhoto[] = (data.results || [])
    .map((p) => ({
      id: p.id,
      url: p.urls?.regular || '',
      thumb: p.urls?.small || p.urls?.thumb || p.urls?.regular || '',
      description: p.description || p.alt_description || null,
      photographer: p.user?.name || null,
      link: p.links?.html || null,
    }))
    .filter((p) => p.url && p.thumb)
    .slice(0, perPage);

  return { photos };
}

/** True when a cover_image value is an Unsplash CDN hot-link we should internalise. */
  isUnsplashCoverUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).hostname.toLowerCase() === UNSPLASH_IMAGE_HOST;
  } catch {
    return false;
  }
}

/**
 * Download a chosen Unsplash cover from its CDN into the 'covers' storage
 * category so the cover is stored locally (offline + CDN link-rot safe)
 * instead of hot-linked. Only the Unsplash image CDN host is accepted, and the
 * request goes through the SSRF guard. Returns the saved filename. Throws on a
 * non-Unsplash host, a failed download, an unsupported content type, or an
 * oversized image — validation runs before any write.
 */
  async saveUnsplashCover(url: string): Promise<string> {
    if (!this.isUnsplashCoverUrl(url)) throw new Error('Not an Unsplash image URL');
  const res = await safeFetch(url, { signal: AbortSignal.timeout(UNSPLASH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Unsplash image download failed (HTTP ${res.status})`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = COVER_EXT_BY_TYPE[type];
  if (!ext) throw new Error(`Unsupported cover image type: ${type || 'unknown'}`);
  // Reject on the declared length and again while streaming: buffering the whole
  // body first put the 15MB limit behind the allocation it was meant to prevent.
  if (exceedsDeclaredLength(res, MAX_COVER_BYTES)) throw new Error('Cover image too large');
  const { bytes: buf, truncated } = await readCapped(res, MAX_COVER_BYTES);
  if (truncated) throw new Error('Cover image too large');
  const filename = `${uuidv4()}${ext}`;
  await this.storage.put('covers', filename, Readable.from(buf));
  return filename;
}
}
