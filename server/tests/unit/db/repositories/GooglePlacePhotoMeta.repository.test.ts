/**
 * GooglePlacePhotoMetaRepository (Plan 3c Task 1, PP1–PP5/PP7/PP8): every
 * statement `PlacePhotoCacheService` used to issue raw, on real rows.
 * `place_id` is a TEXT key — pseudo-ids like `coords:lat:lng` are legal
 * values, exercised below alongside real Google place ids.
 */
import { GooglePlacePhotoMeta } from '../../../../src/db/entities/GooglePlacePhotoMeta.entity';
import type { GooglePlacePhotoMetaRepository } from '../../../../src/db/repositories/GooglePlacePhotoMeta.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let meta: GooglePlacePhotoMetaRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  meta = t.repo(GooglePlacePhotoMeta);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawRow(placeId: string): unknown {
  return testDb.prepare('SELECT * FROM google_place_photo_meta WHERE place_id = ?').get(placeId);
}

describe('GooglePlacePhotoMetaRepository.findLive / findErrored', () => {
  it('GPPMREPO-001: findLive returns the attribution only when error_at is NULL', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, ?, ?, NULL)',
      )
      .run('p1', 'Some Author', 1000);
    expect(await meta.findLive('p1')).toEqual({ attribution: 'Some Author' });
  });

  it('GPPMREPO-002: findLive returns null when error_at is set, even with an attribution present', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, ?)',
      )
      .run('p1', 1000, 2000);
    expect(await meta.findLive('p1')).toBeNull();
  });

  it('GPPMREPO-003: findLive returns null for a missing row', async () => {
    expect(await meta.findLive('missing')).toBeNull();
  });

  it('GPPMREPO-004: works with coords:lat:lng pseudo-ids (TEXT key, colons and dots included)', async () => {
    const pseudoId = 'coords:48.8566:2.3522';
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, NULL)',
      )
      .run(pseudoId, 1000);
    expect(await meta.findLive(pseudoId)).toEqual({ attribution: null });
  });

  it('GPPMREPO-005: findErrored returns {error_at} only when error_at IS NOT NULL', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, ?)',
      )
      .run('p1', 1000, 5000);
    expect(await meta.findErrored('p1')).toEqual({ error_at: 5000 });
  });

  it('GPPMREPO-006: findErrored returns null when error_at is NULL', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, ?, ?, NULL)',
      )
      .run('p1', 'A', 1000);
    expect(await meta.findErrored('p1')).toBeNull();
  });
});

describe('GooglePlacePhotoMetaRepository.deleteByPlaceId', () => {
  it('GPPMREPO-007: deletes the row for the given place_id', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, NULL)',
      )
      .run('p1', 1000);
    await meta.deleteByPlaceId('p1');
    expect(rawRow('p1')).toBeUndefined();
  });

  it('GPPMREPO-008: deleting a missing place_id does not throw', async () => {
    await expect(meta.deleteByPlaceId('never-existed')).resolves.toBeUndefined();
  });
});

describe('GooglePlacePhotoMetaRepository.upsertError / upsertPhoto — INSERT OR REPLACE parity', () => {
  it('GPPMREPO-009: upsertError writes NULL attribution and matching fetched_at/error_at on a fresh row', async () => {
    await meta.upsertError('p1', 12345);
    expect(rawRow('p1')).toMatchObject({ place_id: 'p1', attribution: null, fetched_at: 12345, error_at: 12345 });
  });

  it('GPPMREPO-010: upsertPhoto writes the attribution with a NULL error_at on a fresh row', async () => {
    await meta.upsertPhoto('p1', 'Some Author · CC BY 2.0', 999);
    expect(rawRow('p1')).toMatchObject({
      place_id: 'p1',
      attribution: 'Some Author · CC BY 2.0',
      fetched_at: 999,
      error_at: null,
    });
  });

  // PP4 forces attribution NULL; PP5 forces error_at NULL — same PK, mirror
  // images. Writes PE3-style twice then a third time, asserting the exact
  // row after each (Task 1 brief's explicit test requirement).
  it('GPPMREPO-011: put then markError then put again — each call overwrites the row exactly (INSERT OR REPLACE semantics via em.upsert merge)', async () => {
    await meta.upsertPhoto('p1', 'Author A', 100);
    expect(rawRow('p1')).toMatchObject({ attribution: 'Author A', fetched_at: 100, error_at: null });

    await meta.upsertError('p1', 200);
    expect(rawRow('p1')).toMatchObject({ attribution: null, fetched_at: 200, error_at: 200 });

    await meta.upsertPhoto('p1', 'Author B', 300);
    expect(rawRow('p1')).toMatchObject({ attribution: 'Author B', fetched_at: 300, error_at: null });

    // Only one row exists for this PK throughout — no duplicate insert.
    expect(testDb.prepare('SELECT COUNT(*) as c FROM google_place_photo_meta WHERE place_id = ?').get('p1')).toEqual({
      c: 1,
    });
  });
});

describe('GooglePlacePhotoMetaRepository.listPlaceIds', () => {
  it('GPPMREPO-012: lists every place_id, full table scan', async () => {
    testDb.prepare('INSERT INTO google_place_photo_meta (place_id, fetched_at) VALUES (?, ?)').run('p1', 1);
    testDb.prepare('INSERT INTO google_place_photo_meta (place_id, fetched_at) VALUES (?, ?)').run('p2', 2);
    expect((await meta.listPlaceIds()).sort()).toEqual(['p1', 'p2']);
  });

  it('GPPMREPO-013: an empty table yields an empty array', async () => {
    expect(await meta.listPlaceIds()).toEqual([]);
  });
});

// Task 9 fix wave (B-M3): relabelled. `findLive`/`findErrored` are
// `findOne`-based, but their filter is `{ place_id, error_at: null }` /
// `{ place_id, error_at: { $ne: null } }` — the PK plus a second condition,
// not a PK-only lookup, so rule 20's D-shape guarantee does not apply (a
// non-PK-only `findOne` always re-runs its WHERE against the live table).
describe('GooglePlacePhotoMetaRepository — fresh after a raw UPDATE', () => {
  it('GPPMREPO-014 (fresh after a raw UPDATE, not D-shape): a raw write after an unrelated identity-map read is visible in the next findLive call, in one query (disableIdentityMap regression)', async () => {
    testDb
      .prepare(
        'INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, ?, ?, NULL)',
      )
      .run('p1', 'Old', 1000);
    // The FIRST, wider setup read passes `disableIdentityMap: false`
    // explicitly and carries the column the later write targets
    // (`attribution`) — a PK-only `findOne` on `place_id` alone (not
    // `findLive`'s own `error_at IS NULL`-narrowed filter under test).
    await t.repo(GooglePlacePhotoMeta).findOne({ place_id: 'p1' }, { disableIdentityMap: false });
    testDb.prepare('UPDATE google_place_photo_meta SET attribution = ? WHERE place_id = ?').run('New', 'p1');

    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      expect(await meta.findLive('p1')).toEqual({ attribution: 'New' });
      expect(spy.mock.calls.length).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
