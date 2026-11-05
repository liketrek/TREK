/**
 * PlaceFieldOriginRepository: where each shareable field of a place got its
 * value, the place's shareable columns the origin tracking compares, and the
 * cached provider answers it checks a typed value against.
 */
import { PlaceDetailsCache } from '../../../../src/db/entities/PlaceDetailsCache.entity';
import { PlaceFieldOrigin } from '../../../../src/db/entities/PlaceFieldOrigin.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import type { PlaceFieldOriginRepository } from '../../../../src/db/repositories/PlaceFieldOrigin.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../../helpers/factories';
import { insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let origins: PlaceFieldOriginRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  origins = t.repo(PlaceFieldOrigin);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const AT = '2026-10-30 10:00:00';

/** A place named Café Luna, with the shareable columns given (the factory sets only a few). */
async function aPlace(columns: Partial<Record<'website' | 'phone' | 'osm_id', string>> = {}): Promise<number> {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const { id } = createPlace(testDb, trip.id, { name: 'Café Luna' });
  if (Object.keys(columns).length > 0) await updateRows(t, Places, { id }, columns);
  return id;
}

describe('PlaceFieldOriginRepository', () => {
  it("PFOREPO-001: reads a place's shareable values, one or many, and null for a place that is gone", async () => {
    const one = await aPlace({ website: 'https://cafe-luna.de', osm_id: 'node/1' });
    const two = await aPlace({ phone: '+49 381 1' });
    expect(await origins.placeValues(one)).toEqual(
      expect.objectContaining({ id: one, name: 'Café Luna', website: 'https://cafe-luna.de', osm_id: 'node/1' }),
    );
    expect(await origins.placeValues(999_999)).toBeNull();
    expect(await origins.placeValuesMany([])).toEqual([]);
    const many = await origins.placeValuesMany([one, two]);
    expect(many.map((row) => row.id).sort()).toEqual([one, two].sort());
  });

  it('PFOREPO-002: an origin written again replaces the old one; an empty list writes nothing', async () => {
    const placeId = await aPlace();
    await origins.upsertOrigins([]);
    expect(await origins.originsOf(placeId)).toEqual([]);
    await origins.upsertOrigins([
      { place_id: placeId, field: 'website', origin: 'google', value_hash: 'h1', updated_at: AT },
      { place_id: placeId, field: 'phone', origin: 'user', value_hash: 'h2', updated_at: AT },
    ]);
    await origins.upsertOrigins([
      { place_id: placeId, field: 'website', origin: 'user', value_hash: 'h3', updated_at: AT },
    ]);
    expect(await origins.originsOf(placeId)).toEqual(
      expect.arrayContaining([
        { field: 'website', origin: 'user', value_hash: 'h3' },
        { field: 'phone', origin: 'user', value_hash: 'h2' },
      ]),
    );
  });

  it('PFOREPO-003: deletes the named fields of one place only', async () => {
    const one = await aPlace();
    const two = await aPlace();
    await origins.upsertOrigins([
      { place_id: one, field: 'website', origin: 'user', value_hash: 'h1', updated_at: AT },
      { place_id: two, field: 'website', origin: 'user', value_hash: 'h1', updated_at: AT },
    ]);
    expect(await origins.deleteOrigins(one, [])).toBe(0);
    expect(await origins.deleteOrigins(one, ['website'])).toBe(1);
    expect(await origins.originsOf(one)).toEqual([]);
    expect(await origins.originsOf(two)).toHaveLength(1);
  });

  it('PFOREPO-004: the cached provider answers of the ids asked for, none for an empty list', async () => {
    await insertRow(t, PlaceDetailsCache, {
      place_id: 'gers-1',
      lang: 'en',
      expanded: 0,
      payload_json: JSON.stringify({ website: 'https://cafe-luna.de' }),
      fetched_at: Date.now(),
    });
    expect(await origins.cachedProviderPayloads([])).toEqual([]);
    expect(await origins.cachedProviderPayloads(['gers-1', 'gers-2'])).toEqual([
      { place_id: 'gers-1', expanded: 0, payload_json: JSON.stringify({ website: 'https://cafe-luna.de' }) },
    ]);
  });
});
