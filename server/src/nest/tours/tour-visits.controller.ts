import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourVisitUpdateDto } from './dto/tour-visit.dto';
import { TourVisitsService } from './tour-visits.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { stationKeySchema, tourVisitListResponseSchema } from '@trek/shared';

/**
 * CW-03: the stations of a city walk visited or skipped on its days.
 * GET /api/trips/:tripId/tour-visits reads every one of the trip; PUT
 * /api/trips/:tripId/tour-visits/:assignmentId/:stationKey marks one, as
 * someone who may edit the trip's days. Nothing here changes a route.
 */
@Controller('api/trips/:tripId/tour-visits')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourVisitsController {
  constructor(private readonly visits: TourVisitsService) {}

  @Get()
  @ResponseContract(tourVisitListResponseSchema)
  async list(@Param('tripId') tripId: string) {
    return await this.visits.list(tripId);
  }

  @RequirePermission('day_edit')
  @Put(':assignmentId/:stationKey')
  @ResponseContract(tourVisitListResponseSchema)
  async update(
    @Param('tripId') tripId: string,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('stationKey') stationKey: string,
    @Body() body: TourVisitUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!stationKeySchema.safeParse(stationKey).success) throw new BadRequestException('Invalid station key');
    return await this.visits.update(tripId, assignmentId, stationKey, body, socketId);
  }
}
