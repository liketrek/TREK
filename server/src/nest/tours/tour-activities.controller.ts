import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourActivityAssignDto } from './dto/tour-activity.dto';
import { TourActivitiesService } from './tour-activities.service';
import { Body, Controller, Delete, Headers, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { tourDetailResponseSchema } from '@trek/shared';

/**
 * ACT-01: the recorded tracks of a tour. PUT
 * /api/trips/:tripId/tours/:placeId/activities assigns a recording of the trip
 * to one execution of the tour (a day it is on, or none); DELETE
 * .../activities/:activityId takes it off again. Both answer the tour as its
 * detail reads it and need 'place_edit', like every other change of a tour.
 * Reading them is the tour's detail.
 */
@Controller('api/trips/:tripId/tours/:placeId/activities')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourActivitiesController {
  constructor(private readonly activities: TourActivitiesService) {}

  @RequirePermission('place_edit')
  @Put()
  @ResponseContract(tourDetailResponseSchema)
  async assign(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourActivityAssignDto,
    @CurrentUser() user: User,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.activities.assign(tripId, placeId, body, user.id, socketId);
  }

  @RequirePermission('place_edit')
  @Delete(':activityId')
  @ResponseContract(tourDetailResponseSchema)
  async unassign(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.activities.unassign(tripId, placeId, activityId, socketId);
  }
}
