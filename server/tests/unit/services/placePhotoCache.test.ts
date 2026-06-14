/**
 * Unit tests for placePhotoCache — PPC-001 through PPC-010.
 * Covers the downscale guard in put(), removeIfUnreferenced(), and sweepOrphans().
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

// Minimal real DB with just the two tables placePhotoCache touches.
const testDb = new Database(':memory:');
testDb.exec(`
  CREATE TABLE places (
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
