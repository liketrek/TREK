import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { JourneyMapService } from './journey-map.service';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { journeyMapLayersResponseSchema } from '@trek/shared';

/**
 * GET /api/journeys/:id/map-layers (JRN-04): the plan, the routes and the
 * stays the journey map can show beside its entries, each source answering on
 * its own. Read-only and derived, like `/tracks`; the journey's own access
 * applies, a stranger gets the same 404 as for the journey itself.
 */
@Controller('api/journeys')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
export class JourneyMapController {
  constructor(private readonly map: JourneyMapService) {}

  @Get(':id/map-layers')
  @ResponseContract(journeyMapLayersResponseSchema)
  async layers(@CurrentUser() user: User, @Param('id') id: string) {
    return this.map.mapLayers(Number(id), user.id);
  }
}
