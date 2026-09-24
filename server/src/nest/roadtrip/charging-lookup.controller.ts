import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { chargingLookupSchema } from '@trek/shared';
import { createZodDto } from 'nestjs-zod';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { ChargingService } from './charging.service';

/** Exported so the parity test can hold the route and the MCP tool to the same contract. */
export class ChargingLookupDto extends createZodDto(chargingLookupSchema) {}

/**
 * Charging availability for a station nobody has added yet.
 *
 * A sibling of `ChargingController` rather than another verb on it, because the two
 * ask in different ways: that one names a row in `places`, this one hands over a
 * coordinate. Same service, same cache, same answer.
 *
 * Trip-scoped on purpose, even though the trip is not part of the question. Leaving
 * `:tripId` out would take `TripAccessGuard` with it, and what is left is an open
 * proxy in front of somebody else's public API: anyone with the URL could aim it
 * anywhere on the planet at whatever rate they liked. Nothing asks this while not
 * planning a trip, so the scope costs the caller nothing.
 *
 * A POST for a read follows `RoadtripSearchController`: the input is a coordinate pair
 * and a name, which belongs in a body behind a contract rather than in a query string.
 */
@Controller('api/trips/:tripId/roadtrip/charging-lookup')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class ChargingLookupController {
  constructor(private readonly charging: ChargingService) {}
  @Post()
  @HttpCode(200)
  lookup(@Body() input: ChargingLookupDto) { return this.charging.lookup(input.lat, input.lng, input.name); }
}
