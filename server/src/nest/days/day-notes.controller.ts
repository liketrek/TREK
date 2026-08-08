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
import { DayNotesService } from './day-notes.service';
import { DayNoteCreateDto, DayNoteUpdateDto } from './day-notes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/trips/:tripId/days/:dayId/notes — free-text annotations on a day.
 *
 * Bodies validate against the @trek/shared day-note contracts via the global
 * ZodValidationPipe (which, like the legacy string-length guard, 400s before
 * the trip-access check), then trip access (404), then the 'day_edit'
 * permission (403); create 201 / rest 200; the bespoke "Day not found" /
 * "Note not found" / "Text required" bodies; WebSocket broadcasts with the
 * forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/days/:dayId/notes')
@UseGuards(JwtAuthGuard)
export class DayNotesController {
  constructor(private readonly notes: DayNotesService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.notes.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: NonNullable<ReturnType<DayNotesService['verifyTripAccess']>>, user: User): void {
    if (!this.notes.canEdit(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('dayId') dayId: string) {
    this.requireTrip(tripId, user);
    return { notes: this.notes.list(dayId, tripId) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: DayNoteCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.notes.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    if (!body.text?.trim()) {
      throw new HttpException({ error: 'Text required' }, 400);
    }
    const note = this.notes.create(dayId, tripId, body.text, body.time, body.icon, body.sort_order);
    this.notes.broadcast(tripId, 'dayNote:created', { dayId: Number(dayId), note }, socketId);
    return { note };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Body() body: DayNoteUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const current = this.notes.getNote(id, dayId, tripId);
    if (!current) {
      throw new HttpException({ error: 'Note not found' }, 404);
    }
    const note = this.notes.update(id, current as never, { text: body.text, time: body.time, icon: body.icon, sort_order: body.sort_order });
    this.notes.broadcast(tripId, 'dayNote:updated', { dayId: Number(dayId), note }, socketId);
    return { note };
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.notes.getNote(id, dayId, tripId)) {
      throw new HttpException({ error: 'Note not found' }, 404);
    }
    this.notes.remove(id);
    this.notes.broadcast(tripId, 'dayNote:deleted', { noteId: Number(id), dayId: Number(dayId) }, socketId);
    return { success: true };
  }
}
