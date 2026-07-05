import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { safeFetch } from '../utils/ssrfGuard';
import { db } from '../db/database';
import { decrypt_api_key } from './apiKeyCrypto';

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

/**
 * Resolve an Unsplash access key for a request, in precedence order:
 * the `UNSPLASH_ACCESS_KEY` env var (instance-wide override, matching the
 * SMTP/OIDC env-over-DB convention) → the caller's own stored key → any
 * admin's stored key. Mirrors `getMapsKey`. Returns null when none is set,
 * in which case the search falls back to the unauthenticated endpoint.
 */
export function getUnsplashKey(userId: number): string | null {
  const env_key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (env_key) return env_key;
  const user = db.prepare('SELECT unsplash_api_key FROM users WHERE id = ?').get(userId) as { unsplash_api_key: string | null } | undefined;
  const user_key = decrypt_api_key(user?.unsplash_api_key);
  if (user_key) return user_key;
  const admin = db.prepare("SELECT unsplash_api_key FROM users WHERE role = 'admin' AND unsplash_api_key IS NOT NULL AND unsplash_api_key != '' LIMIT 1").get() as { unsplash_api_key: string } | undefined;
  return decrypt_api_key(admin?.unsplash_api_key) || null;
}

export async function searchUnsplashPhotos(query: string, perPage = 9, accessKey?: string | null) {
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
      })
    : await fetch(`https://unsplash.com/napi/search/photos?${params.toString()}`, {
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

const UNSPLASH_IMAGE_HOST = 'images.unsplash.com';
const MAX_COVER_BYTES = 15 * 1024 * 1024;
const COVER_EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** True when a cover_image value is an Unsplash CDN hot-link we should internalise. */
export function isUnsplashCoverUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).hostname.toLowerCase() === UNSPLASH_IMAGE_HOST;
  } catch {
    return false;
  }
}

/**
 * Download a chosen Unsplash cover from its CDN into destDir so the cover is
 * stored locally (offline + CDN link-rot safe) instead of hot-linked. Only the
 * Unsplash image CDN host is accepted, and the request goes through the SSRF
 * guard. Returns the saved filename. Throws on a non-Unsplash host, a failed
 * download, an unsupported content type, or an oversized image.
 */
export async function saveUnsplashCover(url: string, destDir: string): Promise<string> {
  if (!isUnsplashCoverUrl(url)) throw new Error('Not an Unsplash image URL');
  const res = await safeFetch(url);
  if (!res.ok) throw new Error(`Unsplash image download failed (HTTP ${res.status})`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = COVER_EXT_BY_TYPE[type];
  if (!ext) throw new Error(`Unsupported cover image type: ${type || 'unknown'}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_COVER_BYTES) throw new Error('Cover image too large');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const filename = `${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(destDir, filename), buf);
  return filename;
}
