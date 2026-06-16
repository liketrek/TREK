import { db } from '../db/database';

import { Jimp, JimpMime } from 'jimp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

// Overridable for tests (mirrors the TREK_DB_FILE seam) so the suite never touches
// the real uploads tree.
const GOOGLE_PHOTO_DIR = process.env.TREK_PLACE_PHOTO_DIR || path.join(__dirname, '../../uploads/photos/google');
const ERROR_TTL = 5 * 60 * 1000;

// Marker photos are displayed tiny — cap stored images so an oversized source
// (e.g. a Wikimedia Commons full-res original) can't bloat the cache. Matches
// THUMB_MAX/THUMB_QUALITY in memories/thumbnailService.ts.
const MAX_DIM = 800;
const JPEG_QUALITY = 80;

// In-flight dedup — prevents stampedes when multiple requests hit the same uncached placeId simultaneously
const inFlight = new Map<string, Promise<{ filePath: string; attribution: string | null } | null>>();

// In-memory set of placeIds whose file is confirmed on disk this session.
// Avoids a synchronous fs.existsSync() call on every cache hit after the first verification.
const knownOnDisk = new Set<string>();

// Ensure upload dir exists once at startup — avoids sync FS calls inside put() on every write.
try {
  fs.mkdirSync(GOOGLE_PHOTO_DIR, { recursive: true });
} catch {
  /* already exists */
}

function filePath(placeId: string): string {
  // Hash to avoid filename collisions — coords:lat:lng pseudo-IDs contain characters that
  // collapse identically under sanitization (e.g. ':' and '.' both → '_')
  const hash = crypto.createHash('sha1').update(placeId).digest('hex');
  return path.join(GOOGLE_PHOTO_DIR, `${hash}.jpg`);
}

function proxyUrl(placeId: string): string {
  return `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`;
}

interface CachedPhoto {
  photoUrl: string;
  filePath: string;
  attribution: string | null;
}

export function get(placeId: string): CachedPhoto | null {
  const row = db
    .prepare('SELECT attribution FROM google_place_photo_meta WHERE place_id = ? AND error_at IS NULL')
    .get(placeId) as { attribution: string | null } | undefined;

  if (!row) return null;

  const fp = filePath(placeId);

  if (!knownOnDisk.has(placeId)) {
    // First time this placeId is checked this session — verify the file exists on disk.
    // (Guards against volume wipes or manual deletion between server restarts.)
    if (!fs.existsSync(fp)) {
      db.prepare('DELETE FROM google_place_photo_meta WHERE place_id = ?').run(placeId);
      return null;
    }
    knownOnDisk.add(placeId);
  }

  return { photoUrl: proxyUrl(placeId), filePath: fp, attribution: row.attribution };
}

export function getErrored(placeId: string): boolean {
  const row = db
    .prepare('SELECT error_at FROM google_place_photo_meta WHERE place_id = ? AND error_at IS NOT NULL')
    .get(placeId) as { error_at: number } | undefined;

  if (!row) return false;
  return Date.now() - row.error_at < ERROR_TTL;
}

export function markError(placeId: string): void {
  knownOnDisk.delete(placeId);
  db.prepare(
    'INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, ?)',
  ).run(placeId, Date.now(), Date.now());
}

// Downscale oversized images to MAX_DIM before caching, re-encoding to JPEG.
// Defense-in-depth: keeps the cache small regardless of what the fetch path hands
// us. Jimp auto-applies EXIF orientation on read. Falls back to the original bytes
// on any failure (corrupt/unsupported format) so behaviour is never worse than before.
async function downscale(bytes: Buffer): Promise<Buffer> {
  try {
    const img = await Jimp.read(bytes);
    if (img.bitmap.width <= MAX_DIM && img.bitmap.height <= MAX_DIM) return bytes;
    img.scaleToFit({ w: MAX_DIM, h: MAX_DIM });
    return await img.getBuffer(JimpMime.jpeg, { quality: JPEG_QUALITY });
  } catch {
    return bytes;
  }
}

export async function put(placeId: string, bytes: Buffer, attribution: string | null): Promise<CachedPhoto> {
  const fp = filePath(placeId);
  const tmp = fp + '.tmp';

  const resized = await downscale(bytes);
  await fsPromises.writeFile(tmp, resized);
  await fsPromises.rename(tmp, fp);

  knownOnDisk.add(placeId);

  db.prepare(
    'INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, ?, ?, NULL)',
  ).run(placeId, attribution, Date.now());

  return { photoUrl: proxyUrl(placeId), filePath: fp, attribution };
}

export function getInFlight(
  placeId: string,
): Promise<{ filePath: string; attribution: string | null } | null> | undefined {
  return inFlight.get(placeId);
}

export function setInFlight(
  placeId: string,
  promise: Promise<{ filePath: string; attribution: string | null } | null>,
): void {
  inFlight.set(placeId, promise);
  promise
    .finally(() => inFlight.delete(placeId))
    .catch(() => {
      /* awaiter logs; this .catch only prevents unhandledRejection */
    });
}

export function serveFilePath(placeId: string): string | null {
  if (knownOnDisk.has(placeId)) return filePath(placeId);
  const fp = filePath(placeId);
  if (!fs.existsSync(fp)) return null;
  knownOnDisk.add(placeId);
  return fp;
}

// A cache entry is "referenced" while any place still points at it — either by the
// Google place_id (the dedup key) or by the stable proxy URL stored in image_url
// (covers coords: pseudo-ids, which never have a google_place_id).
function isReferenced(placeId: string): boolean {
  const row = db
    .prepare('SELECT 1 FROM places WHERE google_place_id = ? OR image_url = ? LIMIT 1')
    .get(placeId, proxyUrl(placeId));
  return !!row;
}

function deleteEntry(placeId: string): void {
  try {
    fs.unlinkSync(filePath(placeId));
  } catch {
    /* already gone */
  }
  db.prepare('DELETE FROM google_place_photo_meta WHERE place_id = ?').run(placeId);
  knownOnDisk.delete(placeId);
}

// Drop a cache entry if no place references it anymore. Called after a place delete
// for prompt reclamation; the nightly sweep is the catch-all for every other path.
export function removeIfUnreferenced(placeId: string): void {
  if (isReferenced(placeId)) return;
  deleteEntry(placeId);
}

// Reclaim orphaned cache files + meta rows. Runs on startup and nightly (scheduler).
// Two passes: (1) meta rows no place references; (2) stray .jpg files with no meta row.
export function sweepOrphans(): number {
  let removed = 0;

  const rows = db.prepare('SELECT place_id FROM google_place_photo_meta').all() as { place_id: string }[];
  const keepFiles = new Set<string>();
  for (const { place_id } of rows) {
    if (isReferenced(place_id)) {
      keepFiles.add(`${crypto.createHash('sha1').update(place_id).digest('hex')}.jpg`);
    } else {
      deleteEntry(place_id);
      removed++;
    }
  }

  // Pass 2: files on disk that no surviving meta row maps to (e.g. left over from a
  // crash between writeFile and the DB upsert, or a meta row deleted out-of-band).
  let entries: string[];
  try {
    entries = fs.readdirSync(GOOGLE_PHOTO_DIR);
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.endsWith('.jpg') || keepFiles.has(entry)) continue;
    try {
      fs.unlinkSync(path.join(GOOGLE_PHOTO_DIR, entry));
      removed++;
    } catch {
      /* race */
    }
  }

  return removed;
}
