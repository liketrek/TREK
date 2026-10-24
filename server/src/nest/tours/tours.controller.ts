import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { contentDisposition } from '../common/content-disposition';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourCopyDto, TourCreateDto } from './dto/tour-create.dto';
import { TourObstacleReviewsDto } from './dto/tour-obstacle-reviews.dto';
import { TourPaddlePlanDto } from './dto/tour-paddle-plan.dto';
import { TourGpxExportService } from './tour-gpx-export.service';
import { TourObstacleReviewsService } from './tour-obstacle-reviews.service';
import { TourPaddlePlanService } from './tour-paddle-plan.service';
import { ToursService } from './tours.service';
import { Body, Controller, Get, Headers, HttpCode, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { tourCreateResponseSchema, tourDetailResponseSchema } from '@trek/shared';

import type { Response } from 'express';

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
  constructor(
    private readonly tours: ToursService,
    private readonly paddlePlans: TourPaddlePlanService,
    private readonly obstacleReviews: TourObstacleReviewsService,
    private readonly gpxExport: TourGpxExportService,
  ) {}

  @Get()
  async list(@Param('tripId') tripId: string) {
    return { tours: await this.tours.listTours(tripId) };
  }

  /**
   * PR1-06A: the saved tour as a GPX file, its whole line with the heights it
   * has. A read, so seeing the trip is enough; 422 when the tour has no line.
   * response-contract-exempt: a file download written through @Res(), not a JSON body.
   */
  @Get(':placeId/export.gpx')
  async exportGpx(@Param('tripId') tripId: string, @Param('placeId') placeId: string, @Res() res: Response) {
    const { gpx, filename } = await this.gpxExport.export(tripId, placeId);
    res.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
    res.setHeader('Content-Disposition', contentDisposition(filename, 'attachment'));
    res.send(gpx);
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

  /** P2C-07: the tour saved again as a new, independent tour of the trip, without its days. */
  @RequirePermission('place_edit')
  @Post(':placeId/copy')
  @ResponseContract(tourCreateResponseSchema)
  async copy(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourCopyDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.tours.copyTour(tripId, placeId, body.name, socketId);
  }

  /**
   * PAD-03/PAD-07: the portages, locks and speeds of a recorded paddle track,
   * laid onto it without redrawing it. A planned tour saves these with its route.
   */
  @RequirePermission('place_edit')
  @Put(':placeId/paddle-plan')
  @ResponseContract(tourDetailResponseSchema)
  async updatePaddlePlan(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourPaddlePlanDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.paddlePlans.update(tripId, placeId, body, socketId);
  }

  /**
   * PAD-06: what the paddlers decided about the obstacles of a paddle tour,
   * each bound to the route and the data the user saw. Answers the detail
   * with its checklist; 503 while the obstacle data cannot be read.
   */
  @RequirePermission('place_edit')
  @Put(':placeId/obstacle-reviews')
  @ResponseContract(tourDetailResponseSchema)
  async saveObstacleReviews(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Body() body: TourObstacleReviewsDto,
    @CurrentUser() user: User,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.obstacleReviews.save(tripId, placeId, body, user.id, socketId);
  }

  /** Takes an import planned over in place back to its recorded track; the planning is dropped. */
  @RequirePermission('place_edit')
  @Post(':placeId/restore-recorded')
  @HttpCode(200)
  @ResponseContract(tourDetailResponseSchema)
  async restoreRecorded(
    @Param('tripId') tripId: string,
    @Param('placeId') placeId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.tours.restoreRecordedTrack(tripId, placeId, socketId);
  }
}
