/**
 * TourVisitsController (CW-03): the route metadata of the visits of a city
 * walk, its delegation to TourVisitsService, and the station key check it
 * makes before the service is asked.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourVisitsController } from '../../../src/nest/tours/tour-visits.controller';
import type { TourVisitsService } from '../../../src/nest/tours/tour-visits.service';
import { BadRequestException, RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { TourVisitListResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const answer: TourVisitListResponse = {
  visits: [{ assignment_id: 9, station_key: 'stop-cathedral', status: 'visited' }],
};

function controllerWith() {
  const service = { list: vi.fn(async () => answer), update: vi.fn(async () => answer) };
  return { service, controller: new TourVisitsController(service as unknown as TourVisitsService) };
}

describe('TourVisitsController', () => {
  it('TOUR-VISITS-CTL-001: sits behind the addon guard before auth and trip access; only a write needs day_edit', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourVisitsController)).toBe('api/trips/:tripId/tour-visits');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourVisitsController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourVisitsController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const routes = [
      ['list', RequestMethod.GET, '/', undefined],
      ['update', RequestMethod.PUT, ':assignmentId/:stationKey', 'day_edit'],
    ] as const;
    for (const [handler, method, path, permission] of routes) {
      const fn = TourVisitsController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe(permission);
    }
  });

  it('TOUR-VISITS-CTL-002: hands the trip, assignment, key, body and socket id to the service and answers what it answers', async () => {
    const { service, controller } = controllerWith();
    expect(await controller.list('7')).toBe(answer);
    expect(service.list).toHaveBeenCalledExactlyOnceWith('7');

    expect(await controller.update('7', 9, 'stop-cathedral', { status: 'visited' }, 'sock-1')).toBe(answer);
    expect(service.update).toHaveBeenCalledExactlyOnceWith('7', 9, 'stop-cathedral', { status: 'visited' }, 'sock-1');
  });

  it('TOUR-VISITS-CTL-003: a key that is no station key is a 400 before the service is asked', async () => {
    const { service, controller } = controllerWith();
    const refusals = ['ab', 'a/b/c/d', 'x'.repeat(65)].map((key) =>
      controller.update('7', 9, key, { status: 'visited' }).catch((err: unknown) => err),
    );
    expect(await Promise.all(refusals)).toEqual([
      new BadRequestException('Invalid station key'),
      new BadRequestException('Invalid station key'),
      new BadRequestException('Invalid station key'),
    ]);
    expect(service.update).not.toHaveBeenCalled();
  });
});
