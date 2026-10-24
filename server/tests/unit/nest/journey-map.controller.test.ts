/**
 * JourneyMapController (JRN-04): the journey map's layers route, its guards,
 * its contract and what it hands the service.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { JourneyMapController } from '../../../src/nest/journey/journey-map.controller';
import type { JourneyMapService } from '../../../src/nest/journey/journey-map.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

describe('JourneyMapController', () => {
  it('JRNMAP-CTL-001: GET :id/map-layers behind the Journey addon before auth', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JourneyMapController)).toBe('api/journeys');
    expect(Reflect.getMetadata(GUARDS_METADATA, JourneyMapController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, JourneyMapController)).toEqual({ addonId: 'journey', label: 'Journey' });
    const handler = JourneyMapController.prototype.layers;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(':id/map-layers');
  });

  it('JRNMAP-CTL-002: hands the journey and the caller to the service and answers what it read', async () => {
    const layers = {
      places: { status: 'ok', items: [] },
      routes: { status: 'unavailable' },
      stays: { status: 'ok', items: [] },
    };
    const mapLayers = vi.fn(async () => layers);
    const controller = new JourneyMapController({ mapLayers } as unknown as JourneyMapService);

    expect(await controller.layers({ id: 4 } as User, '9')).toBe(layers);
    expect(mapLayers).toHaveBeenCalledWith(9, 4);
  });
});
