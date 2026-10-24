/**
 * `TourWaypointsRepository`: TW1 (`listForPlace`), TW2 (`listForTrip`), TW2b (`listForPlaces`), TW3
 * (`insertForPlace`) and TW4 (`deleteForPlace`), with a leg that follows a
 * via ferrata's own line.
 */
import { TourWaypoints } from '../../../../src/db/entities/TourWaypoints.entity';
import type {
  TourWaypointRow,
  TourWaypointsRepository,
} from '../../../../src/db/repositories/TourWaypoints.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../../helpers/factories';
import { makePlace } from '../../../helpers/factories/places';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTour } from '../../../helpers/tours-repos';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourWaypointsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourWaypoints);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const ROUTE: TourWaypointRow[] = [
  { lat: 47.1, lng: 11.1, role: 'end', sequence: 2 },
  { lat: 47, lng: 11, role: 'start', sequence: 0 },
  { lat: 47.05, lng: 11.05, role: 'via', sequence: 1 },
];

function tourInTrip() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const place = createPlace(testDb, trip.id);
  createTour(testDb, place.id);
  return { trip, place };
}

describe('TourWaypointsRepository', () => {
  it('TWREPO-001: insertForPlace writes every point and listForPlace reads them back in route order', async () => {
    const { place } = tourInTrip();
    await repo.insertForPlace(place.id, ROUTE);
    expect(await repo.listForPlace(place.id)).toEqual([...ROUTE].sort((a, b) => a.sequence - b.sequence));
  });

  it('TWREPO-002: insertForPlace with no points writes nothing', async () => {
    const { place } = tourInTrip();
    await repo.insertForPlace(place.id, []);
    expect(await repo.listForPlace(place.id)).toEqual([]);
  });

  it('TWREPO-003: deleteForPlace clears one tour and leaves another alone', async () => {
    const first = tourInTrip();
    const second = tourInTrip();
    await repo.insertForPlace(first.place.id, ROUTE);
    await repo.insertForPlace(second.place.id, ROUTE);

    await repo.deleteForPlace(first.place.id);
    expect(await repo.listForPlace(first.place.id)).toEqual([]);
    expect(await repo.listForPlace(second.place.id)).toHaveLength(3);
  });

  it('TWREPO-004: listForTrip returns every waypoint of the trip with its place, ordered by place and sequence', async () => {
    const { trip, place } = tourInTrip();
    const other = tourInTrip();
    const second = createPlace(testDb, trip.id);
    createTour(testDb, second.id);
    await repo.insertForPlace(second.id, ROUTE.slice(0, 2));
    await repo.insertForPlace(place.id, ROUTE);
    await repo.insertForPlace(other.place.id, ROUTE);

    const rows = await repo.listForTrip(trip.id);
    expect(rows.map((r) => [r.place_id, r.sequence])).toEqual([
      [place.id, 0],
      [place.id, 1],
      [place.id, 2],
      [second.id, 0],
      [second.id, 2],
    ]);
    expect(rows[0]).toEqual({ place_id: place.id, lat: 47, lng: 11, role: 'start', sequence: 0 });
  });

  it('TWREPO-005: a fixed leg is stored with its waypoint and read back whole; routed legs carry none', async () => {
    const { trip, place } = tourInTrip();
    const fixed_leg = {
      kind: 'ferrata' as const,
      ref: 'way/23971675',
      name: 'Alpspitz Ferrata',
      geometry: [
        [47.4343, 11.0501],
        [47.432, 11.0485],
        [47.4295, 11.0478],
      ] as [number, number][],
    };
    await repo.insertForPlace(place.id, [
      { lat: 47.4387, lng: 11.0523, role: 'start', sequence: 0 },
      { lat: 47.4343, lng: 11.0501, role: 'via', sequence: 1, fixed_leg },
      { lat: 47.4295, lng: 11.0478, role: 'end', sequence: 2 },
    ]);

    const points = await repo.listForPlace(place.id);
    expect(points[1]).toEqual({ lat: 47.4343, lng: 11.0501, role: 'via', sequence: 1, fixed_leg });
    expect(points[0]).not.toHaveProperty('fixed_leg');
    expect(points[2]).not.toHaveProperty('fixed_leg');
    expect((await repo.listForTrip(trip.id))[1]).toEqual({ place_id: place.id, ...points[1] });
  });

  it('TWREPO-006: a stored fixed leg that no longer decodes reads as a routed leg', async () => {
    const { place } = tourInTrip();
    await repo.insertForPlace(place.id, [
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.1, lng: 11.1, role: 'end', sequence: 1 },
    ]);
    await t.em.nativeUpdate(TourWaypoints, { place: place.id, sequence: 0 }, { fixed_leg: '{"kind":"boat"}' });
    t.clear();
    expect((await repo.listForPlace(place.id))[0]).toEqual({ lat: 47, lng: 11, role: 'start', sequence: 0 });
  });

  it('TWREPO-007: a shaping point is stored as such and read back; a stop carries no flag (P2A-03)', async () => {
    const { place } = tourInTrip();
    await repo.insertForPlace(place.id, [
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.05, lng: 11.05, role: 'via', sequence: 1, shaping: true },
      { lat: 47.1, lng: 11.1, role: 'end', sequence: 2 },
    ]);
    const points = await repo.listForPlace(place.id);
    expect(points[1]).toEqual({ lat: 47.05, lng: 11.05, role: 'via', sequence: 1, shaping: true });
    expect(points[0]).not.toHaveProperty('shaping');
  });

  it('TWREPO-008: a point that stands for a place keeps it, and the place lists as linkable only in its own trip (PR1-10)', async () => {
    const { trip, place } = tourInTrip();
    const hut = createPlace(testDb, trip.id, { name: 'Hut' });
    const otherTour = createPlace(testDb, trip.id, { name: 'Other tour' });
    createTour(testDb, otherTour.id);
    const { user } = createUser(testDb);
    const elsewhere = createPlace(testDb, createTrip(testDb, user.id).id, { name: 'Elsewhere' });

    await repo.insertForPlace(place.id, [
      { lat: 47, lng: 11, role: 'start', sequence: 0, linked_place_id: hut.id },
      { lat: 47.1, lng: 11.1, role: 'end', sequence: 1 },
    ]);
    expect((await repo.listForPlace(place.id)).map((point) => point.linked_place_id ?? null)).toEqual([hut.id, null]);
    expect((await repo.listForTrip(trip.id))[0]).toMatchObject({ linked_place_id: hut.id });

    const linkable = await repo.linkablePlaceIds(trip.id, [hut.id, otherTour.id, elsewhere.id, 999_999, hut.id]);
    expect([...linkable]).toEqual([hut.id]);
    expect(await repo.linkablePlaceIds(trip.id, [])).toEqual(new Set());
    expect(await repo.placeNames(trip.id, [hut.id, elsewhere.id])).toEqual(new Map([[hut.id, 'Hut']]));
    expect(await repo.placeNames(trip.id, [])).toEqual(new Map());
  });

  it("TWREPO-009: a city walk's station keeps its key, name, stay, importance, protection and hours; a plain point carries none (CW-01 to CW-04)", async () => {
    const { trip, place } = tourInTrip();
    const station: TourWaypointRow = {
      lat: 48.1,
      lng: 11.5,
      role: 'start',
      sequence: 0,
      key: 'stop-cathedral',
      name: 'Cathedral',
      stay_minutes: 30,
      importance: 'must',
      protected: true,
      opening_hours: 'Mo-Su 09:00-18:00',
    };
    const passedThrough: TourWaypointRow = {
      lat: 48.11,
      lng: 11.51,
      role: 'via',
      sequence: 1,
      key: 'stop-bridge',
      stay_minutes: 0,
      importance: 'optional',
    };
    const plain: TourWaypointRow = { lat: 48.12, lng: 11.52, role: 'end', sequence: 2 };
    await repo.insertForPlace(place.id, [station, passedThrough, plain]);

    const points = await repo.listForPlace(place.id);
    expect(points).toEqual([station, passedThrough, plain]);
    for (const field of ['key', 'name', 'stay_minutes', 'importance', 'protected', 'opening_hours']) {
      expect(points[2]).not.toHaveProperty(field);
    }
    expect(points[1]).not.toHaveProperty('protected');
    expect(points[1]).not.toHaveProperty('name');
    expect(await repo.listForTrip(trip.id)).toEqual(points.map((point) => ({ place_id: place.id, ...point })));
  });
  it('TWREPO-011: a point taken in along the tour keeps the kind of place it was found as; a kind no longer known reads as none (PLN-03)', async () => {
    const { place } = tourInTrip();
    const restaurant: TourWaypointRow = {
      lat: 48.1,
      lng: 11.5,
      role: 'via',
      sequence: 1,
      name: 'Café Luitpold',
      poi_category: 'restaurant',
    };
    await repo.insertForPlace(place.id, [
      { lat: 48, lng: 11.4, role: 'start', sequence: 0 },
      restaurant,
      { lat: 48.2, lng: 11.6, role: 'end', sequence: 2 },
    ]);
    const points = await repo.listForPlace(place.id);
    expect(points[1]).toEqual(restaurant);
    expect(points[0]).not.toHaveProperty('poi_category');

    await t.em.nativeUpdate(TourWaypoints, { place: place.id, sequence: 1 }, { poi_category: 'spaceport' });
    t.clear();
    expect((await repo.listForPlace(place.id))[1]).not.toHaveProperty('poi_category');
  });

  it('TWREPO-012: a stop that ends a stage is stored as such and read back; the others carry no flag (MDT-01)', async () => {
    const { trip, place } = tourInTrip();
    await repo.insertForPlace(place.id, [
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.05, lng: 11.05, role: 'via', sequence: 1, stage_end: true },
      { lat: 47.1, lng: 11.1, role: 'end', sequence: 2 },
    ]);
    const points = await repo.listForPlace(place.id);
    expect(points[1]).toEqual({ lat: 47.05, lng: 11.05, role: 'via', sequence: 1, stage_end: true });
    expect(points[0]).not.toHaveProperty('stage_end');
    expect(points[2]).not.toHaveProperty('stage_end');
    // A trip copy reads the mark with the rest of the point.
    expect((await repo.listForTrip(trip.id))[1]).toMatchObject({ place_id: place.id, stage_end: true });
  });

  it('TWREPO-010: listForPlaces reads the waypoints of the tours asked for, by place and sequence, and none for none (CW-02)', async () => {
    const { trip, place } = tourInTrip();
    const second = await makePlace(t, trip.id);
    createTour(testDb, second.id);
    const unasked = await makePlace(t, trip.id);
    createTour(testDb, unasked.id);
    await repo.insertForPlace(second.id, [{ lat: 47.2, lng: 11.2, role: 'start', sequence: 0, stay_minutes: 30 }]);
    await repo.insertForPlace(place.id, ROUTE);
    await repo.insertForPlace(unasked.id, ROUTE);

    const rows = await repo.listForPlaces([second.id, place.id, second.id]);
    expect(rows.map((row) => [row.place_id, row.sequence])).toEqual([
      [place.id, 0],
      [place.id, 1],
      [place.id, 2],
      [second.id, 0],
    ]);
    expect(rows[3]).toEqual({
      place_id: second.id,
      lat: 47.2,
      lng: 11.2,
      role: 'start',
      sequence: 0,
      stay_minutes: 30,
    });
    expect(await repo.listForPlaces([])).toEqual([]);
  });
});
