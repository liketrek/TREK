import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { AccommodationCreateDto, AccommodationUpdateDto } from './accommodations.dto';
import { AccommodationsService, type StayInput } from './accommodations.service';
import { Body, Controller, Delete, Query, Get, Headers, Param, Post, Put, UseGuards } from '@nestjs/common';

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
 * the day plan goes to every socket, the sender's included, and the answers
 * carry the stop alongside the existing fields as well, for a session whose
 * socket is down at that moment.
 *
 * The handlers are adapters: the whole write, its checks and its events live in
 * AccommodationsService's stay use cases, which the MCP tools call as well.
 */
@Controller('api/trips/:tripId/accommodations')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('day_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class AccommodationsController {
  constructor(private readonly accommodations: AccommodationsService) {}

  @Get()
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { accommodations: await this.accommodations.list(tripId) };
  }

  @RequirePermission('day_edit')
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() rawBody: AccommodationCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { accommodation, mirror } = await this.accommodations.createStay(
      tripId,
      rawBody as StayInput,
      this.accommodations.restWriter(tripId, user, socketId),
    );
    // The stop rides in the answer as well, for the session that booked the night
    // with its socket down: over the socket it would already have it.
    return { accommodation, assignment: mirror.created };
  }

  @RequirePermission('day_edit')
  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() rawBody: AccommodationUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { accommodation, mirror } = await this.accommodations.updateStay(
      tripId,
      id,
      rawBody as StayInput,
      this.accommodations.restWriter(tripId, user, socketId),
    );
    return {
      accommodation,
      assignment: mirror.created,
      movedAssignment: mirror.moved,
      removedAssignments: mirror.removed,
    };
  }

  @RequirePermission('day_edit')
  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
    @Query('keepStop') keepStop?: string,
  ) {
    // Turning a night back into a pause in road trip mode: the booking goes, the
    // stop stays and becomes the traveller's. Everywhere else a cancelled booking
    // takes the stop it brought with it.
    const { mirror } = await this.accommodations.deleteStay(
      tripId,
      id,
      this.accommodations.restWriter(tripId, user, socketId),
      { keepStop: keepStop === 'true' },
    );
    return { success: true, removedAssignments: mirror.removed, updatedAssignments: mirror.updated };
  }
}
