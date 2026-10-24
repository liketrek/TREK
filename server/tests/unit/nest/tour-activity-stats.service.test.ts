/**
 * TourActivityStatsService (STA-02): the user's own tour activities across
 * every trip they can open, and leaving one out of them. The service comes out
 * of ToursModule over a snapshot test db; rows are seeded through the ORM
 * factories.
 */
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { TourActivityExclusions } from '../../../src/db/entities/TourActivityExclusions.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { TourActivityStatsService } from '../../../src/nest/tours/tour-activity-stats.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, makeTourActivity } from '../../helpers/factories/tours';
import { addTripMember, makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let service: TourActivityStatsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  service = t.get(TourActivityStatsService);
});
beforeEach(() => resetTestDb(db));
afterAll(async () => {
  await t.close();
  db.close();
});

const RECORDED = JSON.stringify([
  [47, 11, 600],
  [47.01, 11.005, 760],
  [47.02, 11, 880],
]);

/**
 * The user's trip with a hike on a day and a paddle tour recorded on another;
 * a trip of a friend the user is a member of, with one tour whose day names
 * only the friend, one naming only the user and one naming nobody, which is
 * everyone's; and a trip the user cannot open.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const { user: friend } = await makeUser(orm());
  const { user: stranger } = await makeUser(orm());

  const trip = await makeTrip(orm(), user.id, { title: 'Alps' });
  const day1 = await makeDay(orm(), trip.id, { date: '2026-07-02' });
  const day2 = await makeDay(orm(), trip.id, { date: '2026-07-03' });
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), hike.id, { distance: 12.5, elevation_gain: 800, elevation_loss: 790 });
  await makeDayAssignment(orm(), day1.id, hike.id);
  const paddle = await makePlace(orm(), trip.id, { name: 'Lake' });
  await makeTour(orm(), paddle.id, { tourTypeRef: 'kayak', distance: 9 });
  const onDay2 = await makeDayAssignment(orm(), day2.id, paddle.id);
  const watch = await makePlace(orm(), trip.id, { name: 'Watch export', route_geometry: RECORDED });
  await makeTour(orm(), watch.id, { origin: 'gpx' });
  await makeTourActivity(orm(), paddle.id, watch.id, { assignment: onDay2.id });
  const idle = await makePlace(orm(), trip.id, { name: 'Idle' });
  await makeTour(orm(), idle.id);

  const theirs = await makeTrip(orm(), friend.id, { title: 'Theirs' });
  await addTripMember(orm(), theirs.id, user.id);
  const theirDay = await makeDay(orm(), theirs.id, { date: '2026-08-10' });
  const alone = await makePlace(orm(), theirs.id, { name: 'Alone' });
  await makeTour(orm(), alone.id, { distance: 30 });
  const aloneOn = await makeDayAssignment(orm(), theirDay.id, alone.id);
  await insertRow(orm(), AssignmentParticipants, { assignment: aloneOn.id, user: friend.id });
  const everyone = await makePlace(orm(), theirs.id, { name: 'Everyone' });
  await makeTour(orm(), everyone.id, { distance: 5 });
  await makeDayAssignment(orm(), theirDay.id, everyone.id);
  const together = await makePlace(orm(), theirs.id, { name: 'Together' });
  await makeTour(orm(), together.id, { distance: 7 });
  const togetherOn = await makeDayAssignment(orm(), theirDay.id, together.id);
  await insertRow(orm(), AssignmentParticipants, { assignment: togetherOn.id, user: user.id });

  const closed = await makeTrip(orm(), stranger.id);
  const closedDay = await makeDay(orm(), closed.id, { date: '2026-07-01' });
  const hidden = await makePlace(orm(), closed.id, { name: 'Hidden' });
  await makeTour(orm(), hidden.id);
  await makeDayAssignment(orm(), closedDay.id, hidden.id);
  return { user, friend, hike, paddle, watch, alone, everyone, together, togetherOn, hidden };
}

describe('TourActivityStatsService', () => {
  it('STA2-SVC-001: lists the own tours of every trip the user can open, plan or recording, newest first', async () => {
    const { user, hike, paddle, watch, everyone, together } = await fixture();
    const result = await service.stats(user.id);
    expect(result.entries.map((entry) => [entry.place_id, entry.basis, entry.date])).toEqual([
      [everyone.id, 'plan', '2026-08-10'],
      [together.id, 'plan', '2026-08-10'],
      [paddle.id, 'track', '2026-07-03'],
      [hike.id, 'plan', '2026-07-02'],
    ]);
    expect(result.entries[2]).toMatchObject({
      tour_type: 'kayak',
      trip: { title: 'Alps' },
      track: { place_id: watch.id, name: 'Watch export' },
      ascent_m: null,
      descent_m: null,
    });
    expect(result.entries[2]?.distance_km).toBeCloseTo(2.35, 1);
    expect(result.uncounted).toEqual({ unassigned: 1, undated: 0 });
  });

  it('STA2-SVC-002: the friend sees their own and everyone’s tours, and not the user’s trip they cannot open', async () => {
    const { friend, alone, everyone, together } = await fixture();
    const result = await service.stats(friend.id);
    // Together names only the user, so it is not the friend's, owner or not.
    expect(result.entries.map((entry) => entry.place_id)).toEqual([alone.id, everyone.id]);
    expect(result.entries.some((entry) => entry.place_id === together.id)).toBe(false);
  });

  it('STA2-SVC-003: leaving a tour out keeps it listed, flagged; counting it again clears the flag', async () => {
    const { user, hike } = await fixture();
    const left = await service.setExcluded(user.id, { place_id: hike.id, excluded: true });
    expect(left.entries.find((entry) => entry.place_id === hike.id)?.excluded).toBe(true);
    expect(await findRow(orm(), Tours, { place: hike.id })).toMatchObject({ distance: 12.5 });
    const back = await service.setExcluded(user.id, { place_id: hike.id, excluded: false });
    expect(back.entries.find((entry) => entry.place_id === hike.id)?.excluded).toBe(false);
    expect(await countRows(orm(), TourActivityExclusions, {})).toBe(0);
  });

  it('STA2-SVC-004: a tour of a trip the user cannot open reads as missing and nothing is written', async () => {
    const { user, hidden } = await fixture();
    await expect(service.setExcluded(user.id, { place_id: hidden.id, excluded: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.setExcluded(user.id, { place_id: 999_999, excluded: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(await countRows(orm(), TourActivityExclusions, {})).toBe(0);
  });

  it('STA2-SVC-005: one user leaving a tour out changes nobody else’s list', async () => {
    const { user, friend, together, togetherOn } = await fixture();
    await insertRow(orm(), AssignmentParticipants, { assignment: togetherOn.id, user: friend.id });
    await service.setExcluded(user.id, { place_id: together.id, excluded: true });
    const friends = await service.stats(friend.id);
    expect(friends.entries.find((entry) => entry.place_id === together.id)?.excluded).toBe(false);
  });

  it('STA2-SVC-006: a user without trips has nothing to count', async () => {
    const { user } = await makeUser(orm());
    expect(await service.stats(user.id)).toEqual({ entries: [], uncounted: { unassigned: 0, undated: 0 } });
  });

  it('STA2-SVC-007: a multi-day tour with a stage on no day is not counted on the days of its other stages (MDT-02)', async () => {
    const { user } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id, { title: 'Hut to hut' });
    const first = await makeDay(orm(), trip.id, { date: '2026-07-02' });
    const second = await makeDay(orm(), trip.id, { date: '2026-07-03' });
    const route = await makePlace(orm(), trip.id, { name: 'Three huts' });
    await makeTour(orm(), route.id, { distance: 40 });
    await addTourWaypoints(orm(), route.id, [
      { lat: 47, lng: 11, station_key: 'start' },
      { lat: 47.1, lng: 11, station_key: 'hut-1', stage_end: 1 },
      { lat: 47.2, lng: 11, station_key: 'hut-2', stage_end: 1 },
      { lat: 47.3, lng: 11, station_key: 'end' },
    ]);
    await makeDayAssignment(orm(), first.id, route.id, { tour_stage_key: 'start' });
    await makeDayAssignment(orm(), second.id, route.id, { tour_stage_key: 'hut-1' });
    const partly = await service.stats(user.id);
    expect(partly.entries).toEqual([]);
    expect(partly.uncounted).toEqual({ unassigned: 1, undated: 0 });

    const third = await makeDay(orm(), trip.id, { date: '2026-07-04' });
    await makeDayAssignment(orm(), third.id, route.id, { tour_stage_key: 'hut-2' });
    const whole = await service.stats(user.id);
    expect(whole.entries).toMatchObject([{ place_id: route.id, basis: 'plan', date: '2026-07-04', distance_km: 40 }]);
  });
});
