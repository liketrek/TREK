/**
 * TripsService.copy and a tour's packing link (P2D-XD-01): the copied tour
 * points at the same packing list or category of the copied trip, whose
 * packing list is copied too, and the source keeps its own link.
 *
 * Real in-memory SQLite over the container: the service comes out of
 * TripsModule, and the rows are seeded and read through the ORM factories.
 */
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourPackingLinks } from '../../../src/db/entities/TourPackingLinks.entity';
import { TripsModule } from '../../../src/nest/trips/trips.module';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePackingItem } from '../../helpers/factories/packing';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { linkTourPacking, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: TripsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TripsModule] });
  svc = t.get(TripsService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

describe('copy: a tour pointing at its packing list (P2D-XD-01)', () => {
  it('TRIP-SVC-096: the copied tour points at the same category of the copied list; a tour without a link gets none', async () => {
    const { user } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id, { title: 'Alps' });
    const hike = await makePlace(orm(), trip.id, { name: 'Ridge' });
    await makeTour(orm(), hike.id);
    const walk = await makePlace(orm(), trip.id, { name: 'Old town' });
    await makeTour(orm(), walk.id, { tourTypeRef: 'walk' });
    await makePackingItem(orm(), trip.id, { name: 'Boots', category: 'Hiking gear' });
    await linkTourPacking(orm(), hike.id, 'Hiking gear', user.id);

    const newTripId = await svc.copy(trip.id, user.id, 'Alps again');

    const copiedHike = await findRow(orm(), Places, { trip: newTripId, name: 'Ridge' });
    const copiedWalk = await findRow(orm(), Places, { trip: newTripId, name: 'Old town' });
    expect(await findRow(orm(), TourPackingLinks, { place: copiedHike?.id })).toMatchObject({
      category: 'Hiking gear',
    });
    expect(await countRows(orm(), TourPackingLinks, { place: copiedWalk?.id })).toBe(0);
    expect(await countRows(orm(), PackingItems, { trip: newTripId, category: 'Hiking gear' })).toBe(1);
    // The source keeps its own link.
    expect(await findRow(orm(), TourPackingLinks, { place: hike.id })).toMatchObject({ category: 'Hiking gear' });
  });
});
