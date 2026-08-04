import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '@trek/nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { BudgetService } from '../budget/budget.service';
import { placeExists, getAssignmentForTrip } from '../assignments/assignments.bridge';
import { safeBroadcast, noAccess, hasTripPermission, permissionDenied } from '../../mcp/tools/_shared';
import { ReservationsService } from './reservations.service';
import { DaysService } from '../days/days.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Reservations MCP surface — ported 1:1 from the legacy registrars: the five
 * tools from src/mcp/tools/reservations.ts and the
 * trek://trips/{tripId}/reservations resource from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The registration-time gates map to the declarative
 * reservations read/write access markers (the legacy `if (canWrite)` /
 * `if (canRead)` checks, resolved by trekMcpAccessPolicy); there is no addon
 * gate, so no `when`.
 */
@McpController()
export class ReservationsMcp {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly days: DaysService,
    private readonly budget: BudgetService,
    private readonly auth: AuthService,
  ) {}

  @Tool({
    name: 'create_reservation',
    description: 'Recommend a reservation for a trip. Created as pending — the user must confirm it. For flights, trains, cars, and cruises, use create_transport instead. Linking: hotel → use place_id + start_day_id + end_day_id (all three required to create the accommodation link); restaurant/event/tour/activity/parking/other → use assignment_id. Set price to record the cost; it will appear on the booking and in the Budget tab.',
    inputSchema: {
      tripId: z.number().int().positive(),
      title: z.string().min(1).max(200),
      type: z.enum(['hotel', 'restaurant', 'event', 'tour', 'activity', 'parking', 'other']).describe('Reservation type: "hotel", "restaurant", "event", "tour", "activity", "parking", or "other"'),
      reservation_time: z.string().optional().describe('ISO 8601 datetime or time string'),
      location: z.string().max(500).optional(),
      confirmation_number: z.string().max(100).optional(),
      notes: z.string().max(1000).optional(),
      day_id: z.number().int().positive().optional(),
      place_id: z.number().int().positive().optional().describe('Hotel place to link (hotel type only)'),
      start_day_id: z.number().int().positive().optional().describe('Check-in day (hotel type only; requires place_id and end_day_id)'),
      end_day_id: z.number().int().positive().optional().describe('Check-out day (hotel type only; requires place_id and start_day_id)'),
      check_in: z.string().max(10).optional().describe('Check-in time (e.g. "15:00", hotel type only)'),
      check_out: z.string().max(10).optional().describe('Check-out time (e.g. "11:00", hotel type only)'),
      assignment_id: z.number().int().positive().optional().describe('Link to a day assignment (restaurant, train, car, cruise, event, tour, activity, other)'),
      price: z.number().nonnegative().optional().describe('Reservation cost — shown on the booking and linked in the Budget tab'),
      budget_category: z.string().max(100).optional().describe('Budget category for the price entry (defaults to reservation type)'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'reservations', mode: 'write' },
  })
  async createReservation(
    { tripId, title, type, reservation_time, location, confirmation_number, notes, day_id, place_id, start_day_id, end_day_id, check_in, check_out, assignment_id, price, budget_category }: {
      tripId: number; title: string; type: 'hotel' | 'restaurant' | 'event' | 'tour' | 'activity' | 'parking' | 'other';
      reservation_time?: string; location?: string; confirmation_number?: string; notes?: string;
      day_id?: number; place_id?: number; start_day_id?: number; end_day_id?: number;
      check_in?: string; check_out?: string; assignment_id?: number; price?: number; budget_category?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.reservations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();

    // Validate that all referenced IDs belong to this trip
    if (day_id && !this.days.getDay(day_id, tripId))
      return errorResult('day_id does not belong to this trip.');
    if (place_id && !placeExists(place_id, tripId))
      return errorResult('place_id does not belong to this trip.');
    if (start_day_id && !this.days.getDay(start_day_id, tripId))
      return errorResult('start_day_id does not belong to this trip.');
    if (end_day_id && !this.days.getDay(end_day_id, tripId))
      return errorResult('end_day_id does not belong to this trip.');
    if (assignment_id && !getAssignmentForTrip(assignment_id, tripId))
      return errorResult('assignment_id does not belong to this trip.');

    const createAccommodation = (type === 'hotel' && place_id && start_day_id && end_day_id)
      ? { place_id, start_day_id, end_day_id, check_in: check_in || undefined, check_out: check_out || undefined, confirmation: confirmation_number || undefined }
      : undefined;

    const metadata = price != null ? { price: String(price) } : undefined;

    const { reservation, accommodationCreated } = this.reservations.create(tripId, {
      title, type, reservation_time, location, confirmation_number,
      notes, day_id, place_id, assignment_id,
      create_accommodation: createAccommodation,
      metadata,
    });

    if (accommodationCreated) {
      safeBroadcast(tripId, 'accommodation:created', {});
    }

    if (price != null && price > 0) {
      const item = this.budget.linkBudgetItemToReservation(tripId, reservation.id, {
        name: title,
        category: budget_category || type,
        total_price: price,
      });
      safeBroadcast(tripId, 'budget:created', { item });
    }

    safeBroadcast(tripId, 'reservation:created', { reservation });
    return ok({ reservation });
  }

  @Tool({
    name: 'update_reservation',
    description: 'Update an existing reservation in a trip. Use status "confirmed" to confirm a pending recommendation, or "pending" to revert it. For flights, trains, cars, and cruises, use update_transport instead. Linking: hotel → use place_id to link to an accommodation place; restaurant/event/tour/activity/parking/other → use assignment_id to link to a day assignment.',
    inputSchema: {
      tripId: z.number().int().positive(),
      reservationId: z.number().int().positive(),
      title: z.string().min(1).max(200).optional(),
      type: z.enum(['hotel', 'restaurant', 'event', 'tour', 'activity', 'parking', 'other']).optional().describe('Reservation type: "hotel", "restaurant", "event", "tour", "activity", "parking", or "other"'),
      reservation_time: z.string().optional().describe('ISO 8601 datetime or time string'),
      location: z.string().max(500).optional(),
      confirmation_number: z.string().max(100).optional(),
      notes: z.string().max(1000).optional(),
      status: z.enum(['pending', 'confirmed', 'cancelled']).optional().describe('Reservation status: "pending", "confirmed", or "cancelled"'),
      place_id: z.number().int().positive().nullable().optional().describe('Link to a place (use for hotel type), or null to unlink'),
      assignment_id: z.number().int().positive().nullable().optional().describe('Link to a day assignment (use for restaurant, train, car, cruise, event, tour, activity, other), or null to unlink'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'reservations', mode: 'write' },
  })
  async updateReservation(
    { tripId, reservationId, title, type, reservation_time, location, confirmation_number, notes, status, place_id, assignment_id }: {
      tripId: number; reservationId: number; title?: string;
      type?: 'hotel' | 'restaurant' | 'event' | 'tour' | 'activity' | 'parking' | 'other';
      reservation_time?: string; location?: string; confirmation_number?: string; notes?: string;
      status?: 'pending' | 'confirmed' | 'cancelled'; place_id?: number | null; assignment_id?: number | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.reservations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();
    const existing = this.reservations.getReservation(reservationId, tripId);
    if (!existing) return errorResult('Reservation not found.');

    if (place_id != null && !placeExists(place_id, tripId))
      return errorResult('place_id does not belong to this trip.');
    if (assignment_id != null && !getAssignmentForTrip(assignment_id, tripId))
      return errorResult('assignment_id does not belong to this trip.');

    const { reservation } = this.reservations.update(reservationId, tripId, {
      title, type, reservation_time, location, confirmation_number, notes, status,
      place_id: place_id !== undefined ? place_id ?? undefined : undefined,
      assignment_id: assignment_id !== undefined ? assignment_id ?? undefined : undefined,
    }, existing);
    safeBroadcast(tripId, 'reservation:updated', { reservation });
    return ok({ reservation });
  }

  @Tool({
    name: 'delete_reservation',
    description: 'Delete a reservation from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      reservationId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'reservations', mode: 'write' },
  })
  async deleteReservation({ tripId, reservationId }: { tripId: number; reservationId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.reservations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();
    const { deleted, accommodationDeleted } = this.reservations.remove(reservationId, tripId);
    if (!deleted) return errorResult('Reservation not found.');
    if (accommodationDeleted) {
      safeBroadcast(tripId, 'accommodation:deleted', { accommodationId: deleted.accommodation_id });
    }
    safeBroadcast(tripId, 'reservation:deleted', { reservationId });
    return ok({ success: true });
  }

  @Tool({
    name: 'reorder_reservations',
    description: 'Update the display order of reservations within a day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      positions: z.array(z.object({
        id: z.number().int().positive(),
        day_plan_position: z.number().int().min(0),
      })).describe('Array of { id, day_plan_position } pairs'),
      dayId: z.number().int().positive().optional().describe('Optionally scope the update to a specific day'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'reservations', mode: 'write' },
  })
  async reorderReservations(
    { tripId, positions, dayId }: { tripId: number; positions: { id: number; day_plan_position: number }[]; dayId?: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.reservations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();
    this.reservations.updatePositions(tripId, positions, dayId);
    safeBroadcast(tripId, 'reservation:positions', { positions, dayId });
    return ok({ success: true });
  }

  @Tool({
    name: 'link_hotel_accommodation',
    description: 'Set or update the check-in/check-out day links for a hotel reservation. Creates or updates the accommodation record that ties the reservation to a place and a date range. Use the day IDs from get_trip_summary.',
    inputSchema: {
      tripId: z.number().int().positive(),
      reservationId: z.number().int().positive(),
      place_id: z.number().int().positive().describe('The hotel place to link'),
      start_day_id: z.number().int().positive().describe('Check-in day ID'),
      end_day_id: z.number().int().positive().describe('Check-out day ID'),
      check_in: z.string().max(10).optional().describe('Check-in time (e.g. "15:00")'),
      check_out: z.string().max(10).optional().describe('Check-out time (e.g. "11:00")'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'reservations', mode: 'write' },
  })
  async linkHotelAccommodation(
    { tripId, reservationId, place_id, start_day_id, end_day_id, check_in, check_out }: {
      tripId: number; reservationId: number; place_id: number; start_day_id: number; end_day_id: number;
      check_in?: string; check_out?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.reservations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();
    const current = this.reservations.getReservation(reservationId, tripId);
    if (!current) return errorResult('Reservation not found.');
    if (current.type !== 'hotel') return errorResult('Reservation is not of type hotel.');

    if (!placeExists(place_id, tripId))
      return errorResult('place_id does not belong to this trip.');
    if (!this.days.getDay(start_day_id, tripId))
      return errorResult('start_day_id does not belong to this trip.');
    if (!this.days.getDay(end_day_id, tripId))
      return errorResult('end_day_id does not belong to this trip.');

    const isNewAccommodation = !current.accommodation_id;
    const { reservation } = this.reservations.update(reservationId, tripId, {
      place_id,
      type: current.type,
      status: current.status as string,
      create_accommodation: { place_id, start_day_id, end_day_id, check_in: check_in || undefined, check_out: check_out || undefined },
    }, current);

    safeBroadcast(tripId, isNewAccommodation ? 'accommodation:created' : 'accommodation:updated', {});
    safeBroadcast(tripId, 'reservation:updated', { reservation });
    return ok({ reservation, accommodation_id: reservation?.accommodation_id ?? null });
  }

  @ResourceTemplate({
    name: 'trip-reservations',
    uriTemplate: 'trek://trips/{tripId}/reservations',
    description: 'Reservations (flights, hotels, restaurants) for a trip',
    mimeType: 'application/json',
    access: { group: 'reservations', mode: 'read' },
  })
  async tripReservationsResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.reservations.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const reservations = this.reservations.list(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(reservations, null, 2),
      }],
    };
  }
}
