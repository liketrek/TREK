/**
 * TourWalkImportController (CW-07): the route metadata of the Google Maps
 * walk preview and its delegation to TourWalkImportService.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourWalkImportController } from '../../../src/nest/tours/tour-walk-import.controller';
import type { TourWalkImportService } from '../../../src/nest/tours/tour-walk-import.service';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { WalkImportPreviewResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const answer: WalkImportPreviewResponse = {
  stations: [
    { name: 'Cathedral', lat: 48.1, lng: 11.5 },
    { name: 'Market', lat: null, lng: null },
  ],
  resolved_url: 'https://www.google.com/maps/dir/Cathedral/Market/data=!3e2',
};

describe('TourWalkImportController', () => {
  it('WALK-IMPORT-CTL-001: sits behind the addon guard before auth and trip access, and needs place_edit', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourWalkImportController)).toBe('api/trips/:tripId/tours');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourWalkImportController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourWalkImportController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const handler = TourWalkImportController.prototype.preview;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('import/google-maps/preview');
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBe('place_edit');
  });

  it('WALK-IMPORT-CTL-002: hands the link to the service and answers what it answers', async () => {
    const service = { preview: vi.fn(async () => answer) };
    const controller = new TourWalkImportController(service as unknown as TourWalkImportService);
    expect(await controller.preview({ url: 'https://maps.app.goo.gl/abc' })).toBe(answer);
    expect(service.preview).toHaveBeenCalledExactlyOnceWith('https://maps.app.goo.gl/abc');
  });
});
