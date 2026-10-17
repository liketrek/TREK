import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { PaddleRouteRequestDto } from './paddle-routing.dto';
import { PaddleRoutingService } from './paddle-routing.service';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { paddleRouteResponseSchema } from '@trek/shared';

/**
 * POST /api/trips/:tripId/paddle/route: legs of a paddle tour planned on the
 * water (PAD-11). It reads and writes nothing of the trip; the trip in the
 * path only says whose planner asks, so anyone who can see the trip may.
 */
@Controller('api/trips/:tripId/paddle')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class PaddleRoutingController {
  constructor(private readonly routing: PaddleRoutingService) {}

  @Post('route')
  @HttpCode(200)
  @ResponseContract(paddleRouteResponseSchema)
  async route(@Body() body: PaddleRouteRequestDto) {
    return await this.routing.route(body);
  }
}
