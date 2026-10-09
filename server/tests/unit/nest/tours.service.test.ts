/**
 * ToursService over the real migrated per-worker DB: the tours facet, its
 * ordered control points and the owning place are written through the Tours,
 * TourWaypoints and Places repositories inside one UnitOfWork transaction, and
 * realtime events go out only after that transaction committed.
 *
 * PlacesService is a broadcast stub here; the GPX import path, which needs the
 * real PlacesService, is covered by tours.gpx.atomic.test.ts.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { db as testDb } from '../../../src/db/database';
import { tourCreateRequestSchema, type TourCreateRequest } from '@trek/shared';
import { ToursService } from '../../../src/nest/tours/tours.service';
import type { PlacesService } from '../../../src/nest/places/places.service';
import { resetTestDb } from '../../helpers/test-db';
import { createPlace, createTrip, createUser } from '../../helpers/factories';
import { createTestPlacesRepo, createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';
import type { EntityClass } from '@mikro-orm/core';
import { countRows, deleteRows, findRow, findRows } from '../../helpers/factories/rows';
import { Places } from '../../../src/db/entities/Places.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { createTestToursRepo, createTestTourTypesRepo, createTestTourWaypointsRepo, createTour } from '../../helpers/tours-repos';

const request: TourCreateRequest = {
  name: 'Ridge walk',
  description: 'A quiet ridge above the lake.',
  website: 'https://www.komoot.com/tour/42',
  tour_type: 'hike',
  route_geometry: [[48, 11, 600], [48.01, 11.02, 650], [48.02, 11.04, 630]],
  waypoints: [
    { lat: 48, lng: 11, role: 'start', sequence: 0 },
    { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
  planned_duration_minutes: 90,
  break_additional_minutes: 25,
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

const count = async <T extends object>(entity: EntityClass<T>) => countRows(await sharedTestOrm(testDb), entity);

/** The first stored place and tour, the only ones most cases leave behind. */
const firstPlace = async () => (await findRows(await sharedTestOrm(testDb), Places, {}, { id: 'asc' }))[0];
const firstTour = async () => (await findRows(await sharedTestOrm(testDb), Tours, {}, { place: 'asc' }))[0];
const placeById = async (id: number) => findRow(await sharedTestOrm(testDb), Places, { id });

beforeAll(async () => {
  service = new ToursService(
    await createTestUnitOfWork(testDb),
    { broadcast } as unknown as PlacesService,
    await createTestToursRepo(testDb),
    await createTestTourTypesRepo(testDb),
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

afterEach(() => { vi.restoreAllMocks(); });

afterAll(() => { testDb.close(); });

describe('ToursService planner creation', () => {
  it.each([
    'http://example.org/route',
    'javascript:alert(1)',
    'data:text/plain,route',
    'file:///route.gpx',
    'https://user:secret@example.org/route',
  ])('rejects invalid informational website %s before creating rows', async website => {
    const parsed = tourCreateRequestSchema.safeParse({ ...request, website })
    expect(parsed.success).toBe(false)
    await expect(service.createTour(tripId, { ...request, website } as TourCreateRequest)).rejects.toThrow()
    expect(await count(Places)).toBe(0)
    expect(await count(Tours)).toBe(0)
  })

  it('safely reports malformed website input through schema safeParse', () => {
    expect(tourCreateRequestSchema.safeParse({ ...request, website: 'not a url' }).success).toBe(false)
  })

  it('TOURS-SVC-001: atomically stores full geometry, derived metrics, and ordered control points', async () => {
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => { writeStates.push(testDb.inTransaction); });

    const result = await service.createTour(tripId, request, 'socket-1');

    const placeId = result.tour.place_id;
    const orm = await sharedTestOrm(testDb);
    const place = await findRow(orm, Places, { id: placeId });
    const tour = await findRow(orm, Tours, { place: placeId });
    const points = (await findRows(orm, TourWaypoints, { place: placeId }, { sequence: 'asc' })).map((w) => ({
      role: w.role,
      sequence: w.sequence,
    }));
    if (!place || !tour) throw new Error('createTour should have stored the place and its tour');

    expect(place).toMatchObject({ trip_id: Number(tripId), name: 'Ridge walk', lat: 48, lng: 11, transport_mode: 'walking', duration_minutes: 60 });
    expect(place).toMatchObject({ description: 'A quiet ridge above the lake.', website: 'https://www.komoot.com/tour/42' });
    expect(JSON.parse(String(place.route_geometry))).toEqual(request.route_geometry);
    expect(tour).toMatchObject({ tour_type: 'hike', match_confidence: 1, max_hiking_difficulty: 2, planned_duration_minutes: 90, break_additional_minutes: 25 });
    expect(tour.distance).toBeGreaterThan(0);
    expect(tour.elevation_gain).toBe(50);
    expect(tour.elevation_loss).toBe(20);
    expect(tour.duration).toBe(60);
    expect(result.tour.duration).toBe(60);
    expect(result.tour.planned_duration_minutes).toBe(90);
    expect(result.tour.break_additional_minutes).toBe(25);
    expect(points).toEqual([{ role: 'start', sequence: 0 }, { role: 'end', sequence: 1 }]);
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false, has_waypoints: true, caution: false });
    expect(result.tour).toMatchObject({ description: 'A quiet ridge above the lake.', website: 'https://www.komoot.com/tour/42' });
    expect(result.waypoints).toEqual(request.waypoints);
    expect(broadcast).toHaveBeenNthCalledWith(1, tripId, 'tours:changed', { placeIds: [placeId] }, 'socket-1');
    expect(broadcast).toHaveBeenNthCalledWith(2, tripId, 'place:created', { place: expect.objectContaining({ id: placeId }) }, 'socket-1');
    expect(broadcast).toHaveBeenCalledTimes(2);
    // Both events go out after the commit, never from inside the write.
    expect(writeStates).toEqual([false, false]);
  });

  it('TOURS-SVC-002: rolls the owning place and facet back when a waypoint insert fails', async () => {
    await expect(service.createTour(tripId, duplicateSequence)).rejects.toThrow();

    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
    expect(await count(TourWaypoints)).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-003: validates a fractional routed duration before the atomic create', async () => {
    const validated = tourCreateRequestSchema.parse({ ...request, duration_seconds: 3599.5 });

    const result = await service.createTour(tripId, validated);

    expect(await count(Places)).toBe(1);
    expect(await count(Tours)).toBe(1);
    expect(await count(TourWaypoints)).toBe(2);
    expect((await firstTour()).duration).toBe(60);
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false });
  });

  it('TOURS-SVC-003b: stores no duration when the client sends none', async () => {
    const { duration_seconds: _omitted, ...withoutDuration } = request;
    const result = await service.createTour(tripId, withoutDuration);
    expect(result.tour.duration).toBeNull();
  });

  it('RS-02: leaves planned total empty when omitted and preserves the calculated duration', async () => {
    const { planned_duration_minutes: _omitted, ...withoutPlannedDuration } = request;
    const result = await service.createTour(tripId, withoutPlannedDuration);
    expect(result.tour.duration).toBe(60);
    expect(result.tour.planned_duration_minutes).toBeNull();
  });

  it.each([-1, 1.5, 1441])('RS-02: rejects invalid breaks %s before writing Tour rows', async breakMinutes => {
    await expect(service.createTour(tripId, { ...request, break_additional_minutes: breakMinutes } as TourCreateRequest)).rejects.toThrow();
    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
  });

  it('RS-02: rejects overlong automatic totals but permits a bounded manual override', async () => {
    const tooLong = { ...request, duration_seconds: 1430 * 60, break_additional_minutes: 11, planned_duration_minutes: null };
    await expect(service.createTour(tripId, tooLong)).rejects.toThrow();
    const overridden = await service.createTour(tripId, { ...tooLong, planned_duration_minutes: 1200 });
    expect(overridden.tour.duration).toBe(1430);
    expect(overridden.tour.planned_duration_minutes).toBe(1200);
    expect(overridden.tour.break_additional_minutes).toBe(11);
  });

  it('TOURS-SVC-010: a type the catalogue holds but has not enabled is a 400 without a write', async () => {
    // The contract only lets `hike` through today; this pins what happens the
    // day it lets more keys in before the planner offers them.
    const bike = { ...request, tour_type: 'bike' } as unknown as typeof request;

    await expect(service.createTour(tripId, bike)).rejects.toBeInstanceOf(BadRequestException);

    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-011: an edit to a disabled type is a 400 and leaves the saved tour alone', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();
    const bike = { ...request, name: 'Renamed', tour_type: 'bike' } as unknown as typeof request;

    await expect(service.updateTour(tripId, String(created.tour.place_id), bike)).rejects.toBeInstanceOf(BadRequestException);

    const storedTour = await firstTour();
    expect({ tour_type: storedTour.tour_type, name: (await placeById(Number(storedTour.place_id)))?.name })
      .toEqual({ tour_type: 'hike', name: 'Ridge walk' });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('keeps a committed create successful when Tours invalidation publication fails', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementation((_tripId: string, event: string) => {
      if (event === 'tours:changed') throw new Error('transport unavailable');
    });

    const result = await service.createTour(tripId, request);

    expect(result.tour.name).toBe('Ridge walk');
    expect(await count(Places)).toBe(1);
    expect(await count(Tours)).toBe(1);
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

    await deleteRows(await sharedTestOrm(testDb), TourWaypoints, { place: created.tour.place_id });
    const legacyGpx = await service.getTour(tripId, placeId);
    expect(legacyGpx.tour.has_waypoints).toBe(false);
    expect(legacyGpx.waypoints).toEqual([
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
    ]);
    // The fallback is read-only: nothing was backfilled.
    expect(await count(TourWaypoints)).toBe(0);
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

  it('TOURS-SVC-007: lists only this trip\'s tours, newest first, with the caution flag', async () => {
    const older = createPlace(testDb, Number(tripId), { name: 'Older' });
    const newer = createPlace(testDb, Number(tripId), { name: 'Newer' });
    const foreign = createPlace(testDb, Number(otherTripId), { name: 'Foreign' });
    createPlace(testDb, Number(tripId), { name: 'Plain place' });
    createTour(testDb, older.id, { created_at: '2026-01-01 10:00:00', match_confidence: 0.3 });
    createTour(testDb, newer.id, { created_at: '2026-02-01 10:00:00', match_confidence: 1 });
    createTour(testDb, foreign.id);

    const list = await service.listTours(tripId);

    expect(list.map(t => t.name)).toEqual(['Newer', 'Older']);
    expect(list[0]).toMatchObject({ caution: false, planned: false, has_waypoints: false, tour_type: 'hike' });
    expect(list[1]).toMatchObject({ caution: true, match_confidence: 0.3 });
    expect(await service.listTours('not-a-number')).toEqual([]);
  });
});

describe('ToursService updates', () => {
  const update: TourCreateRequest = {
    ...request,
    name: 'Updated ridge walk',
    description: 'Updated description',
    website: 'https://alltrails.com/trail/42',
    route_geometry: [[49, 12, 700], [49.02, 12.04, 760]],
    waypoints: [
      { lat: 49, lng: 12, role: 'start', sequence: 0 },
      { lat: 49.01, lng: 12.02, role: 'via', sequence: 1 },
      { lat: 49.02, lng: 12.04, role: 'end', sequence: 2 },
    ],
    duration_seconds: 2700.5,
    planned_duration_minutes: 110,
    break_additional_minutes: 40,
  };

  it('TOURS-SVC-005: atomically updates route data and replaces persisted control points', async () => {
    const created = await service.createTour(tripId, request);
    testDb.prepare('UPDATE places SET duration_minutes = 35 WHERE id = ?').run(created.tour.place_id)
    broadcast.mockReset();
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => { writeStates.push(testDb.inTransaction); });

    const result = await service.updateTour(tripId, String(created.tour.place_id), update, 'socket-2');

    expect(result.tour).toMatchObject({ place_id: created.tour.place_id, name: 'Updated ridge walk' });
    expect(result.waypoints).toEqual(update.waypoints);
    const storedPlace = await firstPlace();
    expect({ name: storedPlace.name, description: storedPlace.description, website: storedPlace.website, lat: storedPlace.lat, lng: storedPlace.lng, transport_mode: storedPlace.transport_mode, duration_minutes: storedPlace.duration_minutes }).toEqual({
      name: 'Updated ridge walk', description: 'Updated description', website: 'https://alltrails.com/trail/42', lat: 49, lng: 12, transport_mode: 'walking', duration_minutes: 35,
    });
    const storedTour = await firstTour();
    expect({ duration: storedTour.duration, planned_duration_minutes: storedTour.planned_duration_minutes, elevation_gain: storedTour.elevation_gain, elevation_loss: storedTour.elevation_loss }).toEqual({
      duration: 45, planned_duration_minutes: 110, elevation_gain: 60, elevation_loss: 0,
    });
    expect(broadcast).toHaveBeenNthCalledWith(1, tripId, 'tours:changed', { placeIds: [created.tour.place_id] }, 'socket-2');
    expect(broadcast).toHaveBeenNthCalledWith(2,
      tripId, 'place:updated', expect.objectContaining({ place: expect.objectContaining({ id: created.tour.place_id }) }), 'socket-2',
    );
    expect(writeStates).toEqual([false, false]);
  });

  it('preserves description and website when an older Tour update omits optional metadata', async () => {
    const created = await service.createTour(tripId, request);
    const { description: _description, website: _website, planned_duration_minutes: _planned, break_additional_minutes: _breaks, ...legacyUpdate } = update;

    const result = await service.updateTour(tripId, String(created.tour.place_id), legacyUpdate);

    expect(result.tour).toMatchObject({ description: request.description, website: request.website });
    expect(result.tour.planned_duration_minutes).toBe(request.planned_duration_minutes);
    expect(result.tour.break_additional_minutes).toBe(request.break_additional_minutes);
    expect(testDb.prepare('SELECT description, website FROM places WHERE id = ?').get(created.tour.place_id))
      .toEqual({ description: request.description, website: request.website });
  });

  it('clears planned total duration only when an update explicitly sends null', async () => {
    const created = await service.createTour(tripId, request);
    const result = await service.updateTour(tripId, String(created.tour.place_id), { ...update, planned_duration_minutes: null });
    expect(result.tour.duration).toBe(45);
    expect(result.tour.planned_duration_minutes).toBeNull();
  });

  it('RS-01: updates informational fields without overwriting Place or Wanderer provenance', async () => {
    const created = await service.createTour(tripId, request)
    testDb.prepare('UPDATE places SET source = ? WHERE id = ?').run('gpx-import:source-42', created.tour.place_id)
    testDb.prepare('UPDATE tours SET wanderer_ref = ? WHERE place_id = ?').run('wanderer:trail-42', created.tour.place_id)
    const metadataUpdate = { ...update, description: 'Updated details', website: 'https://outdooractive.com/route/42' }

    await service.updateTour(tripId, String(created.tour.place_id), metadataUpdate)

    expect(testDb.prepare('SELECT description, website, source FROM places WHERE id = ?').get(created.tour.place_id))
      .toEqual({ description: 'Updated details', website: 'https://outdooractive.com/route/42', source: 'gpx-import:source-42' })
    expect(testDb.prepare('SELECT wanderer_ref FROM tours WHERE place_id = ?').get(created.tour.place_id))
      .toEqual({ wanderer_ref: 'wanderer:trail-42' })
  })
  it('TOURS-SVC-006: rolls an invalid waypoint replacement back to the previous saved tour', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();

    await expect(service.updateTour(tripId, String(created.tour.place_id), { ...duplicateSequence, name: 'Must roll back' })).rejects.toThrow();

    expect((await firstPlace()).name).toBe('Ridge walk');
    expect((await service.getTour(tripId, String(created.tour.place_id))).waypoints).toEqual(request.waypoints);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-008: a tour of another trip is a 404 and stays untouched', async () => {
    const created = await service.createTour(otherTripId, request);
    broadcast.mockReset();

    await expect(service.updateTour(tripId, String(created.tour.place_id), update, 'socket')).rejects.toThrow('Tour not found');

    const untouched = await placeById(Number(created.tour.place_id));
    expect({ trip_id: untouched?.trip_id, name: untouched?.name })
      .toEqual({ trip_id: Number(otherTripId), name: 'Ridge walk' });
    expect((await service.getTour(otherTripId, String(created.tour.place_id))).waypoints).toEqual(request.waypoints);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-009: a plain place or a malformed id is a 404 without a write', async () => {
    const plain = createPlace(testDb, Number(tripId), { name: 'Plain' });

    await expect(service.updateTour(tripId, String(plain.id), update)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.updateTour(tripId, 'abc', update)).rejects.toThrow('Tour not found');
    await expect(service.updateTour('abc', String(plain.id), update)).rejects.toThrow('Tour not found');

    expect((await placeById(plain.id))?.name).toBe('Plain');
    expect(await count(Tours)).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });
});
