/**
 * WandererWatchController (WAN-02) and the hint route of
 * ToursWandererController: their route metadata and their delegation to
 * WandererWatchService. The watch has no MCP tool, as no part of the wanderer
 * connection has one: it runs on a personal credential that never leaves the
 * server. The hint of a tour asks 'place_edit', the right of the check it
 * leads to.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { ToursWandererController } from '../../../src/nest/tours/tours-wanderer.controller';
import type { ToursWandererService } from '../../../src/nest/tours/tours-wanderer.service';
import { WandererWatchController } from '../../../src/nest/tours/wanderer-watch.controller';
import type { WandererWatchService } from '../../../src/nest/tours/wanderer-watch.service';
import { WandererEnabledGuard } from '../../../src/nest/wanderer/wanderer-enabled.guard';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

const STATUS = { enabled: true, connected: true, lastRunAt: null, pausedUntil: null, blocked: false, hints: [] };

function watchService() {
  return {
    status: vi.fn(async () => STATUS),
    setEnabled: vi.fn(async () => STATUS),
    hintFor: vi.fn(async () => ({ hint: null })),
  };
}

describe('WandererWatchController', () => {
  it('WWCTL-001: sits beside the connection, behind Tours, auth and the wanderer switch', () => {
    expect(Reflect.getMetadata(PATH_METADATA, WandererWatchController)).toBe('api/integrations/wanderer/watch');
    expect(Reflect.getMetadata(GUARDS_METADATA, WandererWatchController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      WandererEnabledGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, WandererWatchController)).toEqual({ addonId: 'tours', label: 'Tours' });
    expect(Reflect.getMetadata(METHOD_METADATA, WandererWatchController.prototype.status)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(METHOD_METADATA, WandererWatchController.prototype.setEnabled)).toBe(RequestMethod.PUT);
  });

  it('WWCTL-002: reads and switches only the caller own watch', async () => {
    const service = watchService();
    const controller = new WandererWatchController(service as unknown as WandererWatchService);
    const user = { id: 4 } as User;
    expect(await controller.status(user)).toBe(STATUS);
    expect(service.status).toHaveBeenCalledExactlyOnceWith(4);
    const req = { headers: {}, socket: { remoteAddress: '10.0.0.9' } } as unknown as Request;
    expect(await controller.setEnabled(user, { enabled: false }, req)).toBe(STATUS);
    expect(service.setEnabled).toHaveBeenCalledExactlyOnceWith(4, false, expect.anything());
  });
});

describe('ToursWandererController hint route', () => {
  it('WWCTL-003: asks place_edit like the check, and hands trip, user and tour to the watch', async () => {
    const fn = ToursWandererController.prototype.hint;
    expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe('sources/:placeId/hint');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, fn)).toBe('place_edit');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, ToursWandererController.prototype.checkSource)).toBe('place_edit');
    expect(Reflect.getMetadata(GUARDS_METADATA, ToursWandererController)).toContain(TripAccessGuard);

    const service = watchService();
    const controller = new ToursWandererController(
      {} as ToursWandererService,
      service as unknown as WandererWatchService,
    );
    expect(await controller.hint('7', '3', { id: 4 } as User)).toEqual({ hint: null });
    expect(service.hintFor).toHaveBeenCalledExactlyOnceWith('7', 4, '3');
  });
});
