import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { TourPoiSearchDto } from './dto/tour-poi-search.dto';
import { TourPoiSearchService } from './tour-poi-search.service';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { tourPoiSearchResponseSchema } from '@trek/shared';

/**
 * PLN-02 POST /api/trips/:tripId/tours/poi-search: places along the line of
 * the tour being planned. A read, so anyone who sees the trip may ask; the
 * line comes in the body because the draft may not be saved yet.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourPoiSearchController {
  constructor(private readonly search: TourPoiSearchService) {}

  @Post('poi-search')
  @HttpCode(200)
  @ResponseContract(tourPoiSearchResponseSchema)
  async searchAlong(@Body() body: TourPoiSearchDto) {
    return await this.search.search(body);
  }
}
