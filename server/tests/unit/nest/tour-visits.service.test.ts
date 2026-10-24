/**
 * TourVisitsService (CW-03, CW-09): the stations of a city walk checked off on
 * one of its days, and how far the walk got on a day as an assistant reads it.
 * The service comes out of ToursModule over a snapshot test db; rows are
 * seeded through the ORM factories and broadcasts go to a FakeRealtimeService.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourStationVisits } from '../../../src/db/entities/TourStationVisits.entity';
import { TourVisitsService, type WalkOnDay, type WalkProgress } from '../../../src/nest/tours/tour-visits.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let visits: TourVisitsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  visits = t.get(TourVisitsService);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockClear();
});
afterAll(async () => {
  await t.close();
  db.close();
});

/**
 * A trip with a city walk on days 1 and 2: a must-see cathedral that stands
 * for the museum, a shaping point, a market passed through, a point saved
 * before keys and a park. A hike and a plain cafe are on day 1 too; day 3
 * holds nothing. Another trip has its own walk on its own day.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const day1 = await makeDay(orm(), trip.id, { day_number: 1 });
  const day2 = await makeDay(orm(), trip.id, { day_number: 2 });
  const day3 = await makeDay(orm(), trip.id, { day_number: 3 });
  const museum = await makePlace(orm(), trip.id, { name: 'Museum' });
  const walk = await makePlace(orm(), trip.id, { name: 'Old town' });
  await makeTour(orm(), walk.id, { tourTypeRef: 'walk', duration: 95 });
  await addTourWaypoints(orm(), walk.id, [
    {
      lat: 48.1,
      lng: 11.5,
      station_key: 'stop-cathedral',
      name: 'Cathedral',
      stay_minutes: 30,
      importance: 'must',
      protected: 1,
      linkedPlace: museum.id,
    },
    { lat: 48.105, lng: 11.505, station_key: 'shape-1', shaping: 1 },
    { lat: 48.11, lng: 11.51, station_key: 'stop-market', stay_minutes: 0, importance: 'optional' },
    { lat: 48.12, lng: 11.52 },
    { lat: 48.13, lng: 11.53, station_key: 'stop-park', name: 'Park', stay_minutes: 45 },
  ]);
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), hike.id);
  await addTourWaypoints(orm(), hike.id, [
    { lat: 47, lng: 11, station_key: 'ridge-a' },
    { lat: 47.1, lng: 11.1, station_key: 'ridge-b' },
  ]);
  const cafe = await makePlace(orm(), trip.id, { name: 'Cafe' });
  const onDay1 = await makeDayAssignment(orm(), day1.id, walk.id);
  const onDay2 = await makeDayAssignment(orm(), day2.id, walk.id);
  const hikeOnDay1 = await makeDayAssignment(orm(), day1.id, hike.id);
  const cafeOnDay1 = await makeDayAssignment(orm(), day1.id, cafe.id);

  const other = await makeTrip(orm(), user.id);
  const otherDay = await makeDay(orm(), other.id, { day_number: 1 });
  const otherWalk = await makePlace(orm(), other.id, { name: 'Harbour' });
  await makeTour(orm(), otherWalk.id, { tourTypeRef: 'walk' });
  const foreign = await makeDayAssignment(orm(), otherDay.id, otherWalk.id);
  return {
    trip,
    day1,
    day2,
    day3,
    museum,
    walk,
    hike,
    cafe,
    onDay1,
    onDay2,
    hikeOnDay1,
    cafeOnDay1,
    other,
    otherDay,
    otherWalk,
    foreign,
  };
}

describe('TourVisitsService', () => {
  it('TOUR-VISITS-001: list reads every visit on the days of the trip, none of another trip', async () => {
    const { trip, onDay1, onDay2, foreign } = await fixture();
    await markStationVisit(orm(), onDay2.id, 'stop-park', 'skipped');
    await markStationVisit(orm(), onDay1.id, 'stop-cathedral', 'visited');
    await markStationVisit(orm(), foreign.id, 'stop-park', 'visited');

    expect(await visits.list(String(trip.id))).toEqual({
      visits: [
        { assignment_id: onDay1.id, station_key: 'stop-cathedral', status: 'visited' },
        { assignment_id: onDay2.id, station_key: 'stop-park', status: 'skipped' },
      ],
    });
  });

  it('TOUR-VISITS-002: update marks a station visited, then skipped, then takes it back, and tells the trip each time', async () => {
    const { trip, onDay1, onDay2 } = await fixture();
    const tripId = String(trip.id);
    await markStationVisit(orm(), onDay2.id, 'stop-cathedral', 'visited');

    expect(await visits.update(tripId, onDay1.id, 'stop-cathedral', { status: 'visited' }, 'sock-1')).toEqual({
      visits: [{ assignment_id: onDay1.id, station_key: 'stop-cathedral', status: 'visited' }],
    });
    expect(t.realtime.broadcastMock).toHaveBeenLastCalledWith(
      tripId,
      'tours:visits',
      {
        assignmentId: onDay1.id,
        visits: [{ assignment_id: onDay1.id, station_key: 'stop-cathedral', status: 'visited' }],
      },
      'sock-1',
    );

    const skipped = await visits.update(tripId, onDay1.id, 'stop-cathedral', { status: 'skipped' });
    expect(skipped.visits).toEqual([{ assignment_id: onDay1.id, station_key: 'stop-cathedral', status: 'skipped' }]);
    expect(t.realtime.broadcastMock).toHaveBeenLastCalledWith(
      tripId,
      'tours:visits',
      { assignmentId: onDay1.id, visits: skipped.visits },
      undefined,
    );

    expect(await visits.update(tripId, onDay1.id, 'stop-cathedral', { status: 'planned' }, 'sock-2')).toEqual({
      visits: [],
    });
    expect(t.realtime.broadcastMock).toHaveBeenLastCalledWith(
      tripId,
      'tours:visits',
      { assignmentId: onDay1.id, visits: [] },
      'sock-2',
    );
    expect(t.realtime.broadcastMock).toHaveBeenCalledTimes(3);
    // The same walk on day 2 keeps what was checked off there.
    expect((await visits.walkOnDay(trip.id, onDay2.id)).visits).toEqual([
      { assignment_id: onDay2.id, station_key: 'stop-cathedral', status: 'visited' },
    ]);
  });

  it('TOUR-VISITS-003: walkOnDay reads the walk on its day without shaping points, and 404s anything else', async () => {
    const { trip, day1, walk, onDay1, hikeOnDay1, cafeOnDay1, foreign } = await fixture();
    await markStationVisit(orm(), onDay1.id, 'stop-market', 'skipped');

    const walkOnDay = await visits.walkOnDay(String(trip.id), onDay1.id);
    expect(walkOnDay).toEqual<WalkOnDay>({
      assignmentId: onDay1.id,
      dayId: day1.id,
      placeId: walk.id,
      loop: false,
      stations: expect.any(Array),
      visits: [{ assignment_id: onDay1.id, station_key: 'stop-market', status: 'skipped' }],
    });
    expect(walkOnDay.stations.map((station) => station.sequence)).toEqual([0, 2, 3, 4]);

    await expect(visits.walkOnDay(trip.id, foreign.id)).rejects.toEqual(new NotFoundException('Assignment not found'));
    await expect(visits.walkOnDay(trip.id, 999_999)).rejects.toEqual(new NotFoundException('Assignment not found'));
    await expect(visits.walkOnDay(trip.id, hikeOnDay1.id)).rejects.toEqual(
      new NotFoundException('City walk not found'),
    );
    await expect(visits.walkOnDay(trip.id, cafeOnDay1.id)).rejects.toEqual(
      new NotFoundException('City walk not found'),
    );
  });

  it('TOUR-VISITS-004: a station the walk does not have is a 404 that writes and tells nothing', async () => {
    const { trip, onDay1, hikeOnDay1 } = await fixture();
    const tripId = String(trip.id);
    const refusals = [
      visits.update(tripId, onDay1.id, 'stop-unknown', { status: 'visited' }),
      // A shaping point steers the line only; it is no station.
      visits.update(tripId, onDay1.id, 'shape-1', { status: 'visited' }),
      visits.update(tripId, hikeOnDay1.id, 'ridge-a', { status: 'visited' }),
    ];
    const errors = await Promise.all(refusals.map((refusal) => refusal.catch((err: unknown) => err)));
    expect(errors).toEqual([
      new NotFoundException('Station not found'),
      new NotFoundException('Station not found'),
      new NotFoundException('City walk not found'),
    ]);
    expect(await countRows(orm(), TourStationVisits, {})).toBe(0);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TOUR-VISITS-005: progress lists every station with its status that day and sums what is still open', async () => {
    const { trip, day1, museum, walk, onDay1, onDay2 } = await fixture();
    await markStationVisit(orm(), onDay1.id, 'stop-cathedral', 'visited');
    await markStationVisit(orm(), onDay1.id, 'stop-market', 'skipped');
    await markStationVisit(orm(), onDay2.id, 'stop-park', 'visited');
    const before = await countRows(orm(), TourStationVisits, {});

    expect(await visits.progress(trip.id, walk.id, day1.id)).toEqual<WalkProgress>({
      place_id: walk.id,
      day_id: day1.id,
      assignment_id: onDay1.id,
      stations: [
        {
          position: 1,
          key: 'stop-cathedral',
          name: 'Cathedral',
          lat: 48.1,
          lng: 11.5,
          status: 'visited',
          importance: 'must',
          protected: true,
          stay_minutes: 30,
          opening_hours: null,
          linked_place_id: museum.id,
        },
        {
          position: 2,
          key: 'stop-market',
          name: null,
          lat: 48.11,
          lng: 11.51,
          status: 'skipped',
          importance: 'optional',
          protected: false,
          stay_minutes: 0,
          opening_hours: null,
          linked_place_id: null,
        },
        {
          position: 3,
          key: null,
          name: null,
          lat: 48.12,
          lng: 11.52,
          status: 'planned',
          importance: 'normal',
          protected: false,
          stay_minutes: null,
          opening_hours: null,
          linked_place_id: null,
        },
        {
          position: 4,
          key: 'stop-park',
          name: 'Park',
          lat: 48.13,
          lng: 11.53,
          status: 'planned',
          importance: 'normal',
          protected: false,
          stay_minutes: 45,
          opening_hours: null,
          linked_place_id: null,
        },
      ],
      open: { stations: 2, stay_minutes_known: 45, stays_unknown: 1 },
      walking_minutes: 95,
    });
    expect(await countRows(orm(), TourStationVisits, {})).toBe(before);
  });

  it('TOUR-VISITS-007: the way back of a loop is no station: its start is read once and its key is refused', async () => {
    const { trip, day1 } = await fixture();
    const loop = await makePlace(orm(), trip.id, { name: 'Round' });
    await makeTour(orm(), loop.id, { tourTypeRef: 'walk', duration: 60 });
    const cathedral = {
      lat: 48.1,
      lng: 11.5,
      name: 'Cathedral',
      stay_minutes: 30,
      importance: 'must',
      protected: 1,
    } as const;
    await addTourWaypoints(orm(), loop.id, [
      { ...cathedral, station_key: 'stop-cathedral' },
      { lat: 48.11, lng: 11.51, station_key: 'stop-market' },
      { lat: 48.13, lng: 11.53, station_key: 'stop-park', stay_minutes: 45 },
      // A way back saved as a copy of the start, the way loops were closed at first.
      { ...cathedral, station_key: 'stop-back' },
    ]);
    const onDay1 = await makeDayAssignment(orm(), day1.id, loop.id);
    await markStationVisit(orm(), onDay1.id, 'stop-cathedral', 'visited');

    const progress = await visits.progress(trip.id, loop.id, day1.id);
    expect(progress.stations.map((station) => [station.name, station.status])).toEqual([
      ['Cathedral', 'visited'],
      [null, 'planned'],
      [null, 'planned'],
    ]);
    expect(progress.open).toEqual({ stations: 2, stay_minutes_known: 45, stays_unknown: 1 });
    await expect(visits.update(String(trip.id), onDay1.id, 'stop-back', { status: 'visited' })).rejects.toEqual(
      new NotFoundException('Station not found'),
    );
  });

  it('TOUR-VISITS-006: progress of a walk without stations or walking time, and of a walk not on that day', async () => {
    const { trip, day3, walk, other, otherDay, otherWalk, foreign } = await fixture();
    expect(await visits.progress(other.id, otherWalk.id, otherDay.id)).toEqual<WalkProgress>({
      place_id: otherWalk.id,
      day_id: otherDay.id,
      assignment_id: foreign.id,
      stations: [],
      open: { stations: 0, stay_minutes_known: 0, stays_unknown: 0 },
      walking_minutes: null,
    });
    await expect(visits.progress(trip.id, walk.id, day3.id)).rejects.toEqual(
      new NotFoundException('City walk not on this day'),
    );
    await expect(visits.progress(trip.id, otherWalk.id, otherDay.id)).rejects.toEqual(
      new NotFoundException('City walk not on this day'),
    );
  });

  it('TOUR-VISITS-008: remaining counts from the last visit along the saved line, a point without a key passed behind it', async () => {
    const { trip, day1, walk, onDay1 } = await fixture();
    // Straight north-east through the four stations, the same stretch between each.
    const line = [
      [48.1, 11.5],
      [48.11, 11.51],
      [48.12, 11.52],
      [48.13, 11.53],
    ];
    await updateRows(orm(), Places, { id: walk.id }, { route_geometry: JSON.stringify(line) });
    await markStationVisit(orm(), onDay1.id, 'stop-cathedral', 'visited');
    await markStationVisit(orm(), onDay1.id, 'stop-market', 'visited');
    const before = await countRows(orm(), TourStationVisits, {});

    const remaining = await visits.remaining(trip.id, walk.id, day1.id);
    expect(remaining).toMatchObject({
      place_id: walk.id,
      day_id: day1.id,
      assignment_id: onDay1.id,
      loop: false,
      reference: { kind: 'last_visited', station: { position: 2, key: 'stop-market', name: null } },
      walking: { total_minutes: 95, remaining_minutes: 63, upper_bound: false, after_last_station_minutes: 0 },
      stays: { remaining_known_minutes: 45, unknown: [{ position: 3, key: null, name: null }] },
    });
    expect(remaining.open_stations.map((station) => [station.position, station.walk_minutes_from_reference])).toEqual([
      [3, 31],
      [4, 63],
    ]);
    expect(await countRows(orm(), TourStationVisits, {})).toBe(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TOUR-VISITS-011: remaining shares no walking time out along a ferry leg the travellers took (CW-12)', async () => {
    const { trip, day1 } = await fixture();
    const island = await makePlace(orm(), trip.id, {
      name: 'Giudecca',
      route_geometry: JSON.stringify([
        [48.1, 11.5],
        [48.11, 11.51],
        [48.12, 11.52],
        [48.13, 11.53],
      ]),
    });
    await makeTour(orm(), island.id, { tourTypeRef: 'walk', duration: 60 });
    const ferry = {
      kind: 'ferry',
      geometry: [
        [48.11, 11.51],
        [48.12, 11.52],
      ],
      crossings: [[0, 1]],
      minutes: 7,
      walk_minutes: 0,
    };
    await addTourWaypoints(orm(), island.id, [
      { lat: 48.1, lng: 11.5, station_key: 'stop-zattere', stay_minutes: 0 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-pier', stay_minutes: 0, fixed_leg: JSON.stringify(ferry) },
      { lat: 48.12, lng: 11.52, station_key: 'stop-redentore', stay_minutes: 20 },
      { lat: 48.13, lng: 11.53, station_key: 'stop-garden', stay_minutes: 30 },
    ]);
    const onDay1 = await makeDayAssignment(orm(), day1.id, island.id);
    await markStationVisit(orm(), onDay1.id, 'stop-zattere', 'visited');

    const remaining = await visits.remaining(trip.id, island.id, day1.id);
    // Two stretches are walked, one is crossed by boat: the landing is passed after half the walk, not two thirds.
    expect(remaining.open_stations.map((station) => [station.key, station.walk_minutes_from_reference])).toEqual([
      ['stop-pier', 30],
      ['stop-redentore', 30],
      ['stop-garden', 60],
    ]);
    expect(remaining.walking).toMatchObject({ total_minutes: 60, remaining_minutes: 60 });
  });

  it('TOUR-VISITS-009: a loop keeps its way back once every station is done, and a walk not on that day is a 404', async () => {
    const { trip, day1, day3, walk } = await fixture();
    const loop = await makePlace(orm(), trip.id, {
      name: 'Round',
      route_geometry: JSON.stringify([
        [48.1, 11.5],
        [48.11, 11.5],
        [48.11, 11.51],
        [48.1, 11.5],
      ]),
    });
    await makeTour(orm(), loop.id, { tourTypeRef: 'walk', duration: 60 });
    await addTourWaypoints(orm(), loop.id, [
      { lat: 48.1, lng: 11.5, station_key: 'stop-start', stay_minutes: 0 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-tower', stay_minutes: 15 },
      { lat: 48.1, lng: 11.5, station_key: 'stop-back' },
    ]);
    const onDay1 = await makeDayAssignment(orm(), day1.id, loop.id);
    await markStationVisit(orm(), onDay1.id, 'stop-start', 'visited');
    await markStationVisit(orm(), onDay1.id, 'stop-tower', 'visited');

    const remaining = await visits.remaining(trip.id, loop.id, day1.id);
    expect(remaining).toMatchObject({ loop: true, finished: true, open_stations: [] });
    expect(remaining.walking.after_last_station_minutes).toBeGreaterThan(0);
    expect(remaining.walking.remaining_minutes).toBe(remaining.walking.after_last_station_minutes);
    await expect(visits.remaining(trip.id, walk.id, day3.id)).rejects.toEqual(
      new NotFoundException('City walk not on this day'),
    );
  });

  it('TOUR-VISITS-010: a walk put on one day twice reads the run it is asked for, the first without one', async () => {
    const { trip, day1, day2, walk, hike, onDay1, onDay2, hikeOnDay1 } = await fixture();
    const again = await makeDayAssignment(orm(), day1.id, walk.id);
    await markStationVisit(orm(), again.id, 'stop-cathedral', 'visited');

    const first = await visits.remaining(trip.id, walk.id, day1.id);
    expect(first).toMatchObject({ assignment_id: onDay1.id, reference: { kind: 'start' } });
    const second = await visits.remaining(trip.id, walk.id, day1.id, again.id);
    expect(second).toMatchObject({
      assignment_id: again.id,
      reference: { kind: 'last_visited', station: { key: 'stop-cathedral' } },
    });
    expect((await visits.progress(trip.id, walk.id, day1.id, again.id)).stations[0].status).toBe('visited');

    await Promise.all(
      [onDay2.id, hikeOnDay1.id, 999999].map((elsewhere) =>
        expect(visits.remaining(trip.id, walk.id, day1.id, elsewhere)).rejects.toEqual(
          new NotFoundException('City walk not on this day'),
        ),
      ),
    );
    await expect(visits.progress(trip.id, hike.id, day2.id, onDay2.id)).rejects.toEqual(
      new NotFoundException('City walk not on this day'),
    );
  });
});
