import { Controller, Get, UseGuards } from '@nestjs/common';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { RoadtripHazardsService } from './roadtrip-hazards.service';

@Controller('api/trips/:tripId/roadtrip/hazards')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class RoadtripHazardsController {
  constructor(private readonly hazards: RoadtripHazardsService) {}
  @Get()
  read() { return this.hazards.read(); }
}
