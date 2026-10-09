/**
 * Tours reuse the ordinary place and day-assignment endpoints for deletion and
 * planning, so their permissions are those endpoints' permissions: deleting a
 * tour needs 'place_edit' only, assigning or unassigning one needs 'day_edit'
 * only. Run through the real TripAccessGuard with mocked collaborators (no DB).
 * The last block pins ToursService's trip boundary on update against stubbed
 * repositories.
 */
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { HttpException, NotFoundException, RequestMethod, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { EntityManager } from '@mikro-orm/core';
import type { TourCreateRequest } from '@trek/shared';

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
vi.mock('../../../src/nest/permissions/permissions.service', () => ({ PermissionsService: class {} }));
vi.mock('../../../src/nest/places/places.service', () => ({ PlacesService: class {} }));
vi.mock('../../../src/nest/assignments/assignments.service', () => ({ AssignmentsService: class {} }));
vi.mock('../../../src/nest/app-config/runtime-env.service', () => ({ RuntimeEnvService: class {} }));
vi.mock('../../../src/nest/storage/storage.service', () => ({ StorageService: class {} }));
vi.mock('../../../src/nest/auth/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));

import { PlacesController } from '../../../src/nest/places/places.controller';
import { DayAssignmentsController } from '../../../src/nest/assignments/assignments.controller';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { TripAccessGuard, TRIP_PERMISSION_KEY } from '../../../src/nest/permissions/trip-access.guard';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { PlacesService } from '../../../src/nest/places/places.service';
import type { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { TourTypesRepository } from '../../../src/db/repositories/TourTypes.repository';
import type { ToursRepository } from '../../../src/db/repositories/Tours.repository';
import type { TourWaypointsRepository } from '../../../src/db/repositories/TourWaypoints.repository';
import type { User } from '../../../src/types';

const matrix = [[false, false], [true, false], [false, true], [true, true]] as const;

function authorization(controller: typeof PlacesController | typeof DayAssignmentsController, handler: 'create' | 'remove', canEdit: boolean, canAssign: boolean, tripId = '7') {
  const request = { params: { tripId }, user: { id: 2, role: 'user' } as User };
  const trip = { id: 7, user_id: 1 };
  const access = vi.fn(async (id: number, userId: number) => id === 7 && userId === 2 ? trip : undefined);
  const permission = vi.fn(async (action: string) => action === 'place_edit' ? canEdit : action === 'day_edit' && canAssign);
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => controller.prototype[handler],
    getClass: () => controller,
  } as unknown as ExecutionContext;
  const em = { getRepository: vi.fn(() => ({ findAccessible: access })) } as unknown as EntityManager;
  const guard = new TripAccessGuard(em, { checkPermission: permission } as unknown as PermissionsService, new Reflector());
  return { request, access, permission, context, guard };
}

async function rejected(action: () => Promise<unknown>, status: number) {
  await expect(action()).rejects.toMatchObject({ status });
}

function placesFixture() {
  const places = {
    get: vi.fn(async () => ({ id: 42, trip_id: 7 })),
    onDeleted: vi.fn(async () => {}),
    linkedExpenseIds: vi.fn(async () => []),
    remove: vi.fn(async () => ({ deleted: true, deletedTourPlaceIds: [42], cancelled: { reservationIds: [], budgetItemIds: [] } })),
    broadcast: vi.fn(),
  };
  const controller = new PlacesController(
    places as unknown as PlacesService, {} as RuntimeEnvService, {} as StorageService,
  );
  return { places, controller };
}

function assignmentsFixture() {
  const assignment = { id: 51, place_id: 42, day_id: 11 };
  const assignments = {
    dayExists: vi.fn(async () => true),
    placeExists: vi.fn(async () => true),
    assignmentExistsInDay: vi.fn(async () => true),
    createAssignment: vi.fn(async () => assignment),
    deleteAssignment: vi.fn(async () => {}),
    broadcast: vi.fn(),
    reconcile: vi.fn(async () => {}),
  };
  return { assignment, assignments, controller: new DayAssignmentsController(assignments as unknown as AssignmentsService) };
}

describe('Tours deletion and assignment authorization (mock-only)', () => {
  it('does not access the legacy global database initializer', () => {
    expect(legacyDatabaseAccess).not.toHaveBeenCalled();
  });

  it('keeps existing Places deletion and day assignment endpoints wired to their exact permissions', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PlacesController)).toBe('api/trips/:tripId/places');
    expect(Reflect.getMetadata(GUARDS_METADATA, PlacesController)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, PlacesController.prototype.remove)).toEqual([TripAccessGuard]);
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, PlacesController.prototype.remove)).toBe('place_edit');
    expect(Reflect.getMetadata(METHOD_METADATA, PlacesController.prototype.remove)).toBe(RequestMethod.DELETE);
    expect(Reflect.getMetadata(PATH_METADATA, PlacesController.prototype.remove)).toBe(':id');
    expect(Reflect.getMetadata(PATH_METADATA, DayAssignmentsController)).toBe('api/trips/:tripId/days/:dayId/assignments');
    expect(Reflect.getMetadata(GUARDS_METADATA, DayAssignmentsController)).toEqual([JwtAuthGuard, TripAccessGuard]);
    for (const handler of ['create', 'remove'] as const) {
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, DayAssignmentsController.prototype[handler])).toBe('day_edit');
    }
    expect(Reflect.getMetadata(METHOD_METADATA, DayAssignmentsController.prototype.create)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(METHOD_METADATA, DayAssignmentsController.prototype.remove)).toBe(RequestMethod.DELETE);
    expect(Reflect.getMetadata(PATH_METADATA, DayAssignmentsController.prototype.remove)).toBe(':id');
  });

  it.each(matrix)('edit=%s assign=%s: tour deletion requires only place_edit', async (canEdit, canAssign) => {
    const auth = authorization(PlacesController, 'remove', canEdit, canAssign);
    const { places, controller } = placesFixture();
    const invoke = async () => {
      await auth.guard.canActivate(auth.context);
      return await controller.remove(auth.request.user, '7', '42', 'socket');
    };
    if (canEdit) {
      await expect(invoke()).resolves.toEqual({ success: true, tourPlaceIds: [42] });
      expect(places.get).toHaveBeenCalledWith('7', '42');
      expect(places.onDeleted).toHaveBeenCalledWith(42);
      expect(places.remove).toHaveBeenCalledWith('7', '42');
      expect(places.broadcast).toHaveBeenCalledWith('7', 'place:deleted', { placeId: 42 }, 'socket');
    } else {
      await rejected(invoke, 403);
      for (const method of Object.values(places)) expect(method).not.toHaveBeenCalled();
    }
    expect(auth.permission).toHaveBeenCalledExactlyOnceWith('place_edit', 'user', 1, 2, true);
  });

  describe.each(['create', 'remove'] as const)('assignment %s', handler => {
    it.each(matrix)('edit=%s assign=%s: requires only day_edit', async (canEdit, canAssign) => {
      const auth = authorization(DayAssignmentsController, handler, canEdit, canAssign);
      const { assignment, assignments, controller } = assignmentsFixture();
      const invoke = async () => {
        await auth.guard.canActivate(auth.context);
        return handler === 'create'
          ? await controller.create(auth.request.user, '7', '11', { place_id: 42, notes: 'Tour' }, 'socket')
          : await controller.remove(auth.request.user, '7', '11', '51', 'socket');
      };
      if (canAssign) {
        expect(await invoke()).toEqual(handler === 'create' ? { assignment } : { success: true });
        if (handler === 'create') {
          expect(assignments.dayExists).toHaveBeenCalledWith('11', '7');
          expect(assignments.placeExists).toHaveBeenCalledWith(42, '7');
          expect(assignments.createAssignment).toHaveBeenCalledWith('11', 42, 'Tour');
          expect(assignments.deleteAssignment).not.toHaveBeenCalled();
          expect(assignments.broadcast).toHaveBeenCalledWith('7', 'assignment:created', { assignment }, 'socket');
        } else {
          expect(assignments.assignmentExistsInDay).toHaveBeenCalledWith('51', '11', '7');
          expect(assignments.deleteAssignment).toHaveBeenCalledWith('51');
          expect(assignments.createAssignment).not.toHaveBeenCalled();
          expect(assignments.broadcast).toHaveBeenCalledWith('7', 'assignment:deleted', { assignmentId: 51, dayId: 11 }, 'socket');
        }
        expect(assignments.reconcile).toHaveBeenCalledWith('7', 'socket');
      } else {
        await rejected(invoke, 403);
        for (const method of Object.values(assignments)) expect(method).not.toHaveBeenCalled();
      }
      expect(auth.permission).toHaveBeenCalledExactlyOnceWith('day_edit', 'user', 1, 2, true);
    });
  });

  it.each([
    [PlacesController, 'remove'],
    [DayAssignmentsController, 'create'],
    [DayAssignmentsController, 'remove'],
  ] as const)('%s.%s rejects an inaccessible route trip before checking permissions', async (owner, handler) => {
    const auth = authorization(owner, handler, true, true, '8');
    await rejected(() => auth.guard.canActivate(auth.context), 404);
    expect(auth.access).toHaveBeenCalledExactlyOnceWith(8, 2);
    expect(auth.permission).not.toHaveBeenCalled();
  });
});

const input: TourCreateRequest = {
  name: 'Ridge walk', tour_type: 'hike', max_hiking_difficulty: 2,
  route_geometry: [[48, 11, 600], [48.02, 11.04, 630]],
  waypoints: [
    { lat: 48, lng: 11, role: 'start', sequence: 0 },
    { lat: 48.02, lng: 11.04, role: 'end', sequence: 1 },
  ],
};

/** Tour 42 belongs to `ownerTripId`; findInTrip answers only for that trip. */
function tourRepositoryFixture(ownerTripId: number) {
  const row = {
    place_id: 42, name: 'Ridge walk', tour_type: 'hike', distance: 3,
    elevation_gain: 30, elevation_loss: 0, duration: null, difficulty: null,
    wanderer_ref: null, match_confidence: 1,
    max_hiking_difficulty: 2, planned: 0, has_waypoints: 1,
  };
  const uow = { transactional: vi.fn(async <T>(fn: () => Promise<T>): Promise<T> => await fn()) };
  const toursRepo = {
    findInTrip: vi.fn(async (tripId: number, placeId: number) => tripId === ownerTripId && placeId === 42 ? row : undefined),
    updateInTrip: vi.fn(async () => true),
  };
  const waypointsRepo = {
    listForPlace: vi.fn(async () => input.waypoints),
    deleteForPlace: vi.fn(async () => {}),
    insertForPlace: vi.fn(async () => {}),
  };
  const placesRepo = {
    updateTourRoute: vi.fn(async () => true),
    findInTrip: vi.fn(async () => undefined),
    findWithTagsAndRatings: vi.fn(async () => ({ id: 42, trip_id: ownerTripId })),
  };
  const places = { broadcast: vi.fn() };
  const service = new ToursService(
    uow as unknown as UnitOfWork,
    places as unknown as PlacesService,
    toursRepo as unknown as ToursRepository,
    { isEnabled: vi.fn(async () => true) } as unknown as TourTypesRepository,
    waypointsRepo as unknown as TourWaypointsRepository,
    placesRepo as unknown as PlacesRepository,
  );
  return { uow, toursRepo, waypointsRepo, placesRepo, places, service };
}

describe('Real ToursService update trip boundary (stubbed repositories)', () => {
  it('rejects a placeId belonging to another trip before any write', async () => {
    const f = tourRepositoryFixture(8);
    expect((await f.service.getTour('8', '42')).tour.place_id).toBe(42);
    f.toursRepo.findInTrip.mockClear();
    f.waypointsRepo.listForPlace.mockClear();

    const error: unknown = await f.service.updateTour('7', '42', input, 'socket').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as HttpException).getStatus()).toBe(404);
    expect((error as Error).message).toBe('Tour not found');
    expect(f.toursRepo.findInTrip).toHaveBeenCalledExactlyOnceWith(7, 42);
    for (const method of [
      f.placesRepo.updateTourRoute, f.toursRepo.updateInTrip, f.waypointsRepo.deleteForPlace,
      f.waypointsRepo.insertForPlace, f.waypointsRepo.listForPlace, f.placesRepo.findWithTagsAndRatings, f.places.broadcast,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
  });

  it('allows a same-trip update through the transaction with trip-scoped writes', async () => {
    const f = tourRepositoryFixture(7);

    expect((await f.service.updateTour('7', '42', input, 'socket')).tour.place_id).toBe(42);

    expect(f.uow.transactional).toHaveBeenCalledOnce();
    // Once inside the write, once for the response.
    expect(f.toursRepo.findInTrip).toHaveBeenCalledTimes(2);
    expect(f.placesRepo.updateTourRoute).toHaveBeenCalledExactlyOnceWith(42, 7, {
      name: input.name, lat: 48, lng: 11, route_geometry: JSON.stringify(input.route_geometry),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
    });
    expect(f.toursRepo.updateInTrip).toHaveBeenCalledExactlyOnceWith(7, 42, expect.objectContaining({ tour_type: 'hike', duration: null }));
    expect(f.waypointsRepo.deleteForPlace).toHaveBeenCalledExactlyOnceWith(42);
    expect(f.waypointsRepo.insertForPlace).toHaveBeenCalledExactlyOnceWith(42, input.waypoints);
    expect(f.placesRepo.findWithTagsAndRatings).toHaveBeenCalledWith(42);
    expect(f.places.broadcast).toHaveBeenCalledWith('7', 'place:updated', { place: { id: 42, trip_id: 7 } }, 'socket');
  });
});
