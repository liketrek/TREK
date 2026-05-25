import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createReservation, deleteReservation, getReservation, updateReservation,
} from '../../services/reservationService';
import { linkBudgetItemToReservation } from '../../services/budgetService';
import { getDay } from '../../services/dayService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_WRITE, demoDenied, noAccess, ok,
} from './_shared';
import { canWrite } from '../scopes';

const TRANSPORT_TYPES = ['flight', 'train', 'car', 'cruise'] as const;

const endpointSchema = z.array(z.object({
  role: z.enum(['from', 'to', 'stop']).describe('Endpoint role: "from" (origin), "to" (destination), or "stop" (intermediate)'),
  sequence: z.number().int().min(0).describe('Order within the route (0-based)'),
  name: z.string().min(1).describe('Location name (e.g. "Paris Gare de Lyon", "ZRH Terminal 2")'),
  code: z.string().optional().describe('IATA airport code for flights (e.g. "ZRH"). Leave empty for other transport types.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  timezone: z.string().optional().describe('IANA timezone (e.g. "Europe/Zurich"). Use airport tz for flights.'),
  local_time: z.string().optional().describe('Local departure/arrival time at this endpoint, e.g. "14:35"'),
  local_date: z.string().optional().describe('Local date at this endpoint, YYYY-MM-DD'),
})).optional();

export function registerTransportTools(server: McpServer, userId: number, scopes: string[] | null): void {
  if (!canWrite(scopes, 'reservations')) return;

  server.registerTool(
    'create_transport',
    {
      description: 'Create a transport booking (flight, train, car, or cruise) for a trip. Use endpoints[] to record origin/destination and intermediate stops — for flights, set code to the IATA airport code (use search_airports first). Created as pending — confirm with update_transport. Set price to record the cost; it will appear on the booking and in the Budget tab.',
      inputSchema: {
        tripId: z.number().int().positive(),
        type: z.enum(['flight', 'train', 'car', 'cruise']),
        title: z.string().min(1).max(200),
        status: z.enum(['pending', 'confirmed', 'cancelled']).optional().default('pending'),
        start_day_id: z.number().int().positive().optional().describe('Departure day'),
        end_day_id: z.number().int().positive().optional().describe('Arrival day (if different from departure)'),
        reservation_time: z.string().optional().describe('ISO 8601 datetime or time string for departure'),
        reservation_end_time: z.string().optional().describe('ISO 8601 datetime or time string for arrival'),
        confirmation_number: z.string().max(100).optional(),
        notes: z.string().max(1000).optional(),
        metadata: z.record(z.string(), z.string()).optional().describe('Type-specific metadata: flights → { airline, flight_number, departure_airport, arrival_airport }; trains → { train_number, platform, seat }'),
        endpoints: endpointSchema,
        needs_review: z.boolean().optional(),
        price: z.number().nonnegative().optional().describe('Transport cost — shown on the booking and linked in the Budget tab'),
        budget_category: z.string().max(100).optional().describe('Budget category for the price entry (defaults to transport type)'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, type, title, status, start_day_id, end_day_id, reservation_time, reservation_end_time, confirmation_number, notes, metadata, endpoints, needs_review, price, budget_category }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();

      if (start_day_id && !getDay(start_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'start_day_id does not belong to this trip.' }], isError: true };
      if (end_day_id && !getDay(end_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'end_day_id does not belong to this trip.' }], isError: true };

      const meta: Record<string, string> = { ...(metadata ?? {}) };
      if (price != null) meta.price = String(price);

      const { reservation } = createReservation(tripId, {
        title,
        type,
        reservation_time,
        reservation_end_time,
        location: undefined,
        confirmation_number,
        notes,
        day_id: start_day_id,
        end_day_id: end_day_id ?? start_day_id,
        status: status ?? 'pending',
        metadata: Object.keys(meta).length > 0 ? meta : undefined,
        endpoints,
        needs_review,
      });

      if (price != null && price > 0) {
        const item = linkBudgetItemToReservation(tripId, reservation.id, {
          name: title,
          category: budget_category || type,
          total_price: price,
        });
        safeBroadcast(tripId, 'budget:created', { item });
      }

      safeBroadcast(tripId, 'reservation:created', { reservation });
      return ok({ reservation });
    }
  );

  server.registerTool(
    'update_transport',
    {
      description: 'Update an existing transport booking. Pass endpoints[] to replace the full list of stops (origin, destination, intermediates). Use status "confirmed" to confirm.',
      inputSchema: {
        tripId: z.number().int().positive(),
        reservationId: z.number().int().positive(),
        type: z.enum(['flight', 'train', 'car', 'cruise']).optional(),
        title: z.string().min(1).max(200).optional(),
        status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
        start_day_id: z.number().int().positive().optional().describe('Departure day'),
        end_day_id: z.number().int().positive().optional().describe('Arrival day (if different from departure)'),
        reservation_time: z.string().optional().describe('ISO 8601 datetime or time string for departure'),
        reservation_end_time: z.string().optional().describe('ISO 8601 datetime or time string for arrival'),
        confirmation_number: z.string().max(100).optional(),
        notes: z.string().max(1000).optional(),
        metadata: z.record(z.string(), z.string()).optional().describe('Type-specific metadata: flights → { airline, flight_number, departure_airport, arrival_airport }; trains → { train_number, platform, seat }'),
        endpoints: endpointSchema,
        needs_review: z.boolean().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, reservationId, type, title, status, start_day_id, end_day_id, reservation_time, reservation_end_time, confirmation_number, notes, metadata, endpoints, needs_review }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();

      const existing = getReservation(reservationId, tripId);
      if (!existing) return { content: [{ type: 'text' as const, text: 'Transport not found.' }], isError: true };

      const resolvedType = type ?? existing.type;
      if (!(TRANSPORT_TYPES as readonly string[]).includes(resolvedType))
        return { content: [{ type: 'text' as const, text: 'Reservation is not a transport type. Use update_reservation instead.' }], isError: true };

      if (start_day_id && !getDay(start_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'start_day_id does not belong to this trip.' }], isError: true };
      if (end_day_id && !getDay(end_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'end_day_id does not belong to this trip.' }], isError: true };

      const { reservation } = updateReservation(reservationId, tripId, {
        title,
        type,
        reservation_time,
        reservation_end_time,
        confirmation_number,
        notes,
        day_id: start_day_id,
        end_day_id,
        status,
        metadata,
        endpoints,
        needs_review,
      }, existing);
      safeBroadcast(tripId, 'reservation:updated', { reservation });
      return ok({ reservation });
    }
  );

  server.registerTool(
    'delete_transport',
    {
      description: 'Delete a transport booking from a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        reservationId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, reservationId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      const { deleted } = deleteReservation(reservationId, tripId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Transport not found.' }], isError: true };
      safeBroadcast(tripId, 'reservation:deleted', { reservationId });
      return ok({ success: true });
    }
  );
}
