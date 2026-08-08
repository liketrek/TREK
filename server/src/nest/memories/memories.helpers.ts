import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { Response } from 'express';
import { safeFetch, SsrfBlockedError, type SafeFetchOptions } from '../../utils/ssrfGuard';

/**
 * The shared vocabulary of the memories domain: the ServiceResult envelope, the
 * provider-agnostic asset shapes, and the asset proxy.
 *
 * No database and no DI, so the provider services, the resolver and the
 * controllers can all name these without importing each other — the same reason
 * notifications/notification-events.ts exists.
 */

// helpers for handling return types

type ServiceError = { success: false; error: { message: string; status: number } };
export type ServiceResult<T> = { success: true; data: T } | ServiceError;


export function fail(error: string, status: number): ServiceError {
    return { success: false, error: { message: error, status } };
}


export function success<T>(data: T): ServiceResult<T> {
    return { success: true, data: data };
}


export function mapDbError(error: Error, fallbackMessage: string): ServiceError {
    if (error && /unique|constraint/i.test(error.message)) {
        return fail('Resource already exists', 409);
    }
    return fail(error.message, 500);
}


export function handleServiceResult<T>(res: Response, result: ServiceResult<T>): void {
    if ('error' in result) {
        res.status(result.error.status).json({ error: result.error.message });
    }
    else {
        res.json(result.data);
    }
}

// ----------------------------------------------
// types used across memories services
export type Selection = {
    provider: string;
    asset_ids: string[];
    passphrase?: string;
};

export type StatusResult = {
    connected: true;
    user: { name: string }
} | {
    connected: false;
    error: string
};

export type SyncAlbumResult = {
    added: number;
    total: number
};


export type AlbumsList = {
    albums: Array<{ id: string; albumName: string; assetCount: number; passphrase?: string }>
};

export type Asset = {
    id: string;
    takenAt: string;
    mediaType?: string;
    city?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
};

export type AssetsList = {
    assets: Asset[],
    total: number,
    hasMore: boolean
};


export type AssetInfo = {
    id: string;
    takenAt: string | null;
    city: string | null;
    country: string | null;
    state?: string | null;
    camera?: string | null;
    lens?: string | null;
    focalLength?: string | number | null;
    aperture?: string | number | null;
    shutter?: string | number | null;
    iso?: string | number | null;
    lat?: number | null;
    lng?: number | null;
    orientation?: number | null;
    description?: string | null;
    width?: number | null;
    height?: number | null;
    fileSize?: number | null;
    fileName?: string | null;
}

/**
 * Proxy an upstream asset straight to the client.
 *
 * It writes status, headers and body onto the Express response itself and is
 * NOT a candidate for StreamableFile: it forwards the upstream's 206 and
 * Content-Range so a <video> can seek (#823), swaps Cache-Control to no-store
 * on an error status, and has to answer differently once headers are already
 * sent. All three controllers take @Res() anyway.
 */
export async function pipeAsset(url: string, response: Response, headers?: Record<string, string>, signal?: AbortSignal, defaultCacheControl?: string, fetchOptions?: SafeFetchOptions): Promise<void> {
    try {
        const resp = await safeFetch(url, { headers, signal: signal as any }, fetchOptions);

        response.status(resp.status);
        if (resp.headers.get('content-type')) response.set('Content-Type', resp.headers.get('content-type') as string);
        if (!resp.ok) {
            response.set('Cache-Control', 'no-store, max-age=0');
        } else if (resp.headers.get('cache-control')) {
            response.set('Cache-Control', resp.headers.get('cache-control') as string);
        } else if (defaultCacheControl) {
            response.set('Cache-Control', defaultCacheControl);
        }
        if (resp.headers.get('content-length')) response.set('Content-Length', resp.headers.get('content-length') as string);
        if (resp.headers.get('content-disposition')) response.set('Content-Disposition', resp.headers.get('content-disposition') as string);
        // Pass byte-range metadata through so a <video> can seek (#823). Upstream
        // returns 206 + Content-Range when the caller forwarded a Range header.
        if (resp.headers.get('accept-ranges')) response.set('Accept-Ranges', resp.headers.get('accept-ranges') as string);
        if (resp.headers.get('content-range')) response.set('Content-Range', resp.headers.get('content-range') as string);

        if (!resp.body) {
            response.end();
        } else {
            await pipeline(Readable.fromWeb(resp.body as any), response);
        }
    } catch (error) {
        if (response.headersSent) {
            response.end();
            return;
        }
        if (error instanceof SsrfBlockedError) {
            response.status(400).json({ error: error.message });
        } else {
            // Don't log the URL — it can carry a Synology _sid / passphrase.
            console.error('pipeAsset: upstream fetch failed:', error);
            response.status(500).json({ error: 'Failed to fetch asset' });
        }
    }
}

// ── Route shape for the settings page ─────────────────────────────────────

/**
 * Where the client finds a provider's settings/status/test endpoints. Pure
 * string building, so it stays here rather than on a service — the admin and
 * addons surfaces both read it and neither should have to import the memories
 * domain to do so.
 */
export interface PhotoProviderConfig {
  settings_get: string;
  settings_put: string;
  status_get: string;
  test_post: string;
}

export function getPhotoProviderConfig(providerId: string): PhotoProviderConfig {
  const prefix = `/integrations/memories/${providerId}`;
  return {
    settings_get: `${prefix}/settings`,
    settings_put: `${prefix}/settings`,
    status_get: `${prefix}/status`,
    test_post: `${prefix}/test`,
  };
}
