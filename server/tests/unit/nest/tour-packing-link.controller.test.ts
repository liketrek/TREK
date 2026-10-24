/**
 * TourPackingLinkController (P2D-XD-01): the route metadata of a tour's packing
 * link and its delegation to TourPackingLinkService. Parity with the MCP tools
 * lives here too: reading needs the trip only, both writes 'place_edit', the
 * same action the tools check.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourPackingLinkController } from '../../../src/nest/tours/tour-packing-link.controller';
import type { TourPackingLinkService } from '../../../src/nest/tours/tour-packing-link.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

const link = { category: 'Hiking gear', linked_at: '2026-10-20 09:00:00' };
const detail = { tour: { place_id: 3 }, waypoints: [], packing_link: link };

function controllerWith() {
  const service = {
    read: vi.fn(async () => ({ packing_link: link })),
    link: vi.fn(async () => detail),
    unlink: vi.fn(async () => ({ ...detail, packing_link: null })),
  };
  return { service, controller: new TourPackingLinkController(service as unknown as TourPackingLinkService) };
}

describe('TourPackingLinkController', () => {
  it('TPL-CTL-001: sits behind the addon guard before auth and trip access; only the writes need place_edit', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourPackingLinkController)).toBe('api/trips/:tripId/tours');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourPackingLinkController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourPackingLinkController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const routes = [
      ['read', RequestMethod.GET, undefined],
      ['link', RequestMethod.PUT, 'place_edit'],
      ['unlink', RequestMethod.DELETE, 'place_edit'],
    ] as const;
    for (const [handler, method, permission] of routes) {
      const fn = TourPackingLinkController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(':placeId/packing-link');
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe(permission);
    }
  });

  it('TPL-CTL-002: hands the trip, tour, body, user and socket id to the service and answers what it answers', async () => {
    const { service, controller } = controllerWith();
    const user = { id: 4 } as User;

    expect(await controller.read('7', '3')).toEqual({ packing_link: link });
    expect(service.read).toHaveBeenCalledExactlyOnceWith('7', '3');

    expect(await controller.link(user, '7', '3', { category: 'Hiking gear' }, 'sock-1')).toBe(detail);
    expect(service.link).toHaveBeenCalledExactlyOnceWith('7', '3', { category: 'Hiking gear' }, 4, 'sock-1');

    expect((await controller.unlink('7', '3', 'sock-2')).packing_link).toBeNull();
    expect(service.unlink).toHaveBeenCalledExactlyOnceWith('7', '3', 'sock-2');
  });
});
