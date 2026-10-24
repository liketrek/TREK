/**
 * TourActivityStatsController (STA-02): route metadata and delegation. The
 * sums and the access check live in TourActivityStatsService, which the MCP
 * tools call too; the service suite and the e2e suite hold those.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY } from '../../../src/nest/permissions/trip-access.guard';
import { TourActivityStatsController } from '../../../src/nest/tours/tour-activity-stats.controller';
import type { TourActivityStatsService } from '../../../src/nest/tours/tour-activity-stats.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { tourActivityExclusionRequestSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/nest/permissions/permissions.service', () => ({ PermissionsService: class {} }));
vi.mock('../../../src/nest/addons/addons.service', () => ({ AddonsService: class {} }));
vi.mock('../../../src/nest/tours/tour-activity-stats.service', () => ({ TourActivityStatsService: class {} }));
vi.mock('../../../src/nest/auth-core/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));

const answer = { entries: [], uncounted: { unassigned: 0, undated: 0 } };

describe('TourActivityStatsController', () => {
  it('STA2-CTL-001: sits behind the addon and auth guards, not under a trip', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourActivityStatsController)).toBe('api/tours/activity-stats');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourActivityStatsController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourActivityStatsController)).toEqual({
      addonId: 'tours',
      label: 'Tours',
    });
  });

  it('STA2-CTL-002: GET reads the sums and PUT exclusions writes, both answering 200 without a trip permission', () => {
    const routes = [
      ['list', RequestMethod.GET, '/'],
      ['setExcluded', RequestMethod.PUT, 'exclusions'],
    ] as const;
    for (const [handler, method, path] of routes) {
      const fn = TourActivityStatsController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBeUndefined();
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, fn)).toBeUndefined();
    }
  });

  it('STA2-CTL-003: GET hands the user to the service', async () => {
    const service = { stats: vi.fn().mockResolvedValue(answer) } as unknown as TourActivityStatsService;
    expect(await new TourActivityStatsController(service).list({ id: 3 } as User)).toBe(answer);
    expect(service.stats).toHaveBeenCalledWith(3);
  });

  it('STA2-CTL-004: PUT hands the user and the validated body to the service', async () => {
    const service = { setExcluded: vi.fn().mockResolvedValue(answer) } as unknown as TourActivityStatsService;
    const body = tourActivityExclusionRequestSchema.parse({ place_id: 9, excluded: true });
    expect(await new TourActivityStatsController(service).setExcluded({ id: 3 } as User, body)).toBe(answer);
    expect(service.setExcluded).toHaveBeenCalledWith(3, body);
  });
});
