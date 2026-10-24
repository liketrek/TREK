/**
 * `ToursRepository`: the list/detail projection (TO1/TO2), the facet probes
 * places and assignments ask (TO3/TO4/TO5), the stages of a multi-day tour
 * days hold (MDT-02), the trip copy read and write
 * (TO6/TO8), and the create/edit writes (TO7/TO9).
 */
import { DayAssignments } from '../../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { TourPackingLinks } from '../../../../src/db/entities/TourPackingLinks.entity';
import { TourSources } from '../../../../src/db/entities/TourSources.entity';
import { TourWaypoints } from '../../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../../src/db/entities/Tours.entity';
import type { ToursRepository } from '../../../../src/db/repositories/Tours.repository';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, findRow, findRows, insertRow, insertRows, updateRows } from '../../../helpers/factories/rows';
import { linkTourPacking } from '../../../helpers/factories/tours';
import { makeDay } from '../../../helpers/factories/trips';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTour } from '../../../helpers/tours-repos';

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

function fixture() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const other = createTrip(testDb, user.id);
  return { trip, other };
}

async function addWaypoint(placeId: number, sequence: number): Promise<void> {
  await insertRow(t, TourWaypoints, { place: placeId, lat: 47, lng: 11, role: 'via', sequence });
}

const METRICS = {
  tour_type: 'hike',
  distance: 8.25,
  elevation_gain: 420,
  elevation_loss: 380,
  duration: 150,
  planned_duration_minutes: 125,
  break_additional_minutes: 35,
  match_confidence: 1,
  max_hiking_difficulty: 3,
};

describe('ToursRepository reads', () => {
  it('TOURREPO-001: listForTrip projects the facet with its place name and both flags, newest first, never another trip', async () => {
    const { trip, other } = fixture();
    const older = createPlace(testDb, trip.id, { name: 'Older' });
    const newer = createPlace(testDb, trip.id, { name: 'Newer', description: 'Lake ridge' });
    await updateRows(t, Places, { id: newer.id }, { website: 'https://www.komoot.com/tour/42' });
    const plain = createPlace(testDb, trip.id, { name: 'Not a tour' });
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' });
    createTour(testDb, older.id, { created_at: '2026-01-01 10:00:00', distance: 5, match_confidence: 0.3 });
    createTour(testDb, newer.id, { created_at: '2026-01-02 10:00:00', max_hiking_difficulty: 5 });
    createTour(testDb, foreign.id);
    createDayAssignment(testDb, createDay(testDb, trip.id).id, older.id);
    await addWaypoint(newer.id, 0);

    expect(await repo.listForTrip(trip.id)).toEqual([
      {
        place_id: newer.id,
        name: 'Newer',
        description: 'Lake ridge',
        website: 'https://www.komoot.com/tour/42',
        tour_type: 'hike',
        distance: null,
        elevation_gain: null,
        elevation_loss: null,
        duration: null,
        planned_duration_minutes: null,
        break_additional_minutes: null,
        difficulty: null,
        wanderer_ref: null,
        match_confidence: null,
        max_hiking_difficulty: 5,
        planned: 0,
        has_waypoints: 1,
        derived_from_place_id: null,
        origin: 'trek',
        boat_type: null,
        water_context: null,
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        paddle_lake_style: null,
        track_marks: null,
        has_recorded_track: 0,
        route_missing: 1,
        revision: 1,
        hiking_preferences: null,
        bike_profile: null,
        run_profile: null,
        run_pace_seconds_per_km: null,
        ski_discipline: null,
        ski_technique: null,
        ski_options: null,
        track_started_at: null,
        track_ended_at: null,
        stage_ends: 0,
      },
      {
        place_id: older.id,
        name: 'Older',
        description: null,
        website: null,
        tour_type: 'hike',
        distance: 5,
        elevation_gain: null,
        elevation_loss: null,
        duration: null,
        planned_duration_minutes: null,
        break_additional_minutes: null,
        difficulty: null,
        wanderer_ref: null,
        match_confidence: 0.3,
        max_hiking_difficulty: 2,
        planned: 1,
        has_waypoints: 0,
        derived_from_place_id: null,
        origin: 'trek',
        boat_type: null,
        water_context: null,
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        paddle_lake_style: null,
        track_marks: null,
        has_recorded_track: 0,
        route_missing: 1,
        revision: 1,
        hiking_preferences: null,
        bike_profile: null,
        run_profile: null,
        run_pace_seconds_per_km: null,
        ski_discipline: null,
        ski_technique: null,
        ski_options: null,
        track_started_at: null,
        track_ended_at: null,
        stage_ends: 0,
      },
    ]);
    expect((await repo.listForTrip(trip.id)).map((r) => r.place_id)).not.toContain(plain.id);
  });

  it('TOURREPO-002: listForTrip breaks a created_at tie by the newer place', async () => {
    const { trip } = fixture();
    const a = createPlace(testDb, trip.id);
    const b = createPlace(testDb, trip.id);
    createTour(testDb, a.id, { created_at: '2026-01-01 10:00:00' });
    createTour(testDb, b.id, { created_at: '2026-01-01 10:00:00' });
    expect((await repo.listForTrip(trip.id)).map((r) => r.place_id)).toEqual([b.id, a.id]);
  });

  it('TOURREPO-003: findInTrip returns the row for its own trip and undefined across trips or for a plain place', async () => {
    const { trip, other } = fixture();
    const tour = createPlace(testDb, trip.id, { name: 'Ridge' });
    const plain = createPlace(testDb, trip.id);
    createTour(testDb, tour.id);

    expect(await repo.findInTrip(trip.id, tour.id)).toMatchObject({
      place_id: tour.id,
      name: 'Ridge',
      planned: 0,
      has_waypoints: 0,
    });
    expect(await repo.findInTrip(other.id, tour.id)).toBeUndefined();
    expect(await repo.findInTrip(trip.id, plain.id)).toBeUndefined();
  });

  it('TOURREPO-014: the list and the detail say whether the owning place still has no line (CW-11)', async () => {
    const { trip } = fixture();
    const pending = await makePlace(t, trip.id, { name: 'Stations only' });
    const drawn = await makePlace(t, trip.id, { name: 'Drawn' });
    createTour(testDb, pending.id);
    createTour(testDb, drawn.id);
    await updateRows(t, Places, { id: drawn.id }, { route_geometry: '[[47,11,500],[47.1,11.1,520]]' });

    const listed = new Map((await repo.listForTrip(trip.id)).map((row) => [row.place_id, row.route_missing]));
    expect([listed.get(pending.id), listed.get(drawn.id)]).toEqual([1, 0]);
    expect((await repo.findInTrip(trip.id, pending.id))?.route_missing).toBe(1);
    expect((await repo.findInTrip(trip.id, drawn.id))?.route_missing).toBe(0);
  });

  it('TOURREPO-016: the list and the detail count the stops that end a stage, 0 for a day tour (MDT-01)', async () => {
    const { trip } = fixture();
    const hutToHut = await makePlace(t, trip.id, { name: 'Hut to hut' });
    const dayHike = await makePlace(t, trip.id, { name: 'Day hike' });
    createTour(testDb, hutToHut.id);
    createTour(testDb, dayHike.id);
    await insertRows(
      t,
      TourWaypoints,
      [0, 1, 1, 0].map((stage_end, sequence) => ({
        place: hutToHut.id,
        lat: 47,
        lng: 11,
        role: 'via',
        sequence,
        stage_end,
      })),
    );
    await addWaypoint(dayHike.id, 0);

    const listed = new Map((await repo.listForTrip(trip.id)).map((row) => [row.place_id, row.stage_ends]));
    expect(listed.get(hutToHut.id)).toBe(2);
    expect(listed.get(dayHike.id)).toBe(0);
    expect((await repo.findInTrip(trip.id, hutToHut.id))?.stage_ends).toBe(2);
  });

  it('TOURREPO-015: dayOfTrip reads a day of the trip with its date, and nothing for a day of another trip', async () => {
    const { trip, other } = fixture();
    const dated = await makeDay(t, trip.id, { date: '2026-07-12' });
    const undated = await makeDay(t, trip.id);
    const elsewhere = await makeDay(t, other.id, { date: '2026-07-12' });

    expect(await repo.dayOfTrip(trip.id, dated.id)).toEqual({ id: dated.id, date: '2026-07-12' });
    expect(await repo.dayOfTrip(trip.id, undated.id)).toEqual({ id: undated.id, date: null });
    expect(await repo.dayOfTrip(trip.id, elsewhere.id)).toBeUndefined();
  });

  it('TOURREPO-004: existsForPlace and listTourPlaceIds tell tours from plain places', async () => {
    const { trip } = fixture();
    const tour = createPlace(testDb, trip.id);
    const plain = createPlace(testDb, trip.id);
    createTour(testDb, tour.id);

    expect(await repo.existsForPlace(tour.id)).toBe(true);
    expect(await repo.existsForPlace(plain.id)).toBe(false);
    expect(await repo.listTourPlaceIds([plain.id, tour.id])).toEqual([tour.id]);
    expect(await repo.listTourPlaceIds([])).toEqual([]);
  });

  it('TOURREPO-005: isOnDay is true only for a tour already on that day, and ignores the assignment being moved', async () => {
    const { trip } = fixture();
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const tour = createPlace(testDb, trip.id);
    const plain = createPlace(testDb, trip.id);
    createTour(testDb, tour.id);
    const onDay1 = createDayAssignment(testDb, day1.id, tour.id);
    createDayAssignment(testDb, day1.id, plain.id);

    expect(await repo.isOnDay(day1.id, tour.id)).toBe(true);
    expect(await repo.isOnDay(day2.id, tour.id)).toBe(false);
    expect(await repo.isOnDay(day1.id, plain.id)).toBe(false);
    expect(await repo.isOnDay(day1.id, tour.id, onDay1.id)).toBe(false);
  });
});

describe('ToursRepository stages on days (MDT-02)', () => {
  it('TOURREPO-017: listStagePoints reads the points in route order with key, role and stage end, none for a plain place', async () => {
    const { trip } = fixture();
    const hutToHut = await makePlace(t, trip.id, { name: 'Hut to hut' });
    const plain = await makePlace(t, trip.id, { name: 'Plain' });
    createTour(testDb, hutToHut.id);
    await insertRows(t, TourWaypoints, [
      { place: hutToHut.id, lat: 47.2, lng: 11, role: 'end', sequence: 3, station_key: 'stop-end' },
      { place: hutToHut.id, lat: 47, lng: 11, role: 'start', sequence: 0, station_key: 'stop-start' },
      { place: hutToHut.id, lat: 47.1, lng: 11, role: 'via', sequence: 2, station_key: 'stop-hut', stage_end: 1 },
      { place: hutToHut.id, lat: 47.05, lng: 11, role: 'via', sequence: 1, shaping: 1 },
    ]);

    expect(await repo.listStagePoints(hutToHut.id)).toEqual([
      { role: 'start', lat: 47, lng: 11, key: 'stop-start' },
      { role: 'via', lat: 47.05, lng: 11, shaping: true },
      { role: 'via', lat: 47.1, lng: 11, key: 'stop-hut', stage_end: true },
      { role: 'end', lat: 47.2, lng: 11, key: 'stop-end' },
    ]);
    expect(await repo.listStagePoints(plain.id)).toEqual([]);
  });

  it('TOURREPO-018: listTourDays names the stage each day holds, null where a day holds the whole tour', async () => {
    const { trip } = fixture();
    const tour = createPlace(testDb, trip.id);
    createTour(testDb, tour.id);
    const first = createDay(testDb, trip.id);
    const second = createDay(testDb, trip.id);
    createDayAssignment(testDb, first.id, tour.id);
    createDayAssignment(testDb, second.id, tour.id, { tour_stage_key: 'stop-hut' });

    expect((await repo.listTourDays(trip.id)).map((row) => [row.day_id, row.tour_stage_key])).toEqual([
      [first.id, null],
      [second.id, 'stop-hut'],
    ]);
  });

  /** A tour on a trip with three days, none holding anything yet. */
  function tourOnDays() {
    const { trip } = fixture();
    const days = [createDay(testDb, trip.id), createDay(testDb, trip.id), createDay(testDb, trip.id)];
    const place = createPlace(testDb, trip.id);
    createTour(testDb, place.id);
    return { trip, days, place };
  }

  it('TOURREPO-019: findTourStage finds the day a stage is on, and nothing for a stage on none or of another tour', async () => {
    const { trip, days, place } = tourOnDays();
    const held = createDayAssignment(testDb, days[1].id, place.id, { tour_stage_key: 'stage-two' });
    expect(await repo.findTourStage(place.id, 'stage-two')).toEqual({ id: held.id, day_id: days[1].id });
    expect(await repo.findTourStage(place.id, 'stage-one')).toBeUndefined();
    const other = createPlace(testDb, trip.id);
    expect(await repo.findTourStage(other.id, 'stage-two')).toBeUndefined();
  });

  it('TOURREPO-020: deleteTourStagesNotIn takes off only the stages not kept, leaving the whole tour and other tours alone', async () => {
    const { trip, days, place } = tourOnDays();
    const first = createDayAssignment(testDb, days[0].id, place.id, { tour_stage_key: 'stage-one' });
    const second = createDayAssignment(testDb, days[1].id, place.id, { tour_stage_key: 'stage-two' });
    const whole = createDayAssignment(testDb, days[2].id, place.id);
    const other = createPlace(testDb, trip.id);
    createTour(testDb, other.id);
    const otherStage = createDayAssignment(testDb, days[2].id, other.id, { tour_stage_key: 'stage-two' });

    const gone = await new UnitOfWork(t.em).transactional(() => repo.deleteTourStagesNotIn(place.id, ['stage-one']));
    expect(gone).toEqual([{ id: second.id, day_id: days[1].id }]);
    const left = (await findRows(t, DayAssignments, {}, { id: 'asc' })).map((row) => row.id);
    expect(left).toEqual([first.id, whole.id, otherStage.id]);
  });

  it('TOURREPO-021: deleteTourStagesNotIn takes every stage off with no key kept, and writes nothing when no stage is held', async () => {
    const { days, place } = tourOnDays();
    const first = createDayAssignment(testDb, days[0].id, place.id, { tour_stage_key: 'stage-one' });
    const second = createDayAssignment(testDb, days[1].id, place.id, { tour_stage_key: 'stage-two' });
    expect(await repo.deleteTourStagesNotIn(place.id, [])).toEqual([
      { id: first.id, day_id: days[0].id },
      { id: second.id, day_id: days[1].id },
    ]);
    expect(await repo.deleteTourStagesNotIn(place.id, [])).toEqual([]);
  });
});

describe('ToursRepository writes', () => {
  it('TOURREPO-006: insertTour writes the metrics and leaves the unset metadata NULL', async () => {
    const { trip } = fixture();
    const place = createPlace(testDb, trip.id, { name: 'Drawn' });
    await repo.insertTour({ place_id: place.id, ...METRICS });

    expect(await repo.findInTrip(trip.id, place.id)).toEqual({
      place_id: place.id,
      name: 'Drawn',
      description: null,
      website: null,
      ...METRICS,
      difficulty: null,
      wanderer_ref: null,
      planned: 0,
      has_waypoints: 0,
      derived_from_place_id: null,
      origin: 'trek',
      boat_type: null,
      water_context: null,
      paddle_speed_kmh: null,
      portage_speed_kmh: null,
      paddle_lake_style: null,
      track_marks: null,
      has_recorded_track: 0,
      route_missing: 1,
      revision: 1,
      hiking_preferences: null,
      bike_profile: null,
      run_profile: null,
      run_pace_seconds_per_km: null,
      ski_discipline: null,
      ski_technique: null,
      ski_options: null,
      track_started_at: null,
      track_ended_at: null,
      stage_ends: 0,
    });
  });

  // A route edit always writes the type's own fields; a hike's are empty.
  const HIKE_UPDATE = {
    ...METRICS,
    bike_profile: null,
    run_profile: null,
    run_pace_seconds_per_km: null,
    ski_discipline: null,
    ski_technique: null,
    boat_type: null,
    water_context: null,
    paddle_speed_kmh: null,
    portage_speed_kmh: null,
    paddle_lake_style: null,
  };

  it('TOURREPO-007: updateInTrip replaces the metrics of a tour of that trip and refuses one of another trip', async () => {
    const { trip, other } = fixture();
    const place = createPlace(testDb, trip.id);
    createTour(testDb, place.id);

    expect(await repo.updateInTrip(other.id, place.id, HIKE_UPDATE)).toBe(false);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({ distance: null, max_hiking_difficulty: 2 });

    expect(await repo.updateInTrip(trip.id, place.id, HIKE_UPDATE)).toBe(true);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject(METRICS);
    const {
      planned_duration_minutes: _omitted,
      break_additional_minutes: _omittedBreaks,
      ...routeOnlyUpdate
    } = HIKE_UPDATE;
    expect(await repo.updateInTrip(trip.id, place.id, routeOnlyUpdate)).toBe(true);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({
      duration: 150,
      planned_duration_minutes: 125,
      break_additional_minutes: 35,
    });
  });

  it('TOURREPO-022: a planned ski tour keeps snowshoeing or winter hiking as its discipline, and a hike takes it off (SKI-02)', async () => {
    const { trip } = fixture();
    const place = createPlace(testDb, trip.id, { name: 'Snowy ridge' });
    const ski = { ...METRICS, tour_type: 'ski', max_hiking_difficulty: null, duration: null };
    await repo.insertTour({ place_id: place.id, ...ski, ski_discipline: 'snowshoe' });
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({ tour_type: 'ski', ski_discipline: 'snowshoe' });

    const winterHike = { ...HIKE_UPDATE, ...ski, ski_discipline: 'winter_hike' as const };
    expect(await repo.updateInTrip(trip.id, place.id, winterHike)).toBe(true);
    expect((await repo.listForTrip(trip.id))[0]).toMatchObject({ tour_type: 'ski', ski_discipline: 'winter_hike' });

    expect(await repo.updateInTrip(trip.id, place.id, HIKE_UPDATE)).toBe(true);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({ ski_discipline: null, ski_technique: null });
  });

  it('TOURREPO-023: a run keeps its profile and pace, an edit replaces them, and another type takes them off (RUN-01)', async () => {
    const { trip } = fixture();
    const place = createPlace(testDb, trip.id, { name: 'River loop' });
    const run = { ...METRICS, tour_type: 'run', max_hiking_difficulty: null };
    await repo.insertTour({ place_id: place.id, ...run, run_profile: 'running', run_pace_seconds_per_km: 360 });
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
    });

    const faster = { ...HIKE_UPDATE, ...run, run_profile: 'running' as const, run_pace_seconds_per_km: 300 };
    expect(await repo.updateInTrip(trip.id, place.id, faster)).toBe(true);
    expect((await repo.listForTrip(trip.id))[0]).toMatchObject({ tour_type: 'run', run_pace_seconds_per_km: 300 });

    expect(await repo.updateInTrip(trip.id, place.id, HIKE_UPDATE)).toBe(true);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({
      run_profile: null,
      run_pace_seconds_per_km: null,
    });
  });

  it('TOURREPO-024: a ski track keeps its classification, is classified again only in its own trip, and a route edit takes it off (SKI-02)', async () => {
    const { trip, other } = fixture();
    const place = createPlace(testDb, trip.id, { name: 'Valley loop' });
    const ski = { ...METRICS, tour_type: 'ski', max_hiking_difficulty: null, duration: null };
    await repo.insertTour({ place_id: place.id, ...ski, ski_discipline: 'cross_country', ski_technique: 'classic' });
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'cross_country',
      ski_technique: 'classic',
      duration: null,
    });

    const touring = { ski_discipline: 'touring' as const, ski_technique: null };
    expect(await repo.updateSkiInTrip(other.id, place.id, touring)).toBe(false);
    expect((await repo.findInTrip(trip.id, place.id))?.ski_discipline).toBe('cross_country');
    expect(await repo.updateSkiInTrip(trip.id, place.id, touring)).toBe(true);
    expect((await repo.listForTrip(trip.id))[0]).toMatchObject({
      ski_discipline: 'touring',
      ski_technique: null,
      distance: METRICS.distance,
      elevation_gain: METRICS.elevation_gain,
    });

    expect(await repo.updateInTrip(trip.id, place.id, HIKE_UPDATE)).toBe(true);
    expect(await repo.findInTrip(trip.id, place.id)).toMatchObject({ ski_discipline: null, ski_technique: null });
  });

  it('TOURREPO-008: listRowsForTrip and insertCopy carry every column, created_at included, onto the copied place', async () => {
    const { trip, other } = fixture();
    const source = createPlace(testDb, trip.id);
    createTour(testDb, source.id, { created_at: '2026-03-04 05:06:07', distance: 3.5, max_hiking_difficulty: 4 });
    await updateRows(
      t,
      Tours,
      { place: source.id },
      {
        difficulty: 'T3',
        wanderer_ref: 'w-1',
        planned_duration_minutes: 95,
        break_additional_minutes: 30,
      },
    );

    const rows = await repo.listRowsForTrip(trip.id);
    expect(rows).toEqual([
      {
        place_id: source.id,
        tour_type: 'hike',
        distance: 3.5,
        elevation_gain: null,
        elevation_loss: null,
        duration: null,
        planned_duration_minutes: 95,
        break_additional_minutes: 30,
        difficulty: 'T3',
        wanderer_ref: 'w-1',
        match_confidence: null,
        created_at: '2026-03-04 05:06:07',
        max_hiking_difficulty: 4,
        derived_from_place_id: null,
        recorded_route_geometry: null,
        origin: 'trek',
        origin_file_name: null,
        boat_type: null,
        water_context: null,
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        paddle_lake_style: null,
        track_marks: null,
        revision: 1,
        hiking_preferences: null,
        bike_profile: null,
        run_profile: null,
        run_pace_seconds_per_km: null,
        ski_discipline: null,
        ski_technique: null,
        ski_options: null,
        track_started_at: null,
        track_ended_at: null,
        taken_over_from_trip_title: null,
        taken_over_from_tour_name: null,
      },
    ]);
    expect(await repo.listRowsForTrip(other.id)).toEqual([]);

    // A copy is a tour of its own: every column comes along but the revision, which starts again at 1.
    await repo.advanceRevision(source.id);
    const [advanced] = await repo.listRowsForTrip(trip.id);
    expect(advanced.revision).toBe(2);
    const copy = createPlace(testDb, other.id);
    const { place_id: _sourceId, ...columns } = advanced;
    await repo.insertCopy(copy.id, columns, new Map());
    expect(await repo.listRowsForTrip(other.id)).toEqual([{ ...advanced, place_id: copy.id, revision: 1 }]);
  });

  it('TOURREPO-012: advanceRevision raises the revision, only from the one expected, and revisionOf reads it (P2C-03)', async () => {
    const { trip } = fixture();
    const place = createPlace(testDb, trip.id);
    createTour(testDb, place.id);
    expect(await repo.revisionOf(place.id)).toBe(1);
    expect(await repo.advanceRevision(place.id)).toBe(2);
    expect(await repo.advanceRevision(place.id, 2)).toBe(3);
    // A write based on a revision the tour has left changes nothing.
    expect(await repo.advanceRevision(place.id, 2)).toBeNull();
    expect(await repo.revisionOf(place.id)).toBe(3);
    expect(await repo.advanceRevision(place.id, null)).toBe(4);
    const plain = createPlace(testDb, trip.id);
    expect(await repo.advanceRevision(plain.id)).toBeNull();
    expect(await repo.revisionOf(plain.id)).toBeUndefined();
  });

  it('TOURREPO-009: insertCopy points a planned tour at the copied import, and drops a link the copy has no import for', async () => {
    const { trip, other } = fixture();
    const sourceImport = createPlace(testDb, trip.id);
    const planned = createPlace(testDb, trip.id);
    createTour(testDb, planned.id);
    const [row] = await repo.listRowsForTrip(trip.id);
    const { place_id: _sourceId, ...columns } = { ...row, derived_from_place_id: sourceImport.id };
    const copiedImport = createPlace(testDb, other.id);
    const copy = createPlace(testDb, other.id);
    const orphan = createPlace(testDb, other.id);

    await repo.insertCopy(copy.id, columns, new Map([[sourceImport.id, copiedImport.id]]));
    await repo.insertCopy(orphan.id, columns, new Map());

    const copied = await repo.listRowsForTrip(other.id);
    expect(copied.find((r) => r.place_id === copy.id)?.derived_from_place_id).toBe(copiedImport.id);
    expect(copied.find((r) => r.place_id === orphan.id)?.derived_from_place_id).toBeNull();
  });

  it('TOURREPO-010: findProvenance reads origin, file name, import record and the import it was planned from', async () => {
    const { trip, other } = fixture();
    const imported = createPlace(testDb, trip.id, { name: 'Ridge import' });
    await repo.insertTour({ ...METRICS, place_id: imported.id, origin: 'gpx', origin_file_name: 'ridge.gpx' });
    const planned = createPlace(testDb, trip.id, { name: 'Ridge planned' });
    await repo.insertTour({ ...METRICS, place_id: planned.id, derived_from_place_id: imported.id });
    const snapshot = createPlace(testDb, trip.id, { name: 'Gorge' });
    await repo.insertTour({
      ...METRICS,
      place_id: snapshot.id,
      origin: 'wanderer',
      wanderer_ref: 'https://w.example#t1',
    });
    await t.repo(TourSources).insertSource({
      place_id: snapshot.id,
      provider: 'wanderer',
      instance: 'https://w.example',
      external_id: 't1',
      external_url: 'https://w.example/trail/view/@me/t1',
      external_updated: '2026-10-01 08:00:00Z',
      content_hash: 'c.c.c',
      local_hash: 'l.l',
      imported_by: null,
    });

    expect(await repo.findProvenance(trip.id, imported.id)).toMatchObject({
      origin: 'gpx',
      origin_file_name: 'ridge.gpx',
      derived_from_place_id: null,
      derived_from_name: null,
      source_instance: null,
      has_recorded_track: 0,
    });
    expect(await repo.findProvenance(trip.id, planned.id)).toMatchObject({
      origin: 'trek',
      derived_from_place_id: imported.id,
      derived_from_name: 'Ridge import',
    });
    expect(await repo.findProvenance(trip.id, snapshot.id)).toMatchObject({
      origin: 'wanderer',
      source_instance: 'https://w.example',
      source_external_id: 't1',
      source_content_hash: 'c.c.c',
      source_local_hash: 'l.l',
      name: 'Gorge',
    });
    expect(await repo.findProvenance(other.id, snapshot.id)).toBeUndefined();
  });

  it('TOURREPO-011: copySource copies the import record onto the copied tour, and nothing for a tour without one', async () => {
    const { trip, other } = fixture();
    const snapshot = createPlace(testDb, trip.id);
    await repo.insertTour({ ...METRICS, place_id: snapshot.id, origin: 'wanderer' });
    await t.repo(TourSources).insertSource({
      place_id: snapshot.id,
      provider: 'wanderer',
      instance: 'https://w.example',
      external_id: 't1',
      external_url: null,
      external_updated: null,
      content_hash: 'c.c.c',
      local_hash: 'l.l',
      imported_by: null,
    });
    const planned = createPlace(testDb, trip.id);
    await repo.insertTour({ ...METRICS, place_id: planned.id });
    const copiedSnapshot = createPlace(testDb, other.id);
    await repo.insertTour({ ...METRICS, place_id: copiedSnapshot.id, origin: 'wanderer' });
    const copiedPlanned = createPlace(testDb, other.id);
    await repo.insertTour({ ...METRICS, place_id: copiedPlanned.id });

    await repo.copySource(snapshot.id, copiedSnapshot.id);
    await repo.copySource(planned.id, copiedPlanned.id);

    expect(await repo.findProvenance(other.id, copiedSnapshot.id)).toMatchObject({
      source_instance: 'https://w.example',
      source_external_id: 't1',
      source_content_hash: 'c.c.c',
    });
    expect((await repo.findProvenance(other.id, copiedPlanned.id))?.source_instance).toBeNull();
  });

  it('TOURREPO-025: a trip copy takes a tour’s packing link onto its copy, and nothing for a tour that had none', async () => {
    const { trip, other } = fixture();
    const linked = createPlace(testDb, trip.id);
    await repo.insertTour({ ...METRICS, place_id: linked.id });
    await linkTourPacking(t, linked.id, 'Hiking gear');
    const plain = createPlace(testDb, trip.id);
    await repo.insertTour({ ...METRICS, place_id: plain.id });
    const linkedCopy = createPlace(testDb, other.id);
    await repo.insertTour({ ...METRICS, place_id: linkedCopy.id });
    const plainCopy = createPlace(testDb, other.id);
    await repo.insertTour({ ...METRICS, place_id: plainCopy.id });

    await repo.copyPackingLink(linked.id, linkedCopy.id);
    await repo.copyPackingLink(plain.id, plainCopy.id);

    const source = await findRow(t, TourPackingLinks, { place: linked.id });
    expect(await findRow(t, TourPackingLinks, { place: linkedCopy.id })).toMatchObject({
      category: 'Hiking gear',
      linked_at: source?.linked_at,
    });
    expect(await countRows(t, TourPackingLinks, { place: plainCopy.id })).toBe(0);
  });
});
