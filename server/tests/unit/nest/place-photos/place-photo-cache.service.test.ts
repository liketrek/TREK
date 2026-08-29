/**
 * Unit tests for PlacePhotoCacheService — PPC-001 through PPC-014.
 * Covers the downscale guard in put(), removeIfUnreferenced(), sweepOrphans(),
 * the two negative-cache windows, and the serveKey/get miss handling.
 *
 * Slice 4: the cache is fully async and addresses storage as
 * ('photos-google', '<sha1>.jpg'). The whole suite runs in BOTH registry
 * modes — mode A (TREK_PLACE_PHOTO_DIR unset: uploads-local backend,
 * 'photos/google/' prefix) and mode B (dir set: place-photos-local backend,
 * bare keys) — via the shared stub-registry fixture. The real mode flip is
 * pinned by the storage-registry tests; here the two prefixes prove the cache
 * itself is mode-agnostic.
 */
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { PlacePhotoCacheService } from '../../../../src/nest/place-photos/place-photo-cache.service';
import { makeStorageFixture, type StorageFixture } from '../../../helpers/storage-fixture';

import { Jimp, JimpMime } from 'jimp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { testDb } = vi.hoisted(() => {
  const Db = require('better-sqlite3');
  return { testDb: new Db(':memory:') };
});

// Minimal real DB with just the tables the cache touches. isReferenced
// UNIONs collection_places (#1081 photo-cache fix), so the bare fixture must
// declare it too or the reference check would throw "no such table".
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

vi.mock('../../../../src/db/database', () => ({ db: testDb }));

async function makeJpeg(width: number, height: number): Promise<Buffer> {
  const img = new Jimp({ width, height, color: 0xff0000ff });
  return img.getBuffer(JimpMime.jpeg, { quality: 80 });
}

function nameFor(placeId: string): string {
  return `${crypto.createHash('sha1').update(placeId).digest('hex')}.jpg`;
}

describe.each([
  ['mode A (photos/google/ prefix)', 'photos/google/'],
  ['mode B (bare keys)', ''],
])('PlacePhotoCacheService — %s', (_label, keyPrefix) => {
  let fx: StorageFixture;
  let cache: PlacePhotoCacheService;

  const prefixDir = () => path.join(fx.root, ...keyPrefix.split('/').filter(Boolean));
  const filePathFor = (placeId: string) => path.join(prefixDir(), nameFor(placeId));
  const writeObject = (placeId: string, bytes: Buffer | string) => {
    fs.mkdirSync(prefixDir(), { recursive: true });
    fs.writeFileSync(filePathFor(placeId), bytes);
  };

  beforeAll(() => {
    fx = makeStorageFixture(keyPrefix);
    cache = new PlacePhotoCacheService(new DatabaseService(testDb as never), fx.storage);
  });

  beforeEach(() => {
    testDb.exec('DELETE FROM places; DELETE FROM collection_places; DELETE FROM google_place_photo_meta;');
    for (const f of fs.readdirSync(fx.root)) {
      if (f === '.tmp') continue;
      fs.rmSync(path.join(fx.root, f), { recursive: true, force: true });
    }
  });

  afterAll(() => {
    fx.cleanup();
  });

  describe('put() downscale guard', () => {
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

  describe('serveKey()', () => {
    it('returns the bare <sha1>.jpg storage name when the photo object exists', async () => {
      writeObject('p-key', await makeJpeg(10, 10));
      expect(await cache.serveKey('p-key')).toBe(nameFor('p-key'));
    });

    it('returns null when nothing is cached', async () => {
      expect(await cache.serveKey('p-missing')).toBeNull();
    });
  });

  describe('get()', () => {
    it('PPC-013: purges the meta row and returns null when the object vanished', async () => {
      testDb
        .prepare('INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at) VALUES (?, ?, ?)')
        .run('gone-place', 'Bob', Date.now());

      expect(await cache.get('gone-place')).toBeNull();
      expect(
        testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('gone-place'),
      ).toBeUndefined();
    });

    it('PPC-014: returns the proxy URL + attribution for a cached photo', async () => {
      await cache.put('hit-place', await makeJpeg(20, 20), 'Carol');

      const hit = await cache.get('hit-place');
      expect(hit).toEqual({
        photoUrl: `/api/maps/place-photo/${encodeURIComponent('hit-place')}/bytes`,
        attribution: 'Carol',
      });
    });
  });

  describe('removeIfUnreferenced()', () => {
    it('PPC-004: removes a cache entry that no place references', async () => {
      await cache.put('orphan', await makeJpeg(50, 50), null);
      expect(fs.existsSync(filePathFor('orphan'))).toBe(true);

      await cache.removeIfUnreferenced('orphan');

      expect(fs.existsSync(filePathFor('orphan'))).toBe(false);
      expect(testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('orphan')).toBeUndefined();
    });

    it('PPC-005: keeps an entry still referenced by google_place_id', async () => {
      await cache.put('gid-1', await makeJpeg(50, 50), null);
      testDb.prepare('INSERT INTO places (google_place_id) VALUES (?)').run('gid-1');

      await cache.removeIfUnreferenced('gid-1');

      expect(fs.existsSync(filePathFor('gid-1'))).toBe(true);
    });

    it('PPC-006: keeps an entry referenced by a coords proxy URL in image_url', async () => {
      const id = 'coords:48.8:2.3';
      await cache.put(id, await makeJpeg(50, 50), null);
      const proxy = `/api/maps/place-photo/${encodeURIComponent(id)}/bytes`;
      testDb.prepare('INSERT INTO places (image_url) VALUES (?)').run(proxy);

      await cache.removeIfUnreferenced(id);

      expect(fs.existsSync(filePathFor(id))).toBe(true);
    });
  });

  describe('sweepOrphans()', () => {
    it('PPC-007: removes orphaned meta rows + files, keeps referenced ones, deletes stray files', async () => {
      await cache.put('keep-gid', await makeJpeg(50, 50), null);
      await cache.put('drop-me', await makeJpeg(50, 50), null);
      testDb.prepare('INSERT INTO places (google_place_id) VALUES (?)').run('keep-gid');

      // A stray .jpg on disk with no meta row (e.g. a crash between write and upsert).
      const strayPath = path.join(prefixDir(), 'deadbeef'.padEnd(40, '0') + '.jpg');
      fs.writeFileSync(strayPath, 'stray');

      const removed = await cache.sweepOrphans();

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

      expect(await cache.sweepOrphans()).toBe(0);
      expect(fs.existsSync(filePathFor('ref-a'))).toBe(true);
    });

    it('PPC-015: never touches nested entries or non-jpg files (readdir parity — list() recurses)', async () => {
      const nestedDir = path.join(prefixDir(), 'sub');
      fs.mkdirSync(nestedDir, { recursive: true });
      const nested = path.join(nestedDir, 'nested.jpg');
      fs.writeFileSync(nested, 'nested');
      const note = path.join(prefixDir(), 'note.txt');
      fs.writeFileSync(note, 'not a photo');

      const removed = await cache.sweepOrphans();

      expect(fs.existsSync(nested)).toBe(true);
      expect(fs.existsSync(note)).toBe(true);
      expect(removed).toBe(0);
    });
  });

  describe('negative cache', () => {
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
});
