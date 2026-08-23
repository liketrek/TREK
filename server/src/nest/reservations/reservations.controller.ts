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
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { AirtrailLinkService } from '../integrations/airtrail-link.service';
import {
  ReservationCreateDto,
  ReservationUpdateDto,
  ReservationPositionsDto,
  ReservationTravelersDto,
} from './reservations.dto';

type ReservationBody = Record<string, unknown> & {
  title?: string;
  type?: string;
  create_budget_entry?: { total_price?: number; category?: string };
};

/**
 * /api/trips/:tripId/reservations — trip-scoped bookings.
 *
 * Byte-identical to the legacy Express route (server/src/routes/reservations.ts):
 * trip access (404), 'reservation_edit' permission (403), create 201 / rest 200,
 * the bespoke 404 bodies, the accommodation + budget side effects, the booking
 * notifications, and all WebSocket broadcasts with the forwarded X-Socket-Id.
 * Invalid bodies (missing title, non-array positions/user_ids) now 400 through
 * the global ZodValidationPipe envelope instead of the bespoke strings.
 * /positions is declared before /:id so it wins over the param.
 */
@Controller('api/trips/:tripId/reservations')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('reservation_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    // Injected from AirtrailCoreModule — the split that retired airtrail.bridge.
    private readonly airtrailLink: AirtrailLinkService,
  ) {}



  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { reservations: this.reservations.list(tripId) };
  }

  @RequirePermission('reservation_edit')
  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() rawBody: ReservationCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const body = rawBody as ReservationBody & { title: string };
    this.rejectForeignReferences(tripId, body);
    const { reservation, accommodationCreated } = this.reservations.create(tripId, body as never);
    if (accommodationCreated) {
      this.reservations.broadcast(tripId, 'accommodation:created', {}, socketId);
    }
    this.reservations.syncBudgetOnCreate(tripId, reservation.id, body.title, body.type, body.create_budget_entry, socketId);
    this.reservations.broadcast(tripId, 'reservation:created', { reservation }, socketId);
    this.reservations.notifyBookingChange(tripId, user.id, body.title, body.type ?? '');
    return { reservation };
  }

  @RequirePermission('reservation_edit')
  @Put('positions')
  updatePositions(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: ReservationPositionsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // The legacy signature declares day_plan_position required, but the wire
    // contract tolerates absent values (bind NULL) — see the shared schema.
    this.reservations.updatePositions(tripId, body.positions as { id: number; day_plan_position: number }[], body.day_id);
    this.reservations.broadcast(tripId, 'reservation:positions', { positions: body.positions, day_id: body.day_id }, socketId);
    return { success: true };
  }

  @RequirePermission('reservation_edit')
  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() rawBody: ReservationUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const body = rawBody as ReservationBody;
    const current = this.reservations.getReservation(id, tripId);
    if (!current) {
      throw new HttpException({ error: 'Reservation not found' }, 404);
    }
    this.rejectForeignReferences(tripId, body);
    const { reservation, accommodationChanged } = this.reservations.update(id, tripId, body as never, current as never);
    if (accommodationChanged) {
      this.reservations.broadcast(tripId, 'accommodation:updated', {}, socketId);
    }
    const cur = current as { title: string; type?: string };
    this.reservations.syncBudgetOnUpdate(tripId, id, body.title ?? '', body.type, cur.title, cur.type, body.create_budget_entry, socketId);
    this.reservations.broadcast(tripId, 'reservation:updated', { reservation }, socketId);
    // Push a locally-edited AirTrail flight back to AirTrail (fire-and-forget,
    // under the importer's credentials — see airtrailSync). #214
    if ((reservation as any)?.external_source === 'airtrail' && (reservation as any)?.sync_enabled) {
      void this.airtrailLink.pushReservationToAirtrail(Number((reservation as any).id), Number(tripId)).catch(() => {});
    }
    this.reservations.notifyBookingChange(tripId, user.id, body.title || cur.title, body.type || cur.type || '');
    return { reservation };
  }

  @RequirePermission('reservation_edit')
  @Put(':id/travelers')
  updateTravelers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: ReservationTravelersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const result = this.reservations.setTravelers(id, tripId, body.user_ids);
    if (!result) {
      throw new HttpException({ error: 'Reservation not found' }, 404);
    }
    this.reservations.broadcast(tripId, 'reservation:travelers-updated', { reservationId: Number(id), travelers: result.travelers }, socketId);
    return { travelers: result.travelers, reservation: result.reservation };
  }

  @RequirePermission('reservation_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { deleted, accommodationDeleted, deletedBudgetItemId } = this.reservations.remove(id, tripId);
    if (!deleted) {
      throw new HttpException({ error: 'Reservation not found' }, 404);
    }
    if (accommodationDeleted) {
      this.reservations.broadcast(tripId, 'accommodation:deleted', { accommodationId: deleted.accommodation_id }, socketId);
    }
    if (deletedBudgetItemId) {
      this.reservations.broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId }, socketId);
    }
    this.reservations.broadcast(tripId, 'reservation:deleted', { reservationId: Number(id) }, socketId);
    this.reservations.notifyBookingChange(tripId, user.id, deleted.title, deleted.type || '');
    return { success: true };
  }

  /**
   * The write contracts are open records, so day_id, place_id, assignment_id and
   * accommodation_id arrive unvalidated. reservation_edit on :tripId says the
   * caller may write HERE — it says nothing about the ids they put in the body,
   * and a foreign accommodation_id used to be stored verbatim and deleted with
   * the reservation. The MCP tools have refused foreign ids since they were
   * written; this is the REST half of the same rule.
   */
  private rejectForeignReferences(tripId: string, body: ReservationBody): void {
    const offenders = this.reservations.referencesOutsideTrip(tripId, body as never);
    if (offenders.length > 0) {
      throw new HttpException({ error: `Not part of this trip: ${offenders.join(', ')}` }, 400);
    }
  }
}
