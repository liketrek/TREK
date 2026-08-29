import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { RoadtripVia } from '@trek/shared';
import { RoadtripService } from './roadtrip.service';
import { RoadtripViaCreateDto, RoadtripViaReanchorDto, RoadtripViaUpdateDto } from './roadtrip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';

/**
 * /api/trips/:tripId/roadtrip — the points a drive is routed through (#1797).
 *
 * Gated on the road trip addon: an instance with it switched off gets 404s here, the same
 * as every other addon surface, and nothing about the plain day plan changes.
 *
 * No WebSocket broadcast, unlike the assignment routes. A via is a detail of how one
 * person's route is drawn rather than a change to the itinerary everybody reads, and
 * adding an event family for it would mean extending the typed trip-event catalogue for
 * something a collaborator sees on their next load anyway. Worth revisiting if vias ever
 * become shared editing rather than route shaping.
 */
@Controller('api/trips/:tripId/roadtrip')
@UseGuards(JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class RoadtripController {
  constructor(private readonly roadtrip: RoadtripService) {}

  /** Every via of the trip, so the client can route all days without a request per day. */
  @Get('vias')
  listAll(@Param('tripId') tripId: string): { vias: RoadtripVia[] } {
    return { vias: this.roadtrip.listForTrip(tripId) };
  }

  @Get('days/:dayId/vias')
  list(@Param('tripId') tripId: string, @Param('dayId') dayId: string): { vias: RoadtripVia[] } {
    this.requireDay(dayId, tripId);
    return { vias: this.roadtrip.listForDay(dayId) };
  }

  @RequirePermission('day_edit')
  @Post('days/:dayId/vias')
  create(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaCreateDto,
  ): { via: RoadtripVia } {
    this.requireDay(dayId, tripId);
    return { via: this.roadtrip.create(dayId, body) };
  }

  /**
   * Re-pin this day's vias after its stops changed shape.
   *
   * Declared before `vias/:id` so the static path is matched first, and taken as one
   * batch rather than a PUT per via: the anchors are only correct as a set, and a
   * half-applied shift leaves two vias on one leg and a third past the end of the day.
   */
  @RequirePermission('day_edit')
  @Put('days/:dayId/vias')
  @HttpCode(200)
  reanchor(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaReanchorDto,
  ): { vias: RoadtripVia[] } {
    this.requireDay(dayId, tripId);
    return { vias: this.roadtrip.reanchor(dayId, body) };
  }

  @RequirePermission('day_edit')
  @Put('days/:dayId/vias/:id')
  @HttpCode(200)
  update(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Body() body: RoadtripViaUpdateDto,
  ): { via: RoadtripVia } {
    this.requireDay(dayId, tripId);
    const via = this.roadtrip.move(id, dayId, body.lat, body.lng);
    if (!via) throw new HttpException({ error: 'Via not found' }, 404);
    return { via };
  }

  @RequirePermission('day_edit')
  @Delete('days/:dayId/vias/:id')
  remove(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
  ): { success: true } {
    this.requireDay(dayId, tripId);
    if (!this.roadtrip.remove(id, dayId)) {
      throw new HttpException({ error: 'Via not found' }, 404);
    }
    return { success: true };
  }

  /**
   * The guard proves the caller may reach the trip; this proves the day is part of it.
   * Without it a valid day id from someone else's trip would be editable through a trip
   * the caller does have access to.
   */
  private requireDay(dayId: string, tripId: string): void {
    if (!this.roadtrip.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
  }
}
