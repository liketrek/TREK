/**
 * `TourStationVisitsRepository` (CW-03): how far a city walk got on its days,
 * per day assignment and station key. Seeded through the ORM factories over
 * the migrated snapshot schema.
 */
import { DayAssignments } from '../../../../src/db/entities/DayAssignments.entity';
import { TourStationVisits } from '../../../../src/db/entities/TourStationVisits.entity';
import type { TourStationVisitsRepository } from '../../../../src/db/repositories/TourStationVisits.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeDayAssignment } from '../../../helpers/factories/itinerary';
import { makePlace } from '../../../helpers/factories/places';
import { deleteRows, findRows } from '../../../helpers/factories/rows';
import { makeTour, markStationVisit } from '../../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourStationVisitsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourStationVisits);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** Trip A with a walk on days 1 and 2 and a plain place on day 1; trip B with a walk of its own on its day. */
async function fixture() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const day1 = await makeDay(t, trip.id, { day_number: 1 });
  const day2 = await makeDay(t, trip.id, { day_number: 2 });
  const walk = await makePlace(t, trip.id, { name: 'Old town' });
  await makeTour(t, walk.id, { tourTypeRef: 'walk' });
  const cafe = await makePlace(t, trip.id, { name: 'Cafe' });
  const onDay1 = await makeDayAssignment(t, day1.id, walk.id);
  const onDay2 = await makeDayAssignment(t, day2.id, walk.id);
  await makeDayAssignment(t, day1.id, cafe.id);

  const other = await makeTrip(t, user.id);
  const otherDay = await makeDay(t, other.id, { day_number: 1 });
  const otherWalk = await makePlace(t, other.id, { name: 'Harbour' });
  await makeTour(t, otherWalk.id, { tourTypeRef: 'walk' });
  const foreign = await makeDayAssignment(t, otherDay.id, otherWalk.id);
  return { trip, day1, day2, walk, cafe, onDay1, onDay2, other, otherDay, otherWalk, foreign };
}

describe('TourStationVisitsRepository', () => {
  it('TSVREPO-001: assignmentInTrip names the place and day of an assignment of the trip, nothing across trips', async () => {
    const { trip, day1, walk, onDay1, foreign } = await fixture();
    expect(await repo.assignmentInTrip(onDay1.id, trip.id)).toEqual({ place_id: walk.id, day_id: day1.id });
    expect(await repo.assignmentInTrip(foreign.id, trip.id)).toBeUndefined();
    expect(await repo.assignmentInTrip(999_999, trip.id)).toBeUndefined();
  });

  it('TSVREPO-002: assignmentOnDay finds the walk on that day of that trip, and the first of two on one day', async () => {
    const { trip, day1, day2, walk, cafe, onDay1, onDay2, other, otherDay } = await fixture();
    expect(await repo.assignmentOnDay(trip.id, walk.id, day1.id)).toBe(onDay1.id);
    expect(await repo.assignmentOnDay(trip.id, walk.id, day2.id)).toBe(onDay2.id);
    expect(await repo.assignmentOnDay(other.id, walk.id, day1.id)).toBeUndefined();
    expect(await repo.assignmentOnDay(trip.id, walk.id, otherDay.id)).toBeUndefined();
    expect(await repo.assignmentOnDay(trip.id, cafe.id, day2.id)).toBeUndefined();

    // A second assignment on day 2 placed first in the day keeps the first one found by id.
    await makeDayAssignment(t, day2.id, walk.id, { order_index: -1 });
    expect(await repo.assignmentOnDay(trip.id, walk.id, day2.id)).toBe(onDay2.id);
  });

  it('TSVREPO-003: set marks a station, and a second set replaces its status on the same row', async () => {
    const { onDay1 } = await fixture();
    await repo.set(onDay1.id, 'stop-b', 'visited');
    await repo.set(onDay1.id, 'stop-a', 'skipped');
    expect(await repo.listForAssignment(onDay1.id)).toEqual([
      { assignment_id: onDay1.id, station_key: 'stop-a', status: 'skipped' },
      { assignment_id: onDay1.id, station_key: 'stop-b', status: 'visited' },
    ]);

    await repo.set(onDay1.id, 'stop-a', 'visited');
    const rows = await findRows(t, TourStationVisits, { assignment: onDay1.id }, { station_key: 'asc' });
    expect(rows.map((row) => [row.station_key, row.status])).toEqual([
      ['stop-a', 'visited'],
      ['stop-b', 'visited'],
    ]);
    expect(rows[0]?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('TSVREPO-004: clear takes back only that station on that day', async () => {
    const { onDay1, onDay2 } = await fixture();
    await markStationVisit(t, onDay1.id, 'stop-a', 'visited');
    await markStationVisit(t, onDay1.id, 'stop-b', 'skipped');
    await markStationVisit(t, onDay2.id, 'stop-a', 'visited');

    await repo.clear(onDay1.id, 'stop-a');
    expect(await repo.listForAssignment(onDay1.id)).toEqual([
      { assignment_id: onDay1.id, station_key: 'stop-b', status: 'skipped' },
    ]);
    expect(await repo.listForAssignment(onDay2.id)).toEqual([
      { assignment_id: onDay2.id, station_key: 'stop-a', status: 'visited' },
    ]);
  });

  it('TSVREPO-005: listForTrip lists every visit of the trip by assignment and key, none of another trip', async () => {
    const { trip, onDay1, onDay2, foreign } = await fixture();
    await markStationVisit(t, onDay2.id, 'stop-a', 'skipped');
    await markStationVisit(t, onDay1.id, 'stop-b', 'visited');
    await markStationVisit(t, onDay1.id, 'stop-a', 'visited');
    await markStationVisit(t, foreign.id, 'stop-a', 'visited');

    expect(await repo.listForTrip(trip.id)).toEqual([
      { assignment_id: onDay1.id, station_key: 'stop-a', status: 'visited' },
      { assignment_id: onDay1.id, station_key: 'stop-b', status: 'visited' },
      { assignment_id: onDay2.id, station_key: 'stop-a', status: 'skipped' },
    ]);
  });

  it('TSVREPO-008: listForPlace lists the visits of one walk on all its days with the day, none of another walk or trip', async () => {
    const { trip, day1, day2, walk, onDay1, onDay2, other, otherWalk, foreign } = await fixture();
    await markStationVisit(t, onDay2.id, 'stop-a', 'skipped');
    await markStationVisit(t, onDay1.id, 'stop-b', 'visited');
    await markStationVisit(t, onDay1.id, 'stop-a', 'visited');
    await markStationVisit(t, foreign.id, 'stop-a', 'visited');

    expect(await repo.listForPlace(trip.id, walk.id)).toEqual([
      { day_id: day1.id, assignment_id: onDay1.id, station_key: 'stop-a', status: 'visited' },
      { day_id: day1.id, assignment_id: onDay1.id, station_key: 'stop-b', status: 'visited' },
      { day_id: day2.id, assignment_id: onDay2.id, station_key: 'stop-a', status: 'skipped' },
    ]);
    expect(await repo.listForPlace(other.id, walk.id)).toEqual([]);
    expect(await repo.listForPlace(trip.id, otherWalk.id)).toEqual([]);
  });

  it('TSVREPO-006:dropStationsNotIn keeps the named stations on every day, drops the rest, leaves other walks alone and names the days', async () => {
    const { walk, onDay1, onDay2, foreign } = await fixture();
    await markStationVisit(t, onDay1.id, 'stop-a', 'visited');
    await markStationVisit(t, onDay1.id, 'stop-b', 'visited');
    await markStationVisit(t, onDay2.id, 'stop-a', 'skipped');
    await markStationVisit(t, onDay2.id, 'stop-b', 'visited');
    await markStationVisit(t, foreign.id, 'stop-b', 'visited');

    expect(await repo.dropStationsNotIn(walk.id, ['stop-a'])).toEqual([onDay1.id, onDay2.id].sort((a, b) => a - b));
    expect((await repo.listForAssignment(onDay1.id)).map((v) => v.station_key)).toEqual(['stop-a']);
    expect((await repo.listForAssignment(onDay2.id)).map((v) => v.station_key)).toEqual(['stop-a']);
    expect(await repo.dropStationsNotIn(walk.id, ['stop-a'])).toEqual([]);

    await markStationVisit(t, onDay2.id, 'stop-c', 'skipped');
    expect(await repo.dropStationsNotIn(walk.id, [])).toEqual([onDay1.id, onDay2.id].sort((a, b) => a - b));
    expect(await repo.listForAssignment(onDay1.id)).toEqual([]);
    expect(await repo.listForAssignment(onDay2.id)).toEqual([]);
    expect(await repo.listForAssignment(foreign.id)).toEqual([
      { assignment_id: foreign.id, station_key: 'stop-b', status: 'visited' },
    ]);
  });

  it('TSVREPO-007: a removed day assignment takes its visits with it', async () => {
    const { onDay1, onDay2 } = await fixture();
    await markStationVisit(t, onDay1.id, 'stop-a', 'visited');
    await markStationVisit(t, onDay2.id, 'stop-a', 'visited');

    await deleteRows(t, DayAssignments, { id: onDay1.id });
    expect(await repo.listForAssignment(onDay1.id)).toEqual([]);
    expect(await repo.listForAssignment(onDay2.id)).toHaveLength(1);
  });
});
