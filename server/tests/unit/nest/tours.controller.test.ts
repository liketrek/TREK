/**
 * ToursController and ToursImportController: route metadata, delegation to
 * ToursService, and the GPX import's handler-level checks. The import is not
 * guarded (a guard answers before multer drains the body and the client sees
 * ECONNRESET), so its handler has to reproduce the guards' answers itself, in
 * the same order and with the same bodies (parity with AddonGuard and
 * TripAccessGuard).
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import type { PlacesService } from '../../../src/nest/places/places.service';
import { ToursImportController } from '../../../src/nest/tours/tours-import.controller';
import { ToursController } from '../../../src/nest/tours/tours.controller';
import type { ToursService } from '../../../src/nest/tours/tours.service';
import type { User } from '../../../src/types';
import { HttpException, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import type { TourCreateRequest } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const { legacyDatabaseAccess } = vi.hoisted(() => ({
  legacyDatabaseAccess: vi.fn((property: string | symbol): never => {
    throw new Error(`Unexpected legacy database access: ${String(property)}`);
  }),
}));

vi.mock('../../../src/db/database', () => ({
  db: new Proxy(
    {},
    {
      get: (_target, property: string | symbol) => legacyDatabaseAccess(property),
    },
  ),
}));
vi.mock('../../../src/nest/permissions/permissions.service', () => ({ PermissionsService: class {} }));
vi.mock('../../../src/nest/addons/addons.service', () => ({ AddonsService: class {} }));
vi.mock('../../../src/nest/places/places.service', () => ({ PlacesService: class {} }));
vi.mock('../../../src/nest/tours/tours.service', () => ({ ToursService: class {} }));
vi.mock('../../../src/nest/auth-core/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));

const request: TourCreateRequest = {
  name: 'Ridge walk',
  tour_type: 'hike' as const,
  route_geometry: [
    [48, 11, 600],
    [48.02, 11.04, 630],
  ] as [number, number, number][],
  waypoints: [
    { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
    { lat: 48.02, lng: 11.04, role: 'end' as const, sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
};

const user = { id: 2, role: 'user', email: 'u@example.test' } as User;
const trip = { id: 7, user_id: 1 };
const file = { buffer: Buffer.from('<gpx/>'), originalname: 'ridge.gpx' } as Express.Multer.File;

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

function importFixture(
  o: { addon?: boolean; trip?: typeof trip | undefined; canEdit?: boolean; result?: unknown } = {},
) {
  const addons = { isAddonEnabled: vi.fn(async () => o.addon ?? true) };
  const places = {
    verifyTripAccess: vi.fn(async () => ('trip' in o ? o.trip : trip)),
    canEdit: vi.fn(async () => o.canEdit ?? true),
  };
  const result = 'result' in o ? o.result : { tours: [{ place_id: 42 }], caution: false, skipped: 0 };
  const tours = { importGpxAsTour: vi.fn(async () => result) };
  const controller = new ToursImportController(
    tours as unknown as ToursService,
    places as unknown as PlacesService,
    addons as unknown as AddonsService,
  );
  return { addons, places, tours, controller, result };
}

describe('ToursController planner routes', () => {
  it('does not access the legacy global database initializer', () => {
    expect(legacyDatabaseAccess).not.toHaveBeenCalled();
  });

  it('TOURS-CTL-001: hides every Tours route behind the addon guard before auth', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ToursController)).toBe('api/trips/:tripId/tours');
    expect(Reflect.getMetadata(GUARDS_METADATA, ToursController)).toEqual([AddonGuard, JwtAuthGuard, TripAccessGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, ToursController)).toEqual({ addonId: 'tours', label: 'Tours' });
  });

  it('TOURS-CTL-001b: routes, methods and write permissions', () => {
    const routes = [
      ['list', RequestMethod.GET, '/', undefined],
      ['detail', RequestMethod.GET, ':placeId', undefined],
      ['create', RequestMethod.POST, '/', 'place_edit'],
      ['update', RequestMethod.PUT, ':placeId', 'place_edit'],
    ] as const;
    for (const [handler, method, path, permission] of routes) {
      const fn = ToursController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe(permission);
    }
    // POST keeps Nest's default 201, as the PR's route answered.
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, ToursController.prototype.create)).toBeUndefined();
  });

  it('TOURS-CTL-002: POST /tours delegates the validated payload and socket id', async () => {
    const result = { tour: { place_id: 1 }, waypoints: request.waypoints };
    const service = { createTour: vi.fn().mockResolvedValue(result) } as unknown as ToursService;
    const controller = new ToursController(service);

    expect(await controller.create('7', request, 'socket-1')).toBe(result);
    expect(service.createTour).toHaveBeenCalledWith('7', request, 'socket-1');
  });

  it('TOURS-CTL-003: GET /tours/:placeId delegates within the guarded trip', async () => {
    const result = { tour: { place_id: 1 }, waypoints: request.waypoints };
    const service = { getTour: vi.fn().mockResolvedValue(result) } as unknown as ToursService;
    const controller = new ToursController(service);

    expect(await controller.detail('7', '1')).toBe(result);
    expect(service.getTour).toHaveBeenCalledWith('7', '1');
  });

  it('TOURS-CTL-004: PUT /tours/:placeId delegates the validated payload and socket id', async () => {
    const result = { tour: { place_id: 1 }, waypoints: request.waypoints };
    const service = { updateTour: vi.fn().mockResolvedValue(result) } as unknown as ToursService;
    const controller = new ToursController(service);

    expect(await controller.update('7', '1', request, 'socket-2')).toBe(result);
    expect(service.updateTour).toHaveBeenCalledWith('7', '1', request, 'socket-2');
  });

  it('TOURS-CTL-005: GET /tours wraps the list in { tours }', async () => {
    const tours = [{ place_id: 1 }];
    const service = { listTours: vi.fn().mockResolvedValue(tours) } as unknown as ToursService;

    expect(await new ToursController(service).list('7')).toEqual({ tours });
    expect(service.listTours).toHaveBeenCalledWith('7');
  });
});

describe('ToursImportController (POST /api/trips/:tripId/tours/import/gpx)', () => {
  it('TOURS-IMP-001: the multipart route carries only the JWT guard and checks the rest in the handler', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ToursImportController)).toBe('api/trips/:tripId/tours');
    expect(Reflect.getMetadata(GUARDS_METADATA, ToursImportController)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, ToursImportController)).toBeUndefined();
    const handler = ToursImportController.prototype.importGpx;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('import/gpx');
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, handler)).toHaveLength(1);
  });

  it('TOURS-IMP-002: delegates the route trip, file and socket id and returns the service result', async () => {
    const { controller, tours, places, result } = importFixture();

    expect(await controller.importGpx(user, '7', file, 'socket')).toBe(result);
    expect(places.verifyTripAccess).toHaveBeenCalledWith('7', user.id);
    expect(places.canEdit).toHaveBeenCalledWith(trip, user);
    expect(tours.importGpxAsTour).toHaveBeenCalledWith('7', file.buffer, 'ridge.gpx', 'socket');
  });

  it('TOURS-IMP-003: a duplicate-only import is a successful skipped result', async () => {
    const allSkipped = { tours: [], caution: false, skipped: 2 };
    const { controller } = importFixture({ result: allSkipped });
    expect(await controller.importGpx(user, '7', file)).toBe(allSkipped);
  });

  it('TOURS-IMP-004: addon off is the AddonGuard 404 before any trip lookup', async () => {
    const { controller, places, tours, addons } = importFixture({ addon: false });

    expect(await thrownAsync(() => controller.importGpx(user, '7', file))).toEqual({
      status: 404,
      body: { error: 'Tours addon is not enabled' },
    });
    expect(addons.isAddonEnabled).toHaveBeenCalledWith('tours');
    expect(places.verifyTripAccess).not.toHaveBeenCalled();
    expect(tours.importGpxAsTour).not.toHaveBeenCalled();
  });

  it('TOURS-IMP-005: an inaccessible trip is the TripAccessGuard 404 before any permission check', async () => {
    const { controller, places, tours } = importFixture({ trip: undefined });

    expect(await thrownAsync(() => controller.importGpx(user, '8', file))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
    expect(places.verifyTripAccess).toHaveBeenCalledWith('8', user.id);
    expect(places.canEdit).not.toHaveBeenCalled();
    expect(tours.importGpxAsTour).not.toHaveBeenCalled();
  });

  it('TOURS-IMP-006: without place_edit it is the TripAccessGuard 403, checked before the file', async () => {
    const { controller, tours } = importFixture({ canEdit: false });

    expect(await thrownAsync(() => controller.importGpx(user, '7', undefined))).toEqual({
      status: 403,
      body: { error: 'No permission' },
    });
    expect(tours.importGpxAsTour).not.toHaveBeenCalled();
  });

  it('TOURS-IMP-007: 400 without a file', async () => {
    const { controller, tours } = importFixture();

    expect(await thrownAsync(() => controller.importGpx(user, '7', undefined))).toEqual({
      status: 400,
      body: { error: 'No file uploaded' },
    });
    expect(tours.importGpxAsTour).not.toHaveBeenCalled();
  });

  it('TOURS-IMP-008: 400 when the GPX has no track or route', async () => {
    const { controller } = importFixture({ result: null });

    expect(await thrownAsync(() => controller.importGpx(user, '7', file))).toEqual({
      status: 400,
      body: { error: 'No track or route found in GPX file' },
    });
  });
});
