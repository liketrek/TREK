/**
 * `TourActivitiesRepository` (ACT-01): the recordings assigned to the tours
 * of a trip. Seeded through the ORM factories over the migrated snapshot
 * schema; every read is held to one trip through both tours' places.
 */
import { DayAssignments } from '../../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { TourActivities } from '../../../../src/db/entities/TourActivities.entity';
import type { TourActivitiesRepository } from '../../../../src/db/repositories/TourActivities.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeDayAssignment } from '../../../helpers/factories/itinerary';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../../../helpers/factories/rows';
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

/** A planned hike on two days, two GPX recordings, and a tour with a recording of its own in another trip. */
async function fixture() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const day1 = await makeDay(t, trip.id, { day_number: 1 });
  const day2 = await makeDay(t, trip.id, { day_number: 2 });
  const hike = await makePlace(t, trip.id, { name: 'Ridge' });
  await makeTour(t, hike.id);
  const onDay1 = await makeDayAssignment(t, day1.id, hike.id);
  const onDay2 = await makeDayAssignment(t, day2.id, hike.id);
  const watch = await makePlace(t, trip.id, { name: 'Watch export', route_geometry: LINE });
  await makeTour(t, watch.id, {
    origin: 'gpx',
    origin_file_name: 'morning.gpx',
    track_started_at: '2026-07-02 06:10:00',
    track_ended_at: '2026-07-02 08:10:00',
  });
  const phone = await makePlace(t, trip.id, { name: 'Phone export', route_geometry: LINE });
  await makeTour(t, phone.id, { origin: 'gpx' });

  const other = await makeTrip(t, user.id);
  const elsewhere = await makePlace(t, other.id, { name: 'Elsewhere' });
  await makeTour(t, elsewhere.id);
  const elsewhereTrack = await makePlace(t, other.id, { name: 'Elsewhere track' });
  await makeTour(t, elsewhereTrack.id, { origin: 'gpx' });
  await makeTourActivity(t, elsewhere.id, elsewhereTrack.id);
  return { user, trip, day1, hike, onDay1, onDay2, watch, phone, other, elsewhere, elsewhereTrack };
}

describe('TourActivitiesRepository', () => {
  it('ACT-REPO-001: insertActivity writes an assignment and listForPlace reads it with its recording and day', async () => {
    const { user, trip, day1, hike, onDay1, watch } = await fixture();
    const id = await repo.insertActivity({
      place_id: hike.id,
      track_place_id: watch.id,
      assignment_id: onDay1.id,
      assigned_by: user.id,
    });
    const [row, ...rest] = await repo.listForPlace(trip.id, hike.id);
    expect(rest).toEqual([]);
    expect(row).toMatchObject({
      id,
      place_id: hike.id,
      track_place_id: watch.id,
      assignment_id: onDay1.id,
      day_id: day1.id,
      track_name: 'Watch export',
      track_origin: 'gpx',
      track_file_name: 'morning.gpx',
      track_route_geometry: LINE,
      track_recorded_route_geometry: null,
      track_started_at: '2026-07-02 06:10:00',
      track_ended_at: '2026-07-02 08:10:00',
    });
    expect(row?.assigned_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(row?.track_created_at).toBeTruthy();
    expect(await findRow(t, TourActivities, { id })).toMatchObject({ assigned_by: user.id });
  });

  it('ACT-REPO-002: listForPlace stays inside the trip, and an assignment without a day has none', async () => {
    const { trip, hike, watch, other, elsewhere } = await fixture();
    await makeTourActivity(t, hike.id, watch.id);
    expect((await repo.listForPlace(trip.id, hike.id)).map((row) => row.day_id)).toEqual([null]);
    expect(await repo.listForPlace(other.id, hike.id)).toEqual([]);
    expect(await repo.listForPlace(trip.id, elsewhere.id)).toEqual([]);
  });

  it('ACT-REPO-003: listForTrip lists the trip’s assignments only, oldest first', async () => {
    const { trip, hike, onDay2, watch, phone } = await fixture();
    const first = await makeTourActivity(t, hike.id, watch.id);
    const second = await makeTourActivity(t, hike.id, phone.id, { assignment: onDay2.id });
    expect(await repo.listForTrip(trip.id)).toEqual([
      { id: first.id, place_id: hike.id, track_place_id: watch.id, assignment_id: null },
      { id: second.id, place_id: hike.id, track_place_id: phone.id, assignment_id: onDay2.id },
    ]);
  });

  it('ACT-REPO-004: findByTrack and hasActivities answer for one recording and one tour', async () => {
    const { hike, watch, phone } = await fixture();
    const activity = await makeTourActivity(t, hike.id, watch.id);
    expect(await repo.findByTrack(watch.id)).toEqual({
      id: activity.id,
      place_id: hike.id,
      track_place_id: watch.id,
      assignment_id: null,
    });
    expect(await repo.findByTrack(phone.id)).toBeUndefined();
    expect(await repo.hasActivities(hike.id)).toBe(true);
    expect(await repo.hasActivities(watch.id)).toBe(false);
  });

  it('ACT-REPO-005: clearFor removes the execution’s recording and the recording’s other execution, nothing else', async () => {
    const { trip, hike, onDay1, onDay2, watch, phone, elsewhere } = await fixture();
    await makeTourActivity(t, hike.id, watch.id, { assignment: onDay1.id });
    await makeTourActivity(t, hike.id, phone.id, { assignment: onDay2.id });

    // Day 1 gets the phone export: day 1's watch export goes, and so does the phone export's day 2.
    await repo.clearFor(hike.id, phone.id, onDay1.id);
    expect(await repo.listForPlace(trip.id, hike.id)).toEqual([]);

    await makeTourActivity(t, hike.id, watch.id);
    await makeTourActivity(t, hike.id, phone.id, { assignment: onDay2.id });
    // No day: only the assignment without a day goes.
    await repo.clearFor(hike.id, 999_999, null);
    expect((await repo.listForPlace(trip.id, hike.id)).map((row) => row.track_place_id)).toEqual([phone.id]);
    expect(await repo.hasActivities(elsewhere.id)).toBe(true);
  });

  it('ACT-REPO-006: removeFromPlace removes one assignment of that tour only', async () => {
    const { hike, watch, elsewhere } = await fixture();
    const activity = await makeTourActivity(t, hike.id, watch.id);
    expect(await repo.removeFromPlace(elsewhere.id, activity.id)).toBe(false);
    expect(await repo.removeFromPlace(hike.id, activity.id)).toBe(true);
    expect(await repo.removeFromPlace(hike.id, activity.id)).toBe(false);
  });

  it('ACT-REPO-007: taking the tour off a day keeps the recording without its day; deleting a tour takes it along', async () => {
    const { trip, hike, onDay1, watch, phone } = await fixture();
    await makeTourActivity(t, hike.id, watch.id, { assignment: onDay1.id });
    await makeTourActivity(t, hike.id, phone.id);

    await deleteRows(t, DayAssignments, { id: onDay1.id });
    expect((await repo.listForPlace(trip.id, hike.id)).map((row) => row.assignment_id)).toEqual([null, null]);

    await deleteRows(t, Places, { id: watch.id });
    expect(await countRows(t, TourActivities, { place: hike.id })).toBe(1);
  });

  it('ACT-REPO-008: a day removed beside a track without a day leaves two without one, and linking one to no day replaces both', async () => {
    const { trip, hike, onDay1, watch, phone } = await fixture();
    await makeTourActivity(t, hike.id, watch.id, { assignment: onDay1.id });
    await makeTourActivity(t, hike.id, phone.id);
    await deleteRows(t, DayAssignments, { id: onDay1.id });
    expect(await repo.listForPlace(trip.id, hike.id)).toHaveLength(2);

    // The link dialog names both as replaced, and the server clears both.
    await repo.clearFor(hike.id, 999_999, null);
    expect(await repo.listForPlace(trip.id, hike.id)).toEqual([]);
  });
});
