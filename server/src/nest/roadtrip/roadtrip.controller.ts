import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import {
  RoadtripViaBatchDto,
  RoadtripViaCreateDto,
  RoadtripViaReanchorDto,
  RoadtripViaUpdateDto,
} from './roadtrip.dto';
import { RoadtripService } from './roadtrip.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { RoadtripDayTrack, RoadtripVia } from '@trek/shared';

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
 *
 * The events are the service's (RoadtripService.addVia and its siblings), the same for
 * these routes and the road trip tools; a route hands it a writer that leaves out the
 * socket that sent the request.
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
  async listAll(@Param('tripId') tripId: string): Promise<{ vias: RoadtripVia[]; tracks: RoadtripDayTrack[] }> {
    return { vias: await this.roadtrip.listForTrip(tripId), tracks: await this.roadtrip.tracksForTrip(tripId) };
  }

  @Get('days/:dayId/vias')
  async list(@Param('tripId') tripId: string, @Param('dayId') dayId: string): Promise<{ vias: RoadtripVia[] }> {
    await this.requireDay(dayId, tripId);
    return { vias: await this.roadtrip.listForDay(dayId) };
  }

  @RequirePermission('day_edit')
  @Post('days/:dayId/vias')
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ via: RoadtripVia }> {
    await this.requireDay(dayId, tripId);
    const via = await this.roadtrip.addVia(dayId, body, this.roadtrip.restWriter(tripId, user, socketId));
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
  async createMany(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaBatchDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ vias: RoadtripVia[] }> {
    await this.requireDay(dayId, tripId);
    // Permission is not enough on its own: a place id from somebody else's trip would
    // otherwise become this day's label, and a place that is not a track would become a
    // label that can never be drawn.
    if (body.track && !(await this.roadtrip.trackExists(body.track.place_id, tripId))) {
      throw new HttpException({ error: 'Track not found' }, 404);
    }
    const vias = await this.roadtrip.addVias(tripId, dayId, body, this.roadtrip.restWriter(tripId, user, socketId));
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
  async reanchor(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: RoadtripViaReanchorDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ vias: RoadtripVia[] }> {
    await this.requireDay(dayId, tripId);
    const vias = await this.roadtrip.reanchorVias(dayId, body, this.roadtrip.restWriter(tripId, user, socketId));
    return { vias };
  }

  @RequirePermission('day_edit')
  @Put('days/:dayId/vias/:id')
  @HttpCode(200)
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Body() body: RoadtripViaUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ via: RoadtripVia }> {
    await this.requireDay(dayId, tripId);
    const writer = this.roadtrip.restWriter(tripId, user, socketId);
    const via = await this.roadtrip.moveVia(dayId, id, body, writer);
    if (!via) throw new HttpException({ error: 'Via not found' }, 404);
    return { via };
  }

  @RequirePermission('day_edit')
  @Delete('days/:dayId/vias/:id')
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<{ success: true }> {
    await this.requireDay(dayId, tripId);
    if (!(await this.roadtrip.removeVia(dayId, id, this.roadtrip.restWriter(tripId, user, socketId)))) {
      throw new HttpException({ error: 'Via not found' }, 404);
    }
    return { success: true };
  }

  /**
   * The guard proves the caller may reach the trip; this proves the day is part of it.
   * Without it a valid day id from someone else's trip would be editable through a trip
   * the caller does have access to.
   */
  private async requireDay(dayId: string, tripId: string): Promise<void> {
    if (!(await this.roadtrip.dayExists(dayId, tripId))) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
  }
}
