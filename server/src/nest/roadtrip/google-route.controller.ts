import { Body, Controller, Headers, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import type { Request } from 'express';
import { googleRouteImportSchema, googleRoutePreviewRequestSchema } from '@trek/shared';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { GoogleRouteService } from './google-route.service';

class PreviewDto extends createZodDto(googleRoutePreviewRequestSchema) {}
class ImportDto extends createZodDto(googleRouteImportSchema) {}

@Controller('api')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class GoogleRouteController {
  constructor(private readonly routes: GoogleRouteService) {}
  @Post('roadtrip/google-maps-preview')
  @HttpCode(200)
  preview(@Body() input: PreviewDto) { return this.routes.preview(input.url); }

  @Post('trips/:tripId/roadtrip/google-maps-import')
  @HttpCode(200)
  @UseGuards(TripAccessGuard)
  import(@Param('tripId') tripId: string, @Body() input: ImportDto,
    @Req() req: Request & { user: { id: number } }, @Headers('x-socket-id') socketId?: string) {
    return this.routes.import(Number(tripId), req.user.id, input, socketId);
  }
}
