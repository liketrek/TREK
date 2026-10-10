/**
 * `RoadtripPreferencesRepository` (Plan 3d Task 1). RPF1 (`listForTrip`) and
 * RPF3 (`upsertValue`, `ON CONFLICT(trip_id, key) DO UPDATE SET value =
 * excluded.value`).
 */
import { RoadtripPreferences } from '../../../../src/db/entities/RoadtripPreferences.entity';
import type { RoadtripPreferencesRepository } from '../../../../src/db/repositories/RoadtripPreferences.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: RoadtripPreferencesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(RoadtripPreferences);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('RoadtripPreferencesRepository', () => {
  it('RPF1REPO-001: listForTrip is empty for a trip with no saved preferences', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await repo.listForTrip(trip.id)).toEqual([]);
  });

  it('UPSERTPREFREPO-001: upsertValue inserts a fresh (trip, key) pair', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await repo.upsertValue(trip.id, 'roadtrip_range_km', '100');
    expect(await repo.listForTrip(trip.id)).toEqual([{ key: 'roadtrip_range_km', value: '100' }]);
  });

  it('UPSERTPREFREPO-002: re-upserting the SAME (trip, key) replaces the value in place — one row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await repo.upsertValue(trip.id, 'roadtrip_range_km', '100');
    await repo.upsertValue(trip.id, 'roadtrip_range_km', '250');
    const rows = await repo.listForTrip(trip.id);
    expect(rows).toEqual([{ key: 'roadtrip_range_km', value: '250' }]);
  });

  it('UPSERTPREFREPO-003: two different keys on the same trip coexist as two rows', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await repo.upsertValue(trip.id, 'roadtrip_range_km', '100');
    await repo.upsertValue(trip.id, 'roadtrip_vehicle', '"electric"');
    const rows = await repo.listForTrip(trip.id);
    expect(rows.map((r) => r.key).sort()).toEqual(['roadtrip_range_km', 'roadtrip_vehicle']);
  });

  it('UPSERTPREFREPO-004: the same key on two different trips is two independent rows', async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id);
    const tripB = createTrip(testDb, user.id);
    await repo.upsertValue(tripA.id, 'roadtrip_range_km', '100');
    await repo.upsertValue(tripB.id, 'roadtrip_range_km', '999');
    expect(await repo.listForTrip(tripA.id)).toEqual([{ key: 'roadtrip_range_km', value: '100' }]);
    expect(await repo.listForTrip(tripB.id)).toEqual([{ key: 'roadtrip_range_km', value: '999' }]);
  });
});
