import { ADDON_IDS } from '../../../src/addons';
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { parseHorseRoutesQuery, TourHorseRoutesController } from '../../../src/nest/tours/tour-horse-routes.controller';
import type { TourHorseRoutesService } from '../../../src/nest/tours/tour-horse-routes.service';
import { HttpException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  HORSE_ROUTES_ATTRIBUTION,
  horseRoutesResponseSchema,
  type HorseRoutesResponse,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

// HORSE-CTRL-001 to HORSE-CTRL-004

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected a throw');
}

const answer: HorseRoutesResponse = {
  routes: [],
  truncated: false,
  source: 'openstreetmap',
  attribution: HORSE_ROUTES_ATTRIBUTION,
};

describe('TourHorseRoutesController (HOR-01)', () => {
  it('HORSE-CTRL-001: reads the box of the map view', () => {
    expect(parseHorseRoutesQuery({ bbox: '47.1,11.2,47.4,11.6' }).bbox).toEqual({
      south: 47.1,
      west: 11.2,
      north: 47.4,
      east: 11.6,
    });
  });

  it('HORSE-CTRL-002: answers a malformed box and one too large with their own messages', () => {
    for (const raw of [{}, { bbox: '1,2,3' }, { bbox: '47.4,11.2,47.1,11.6' }]) {
      expect(thrown(() => parseHorseRoutesQuery(raw))).toEqual({
        status: 400,
        body: { error: FERRATA_BBOX_INVALID_MESSAGE },
      });
    }
    expect(thrown(() => parseHorseRoutesQuery({ bbox: '46,11,47,11.4' }))).toEqual({
      status: 400,
      body: { error: FERRATA_BBOX_TOO_LARGE_MESSAGE },
    });
  });

  it('HORSE-CTRL-003: hands the box to the service and returns its answer', async () => {
    const list = vi.fn(async () => answer);
    const controller = new TourHorseRoutesController({ list } as unknown as TourHorseRoutesService);
    await expect(controller.list({ bbox: '47.1,11.2,47.4,11.6' })).resolves.toBe(answer);
    expect(list).toHaveBeenCalledWith({ south: 47.1, west: 11.2, north: 47.4, east: 11.6 });
  });

  it('HORSE-CTRL-004: sits behind the Tours addon, the session and the trip access, and declares its contract', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, TourHorseRoutesController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, TourHorseRoutesController)).toEqual({
      addonId: ADDON_IDS.TOURS,
      label: 'Tours',
    });
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, TourHorseRoutesController.prototype.list)).toBe(
      horseRoutesResponseSchema,
    );
  });
});
