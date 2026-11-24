import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { TripAddonGuard } from '../addons/trip-addon.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { GoogleRouteService } from './google-route.service';
import { Body, Controller, Headers, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { googleRouteImportSchema, googleRoutePreviewRequestSchema } from '@trek/shared';

import type { Request } from 'express';
import { createZodDto } from 'nestjs-zod';

export class PreviewDto extends createZodDto(googleRoutePreviewRequestSchema) {}
export class ImportDto extends createZodDto(googleRouteImportSchema) {}

/**
 * The preview has no trip, so AddonGuard opens it while the instance or any
 * trip of the caller has Road trip on. The import writes into one trip and
 * asks that trip, after TripAccessGuard.
 */
@Controller('api')
@UseGuards(JwtAuthGuard, AddonGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class GoogleRouteController {
  constructor(private readonly routes: GoogleRouteService) {}
  @Post('roadtrip/google-maps-preview')
  @HttpCode(200)
  preview(@Body() input: PreviewDto) {
    return this.routes.preview(input.url);
  }

  @Post('trips/:tripId/roadtrip/google-maps-import')
  @HttpCode(200)
  @UseGuards(TripAccessGuard, TripAddonGuard)
  import(
    @Param('tripId') tripId: string,
    @Body() input: ImportDto,
    @Req() req: Request & { user: { id: number } },
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.routes.import(Number(tripId), req.user.id, input, socketId);
  }
}
