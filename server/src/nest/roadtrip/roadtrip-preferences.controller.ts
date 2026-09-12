import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { RoadtripPreferencesService } from './roadtrip-preferences.service';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { roadtripPreferencesUpdateSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

class PreferencesDto extends createZodDto(roadtripPreferencesUpdateSchema) {}

@Controller('api/trips/:tripId/roadtrip/preferences')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class RoadtripPreferencesController {
  constructor(private readonly preferences: RoadtripPreferencesService) {}

  @Get()
  read(@Param('tripId') tripId: string) {
    return { tripId: Number(tripId), preferences: this.preferences.read(Number(tripId)) };
  }

  @Put()
  @RequirePermission('day_edit')
  update(@Param('tripId') tripId: string, @Body() patch: PreferencesDto) {
    return { tripId: Number(tripId), preferences: this.preferences.update(Number(tripId), patch) };
  }
}
