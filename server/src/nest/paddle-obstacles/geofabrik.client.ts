import { readCappedJson } from '../../utils/cappedFetch';
import { logWarn } from '../audit/audit-log.logger';
import type { RegionBoundary } from './paddle-geo';
import { Injectable } from '@nestjs/common';
import { paddleRegionBoundarySchema } from '@trek/shared';

import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { z } from 'zod';

/**
 * The outbound half of PAD-05A: Geofabrik's list of regional extracts and the
 * download of one. Only Geofabrik's own host is ever asked, at addresses its
 * list names, so an admin choosing a region can point TREK nowhere else. A
 * redirect is followed only to another address of Geofabrik's.
 */

export const GEOFABRIK_HOST = 'https://download.geofabrik.de/';
const INDEX_URL = `${GEOFABRIK_HOST}index-v1.json`;
const INDEX_TIMEOUT_MS = 20_000;
/** The list is a few megabytes; far more means it is not the list. */
const MAX_INDEX_BYTES = 32 * 1024 * 1024;
const INDEX_FRESH_MS = 24 * 60 * 60 * 1000;
const SIZE_TIMEOUT_MS = 10_000;
/** A whole country is a few gigabytes; a regional extract far less. More than this is refused. */
export const MAX_EXTRACT_BYTES = 4 * 1024 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60 * 60 * 1000;
const MAX_REDIRECTS = 3;

const indexSchema = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        id: z.string(),
        parent: z.string().optional(),
        name: z.string(),
        urls: z.object({ pbf: z.string().optional() }).passthrough(),
      }),
      geometry: z.unknown(),
    }),
  ),
});

export interface GeofabrikRegion {
  id: string;
  name: string;
  parent: string | null;
  pbfUrl: string;
  boundary: RegionBoundary | null;
}

/** An address on Geofabrik's own servers, over https. */
function isGeofabrikUrl(url: URL): boolean {
  return url.protocol === 'https:' && (url.hostname === 'geofabrik.de' || url.hostname.endsWith('.geofabrik.de'));
}

/** An extract the list names: Geofabrik's host, a `-latest.osm.pbf` file. */
export function isExtractUrl(url: string): boolean {
  return url.startsWith(GEOFABRIK_HOST) && url.endsWith('-latest.osm.pbf');
}

/**
 * `fetch` that follows a redirect only while it stays on Geofabrik's servers.
 * A redirect anywhere else is refused, so the list's addresses are the only
 * ones TREK ever reads an extract from.
 */
async function fetchFromGeofabrik(
  url: string,
  signal: AbortSignal,
  hops = 0,
  method: 'GET' | 'HEAD' = 'GET',
): Promise<Response> {
  const response = await fetch(url, { signal, redirect: 'manual', method });
  if (response.status < 300 || response.status >= 400) return response;
  await response.body?.cancel().catch(() => undefined);
  const location = response.headers.get('location');
  const next = location ? new URL(location, url) : null;
  if (!next || !isGeofabrikUrl(next)) throw new Error('Geofabrik redirected away from its own servers');
  if (hops >= MAX_REDIRECTS) throw new Error('Geofabrik redirected too often');
  return await fetchFromGeofabrik(next.href, signal, hops + 1, method);
}

@Injectable()
export class GeofabrikClient {
  private index: { regions: Map<string, GeofabrikRegion>; fetchedAt: number } | null = null;

  /** Every region the list names that has an extract on Geofabrik's host, by id. */
  async regions(now: number = Date.now()): Promise<Map<string, GeofabrikRegion>> {
    if (this.index && now - this.index.fetchedAt < INDEX_FRESH_MS) return this.index.regions;
    const response = await fetchFromGeofabrik(INDEX_URL, AbortSignal.timeout(INDEX_TIMEOUT_MS));
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`Geofabrik index ${response.status}`);
    }
    const parsed = indexSchema.safeParse(await readCappedJson<unknown>(response, MAX_INDEX_BYTES));
    if (!parsed.success) throw new Error('Geofabrik index is not the list of extracts');
    const regions = new Map<string, GeofabrikRegion>();
    for (const feature of parsed.data.features) {
      const { id, name, parent, urls } = feature.properties;
      if (!urls.pbf || !isExtractUrl(urls.pbf)) continue;
      const boundary = paddleRegionBoundarySchema.safeParse(feature.geometry);
      regions.set(id, {
        id,
        name,
        parent: parent ?? null,
        pbfUrl: urls.pbf,
        boundary: boundary.success ? boundary.data : null,
      });
    }
    this.index = { regions, fetchedAt: now };
    return regions;
  }

  /**
   * The size of an extract the list names, in bytes, as Geofabrik announces
   * it; null when it does not say or cannot be asked right now. Nothing is
   * downloaded: it is asked with HEAD.
   */
  async sizeOf(url: string): Promise<number | null> {
    if (!isExtractUrl(url)) throw new Error('Not a Geofabrik extract');
    try {
      const response = await fetchFromGeofabrik(url, AbortSignal.timeout(SIZE_TIMEOUT_MS), 0, 'HEAD');
      const size = Number(response.headers.get('content-length'));
      return response.ok && Number.isSafeInteger(size) && size > 0 ? size : null;
    } catch (err) {
      // Not knowing the size is no failure: the caller treats it as unknown and the download still caps it.
      logWarn(`[Paddle] size of ${url}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * One region's extract written to `target`. The address must be one the
   * list named; the body is counted as it streams and cut at `maxBytes`
   * (MAX_EXTRACT_BYTES unless the caller allows less), and the file goes when
   * the download fails or `signal` calls it off. `onProgress` hears the share
   * received so far when the server said how much there is.
   */
  async download(
    url: string,
    target: string,
    options: { signal?: AbortSignal; onProgress?: (fraction: number) => void; maxBytes?: number } = {},
  ): Promise<void> {
    const maxBytes = Math.min(options.maxBytes ?? MAX_EXTRACT_BYTES, MAX_EXTRACT_BYTES);
    if (!isExtractUrl(url)) throw new Error('Not a Geofabrik extract');
    const deadline = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
    const response = await fetchFromGeofabrik(url, signal);
    if (!response.ok || !response.body) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`Geofabrik download ${response.status}`);
    }
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > maxBytes) {
      await response.body.cancel().catch(() => undefined);
      throw new Error('Extract larger than allowed');
    }
    let received = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, done) {
        received += chunk.length;
        if (received > maxBytes) {
          done(new Error('Extract larger than allowed'));
          return;
        }
        if (declared > 0) options.onProgress?.(Math.min(1, received / declared));
        done(null, chunk);
      },
    });
    try {
      await pipeline(
        Readable.fromWeb(response.body as unknown as WebReadableStream),
        counter,
        createWriteStream(target),
        { signal },
      );
    } catch (err) {
      await unlink(target).catch(() => undefined);
      throw err;
    }
  }
}
