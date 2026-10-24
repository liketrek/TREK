import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { WandererEnabledGuard } from '../wanderer/wanderer-enabled.guard';
import { WandererImportDto, WandererSearchDto } from './dto/tours-wanderer.dto';
import { ToursWandererService } from './tours-wanderer.service';
import { WandererWatchService } from './wanderer-watch.service';
import { Body, Controller, Get, Headers, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import {
  tourSourceCheckResponseSchema,
  tourSourceHintResponseSchema,
  wandererImportPreviewSchema,
  wandererImportResponseSchema,
  wandererSearchResponseSchema,
} from '@trek/shared';

/**
 * `/api/trips/:tripId/tours/wanderer`: the caller's wanderer trails, seen from
 * a trip. Searching and previewing run on the caller's own connection, and
 * only someone who may add places to the trip gets to look, since looking is
 * the first step of importing. The import writes a tour like the GPX import
 * does, so it asks the same right.
 */
@Controller('api/trips/:tripId/tours/wanderer')
@UseGuards(AddonGuard, JwtAuthGuard, WandererEnabledGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class ToursWandererController {
  constructor(
    private readonly wanderer: ToursWandererService,
    private readonly watch: WandererWatchService,
  ) {}

  @RequirePermission('place_edit')
  @Post('search')
  @HttpCode(200)
  @ResponseContract(wandererSearchResponseSchema)
  search(@Param('tripId') tripId: string, @CurrentUser() user: User, @Body() body: WandererSearchDto) {
    return this.wanderer.search(tripId, user.id, { q: body.q, page: body.page, bbox: body.bbox });
  }

  @RequirePermission('place_edit')
  @Get('trails/:trailId')
  @ResponseContract(wandererImportPreviewSchema)
  preview(@Param('tripId') tripId: string, @Param('trailId') trailId: string, @CurrentUser() user: User) {
    return this.wanderer.preview(tripId, user.id, trailId);
  }

  /** MF-03: whether the trail a wanderer snapshot came from changed since; reads, writes nothing. */
  @RequirePermission('place_edit')
  @Post('sources/:placeId/check')
  @HttpCode(200)
  @ResponseContract(tourSourceCheckResponseSchema)
  checkSource(@Param('tripId') tripId: string, @Param('placeId') placeId: string, @CurrentUser() user: User) {
    return this.wanderer.checkSource(tripId, user.id, placeId);
  }

  /**
   * WAN-02: the caller's own background hint on a wanderer snapshot, when
   * their watch left one; it leads to the check above, so it asks the same right.
   */
  @RequirePermission('place_edit')
  @Get('sources/:placeId/hint')
  @ResponseContract(tourSourceHintResponseSchema)
  hint(@Param('tripId') tripId: string, @Param('placeId') placeId: string, @CurrentUser() user: User) {
    return this.watch.hintFor(tripId, user.id, placeId);
  }

  @RequirePermission('place_edit')
  @Post('import')
  @ResponseContract(wandererImportResponseSchema)
  import(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: WandererImportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.wanderer.import(tripId, user.id, body, socketId);
  }
}
