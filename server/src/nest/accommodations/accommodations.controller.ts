import {
  Body,
  Controller,
  Delete,
  Query,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { AccommodationsService, type MirrorSender } from './accommodations.service';
import { AccommodationCreateDto, AccommodationUpdateDto } from './accommodations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';

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
 *
 * A booking also writes the day stop that puts it on the route. What that did to
 * the day plan goes to every socket, the sender's included (see mirrorSender),
 * and the answers carry the stop alongside the existing fields as well, for a
 * session whose socket is down at that moment.
 */
@Controller('api/trips/:tripId/accommodations')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('day_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class AccommodationsController {
  constructor(private readonly accommodations: AccommodationsService) {}

  /**
   * The mirror's door out, with no socket to skip.
   *
   * The booking events above it are echo-suppressed because the client already drew
   * what it sent. It never sent the day plan's side of the write: the stop is in the
   * answer, but the order the night was seated into and the vias re-pinned around it
   * are not, and a session that applies the stop from the answer alone keeps the
   * stops behind it on their old numbers until a reload. Over the socket the stop
   * and the order arrive together and in order, and the answer's copy of the stop
   * is a duplicate the store already drops.
   */
  private mirrorSender(tripId: string): MirrorSender {
    return (event, payload) => this.accommodations.broadcast(tripId, event, payload, undefined);
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { accommodations: this.accommodations.list(tripId) };
  }

  @RequirePermission('day_edit')
  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() rawBody: AccommodationCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const body = rawBody as AccommodationBody;
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = body;
    if (!place_id || !start_day_id || !end_day_id) {
      throw new HttpException({ error: 'place_id, start_day_id, and end_day_id are required' }, 400);
    }
    const errors = this.accommodations.validateRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) {
      throw new HttpException({ error: errors[0].message }, 404);
    }
    const { accommodation, mirror } = this.accommodations.create(tripId, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } as never);
    this.accommodations.broadcast(tripId, 'accommodation:created', { accommodation }, socketId);
    this.accommodations.broadcast(tripId, 'reservation:created', {}, socketId);
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId), socketId);
    // The stop rides in the answer as well, for the session that booked the night
    // with its socket down: over the socket it would already have it.
    return { accommodation, assignment: mirror.created };
  }

  @RequirePermission('day_edit')
  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() rawBody: AccommodationUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const body = rawBody as AccommodationBody;
    const existing = this.accommodations.get(id, tripId);
    if (!existing) {
      throw new HttpException({ error: 'Accommodation not found' }, 404);
    }
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = body;
    const errors = this.accommodations.validateRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) {
      throw new HttpException({ error: errors[0].message }, 404);
    }
    const { accommodation, mirror } = this.accommodations.update(id, existing as never, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } as never);
    this.accommodations.broadcast(tripId, 'accommodation:updated', { accommodation }, socketId);
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId), socketId);
    return { accommodation, assignment: mirror.created, movedAssignment: mirror.moved, removedAssignments: mirror.removed };
  }

  @RequirePermission('day_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
    @Query('keepStop') keepStop?: string,
  ) {
    if (!this.accommodations.get(id, tripId)) {
      throw new HttpException({ error: 'Accommodation not found' }, 404);
    }
    // Turning a night back into a pause in road trip mode: the booking goes, the
    // stop stays and becomes the traveller's. Everywhere else a cancelled booking
    // takes the stop it brought with it.
    const { linkedReservationIds, deletedBudgetItemIds, mirror } = this.accommodations.remove(id, { keepStop: keepStop === 'true' });
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId), socketId);
    for (const reservationId of linkedReservationIds) {
      this.accommodations.broadcast(tripId, 'reservation:deleted', { reservationId }, socketId);
    }
    for (const itemId of deletedBudgetItemIds) {
      this.accommodations.broadcast(tripId, 'budget:deleted', { itemId }, socketId);
    }
    this.accommodations.broadcast(tripId, 'accommodation:deleted', { accommodationId: Number(id) }, socketId);
    return { success: true, removedAssignments: mirror.removed, updatedAssignments: mirror.updated };
  }
}
