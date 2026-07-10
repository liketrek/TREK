import { Response } from 'express';
import { db } from '../../db/database';
import { maybe_encrypt_api_key, decrypt_api_key } from '../apiKeyCrypto';
import { checkSsrf, safeFetch } from '../../utils/ssrfGuard';
import { writeAudit } from '../auditLog';
import { addTripPhotos} from './unifiedService';
import { getAlbumIdFromLink, updateSyncTimeForAlbumLink, Selection, pipeAsset } from './helpersService';

// ── Credentials ────────────────────────────────────────────────────────────

export function getImmichCredentials(userId: number) {
  const user = db.prepare('SELECT immich_url, immich_api_key FROM users WHERE id = ?').get(userId) as any;
  if (!user?.immich_url || !user?.immich_api_key) return null;
  const apiKey = decrypt_api_key(user.immich_api_key);
  if (!apiKey) return null;
  return { immich_url: user.immich_url as string, immich_api_key: apiKey };
}

/** Validate that an asset ID is a safe UUID-like string (no path traversal). */
export function isValidAssetId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 100;
}

/**
 * Hidden assets have no generated thumbnail — Immich's own enum documents
 * `AssetVisibility.Hidden` as "Video part of the LivePhotos and MotionPhotos",
 * and its UI never shows them standalone. Surfacing or persisting one yields a
 * permanently broken tile, since nothing re-checks visibility on the render
 * path (#1474).
 *
 * Load-bearing on Immich < 1.133, which predates the `visibility` field: those
 * servers strip the `visibility: 'timeline'` search filter and never defaulted
 * `isVisible`, so they return hidden assets and this is the only thing stopping
 * them. They mark the same state as `isVisible: false`.
 */
function isVisibleAsset(a: any): boolean {
  return a.visibility !== 'hidden' && a.isVisible !== false;
}

// ── Connection Settings ────────────────────────────────────────────────────

export function getConnectionSettings(userId: number) {
  const creds = getImmichCredentials(userId);
  const prefs = db.prepare('SELECT immich_auto_upload FROM users WHERE id = ?').get(userId) as { immich_auto_upload?: number } | undefined;
  return {
    immich_url: creds?.immich_url || '',
    connected: !!(creds?.immich_url && creds?.immich_api_key),
    auto_upload: !!(prefs?.immich_auto_upload),
  };
}

export function setImmichAutoUpload(userId: number, enabled: boolean): void {
  db.prepare('UPDATE users SET immich_auto_upload = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
}

export async function saveImmichSettings(
  userId: number,
  immichUrl: string | undefined,
  immichApiKey: string | undefined,
  clientIp: string | null
): Promise<{ success: boolean; warning?: string; error?: string }> {
  if (immichUrl) {
    const ssrf = await checkSsrf(immichUrl.trim());
    if (!ssrf.allowed) {
      return { success: false, error: `Invalid Immich URL: ${ssrf.error}` };
    }
    db.prepare('UPDATE users SET immich_url = ?, immich_api_key = ? WHERE id = ?').run(
      immichUrl.trim(),
      maybe_encrypt_api_key(immichApiKey),
      userId
    );
    if (ssrf.isPrivate) {
      writeAudit({
        userId,
        action: 'immich.private_ip_configured',
        ip: clientIp,
        details: { immich_url: immichUrl.trim(), resolved_ip: ssrf.resolvedIp },
      });
      return {
        success: true,
        warning: `Immich URL resolves to a private IP address (${ssrf.resolvedIp}). Make sure this is intentional.`,
      };
    }
  } else {
    db.prepare('UPDATE users SET immich_url = ?, immich_api_key = ? WHERE id = ?').run(
      null,
      maybe_encrypt_api_key(immichApiKey),
      userId
    );
  }
  return { success: true };
}

// ── Connection Test / Status ───────────────────────────────────────────────

export async function testConnection(
  immichUrl: string,
  immichApiKey: string
): Promise<{ connected: boolean; error?: string; user?: { name?: string; email?: string }; canonicalUrl?: string }> {
  const ssrf = await checkSsrf(immichUrl);
  if (!ssrf.allowed) return { connected: false, error: ssrf.error ?? 'Invalid Immich URL' };
  try {
    const resp = await safeFetch(`${immichUrl}/api/users/me`, {
      headers: { 'x-api-key': immichApiKey, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000) as any,
    });
    if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
    const data = await resp.json() as { name?: string; email?: string };

    // Detect http → https upgrade only: same host/port, protocol changed to https
    let canonicalUrl: string | undefined;
    if (resp.url) {
      const finalUrl = new URL(resp.url);
      const inputUrl = new URL(immichUrl);
      if (
        inputUrl.protocol === 'http:' &&
        finalUrl.protocol === 'https:' &&
        finalUrl.hostname === inputUrl.hostname &&
        finalUrl.port === inputUrl.port
      ) {
        canonicalUrl = finalUrl.origin;
      }
    }

    return { connected: true, user: { name: data.name, email: data.email }, canonicalUrl };
  } catch (err: unknown) {
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

export async function getConnectionStatus(
  userId: number
): Promise<{ connected: boolean; error?: string; user?: { name?: string; email?: string } }> {
  const creds = getImmichCredentials(userId);
  if (!creds) return { connected: false, error: 'Not configured' };
  try {
    const resp = await safeFetch(`${creds.immich_url}/api/users/me`, {
      headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000) as any,
    });
    if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
    const data = await resp.json() as { name?: string; email?: string };
    return { connected: true, user: { name: data.name, email: data.email } };
  } catch (err: unknown) {
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

// ── Browse Timeline / Search ───────────────────────────────────────────────

export async function browseTimeline(
  userId: number
): Promise<{ buckets?: any; error?: string; status?: number }> {
  const creds = getImmichCredentials(userId);
  if (!creds) return { error: 'Immich not configured', status: 400 };

  try {
    const resp = await safeFetch(`${creds.immich_url}/api/timeline/buckets`, {
      method: 'GET',
      headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000) as any,
    });
    if (!resp.ok) return { error: 'Failed to fetch from Immich', status: resp.status };
    const buckets = await resp.json();
    return { buckets };
  } catch {
    return { error: 'Could not reach Immich', status: 502 };
  }
}

export async function searchPhotos(
  userId: number,
  from?: string,
  to?: string,
  page: number = 1,
  size: number = 50,
): Promise<{ assets?: any[]; hasMore?: boolean; error?: string; status?: number }> {
  const creds = getImmichCredentials(userId);
  if (!creds) return { error: 'Immich not configured', status: 400 };

  try {
    const resp = await safeFetch(`${creds.immich_url}/api/search/metadata`, {
      method: 'POST',
      headers: { 'x-api-key': creds.immich_api_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        takenAfter: from ? `${from}T00:00:00.000Z` : undefined,
        takenBefore: to ? `${to}T23:59:59.999Z` : undefined,
        // No type filter — surface videos alongside images (#823).
        // Immich 1.133–1.144 defaulted metadata search to `timeline` visibility;
        // v3 defaults to any visibility except `locked`, which is what started
        // surfacing Live Photo motion parts as broken tiles (#1474). Ask for
        // `timeline` explicitly so hidden assets never cross the wire and a full
        // page stays a full page of renderable tiles.
        //
        // `visibility` only exists from 1.133.0. Older servers strip it — Immich
        // validates with `whitelist: true` and no `forbidNonWhitelisted`, so an
        // unknown property is dropped, never a 400 — and they never defaulted
        // `isVisible` either, so they still return hidden assets. isVisibleAsset()
        // below is the only guard on those versions. Do not remove it.
        visibility: 'timeline',
        size,
        page,
      }),
      signal: AbortSignal.timeout(15000) as any,
    });
    if (!resp.ok) return { error: 'Search failed', status: resp.status };
    const data = await resp.json() as { assets?: { items?: any[] } };
    const items = data.assets?.items || [];
    // Belt-and-braces: `visibility: 'timeline'` above should mean Immich never
    // sends a hidden asset, but an older server that ignores the filter would
    // otherwise render broken tiles. hasMore stays on the raw page length so
    // pagination still advances past a filtered page.
    const assets = items
      .filter(isVisibleAsset)
      .map((a: any) => ({
        id: a.id,
        takenAt: a.fileCreatedAt || a.createdAt,
        city: a.exifInfo?.city || null,
        country: a.exifInfo?.country || null,
        mediaType: a.type === 'VIDEO' ? 'video' : 'image',
      }));
    return { assets, hasMore: items.length >= size };
  } catch {
    return { error: 'Could not reach Immich', status: 502 };
  }
}


// ── Asset Info / Proxy ─────────────────────────────────────────────────────


export async function getAssetInfo(
  userId: number,
  assetId: string,
  ownerUserId?: number
): Promise<{ data?: any; error?: string; status?: number }> {
  const effectiveUserId = ownerUserId ?? userId;
  const creds = getImmichCredentials(effectiveUserId);
  if (!creds) return { error: 'Not found', status: 404 };

  try {
    const resp = await safeFetch(`${creds.immich_url}/api/assets/${assetId}`, {
      headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000) as any,
    });
    if (!resp.ok) return { error: 'Failed', status: resp.status };
    const asset = await resp.json() as any;
    return {
      data: {
        id: asset.id,
        takenAt: asset.fileCreatedAt || asset.createdAt,
        width: asset.exifInfo?.exifImageWidth || null,
        height: asset.exifInfo?.exifImageHeight || null,
        camera: asset.exifInfo?.make && asset.exifInfo?.model ? `${asset.exifInfo.make} ${asset.exifInfo.model}` : null,
        lens: asset.exifInfo?.lensModel || null,
        focalLength: asset.exifInfo?.focalLength ? `${asset.exifInfo.focalLength}mm` : null,
        aperture: asset.exifInfo?.fNumber ? `f/${asset.exifInfo.fNumber}` : null,
        shutter: asset.exifInfo?.exposureTime || null,
        iso: asset.exifInfo?.iso || null,
        city: asset.exifInfo?.city || null,
        state: asset.exifInfo?.state || null,
        country: asset.exifInfo?.country || null,
        lat: asset.exifInfo?.latitude || null,
        lng: asset.exifInfo?.longitude || null,
        fileSize: asset.exifInfo?.fileSizeInByte || null,
        fileName: asset.originalFileName || null,
      },
    };
  } catch {
    return { error: 'Proxy error', status: 502 };
  }
}

export async function fetchImmichThumbnailBytes(
  userId: number,
  assetId: string,
  ownerUserId?: number
): Promise<{ bytes: Buffer; contentType: string } | { error: string; status: number }> {
  const effectiveUserId = ownerUserId ?? userId;
  const creds = getImmichCredentials(effectiveUserId);
  if (!creds) return { error: 'Not found', status: 404 };

  const url = `${creds.immich_url}/api/assets/${assetId}/thumbnail?size=thumbnail`;
  try {
    const resp = await safeFetch(url, {
      headers: { 'x-api-key': creds.immich_api_key },
      signal: AbortSignal.timeout(10000) as any,
    });
    if (!resp.ok) return { error: 'Upstream error', status: resp.status };
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const bytes = Buffer.from(await resp.arrayBuffer());
    return { bytes, contentType };
  } catch {
    return { error: 'Proxy error', status: 502 };
  }
}

export async function streamImmichAsset(
  response: Response,
  userId: number,
  assetId: string,
  kind: 'thumbnail' | 'original',
  ownerUserId?: number,
  opts?: { mediaType?: string | null; range?: string },
): Promise<{ error?: string; status?: number } | void> {
  const effectiveUserId = ownerUserId ?? userId;
  const creds = getImmichCredentials(effectiveUserId);
  if (!creds) return { error: 'Not found', status: 404 };

  const isVideo = opts?.mediaType === 'video';
  const headers: Record<string, string> = { 'x-api-key': creds.immich_api_key };
  let url: string;
  let timeout: number | undefined;
  let cacheControl = 'public, max-age=86400';

  if (kind === 'thumbnail') {
    // Immich generates a poster thumbnail for video too.
    url = `${creds.immich_url}/api/assets/${assetId}/thumbnail?size=thumbnail`;
    timeout = 10000;
  } else if (isVideo) {
    // Transcoded, broadly-compatible MP4 with byte-range support; forward the
    // viewer's Range so the player can seek. No abort timeout — video is a long
    // streaming response, not a quick fetch (#823).
    url = `${creds.immich_url}/api/assets/${assetId}/video/playback`;
    if (opts?.range) headers['Range'] = opts.range;
    cacheControl = 'private, max-age=3600';
    timeout = undefined;
  } else {
    url = `${creds.immich_url}/api/assets/${assetId}/thumbnail?size=fullsize`;
    timeout = 30000;
  }

  await pipeAsset(url, response, headers, timeout ? AbortSignal.timeout(timeout) : undefined, cacheControl);
}

// ── Albums ──────────────────────────────────────────────────────────────────

export async function listAlbums(
  userId: number
): Promise<{ albums?: any[]; error?: string; status?: number }> {
  const creds = getImmichCredentials(userId);
  if (!creds) return { error: 'Immich not configured', status: 400 };

  try {
    // Fetch both owned and shared albums
    const [ownResp, sharedResp] = await Promise.all([
      safeFetch(`${creds.immich_url}/api/albums`, {
        headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) as any,
      }),
      safeFetch(`${creds.immich_url}/api/albums?shared=true`, {
        headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) as any,
      }),
    ]);
    if (!ownResp.ok) return { error: 'Failed to fetch albums', status: ownResp.status };
    const ownAlbums = await ownResp.json() as any[];
    const sharedAlbums = sharedResp.ok ? await sharedResp.json() as any[] : [];
    const seenIds = new Set<string>();
    const allAlbums = [...ownAlbums, ...sharedAlbums].filter((a: any) => {
      if (seenIds.has(a.id)) return false;
      seenIds.add(a.id);
      return true;
    });
    const albums = allAlbums.map((a: any) => ({
      id: a.id,
      albumName: a.albumName,
      assetCount: a.assetCount || 0,
      startDate: a.startDate,
      endDate: a.endDate,
      albumThumbnailAssetId: a.albumThumbnailAssetId,
      shared: a.shared || a.sharedUsers?.length > 0,
    }));
    return { albums };
  } catch {
    return { error: 'Could not reach Immich', status: 502 };
  }
}

/** Immich caps `size` at 1000 for metadata search; a page cap bounds pathological albums. */
const ALBUM_PAGE_SIZE = 1000;
const ALBUM_MAX_PAGES = 20;

/**
 * Fetch every asset in an album, across Immich v2 and v3.
 *
 * Immich v3 removed `assets` from `AlbumResponseDto`, so `GET /api/albums/:id`
 * no longer carries album contents (#1492) and we fall back to an
 * `albumIds`-filtered metadata search.
 *
 * We feature-detect on the presence of `assets` rather than switching on a
 * probed server version. The two paths are NOT interchangeable:
 *
 * - Before v3, `searchMetadata` unconditionally scopes results to
 *   `[self, ...partners]` (`asset.ownerId = ANY(userIds)`), so an albumIds
 *   search against an album shared by a non-partner returns nothing. v3 added
 *   an albumIds branch that checks `AlbumRead` and skips that owner filter.
 * - 1.133–1.144 also default `visibility` to `timeline`, dropping archived
 *   album assets.
 * - `albumIds` only exists from 1.135.0, and Immich strips unknown properties
 *   rather than rejecting them (`whitelist: true`, no `forbidNonWhitelisted`).
 *   Searching an older server would therefore silently drop the album filter
 *   and return the user's ENTIRE library as the album's contents.
 *
 * Feature detection makes all three moot: `assets` is present on every version
 * that has any of those problems (through 1.144.1) and absent only on v3, where
 * the search path is correct. A version probe with a wrong boundary would not be.
 */
async function fetchAlbumAssets(
  creds: { immich_url: string; immich_api_key: string },
  albumId: string,
): Promise<{ assets?: any[]; status?: number }> {
  const resp = await safeFetch(`${creds.immich_url}/api/albums/${albumId}`, {
    headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000) as any,
  });
  if (!resp.ok) return { status: resp.status };

  const albumData = await resp.json() as { assets?: any[] };
  if (Array.isArray(albumData.assets)) return { assets: albumData.assets };

  return fetchAlbumAssetsViaSearch(creds, albumId);
}

/**
 * Immich v3 album contents, via `POST /api/search/metadata` filtered by `albumIds`.
 *
 * `withExif` is required: it has no default and gates an inner join
 * (`searchAssetBuilder`: `.$if(!!options.withExif, withExifInner)`), so without
 * it Immich omits `exifInfo` entirely and every photo's city/country goes null.
 */
async function fetchAlbumAssetsViaSearch(
  creds: { immich_url: string; immich_api_key: string },
  albumId: string,
): Promise<{ assets?: any[]; status?: number }> {
  const all: any[] = [];

  for (let page = 1; page <= ALBUM_MAX_PAGES; page++) {
    const resp = await safeFetch(`${creds.immich_url}/api/search/metadata`, {
      method: 'POST',
      headers: { 'x-api-key': creds.immich_api_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumIds: [albumId],
        withExif: true,
        withDeleted: false,
        size: ALBUM_PAGE_SIZE,
        page,
      }),
      signal: AbortSignal.timeout(15000) as any,
    });
    if (!resp.ok) return { status: resp.status };

    const data = await resp.json() as { assets?: { items?: any[] } };
    const items = data.assets?.items || [];
    all.push(...items);
    if (items.length < ALBUM_PAGE_SIZE) break;
  }

  return { assets: all };
}

export async function getAlbumPhotos(
  userId: number,
  albumId: string,
): Promise<{ assets?: any[]; error?: string; status?: number }> {
  const creds = getImmichCredentials(userId);
  if (!creds) return { error: 'Immich not configured', status: 400 };

  try {
    const result = await fetchAlbumAssets(creds, albumId);
    if (!result.assets) return { error: 'Failed to fetch album', status: result.status };
    // Albums legitimately contain hidden assets on both Immich versions (the v2
    // album body and the v3 album search both return them), so filter here (#1474).
    const assets = result.assets
      .filter(isVisibleAsset)
      .map((a: any) => ({
        id: a.id,
        takenAt: a.fileCreatedAt || a.createdAt,
        city: a.exifInfo?.city || null,
        country: a.exifInfo?.country || null,
        mediaType: a.type === 'VIDEO' ? 'video' : 'image',
      }));
    return { assets };
  } catch {
    return { error: 'Could not reach Immich', status: 502 };
  }
}

export async function syncAlbumAssets(
  tripId: string,
  linkId: string,
  userId: number,
  sid: string,
): Promise<{ success?: boolean; added?: number; total?: number; error?: string; status?: number }> {
  const response = getAlbumIdFromLink(tripId, linkId, userId);
  if (!response.success) return { error: 'Album link not found', status: 404 };

  const creds = getImmichCredentials(userId);
  if (!creds) return { error: 'Immich not configured', status: 400 };

  try {
    const albumResult = await fetchAlbumAssets(creds, response.data as string);
    if (!albumResult.assets) return { error: 'Failed to fetch album', status: albumResult.status };
    // Hidden assets must never be persisted: the render path never re-checks
    // visibility, so a stored hidden asset is a permanently broken tile (#1474).
    const assets = albumResult.assets.filter((a: any) => a.type === 'IMAGE' && isVisibleAsset(a));

    const selection: Selection = {
      provider: 'immich',
      asset_ids: assets.map((a: any) => a.id),
    };

    const result = await addTripPhotos(tripId, userId, true, [selection], sid, linkId);
    if ('error' in result) return { error: result.error.message, status: result.error.status };

    updateSyncTimeForAlbumLink(linkId);

    return { success: true, added: result.data.added, total: assets.length };
  } catch {
    return { error: 'Could not reach Immich', status: 502 };
  }
}

// ── Upload to Immich ──────────────────────────────────────────────────────

export async function uploadToImmich(userId: number, filePath: string, fileName: string): Promise<string | null> {
  const creds = getImmichCredentials(userId);
  if (!creds) return null;

  const fs = await import('node:fs');
  const path = await import('node:path');

  const fullPath = path.join(__dirname, '../../../uploads', filePath);
  if (!fs.existsSync(fullPath)) return null;

  try {
    const fileBuffer = fs.readFileSync(fullPath);
    const boundary = '----ImmichUpload' + Date.now();
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.heic': 'image/heic',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const now = new Date().toISOString();

    const parts: Buffer[] = [];
    const addField = (name: string, value: string) => {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    };
    addField('deviceAssetId', `trek-${Date.now()}`);
    addField('deviceId', 'TREK');
    addField('fileCreatedAt', now);
    addField('fileModifiedAt', now);

    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="assetData"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`
    ));
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const res = await safeFetch(`${creds.immich_url}/api/assets`, {
      method: 'POST',
      headers: {
        'x-api-key': creds.immich_api_key,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    });

    if (res.ok) {
      const data = await res.json() as { id?: string };
      return data.id || null;
    }
    return null;
  } catch {
    return null;
  }
}
