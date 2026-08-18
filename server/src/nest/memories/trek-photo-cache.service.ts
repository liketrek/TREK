import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { UPLOADS_ROOT } from './uploads-root';

const TREK_PHOTO_DIR = path.join(UPLOADS_ROOT, 'photos/trek');
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

function ensureDir(): void {
  if (!fs.existsSync(TREK_PHOTO_DIR)) {
    fs.mkdirSync(TREK_PHOTO_DIR, { recursive: true });
  }
}

function cachedFilePath(key: string): string {
  return path.join(TREK_PHOTO_DIR, `${key}.bin`);
}

/** Disk + metadata cache for provider thumbnails and originals. */
@Injectable()
export class TrekPhotoCacheService {
  constructor(private readonly db: DatabaseService) {}

  cacheKey(provider: string, assetId: string, kind: string, ownerId: number): string {
    return crypto.createHash('sha1').update(`${provider}:${assetId}:${kind}:${ownerId}`).digest('hex');
  }



  getFresh(key: string): { filePath: string; contentType: string } | null {
    const row = this.db.get<{ content_type: string; fetched_at: number }>(
      'SELECT content_type, fetched_at FROM trek_photo_cache_meta WHERE cache_key = ?', key,
    );

    if (!row) return null;

    if (Date.now() - row.fetched_at >= CACHE_TTL) {
      this.db.run('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?', key);
      return null;
    }

    const fp = cachedFilePath(key);
    if (!fs.existsSync(fp)) {
      this.db.run('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?', key);
      return null;
    }

    return { filePath: fp, contentType: row.content_type };
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    ensureDir();
    const fp = cachedFilePath(key);
    const tmp = fp + '.tmp';

    await fsPromises.writeFile(tmp, bytes);
    await fsPromises.rename(tmp, fp);

    this.db.run(
      'INSERT OR REPLACE INTO trek_photo_cache_meta (cache_key, content_type, fetched_at) VALUES (?, ?, ?)',
      key, contentType, Date.now(),
    );
  }

  serveFresh(res: Response, key: string): boolean {
    const entry = this.getFresh(key);
    if (!entry) return false;

    res.set('Content-Type', entry.contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    // Root-relative, see photo-resolver.service.ts — an absolute path 404s under
    // the Nest ExpressAdapter.
    res.sendFile(path.basename(entry.filePath), { root: path.dirname(entry.filePath) });
    return true;
  }

  getInFlight(key: string): Promise<Buffer | null> | undefined {
    return inFlight.get(key);
  }

  setInFlight(key: string, promise: Promise<Buffer | null>): void {
    inFlight.set(key, promise);
    promise.finally(() => inFlight.delete(key));
  }

  sweepExpired(): void {
    const cutoff = Date.now() - CACHE_TTL * 2;
    const stale = this.db.all<{ cache_key: string }>(
      'SELECT cache_key FROM trek_photo_cache_meta WHERE fetched_at < ?', cutoff,
    );

    for (const row of stale) {
      this.db.run('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?', row.cache_key);
      const fp = cachedFilePath(row.cache_key);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  }
}
