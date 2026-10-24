import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TourActivityExclusionDto } from './dto/tour-activity-stats.dto';
import { TourActivityStatsService } from './tour-activity-stats.service';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { tourActivityStatsResponseSchema } from '@trek/shared';

/**
 * STA-02 /api/tours/activity-stats: the user's own tour activities across
 * their trips, for the Atlas, and leaving one out of them. Not trip-scoped,
 * so there is no TripAccessGuard; the service bounds every answer by the
 * trips the user owns or is a member of. Leaving a tour out changes only the user's own sums, so it
 * asks for no trip permission beyond being able to open the trip.
 */
@Controller('api/tours/activity-stats')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourActivityStatsController {
  constructor(private readonly stats: TourActivityStatsService) {}

  @Get()
  @ResponseContract(tourActivityStatsResponseSchema)
  async list(@CurrentUser() user: User) {
    return await this.stats.stats(user.id);
  }

  @Put('exclusions')
  @ResponseContract(tourActivityStatsResponseSchema)
  async setExcluded(@CurrentUser() user: User, @Body() body: TourActivityExclusionDto) {
    return await this.stats.setExcluded(user.id, body);
  }
}
