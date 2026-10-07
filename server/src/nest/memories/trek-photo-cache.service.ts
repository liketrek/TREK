import { TrekPhotoCacheMeta } from '../../db/entities/TrekPhotoCacheMeta.entity';
import type { TrekPhotoCacheMetaRepository } from '../../db/repositories/TrekPhotoCacheMeta.repository';
import { StorageService } from '../storage/storage.service';
import { StorageNotFoundError } from '../storage/storage.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { Response } from 'express';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

export const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * In-flight fetches, module-scoped on purpose.
 *
 * This is the stampede guard: ten tiles asking for the same uncached asset must
 * share one upstream fetch. The sweep cron injects the container singleton now
 * (TrekPhotoCacheJob), but the module scope keeps the guard whole even if a
 * second instance of this service ever exists again — a per-instance Map would
 * hand each of them a private one and the guard would be silently gone. Same
 * reasoning as oauth/oauth.pending-codes.ts and the notification channel
 * registry.
 */
const inFlight = new Map<string, Promise<Buffer | null>>();

/** Storage name (category 'photos-trek') for a cache key. */
function objectName(key: string): string {
  return `${key}.bin`;
}

/** Storage + metadata cache for provider thumbnails and originals. */
@Injectable()
export class TrekPhotoCacheService {
  constructor(
    @InjectRepository(TrekPhotoCacheMeta) private readonly cacheMeta: TrekPhotoCacheMetaRepository,
    private readonly storage: StorageService,
  ) {}

  cacheKey(provider: string, assetId: string, kind: string, ownerId: number): string {
    return crypto.createHash('sha1').update(`${provider}:${assetId}:${kind}:${ownerId}`).digest('hex');
  }

  async getFresh(key: string): Promise<{ contentType: string } | null> {
    // TC1
    const row = await this.cacheMeta.findFreshness(key);

    if (!row) return null;

    if (Date.now() - row.fetched_at >= CACHE_TTL) {
      await this.cacheMeta.deleteByCacheKey(key); // TC2
      return null;
    }

    if (!(await this.storage.exists('photos-trek', objectName(key)))) {
      await this.cacheMeta.deleteByCacheKey(key); // TC3
      return null;
    }

    return { contentType: row.content_type };
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    await this.storage.put('photos-trek', objectName(key), Readable.from(bytes));

    // TC4
    await this.cacheMeta.upsertMeta(key, contentType, Date.now());
  }

  async serveFresh(res: Response, key: string): Promise<boolean> {
    const entry = await this.getFresh(key);
    if (!entry) return false;

    res.set('Content-Type', entry.contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    try {
      // send() keeps a pre-set Content-Type, so entry.contentType survives the
      // .bin extension.
      await this.storage.sendToResponse('photos-trek', objectName(key), res);
    } catch (err) {
      // getFresh→send delete race: fall back like a cache miss.
      if (err instanceof StorageNotFoundError && !res.headersSent) return false;
      throw err;
    }
    return true;
  }

  getInFlight(key: string): Promise<Buffer | null> | undefined {
    return inFlight.get(key);
  }

  setInFlight(key: string, promise: Promise<Buffer | null>): void {
    inFlight.set(key, promise);
    // Book-keeping only: the caller awaits `promise` itself and observes its
    // rejection, so the derived chain swallows the same one rather than raising
    // a second, unhandled rejection.
    void promise.finally(() => inFlight.delete(key)).catch(() => undefined);
  }

  async sweepExpired(): Promise<void> {
    const cutoff = Date.now() - CACHE_TTL * 2;
    const stale = await this.cacheMeta.listStale(cutoff); // TC5

    for (const cacheKey of stale) {
      await this.cacheMeta.deleteByCacheKey(cacheKey); // TC6
      await this.storage.delete('photos-trek', objectName(cacheKey));
    }

    // Pass 2 (fix #4, spec rev 3.2): getFresh's expiry path deletes the meta
    // row but never the object — reclaim row-less .bin objects past the same
    // cutoff. The mtime guard spares an in-flight put (object lands before its
    // row); nested keys are skipped because the old readdir-free sweep could
    // never touch them either.
    for await (const stat of this.storage.list('photos-trek')) {
      if (stat.key.includes('/') || !stat.key.endsWith('.bin') || stat.mtimeMs >= cutoff) continue;
      const key = stat.key.slice(0, -'.bin'.length);
      const exists = await this.cacheMeta.existsByCacheKey(key); // TC7
      if (!exists) {
        await this.storage.delete('photos-trek', stat.key).catch(() => {
          /* race */
        });
      }
    }
  }
}
