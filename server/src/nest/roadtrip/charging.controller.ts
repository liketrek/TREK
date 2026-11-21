import { ADDON_IDS } from '../../addons';
import { RequireAddon } from '../addons/require-addon.decorator';
import { TripAddonGuard } from '../addons/trip-addon.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ParseRowIdPipe } from '../common/row-id.pipe';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { ChargingService } from './charging.service';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

@Controller('api/trips/:tripId/roadtrip/charging')
@UseGuards(JwtAuthGuard, TripAccessGuard, TripAddonGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class ChargingController {
  constructor(private readonly charging: ChargingService) {}
  @Get(':placeId')
  read(@Param('tripId', ParseRowIdPipe) tripId: number, @Param('placeId', ParseRowIdPipe) placeId: number) {
    return this.charging.read(tripId, placeId);
  }
}
