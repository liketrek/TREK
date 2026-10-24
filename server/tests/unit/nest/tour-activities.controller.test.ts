/**
 * TourActivitiesController (ACT-01): route metadata and delegation. The
 * checks themselves live in TourActivitiesService, which the MCP tools call
 * too, so REST and MCP refuse the same assignments with the same codes; the
 * service suite and the e2e suite hold those.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourActivitiesController } from '../../../src/nest/tours/tour-activities.controller';
import type { TourActivitiesService } from '../../../src/nest/tours/tour-activities.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { tourActivityAssignRequestSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/nest/permissions/permissions.service', () => ({ PermissionsService: class {} }));
vi.mock('../../../src/nest/addons/addons.service', () => ({ AddonsService: class {} }));
vi.mock('../../../src/nest/tours/tour-activities.service', () => ({ TourActivitiesService: class {} }));
vi.mock('../../../src/nest/auth-core/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));

const detail = { tour: { place_id: 4 }, waypoints: [], activities: [] };

describe('TourActivitiesController', () => {
  it('ACT-CTL-001: sits behind the addon, auth and trip guards, under the tour', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourActivitiesController)).toBe(
      'api/trips/:tripId/tours/:placeId/activities',
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, TourActivitiesController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourActivitiesController)).toEqual({ addonId: 'tours', label: 'Tours' });
  });

  it('ACT-CTL-002: both routes change a tour, so both need place_edit and answer 200', () => {
    const routes = [
      ['assign', RequestMethod.PUT, '/'],
      ['unassign', RequestMethod.DELETE, ':activityId'],
    ] as const;
    for (const [handler, method, path] of routes) {
      const fn = TourActivitiesController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe('place_edit');
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, fn)).toBeUndefined();
    }
  });

  it('ACT-CTL-003: PUT hands the validated body, the user and the socket id to the service', async () => {
    const service = { assign: vi.fn().mockResolvedValue(detail) } as unknown as TourActivitiesService;
    const body = tourActivityAssignRequestSchema.parse({ track_place_id: 9, assignment_id: 12 });

    expect(await new TourActivitiesController(service).assign('7', '4', body, { id: 3 } as User, 'socket-1')).toBe(
      detail,
    );
    expect(service.assign).toHaveBeenCalledWith('7', '4', body, 3, 'socket-1');
  });

  it('ACT-CTL-004: DELETE hands the assignment and the socket id to the service', async () => {
    const service = { unassign: vi.fn().mockResolvedValue(detail) } as unknown as TourActivitiesService;

    expect(await new TourActivitiesController(service).unassign('7', '4', 5, 'socket-2')).toBe(detail);
    expect(service.unassign).toHaveBeenCalledWith('7', '4', 5, 'socket-2');
  });
});
