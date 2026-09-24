import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { roadtripSearchAreaSchema } from '@trek/shared';
import { createZodDto } from 'nestjs-zod';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoadtripSearchService } from './roadtrip-search.service';

class SearchAreaDto extends createZodDto(roadtripSearchAreaSchema) {}

@Controller('api/roadtrip/search-area')
@UseGuards(JwtAuthGuard, AddonGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class RoadtripSearchController {
  constructor(private readonly search: RoadtripSearchService) {}
  @Post()
  @HttpCode(200)
  read(@Body() input: SearchAreaDto, @Req() req: Request & { user: { id: number } }) {
    return this.search.search(input, req.user.id);
  }
}
