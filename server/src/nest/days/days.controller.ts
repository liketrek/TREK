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
import { DaysService, DayReorderError } from './days.service';
import { DayCreateDto, DayReorderDto, DayTransportDto, DayUpdateDto } from './days.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';

/**
 * /api/trips/:tripId/days — trip itinerary days.
 *
 * Byte-identical to the legacy Express route (server/src/routes/days.ts): trip
 * access (404 "Trip not found"), the 'day_edit' permission on mutations (403),
 * create 201 / rest 200, the bespoke 404 "Day not found", and WebSocket
 * broadcasts with the forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/days')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach, so every
// handler below is already scoped. Mutations add @RequirePermission('day_edit'),
// which is the same action string days.service.canEdit passes — the MCP tools still
// go through that method, and this keeps the two from drifting.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class DaysController {
  constructor(private readonly days: DaysService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return this.days.list(tripId);
  }

  @RequirePermission('day_edit')
  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: DayCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
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

  @RequirePermission('day_edit')
  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: DayReorderDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
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

  @RequirePermission('day_edit')
  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: DayUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const current = this.days.getDay(id, tripId);
    if (!current) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    // The zod-parsed body carries only the keys the client actually sent, so
    // the service's presence sentinels preserve the omitted column (the client
    // updates notes and title in separate requests).
    const day = this.days.update(id, current as never, body);
    this.days.broadcast(tripId, 'day:updated', { day }, socketId);
    return { day };
  }

  @RequirePermission('day_edit')
  @Put(':id/transport')
  transport(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: DayTransportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.days.getDay(id, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    const day = this.days.setDefaultTransportMode(id, body.transport_mode ?? null);
    this.days.broadcast(tripId, 'day:updated', { day }, socketId);
    return { day };
  }

  @RequirePermission('day_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.days.getDay(id, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    this.days.remove(id);
    this.days.broadcast(tripId, 'day:deleted', { dayId: Number(id) }, socketId);
    return { success: true };
  }
}
