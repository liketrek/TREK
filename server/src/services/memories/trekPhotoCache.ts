import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import crypto from 'node:crypto';
import { Response } from 'express';
import { db } from '../../db/database';
import { UPLOADS_ROOT } from '../../nest/memories/uploads-root';

const TREK_PHOTO_DIR = path.join(UPLOADS_ROOT, 'photos/trek');
export const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const inFlight = new Map<string, Promise<Buffer | null>>();

export function cacheKey(provider: string, assetId: string, kind: string, ownerId: number): string {
  return crypto.createHash('sha1').update(`${provider}:${assetId}:${kind}:${ownerId}`).digest('hex');
}

function ensureDir(): void {
  if (!fs.existsSync(TREK_PHOTO_DIR)) {
    fs.mkdirSync(TREK_PHOTO_DIR, { recursive: true });
  }
}

function cachedFilePath(key: string): string {
  return path.join(TREK_PHOTO_DIR, `${key}.bin`);
}

export function getFresh(key: string): { filePath: string; contentType: string } | null {
  const row = db.prepare(
    'SELECT content_type, fetched_at FROM trek_photo_cache_meta WHERE cache_key = ?'
  ).get(key) as { content_type: string; fetched_at: number } | undefined;

  if (!row) return null;

  if (Date.now() - row.fetched_at >= CACHE_TTL) {
    db.prepare('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?').run(key);
    return null;
  }

  const fp = cachedFilePath(key);
  if (!fs.existsSync(fp)) {
    db.prepare('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?').run(key);
    return null;
  }

  return { filePath: fp, contentType: row.content_type };
}

export async function put(key: string, bytes: Buffer, contentType: string): Promise<void> {
  ensureDir();
  const fp = cachedFilePath(key);
  const tmp = fp + '.tmp';

  await fsPromises.writeFile(tmp, bytes);
  await fsPromises.rename(tmp, fp);

  db.prepare(
    'INSERT OR REPLACE INTO trek_photo_cache_meta (cache_key, content_type, fetched_at) VALUES (?, ?, ?)'
  ).run(key, contentType, Date.now());
}

export function serveFresh(res: Response, key: string): boolean {
  const entry = getFresh(key);
  if (!entry) return false;

  res.set('Content-Type', entry.contentType);
  res.set('Cache-Control', 'public, max-age=3600');
  res.sendFile(entry.filePath);
  return true;
}

export function getInFlight(key: string): Promise<Buffer | null> | undefined {
  return inFlight.get(key);
}

export function setInFlight(key: string, promise: Promise<Buffer | null>): void {
  inFlight.set(key, promise);
  promise.finally(() => inFlight.delete(key));
}

export function sweepExpired(): void {
  const cutoff = Date.now() - CACHE_TTL * 2;
  const stale = db.prepare(
    'SELECT cache_key FROM trek_photo_cache_meta WHERE fetched_at < ?'
  ).all(cutoff) as { cache_key: string }[];

  for (const row of stale) {
    db.prepare('DELETE FROM trek_photo_cache_meta WHERE cache_key = ?').run(row.cache_key);
    const fp = cachedFilePath(row.cache_key);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}
