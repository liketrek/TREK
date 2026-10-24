import type { Reservation, User } from '../../types';
import { DomainError } from '../common/domain-error';
import { restTripWriter, type TripWriter } from '../common/trip-writer';
import { AirtrailLinkService } from '../integrations/airtrail-link.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  ReservationsService,
  type CostEvent,
  type CreateReservationData,
  type UpdateReservationData,
} from './reservations.service';
import { Injectable } from '@nestjs/common';

/** The linked cost a booking write takes, as ReservationsService.createWithCost reads it. */
type BudgetEntry = Parameters<ReservationsService['createWithCost']>[2];
/** The day plan order a reorder writes, as ReservationsService.updatePositions reads it. */
type Positions = Parameters<ReservationsService['updatePositions']>[1];

const bookingNotFound = (mcpMessage: string) => new DomainError(404, 'Reservation not found', { mcpMessage });

/**
 * The booking writes REST and MCP share, one method per use case: the write,
 * then every event it sends and the notice to fellow travellers, so both
 * surfaces send the same things in the same order.
 *
 * Each runs after its caller checked the trip and the references (REST's
 * TripAccessGuard with reservation_edit and the controller's foreign id check,
 * the tool's own checks on MCP), writes in ReservationsService's transaction and
 * sends once that committed. The day stop a hotel booking brings is announced by
 * ReservationsService itself, before the events here, to every socket.
 *
 * MCP used to send these events from the tool and had drifted: no booking
 * notice, no push of an edited AirTrail flight (the next pull reverted the
 * edit), no `accommodation:deleted` when a transport still carried a stay, its
 * own day key on `reservation:positions`, and the hotel link announced a stay it
 * had not changed.
 */
@Injectable()
export class ReservationWritesService {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly airtrailLink: AirtrailLinkService,
    private readonly realtime: RealtimeService,
  ) {}

  /** The REST caller of a booking write: skips the sender's socket, as the routes always did. */
  restWriter(tripId: string, user: User, socketId: string | undefined): TripWriter {
    return restTripWriter(this.realtime, tripId, user, socketId);
  }

  /** A new booking with its linked cost, and the stay a hotel booking brings. */
  async createBooking(tripId: string, data: CreateReservationData, entry: BudgetEntry, writer: TripWriter) {
    const { reservation, accommodationCreated, costEvents } = await this.reservations.createWithCost(
      tripId,
      data,
      entry,
    );
    if (accommodationCreated) writer.events.emit('accommodation:created', {});
    this.sendCost(costEvents, writer);
    writer.events.emit('reservation:created', { reservation });
    await this.reservations.notifyBookingChange(tripId, writer.userId, data.title, data.type ?? '');
    return { reservation };
  }

  /**
   * An edit of a booking the caller already read (`current`), with the costs it
   * re-files. A stay the edit wrote for the first time is `accommodation:created`,
   * one it changed `accommodation:updated`. A linked AirTrail flight is pushed
   * back to AirTrail, or the next pull would overwrite the edit.
   *
   * @txIndependent the booking write commits in one transaction; the AirTrail
   * push after it is network I/O against another system and may detach the link
   * on its own, so it never shares that transaction.
   */
  async updateBooking(
    id: string,
    tripId: string,
    data: UpdateReservationData,
    current: Reservation,
    entry: BudgetEntry,
    writer: TripWriter,
  ) {
    const { reservation, accommodationChanged, accommodationCreated, costEvents } =
      await this.reservations.updateWithCost(id, tripId, data, current, entry);
    if (accommodationCreated) writer.events.emit('accommodation:created', {});
    else if (accommodationChanged) writer.events.emit('accommodation:updated', {});
    this.sendCost(costEvents, writer);
    writer.events.emit('reservation:updated', { reservation });
    // Fire and forget, under the importer's credentials (#214).
    if (reservation.external_source === 'airtrail' && reservation.sync_enabled) {
      void this.airtrailLink.pushReservationToAirtrail(Number(reservation.id), Number(tripId)).catch(() => {});
    }
    await this.reservations.notifyBookingChange(
      tripId,
      writer.userId,
      data.title || current.title,
      data.type || current.type || '',
    );
    return { reservation };
  }

  /**
   * A booking deleted with its stay and its linked costs. `mcpNotFound` is the
   * wording the tool has always answered a missing booking with.
   */
  async deleteBooking(
    id: string | number,
    tripId: string | number,
    writer: TripWriter,
    mcpNotFound = 'Reservation not found.',
  ) {
    const { deleted, accommodationDeleted, deletedBudgetItemIds } = await this.reservations.remove(id, tripId);
    if (!deleted) throw bookingNotFound(mcpNotFound);
    if (accommodationDeleted)
      writer.events.emit('accommodation:deleted', { accommodationId: deleted.accommodation_id });
    for (const itemId of deletedBudgetItemIds) writer.events.emit('budget:deleted', { itemId });
    writer.events.emit('reservation:deleted', { reservationId: Number(id) });
    await this.reservations.notifyBookingChange(tripId, writer.userId, deleted.title, deleted.type || '');
    return { success: true };
  }

  /** The order of the bookings in the day plan, of one day when `dayId` names it. */
  async reorderBookings(
    tripId: string | number,
    positions: Positions,
    dayId: number | string | null | undefined,
    writer: TripWriter,
  ) {
    await this.reservations.updatePositions(tripId, positions, dayId);
    // REST's `day_id` is the canonical key. The MCP tool always named it `dayId`,
    // so its event keeps that key next to it for a client that reads it.
    writer.events.emit(
      'reservation:positions',
      writer.surface === 'mcp' ? { positions, day_id: dayId, dayId } : { positions, day_id: dayId },
    );
  }

  private sendCost(events: readonly CostEvent[], writer: TripWriter): void {
    for (const e of events) writer.events.emit(e.event, e.payload);
  }
}
