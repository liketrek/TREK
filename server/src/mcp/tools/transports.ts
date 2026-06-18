import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createReservation, deleteReservation, getReservation, updateReservation,
  type EndpointInput,
} from '../../services/reservationService';
import { linkBudgetItemToReservation } from '../../services/budgetService';
import { getDay } from '../../services/dayService';
import { findByIata } from '../../services/airportService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_WRITE, demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canWrite } from '../scopes';

const TRANSPORT_TYPES = ['flight', 'train', 'car', 'cruise'] as const;

const endpointObjectSchema = z.object({
  role: z.enum(['from', 'to', 'stop']).describe('Endpoint role: "from" (origin), "to" (destination), or "stop" (intermediate)'),
  sequence: z.number().int().min(0).describe('Order within the route (0-based)'),
  name: z.string().min(1).describe('Location name (e.g. "Paris Gare de Lyon", "ZRH Terminal 2")'),
  code: z.string().optional().describe('IATA airport code for flights (e.g. "ZRH"). Leave empty for other transport types.'),
  lat: z.number().optional().describe('Latitude. For flights, leave empty and set code instead — coordinates are filled from the airport.'),
  lng: z.number().optional().describe('Longitude. For flights, leave empty and set code instead — coordinates are filled from the airport.'),
  timezone: z.string().optional().describe('IANA timezone (e.g. "Europe/Zurich"). Use airport tz for flights.'),
  local_time: z.string().optional().describe('Local departure/arrival time at this endpoint, e.g. "14:35"'),
  local_date: z.string().optional().describe('Local date at this endpoint, YYYY-MM-DD'),
});
const endpointSchema = z.array(endpointObjectSchema).optional();

type Endpoint = z.infer<typeof endpointObjectSchema>;

/**
 * Endpoint coordinates are stored NOT NULL. Callers may supply a flight endpoint
 * with only an IATA `code` (the tool description encourages this), so fill missing
 * lat/lng/timezone from the airport database. Returns an error string for the first
 * endpoint that can't be resolved rather than letting the NOT NULL bind throw.
 *
 * Normalizes to the service's EndpointInput shape (nullable fields coerced from the
 * schema's optionals), so lat/lng are guaranteed present before the insert.
 */
function resolveEndpointCoords(endpoints: Endpoint[] | undefined): { endpoints: EndpointInput[] } | { error: string } {
  if (!endpoints) return { endpoints: [] };
  const out: EndpointInput[] = [];
  for (const e of endpoints) {
    const base = {
      role: e.role,
      sequence: e.sequence,
      name: e.name,
      code: e.code ?? null,
      timezone: e.timezone ?? null,
      local_time: e.local_time ?? null,
      local_date: e.local_date ?? null,
    };
    if (e.lat != null && e.lng != null) { out.push({ ...base, lat: e.lat, lng: e.lng }); continue; }
    if (e.code) {
      const airport = findByIata(e.code);
      if (airport) {
        out.push({ ...base, lat: airport.lat, lng: airport.lng, timezone: e.timezone ?? airport.tz });
        continue;
      }
      return { error: `Could not resolve airport code "${e.code}". Use search_airports to find a valid IATA code, or supply lat/lng directly.` };
    }
    return { error: `Endpoint "${e.name}" is missing coordinates. For flights set "code" to the IATA airport code; for other transport types supply lat/lng.` };
  }
  return { endpoints: out };
}

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
      if (!hasTripPermission('reservation_edit', tripId, userId)) return permissionDenied();

      if (start_day_id && !getDay(start_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'start_day_id does not belong to this trip.' }], isError: true };
      if (end_day_id && !getDay(end_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'end_day_id does not belong to this trip.' }], isError: true };

      const resolved = resolveEndpointCoords(endpoints);
      if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }], isError: true };

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
        endpoints: resolved.endpoints,
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
      if (!hasTripPermission('reservation_edit', tripId, userId)) return permissionDenied();

      const existing = getReservation(reservationId, tripId);
      if (!existing) return { content: [{ type: 'text' as const, text: 'Transport not found.' }], isError: true };

      const resolvedType = type ?? existing.type;
      if (!(TRANSPORT_TYPES as readonly string[]).includes(resolvedType))
        return { content: [{ type: 'text' as const, text: 'Reservation is not a transport type. Use update_reservation instead.' }], isError: true };

      if (start_day_id && !getDay(start_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'start_day_id does not belong to this trip.' }], isError: true };
      if (end_day_id && !getDay(end_day_id, tripId))
        return { content: [{ type: 'text' as const, text: 'end_day_id does not belong to this trip.' }], isError: true };

      // Only resolve when endpoints are explicitly provided; undefined leaves them untouched.
      let resolvedEndpoints: EndpointInput[] | undefined;
      if (endpoints !== undefined) {
        const resolved = resolveEndpointCoords(endpoints);
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }], isError: true };
        resolvedEndpoints = resolved.endpoints;
      }

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
        endpoints: resolvedEndpoints,
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
      if (!hasTripPermission('reservation_edit', tripId, userId)) return permissionDenied();
      const { deleted } = deleteReservation(reservationId, tripId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Transport not found.' }], isError: true };
      safeBroadcast(tripId, 'reservation:deleted', { reservationId });
      return ok({ success: true });
    }
  );
}
