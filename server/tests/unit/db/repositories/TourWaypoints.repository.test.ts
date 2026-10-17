/**
 * `TourWaypointsRepository`: TW1 (`listForPlace`), TW2 (`listForTrip`), TW3
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
});
