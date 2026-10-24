import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { DomainError } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { toRowId } from '../common/row-id';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { CollectionToursService } from './collection-tours.service';
import { CollectionTourSaveDto, CollectionTourTakeOverDto } from './dto/collection-tours.dto';
import { Body, Controller, Delete, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import {
  collectionTourDetailResponseSchema,
  collectionTourListResponseSchema,
  collectionTourSaveResponseSchema,
  successResponseSchema,
  tourCreateResponseSchema,
} from '@trek/shared';

/** A route id as a row id; a malformed one is a missing row, never a 500. */
function rowId(raw: string, missing: string): number {
  const id = toRowId(raw);
  if (id === null) throw new DomainError(404, missing);
  return id;
}

/**
 * LIB-03 /api/addons/collections/:collectionId/tours: the whole tours a
 * collection keeps. Not trip-scoped; the service checks the user's role in
 * the collection (404 for one they cannot see, 403 for a role that may not)
 * and, when a tour is kept, that they can open the trip it comes from.
 */
@Controller('api/addons/collections/:collectionId/tours')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class CollectionToursController {
  constructor(private readonly kept: CollectionToursService) {}

  @Get()
  @ResponseContract(collectionTourListResponseSchema)
  async list(@CurrentUser() user: User, @Param('collectionId') collectionId: string) {
    return await this.kept.list(user.id, rowId(collectionId, 'Collection not found'));
  }

  @Post()
  @ResponseContract(collectionTourSaveResponseSchema)
  async save(
    @CurrentUser() user: User,
    @Param('collectionId') collectionId: string,
    @Body() body: CollectionTourSaveDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.kept.save(user.id, rowId(collectionId, 'Collection not found'), body, socketId);
  }

  @Get(':tourId')
  @ResponseContract(collectionTourDetailResponseSchema)
  async detail(
    @CurrentUser() user: User,
    @Param('collectionId') collectionId: string,
    @Param('tourId') tourId: string,
  ) {
    return await this.kept.detail(user, rowId(collectionId, 'Collection not found'), rowId(tourId, 'Tour not found'));
  }

  @Delete(':tourId')
  @ResponseContract(successResponseSchema)
  async remove(
    @CurrentUser() user: User,
    @Param('collectionId') collectionId: string,
    @Param('tourId') tourId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    await this.kept.remove(
      user.id,
      rowId(collectionId, 'Collection not found'),
      rowId(tourId, 'Tour not found'),
      socketId,
    );
    return { success: true as const };
  }
}

/**
 * LIB-03 POST /api/trips/:tripId/tours/from-collection: a tour kept in a
 * collection made into a new tour of this trip. The guard checks this trip and
 * 'place_edit' on it; the service checks the collection.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class CollectionTourTakeOverController {
  constructor(private readonly kept: CollectionToursService) {}

  @RequirePermission('place_edit')
  @Post('from-collection')
  @ResponseContract(tourCreateResponseSchema)
  async takeOver(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: CollectionTourTakeOverDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.kept.takeOver(tripId, user.id, body, socketId);
  }
}
