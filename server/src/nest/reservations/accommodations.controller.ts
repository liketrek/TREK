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
import { AccommodationsService } from './accommodations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

type AccommodationBody = {
  place_id?: number;
  start_day_id?: number;
  end_day_id?: number;
  check_in?: string | null;
  check_in_end?: string | null;
  check_out?: string | null;
  confirmation?: string | null;
  notes?: string | null;
};

/**
 * /api/trips/:tripId/accommodations — trip-scoped lodging blocks.
 *
 * Byte-identical to the legacy accommodations sub-router (server/src/routes/
 * days.ts): trip access (404 "Trip not found"), the 'day_edit' permission on
 * mutations (403), the bespoke 400 (missing refs) and 404 (validateRefs / not
 * found) bodies, create 201 / rest 200, and the cascade broadcasts (a created
 * accommodation also emits reservation:created; a delete emits the linked
 * reservation/budget deletions) with the forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/accommodations')
@UseGuards(JwtAuthGuard)
export class AccommodationsController {
  constructor(private readonly accommodations: AccommodationsService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.accommodations.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: NonNullable<ReturnType<AccommodationsService['verifyTripAccess']>>, user: User): void {
    if (!this.accommodations.canEdit(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { accommodations: this.accommodations.list(tripId) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: AccommodationBody,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = body;
    if (!place_id || !start_day_id || !end_day_id) {
      throw new HttpException({ error: 'place_id, start_day_id, and end_day_id are required' }, 400);
    }
    const errors = this.accommodations.validateRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) {
      throw new HttpException({ error: errors[0].message }, 404);
    }
    const accommodation = this.accommodations.create(tripId, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } as never);
    this.accommodations.broadcast(tripId, 'accommodation:created', { accommodation }, socketId);
    this.accommodations.broadcast(tripId, 'reservation:created', {}, socketId);
    return { accommodation };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AccommodationBody,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const existing = this.accommodations.get(id, tripId);
    if (!existing) {
      throw new HttpException({ error: 'Accommodation not found' }, 404);
    }
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = body;
    const errors = this.accommodations.validateRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) {
      throw new HttpException({ error: errors[0].message }, 404);
    }
    const accommodation = this.accommodations.update(id, existing as never, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } as never);
    this.accommodations.broadcast(tripId, 'accommodation:updated', { accommodation }, socketId);
    return { accommodation };
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
    if (!this.accommodations.get(id, tripId)) {
      throw new HttpException({ error: 'Accommodation not found' }, 404);
    }
    const { linkedReservationId, deletedBudgetItemId } = this.accommodations.remove(id);
    if (linkedReservationId) {
      this.accommodations.broadcast(tripId, 'reservation:deleted', { reservationId: linkedReservationId }, socketId);
    }
    if (deletedBudgetItemId) {
      this.accommodations.broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId }, socketId);
    }
    this.accommodations.broadcast(tripId, 'accommodation:deleted', { accommodationId: Number(id) }, socketId);
    return { success: true };
  }
}
