/**
 * ToursService over the real migrated per-worker DB: the tours facet, its
 * ordered control points and the owning place are written through the Tours,
 * TourWaypoints and Places repositories inside one UnitOfWork transaction, and
 * realtime events go out only after that transaction committed.
 *
 * PlacesService is a broadcast stub here; the GPX import path, which needs the
 * real PlacesService, is covered by tours.gpx.atomic.test.ts.
 */
import { db as testDb } from '../../../src/db/database';
import type { PlacesService } from '../../../src/nest/places/places.service';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createPlace, createTrip, createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestPlacesRepo, createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';
import { createTestToursRepo, createTestTourWaypointsRepo, createTour } from '../../helpers/tours-repos';
import { Logger, NotFoundException } from '@nestjs/common';
import { tourCreateRequestSchema, type TourCreateRequest } from '@trek/shared';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const request: TourCreateRequest = {
  name: 'Ridge walk',
  tour_type: 'hike',
  route_geometry: [
    [48, 11, 600],
    [48.01, 11.02, 650],
    [48.02, 11.04, 630],
  ],
  waypoints: [
    { lat: 48, lng: 11, role: 'start', sequence: 0 },
    { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
};

/** Two waypoints on the same sequence: the UNIQUE(place_id, sequence) index rejects the second one. */
const duplicateSequence = {
  ...request,
  waypoints: [request.waypoints[0], { ...request.waypoints[1], sequence: 0 }],
} as TourCreateRequest;

const broadcast = vi.fn();
let service: ToursService;
let tripId: string;
let otherTripId: string;

const count = (table: string) => (testDb.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeAll(async () => {
  service = new ToursService(
    await createTestUnitOfWork(testDb),
    { broadcast } as unknown as PlacesService,
    await createTestToursRepo(testDb),
    await createTestTourWaypointsRepo(testDb),
    await createTestPlacesRepo(testDb),
  );
});

beforeEach(async () => {
  resetTestDb(testDb);
  (await sharedTestOrm(testDb)).clear();
  broadcast.mockReset();
  const { user } = createUser(testDb);
  tripId = String(createTrip(testDb, user.id).id);
  otherTripId = String(createTrip(testDb, user.id).id);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  testDb.close();
});

describe('ToursService planner creation', () => {
  it('TOURS-SVC-001: atomically stores full geometry, derived metrics, and ordered control points', async () => {
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => {
      writeStates.push(testDb.inTransaction);
    });

    const result = await service.createTour(tripId, request, 'socket-1');

    const placeId = result.tour.place_id;
    const place = testDb.prepare('SELECT * FROM places WHERE id = ?').get(placeId) as Record<string, unknown>;
    const tour = testDb.prepare('SELECT * FROM tours WHERE place_id = ?').get(placeId) as Record<string, unknown>;
    const points = testDb
      .prepare('SELECT role, sequence FROM tour_waypoints WHERE place_id = ? ORDER BY sequence')
      .all(placeId);

    expect(place).toMatchObject({
      trip_id: Number(tripId),
      name: 'Ridge walk',
      lat: 48,
      lng: 11,
      transport_mode: 'walking',
    });
    expect(JSON.parse(String(place.route_geometry))).toEqual(request.route_geometry);
    expect(tour).toMatchObject({ tour_type: 'hike', match_confidence: 1, max_hiking_difficulty: 2 });
    expect(tour.distance).toBeGreaterThan(0);
    expect(tour.elevation_gain).toBe(50);
    expect(tour.elevation_loss).toBe(20);
    expect(tour.duration).toBe(60);
    expect(points).toEqual([
      { role: 'start', sequence: 0 },
      { role: 'end', sequence: 1 },
    ]);
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false, has_waypoints: true, caution: false });
    expect(result.waypoints).toEqual(request.waypoints);
    expect(broadcast).toHaveBeenNthCalledWith(1, tripId, 'tours:changed', { placeIds: [placeId] }, 'socket-1');
    expect(broadcast).toHaveBeenNthCalledWith(
      2,
      tripId,
      'place:created',
      { place: expect.objectContaining({ id: placeId }) },
      'socket-1',
    );
    expect(broadcast).toHaveBeenCalledTimes(2);
    // Both events go out after the commit, never from inside the write.
    expect(writeStates).toEqual([false, false]);
  });

  it('TOURS-SVC-002: rolls the owning place and facet back when a waypoint insert fails', async () => {
    await expect(service.createTour(tripId, duplicateSequence)).rejects.toThrow();

    expect(count('places')).toBe(0);
    expect(count('tours')).toBe(0);
    expect(count('tour_waypoints')).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-003: validates a fractional routed duration before the atomic create', async () => {
    const validated = tourCreateRequestSchema.parse({ ...request, duration_seconds: 3599.5 });

    const result = await service.createTour(tripId, validated);

    expect(count('places')).toBe(1);
    expect(count('tours')).toBe(1);
    expect(count('tour_waypoints')).toBe(2);
    expect(testDb.prepare('SELECT duration FROM tours').get()).toEqual({ duration: 60 });
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false });
  });

  it('TOURS-SVC-003b: stores no duration when the client sends none', async () => {
    const { duration_seconds: _omitted, ...withoutDuration } = request;
    const result = await service.createTour(tripId, withoutDuration);
    expect(result.tour.duration).toBeNull();
  });

  it('keeps a committed create successful when Tours invalidation publication fails', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementation((_tripId: string, event: string) => {
      if (event === 'tours:changed') throw new Error('transport unavailable');
    });

    const result = await service.createTour(tripId, request);

    expect(result.tour.name).toBe('Ridge walk');
    expect(count('places')).toBe(1);
    expect(count('tours')).toBe(1);
    expect(broadcast).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('keeps a committed create successful when the place notification fails', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementation((_tripId: string, event: string) => {
      if (event === 'place:created') throw new Error('transport unavailable');
    });

    await expect(service.createTour(tripId, request)).resolves.toMatchObject({ tour: { name: 'Ridge walk' } });
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('ToursService reads', () => {
  it('TOURS-SVC-004: loads only a trip-owned tour with its ordered control points', async () => {
    const created = await service.createTour(tripId, request);
    const placeId = String(created.tour.place_id);

    expect(await service.getTour(tripId, placeId)).toEqual(created);
    await expect(service.getTour(otherTripId, placeId)).rejects.toThrow('Tour not found');

    testDb.prepare('DELETE FROM tour_waypoints WHERE place_id = ?').run(created.tour.place_id);
    const legacyGpx = await service.getTour(tripId, placeId);
    expect(legacyGpx.tour.has_waypoints).toBe(false);
    expect(legacyGpx.waypoints).toEqual([
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
    ]);
    // The fallback is read-only: nothing was backfilled.
    expect(count('tour_waypoints')).toBe(0);
  });

  it('TOURS-SVC-004b: a plain place, a malformed id and a geometry-less tour', async () => {
    const plain = createPlace(testDb, Number(tripId), { name: 'Not a tour' });
    await expect(service.getTour(tripId, String(plain.id))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getTour(tripId, 'abc')).rejects.toThrow('Tour not found');
    await expect(service.getTour('abc', String(plain.id))).rejects.toThrow('Tour not found');

    const bare = createPlace(testDb, Number(tripId), { name: 'Bare import' });
    createTour(testDb, bare.id);
    const detail = await service.getTour(tripId, String(bare.id));
    expect(detail.tour).toMatchObject({ place_id: bare.id, has_waypoints: false });
    expect(detail.waypoints).toEqual([]);
  });

  it("TOURS-SVC-007: lists only this trip's tours, newest first, with the caution flag", async () => {
    const older = createPlace(testDb, Number(tripId), { name: 'Older' });
    const newer = createPlace(testDb, Number(tripId), { name: 'Newer' });
    const foreign = createPlace(testDb, Number(otherTripId), { name: 'Foreign' });
    createPlace(testDb, Number(tripId), { name: 'Plain place' });
    createTour(testDb, older.id, { created_at: '2026-01-01 10:00:00', match_confidence: 0.3 });
    createTour(testDb, newer.id, { created_at: '2026-02-01 10:00:00', match_confidence: 1 });
    createTour(testDb, foreign.id);

    const list = await service.listTours(tripId);

    expect(list.map((t) => t.name)).toEqual(['Newer', 'Older']);
    expect(list[0]).toMatchObject({ caution: false, planned: false, has_waypoints: false, tour_type: 'hike' });
    expect(list[1]).toMatchObject({ caution: true, match_confidence: 0.3 });
    expect(await service.listTours('not-a-number')).toEqual([]);
  });
});

describe('ToursService updates', () => {
  const update: TourCreateRequest = {
    ...request,
    name: 'Updated ridge walk',
    route_geometry: [
      [49, 12, 700],
      [49.02, 12.04, 760],
    ],
    waypoints: [
      { lat: 49, lng: 12, role: 'start', sequence: 0 },
      { lat: 49.01, lng: 12.02, role: 'via', sequence: 1 },
      { lat: 49.02, lng: 12.04, role: 'end', sequence: 2 },
    ],
    duration_seconds: 2700.5,
  };

  it('TOURS-SVC-005: atomically updates route data and replaces persisted control points', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => {
      writeStates.push(testDb.inTransaction);
    });

    const result = await service.updateTour(tripId, String(created.tour.place_id), update, 'socket-2');

    expect(result.tour).toMatchObject({ place_id: created.tour.place_id, name: 'Updated ridge walk' });
    expect(result.waypoints).toEqual(update.waypoints);
    expect(testDb.prepare('SELECT name, lat, lng, transport_mode FROM places').get()).toEqual({
      name: 'Updated ridge walk',
      lat: 49,
      lng: 12,
      transport_mode: 'walking',
    });
    expect(testDb.prepare('SELECT duration, elevation_gain, elevation_loss FROM tours').get()).toEqual({
      duration: 45,
      elevation_gain: 60,
      elevation_loss: 0,
    });
    expect(broadcast).toHaveBeenNthCalledWith(
      1,
      tripId,
      'tours:changed',
      { placeIds: [created.tour.place_id] },
      'socket-2',
    );
    expect(broadcast).toHaveBeenNthCalledWith(
      2,
      tripId,
      'place:updated',
      expect.objectContaining({ place: expect.objectContaining({ id: created.tour.place_id }) }),
      'socket-2',
    );
    expect(writeStates).toEqual([false, false]);
  });

  it('TOURS-SVC-006: rolls an invalid waypoint replacement back to the previous saved tour', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();

    await expect(
      service.updateTour(tripId, String(created.tour.place_id), { ...duplicateSequence, name: 'Must roll back' }),
    ).rejects.toThrow();

    expect(testDb.prepare('SELECT name FROM places').get()).toEqual({ name: 'Ridge walk' });
    expect((await service.getTour(tripId, String(created.tour.place_id))).waypoints).toEqual(request.waypoints);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-008: a tour of another trip is a 404 and stays untouched', async () => {
    const created = await service.createTour(otherTripId, request);
    broadcast.mockReset();

    await expect(service.updateTour(tripId, String(created.tour.place_id), update, 'socket')).rejects.toThrow(
      'Tour not found',
    );

    expect(testDb.prepare('SELECT trip_id, name FROM places WHERE id = ?').get(created.tour.place_id)).toEqual({
      trip_id: Number(otherTripId),
      name: 'Ridge walk',
    });
    expect((await service.getTour(otherTripId, String(created.tour.place_id))).waypoints).toEqual(request.waypoints);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-009: a plain place or a malformed id is a 404 without a write', async () => {
    const plain = createPlace(testDb, Number(tripId), { name: 'Plain' });

    await expect(service.updateTour(tripId, String(plain.id), update)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.updateTour(tripId, 'abc', update)).rejects.toThrow('Tour not found');
    await expect(service.updateTour('abc', String(plain.id), update)).rejects.toThrow('Tour not found');

    expect(testDb.prepare('SELECT name FROM places WHERE id = ?').get(plain.id)).toEqual({ name: 'Plain' });
    expect(count('tours')).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });
});
