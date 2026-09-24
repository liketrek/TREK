import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { checkSsrf, safeFetch, type SafeFetchOptions } from '../../utils/ssrfGuard';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { DatabaseService } from '../database/database.service';
import { MemoriesAccessService } from './memories-access.service';
import { describeFetchFailure, fail, handleServiceResult, isWithinLocalDayRange, pipeAsset, shiftCalendarDay, sortAssetsByTakenAtDesc, type Selection } from './memories.helpers';

const ALBUM_PAGE_SIZE = 1000;
const ALBUM_MAX_PAGES = 20;
/**
 * How many upstream pages one search may read while filling one answered page.
 *
 * The day filter runs after the fetch, so the number of raw pages an answered
 * page costs depends on how much of the padding days sits in front of it. This
 * is the backstop: a library with thousands of photos on the neighbouring days
 * would otherwise keep a single request fetching, so the scan stops here and
 * answers `hasMore: false` rather than spinning or handing back the same
 * partial page for every page the caller asks for.
 */
const SEARCH_MAX_RAW_PAGES = 20;
/** A mirrored journey upload is one photo; a server that sits on it this long is not coming back. */
const UPLOAD_TIMEOUT_MS = 60_000;

/** One user's Immich connection, as every request to that server needs it. */
export interface ImmichCreds {
  immich_url: string;
  immich_api_key: string;
  /** The user trusts a self-signed certificate on this server (#2475). */
  allow_insecure_tls: boolean;
}

/**
 * The TLS half of every request to a user's Immich. The certificate check is
 * the only thing the switch relaxes: the SSRF guard and the DNS pinning still
 * run on every hop.
 */
function tlsOptions(allowInsecureTls: boolean): SafeFetchOptions {
  return { rejectUnauthorized: !allowInsecureTls };
}

/**
 * Immich photo provider: credentials, connection test, timeline/search browsing,
 * album listing and the asset proxy.
 *
 * Folded 1:1 from services/memories/immichService.ts - every SQL statement,
 * error string and status code is the one that shipped.
 */
@Injectable()
export class ImmichService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly access: MemoriesAccessService,
    private readonly storage: StorageService,
  ) {}

  getImmichCredentials(userId: number): ImmichCreds | null {
    const user = this.db
      .prepare('SELECT immich_url, immich_api_key, immich_allow_insecure_tls FROM users WHERE id = ?')
      .get(userId) as { immich_url: string | null; immich_api_key: string | null; immich_allow_insecure_tls: number | null } | undefined;
    if (!user?.immich_url || !user?.immich_api_key) return null;
    const apiKey = decrypt_api_key(user.immich_api_key);
    if (!apiKey) return null;
    return {
      immich_url: user.immich_url,
      immich_api_key: apiKey,
      // Fail closed: anything but an explicit 1 keeps the certificate check on.
      allow_insecure_tls: user.immich_allow_insecure_tls === 1,
    };
  }

  /** Validate that an asset ID is a safe UUID-like string (no path traversal). */
  isValidAssetId(id: string): boolean {
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
  private isVisibleAsset(a: any): boolean {
    return a.visibility !== 'hidden' && a.isVisible !== false;
  }

  // ── Connection Settings ────────────────────────────────────────────────────

  getConnectionSettings(userId: number) {
    const creds = this.getImmichCredentials(userId);
    const prefs = this.db
      .prepare('SELECT immich_auto_upload, immich_allow_insecure_tls FROM users WHERE id = ?')
      .get(userId) as { immich_auto_upload?: number; immich_allow_insecure_tls?: number } | undefined;
    return {
      immich_url: creds?.immich_url || '',
      connected: !!(creds?.immich_url && creds?.immich_api_key),
      auto_upload: !!(prefs?.immich_auto_upload),
      allow_insecure_tls: prefs?.immich_allow_insecure_tls === 1,
    };
  }

  setImmichAutoUpload(userId: number, enabled: boolean): void {
    this.db.prepare('UPDATE users SET immich_auto_upload = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
  }

  /**
   * `allowInsecureTls` left undefined keeps the stored choice while the URL
   * stays the same, so a client that does not know the switch cannot clear it
   * by saving. The switch trusts one server, so a new URL without it starts
   * off, and disconnecting (no URL) always turns it off again.
   */
  async saveImmichSettings(
    userId: number,
    immichUrl: string | undefined,
    immichApiKey: string | undefined,
    clientIp: string | null,
    allowInsecureTls?: boolean,
  ): Promise<{ success: boolean; warning?: string; error?: string }> {
    if (immichUrl) {
      if (immichUrl.endsWith('/')) {
        immichUrl = immichUrl.slice(0, -1);
      }
      const ssrf = await checkSsrf(immichUrl.trim());
      if (!ssrf.allowed) {
        return { success: false, error: `Invalid Immich URL: ${ssrf.error}` };
      }
      const url = immichUrl.trim();
      const insecure = allowInsecureTls === undefined ? null : Number(allowInsecureTls);
      // SET expressions read the row as it was, so `immich_url IS ?` compares the
      // stored URL with the new one.
      this.db
        .prepare(
          `UPDATE users SET immich_url = ?, immich_api_key = ?,
             immich_allow_insecure_tls = CASE WHEN immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE COALESCE(?, 0) END
           WHERE id = ?`,
        )
        .run(url, maybe_encrypt_api_key(immichApiKey), url, insecure, insecure, userId);
      if (ssrf.isPrivate) {
        this.audit.writeAudit({
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
      this.db.prepare('UPDATE users SET immich_url = ?, immich_api_key = ?, immich_allow_insecure_tls = 0 WHERE id = ?').run(
        null,
        maybe_encrypt_api_key(immichApiKey),
        userId
      );
    }
    return { success: true };
  }

  // ── Connection Test / Status ───────────────────────────────────────────────

  async testConnection(
    immichUrl: string,
    immichApiKey: string,
    allowInsecureTls = false,
  ): Promise<{ connected: boolean; error?: string; user?: { name?: string; email?: string }; canonicalUrl?: string }> {
    if (immichUrl.endsWith('/')) {
      immichUrl = immichUrl.slice(0, -1);
    }
    const ssrf = await checkSsrf(immichUrl);
    if (!ssrf.allowed) return { connected: false, error: ssrf.error ?? 'Invalid Immich URL' };
    try {
      const resp = await safeFetch(`${immichUrl}/api/users/me`, {
        headers: { 'x-api-key': immichApiKey, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) as any,
      }, tlsOptions(allowInsecureTls));
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
      return { connected: false, error: describeFetchFailure(err) };
    }
  }

  async getConnectionStatus(
    userId: number
  ): Promise<{ connected: boolean; error?: string; user?: { name?: string; email?: string } }> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return { connected: false, error: 'Not configured' };
    try {
      const resp = await safeFetch(`${creds.immich_url}/api/users/me`, {
        headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) as any,
      }, tlsOptions(creds.allow_insecure_tls));
      if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
      const data = await resp.json() as { name?: string; email?: string };
      return { connected: true, user: { name: data.name, email: data.email } };
    } catch (err: unknown) {
      return { connected: false, error: describeFetchFailure(err) };
    }
  }

  // ── Browse Timeline / Search ───────────────────────────────────────────────

  async browseTimeline(
    userId: number
  ): Promise<{ buckets?: any; error?: string; status?: number }> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return { error: 'Immich not configured', status: 400 };

    try {
      const resp = await safeFetch(`${creds.immich_url}/api/timeline/buckets`, {
        method: 'GET',
        headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000) as any,
      }, tlsOptions(creds.allow_insecure_tls));
      if (!resp.ok) return { error: 'Failed to fetch from Immich', status: resp.status };
      const buckets = await resp.json();
      return { buckets };
    } catch {
      return { error: 'Could not reach Immich', status: 502 };
    }
  }

  /**
   * One raw page of /api/search/metadata.
   *
   * Split out so the page-filling scan below can ask for the next one without
   * restating the request body, which carries version-specific compatibility
   * that has to stay identical on every page of the same search.
   */
  private async fetchSearchPage(
    creds: ImmichCreds,
    from: string | undefined,
    to: string | undefined,
    page: number,
    size: number,
  ): Promise<{ items?: any[]; status?: number }> {
    const resp = await safeFetch(`${creds.immich_url}/api/search/metadata`, {
      method: 'POST',
      headers: { 'x-api-key': creds.immich_api_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Padded by a day on each end and narrowed again by the caller. These
        // two filter on fileCreatedAt, a UTC instant, while `from`/`to` name
        // calendar days on somebody's wall clock — for a UTC+10 reader the
        // unpadded window really ran from 10:00 local on the first day to
        // 09:59 on the day after the last (#2336). The padding is what makes
        // the assets that belong to those days available to the local-date
        // filter; nothing wider than a day is needed, since no zone sits
        // further than 14 hours from UTC.
        takenAfter: from ? `${shiftCalendarDay(from, -1)}T00:00:00.000Z` : undefined,
        takenBefore: to ? `${shiftCalendarDay(to, 1)}T23:59:59.999Z` : undefined,
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
        // `isVisible` either, so they still return hidden assets. this.isVisibleAsset()
        // below is the only guard on those versions. Do not remove it.
        visibility: 'timeline',
        withExif: true,
        // Immich's own default order has moved between versions, and the picker
        // pages lazily: an unordered page 2 lands in the wrong day heading.
        // Same whitelist reasoning as `visibility` above — an older server that
        // does not know the property drops it instead of failing the request,
        // which is why the result is sorted again below.
        order: 'desc',
        size,
        page,
      }),
      signal: AbortSignal.timeout(15000) as any,
    }, tlsOptions(creds.allow_insecure_tls));
    if (!resp.ok) return { status: resp.status };
    const data = await resp.json() as { assets?: { items?: any[] } };
    return { items: data.assets?.items || [] };
  }

  async searchPhotos(
    userId: number,
    from?: string,
    to?: string,
    page: number = 1,
    size: number = 50,
  ): Promise<{ assets?: any[]; hasMore?: boolean; error?: string; status?: number }> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return { error: 'Immich not configured', status: 400 };

    // Once a day filter is in play the raw pages and the answered pages stop
    // being the same pages: `order: 'desc'` hands back the padding day first and
    // the filter drops all of it, so a raw page can arrive thinned or empty. An
    // answered page is therefore filled from as many raw pages as it takes —
    // otherwise a day with a busy neighbour costs the picker several round trips
    // of nothing, and the MCP tool answers `{ assets: [], hasMore: true }` for a
    // day that does have photos (#2336). The scan always restarts at raw page 1
    // and skips the assets that filled the earlier answered pages, which is what
    // keeps two calls from handing back the same asset twice. Without bounds
    // nothing narrows a page, so raw page and answered page still line up and
    // the single round trip stays a single round trip.
    const narrowed = Boolean(from || to);
    const skip = narrowed ? (page - 1) * size : 0;
    const wanted = skip + size;
    const maxRawPages = narrowed ? SEARCH_MAX_RAW_PAGES : 1;

    const kept: any[] = [];
    let rawPage = narrowed ? 1 : page;
    let rawPagesRead = 0;
    let windowDrained = false;

    try {
      while (kept.length < wanted && rawPagesRead < maxRawPages && !windowDrained) {
        const raw = await this.fetchSearchPage(creds, from, to, rawPage, size);
        if (!raw.items) return { error: 'Search failed', status: raw.status };
        rawPage++;
        rawPagesRead++;
        // A short page is the end of the padded window; a full one may have more
        // behind it, whatever the filter leaves of this one.
        windowDrained = raw.items.length < size;
        for (const a of raw.items) {
          // Belt-and-braces: `visibility: 'timeline'` above should mean Immich
          // never sends a hidden asset, but an older server that ignores the
          // filter would otherwise render broken tiles.
          if (!this.isVisibleAsset(a)) continue;
          const asset = {
            id: a.id,
            takenAt: a.fileCreatedAt || a.createdAt,
            // Immich's own timeline groups by this: the photographer's local time,
            // stored without a zone. Absent on servers that predate it, and the
            // readers fall back to takenAt, which is the behaviour they had.
            localTakenAt: a.localDateTime || null,
            city: a.exifInfo?.city || null,
            country: a.exifInfo?.country || null,
            lat: typeof a.exifInfo?.latitude === 'number' ? a.exifInfo.latitude : null,
            lng: typeof a.exifInfo?.longitude === 'number' ? a.exifInfo.longitude : null,
            mediaType: a.type === 'VIDEO' ? 'video' : 'image',
          };
          if (isWithinLocalDayRange(asset, from, to)) kept.push(asset);
        }
      }
    } catch {
      return { error: 'Could not reach Immich', status: 502 };
    }

    // hasMore answers for the padded window rather than for whichever raw page
    // was read last, so a page the filter emptied still pages forward. Running
    // out of the page budget is the one case that stops: the next call would
    // scan the same pages and hand back the same short page for ever.
    const hasMore = windowDrained ? kept.length > wanted : kept.length >= wanted || !narrowed;
    return { assets: sortAssetsByTakenAtDesc(kept.slice(skip, wanted)), hasMore };
  }


  // ── Asset Info / Proxy ─────────────────────────────────────────────────────


  async getAssetInfo(
    userId: number,
    assetId: string,
    ownerUserId?: number
  ): Promise<{ data?: any; error?: string; status?: number }> {
    const effectiveUserId = ownerUserId ?? userId;
    const creds = this.getImmichCredentials(effectiveUserId);
    if (!creds) return { error: 'Not found', status: 404 };

    try {
      const resp = await safeFetch(`${creds.immich_url}/api/assets/${assetId}`, {
        headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) as any,
      }, tlsOptions(creds.allow_insecure_tls));
      if (!resp.ok) return { error: 'Failed', status: resp.status };
      const asset = await resp.json() as any;
      return {
        data: {
          id: asset.id,
          takenAt: asset.fileCreatedAt || asset.createdAt,
          mediaType: asset.type === 'VIDEO' ? 'video' as const : 'image' as const,
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

  async fetchImmichThumbnailBytes(
    userId: number,
    assetId: string,
    ownerUserId?: number
  ): Promise<{ bytes: Buffer; contentType: string } | { error: string; status: number }> {
    const effectiveUserId = ownerUserId ?? userId;
    const creds = this.getImmichCredentials(effectiveUserId);
    if (!creds) return { error: 'Not found', status: 404 };

    const url = `${creds.immich_url}/api/assets/${assetId}/thumbnail?size=thumbnail`;
    try {
      const resp = await safeFetch(url, {
        headers: { 'x-api-key': creds.immich_api_key },
        signal: AbortSignal.timeout(10000) as any,
      }, tlsOptions(creds.allow_insecure_tls));
      if (!resp.ok) return { error: 'Upstream error', status: resp.status };
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const bytes = Buffer.from(await resp.arrayBuffer());
      return { bytes, contentType };
    } catch {
      return { error: 'Proxy error', status: 502 };
    }
  }

  /**
   * Proxy one asset to the response.
   *
   * The credential guard WRITES the 404 rather than returning it. It used to
   * answer `{ error, status }` and leave the response untouched, and all four
   * callers ignored that return — so a user whose Immich connection had been
   * removed got no status line at all and the request hung until the client
   * gave up. Its Synology counterpart has always written through
   * `handleServiceResult`; this is the same shape.
   *
   * Every other exit goes through `pipeAsset`, which writes on all paths
   * including its catch, so the method is `void` all the way down now.
   */
  async streamImmichAsset(
    response: Response,
    userId: number,
    assetId: string,
    kind: 'thumbnail' | 'original',
    ownerUserId?: number,
    opts?: { mediaType?: string | null; range?: string },
  ): Promise<void> {
    const effectiveUserId = ownerUserId ?? userId;
    const creds = this.getImmichCredentials(effectiveUserId);
    if (!creds) {
      handleServiceResult(response, fail('Not found', 404));
      return;
    }

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

    await pipeAsset(url, response, headers, timeout ? AbortSignal.timeout(timeout) : undefined, cacheControl, tlsOptions(creds.allow_insecure_tls));
  }

  // ── Albums ──────────────────────────────────────────────────────────────────

  async listAlbums(
    userId: number
  ): Promise<{ albums?: any[]; error?: string; status?: number }> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return { error: 'Immich not configured', status: 400 };

    try {
      // Fetch both owned and shared albums
      const [ownResp, sharedResp] = await Promise.all([
        safeFetch(`${creds.immich_url}/api/albums`, {
          headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000) as any,
        }, tlsOptions(creds.allow_insecure_tls)),
        safeFetch(`${creds.immich_url}/api/albums?shared=true`, {
          headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000) as any,
        }, tlsOptions(creds.allow_insecure_tls)),
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
  private async fetchAlbumAssets(
    creds: ImmichCreds,
    albumId: string,
  ): Promise<{ assets?: any[]; status?: number }> {
    const resp = await safeFetch(`${creds.immich_url}/api/albums/${albumId}`, {
      headers: { 'x-api-key': creds.immich_api_key, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000) as any,
    }, tlsOptions(creds.allow_insecure_tls));
    if (!resp.ok) return { status: resp.status };

    const albumData = await resp.json() as { assets?: any[] };
    if (Array.isArray(albumData.assets)) return { assets: albumData.assets };

    return this.fetchAlbumAssetsViaSearch(creds, albumId);
  }

  /**
   * Immich v3 album contents, via `POST /api/search/metadata` filtered by `albumIds`.
   *
   * `withExif` is required: it has no default and gates an inner join
   * (`searchAssetBuilder`: `.$if(!!options.withExif, withExifInner)`), so without
   * it Immich omits `exifInfo` entirely and every photo's city/country goes null.
   */
  private async fetchAlbumAssetsViaSearch(
    creds: ImmichCreds,
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
          order: 'desc',
          size: ALBUM_PAGE_SIZE,
          page,
        }),
        signal: AbortSignal.timeout(15000) as any,
      }, tlsOptions(creds.allow_insecure_tls));
      if (!resp.ok) return { status: resp.status };

      const data = await resp.json() as { assets?: { items?: any[] } };
      const items = data.assets?.items || [];
      all.push(...items);
      if (items.length < ALBUM_PAGE_SIZE) break;
    }

    return { assets: all };
  }

  async getAlbumPhotos(
    userId: number,
    albumId: string,
  ): Promise<{ assets?: any[]; error?: string; status?: number }> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return { error: 'Immich not configured', status: 400 };

    try {
      const result = await this.fetchAlbumAssets(creds, albumId);
      if (!result.assets) return { error: 'Failed to fetch album', status: result.status };
      // Albums legitimately contain hidden assets on both Immich versions (the v2
      // album body and the v3 album search both return them), so filter here (#1474).
      const assets = result.assets
        .filter((a: unknown) => this.isVisibleAsset(a))
        .map((a: any) => ({
          id: a.id,
          takenAt: a.fileCreatedAt || a.createdAt,
          // Same local stamp the search path carries, so an album groups under
          // the same day headings a search does.
          localTakenAt: a.localDateTime || null,
          city: a.exifInfo?.city || null,
          country: a.exifInfo?.country || null,
          // The search path has always carried these; dropping them here meant a
          // photo picked out of an album could never be placed on a map, and the
          // distance sort silently had nothing to sort by (#1614).
          lat: typeof a.exifInfo?.latitude === 'number' ? a.exifInfo.latitude : null,
          lng: typeof a.exifInfo?.longitude === 'number' ? a.exifInfo.longitude : null,
          mediaType: a.type === 'VIDEO' ? 'video' : 'image',
        }));
      // The v2 branch reads /api/albums/{id} and never passes a search at all, so
      // this is the only ordering an album ever gets there.
      return { assets: sortAssetsByTakenAtDesc(assets) };
    } catch {
      return { error: 'Could not reach Immich', status: 502 };
    }
  }

  /**
   * The Immich half of an album sync: resolve the link, fetch the album, and hand
   * back the picked asset ids.
   *
   * Adding them to the trip stays with the unified service, which owns
   * addTripPhotos. Splitting it there is what breaks the import cycle this module
   * used to close (immich -> unified -> photoResolver -> immich): the provider now
   * only ever points downhill. Every error string and status below is the one the
   * combined function returned.
   */
  async collectAlbumSelection(
    tripId: string,
    linkId: string,
    userId: number,
  ): Promise<{ selection: Selection; total: number } | { error: string; status: number }> {
    const response = this.access.getAlbumIdFromLink(tripId, linkId, userId);
    if (!response.success) return { error: 'Album link not found', status: 404 };

    const creds = this.getImmichCredentials(userId);
    if (!creds) return { error: 'Immich not configured', status: 400 };

    try {
      const albumResult = await this.fetchAlbumAssets(creds, response.data as string);
      if (!albumResult.assets) return { error: 'Failed to fetch album', status: albumResult.status };
      // Hidden assets must never be persisted: the render path never re-checks
      // visibility, so a stored hidden asset is a permanently broken tile (#1474).
      const assets = albumResult.assets.filter((a: any) => a.type === 'IMAGE' && this.isVisibleAsset(a));

      return {
        selection: { provider: 'immich', asset_ids: assets.map((a: any) => a.id) },
        total: assets.length,
      };
    } catch {
      return { error: 'Could not reach Immich', status: 502 };
    }
  }

  // ── Upload to Immich ──────────────────────────────────────────────────────

  async uploadToImmich(userId: number, filePath: string, fileName: string): Promise<string | null> {
    const creds = this.getImmichCredentials(userId);
    if (!creds) return null;

    // Journey uploads store the uploads-relative 'journey/<file>' path; only
    // those are local storage objects this can push.
    const name = filePath.startsWith('journey/') ? filePath.slice('journey/'.length) : null;
    if (!name) return null;

    try {
      // A missing object throws StorageNotFoundError into the catch below —
      // the same null the old existsSync guard answered.
      const fileBuffer = await this.storage.withLocalFile('journey', name, (p) => fsPromises.readFile(p));
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
        // The journey upload waits on this mirror, so a server that never
        // answers must not hold the upload open with it.
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      }, tlsOptions(creds.allow_insecure_tls));

      if (res.ok) {
        const data = await res.json() as { id?: string };
        return data.id || null;
      }
      return null;
    } catch {
      return null;
    }
  }
}
