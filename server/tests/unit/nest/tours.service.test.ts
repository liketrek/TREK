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
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
import type { PlacesService } from '../../../src/nest/places/places.service';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../helpers/factories';
import { countRows, deleteRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { noPaddleChecks } from '../../helpers/fake-paddle-checks';
import { tourStageDays } from '../../helpers/fake-tour-stage-days';
import { buildPlaceImportService } from '../../helpers/place-import';
import { resetTestDb } from '../../helpers/test-db';
import { createTestPlacesRepo, createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';
import { keyed } from '../../helpers/tour-keys';
import {
  createTestTourActivitiesRepo,
  createTestToursRepo,
  createTestTourStationVisitsRepo,
  createTestTourTypesRepo,
  createTestTourWaypointsRepo,
  createTour,
} from '../../helpers/tours-repos';
import type { EntityClass } from '@mikro-orm/core';
import { Logger, NotFoundException } from '@nestjs/common';
import { tourCreateRequestSchema, type TourCreateInput, type TourCreateRequest, type TourWaypoint } from '@trek/shared';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const request: TourCreateRequest = {
  name: 'Ridge walk',
  description: 'A quiet ridge above the lake.',
  website: 'https://www.komoot.com/tour/42',
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
    await createTestTourStationVisitsRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestTourActivitiesRepo(testDb),
    buildPlaceImportService(),
    noPaddleChecks(),
    tourStageDays(await createTestToursRepo(testDb)),
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
  it.each([
    'http://example.org/route',
    'javascript:alert(1)',
    'data:text/plain,route',
    'file:///route.gpx',
    'https://user:secret@example.org/route',
  ])('rejects invalid informational website %s before creating rows', async (website) => {
    const parsed = tourCreateRequestSchema.safeParse({ ...request, website });
    expect(parsed.success).toBe(false);
    await expect(service.createTour(tripId, { ...request, website } as TourCreateRequest)).rejects.toThrow();
    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
  });

  it('safely reports malformed website input through schema safeParse', () => {
    expect(tourCreateRequestSchema.safeParse({ ...request, website: 'not a url' }).success).toBe(false);
  });

  it('TOURS-SVC-001: atomically stores full geometry, derived metrics, and ordered control points', async () => {
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => {
      writeStates.push(testDb.inTransaction);
    });

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

    expect(place).toMatchObject({
      trip_id: Number(tripId),
      name: 'Ridge walk',
      lat: 48,
      lng: 11,
      transport_mode: 'walking',
      duration_minutes: 60,
    });
    expect(place).toMatchObject({
      description: 'A quiet ridge above the lake.',
      website: 'https://www.komoot.com/tour/42',
    });
    expect(JSON.parse(String(place.route_geometry))).toEqual(request.route_geometry);
    expect(tour).toMatchObject({
      tour_type: 'hike',
      match_confidence: 1,
      max_hiking_difficulty: 2,
      planned_duration_minutes: 90,
      break_additional_minutes: 25,
    });
    expect(tour.distance).toBeGreaterThan(0);
    expect(tour.elevation_gain).toBe(50);
    expect(tour.elevation_loss).toBe(20);
    expect(tour.duration).toBe(60);
    expect(result.tour.duration).toBe(60);
    expect(result.tour.planned_duration_minutes).toBe(90);
    expect(result.tour.break_additional_minutes).toBe(25);
    expect(points).toEqual([
      { role: 'start', sequence: 0 },
      { role: 'end', sequence: 1 },
    ]);
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false, has_waypoints: true, caution: false });
    expect(result.tour).toMatchObject({
      description: 'A quiet ridge above the lake.',
      website: 'https://www.komoot.com/tour/42',
    });
    expect(result.waypoints).toEqual(keyed(request.waypoints));
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

  it.each([-1, 1.5, 1441])('RS-02: rejects invalid breaks %s before writing Tour rows', async (breakMinutes) => {
    await expect(
      service.createTour(tripId, { ...request, break_additional_minutes: breakMinutes } as TourCreateRequest),
    ).rejects.toThrow();
    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
  });

  it('RS-02: rejects overlong automatic totals but permits a bounded manual override', async () => {
    const tooLong = {
      ...request,
      duration_seconds: 1430 * 60,
      break_additional_minutes: 11,
      planned_duration_minutes: null,
    };
    await expect(service.createTour(tripId, tooLong)).rejects.toThrow();
    const overridden = await service.createTour(tripId, { ...tooLong, planned_duration_minutes: 1200 });
    expect(overridden.tour.duration).toBe(1430);
    expect(overridden.tour.planned_duration_minutes).toBe(1200);
    expect(overridden.tour.break_additional_minutes).toBe(11);
  });

  it('TOURS-SVC-010: a type the catalogue holds but has not enabled is a 400 without a write', async () => {
    // The contract only lets `hike` through today; this pins what happens the
    // day it lets more keys in before the planner offers them.
    const bike = { ...request, tour_type: 'food' } as unknown as typeof request;

    // A DomainError: REST answers its text as { error } at 400, an MCP tool as its error result.
    const refusal = await catchDomainError(() => service.createTour(tripId, bike));
    expect(refusal instanceof DomainError && [refusal.getStatus(), refusal.publicMessage]).toEqual([
      400,
      'Tour type is not available',
    ]);

    expect(await count(Places)).toBe(0);
    expect(await count(Tours)).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-011: an edit to a disabled type is a 400 and leaves the saved tour alone', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();
    const bike = { ...request, name: 'Renamed', tour_type: 'food' } as unknown as typeof request;

    const refusal = await catchDomainError(() => service.updateTour(tripId, String(created.tour.place_id), bike));
    expect(refusal instanceof DomainError && [refusal.getStatus(), refusal.publicMessage]).toEqual([
      400,
      'Tour type is not available',
    ]);

    const storedTour = await firstTour();
    expect({ tour_type: storedTour.tour_type, name: (await placeById(Number(storedTour.place_id)))?.name }).toEqual({
      tour_type: 'hike',
      name: 'Ridge walk',
    });
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
    description: 'Updated description',
    website: 'https://alltrails.com/trail/42',
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
    planned_duration_minutes: 110,
    break_additional_minutes: 40,
  };

  it('TOURS-SVC-005: atomically updates route data and replaces persisted control points', async () => {
    const created = await service.createTour(tripId, request);
    await updateRows(await sharedTestOrm(testDb), Places, { id: created.tour.place_id }, { duration_minutes: 35 });
    broadcast.mockReset();
    const writeStates: boolean[] = [];
    broadcast.mockImplementation(() => {
      writeStates.push(testDb.inTransaction);
    });

    const result = await service.updateTour(tripId, String(created.tour.place_id), update, 'socket-2');

    expect(result.tour).toMatchObject({ place_id: created.tour.place_id, name: 'Updated ridge walk' });
    expect(result.waypoints).toEqual(keyed(update.waypoints));
    const storedPlace = await firstPlace();
    expect({
      name: storedPlace.name,
      description: storedPlace.description,
      website: storedPlace.website,
      lat: storedPlace.lat,
      lng: storedPlace.lng,
      transport_mode: storedPlace.transport_mode,
      duration_minutes: storedPlace.duration_minutes,
    }).toEqual({
      name: 'Updated ridge walk',
      description: 'Updated description',
      website: 'https://alltrails.com/trail/42',
      lat: 49,
      lng: 12,
      transport_mode: 'walking',
      duration_minutes: 35,
    });
    const storedTour = await firstTour();
    expect({
      duration: storedTour.duration,
      planned_duration_minutes: storedTour.planned_duration_minutes,
      elevation_gain: storedTour.elevation_gain,
      elevation_loss: storedTour.elevation_loss,
    }).toEqual({
      duration: 45,
      planned_duration_minutes: 110,
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

  it('preserves description and website when an older Tour update omits optional metadata', async () => {
    const created = await service.createTour(tripId, request);
    const {
      description: _description,
      website: _website,
      planned_duration_minutes: _planned,
      break_additional_minutes: _breaks,
      ...legacyUpdate
    } = update;

    const result = await service.updateTour(tripId, String(created.tour.place_id), legacyUpdate);

    expect(result.tour).toMatchObject({ description: request.description, website: request.website });
    expect(result.tour.planned_duration_minutes).toBe(request.planned_duration_minutes);
    expect(result.tour.break_additional_minutes).toBe(request.break_additional_minutes);
    expect(await findRow(await sharedTestOrm(testDb), Places, { id: created.tour.place_id })).toMatchObject({
      description: request.description,
      website: request.website,
    });
  });

  it('clears planned total duration only when an update explicitly sends null', async () => {
    const created = await service.createTour(tripId, request);
    const result = await service.updateTour(tripId, String(created.tour.place_id), {
      ...update,
      planned_duration_minutes: null,
    });
    expect(result.tour.duration).toBe(45);
    expect(result.tour.planned_duration_minutes).toBeNull();
  });

  it('RS-01: updates informational fields without overwriting Place or Wanderer provenance', async () => {
    const created = await service.createTour(tripId, request);
    await updateRows(
      await sharedTestOrm(testDb),
      Places,
      { id: created.tour.place_id },
      { source: 'gpx-import:source-42' },
    );
    await updateRows(
      await sharedTestOrm(testDb),
      Tours,
      { place: created.tour.place_id },
      { wanderer_ref: 'wanderer:trail-42' },
    );
    const metadataUpdate = { ...update, description: 'Updated details', website: 'https://outdooractive.com/route/42' };

    await service.updateTour(tripId, String(created.tour.place_id), metadataUpdate);

    expect(await findRow(await sharedTestOrm(testDb), Places, { id: created.tour.place_id })).toMatchObject({
      description: 'Updated details',
      website: 'https://outdooractive.com/route/42',
      source: 'gpx-import:source-42',
    });
    expect(await findRow(await sharedTestOrm(testDb), Tours, { place: created.tour.place_id })).toMatchObject({
      wanderer_ref: 'wanderer:trail-42',
    });
  });
  it('TOURS-SVC-006: rolls an invalid waypoint replacement back to the previous saved tour', async () => {
    const created = await service.createTour(tripId, request);
    broadcast.mockReset();

    await expect(
      service.updateTour(tripId, String(created.tour.place_id), { ...duplicateSequence, name: 'Must roll back' }),
    ).rejects.toThrow();

    expect((await firstPlace()).name).toBe('Ridge walk');
    expect((await service.getTour(tripId, String(created.tour.place_id))).waypoints).toEqual(keyed(request.waypoints));
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-008: a tour of another trip is a 404 and stays untouched', async () => {
    const created = await service.createTour(otherTripId, request);
    broadcast.mockReset();

    await expect(service.updateTour(tripId, String(created.tour.place_id), update, 'socket')).rejects.toThrow(
      'Tour not found',
    );

    const untouched = await placeById(Number(created.tour.place_id));
    expect({ trip_id: untouched?.trip_id, name: untouched?.name }).toEqual({
      trip_id: Number(otherTripId),
      name: 'Ridge walk',
    });
    expect((await service.getTour(otherTripId, String(created.tour.place_id))).waypoints).toEqual(
      keyed(request.waypoints),
    );
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

describe('ToursService restoring a recorded track (PR1-05B)', () => {
  const recorded = [
    [47.45, 11.1],
    [47.46, 11.11],
    [47.47, 11.12],
  ];

  /** A tour planned over in place: waypoints of its own, the import's line kept beside them. */
  async function plannedOverImport(
    fields: Partial<Pick<Tours, 'wanderer_ref' | 'difficulty' | 'recorded_route_geometry'>>,
  ) {
    const created = await service.createTour(tripId, request);
    const placeId = created.tour.place_id;
    await updateRows(
      await sharedTestOrm(testDb),
      Tours,
      { place: placeId },
      {
        recorded_route_geometry: JSON.stringify(recorded),
        ...fields,
      },
    );
    (await sharedTestOrm(testDb)).clear();
    broadcast.mockReset();
    return String(placeId);
  }

  it('PR1-05B-SVC-001: a GPX import gets its line back without heights or grade, and loses its waypoints', async () => {
    const placeId = await plannedOverImport({});
    broadcast.mockImplementation((_tripId: string, event: string) => {
      if (event === 'place:updated') throw new Error('socket closed');
    });
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const restored = await service.restoreRecordedTrack(tripId, placeId, 'socket');

    // Its stored waypoints are gone; the detail names the two ends from the line, as for any import.
    expect(await count(TourWaypoints)).toBe(0);
    expect(restored.waypoints.map((point) => point.role)).toEqual(['start', 'end']);
    expect(restored.tour).toMatchObject({ max_hiking_difficulty: null, has_recorded_track: false });
    const tour = await findRow(await sharedTestOrm(testDb), Tours, { place: Number(placeId) });
    expect(tour).toMatchObject({ match_confidence: 0.3, recorded_route_geometry: null });
    expect(JSON.parse(String((await placeById(Number(placeId)))?.route_geometry))).toEqual(recorded);
    expect(warn).toHaveBeenCalled();
  });

  it('PR1-05B-SVC-002: a wanderer import gets the grade its source gave, on the SAC scale', async () => {
    const placeId = await plannedOverImport({
      wanderer_ref: 'https://w.example#trail1',
      difficulty: 'difficult',
      recorded_route_geometry: JSON.stringify(recorded.map(([lat, lng], i) => [lat, lng, 700 + i * 50])),
    });
    const restored = await service.restoreRecordedTrack(tripId, placeId);
    expect(restored.tour).toMatchObject({ max_hiking_difficulty: 3 });
    expect(await findRow(await sharedTestOrm(testDb), Tours, { place: Number(placeId) })).toMatchObject({
      match_confidence: 1,
    });
    expect(broadcast).toHaveBeenCalledWith(tripId, 'tours:changed', { placeIds: [Number(placeId)] }, undefined);
  });

  it('PR1-05B-SVC-003: no kept track, or an empty one, is a 409 that changes nothing', async () => {
    const created = await service.createTour(tripId, request);
    const placeId = String(created.tour.place_id);
    const refusal = { status: 409, details: { code: 'no_recorded_track' } };
    await expect(service.restoreRecordedTrack(tripId, placeId)).rejects.toMatchObject(refusal);

    await updateRows(
      await sharedTestOrm(testDb),
      Tours,
      { place: created.tour.place_id },
      { recorded_route_geometry: '[]' },
    );
    (await sharedTestOrm(testDb)).clear();
    await expect(service.restoreRecordedTrack(tripId, placeId)).rejects.toMatchObject(refusal);
    expect((await service.getTour(tripId, placeId)).waypoints).toEqual(keyed(request.waypoints));
  });

  it('PR1-05B-SVC-004: a plain place, a tour of another trip or a malformed id is a 404', async () => {
    const plain = createPlace(testDb, Number(tripId), { name: 'Plain' });
    const foreign = await service.createTour(otherTripId, request);
    await expect(service.restoreRecordedTrack(tripId, String(plain.id))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restoreRecordedTrack(tripId, String(foreign.tour.place_id))).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.restoreRecordedTrack('abc', '1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restoreRecordedTrack(tripId, 'abc')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ToursService runs (RUN-01)', () => {
  const run = {
    ...request,
    tour_type: 'run' as const,
    max_hiking_difficulty: null,
    run_profile: 'running' as const,
    run_pace_seconds_per_km: 360,
  };

  it('TOURS-SVC-012: a run keeps its profile and pace, and a hike made of it keeps neither', async () => {
    const created = await service.createTour(tripId, run);
    expect(created.tour).toMatchObject({ tour_type: 'run', run_profile: 'running', run_pace_seconds_per_km: 360 });
    expect(await firstTour()).toMatchObject({ run_profile: 'running', run_pace_seconds_per_km: 360 });

    const placeId = String(created.tour.place_id);
    const hike = await service.updateTour(tripId, placeId, { ...request, max_hiking_difficulty: 2 });
    expect(hike.tour).toMatchObject({ tour_type: 'hike', run_profile: null, run_pace_seconds_per_km: null });
  });

  it('TOURS-SVC-013: a run without a pace stores none, and a copy and a restored import keep what the run has', async () => {
    const created = await service.createTour(tripId, { ...run, run_pace_seconds_per_km: null });
    expect(created.tour.run_pace_seconds_per_km).toBeNull();
    const placeId = String(created.tour.place_id);
    await service.updateTour(tripId, placeId, run);

    const copy = await service.copyTour(tripId, placeId, 'Again');
    expect(copy.tour).toMatchObject({ tour_type: 'run', run_profile: 'running', run_pace_seconds_per_km: 360 });

    await updateRows(
      await sharedTestOrm(testDb),
      Tours,
      { place: Number(placeId) },
      {
        recorded_route_geometry: JSON.stringify([
          [47.45, 11.1],
          [47.46, 11.11],
        ]),
      },
    );
    (await sharedTestOrm(testDb)).clear();
    const restored = await service.restoreRecordedTrack(tripId, placeId);
    expect(restored.tour).toMatchObject({ tour_type: 'run', run_profile: 'running', run_pace_seconds_per_km: 360 });
  });
});

describe('ToursService multi-day tours (MDT-01)', () => {
  /** Hut to hut over three days: two stops between start and end each end a stage. */
  const hutToHut: TourCreateRequest = {
    ...request,
    planned_duration_minutes: null,
    break_additional_minutes: 60,
    duration_seconds: 30 * 3600,
    route_geometry: [
      [48, 11, 600],
      [48.01, 11.02, 650],
      [48.02, 11.04, 630],
      [48.03, 11.06, 700],
    ],
    waypoints: [
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.01, lng: 11.02, role: 'via', sequence: 1, stage_end: true },
      { lat: 48.02, lng: 11.04, role: 'via', sequence: 2, stage_end: true },
      { lat: 48.03, lng: 11.06, role: 'end', sequence: 3 },
    ],
  };

  it('MDT-SVC-001: keeps the stage ends with their stops and lists the stages, a day tour none', async () => {
    const created = await service.createTour(tripId, hutToHut);
    expect(created.tour.stage_count).toBe(3);
    expect(created.waypoints.map((point) => point.stage_end ?? false)).toEqual([false, true, true, false]);
    const dayTour = await service.createTour(tripId, request);
    expect(dayTour.tour.stage_count).toBeNull();
    const listed = new Map((await service.listTours(tripId)).map((tour) => [tour.place_id, tour.stage_count]));
    expect(listed.get(created.tour.place_id)).toBe(3);
    expect(listed.get(dayTour.tour.place_id)).toBeNull();
  });

  it('MDT-SVC-002: an edit moves, joins and drops stages with the points it saves', async () => {
    const created = await service.createTour(tripId, hutToHut);
    const placeId = String(created.tour.place_id);
    const joined = hutToHut.waypoints.map(({ stage_end: _end, ...point }, index) =>
      index === 2 ? { ...point, stage_end: true } : point,
    );
    const edited = await service.updateTour(tripId, placeId, { ...hutToHut, waypoints: joined });
    expect(edited.tour.stage_count).toBe(2);
    expect(edited.waypoints.map((point) => point.stage_end ?? false)).toEqual([false, false, true, false]);
    const oneDay = await service.updateTour(tripId, placeId, { ...request, waypoints: request.waypoints });
    expect(oneDay.tour.stage_count).toBeNull();
    expect(await countRows(await sharedTestOrm(testDb), TourWaypoints, { stage_end: 1 })).toBe(0);
  });

  it('MDT-SVC-003: holds a multi-day tour to a day a stage, and refuses a stage end out of place', async () => {
    const tooLong = { ...hutToHut, duration_seconds: 72 * 3600 };
    const refusal = await catchDomainError(() => service.createTour(tripId, tooLong));
    expect(refusal instanceof DomainError && refusal.publicMessage).toBe(
      'walking time plus breaks must be 4320 minutes or less, a day a stage, unless a total is overridden',
    );
    // A write that did not come through the contract is held to the same rule.
    const atStart = {
      ...hutToHut,
      waypoints: hutToHut.waypoints.map((point, index) => (index === 0 ? { ...point, stage_end: true } : point)),
    };
    const misplaced = await catchDomainError(() => service.createTour(tripId, atStart));
    expect(misplaced instanceof DomainError && [misplaced.getStatus(), misplaced.publicMessage]).toEqual([
      400,
      'a stage ends at a stop between start and end',
    ]);
    expect(await count(Tours)).toBe(0);
  });
});

describe('ToursService stages on days (MDT-02)', () => {
  /** Three days hut to hut: the stops at the second and third point end a stage. */
  const hutToHut: TourCreateRequest = {
    ...request,
    planned_duration_minutes: null,
    break_additional_minutes: 60,
    duration_seconds: 30 * 3600,
    route_geometry: [
      [48, 11, 600],
      [48.01, 11.02, 650],
      [48.02, 11.04, 630],
      [48.03, 11.06, 700],
    ],
    waypoints: [
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.01, lng: 11.02, role: 'via', sequence: 1, stage_end: true },
      { lat: 48.02, lng: 11.04, role: 'via', sequence: 2, stage_end: true },
      { lat: 48.03, lng: 11.06, role: 'end', sequence: 3 },
    ],
  };

  /** The tour saved, and each of its three stages on a day of its own. */
  async function onThreeDays() {
    const created = await service.createTour(tripId, hutToHut);
    const placeId = created.tour.place_id;
    const keys = created.waypoints.map((point) => String(point.key));
    const days = [1, 2, 3].map(() => createDay(testDb, Number(tripId)));
    const held = [0, 1, 2].map(
      (stage) => createDayAssignment(testDb, days[stage].id, placeId, { tour_stage_key: keys[stage] }).id,
    );
    broadcast.mockReset();
    return { created, placeId, keys, days, held };
  }

  /** An edit of the hut-to-hut tour as the API takes it: the points a read gave back go through the request contract. */
  const editOf = (overrides: Partial<TourCreateInput>) => tourCreateRequestSchema.parse({ ...hutToHut, ...overrides });

  const heldStages = async (placeId: number) =>
    (await findRows(await sharedTestOrm(testDb), DayAssignments, { place: placeId }, { id: 'asc' })).map(
      (row) => row.tour_stage_key,
    );

  it('MDT-SVC-004: lists the stops the stages run between, keyed, and none for a day tour', async () => {
    const created = await service.createTour(tripId, hutToHut);
    const keys = created.waypoints.map((point) => point.key);
    expect(created.tour.stage_stops).toEqual(
      hutToHut.waypoints.map((point, index) => ({ key: keys[index], lat: point.lat, lng: point.lng })),
    );
    const dayTour = await service.createTour(tripId, request);
    expect(dayTour.tour.stage_stops).toBeNull();
    const listed = new Map((await service.listTours(tripId)).map((tour) => [tour.place_id, tour.stage_stops]));
    expect(listed.get(created.tour.place_id)?.map((stop) => stop.key)).toEqual(keys);
    expect(listed.get(dayTour.tour.place_id)).toBeNull();
    expect((await service.getTour(tripId, String(created.tour.place_id))).tour.stage_stops).toHaveLength(4);
  });

  it('MDT-SVC-005: a saved change takes only the stages it took away off their days, and tells every client', async () => {
    const { created, placeId, keys, days, held } = await onThreeDays();
    // The third point no longer ends a stage: the stage that started there is gone, the others keep their keys.
    const joined: TourWaypoint[] = created.waypoints.map(({ stage_end: _end, ...point }, index) =>
      index === 1 ? { ...point, stage_end: true } : point,
    );
    await service.updateTour(tripId, String(placeId), editOf({ waypoints: joined }), 'socket');
    expect(await heldStages(placeId)).toEqual([keys[0], keys[1]]);
    expect(broadcast).toHaveBeenCalledWith(
      tripId,
      'assignment:deleted',
      { assignmentId: held[2], dayId: days[2].id },
      undefined,
    );
    // Back to a day tour, no day holds a stage of it any more.
    await service.updateTour(tripId, String(placeId), request);
    expect(await heldStages(placeId)).toEqual([]);
  });

  it('MDT-SVC-006: a change that keeps every stage leaves every day as it was and says nothing', async () => {
    const { created, placeId, keys } = await onThreeDays();
    const kept: TourWaypoint[] = created.waypoints;
    await service.updateTour(tripId, String(placeId), editOf({ name: 'Renamed', waypoints: kept }));
    expect(await heldStages(placeId)).toEqual(keys.slice(0, 3));
    expect(broadcast.mock.calls.filter(([, event]) => event === 'assignment:deleted')).toEqual([]);
  });

  it('MDT-SVC-007: going back to the recorded track takes every stage off its day', async () => {
    const { placeId } = await onThreeDays();
    await updateRows(
      await sharedTestOrm(testDb),
      Tours,
      { place: placeId },
      { recorded_route_geometry: JSON.stringify(hutToHut.route_geometry) },
    );
    (await sharedTestOrm(testDb)).clear();
    await service.restoreRecordedTrack(tripId, String(placeId));
    expect(await heldStages(placeId)).toEqual([]);
    expect(broadcast.mock.calls.filter(([, event]) => event === 'assignment:deleted')).toHaveLength(3);
  });

  it('MDT-SVC-008: a stage notice that cannot be sent never fails the saved change', async () => {
    const { created, placeId } = await onThreeDays();
    broadcast.mockImplementation((_tripId: string, event: string) => {
      if (event === 'assignment:deleted') throw new Error('socket closed');
    });
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const dayTour: TourWaypoint[] = created.waypoints.map(({ stage_end: _end, ...point }) => point);
    await expect(
      service.updateTour(tripId, String(placeId), editOf({ duration_seconds: 3600, waypoints: dayTour })),
    ).resolves.toMatchObject({ tour: { stage_count: null } });
    expect(await heldStages(placeId)).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
