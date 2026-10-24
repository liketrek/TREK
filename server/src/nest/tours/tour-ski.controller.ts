import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourSkiClassificationDto } from './dto/tour-ski.dto';
import { TourSkiService } from './tour-ski.service';
import { Body, Controller, Headers, Param, Put, UseGuards } from '@nestjs/common';
import { tourDetailResponseSchema } from '@trek/shared';

/**
 * SKI-02: PUT /api/trips/:tripId/tours/:placeId/ski classifies a ski track
 * again, its discipline and cross-country technique only, as someone who may
 * edit the trip's places. Answers the tour's detail, as the editor reads it.
 */
@Controller('api/trips/:tripId/tours/:placeId/ski')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourSkiController {
  constructor(private readonly ski: TourSkiService) {}

  @RequirePermission('place_edit')
  @Put()
  @ResponseContract(tourDetailResponseSchema)
  async classify(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourSkiClassificationDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.ski.classify(tripId, placeId, body, socketId);
  }
}
