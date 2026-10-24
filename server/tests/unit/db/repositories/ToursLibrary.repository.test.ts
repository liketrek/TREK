/**
 * `ToursRepository`, the library reads of LIB-02: the tours of the trips a
 * user may see (TL1), how many each trip holds (TL2), and one of them for its
 * preview (TL3). Every read is bounded by the trips handed in.
 */
import { Tours } from '../../../../src/db/entities/Tours.entity';
import type { ToursRepository } from '../../../../src/db/repositories/Tours.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { addTourWaypoints, makeTour } from '../../../helpers/factories/tours';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: ToursRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(Tours);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** Two trips of one user, Alps with a hike and a paddle tour, Coast with one hike, and a third trip nobody asks about. */
async function library() {
  const { user } = await makeUser(t);
  const alps = await makeTrip(t, user.id, { title: 'Alps' });
  const coast = await makeTrip(t, user.id, { title: 'Coast' });
  const hidden = await makeTrip(t, user.id, { title: 'Hidden' });
  const ridge = await makePlace(t, alps.id, { name: 'Ridge', description: 'Up high' });
  const lake = await makePlace(t, alps.id, { name: 'Lake' });
  const cliffs = await makePlace(t, coast.id, { name: 'Cliffs', route_geometry: '[[47,11],[47.1,11.1]]' });
  const secret = await makePlace(t, hidden.id, { name: 'Secret' });
  await makeTour(t, ridge.id, { distance: 8, max_hiking_difficulty: 3, created_at: '2026-01-01 10:00:00' });
  await makeTour(t, lake.id, {
    tourTypeRef: 'kayak',
    boat_type: 'canoe',
    water_context: 'lake',
    created_at: '2026-01-02 10:00:00',
  });
  await makeTour(t, cliffs.id, { distance: 5, created_at: '2026-01-03 10:00:00' });
  await makeTour(t, secret.id);
  await addTourWaypoints(t, cliffs.id, [
    { lat: 47, lng: 11 },
    { lat: 47.05, lng: 11.05 },
    { lat: 47.1, lng: 11.1 },
  ]);
  return { alps, coast, hidden, ridge, lake, cliffs, secret };
}

describe('ToursRepository library reads (LIB-02)', () => {
  it('TL1-001: lists the tours of the trips handed in, newest trip and tour first, with the trip they are in', async () => {
    const { alps, coast, ridge, lake, cliffs } = await library();
    const rows = await repo.listForLibrary([alps.id, coast.id], {}, 50);
    expect(rows.map((row) => [row.name, row.trip_title])).toEqual([
      ['Cliffs', 'Coast'],
      ['Lake', 'Alps'],
      ['Ridge', 'Alps'],
    ]);
    expect(rows[0]).toMatchObject({
      place_id: cliffs.id,
      tour_type: 'hike',
      distance: 5,
      has_waypoints: 1,
      origin: 'trek',
    });
    expect(rows.find((row) => row.place_id === ridge.id)).toMatchObject({
      description: 'Up high',
      max_hiking_difficulty: 3,
      has_waypoints: 0,
    });
    expect(rows.find((row) => row.place_id === lake.id)?.tour_type).toBe('kayak');
  });

  it('TL1-002: narrows by trip and by type, keeps to its limit, and answers nothing for no trips', async () => {
    const { alps, coast } = await library();
    expect((await repo.listForLibrary([alps.id, coast.id], { trip_id: alps.id }, 50)).map((row) => row.name)).toEqual([
      'Lake',
      'Ridge',
    ]);
    expect((await repo.listForLibrary([alps.id, coast.id], { tour_type: 'kayak' }, 50)).map((row) => row.name)).toEqual(
      ['Lake'],
    );
    expect(await repo.listForLibrary([alps.id, coast.id], {}, 1)).toHaveLength(1);
    expect(await repo.listForLibrary([], {}, 50)).toEqual([]);
  });

  it('TL1-003: a trip filter outside the trips handed in finds nothing', async () => {
    const { alps, hidden } = await library();
    expect(await repo.listForLibrary([alps.id], { trip_id: hidden.id }, 50)).toEqual([]);
  });

  it('TL2-001: counts the tours of each trip handed in, newest trip first, and nothing for no trips', async () => {
    const { alps, coast } = await library();
    expect(await repo.countForLibrary([alps.id, coast.id])).toEqual([
      { id: coast.id, title: 'Coast', tour_count: 1 },
      { id: alps.id, title: 'Alps', tour_count: 2 },
    ]);
    expect(await repo.countForLibrary([])).toEqual([]);
  });

  it('TL3-001: reads one tour with its line and how many control points it has, only within the trips handed in', async () => {
    const { alps, coast, cliffs, ridge, secret } = await library();
    expect(await repo.findForLibrary([alps.id, coast.id], cliffs.id)).toMatchObject({
      place_id: cliffs.id,
      trip_title: 'Coast',
      route_geometry: '[[47,11],[47.1,11.1]]',
      waypoint_count: 3,
      has_waypoints: 1,
    });
    expect(await repo.findForLibrary([alps.id], ridge.id)).toMatchObject({ waypoint_count: 0, has_waypoints: 0 });
    expect(await repo.findForLibrary([alps.id, coast.id], secret.id)).toBeUndefined();
    expect(await repo.findForLibrary([], cliffs.id)).toBeUndefined();
  });
});
