import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { RequireAddon } from '../addons/require-addon.decorator';
import { TripAddonGuard } from '../addons/trip-addon.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { ParseRowIdPipe } from '../common/row-id.pipe';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TourDraftPutDto } from './dto/tour-draft.dto';
import { TourDraftsService } from './tour-drafts.service';
import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { successResponseSchema, tourDraftResponseSchema } from '@trek/shared';

/**
 * /api/trips/:tripId/tour-draft: the caller's own unsaved draft of the Tours
 * planner in this trip. Reading it and letting it go need the trip; keeping
 * one needs 'place_edit', as saving the tour it becomes does. Every route
 * names the signed-in user, so a traveller only ever reaches their own draft.
 */
@Controller('api/trips/:tripId/tour-draft')
@UseGuards(JwtAuthGuard, TripAccessGuard, TripAddonGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourDraftsController {
  constructor(private readonly drafts: TourDraftsService) {}

  @Get()
  @ResponseContract(tourDraftResponseSchema)
  async read(@CurrentUser() user: User, @Param('tripId', ParseRowIdPipe) tripId: number) {
    return await this.drafts.read(tripId, user.id);
  }

  @RequirePermission('place_edit')
  @Put()
  @ResponseContract(tourDraftResponseSchema)
  async keep(
    @CurrentUser() user: User,
    @Param('tripId', ParseRowIdPipe) tripId: number,
    @Body() body: TourDraftPutDto,
  ) {
    return await this.drafts.keep(tripId, user.id, body);
  }

  @Delete()
  @ResponseContract(successResponseSchema)
  async forget(@CurrentUser() user: User, @Param('tripId', ParseRowIdPipe) tripId: number) {
    return await this.drafts.forget(tripId, user.id);
  }
}
