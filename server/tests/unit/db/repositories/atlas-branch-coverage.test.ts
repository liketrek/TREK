/**
 * Atlas repositories — M3 branch ratchet (task-7-review.md). Plan 3f Task 1
 * added empty-array short-circuits and not-found/no-op ternaries across
 * these repositories with no test exercising the empty/no-op arm. One
 * seeded world per repository (shared `testDb`, reset between tests).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createUser } from '../../../helpers/factories';
import { createTestPlaceRegionsRepo, createTestVisitedCountriesRepo, createTestBucketListRepo } from '../../../helpers/atlas-repos';
import { createTestReservationEndpointsRepo } from '../../../helpers/test-uow';
import { createTestSchoolHolidayCountriesRepo } from '../../../helpers/school-holidays-repos';

const testDb = createSnapshotTestDb();
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

describe('PlaceRegionsRepository — empty-array short-circuits (AT3/AT28/AT23)', () => {
  it('listCountryCodesForPlaceIds/listForPlaceIds/listDistinctRegionCodesForCountryAndPlaces all return [] for an empty id list, without querying', async () => {
    const repo = await createTestPlaceRegionsRepo(testDb);
    expect(await repo.listCountryCodesForPlaceIds([])).toEqual([]);
    expect(await repo.listForPlaceIds([])).toEqual([]);
    expect(await repo.listDistinctRegionCodesForCountryAndPlaces('FR', [])).toEqual([]);
  });
});

describe('VisitedCountriesRepository.markVisited — the ON CONFLICT DO NOTHING return (AT12)', () => {
  it('returns false on a repeat mark (no row actually inserted the second time), true on the first', async () => {
    const repo = await createTestVisitedCountriesRepo(testDb);
    const { user } = createUser(testDb);
    expect(await repo.markVisited(user.id, 'FR', 'manual')).toBe(true);
    expect(await repo.markVisited(user.id, 'FR', 'manual')).toBe(false);
  });
});

describe('ReservationEndpointsRepository.listOwnedEndpointsForTrips — empty-array short-circuit (AT6)', () => {
  it('returns [] for an empty tripIds list, without querying', async () => {
    const repo = await createTestReservationEndpointsRepo(testDb);
    const { user } = createUser(testDb);
    expect(await repo.listOwnedEndpointsForTrips([], user.id)).toEqual([]);
  });
});

describe('BucketListRepository.update — the no-op empty-patch branch (AT35)', () => {
  it('an empty write leaves the row untouched', async () => {
    const repo = await createTestBucketListRepo(testDb);
    const { user } = createUser(testDb);
    const id = await repo.insertItem({ user_id: user.id, name: 'Kyoto', lat: null, lng: null, country_code: null, notes: null, target_date: null, region_code: null });

    await repo.update(id, user.id, {});

    const row = await repo.findById(id);
    expect(row?.name).toBe('Kyoto');
  });
});

// Folded in for the aggregate `src/db/repositories/**` gate (task-7-review.md
// M3: "the 3e-carried lines belong to 3e's own ratchet but block CI all the
// same. Fold them in, or name the owner.") — the same ON CONFLICT DO NOTHING
// affected-row-count pattern as VisitedCountriesRepository.markVisited above.
describe('SchoolHolidayCountriesRepository.insertIgnore — the ON CONFLICT DO NOTHING return', () => {
  it('returns false on a repeat insert of the same code, true on the first', async () => {
    const repo = await createTestSchoolHolidayCountriesRepo(testDb);
    expect(await repo.insertIgnore({ code: 'US', name: 'United States' })).toBe(true);
    expect(await repo.insertIgnore({ code: 'US', name: 'United States' })).toBe(false);
  });
});
