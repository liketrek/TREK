/**
 * `TourPackingLinksRepository` (P2D-XD-01): the packing list, or the category
 * of it, a tour points at. Seeded through the ORM factories over the migrated
 * snapshot schema.
 */
import { PackingItems } from '../../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { TourPackingLinks } from '../../../../src/db/entities/TourPackingLinks.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { TourPackingLinksRepository } from '../../../../src/db/repositories/TourPackingLinks.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePackingItem } from '../../../helpers/factories/packing';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, deleteRows, findRow, updateRows } from '../../../helpers/factories/rows';
import { linkTourPacking, makeTour } from '../../../helpers/factories/tours';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourPackingLinksRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourPackingLinks);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** A trip with a hike and a packing item, the user who links and a second tour that points at nothing. */
async function fixture() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const hike = await makePlace(t, trip.id, { name: 'Ridge' });
  await makeTour(t, hike.id);
  const walk = await makePlace(t, trip.id, { name: 'Old town' });
  await makeTour(t, walk.id, { tourTypeRef: 'walk' });
  const item = await makePackingItem(t, trip.id, { name: 'Boots', category: 'Hiking gear' });
  return { user, trip, hike, walk, item };
}

describe('TourPackingLinksRepository', () => {
  it('TPLREPO-001: a tour without a link reads as undefined', async () => {
    const { hike } = await fixture();
    expect(await repo.findForTour(hike.id)).toBeUndefined();
  });

  it('TPLREPO-002: put points the tour at a category, or at the whole list with null', async () => {
    const { user, hike, walk } = await fixture();
    await repo.put(hike.id, 'Hiking gear', user.id);
    await repo.put(walk.id, null, user.id);
    expect(await repo.findForTour(hike.id)).toEqual({ category: 'Hiking gear', linked_at: expect.any(String) });
    expect(await repo.findForTour(walk.id)).toEqual({ category: null, linked_at: expect.any(String) });
    expect((await findRow(t, TourPackingLinks, { place: hike.id }))?.linked_by).toBe(user.id);
  });

  it('TPLREPO-003: a second put replaces what the tour pointed at, on the same row, with a new time', async () => {
    const { user, hike } = await fixture();
    const { user: other } = await makeUser(t);
    await repo.put(hike.id, 'Hiking gear', user.id);
    await updateRows(t, TourPackingLinks, { place: hike.id }, { linked_at: '2020-01-01 00:00:00' });

    await repo.put(hike.id, null, other.id);
    const row = await findRow(t, TourPackingLinks, { place: hike.id });
    expect(row).toMatchObject({ category: null, linked_by: other.id });
    expect(row?.linked_at).not.toBe('2020-01-01 00:00:00');
    expect(await countRows(t, TourPackingLinks)).toBe(1);
  });

  it('TPLREPO-004: remove lets go of the link and says whether there was one, and leaves the packing items alone', async () => {
    const { user, hike, walk } = await fixture();
    await repo.put(hike.id, 'Hiking gear', user.id);
    expect(await repo.remove(hike.id)).toBe(true);
    expect(await repo.remove(hike.id)).toBe(false);
    expect(await repo.remove(walk.id)).toBe(false);
    expect(await repo.findForTour(hike.id)).toBeUndefined();
    expect(await countRows(t, PackingItems)).toBe(1);
  });

  it('TPLREPO-005: the link goes with its tour, and turns its author unknown when that account goes', async () => {
    const { user, hike, walk } = await fixture();
    const { user: linker } = await makeUser(t);
    await linkTourPacking(t, hike.id, 'Hiking gear', user.id);
    await linkTourPacking(t, walk.id, null, linker.id);

    await deleteRows(t, Users, { id: linker.id });
    const kept = await findRow(t, TourPackingLinks, { place: walk.id });
    expect(kept?.category).toBeNull();
    expect(kept?.linked_by ?? null).toBeNull();

    await deleteRows(t, Places, { id: hike.id });
    expect(await repo.findForTour(hike.id)).toBeUndefined();
    expect(await repo.findForTour(walk.id)).toEqual({ category: null, linked_at: expect.any(String) });
  });
});
