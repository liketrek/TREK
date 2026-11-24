/**
 * TripAddonsController: the route shapes, the guard chain and the owner
 * refusal it declares, and that each handler hands the guard-resolved trip and
 * the caller straight to TripAddonsService. The behaviour behind it is pinned
 * in trip-addons.service.test.ts and over HTTP in trip-addons.e2e.test.ts.
 */
import type { TripAccess } from '../../../src/db/repositories/Trips.repository';
import { TripAddonsController, TripAddonUpdateDto } from '../../../src/nest/addons/trip-addons.controller';
import { TRIP_ADDON_OWNER_ONLY, type TripAddonsService } from '../../../src/nest/addons/trip-addons.service';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { TRIP_OWNER_KEY, TripOwnerGuard } from '../../../src/nest/permissions/trip-owner.guard';
import type { User } from '../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { tripAddonsResponseSchema, tripAddonUpdateRequestSchema, type TripAddon } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const trip: TripAccess = { id: 7, user_id: 3, currency: 'EUR' };
const user = { id: 3 } as User;
const addons: TripAddon[] = [
  { id: 'budget', name: 'Costs', icon: 'Wallet', enabled: false, instanceEnabled: true, overridden: true },
];

function makeController() {
  const service = {
    effectiveTripAddons: vi.fn().mockResolvedValue(addons),
    setTripOverride: vi.fn().mockResolvedValue(addons),
  };
  return { service, controller: new TripAddonsController(service as unknown as TripAddonsService) };
}

const proto = TripAddonsController.prototype;

describe('TripAddonsController', () => {
  it('TRIPADDON-CTRL-001: lives under the trip, behind auth and trip access, with no addon gate', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TripAddonsController)).toBe('api/trips/:tripId/addons');
    expect(Reflect.getMetadata(GUARDS_METADATA, TripAddonsController)).toEqual([JwtAuthGuard, TripAccessGuard]);
  });

  it('TRIPADDON-CTRL-002: GET / answers the trip list, declared by the shared response schema', async () => {
    expect(Reflect.getMetadata(METHOD_METADATA, proto.list)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, proto.list)).toBe('/');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, proto.list)).toBe(tripAddonsResponseSchema);
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.list)).toBeUndefined();

    const { service, controller } = makeController();
    expect(await controller.list(trip)).toEqual({ tripId: 7, addons });
    expect(service.effectiveTripAddons).toHaveBeenCalledWith(7);
  });

  it('TRIPADDON-CTRL-003: PUT /:addonId is owner-only with the REST refusal text and the shared body', () => {
    expect(Reflect.getMetadata(METHOD_METADATA, proto.update)).toBe(RequestMethod.PUT);
    expect(Reflect.getMetadata(PATH_METADATA, proto.update)).toBe(':addonId');
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.update)).toEqual([TripOwnerGuard]);
    expect(Reflect.getMetadata(TRIP_OWNER_KEY, proto.update)).toEqual({ message: TRIP_ADDON_OWNER_ONLY });
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, proto.update)).toBe(tripAddonsResponseSchema);
    expect(TripAddonUpdateDto.schema).toBe(tripAddonUpdateRequestSchema);
  });

  it('TRIPADDON-CTRL-004: PUT hands trip, caller, addon, choice and socket id to the service', async () => {
    const { service, controller } = makeController();
    expect(await controller.update(user, trip, 'budget', { enabled: false }, 'sock-9')).toEqual({ tripId: 7, addons });
    expect(service.setTripOverride).toHaveBeenCalledWith(7, 3, 'budget', false, 'sock-9');

    await controller.update(user, trip, 'budget', { enabled: null });
    expect(service.setTripOverride).toHaveBeenLastCalledWith(7, 3, 'budget', null, undefined);
  });
});
