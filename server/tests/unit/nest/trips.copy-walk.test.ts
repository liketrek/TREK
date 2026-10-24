/**
 * TripsService.copy and a city walk (CW-03): the copied walk keeps the keys
 * of its stations, and its days start with nothing checked off.
 *
 * Real in-memory SQLite over the container: the service comes out of
 * TripsModule, and the rows are seeded and read through the ORM factories.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourStationVisits } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { TripsModule } from '../../../src/nest/trips/trips.module';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { makeTrip, readTripDays } from '../../helpers/factories/trips';
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

describe('copy: a city walk (CW-03)', () => {
  it('TRIP-SVC-095: a copied city walk keeps the keys of its stations, and its days have no visits', async () => {
    const { user } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id, {
      title: 'City days',
      start_date: '2025-07-01',
      end_date: '2025-07-01',
    });
    const [day] = await readTripDays(orm(), trip.id);
    const walk = await makePlace(orm(), trip.id, { name: 'Old town' });
    await makeTour(orm(), walk.id, { tourTypeRef: 'walk' });
    await addTourWaypoints(orm(), walk.id, [
      { lat: 48.1, lng: 11.5, station_key: 'stop-cathedral', name: 'Cathedral', stay_minutes: 30 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-market', importance: 'must', protected: 1 },
    ]);
    const assignment = await makeDayAssignment(orm(), day.id, walk.id);
    await markStationVisit(orm(), assignment.id, 'stop-cathedral', 'visited');

    const newTripId = await svc.copy(trip.id, user.id, 'City days again');

    const copiedWalk = await findRow(orm(), Places, { trip: newTripId, name: 'Old town' });
    const points = await findRows(orm(), TourWaypoints, { place: copiedWalk?.id }, { sequence: 'asc' });
    expect(
      points.map((point) => [point.station_key, point.name, point.stay_minutes, point.importance, point.protected]),
    ).toEqual([
      ['stop-cathedral', 'Cathedral', 30, null, 0],
      ['stop-market', null, null, 'must', 1],
    ]);
    const copiedAssignments = await findRows(orm(), DayAssignments, { place: copiedWalk?.id });
    expect(copiedAssignments).toHaveLength(1);
    expect(await countRows(orm(), TourStationVisits, { assignment: copiedAssignments[0]?.id })).toBe(0);
    // The source keeps what it checked off.
    expect(await countRows(orm(), TourStationVisits, { assignment: assignment.id })).toBe(1);
  });
});
