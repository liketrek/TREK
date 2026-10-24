import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourPackingLinkDto } from './dto/tour-packing-link.dto';
import { TourPackingLinkService } from './tour-packing-link.service';
import { Body, Controller, Delete, Get, Headers, Param, Put, UseGuards } from '@nestjs/common';
import { tourDetailResponseSchema, tourPackingLinkResponseSchema } from '@trek/shared';

/**
 * P2D-XD-01 /api/trips/:tripId/tours/:placeId/packing-link: the packing list,
 * or the category of it, a tour points at. Reading it needs the trip; pointing
 * the tour somewhere else or letting go needs 'place_edit', as every other
 * change of a tour does. The writes answer the tour with its link, so a write
 * replayed from the offline queue lands like any other tour write.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourPackingLinkController {
  constructor(private readonly packingLinks: TourPackingLinkService) {}

  @Get(':placeId/packing-link')
  @ResponseContract(tourPackingLinkResponseSchema)
  async read(@Param('tripId') tripId: string, @Param('placeId') placeId: string) {
    return await this.packingLinks.read(tripId, placeId);
  }

  @RequirePermission('place_edit')
  @Put(':placeId/packing-link')
  @ResponseContract(tourDetailResponseSchema)
  async link(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourPackingLinkDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.packingLinks.link(tripId, placeId, body, user.id, socketId);
  }

  @RequirePermission('place_edit')
  @Delete(':placeId/packing-link')
  @ResponseContract(tourDetailResponseSchema)
  async unlink(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.packingLinks.unlink(tripId, placeId, socketId);
  }
}
