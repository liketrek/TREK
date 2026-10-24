/**
 * TourSkiController (SKI-02): the route metadata of classifying a ski track
 * again, and its delegation to TourSkiService with the validated body and the
 * socket id.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourSkiController } from '../../../src/nest/tours/tour-ski.controller';
import type { TourSkiService } from '../../../src/nest/tours/tour-ski.service';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { tourDetailResponseSchema, type TourDetailResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

describe('TourSkiController', () => {
  it('TOUR-SKI-CTL-001: sits behind the addon guard before auth and trip access, and needs place_edit', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourSkiController)).toBe('api/trips/:tripId/tours/:placeId/ski');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourSkiController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourSkiController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const handler = TourSkiController.prototype.classify;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.PUT);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('/');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBe('place_edit');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(tourDetailResponseSchema);
  });

  it('TOUR-SKI-CTL-002: hands the trip, tour, classification and socket id to the service and answers what it answers', async () => {
    const answer = { tour: { place_id: 9 }, waypoints: [] } as unknown as TourDetailResponse;
    const service = { classify: vi.fn(async () => answer) };
    const controller = new TourSkiController(service as unknown as TourSkiService);
    const body = { ski_discipline: 'cross_country' as const, ski_technique: 'skating' as const, expected_revision: 2 };

    expect(await controller.classify('7', '9', body, 'sock-1')).toBe(answer);
    expect(service.classify).toHaveBeenCalledExactlyOnceWith('7', '9', body, 'sock-1');
  });
});
