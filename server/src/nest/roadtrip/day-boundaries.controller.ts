import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { roadtripDayBoundarySchema } from '@trek/shared';
import { ADDON_IDS } from '../../addons';
import { RequireAddon } from '../addons/require-addon.decorator';
import { AddonGuard } from '../addons/addon.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { RealtimeService } from '../realtime/realtime.service';
import { DayBoundariesService } from './day-boundaries.service';

export class DayBoundaryDto extends createZodDto(roadtripDayBoundarySchema) {}

@Controller('api/trips/:tripId/roadtrip/day-boundaries')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class DayBoundariesController {
  constructor(private readonly boundaries: DayBoundariesService, private readonly realtime: RealtimeService) {}

  @Get()
  async list(@Param('tripId') tripId: string) {
    return { boundaries: await this.boundaries.list(tripId) };
  }

  @Put()
  @RequirePermission('day_edit')
  async save(@Param('tripId') tripId: string, @Body() body: DayBoundaryDto, @Headers('x-socket-id') socketId?: string) {
    const boundaries = await this.boundaries.save(tripId, body);
    this.realtime.broadcast(tripId, 'roadtripBoundary:changed', { boundaries }, socketId);
    return { boundaries };
  }

  @Delete(':dayNumber')
  @RequirePermission('day_edit')
  async remove(@Param('tripId') tripId: string, @Param('dayNumber', ParseIntPipe) dayNumber: number, @Headers('x-socket-id') socketId?: string) {
    const boundaries = await this.boundaries.remove(tripId, dayNumber);
    this.realtime.broadcast(tripId, 'roadtripBoundary:changed', { boundaries }, socketId);
    return { boundaries };
  }
}
