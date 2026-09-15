import { Body, Controller, Delete, Get, Headers, HttpCode, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { RoadtripDayTrack, RoadtripVia } from '@trek/shared';
import { RoadtripService } from './roadtrip.service';
import { RoadtripViaBatchDto, RoadtripViaCreateDto, RoadtripViaReanchorDto, RoadtripViaUpdateDto } from './roadtrip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { AddonGuard } from '../addons/addon.guard';
import { ADDON_IDS } from '../../addons';

/**
 * /api/trips/:tripId/roadtrip — the points a drive is routed through (#1797).
 *
 * Gated on the road trip addon: an instance with it switched off gets 404s here, the same
 * as every other addon surface, and nothing about the plain day plan changes.
 *
 * Every write here broadcasts, like the assignment routes. This used to be silent, on
 * the reasoning that a via is how one person draws their route rather than a change to
 * the itinerary everybody reads. That does not survive contact with two people planning
 * one road trip: they look at the same line on the same map, and a reshaped drive moves
 * every arrival time after it. Waiting for the other side's next reload is not "eventual
 * consistency", it is two people editing a route neither can see the other change.
 */
@Controller('api/trips/:tripId/roadtrip')
// AddonGuard FIRST: @RequireAddon is metadata and does nothing on its own, and the guard
// is not registered globally either, so without it here the decorator below was inert and
// all six routes answered on an instance that had the addon switched off. It leads the
// chain because a disabled addon owes an anonymous caller a 404, not a 401.
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
export class RoadtripController {
  constructor(private readonly roadtrip: RoadtripService) {}

  /** Every via of the trip, so the client can route all days without a request per day. */
  @Get('vias')
  listAll(@Param('tripId') tripId: string): { vias: RoadtripVia[]; tracks: RoadtripDayTrack[] } {
    return { vias: this.roadtrip.listForTrip(tripId), tracks: this.roadtrip.tracksForTrip(tripId) };
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
    @Headers('x-socket-id') socketId?: string,
  ): { via: RoadtripVia } {
    this.requireDay(dayId, tripId);
    const via = this.roadtrip.create(dayId, body);
    this.announce(tripId, dayId, socketId);
    return { via };
  }

  /**
   * Lay a whole chain of vias on one day at once.
   *
   * Separate from the single-via route rather than folded into it: this one takes a list
   * and can clear the legs it is about to fill, which is what deriving a day's route from
   * a recorded track or a signed road needs. Doing it one point at a time would re-route
   * the whole trip once per point.
   */
  @RequirePermission('day_edit')
  @Post('days/:dayId/vias/batch')
  @HttpCode(200)
  createMany(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaBatchDto,
    @Headers('x-socket-id') socketId?: string,
  ): { vias: RoadtripVia[] } {
    this.requireDay(dayId, tripId);
    // Permission is not enough on its own: a place id from somebody else's trip would
    // otherwise become this day's label, and a place that is not a track would become a
    // label that can never be drawn.
    if (body.track && !this.roadtrip.trackExists(body.track.place_id, tripId)) {
      throw new HttpException({ error: 'Track not found' }, 404);
    }
    const vias = this.roadtrip.createMany(dayId, body);
    this.announce(tripId, dayId, socketId);
    // A batch is how a day starts following a recorded track, so the track it now follows
    // is news in its own right: the rail draws a badge for it and the map a line.
    this.roadtrip.broadcast(tripId, 'roadtripTrack:changed', {
      dayId,
      track: this.roadtrip.tracksForTrip(tripId).find(t => String(t.day_id) === String(dayId)) ?? null,
    }, socketId);
    return { vias };
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
    @Headers('x-socket-id') socketId?: string,
  ): { vias: RoadtripVia[] } {
    this.requireDay(dayId, tripId);
    const vias = this.roadtrip.reanchor(dayId, body);
    this.announce(tripId, dayId, socketId);
    return { vias };
  }

  @RequirePermission('day_edit')
  @Put('days/:dayId/vias/:id')
  @HttpCode(200)
  update(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Body() body: RoadtripViaUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ): { via: RoadtripVia } {
    this.requireDay(dayId, tripId);
    const via = this.roadtrip.move(id, dayId, body.lat, body.lng, body.after_order_index);
    if (!via) throw new HttpException({ error: 'Via not found' }, 404);
    this.announce(tripId, dayId, socketId);
    return { via };
  }

  @RequirePermission('day_edit')
  @Delete('days/:dayId/vias/:id')
  remove(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ): { success: true } {
    this.requireDay(dayId, tripId);
    if (!this.roadtrip.remove(id, dayId)) {
      throw new HttpException({ error: 'Via not found' }, 404);
    }
    this.announce(tripId, dayId, socketId);
    return { success: true };
  }

  /**
   * Says what this day's drive is routed through now.
   *
   * Read back rather than assembled from what the write returned: a reanchor rewrites the
   * whole set, a batch may clear legs before filling them, and one shape for all five
   * routes means a client applies them all the same way. The originating socket is
   * excluded, so the person dragging does not get their own point handed back mid-drag.
   */
  private announce(tripId: string, dayId: string, socketId: string | undefined): void {
    this.roadtrip.broadcast(tripId, 'roadtripVia:changed', {
      dayId,
      vias: this.roadtrip.listForDay(dayId),
    }, socketId);
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
