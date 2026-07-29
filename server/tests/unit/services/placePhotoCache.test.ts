/**
 * Unit tests for placePhotoCache — PPC-001 through PPC-012.
 * Covers the downscale guard in put(), removeIfUnreferenced(), sweepOrphans(),
 * and the two negative-cache windows.
 * Uses a real in-memory SQLite DB and a throwaway temp upload dir
 * (TREK_PLACE_PHOTO_DIR) so the real uploads tree is never touched.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { Jimp, JimpMime } from 'jimp';
import Database from 'better-sqlite3';

// Throwaway upload dir — set before importing the module under test (it reads the
// env at load time and mkdirs the dir).
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-'));
process.env.TREK_PLACE_PHOTO_DIR = TMP_DIR;

// Minimal real DB with just the tables placePhotoCache touches. isReferenced now
// UNIONs collection_places (#1081 photo-cache fix), so the bare fixture must
// declare it too or the reference check would throw "no such table".
const testDb = new Database(':memory:');
testDb.exec(`
  CREATE TABLE places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT,
    image_url TEXT
  );
  CREATE TABLE collection_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT,
    image_url TEXT
  );
  CREATE TABLE google_place_photo_meta (
    place_id    TEXT PRIMARY KEY,
    attribution TEXT,
    fetched_at  INTEGER NOT NULL,
    error_at    INTEGER
  );
`);

vi.mock('../../../src/db/database', () => ({ db: testDb }));

function filePathFor(placeId: string): string {
  const hash = crypto.createHash('sha1').update(placeId).digest('hex');
  return path.join(TMP_DIR, `${hash}.jpg`);
}

async function makeJpeg(width: number, height: number): Promise<Buffer> {
  const img = new Jimp({ width, height, color: 0xff0000ff });
  return img.getBuffer(JimpMime.jpeg, { quality: 80 });
}

let cache: typeof import('../../../src/services/placePhotoCache');

beforeAll(async () => {
  cache = await import('../../../src/services/placePhotoCache');
});

beforeEach(() => {
  testDb.exec('DELETE FROM places; DELETE FROM google_place_photo_meta;');
  for (const f of fs.readdirSync(TMP_DIR)) fs.rmSync(path.join(TMP_DIR, f), { force: true });
});

afterAll(() => {
  testDb.close();
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('placePhotoCache.put() downscale guard', () => {
  it('PPC-001: downscales an oversized image to <= 800px', async () => {
    const big = await makeJpeg(1600, 1200);
    await cache.put('big-place', big, 'Alice');

    const written = fs.readFileSync(filePathFor('big-place'));
    const decoded = await Jimp.read(written);
    expect(Math.max(decoded.bitmap.width, decoded.bitmap.height)).toBeLessThanOrEqual(800);
    expect(written.length).toBeLessThan(big.length);
  });

  it('PPC-002: passes a small image through unchanged', async () => {
    const small = await makeJpeg(100, 100);
    await cache.put('small-place', small, null);

    const written = fs.readFileSync(filePathFor('small-place'));
    expect(written.equals(small)).toBe(true);
  });

  it('PPC-003: falls back to original bytes when the input is not a decodable image', async () => {
    const garbage = Buffer.from('definitely not an image');
    await cache.put('garbage-place', garbage, null);

    const written = fs.readFileSync(filePathFor('garbage-place'));
    expect(written.equals(garbage)).toBe(true);
  });
});

describe('placePhotoCache.removeIfUnreferenced()', () => {
  it('PPC-004: removes a cache entry that no place references', async () => {
    await cache.put('orphan', await makeJpeg(50, 50), null);
    expect(fs.existsSync(filePathFor('orphan'))).toBe(true);

    cache.removeIfUnreferenced('orphan');

    expect(fs.existsSync(filePathFor('orphan'))).toBe(false);
    expect(testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('orphan')).toBeUndefined();
  });

  it('PPC-005: keeps an entry still referenced by google_place_id', async () => {
    await cache.put('gid-1', await makeJpeg(50, 50), null);
    testDb.prepare('INSERT INTO places (google_place_id) VALUES (?)').run('gid-1');

    cache.removeIfUnreferenced('gid-1');

    expect(fs.existsSync(filePathFor('gid-1'))).toBe(true);
  });

  it('PPC-006: keeps an entry referenced by a coords proxy URL in image_url', async () => {
    const id = 'coords:48.8:2.3';
    await cache.put(id, await makeJpeg(50, 50), null);
    const proxy = `/api/maps/place-photo/${encodeURIComponent(id)}/bytes`;
    testDb.prepare('INSERT INTO places (image_url) VALUES (?)').run(proxy);

    cache.removeIfUnreferenced(id);

    expect(fs.existsSync(filePathFor(id))).toBe(true);
  });
});

describe('placePhotoCache.sweepOrphans()', () => {
  it('PPC-007: removes orphaned meta rows + files, keeps referenced ones, deletes stray files', async () => {
    await cache.put('keep-gid', await makeJpeg(50, 50), null);
    await cache.put('drop-me', await makeJpeg(50, 50), null);
    testDb.prepare('INSERT INTO places (google_place_id) VALUES (?)').run('keep-gid');

    // A stray .jpg on disk with no meta row (e.g. a crash between write and upsert).
    const strayPath = path.join(TMP_DIR, 'deadbeef'.padEnd(40, '0') + '.jpg');
    fs.writeFileSync(strayPath, 'stray');

    const removed = cache.sweepOrphans();

    expect(fs.existsSync(filePathFor('keep-gid'))).toBe(true);
    expect(fs.existsSync(filePathFor('drop-me'))).toBe(false);
    expect(fs.existsSync(strayPath)).toBe(false);
    expect(testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('drop-me')).toBeUndefined();
    expect(testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('keep-gid')).toBeDefined();
    expect(removed).toBe(2); // drop-me (orphan meta+file) + stray file
  });

  it('PPC-008: returns 0 when every entry is referenced', async () => {
    await cache.put('ref-a', await makeJpeg(50, 50), null);
    testDb.prepare('INSERT INTO places (google_place_id) VALUES (?)').run('ref-a');

    expect(cache.sweepOrphans()).toBe(0);
    expect(fs.existsSync(filePathFor('ref-a'))).toBe(true);
  });
});

describe('placePhotoCache negative cache', () => {
  function ageError(placeId: string, ms: number): void {
    testDb
      .prepare('UPDATE google_place_photo_meta SET error_at = ? WHERE place_id = ?')
      .run(Date.now() - ms, placeId);
  }

  it('PPC-009: a place with no photo stays remembered well past the old five-minute window', () => {
    cache.markError('photo-less');

    ageError('photo-less', 30 * 60 * 1000);
    expect(cache.getErrored('photo-less')).toBe(true);

    ageError('photo-less', 5 * 60 * 60 * 1000);
    expect(cache.getErrored('photo-less')).toBe(true);
  });

  it('PPC-010: the miss expires once it is a day old', () => {
    cache.markError('stale-miss');
    ageError('stale-miss', 24 * 60 * 60 * 1000);

    expect(cache.getErrored('stale-miss')).toBe(false);
  });

  // A failed provider call says nothing about the place, so it must not inherit the
  // long window a real "this place has no photo" answer gets.
  it('PPC-011: a failed provider call is forgotten after minutes and never persisted', () => {
    vi.useFakeTimers();
    try {
      cache.markError('flaky', 'provider-error');
      expect(cache.getErrored('flaky')).toBe(true);
      // Nothing on disk — a restart retries instead of inheriting someone's outage.
      expect(testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('flaky')).toBeUndefined();

      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(cache.getErrored('flaky')).toBe(false);

      // The long window belongs to the other case: same age, still remembered.
      cache.markError('photo-less-too');
      ageError('photo-less-too', 5 * 60 * 1000);
      expect(cache.getErrored('photo-less-too')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('PPC-012: a cached photo clears an earlier failed attempt', async () => {
    cache.markError('recovered', 'provider-error');
    expect(cache.getErrored('recovered')).toBe(true);

    await cache.put('recovered', await makeJpeg(40, 40), null);
    expect(cache.getErrored('recovered')).toBe(false);
  });
});
