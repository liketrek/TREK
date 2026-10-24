/**
 * CollectionToursController and CollectionTourTakeOverController (LIB-03):
 * route metadata, the guards and the addon they run behind, the permission
 * the take-over needs, and the delegation to CollectionToursService, a
 * malformed id answering 404 before the service is asked.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../src/nest/common/domain-error';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import {
  CollectionTourTakeOverController,
  CollectionToursController,
} from '../../../src/nest/tours/collection-tours.controller';
import type { CollectionToursService } from '../../../src/nest/tours/collection-tours.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

const user = { id: 2, role: 'user', email: 'u@example.test' } as User;

function fakeService() {
  return {
    list: vi.fn().mockResolvedValue({ tours: [] }),
    detail: vi.fn().mockResolvedValue({ tour: {}, line: [], points: [], trips: [] }),
    save: vi.fn().mockResolvedValue({ tour: { id: 4 } }),
    remove: vi.fn().mockResolvedValue(undefined),
    takeOver: vi.fn().mockResolvedValue({ tour: { place_id: 9 }, waypoints: [] }),
  };
}

function route(controller: object, method: string) {
  const handler = (controller as Record<string, unknown>)[method] as object;
  return {
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    verb: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
    permission: Reflect.getMetadata(TRIP_PERMISSION_KEY, handler) as string | undefined,
  };
}

async function notFound(work: () => Promise<unknown>): Promise<string> {
  try {
    await work();
  } catch (err) {
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).getStatus()).toBe(404);
    return (err as DomainError).publicMessage;
  }
  throw new Error('expected a 404');
}

describe('CollectionToursController', () => {
  it('LIB3-CTRL-001: lives under the collection, behind the Tours addon and a session, without a trip guard', () => {
    expect(Reflect.getMetadata(PATH_METADATA, CollectionToursController)).toBe(
      'api/addons/collections/:collectionId/tours',
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, CollectionToursController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, CollectionToursController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const proto = CollectionToursController.prototype;
    expect(route(proto, 'list')).toMatchObject({ path: '/', verb: RequestMethod.GET });
    expect(route(proto, 'save')).toMatchObject({ path: '/', verb: RequestMethod.POST });
    expect(route(proto, 'detail')).toMatchObject({ path: ':tourId', verb: RequestMethod.GET });
    expect(route(proto, 'remove')).toMatchObject({ path: ':tourId', verb: RequestMethod.DELETE });
  });

  it('LIB3-CTRL-002: hands the user, the ids and the socket on to the service', async () => {
    const service = fakeService();
    const controller = new CollectionToursController(service as unknown as CollectionToursService);
    const body = { source_trip_id: 5, source_place_id: 7 };
    await controller.list(user, '3');
    await controller.save(user, '3', body, 'sock');
    await controller.detail(user, '3', '4');
    expect(await controller.remove(user, '3', '4', 'sock')).toEqual({ success: true });
    expect(service.list).toHaveBeenCalledWith(2, 3);
    expect(service.save).toHaveBeenCalledWith(2, 3, body, 'sock');
    expect(service.detail).toHaveBeenCalledWith(user, 3, 4);
    expect(service.remove).toHaveBeenCalledWith(2, 3, 4, 'sock');
  });

  it('LIB3-CTRL-003: a malformed id is a missing collection or tour, never a 500', async () => {
    const service = fakeService();
    const controller = new CollectionToursController(service as unknown as CollectionToursService);
    expect(await notFound(() => controller.list(user, 'abc'))).toBe('Collection not found');
    expect(await notFound(() => controller.detail(user, '3', '1e3'))).toBe('Tour not found');
    expect(await notFound(() => controller.remove(user, '-1', '4'))).toBe('Collection not found');
    expect(service.list).not.toHaveBeenCalled();
    expect(service.detail).not.toHaveBeenCalled();
    expect(service.remove).not.toHaveBeenCalled();
  });
});

describe('CollectionTourTakeOverController', () => {
  it('LIB3-CTRL-004: is trip-scoped, needs place_edit and hands the body on', async () => {
    expect(Reflect.getMetadata(PATH_METADATA, CollectionTourTakeOverController)).toBe('api/trips/:tripId/tours');
    expect(Reflect.getMetadata(GUARDS_METADATA, CollectionTourTakeOverController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(route(CollectionTourTakeOverController.prototype, 'takeOver')).toEqual({
      path: 'from-collection',
      verb: RequestMethod.POST,
      permission: 'place_edit',
    });
    const service = fakeService();
    const controller = new CollectionTourTakeOverController(service as unknown as CollectionToursService);
    const body = { collection_id: 3, collection_tour_id: 4, include_waypoints: false };
    expect(await controller.takeOver('6', user, body, 'sock')).toEqual({ tour: { place_id: 9 }, waypoints: [] });
    expect(service.takeOver).toHaveBeenCalledWith('6', 2, body, 'sock');
  });
});
