/**
 * The Tours permission contract, run through the real guards with mocked
 * collaborators (no DB): reads need trip access only, writes need
 * 'place_edit' and never 'day_edit', an inaccessible trip is a 404 before any
 * permission check, and the addon and JWT refusals stop a request before the
 * trip is resolved. The GPX import answers the same matrix from its handler.
 */
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { extractToken, verifyJwtAndLoadUser } from '../../../src/nest/auth/jwt-verify';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import {
  TripAccessGuard,
  TRIP_PERMISSION_KEY,
  TRIP_REQUEST_KEY,
} from '../../../src/nest/permissions/trip-access.guard';
import type { PlacesService } from '../../../src/nest/places/places.service';
import { ToursImportController } from '../../../src/nest/tours/tours-import.controller';
import { ToursController } from '../../../src/nest/tours/tours.controller';
import type { ToursService } from '../../../src/nest/tours/tours.service';
import type { User } from '../../../src/types';
import type { EntityManager } from '@mikro-orm/core';
import { HttpException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

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
vi.mock('../../../src/nest/auth/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));

const matrix = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
] as const;
const user = { id: 2, role: 'user' } as User;
const trip = { id: 7, user_id: 1 };

/** Trip 7 is reachable for user 2; it belongs to user 1, so every check is a shared-trip check. */
function fixture(handler: keyof ToursController, canEdit = false, canAssign = false, tripId = '7') {
  const request = { params: { tripId }, user };
  const access = vi.fn(async (id: number, userId: number) => (id === 7 && userId === 2 ? trip : undefined));
  const permission = vi.fn(async (action: string) =>
    action === 'place_edit' ? canEdit : action === 'day_edit' && canAssign,
  );
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ToursController.prototype[handler],
    getClass: () => ToursController,
  } as unknown as ExecutionContext;
  const em = { getRepository: vi.fn(() => ({ findAccessible: access })) } as unknown as EntityManager;
  const guard = new TripAccessGuard(
    em,
    { checkPermission: permission } as unknown as PermissionsService,
    new Reflector(),
  );
  return { request, access, permission, context, guard };
}

/** The import handler's own checks, with the same access and permission doubles. */
function importFixture(canEdit: boolean, canAssign: boolean) {
  const permission = vi.fn(async (action: string, ..._context: unknown[]) =>
    action === 'place_edit' ? canEdit : action === 'day_edit' && canAssign,
  );
  const access = vi.fn(async (id: string, userId: number) => (id === '7' && userId === 2 ? trip : undefined));
  const places = {
    verifyTripAccess: access,
    canEdit: vi.fn(async (t: typeof trip, u: User) =>
      permission('place_edit', u.role, t.user_id, u.id, t.user_id !== u.id),
    ),
  };
  const importGpxAsTour = vi.fn(async () => ({ tours: [{ place_id: 42 }], caution: false, skipped: 0 }));
  const controller = new ToursImportController(
    { importGpxAsTour } as unknown as ToursService,
    places as unknown as PlacesService,
    { isAddonEnabled: vi.fn(async () => true) } as unknown as AddonsService,
  );
  return { controller, access, permission, importGpxAsTour };
}

async function expectStatus(action: () => Promise<unknown>, status: number) {
  try {
    await action();
    expect.fail('Expected rejection');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(status);
  }
}

const file = { buffer: Buffer.from('gpx'), originalname: 'ridge.gpx' } as Express.Multer.File;

describe('Tours permission contract (mock-only, no DB)', () => {
  it('does not access the legacy global database initializer', () => {
    expect(legacyDatabaseAccess).not.toHaveBeenCalled();
  });

  it('retains addon/JWT/trip guard order and exact write metadata', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ToursController)).toEqual([AddonGuard, JwtAuthGuard, TripAccessGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ToursImportController)).toEqual([JwtAuthGuard]);
    for (const handler of ['create', 'update'] as const) {
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, ToursController.prototype[handler])).toBe('place_edit');
    }
    for (const handler of ['list', 'detail'] as const) {
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, ToursController.prototype[handler])).toBeUndefined();
    }
  });

  it.each(matrix)('edit=%s assign=%s permits reads and only place-edit writes', async (canEdit, canAssign) => {
    for (const handler of ['list', 'detail'] as const) {
      const test = fixture(handler, canEdit, canAssign);
      expect(await test.guard.canActivate(test.context)).toBe(true);
      expect(test.permission).not.toHaveBeenCalled();
      expect(test.request[TRIP_REQUEST_KEY as keyof typeof test.request]).toEqual(trip);
    }
    for (const handler of ['create', 'update'] as const) {
      const test = fixture(handler, canEdit, canAssign);
      if (canEdit) expect(await test.guard.canActivate(test.context)).toBe(true);
      else await expectStatus(() => test.guard.canActivate(test.context), 403);
      expect(test.permission).toHaveBeenCalledExactlyOnceWith('place_edit', 'user', 1, 2, true);
    }
  });

  it.each(matrix)('edit=%s assign=%s: the GPX import handler requires only place_edit', async (canEdit, canAssign) => {
    const test = importFixture(canEdit, canAssign);
    if (canEdit) {
      expect(await test.controller.importGpx(user, '7', file, 'socket')).toMatchObject({ tours: [{ place_id: 42 }] });
      expect(test.importGpxAsTour).toHaveBeenCalledWith('7', file.buffer, 'ridge.gpx', 'socket');
    } else {
      await expectStatus(() => test.controller.importGpx(user, '7', file), 403);
      expect(test.importGpxAsTour).not.toHaveBeenCalled();
    }
    expect(test.permission).toHaveBeenCalledExactlyOnceWith('place_edit', 'user', 1, 2, true);
  });

  it.each(['list', 'detail', 'create', 'update'] as const)(
    '%s rejects inaccessible route trips before any write permission check',
    async (handler) => {
      const test = fixture(handler, true, true, '8');
      await expectStatus(() => test.guard.canActivate(test.context), 404);
      expect(test.access).toHaveBeenCalledWith(8, 2);
      expect(test.permission).not.toHaveBeenCalled();
    },
  );

  it('importGpx rejects an inaccessible route trip before any permission check', async () => {
    const test = importFixture(true, true);
    await expectStatus(() => test.controller.importGpx(user, '8', file), 404);
    expect(test.access).toHaveBeenCalledWith('8', 2);
    expect(test.permission).not.toHaveBeenCalled();
    expect(test.importGpxAsTour).not.toHaveBeenCalled();
  });

  it('preserves addon and JWT refusal without reaching trip resolution', async () => {
    const test = fixture('create', true, true);
    const addon = new AddonGuard(
      { isAddonEnabled: vi.fn(async () => false) } as unknown as AddonsService,
      new Reflector(),
    );
    await expectStatus(() => addon.canActivate(test.context), 404);
    const jwt = new JwtAuthGuard({ getRepository: vi.fn() } as unknown as EntityManager);
    vi.mocked(extractToken).mockReturnValue(null);
    await expectStatus(() => jwt.canActivate(test.context), 401);
    vi.mocked(extractToken).mockReturnValue('token');
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(null);
    await expectStatus(() => jwt.canActivate(test.context), 401);
    expect(test.access).not.toHaveBeenCalled();
  });
});
