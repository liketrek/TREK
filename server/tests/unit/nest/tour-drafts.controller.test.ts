/**
 * TourDraftsController: the route metadata of the planner's account draft and
 * its delegation to TourDraftsService with the signed-in user.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TourDraftsController } from '../../../src/nest/tours/tour-drafts.controller';
import type { TourDraftsService } from '../../../src/nest/tours/tour-drafts.service';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { TourDraftResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const answer: TourDraftResponse = { draft: { payload: '{"version":11}', updated_at: '2026-10-22 09:00:00' } };
const user = { id: 4 } as User;

function controllerWith() {
  const service = {
    read: vi.fn(async () => answer),
    keep: vi.fn(async () => answer),
    forget: vi.fn(async () => ({ success: true as const })),
  };
  return { service, controller: new TourDraftsController(service as unknown as TourDraftsService) };
}

describe('TourDraftsController', () => {
  it('TDRAFT-CTL-001: sits behind the addon guard before auth and trip access; only keeping a draft needs place_edit', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TourDraftsController)).toBe('api/trips/:tripId/tour-draft');
    expect(Reflect.getMetadata(GUARDS_METADATA, TourDraftsController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourDraftsController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const routes = [
      ['read', RequestMethod.GET, undefined],
      ['keep', RequestMethod.PUT, 'place_edit'],
      ['forget', RequestMethod.DELETE, undefined],
    ] as const;
    for (const [handler, method, permission] of routes) {
      const fn = TourDraftsController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe('/');
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe(permission);
    }
  });

  it('TDRAFT-CTL-002: hands the trip, the signed-in user and the body to the service and answers what it answers', async () => {
    const { service, controller } = controllerWith();
    expect(await controller.read(user, 7)).toBe(answer);
    expect(service.read).toHaveBeenCalledExactlyOnceWith(7, 4);

    expect(await controller.keep(user, 7, { payload: '{"version":11}' })).toBe(answer);
    expect(service.keep).toHaveBeenCalledExactlyOnceWith(7, 4, { payload: '{"version":11}' });

    expect(await controller.forget(user, 7)).toEqual({ success: true });
    expect(service.forget).toHaveBeenCalledExactlyOnceWith(7, 4);
  });
});
