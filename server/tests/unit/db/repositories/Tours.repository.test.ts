/**
 * `ToursRepository`: the list/detail projection (TO1/TO2), the facet probes
 * places and assignments ask (TO3/TO4/TO5), the trip copy read and write
 * (TO6/TO8), and the create/edit writes (TO7/TO9).
 */
import { Places } from '../../../../src/db/entities/Places.entity';
import { TourSources } from '../../../../src/db/entities/TourSources.entity';
import { TourWaypoints } from '../../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../../src/db/entities/Tours.entity';
import type { ToursRepository } from '../../../../src/db/repositories/Tours.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { insertRow, updateRows } from '../../../helpers/factories/rows';
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
    });
  });

  // A route edit always writes the type's own fields; a hike's are empty.
  const HIKE_UPDATE = {
    ...METRICS,
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
      },
    ]);
    expect(await repo.listRowsForTrip(other.id)).toEqual([]);

    const copy = createPlace(testDb, other.id);
    const { place_id: _sourceId, ...columns } = rows[0];
    await repo.insertCopy(copy.id, columns, new Map());
    expect(await repo.listRowsForTrip(other.id)).toEqual([{ ...rows[0], place_id: copy.id }]);
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
});
