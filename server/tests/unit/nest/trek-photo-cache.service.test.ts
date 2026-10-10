/**
 * TrekPhotoCacheService — the storage + metadata cache for provider assets.
 *
 * It had no suite of its own: it lived in services/memories/, which the
 * coverage gate does not measure, so a cache that silently stopped evicting or
 * stopped deduping concurrent fetches would not have failed anything. The
 * stampede guard in particular is the reason the in-flight map is module-scoped
 * rather than an instance field.
 *
 * Slice 4: the cache addresses storage as ('photos-trek', '<key>.bin') over a
 * stub-registry fixture rooted in a throwaway dir — the real uploads tree is
 * never touched.
 */
import { TrekPhotoCacheMeta } from '../../../src/db/entities/TrekPhotoCacheMeta.entity';
import { TrekPhotoCacheService, CACHE_TTL } from '../../../src/nest/memories/trek-photo-cache.service';
import { StorageNotFoundError } from '../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const fx = makeStorageFixture('photos/trek/');
const testDb = createSnapshotTestDb();
let t: TestOrm;
let svc: TrekPhotoCacheService;
const CACHE_DIR = path.join(fx.root, 'photos/trek');
const binPath = (key: string) => path.join(CACHE_DIR, `${key}.bin`);
let counter = 0;

/** Unique per case so cases cannot collide on the shared fixture dir. */
function freshKey(label: string): string {
  return svc.cacheKey('test', `${label}-${counter++}`, 'thumbnail', 1);
}

beforeAll(async () => {
  t = await createTestOrm(testDb);
  svc = new TrekPhotoCacheService(t.repo(TrekPhotoCacheMeta), fx.storage);
});

beforeEach(async () => {
  await deleteRows(t, TrekPhotoCacheMeta);
});

afterAll(async () => {
  await t.close();
  testDb.close();
  fx.cleanup();
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
  it('CACHE-002: a stored entry comes back with its content type and a real object', async () => {
    const key = freshKey('hit');
    await svc.put(key, Buffer.from('jpegbytes'), 'image/jpeg');

    const entry = await svc.getFresh(key);
    expect(entry).not.toBeNull();
    expect(entry!.contentType).toBe('image/jpeg');
    expect(fs.readFileSync(binPath(key)).toString()).toBe('jpegbytes');
  });

  it('CACHE-003: an unknown key is a miss, not an error', async () => {
    expect(await svc.getFresh('no-such-key')).toBeNull();
  });

  it('CACHE-004: an entry past its TTL is a miss and its metadata row is dropped', async () => {
    const key = freshKey('stale');
    await svc.put(key, Buffer.from('old'), 'image/jpeg');
    await updateRows(t, TrekPhotoCacheMeta, { cache_key: key }, { fetched_at: Date.now() - CACHE_TTL - 1000 });

    expect(await svc.getFresh(key)).toBeNull();
    expect(await findRow(t, TrekPhotoCacheMeta, { cache_key: key })).toBeNull();
  });

  it('CACHE-005: metadata without its object is a miss and the row is dropped', async () => {
    const key = 'orphan-meta-row';
    await insertRow(t, TrekPhotoCacheMeta, { cache_key: key, content_type: 'image/jpeg', fetched_at: Date.now() });

    expect(await svc.getFresh(key)).toBeNull();
    expect(await findRow(t, TrekPhotoCacheMeta, { cache_key: key })).toBeNull();
  });

  it('CACHE-006: writing the same key twice replaces the bytes rather than duplicating the row', async () => {
    const key = freshKey('replace');
    await svc.put(key, Buffer.from('first'), 'image/jpeg');
    await svc.put(key, Buffer.from('second'), 'image/png');

    const rows = await findRows(t, TrekPhotoCacheMeta, { cache_key: key });
    expect(rows).toHaveLength(1);
    expect((await svc.getFresh(key))!.contentType).toBe('image/png');
    expect(fs.readFileSync(binPath(key)).toString()).toBe('second');
  });
});

describe('serveFresh', () => {
  it('CACHE-007: sends the cached bytes through storage with a one-hour cache header', async () => {
    const key = freshKey('serve');
    await svc.put(key, Buffer.from('bytes'), 'image/webp');
    const send = vi.spyOn(fx.storage, 'sendToResponse').mockResolvedValueOnce(undefined);
    const res = { set: vi.fn() };

    expect(await svc.serveFresh(res as never, key)).toBe(true);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/webp');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    expect(send).toHaveBeenCalledWith('photos-trek', `${key}.bin`, res);
    send.mockRestore();
  });

  it('CACHE-008: reports a miss without touching the response or storage', async () => {
    const send = vi.spyOn(fx.storage, 'sendToResponse');
    const res = { set: vi.fn() };
    expect(await svc.serveFresh(res as never, 'nothing-cached')).toBe(false);
    expect(res.set).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    send.mockRestore();
  });

  it('CACHE-013: a getFresh→send delete race reads as a miss, not a crash', async () => {
    const key = freshKey('race');
    await svc.put(key, Buffer.from('bytes'), 'image/webp');
    const send = vi
      .spyOn(fx.storage, 'sendToResponse')
      .mockRejectedValueOnce(new StorageNotFoundError(`photos/trek/${key}.bin`));
    const res = { set: vi.fn(), headersSent: false };

    expect(await svc.serveFresh(res as never, key)).toBe(false);
    send.mockRestore();
  });
});

describe('the stampede guard', () => {
  it("CACHE-009: a second caller gets the first caller's in-flight promise", async () => {
    const key = 'inflight-key';
    let resolveFetch!: (b: Buffer) => void;
    const fetch = new Promise<Buffer | null>((resolve) => {
      resolveFetch = resolve as (b: Buffer) => void;
    });

    svc.setInFlight(key, fetch);
    expect(svc.getInFlight(key)).toBe(fetch);

    resolveFetch(Buffer.from('done'));
    await fetch;
    // Settling clears the slot, so the next request starts a fresh fetch.
    await Promise.resolve();
    expect(await svc.getInFlight(key)).toBeUndefined();
  });

  it('CACHE-010: the map is shared across instances (module-scoped stampede guard)', () => {
    // Load-bearing: a per-instance map would hand any second instance a private
    // guard and the dedup would be silently gone. The sweep cron injects the
    // container singleton now, but the invariant stays pinned.
    const other = new TrekPhotoCacheService(t.repo(TrekPhotoCacheMeta), fx.storage);
    const promise = Promise.resolve<Buffer | null>(null);
    svc.setInFlight('shared-key', promise);
    expect(other.getInFlight('shared-key')).toBe(promise);
  });
});

describe('sweepExpired', () => {
  it('CACHE-011: drops rows and objects past twice the TTL and leaves fresh ones alone', async () => {
    const staleKey = freshKey('sweep-stale');
    const freshKeyId = freshKey('sweep-fresh');
    await svc.put(staleKey, Buffer.from('old'), 'image/jpeg');
    await svc.put(freshKeyId, Buffer.from('new'), 'image/jpeg');
    await updateRows(t, TrekPhotoCacheMeta, { cache_key: staleKey }, { fetched_at: Date.now() - CACHE_TTL * 2 - 1000 });

    await svc.sweepExpired();

    expect(await findRow(t, TrekPhotoCacheMeta, { cache_key: staleKey })).toBeNull();
    expect(fs.existsSync(binPath(staleKey))).toBe(false);
    expect(await findRow(t, TrekPhotoCacheMeta, { cache_key: freshKeyId })).not.toBeNull();
  });

  it('CACHE-012: survives a metadata row whose object is already gone', async () => {
    const key = 'sweep-orphan';
    await insertRow(t, TrekPhotoCacheMeta, {
      cache_key: key,
      content_type: 'image/jpeg',
      fetched_at: Date.now() - CACHE_TTL * 3,
    });

    await expect(svc.sweepExpired()).resolves.toBeUndefined();
    expect(await findRow(t, TrekPhotoCacheMeta, { cache_key: key })).toBeNull();
  });

  it('CACHE-014: reclaims a row-less .bin object past the cutoff (fix #4, spec rev 3.2)', async () => {
    // getFresh's expiry path deletes the meta row but never the object — the
    // list-driven pass 2 is what reclaims those leaks.
    const key = freshKey('rowless');
    await svc.put(key, Buffer.from('leaked'), 'image/jpeg');
    await deleteRows(t, TrekPhotoCacheMeta, { cache_key: key });
    const old = (Date.now() - CACHE_TTL * 3) / 1000;
    fs.utimesSync(binPath(key), old, old);

    await svc.sweepExpired();
    expect(fs.existsSync(binPath(key))).toBe(false);
  });

  it('CACHE-015: a row-less .bin younger than the cutoff survives (in-flight put guard)', async () => {
    const key = freshKey('rowless-fresh');
    await svc.put(key, Buffer.from('in-flight'), 'image/jpeg');
    await deleteRows(t, TrekPhotoCacheMeta, { cache_key: key });

    await svc.sweepExpired();
    expect(fs.existsSync(binPath(key))).toBe(true);
  });

  it('CACHE-016: nested and non-.bin entries are never touched by the sweep', async () => {
    const nestedDir = path.join(CACHE_DIR, 'sub');
    fs.mkdirSync(nestedDir, { recursive: true });
    const nested = path.join(nestedDir, 'nested.bin');
    fs.writeFileSync(nested, 'nested');
    const note = path.join(CACHE_DIR, 'note.txt');
    fs.writeFileSync(note, 'not a cache object');
    const old = (Date.now() - CACHE_TTL * 3) / 1000;
    fs.utimesSync(nested, old, old);
    fs.utimesSync(note, old, old);

    await svc.sweepExpired();
    expect(fs.existsSync(nested)).toBe(true);
    expect(fs.existsSync(note)).toBe(true);
  });
});
