/**
 * `TripAddonOverridesRepository`: a trip's own on or off for a trip addon.
 * Seeded and read through the ORM factories on the migrated snapshot, whose
 * seeded addon rows (packing, budget, tours, ...) the foreign key points at.
 */
import { TripAddonOverrides } from '../../../../src/db/entities/TripAddonOverrides.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import type { TripAddonOverridesRepository } from '../../../../src/db/repositories/TripAddonOverrides.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, findRow } from '../../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TripAddonOverridesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TripAddonOverrides);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function ownerAndTrip() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  return { user, trip };
}

describe('TripAddonOverridesRepository', () => {
  it('TAOREPO-001: a trip without choices lists nothing and follows the instance for every addon', async () => {
    const { trip } = await ownerAndTrip();
    expect(await repo.listForTrip(trip.id)).toEqual([]);
    expect(await repo.findForTrip(trip.id, 'budget')).toBeNull();
  });

  it('TAOREPO-002: upsertOverride writes on and off as booleans and replaces an earlier choice in place', async () => {
    const { trip } = await ownerAndTrip();
    await repo.upsertOverride(trip.id, 'budget', false);
    await repo.upsertOverride(trip.id, 'packing', true);
    expect(await repo.findForTrip(trip.id, 'budget')).toBe(false);
    expect(await repo.findForTrip(trip.id, 'packing')).toBe(true);

    await repo.upsertOverride(trip.id, 'budget', true);
    expect(await repo.listForTrip(trip.id)).toEqual([
      { addon_id: 'budget', enabled: true },
      { addon_id: 'packing', enabled: true },
    ]);
    expect(await countRows(t, TripAddonOverrides, { trip: trip.id })).toBe(2);
    const row = await findRow(t, TripAddonOverrides, { trip: trip.id, addon: 'budget' });
    expect(row?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('TAOREPO-003: deleteOverride drops one choice and leaves the others', async () => {
    const { trip } = await ownerAndTrip();
    await repo.upsertOverride(trip.id, 'budget', false);
    await repo.upsertOverride(trip.id, 'tours', true);
    await repo.deleteOverride(trip.id, 'budget');
    expect(await repo.listForTrip(trip.id)).toEqual([{ addon_id: 'tours', enabled: true }]);
    await repo.deleteOverride(trip.id, 'budget');
    expect(await repo.listForTrip(trip.id)).toEqual([{ addon_id: 'tours', enabled: true }]);
  });

  it('TAOREPO-004: the choices of one trip never show on another', async () => {
    const { user, trip } = await ownerAndTrip();
    const other = await makeTrip(t, user.id);
    await repo.upsertOverride(trip.id, 'budget', false);
    expect(await repo.listForTrip(other.id)).toEqual([]);
    expect(await repo.findForTrip(other.id, 'budget')).toBeNull();
  });

  it('TAOREPO-005: copyForTrip gives the new trip the same choices and leaves the source alone', async () => {
    const { user, trip } = await ownerAndTrip();
    const copy = await makeTrip(t, user.id);
    await repo.upsertOverride(trip.id, 'budget', false);
    await repo.upsertOverride(trip.id, 'roadtrip', true);

    await repo.copyForTrip(trip.id, copy.id);
    await repo.copyForTrip(trip.id, copy.id);

    const expected = [
      { addon_id: 'budget', enabled: false },
      { addon_id: 'roadtrip', enabled: true },
    ];
    expect(await repo.listForTrip(copy.id)).toEqual(expected);
    expect(await repo.listForTrip(trip.id)).toEqual(expected);
  });

  it('TAOREPO-006: copyForTrip of a trip without choices copies nothing', async () => {
    const { user, trip } = await ownerAndTrip();
    const copy = await makeTrip(t, user.id);
    await repo.copyForTrip(trip.id, copy.id);
    expect(await repo.listForTrip(copy.id)).toEqual([]);
  });

  it('TAOREPO-007: anyEnabledForUser sees a trip the user owns or belongs to that switched the addon on', async () => {
    const { user: owner, trip } = await ownerAndTrip();
    const { user: member } = await makeUser(t);
    const { user: stranger } = await makeUser(t);
    await addTripMember(t, trip.id, member.id, owner.id);

    expect(await repo.anyEnabledForUser(owner.id, 'roadtrip')).toBe(false);
    await repo.upsertOverride(trip.id, 'roadtrip', true);
    expect(await repo.anyEnabledForUser(owner.id, 'roadtrip')).toBe(true);
    expect(await repo.anyEnabledForUser(member.id, 'roadtrip')).toBe(true);
    expect(await repo.anyEnabledForUser(stranger.id, 'roadtrip')).toBe(false);
    expect(await repo.anyEnabledForUser(owner.id, 'tours')).toBe(false);
  });

  it('TAOREPO-008: a trip that switched the addon off counts for nobody', async () => {
    const { user, trip } = await ownerAndTrip();
    await repo.upsertOverride(trip.id, 'roadtrip', false);
    expect(await repo.anyEnabledForUser(user.id, 'roadtrip')).toBe(false);
  });

  it('TAOREPO-009: the choices go with their trip', async () => {
    const { trip } = await ownerAndTrip();
    await repo.upsertOverride(trip.id, 'budget', false);
    await deleteRows(t, Trips, { id: trip.id });
    expect(await countRows(t, TripAddonOverrides, { trip: trip.id })).toBe(0);
  });
});
