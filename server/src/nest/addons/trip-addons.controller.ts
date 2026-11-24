import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { RequireTripOwner, TripOwnerGuard } from '../permissions/trip-owner.guard';
import { Trip } from '../permissions/trip.decorator';
import { TRIP_ADDON_OWNER_ONLY, TripAddonsService } from './trip-addons.service';
import { Body, Controller, Get, Headers, Param, Put, UseGuards } from '@nestjs/common';
import { tripAddonsResponseSchema, tripAddonUpdateRequestSchema, type TripAddonsResponse } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TripAddonUpdateDto extends createZodDto(tripAddonUpdateRequestSchema) {}

/**
 * The trip addons of one trip, each on or off for it.
 *
 * Every member reads the list; only the owner changes it (TripOwnerGuard, which
 * an admin who does not own the trip does not pass). A trip the caller cannot
 * see is a 404 from TripAccessGuard before anything else is read.
 *
 * No AddonGuard here: the list is the place to switch an addon on for a trip
 * while it is off for the instance, so it has to answer whatever the
 * instance switches say.
 */
@Controller('api/trips/:tripId/addons')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class TripAddonsController {
  constructor(private readonly tripAddons: TripAddonsService) {}

  @Get()
  @ResponseContract(tripAddonsResponseSchema)
  async list(@Trip() trip: TripAccess): Promise<TripAddonsResponse> {
    return { tripId: trip.id, addons: await this.tripAddons.effectiveTripAddons(trip.id) };
  }

  @Put(':addonId')
  @UseGuards(TripOwnerGuard)
  @RequireTripOwner(TRIP_ADDON_OWNER_ONLY)
  @ResponseContract(tripAddonsResponseSchema)
  async update(
    @CurrentUser() user: User,
    @Trip() trip: TripAccess,
    @Param('addonId') addonId: string,
    @Body() body: TripAddonUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<TripAddonsResponse> {
    const addons = await this.tripAddons.setTripOverride(trip.id, user.id, addonId, body.enabled, socketId);
    return { tripId: trip.id, addons };
  }
}
