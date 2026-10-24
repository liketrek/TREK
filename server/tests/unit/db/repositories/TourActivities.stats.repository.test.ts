/**
 * `TourActivitiesRepository`, the STA-02 reads: every tour of the trips the
 * user can open, once per day it is on, with the day's date, the trip's owner
 * and who the day names as taking part; and the recordings assigned to them
 * with their lines. Seeded through the ORM factories over the migrated
 * snapshot schema.
 */
import { AssignmentParticipants } from '../../../../src/db/entities/AssignmentParticipants.entity';
import { TourActivities } from '../../../../src/db/entities/TourActivities.entity';
import type { TourActivitiesRepository } from '../../../../src/db/repositories/TourActivities.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeDayAssignment } from '../../../helpers/factories/itinerary';
import { makePlace } from '../../../helpers/factories/places';
import { insertRow } from '../../../helpers/factories/rows';
import { makeTour, makeTourActivity } from '../../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourActivitiesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourActivities);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
]);

/** A hike on a dated day with a friend named on it, a tour on no day, a recording, and a trip of somebody else. */
async function fixture() {
  const { user } = await makeUser(t);
  const { user: friend } = await makeUser(t);
  const trip = await makeTrip(t, user.id, { title: 'Alps' });
  const day = await makeDay(t, trip.id, { date: '2026-07-02' });
  const undated = await makeDay(t, trip.id);
  const hike = await makePlace(t, trip.id, { name: 'Ridge' });
  await makeTour(t, hike.id, { distance: 12.5, elevation_gain: 800, elevation_loss: 790 });
  const onDay = await makeDayAssignment(t, day.id, hike.id);
  const onUndated = await makeDayAssignment(t, undated.id, hike.id);
  await insertRow(t, AssignmentParticipants, { assignment: onDay.id, user: friend.id });
  const idle = await makePlace(t, trip.id, { name: 'Idle' });
  await makeTour(t, idle.id);
  const watch = await makePlace(t, trip.id, { name: 'Watch export', route_geometry: LINE });
  await makeTour(t, watch.id, { origin: 'gpx' });

  const theirs = await makeTrip(t, friend.id, { title: 'Theirs' });
  const theirTour = await makePlace(t, theirs.id, { name: 'Their tour' });
  await makeTour(t, theirTour.id);
  return { user, friend, trip, day, hike, onDay, onUndated, idle, watch, theirs, theirTour };
}

describe('TourActivitiesRepository stats reads (STA-02)', () => {
  it('STA2-REPO-010: lists each tour once per day it is on, once without a day, with the day and the trip', async () => {
    const { user, friend, trip, hike, onDay, onUndated, idle, watch } = await fixture();
    const rows = await repo.listExecutionsForStats([trip.id], user.id);
    expect(rows.map((row) => [row.place_id, row.assignment_id, row.date])).toEqual([
      [hike.id, onDay.id, '2026-07-02'],
      [hike.id, onUndated.id, null],
      [idle.id, null, null],
      [watch.id, null, null],
    ]);
    expect(rows[0]).toMatchObject({
      name: 'Ridge',
      tour_type: 'hike',
      distance: 12.5,
      elevation_gain: 800,
      elevation_loss: 790,
      derived_from_place_id: null,
      trip_id: trip.id,
      trip_title: 'Alps',
      tour_stage_key: null,
      participant_count: 1,
      joined: 0,
    });
    expect(rows[1]).toMatchObject({ participant_count: 0, joined: 0 });
    const asFriend = await repo.listExecutionsForStats([trip.id], friend.id);
    expect(asFriend[0]).toMatchObject({ participant_count: 1, joined: 1 });
  });

  it('STA2-REPO-011: never reaches a trip outside the ids given, and reads nothing for none', async () => {
    const { user, trip, theirs, theirTour } = await fixture();
    const rows = await repo.listExecutionsForStats([trip.id], user.id);
    expect(rows.some((row) => row.place_id === theirTour.id)).toBe(false);
    expect((await repo.listExecutionsForStats([theirs.id], user.id)).map((row) => row.place_id)).toEqual([
      theirTour.id,
    ]);
    expect(await repo.listExecutionsForStats([], user.id)).toEqual([]);
  });

  it('STA2-REPO-012: a day of another trip gives no date', async () => {
    const { user, trip, theirs, idle } = await fixture();
    const foreignDay = await makeDay(t, theirs.id, { date: '2026-08-01' });
    await makeDayAssignment(t, foreignDay.id, idle.id);
    const rows = await repo.listExecutionsForStats([trip.id], user.id);
    expect(rows.filter((row) => row.place_id === idle.id).map((row) => row.date)).toEqual([null]);
  });

  it('STA2-REPO-013: lists the recordings of the trips with the lines they were recorded with', async () => {
    const { trip, hike, onDay, watch, theirs } = await fixture();
    await makeTourActivity(t, hike.id, watch.id, { assignment: onDay.id });
    expect(await repo.listTracksForStats([trip.id])).toEqual([
      {
        place_id: hike.id,
        track_place_id: watch.id,
        assignment_id: onDay.id,
        track_name: 'Watch export',
        track_route_geometry: LINE,
        track_recorded_route_geometry: null,
      },
    ]);
    expect(await repo.listTracksForStats([theirs.id])).toEqual([]);
    expect(await repo.listTracksForStats([])).toEqual([]);
  });

  it('STA2-REPO-014: names the stage a day holds of a multi-day tour, and none for a day that holds the whole tour', async () => {
    const { user, trip, day, hike, onDay } = await fixture();
    const onStage = await makeDayAssignment(t, day.id, hike.id, { tour_stage_key: 'hut-1' });
    const rows = await repo.listExecutionsForStats([trip.id], user.id);
    expect(rows.find((row) => row.assignment_id === onStage.id)?.tour_stage_key).toBe('hut-1');
    expect(rows.find((row) => row.assignment_id === onDay.id)?.tour_stage_key).toBeNull();
  });
});
