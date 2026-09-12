import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { ChargingService } from './charging.service';

@Controller('api/trips/:tripId/roadtrip/charging')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class ChargingController {
  constructor(private readonly charging: ChargingService) {}
  @Get(':placeId')
  read(@Param('tripId', ParseIntPipe) tripId: number, @Param('placeId', ParseIntPipe) placeId: number) { return this.charging.read(tripId, placeId); }
}
