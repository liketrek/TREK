import { Body, Controller, Get, Headers, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ToursService } from './tours.service';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { TourCreateDto } from './dto/tour-create.dto';

/**
 * /api/trips/:tripId/tours: the Tours facet, read and route edits.
 * TripAccessGuard resolves
 * :tripId (404 for no access); writes require 'place_edit'. Assignments stay
 * on the existing day_edit endpoints. The multipart GPX import lives in
 * ToursImportController, which checks the same rules in its handler.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class ToursController {
  constructor(private readonly tours: ToursService) {}

  @Get()
  async list(@Param('tripId') tripId: string) {
    return { tours: await this.tours.listTours(tripId) };
  }

  @Get(':placeId')
  async detail(@Param('tripId') tripId: string, @Param('placeId') placeId: string) {
    return await this.tours.getTour(tripId, placeId);
  }

  @RequirePermission('place_edit')
  @Post()
  async create(
    @Param('tripId') tripId: string,
    @Body() body: TourCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.tours.createTour(tripId, body, socketId);
  }

  @RequirePermission('place_edit')
  @Put(':placeId')
  async update(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.tours.updateTour(tripId, placeId, body, socketId);
  }
}
