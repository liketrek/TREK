/**
 * TrekPhotoCacheService — the disk + metadata cache for provider assets.
 *
 * It had no suite of its own: it lived in services/memories/, which the
 * coverage gate does not measure, so a cache that silently stopped evicting or
 * stopped deduping concurrent fetches would not have failed anything. The
 * stampede guard in particular is the reason the in-flight map is module-scoped
 * rather than an instance field.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  return {
    testDb: db,
    dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null, isOwner: () => false, getPlaceWithTags: () => null },
  };
});
vi.mock('../../../src/db/database', () => dbMock);

import fs from 'node:fs';
import path from 'node:path';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { TrekPhotoCacheService, CACHE_TTL } from '../../../src/nest/memories/trek-photo-cache.service';
import { UPLOADS_ROOT } from '../../../src/nest/memories/uploads-root';

const svc = new TrekPhotoCacheService(new DatabaseService(testDb));
const CACHE_DIR = path.join(UPLOADS_ROOT, 'photos/trek');
const written: string[] = [];

/** Unique per case so parallel files cannot collide on the shared cache dir. */
function freshKey(label: string): string {
  const key = svc.cacheKey('test', `${label}-${process.pid}-${written.length}`, 'thumbnail', 1);
  written.push(key);
  return key;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  testDb.prepare('DELETE FROM trek_photo_cache_meta').run();
});

afterAll(() => {
  for (const key of written) {
    try { fs.unlinkSync(path.join(CACHE_DIR, `${key}.bin`)); } catch { /* never written */ }
  }
  testDb.close();
});

describe('cacheKey', () => {
  it('CACHE-001: is deterministic and separates provider, asset, kind and owner', () => {
    const a = svc.cacheKey('immich', 'asset-1', 'thumbnail', 7);
    expect(svc.cacheKey('immich', 'asset-1', 'thumbnail', 7)).toBe(a);
    expect(svc.cacheKey('immich', 'asset-1', 'original', 7)).not.toBe(a);
    expect(svc.cacheKey('immich', 'asset-1', 'thumbnail', 8)).not.toBe(a);
    expect(svc.cacheKey('synologyphotos', 'asset-1', 'thumbnail', 7)).not.toBe(a);
  });
});

describe('put / getFresh', () => {
  it('CACHE-002: a stored entry comes back with its content type and a real file', async () => {
    const key = freshKey('hit');
    await svc.put(key, Buffer.from('jpegbytes'), 'image/jpeg');

    const entry = svc.getFresh(key);
    expect(entry).not.toBeNull();
    expect(entry!.contentType).toBe('image/jpeg');
    expect(fs.readFileSync(entry!.filePath).toString()).toBe('jpegbytes');
  });

  it('CACHE-003: an unknown key is a miss, not an error', () => {
    expect(svc.getFresh('no-such-key')).toBeNull();
  });

  it('CACHE-004: an entry past its TTL is a miss and its metadata row is dropped', async () => {
    const key = freshKey('stale');
    await svc.put(key, Buffer.from('old'), 'image/jpeg');
    testDb.prepare('UPDATE trek_photo_cache_meta SET fetched_at = ? WHERE cache_key = ?')
      .run(Date.now() - CACHE_TTL - 1000, key);

    expect(svc.getFresh(key)).toBeNull();
    expect(testDb.prepare('SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?').get(key)).toBeUndefined();
  });

  it('CACHE-005: metadata without its file is a miss and the row is dropped', () => {
    const key = 'orphan-meta-row';
    testDb.prepare('INSERT INTO trek_photo_cache_meta (cache_key, content_type, fetched_at) VALUES (?, ?, ?)')
      .run(key, 'image/jpeg', Date.now());

    expect(svc.getFresh(key)).toBeNull();
    expect(testDb.prepare('SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?').get(key)).toBeUndefined();
  });

  it('CACHE-006: writing the same key twice replaces the bytes rather than duplicating the row', async () => {
    const key = freshKey('replace');
    await svc.put(key, Buffer.from('first'), 'image/jpeg');
    await svc.put(key, Buffer.from('second'), 'image/png');

    const rows = testDb.prepare('SELECT content_type FROM trek_photo_cache_meta WHERE cache_key = ?').all(key);
    expect(rows).toHaveLength(1);
    expect(svc.getFresh(key)!.contentType).toBe('image/png');
    expect(fs.readFileSync(svc.getFresh(key)!.filePath).toString()).toBe('second');
  });
});

describe('serveFresh', () => {
  it('CACHE-007: sends the cached file with a one-hour cache header', async () => {
    const key = freshKey('serve');
    await svc.put(key, Buffer.from('bytes'), 'image/webp');
    const res = { set: vi.fn(), sendFile: vi.fn() };

    expect(svc.serveFresh(res as never, key)).toBe(true);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/webp');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    expect(res.sendFile).toHaveBeenCalledOnce();
  });

  it('CACHE-008: reports a miss without touching the response', () => {
    const res = { set: vi.fn(), sendFile: vi.fn() };
    expect(svc.serveFresh(res as never, 'nothing-cached')).toBe(false);
    expect(res.set).not.toHaveBeenCalled();
    expect(res.sendFile).not.toHaveBeenCalled();
  });
});

describe('the stampede guard', () => {
  it('CACHE-009: a second caller gets the first caller\'s in-flight promise', async () => {
    const key = 'inflight-key';
    let resolveFetch!: (b: Buffer) => void;
    const fetch = new Promise<Buffer | null>((resolve) => { resolveFetch = resolve as (b: Buffer) => void; });

    svc.setInFlight(key, fetch);
    expect(svc.getInFlight(key)).toBe(fetch);

    resolveFetch(Buffer.from('done'));
    await fetch;
    // Settling clears the slot, so the next request starts a fresh fetch.
    await Promise.resolve();
    expect(svc.getInFlight(key)).toBeUndefined();
  });

  it('CACHE-010: the map is shared across instances — the scheduler builds its own', () => {
    // Load-bearing: a per-instance map would give the cron and the container
    // separate guards and the dedup would be silently gone.
    const other = new TrekPhotoCacheService(new DatabaseService(testDb));
    const promise = Promise.resolve<Buffer | null>(null);
    svc.setInFlight('shared-key', promise);
    expect(other.getInFlight('shared-key')).toBe(promise);
  });
});

describe('sweepExpired', () => {
  it('CACHE-011: drops rows and files past twice the TTL and leaves fresh ones alone', async () => {
    const staleKey = freshKey('sweep-stale');
    const freshKeyId = freshKey('sweep-fresh');
    await svc.put(staleKey, Buffer.from('old'), 'image/jpeg');
    await svc.put(freshKeyId, Buffer.from('new'), 'image/jpeg');
    testDb.prepare('UPDATE trek_photo_cache_meta SET fetched_at = ? WHERE cache_key = ?')
      .run(Date.now() - CACHE_TTL * 2 - 1000, staleKey);
    const staleFile = path.join(CACHE_DIR, `${staleKey}.bin`);

    svc.sweepExpired();

    expect(testDb.prepare('SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?').get(staleKey)).toBeUndefined();
    expect(fs.existsSync(staleFile)).toBe(false);
    expect(testDb.prepare('SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?').get(freshKeyId)).toBeDefined();
  });

  it('CACHE-012: survives a metadata row whose file is already gone', () => {
    const key = 'sweep-orphan';
    testDb.prepare('INSERT INTO trek_photo_cache_meta (cache_key, content_type, fetched_at) VALUES (?, ?, ?)')
      .run(key, 'image/jpeg', Date.now() - CACHE_TTL * 3);

    expect(() => svc.sweepExpired()).not.toThrow();
    expect(testDb.prepare('SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?').get(key)).toBeUndefined();
  });
});
