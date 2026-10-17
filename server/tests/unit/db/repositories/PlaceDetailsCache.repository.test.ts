/**
 * PlaceDetailsCacheRepository (Plan 3c Task 1, PE2/PE3): the two statements
 * `PlaceEnrichmentService` used to issue raw, on real rows. The table's real
 * PRIMARY KEY is the composite `(place_id, lang, expanded)` — the parity
 * proof below writes the same triple twice and asserts exactly one row.
 */
import { PlaceDetailsCache } from '../../../../src/db/entities/PlaceDetailsCache.entity';
import type { PlaceDetailsCacheRepository } from '../../../../src/db/repositories/PlaceDetailsCache.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let cache: PlaceDetailsCacheRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  cache = t.repo(PlaceDetailsCache);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawRow(placeId: string, lang: string, expanded: number) {
  return findRow(t, PlaceDetailsCache, { place_id: placeId, lang, expanded });
}

function seedEntry(placeId: string, lang: string, expanded: number, payloadJson: string, fetchedAt: number) {
  return insertRow(t, PlaceDetailsCache, {
    place_id: placeId,
    lang,
    expanded,
    payload_json: payloadJson,
    fetched_at: fetchedAt,
  });
}

describe('PlaceDetailsCacheRepository.findEntry', () => {
  it('PDCREPO-001: finds the entry for the exact (place_id, lang, expanded) triple', async () => {
    await seedEntry('p1', 'en', 0, '{"a":1}', 1000);
    expect(await cache.findEntry('p1', 'en', 0)).toEqual({ payload_json: '{"a":1}', fetched_at: 1000 });
  });

  it('PDCREPO-002: a different lang or expanded value is a miss, not a fuzzy match', async () => {
    await seedEntry('p1', 'en', 0, '{"a":1}', 1000);
    expect(await cache.findEntry('p1', 'fr', 0)).toBeNull();
    expect(await cache.findEntry('p1', 'en', 2)).toBeNull();
  });

  it('PDCREPO-003: an empty-string lang (the "no lang requested" default) is its own distinct row', async () => {
    await seedEntry('p1', '', 2, '{"b":2}', 2000);
    expect(await cache.findEntry('p1', '', 2)).toEqual({ payload_json: '{"b":2}', fetched_at: 2000 });
    expect(await cache.findEntry('p1', 'en', 2)).toBeNull();
  });

  it('PDCREPO-004: a missing entry resolves to null', async () => {
    expect(await cache.findEntry('missing', '', 0)).toBeNull();
  });
});

describe('PlaceDetailsCacheRepository.upsertEntry — composite-key INSERT OR REPLACE parity', () => {
  it('PDCREPO-005: writes a fresh row for a new (place_id, lang, expanded) triple', async () => {
    await cache.upsertEntry({ place_id: 'p1', lang: '', expanded: 2, payload_json: '{"v":1}', fetched_at: 100 });
    expect(await rawRow('p1', '', 2)).toMatchObject({ payload_json: '{"v":1}', fetched_at: 100 });
  });

  // The composite-key proof the Task 1 brief requires: writes the SAME
  // triple twice and asserts exactly ONE row survives (proving
  // `onConflictFields: ['place_id', 'lang', 'expanded']` is the real
  // conflict target, not an inferred single-column PK that would silently
  // insert a duplicate).
  it('PDCREPO-006: writing the same (place_id, lang, expanded) triple twice leaves exactly one row, with the second payload', async () => {
    await cache.upsertEntry({ place_id: 'p1', lang: 'en', expanded: 2, payload_json: '{"v":1}', fetched_at: 100 });
    await cache.upsertEntry({ place_id: 'p1', lang: 'en', expanded: 2, payload_json: '{"v":2}', fetched_at: 200 });

    const rows = await findRows(t, PlaceDetailsCache, { place_id: 'p1', lang: 'en', expanded: 2 });
    expect(rows).toHaveLength(1);
    expect(await rawRow('p1', 'en', 2)).toMatchObject({ payload_json: '{"v":2}', fetched_at: 200 });
  });

  it('PDCREPO-007: a different lang or expanded value for the same place_id is a SEPARATE row, not overwritten', async () => {
    await cache.upsertEntry({
      place_id: 'p1',
      lang: 'en',
      expanded: 0,
      payload_json: '{"kind":"details"}',
      fetched_at: 100,
    });
    await cache.upsertEntry({
      place_id: 'p1',
      lang: 'en',
      expanded: 2,
      payload_json: '{"kind":"enrichment"}',
      fetched_at: 200,
    });
    await cache.upsertEntry({
      place_id: 'p1',
      lang: 'fr',
      expanded: 2,
      payload_json: '{"kind":"enrichment-fr"}',
      fetched_at: 300,
    });

    const rows = await findRows(t, PlaceDetailsCache, { place_id: 'p1' }, { lang: 'asc', expanded: 'asc' });
    expect(rows).toHaveLength(3);
  });
});

// D-shape (Task 1 brief item): `findEntry` is `findOne`-based
// (`TrekRepository`'s `disableIdentityMap: true` default), filtered solely
// on the table's real composite PRIMARY KEY (`place_id`, `lang`, `expanded`)
// — a PK-only `findOne`, the class rule 20/21 targets directly.
describe('PlaceDetailsCacheRepository — D-shape', () => {
  it('PDCREPO-008 (D-shape): a raw write after an unrelated identity-map read is visible in the next findEntry call, in one query (disableIdentityMap regression)', async () => {
    await seedEntry('p1', 'en', 2, '{"v":"old"}', 100);
    // Task 9 fix wave (B-M3): rule 20 requires the FIRST, wider setup read to
    // opt out of the base default explicitly, SEPARATE from the method under
    // test — `findEntry` itself always uses the base's own
    // `disableIdentityMap: true` default, so calling it here could never
    // populate an entry for the later assertion to prove stale (the D-shape
    // claim would be vacuous, the same class of gap rule 20 exists to close).
    await t.repo(PlaceDetailsCache).findOne({ place_id: 'p1', lang: 'en', expanded: 2 }, { disableIdentityMap: false });
    await updateRows(
      t,
      PlaceDetailsCache,
      { place_id: 'p1', lang: 'en', expanded: 2 },
      { payload_json: '{"v":"new"}', fetched_at: 200 },
    );

    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      expect(await cache.findEntry('p1', 'en', 2)).toEqual({ payload_json: '{"v":"new"}', fetched_at: 200 });
      expect(spy.mock.calls.length).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
