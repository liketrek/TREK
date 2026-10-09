/**
 * ToursService write contracts against stubbed repositories and a stub
 * UnitOfWork (the budget.service.test.ts pattern): which repository call runs
 * with which arguments, and that every write runs inside the transaction while
 * the read-back and the broadcasts run after it. Rollback against a real
 * SQLite database is covered by tours.service.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const { legacyDatabaseAccess } = vi.hoisted(() => ({
  legacyDatabaseAccess: vi.fn((property: string | symbol): never => {
    throw new Error(`Unexpected legacy database access: ${String(property)}`);
  }),
}));

vi.mock('../../../src/config', () => ({
  ENCRYPTION_KEY: 'test-only-inert-key',
  JWT_SECRET: 'test-only-inert-secret',
  updateJwtSecret: vi.fn(),
}));
vi.mock('../../../src/db/database', () => ({
  db: new Proxy({}, {
    get: (_target, property: string | symbol) => legacyDatabaseAccess(property),
  }),
}));
vi.mock('../../../src/nest/places/places.service', () => ({ PlacesService: class {} }));

import { ToursService } from '../../../src/nest/tours/tours.service';
import { tourCreateRequestSchema, type TourCreateRequest } from '@trek/shared';
import type { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import type { PlacesService } from '../../../src/nest/places/places.service';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { TourTypesRepository } from '../../../src/db/repositories/TourTypes.repository';
import type { ToursRepository } from '../../../src/db/repositories/Tours.repository';
import type { TourWaypointsRepository } from '../../../src/db/repositories/TourWaypoints.repository';

const request: TourCreateRequest = {
  name: 'Ridge walk',
  tour_type: 'hike',
  route_geometry: [[48, 11, 600], [48.01, 11.02, 650], [48.02, 11.04, 630]],
  waypoints: [
    { lat: 48, lng: 11, role: 'start', sequence: 0 },
    { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
};

function makeService() {
  const row = {
    place_id: 42, name: request.name, tour_type: 'hike', distance: 3,
    elevation_gain: 50, elevation_loss: 20, duration: 60, difficulty: null,
    wanderer_ref: null, match_confidence: 1,
    max_hiking_difficulty: 2, planned: 0, has_waypoints: 1,
  };
  const place = { id: 42, trip_id: 7 };
  let inTransaction = false;
  /** Records whether each write ran inside the transaction. */
  const inTx = <T>(value: T) => vi.fn(async (..._args: unknown[]) => { expect(inTransaction).toBe(true); return value; });

  const uow = {
    transactional: vi.fn(async <T>(fn: () => Promise<T>): Promise<T> => {
      inTransaction = true;
      try { return await fn(); } finally { inTransaction = false; }
    }),
  };
  const toursRepo = {
    findInTrip: vi.fn(async (): Promise<typeof row | undefined> => row),
    insertTour: inTx(undefined),
    updateInTrip: inTx(true),
  };
  const waypointsRepo = {
    listForPlace: vi.fn(async () => request.waypoints),
    insertForPlace: inTx(undefined),
    deleteForPlace: inTx(undefined),
  };
  const placesRepo = {
    insertTourPlace: inTx(42),
    updateTourRoute: inTx(true),
    findInTrip: vi.fn(async (): Promise<{ route_geometry: string | null } | undefined> => undefined),
    findWithTagsAndRatings: vi.fn(async () => {
      expect(inTransaction).toBe(false);
      return place;
    }),
  };
  const places = { broadcast: vi.fn(() => { expect(inTransaction).toBe(false); }) };
  const service = new ToursService(
    uow as unknown as UnitOfWork,
    places as unknown as PlacesService,
    toursRepo as unknown as ToursRepository,
    { isEnabled: vi.fn(async () => true) } as unknown as TourTypesRepository,
    waypointsRepo as unknown as TourWaypointsRepository,
    placesRepo as unknown as PlacesRepository,
  );
  return { uow, toursRepo, waypointsRepo, placesRepo, places, place, service };
}

describe('ToursService planner contracts (mock-only; SQLite rollback semantics are covered in tours.service.test.ts)', () => {
  let setup: ReturnType<typeof makeService>;
  beforeEach(() => { setup = makeService(); });

  it('does not access the legacy global database initializer', () => {
    expect(legacyDatabaseAccess).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-001: sends geometry, metrics, and ordered controls through one transaction', async () => {
    const result = await setup.service.createTour('7', request, 'socket-1');

    expect(setup.uow.transactional).toHaveBeenCalledOnce();
    expect(setup.placesRepo.insertTourPlace).toHaveBeenCalledExactlyOnceWith({
      trip_id: 7, name: request.name, lat: 48, lng: 11, route_geometry: JSON.stringify(request.route_geometry), description: request.description ?? null, website: request.website ?? null,
    });
    expect(setup.toursRepo.insertTour).toHaveBeenCalledExactlyOnceWith({
      place_id: 42, tour_type: 'hike', distance: expect.any(Number), elevation_gain: 50, elevation_loss: 20,
      duration: 60, planned_duration_minutes: null, break_additional_minutes: null, match_confidence: 1, max_hiking_difficulty: 2,
    });
    expect((setup.toursRepo.insertTour.mock.calls[0][0] as { distance: number }).distance).toBeGreaterThan(0);
    expect(setup.waypointsRepo.insertForPlace).toHaveBeenCalledExactlyOnceWith(42, request.waypoints);
    expect(setup.toursRepo.findInTrip).toHaveBeenCalledWith(7, 42);
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false, has_waypoints: true });
    expect(result.waypoints).toEqual(request.waypoints);
    expect(setup.places.broadcast).toHaveBeenNthCalledWith(1, '7', 'tours:changed', { placeIds: [42] }, 'socket-1');
    expect(setup.places.broadcast).toHaveBeenNthCalledWith(2, '7', 'place:created', { place: setup.place }, 'socket-1');
  });

  it('TOURS-SVC-002: propagates a waypoint failure without publishing or reading an uncommitted create', async () => {
    const failure = new Error('Injected waypoint failure');
    setup.waypointsRepo.insertForPlace.mockRejectedValueOnce(failure);

    await expect(setup.service.createTour('7', request)).rejects.toBe(failure);

    expect(setup.uow.transactional).toHaveBeenCalledOnce();
    expect(setup.toursRepo.findInTrip).not.toHaveBeenCalled();
    expect(setup.placesRepo.findWithTagsAndRatings).not.toHaveBeenCalled();
    expect(setup.places.broadcast).not.toHaveBeenCalled();
  });

  it('TOURS-SVC-003: validates and rounds a fractional routed duration before the create write', async () => {
    const validated = tourCreateRequestSchema.parse({ ...request, duration_seconds: 3599.5 });
    const result = await setup.service.createTour('7', validated);
    expect(setup.toursRepo.insertTour).toHaveBeenCalledWith(expect.objectContaining({ place_id: 42, duration: 60 }));
    expect(result.tour).toMatchObject({ name: 'Ridge walk', planned: false });
  });

  it('TOURS-SVC-004: scopes detail reads to the trip and derives legacy GPX controls without writes', async () => {
    expect((await setup.service.getTour('7', '42')).waypoints).toEqual(request.waypoints);
    expect(setup.toursRepo.findInTrip).toHaveBeenCalledWith(7, 42);
    expect(setup.waypointsRepo.listForPlace).toHaveBeenCalledWith(42);

    setup.toursRepo.findInTrip.mockResolvedValueOnce(undefined);
    setup.waypointsRepo.listForPlace.mockClear();
    await expect(setup.service.getTour('8', '42')).rejects.toThrow('Tour not found');
    expect(setup.waypointsRepo.listForPlace).not.toHaveBeenCalled();

    setup.waypointsRepo.listForPlace.mockResolvedValueOnce([]);
    setup.placesRepo.findInTrip.mockResolvedValueOnce({ route_geometry: JSON.stringify(request.route_geometry) });
    const legacyGpx = await setup.service.getTour('7', '42');
    expect(setup.placesRepo.findInTrip).toHaveBeenCalledWith(42, 7);
    expect(legacyGpx.waypoints).toEqual([
      { lat: 48, lng: 11, role: 'start', sequence: 0 },
      { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
    ]);
    for (const method of [
      setup.uow.transactional, setup.placesRepo.insertTourPlace, setup.placesRepo.updateTourRoute,
      setup.toursRepo.insertTour, setup.toursRepo.updateInTrip,
      setup.waypointsRepo.insertForPlace, setup.waypointsRepo.deleteForPlace, setup.places.broadcast,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
  });

  it('TOURS-SVC-005: updates route data and replaces controls through one transaction', async () => {
    const update: TourCreateRequest = {
      ...request,
      name: 'Updated ridge walk',
      route_geometry: [[49, 12, 700], [49.02, 12.04, 760]],
      waypoints: [
        { lat: 49, lng: 12, role: 'start', sequence: 0 },
        { lat: 49.01, lng: 12.02, role: 'via', sequence: 1 },
        { lat: 49.02, lng: 12.04, role: 'end', sequence: 2 },
      ],
      duration_seconds: 2700.5,
    };

    await setup.service.updateTour('7', '42', update, 'socket-2');

    expect(setup.uow.transactional).toHaveBeenCalledOnce();
    expect(setup.placesRepo.updateTourRoute).toHaveBeenCalledExactlyOnceWith(42, 7, {
      name: update.name, lat: 49, lng: 12, route_geometry: JSON.stringify(update.route_geometry),
      ...(update.description !== undefined ? { description: update.description } : {}),
      ...(update.website !== undefined ? { website: update.website } : {}),
    });
    expect(setup.toursRepo.updateInTrip).toHaveBeenCalledExactlyOnceWith(7, 42, {
      tour_type: 'hike', distance: expect.any(Number), elevation_gain: 60, elevation_loss: 0,
      duration: 45, match_confidence: 1, max_hiking_difficulty: 2,
    });
    expect(setup.waypointsRepo.deleteForPlace).toHaveBeenCalledExactlyOnceWith(42);
    expect(setup.waypointsRepo.insertForPlace).toHaveBeenCalledExactlyOnceWith(42, update.waypoints);
    expect(setup.waypointsRepo.deleteForPlace.mock.invocationCallOrder[0])
      .toBeLessThan(setup.waypointsRepo.insertForPlace.mock.invocationCallOrder[0]);
    expect(setup.places.broadcast).toHaveBeenCalledWith('7', 'place:updated', { place: setup.place }, 'socket-2');
  });

  it('TOURS-SVC-006: propagates a replacement failure without publishing or reloading', async () => {
    const failure = new Error('Injected replacement failure');
    setup.waypointsRepo.insertForPlace.mockRejectedValueOnce(failure);

    await expect(setup.service.updateTour('7', '42', request)).rejects.toBe(failure);

    expect(setup.uow.transactional).toHaveBeenCalledOnce();
    expect(setup.toursRepo.findInTrip).toHaveBeenCalledTimes(1);
    expect(setup.placesRepo.findWithTagsAndRatings).not.toHaveBeenCalled();
    expect(setup.places.broadcast).not.toHaveBeenCalled();
  });

  it.each([
    ['the tour lookup', 'findInTrip'],
    ['the trip-scoped place update', 'updateTourRoute'],
    ['the trip-scoped tour update', 'updateInTrip'],
  ] as const)('TOURS-SVC-010: a miss in %s is a 404 that stops the write', async (_label, step) => {
    if (step === 'findInTrip') setup.toursRepo.findInTrip.mockResolvedValueOnce(undefined);
    if (step === 'updateTourRoute') setup.placesRepo.updateTourRoute.mockResolvedValueOnce(false);
    if (step === 'updateInTrip') setup.toursRepo.updateInTrip.mockResolvedValueOnce(false);

    await expect(setup.service.updateTour('7', '42', request)).rejects.toBeInstanceOf(NotFoundException);

    // The existence check runs inside the write's own transaction (F44).
    expect(setup.uow.transactional).toHaveBeenCalledOnce();
    expect(setup.waypointsRepo.deleteForPlace).not.toHaveBeenCalled();
    expect(setup.waypointsRepo.insertForPlace).not.toHaveBeenCalled();
    expect(setup.places.broadcast).not.toHaveBeenCalled();
  });
});
