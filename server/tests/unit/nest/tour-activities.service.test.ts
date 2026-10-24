/**
 * TourActivitiesService and the ACT-01 parts of ToursService: a recording of
 * the trip assigned to a tour on purpose, for one execution, with every check
 * inside the write; what the recording measures read from its own line; the
 * plan left exactly as it was; and the GPX import keeping when a track was
 * recorded. The services come out of ToursModule over a snapshot test db, rows
 * are seeded through the ORM factories and broadcasts go to a FakeRealtimeService.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourActivities } from '../../../src/db/entities/TourActivities.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { TourActivitiesService } from '../../../src/nest/tours/tour-activities.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, deleteRows, findRow, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, makeTourActivity } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let activities: TourActivitiesService;
let tours: ToursService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  activities = t.get(TourActivitiesService);
  tours = t.get(ToursService);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockClear();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const PLAN = JSON.stringify([
  [47, 11, 600],
  [47.02, 11, 900],
]);
const RECORDED = JSON.stringify([
  [47, 11, 600],
  [47.01, 11.005, 760],
  [47.02, 11, 880],
]);

/** The refusal a write threw, as REST and MCP report it. */
async function refusal(write: Promise<unknown>): Promise<{ status: number; code: string }> {
  try {
    await write;
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    const domain = error as DomainError;
    return { status: domain.getStatus(), code: domain.code };
  }
  throw new Error('the write was not refused');
}

/**
 * A planned hike on two days with its waypoints, two GPX recordings (one
 * with times), a tour planned in TREK, an import planned over, and a
 * recording in another trip.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const day1 = await makeDay(orm(), trip.id, { day_number: 1 });
  const day2 = await makeDay(orm(), trip.id, { day_number: 2 });
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge', route_geometry: PLAN });
  await makeTour(orm(), hike.id, { distance: 2.2, elevation_gain: 300, elevation_loss: 0, duration: 120 });
  await addTourWaypoints(orm(), hike.id, [
    { lat: 47, lng: 11 },
    { lat: 47.02, lng: 11 },
  ]);
  const onDay1 = await makeDayAssignment(orm(), day1.id, hike.id);
  const onDay2 = await makeDayAssignment(orm(), day2.id, hike.id);
  const watch = await makePlace(orm(), trip.id, { name: 'Watch export', route_geometry: RECORDED });
  await makeTour(orm(), watch.id, {
    origin: 'gpx',
    origin_file_name: 'morning.gpx',
    track_started_at: '2026-07-02 06:10:00',
    track_ended_at: '2026-07-02 09:25:00',
  });
  const phone = await makePlace(orm(), trip.id, { name: 'Phone export', route_geometry: RECORDED });
  await makeTour(orm(), phone.id, { origin: 'gpx' });
  const drawn = await makePlace(orm(), trip.id, { name: 'Drawn', route_geometry: PLAN });
  await makeTour(orm(), drawn.id);
  const replanned = await makePlace(orm(), trip.id, { name: 'Replanned', route_geometry: PLAN });
  await makeTour(orm(), replanned.id, { origin: 'gpx', recorded_route_geometry: RECORDED });
  await addTourWaypoints(orm(), replanned.id, [
    { lat: 47, lng: 11 },
    { lat: 47.02, lng: 11 },
  ]);
  const other = await makeTrip(orm(), user.id);
  const elsewhere = await makePlace(orm(), other.id, { name: 'Elsewhere', route_geometry: RECORDED });
  await makeTour(orm(), elsewhere.id, { origin: 'gpx' });
  return { user, trip, day1, hike, onDay1, onDay2, watch, phone, drawn, replanned, elsewhere };
}

describe('TourActivitiesService.assign', () => {
  it('ACT-SVC-001: assigns a recording to an execution and answers what it measures, the plan untouched', async () => {
    const { user, trip, day1, hike, onDay1, watch } = await fixture();
    const before = await findRow(orm(), Tours, { place: hike.id });
    const tripId = String(trip.id);

    const detail = await activities.assign(
      tripId,
      String(hike.id),
      { track_place_id: watch.id, assignment_id: onDay1.id },
      user.id,
      'sock-1',
    );

    expect(detail.activities).toHaveLength(1);
    expect(detail.activities?.[0]).toMatchObject({
      assignment_id: onDay1.id,
      day_id: day1.id,
      track: { place_id: watch.id, name: 'Watch export', origin: 'gpx', file_name: 'morning.gpx' },
      metrics: {
        elevation_gain_m: 280,
        elevation_loss_m: 0,
        started_at: '2026-07-02T06:10:00Z',
        ended_at: '2026-07-02T09:25:00Z',
        elapsed_minutes: 195,
        point_count: 3,
      },
    });
    // The plan keeps its values, its line and its revision: an open draft stays valid.
    expect(detail.tour).toMatchObject({
      distance: 2.2,
      elevation_gain: 300,
      duration: 120,
      revision: before?.revision,
      activity_tracks: [{ track_place_id: watch.id, assignment_id: onDay1.id }],
      activity_of: null,
    });
    expect(await findRow(orm(), Places, { id: hike.id })).toMatchObject({ route_geometry: PLAN });
    expect(await findRow(orm(), TourActivities, { trackPlace: watch.id })).toMatchObject({ assigned_by: user.id });
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(
      tripId,
      'tours:changed',
      { placeIds: [hike.id, watch.id] },
      'sock-1',
    );
    // The recording says whose it is, in the list and in its own detail.
    const listed = await tours.listTours(tripId);
    expect(listed.find((tour) => tour.place_id === watch.id)).toMatchObject({
      activity_of: hike.id,
      activity_tracks: [],
      track_started_at: '2026-07-02T06:10:00Z',
      track_ended_at: '2026-07-02T09:25:00Z',
    });
    expect((await tours.getTour(tripId, String(watch.id))).tour.activity_of).toBe(hike.id);
  });

  it('ACT-SVC-002: an execution takes a new recording in place of its old one; a recording moves between executions', async () => {
    const { user, trip, hike, onDay1, onDay2, watch, phone } = await fixture();
    const tripId = String(trip.id);
    const placeId = String(hike.id);
    await activities.assign(tripId, placeId, { track_place_id: watch.id, assignment_id: onDay1.id }, user.id);
    await activities.assign(tripId, placeId, { track_place_id: phone.id, assignment_id: onDay1.id }, user.id);
    let detail = await tours.getTour(tripId, placeId);
    expect(detail.activities?.map((a) => [a.track.place_id, a.assignment_id])).toEqual([[phone.id, onDay1.id]]);

    detail = await activities.assign(tripId, placeId, { track_place_id: phone.id, assignment_id: onDay2.id }, user.id);
    expect(detail.activities?.map((a) => [a.track.place_id, a.assignment_id])).toEqual([[phone.id, onDay2.id]]);

    // Without a day it is one recording too: a second one replaces the first.
    await activities.assign(tripId, placeId, { track_place_id: watch.id, assignment_id: null }, user.id);
    detail = await activities.assign(tripId, placeId, { track_place_id: watch.id, assignment_id: null }, user.id);
    expect(detail.activities?.map((a) => [a.track.place_id, a.assignment_id])).toEqual([
      [phone.id, onDay2.id],
      [watch.id, null],
    ]);
  });

  it('ACT-SVC-003: refuses what is no recording, and a tour as its own', async () => {
    const { user, trip, hike, drawn, replanned } = await fixture();
    const tripId = String(trip.id);
    const assign = (track: number, place = hike.id) =>
      activities.assign(tripId, String(place), { track_place_id: track, assignment_id: null }, user.id);
    expect(await refusal(assign(drawn.id))).toEqual({ status: 400, code: 'activity_track_not_recorded' });
    expect(await refusal(assign(replanned.id))).toEqual({ status: 400, code: 'activity_track_not_recorded' });
    expect(await refusal(assign(hike.id))).toEqual({ status: 400, code: 'activity_track_is_tour' });
    expect(await countRows(orm(), TourActivities)).toBe(0);
  });

  it('ACT-SVC-004: a recording documents one tour, and a recording or a tour with recordings is no candidate the other way', async () => {
    const { user, trip, hike, watch, phone, drawn } = await fixture();
    const tripId = String(trip.id);
    await makeTourActivity(orm(), hike.id, watch.id);
    const assign = (place: number, track: number) =>
      activities.assign(tripId, String(place), { track_place_id: track, assignment_id: null }, user.id);

    expect(await refusal(assign(drawn.id, watch.id))).toEqual({ status: 409, code: 'activity_track_in_use' });
    expect(await refusal(assign(watch.id, phone.id))).toEqual({ status: 400, code: 'activity_tour_is_track' });
    // The hike has a recording of its own, so it is nobody's recording.
    await updateRows(orm(), Tours, { place: hike.id }, { origin: 'gpx' });
    await deleteRows(orm(), TourWaypoints, { place: hike.id });
    expect(await refusal(assign(drawn.id, hike.id))).toEqual({ status: 400, code: 'activity_track_is_tour' });
    expect(await countRows(orm(), TourActivities)).toBe(1);
  });

  it('ACT-SVC-005: an execution must be a day of this tour, and every id must be of this trip', async () => {
    const { user, trip, hike, onDay1, watch, drawn, elsewhere } = await fixture();
    const tripId = String(trip.id);
    const onDrawnDay = await makeDayAssignment(orm(), (await makeDay(orm(), trip.id)).id, drawn.id);
    expect(
      await refusal(
        activities.assign(tripId, String(hike.id), { track_place_id: watch.id, assignment_id: onDrawnDay.id }, user.id),
      ),
    ).toEqual({ status: 400, code: 'activity_assignment_not_of_tour' });
    await expect(
      activities.assign(tripId, String(hike.id), { track_place_id: elsewhere.id, assignment_id: null }, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      activities.assign(tripId, String(elsewhere.id), { track_place_id: watch.id, assignment_id: onDay1.id }, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      activities.assign('nope', String(hike.id), { track_place_id: watch.id, assignment_id: null }, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(await countRows(orm(), TourActivities)).toBe(0);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
});

describe('TourActivitiesService.unassign', () => {
  it('ACT-SVC-006: takes a recording off the tour; the recording stays in the trip', async () => {
    const { trip, hike, watch } = await fixture();
    const activity = await makeTourActivity(orm(), hike.id, watch.id);
    const tripId = String(trip.id);

    const detail = await activities.unassign(tripId, String(hike.id), activity.id, 'sock-2');
    expect(detail.activities).toEqual([]);
    expect(detail.tour.activity_tracks).toEqual([]);
    expect(await findRow(orm(), Tours, { place: watch.id })).not.toBeNull();
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(
      tripId,
      'tours:changed',
      { placeIds: [hike.id, watch.id] },
      'sock-2',
    );
  });

  it('ACT-SVC-007: 404 for an assignment of another tour, or one that is gone', async () => {
    const { trip, hike, watch, drawn } = await fixture();
    const activity = await makeTourActivity(orm(), hike.id, watch.id);
    await expect(activities.unassign(String(trip.id), String(drawn.id), activity.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(activities.unassign(String(trip.id), String(hike.id), 999_999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(await countRows(orm(), TourActivities)).toBe(1);
  });
});

describe('ToursService and ACT-01', () => {
  const TIMED = `<?xml version="1.0"?>
<gpx version="1.1" creator="unit"><trk><name>Morning</name><trkseg>
  <trkpt lat="47" lon="11"><ele>600</ele><time>2026-07-02T06:10:00Z</time></trkpt>
  <trkpt lat="47.01" lon="11"><ele>700</ele><time>2026-07-02T07:00:00Z</time></trkpt>
</trkseg></trk><trk><name>Untimed</name><trkseg>
  <trkpt lat="46" lon="10"/><trkpt lat="46.01" lon="10"/>
</trkseg></trk></gpx>`;

  it('ACT-SVC-008: the preview shows when a track was recorded, and the import keeps it; a track without times stays unknown', async () => {
    const { trip } = await fixture();
    const tripId = String(trip.id);
    const preview = await tours.previewGpx(tripId, Buffer.from(TIMED), 'morning.gpx');
    expect(preview?.tracks.map((track) => [track.name, track.started_at, track.ended_at])).toEqual([
      ['Morning', '2026-07-02T06:10:00.000Z', '2026-07-02T07:00:00.000Z'],
      ['Untimed', null, null],
    ]);

    const imported = await tours.importGpxAsTour(tripId, Buffer.from(TIMED), 'morning.gpx');
    const byName = new Map(imported?.tours.map((tour) => [tour.name, tour]));
    expect(byName.get('Morning')).toMatchObject({
      track_started_at: '2026-07-02T06:10:00Z',
      track_ended_at: '2026-07-02T07:00:00Z',
    });
    expect(byName.get('Untimed')).toMatchObject({ track_started_at: null, track_ended_at: null });
    const morning = byName.get('Morning')?.place_id ?? 0;
    expect(await findRow(orm(), Tours, { place: morning })).toMatchObject({
      track_started_at: '2026-07-02 06:10:00',
      track_ended_at: '2026-07-02 07:00:00',
    });
  });

  it('ACT-SVC-009: a copy of a recording keeps when it was recorded; a copy of a tour leaves its recordings behind', async () => {
    const { trip, hike, watch } = await fixture();
    await makeTourActivity(orm(), hike.id, watch.id);
    const tripId = String(trip.id);

    const recordingCopy = await tours.copyTour(tripId, String(watch.id), 'Watch again');
    expect(recordingCopy.tour).toMatchObject({ track_started_at: '2026-07-02T06:10:00Z', activity_of: null });
    const tourCopy = await tours.copyTour(tripId, String(hike.id), 'Ridge again');
    expect(tourCopy.activities).toEqual([]);
    expect(tourCopy.tour.activity_tracks).toEqual([]);
  });
});
