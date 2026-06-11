import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { DaysService } from './days.service';
import { DayReorderError } from '../../services/dayService';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/trips/:tripId/days — trip itinerary days.
 *
 * Byte-identical to the legacy Express route (server/src/routes/days.ts): trip
 * access (404 "Trip not found"), the 'day_edit' permission on mutations (403),
 * create 201 / rest 200, the bespoke 404 "Day not found", and WebSocket
 * broadcasts with the forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/days')
@UseGuards(JwtAuthGuard)
export class DaysController {
  constructor(private readonly days: DaysService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.days.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: NonNullable<ReturnType<DaysService['verifyTripAccess']>>, user: User): void {
    if (!this.days.canEdit(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return this.days.list(tripId);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { date?: string; notes?: string; position?: number },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    // A `position` means "insert a new empty day here" (which on a dated trip
    // extends the trip and re-pins dates); without it, the legacy append.
    const day = body.position !== undefined
      ? this.days.insert(tripId, body.position)
      : this.days.create(tripId, body.date, body.notes);
    // An insert can shuffle dates/positions of other days, so collaborators
    // refetch the whole list; a plain append only needs the new day.
    const event = body.position !== undefined ? 'day:reordered' : 'day:created';
    this.days.broadcast(tripId, event, { day }, socketId);
    return { day };
  }

  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { orderedIds?: number[] },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!Array.isArray(body.orderedIds)) {
      throw new HttpException({ error: 'orderedIds must be an array' }, 400);
    }
    try {
      this.days.reorder(tripId, body.orderedIds);
    } catch (err) {
      if (err instanceof DayReorderError) {
        throw new HttpException({ error: err.message }, 400);
      }
      throw err;
    }
    this.days.broadcast(tripId, 'day:reordered', { orderedIds: body.orderedIds }, socketId);
    return { success: true };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: { notes?: string; title?: string | null },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const current = this.days.getDay(id, tripId);
    if (!current) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    const day = this.days.update(id, current as never, { notes: body.notes, title: body.title });
    this.days.broadcast(tripId, 'day:updated', { day }, socketId);
    return { day };
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.days.getDay(id, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    this.days.remove(id);
    this.days.broadcast(tripId, 'day:deleted', { dayId: Number(id) }, socketId);
    return { success: true };
  }
}
