import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { SkiAreaNearQueryDto, SkiRouteRequestDto } from './ski-routing.dto';
import { SkiRoutingService } from './ski-routing.service';
import { Body, Controller, Get, HttpCode, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { skiAreaNearResponseSchema, skiNetworkResponseSchema, skiRouteResponseSchema } from '@trek/shared';

import type { Response } from 'express';

/**
 * The piste router for a ski and winter tour (spec 7.2). It reads and writes
 * nothing of the trip; the trip in the path only says whose planner asks, so
 * anyone who can see the trip may. No route takes a point to the Places host:
 * the areas are downloaded by id and searched here.
 */
@Controller('api/trips/:tripId/ski')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class SkiRoutingController {
  constructor(private readonly routing: SkiRoutingService) {}

  /** POST /api/trips/:tripId/ski/route: every leg planned on the pistes, or failed with its reason. */
  @Post('route')
  @HttpCode(200)
  @ResponseContract(skiRouteResponseSchema)
  async route(@Body() body: SkiRouteRequestDto) {
    return await this.routing.route(body);
  }

  /** GET /api/trips/:tripId/ski/area-near: the ski area at a point; asking starts its download. */
  @Get('area-near')
  @ResponseContract(skiAreaNearResponseSchema)
  async areaNear(@Query() query: SkiAreaNearQueryDto) {
    return await this.routing.areaNear(query.lat, query.lng);
  }

  /** GET /api/trips/:tripId/ski/network/:areaId: an area's runs, lifts and trails for the map, tagged by its checksum. */
  @Get('network/:areaId')
  @ResponseContract(skiNetworkResponseSchema)
  async network(@Param('areaId') areaId: string, @Res({ passthrough: true }) res: Response) {
    const { sha256, ...network } = await this.routing.network(areaId);
    res.setHeader('ETag', `"${sha256}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return network;
  }
}
