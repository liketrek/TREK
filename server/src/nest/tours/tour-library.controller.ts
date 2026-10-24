import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { toRowId } from '../common/row-id';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourLibraryQueryDto, TourTakeOverDto } from './dto/tour-library.dto';
import { TourLibraryService } from './tour-library.service';
import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { tourCreateResponseSchema, tourLibraryDetailResponseSchema, tourLibraryResponseSchema } from '@trek/shared';

/**
 * LIB-02 /api/tours/library: the tours of every trip the user can open, to
 * pick one to take over. Not trip-scoped, so there is no TripAccessGuard; the
 * service bounds every answer by the user's own trips.
 */
@Controller('api/tours/library')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourLibraryController {
  constructor(private readonly library: TourLibraryService) {}

  @Get()
  @ResponseContract(tourLibraryResponseSchema)
  async list(@CurrentUser() user: User, @Query() query: TourLibraryQueryDto) {
    return await this.library.list(user.id, query);
  }

  @Get(':placeId')
  @ResponseContract(tourLibraryDetailResponseSchema)
  async detail(@CurrentUser() user: User, @Param('placeId') placeId: string) {
    const id = toRowId(placeId);
    if (id === null) throw new NotFoundException('Tour not found');
    return await this.library.detail(user.id, id);
  }
}

/**
 * LIB-02 POST /api/trips/:tripId/tours/take-over: a tour of another trip the
 * user can open, copied into this one. The guard checks this trip and
 * 'place_edit' on it; the service checks the source trip.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourTakeOverController {
  constructor(private readonly library: TourLibraryService) {}

  @RequirePermission('place_edit')
  @Post('take-over')
  @ResponseContract(tourCreateResponseSchema)
  async takeOver(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: TourTakeOverDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.library.takeOver(tripId, user.id, body, socketId);
  }
}
