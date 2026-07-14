import { canAccessTrip } from '../../db/database';
import { RateLimitService } from '../../nest/auth/rate-limit.service';
import { isDemoUser } from '../../services/authService';
import { getDay, listDays } from '../../services/dayService';
import { createReservation, notifyBookingChange } from '../../services/reservationService';
import {
  buildTransitReservationParts,
  cleanTransitItineraryNames,
  transitCoordinatesMatch,
  transitCoordinatesSchema,
  transitItinerarySchema,
  transitPlaceSchema,
} from '../../services/transitItineraryService';
import { geocode, plan, SCHEDULED_TRANSIT_MODES } from '../../services/transitService';
import { canRead, canWrite } from '../scopes';
import {
  demoDenied,
  hasTripPermission,
  noAccess,
  ok,
  permissionDenied,
  safeBroadcast,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
} from './_shared';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

import { z } from 'zod';

const TRANSIT_RATE_WINDOW = 15 * 60 * 1000;
const transitRateLimiter = new RateLimitService();

const transitModes = z.enum(['TRANSIT', ...SCHEDULED_TRANSIT_MODES]);

function errorResult(err: unknown, fallback: string) {
  return {
    content: [{ type: 'text' as const, text: err instanceof Error ? err.message : fallback }],
    isError: true,
  };
}

function rateLimit(userId: number, bucket: string, max: number) {
  if (transitRateLimiter.check(bucket, String(userId), max, TRANSIT_RATE_WINDOW, Date.now())) return null;
  return {
    content: [{ type: 'text' as const, text: 'Too many transit requests. Please try again later.' }],
    isError: true,
  };
}

export function registerTransitTools(server: McpServer, userId: number, scopes: string[] | null): void {
  if (canRead(scopes, 'geo')) {
    server.registerTool(
      'search_transit_stops',
      {
        description:
          'Search real public-transit stops and stations via Transitous. Use the returned coordinates with search_transit_routes.',
        inputSchema: {
          query: z.string().min(2).max(200),
          language: z.string().min(2).max(5).optional(),
          near: z
            .object(transitCoordinatesSchema.shape)
            .optional()
            .describe('Optional coordinates used to bias nearby results'),
        },
        annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
      },
      async ({ query, language, near }) => {
        const limited = rateLimit(userId, 'mcp_transit_geocode', 300);
        if (limited) return limited;
        try {
          return ok(await geocode(query, language, near ? `${near.lat},${near.lng}` : undefined));
        } catch (err) {
          return errorResult(err, 'Transit stop search failed.');
        }
      },
    );

    server.registerTool(
      'search_transit_routes',
      {
        description:
          'Search scheduled public-transit routes via Transitous between two coordinates. Returns itineraries that can be passed unchanged to create_transit_journey. `dropped` counts provider itineraries that failed validation and are therefore absent from the results — a non-zero value means the provider offered routes this tool could not represent.',
        inputSchema: {
          from: transitPlaceSchema,
          to: transitPlaceSchema,
          time: z
            .string()
            .datetime({ offset: true })
            .optional()
            .describe('ISO 8601 departure or arrival time with timezone offset'),
          arriveBy: z.boolean().optional().default(false),
          modes: z.array(transitModes).max(14).optional(),
          maxTransfers: z.number().int().min(0).max(10).optional(),
        },
        annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
      },
      async ({ from, to, time, arriveBy, modes, maxTransfers }) => {
        const limited = rateLimit(userId, 'mcp_transit_plan', 60);
        if (limited) return limited;
        try {
          const result = await plan({
            from: `${from.lat},${from.lng}`,
            to: `${to.lat},${to.lng}`,
            time,
            arriveBy,
            modes: modes?.join(','),
            maxTransfers,
          });
          const itineraries = result.itineraries.flatMap((itinerary) => {
            const parsed = transitItinerarySchema.safeParse(cleanTransitItineraryNames(itinerary, from.name, to.name));
            if (!parsed.success) return [];
            const firstStop = parsed.data.legs[0].from;
            const lastStop = parsed.data.legs[parsed.data.legs.length - 1].to;
            return transitCoordinatesMatch(from, firstStop) && transitCoordinatesMatch(to, lastStop)
              ? [parsed.data]
              : [];
          });
          // A rejected itinerary is provider data we could not vouch for, but dropping it
          // silently is indistinguishable from "no routes exist" — report the count so the
          // caller knows the difference.
          return ok({ itineraries, dropped: result.itineraries.length - itineraries.length });
        } catch (err) {
          return errorResult(err, 'Transit route search failed.');
        }
      },
    );
  }

  if (!canWrite(scopes, 'reservations')) return;

  server.registerTool(
    'create_transit_journey',
    {
      description:
        'Add one itinerary returned by search_transit_routes to a trip day as a first-class automated public-transit journey.',
      inputSchema: {
        tripId: z.number().int().positive(),
        dayId: z.number().int().positive().describe('Trip day on which the journey departs'),
        from: transitPlaceSchema,
        to: transitPlaceSchema,
        itinerary: transitItinerarySchema,
        notes: z.string().max(1000).optional(),
      },
      annotations: TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
    },
    async ({ tripId, dayId, from, to, itinerary, notes }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('reservation_edit', tripId, userId)) return permissionDenied();
      const day = getDay(dayId, tripId);
      if (!day) {
        return { content: [{ type: 'text' as const, text: 'dayId does not belong to this trip.' }], isError: true };
      }

      const cleaned = cleanTransitItineraryNames(itinerary, from.name, to.name);
      const firstStop = cleaned.legs[0].from;
      const lastStop = cleaned.legs[cleaned.legs.length - 1].to;
      if (!transitCoordinatesMatch(from, firstStop) || !transitCoordinatesMatch(to, lastStop)) {
        return {
          content: [
            { type: 'text' as const, text: 'The itinerary does not match the requested origin and destination.' },
          ],
          isError: true,
        };
      }
      let reservationParts: ReturnType<typeof buildTransitReservationParts>;
      try {
        reservationParts = buildTransitReservationParts(from, to, cleaned);
      } catch (err) {
        return errorResult(err, 'Unable to resolve the transit journey timezones.');
      }
      const { endpoints, metadata } = reservationParts;
      const departure = endpoints[0];
      const arrival = endpoints[endpoints.length - 1];
      if (!day.date) {
        return {
          content: [{ type: 'text' as const, text: 'Automated transit requires a dated trip day.' }],
          isError: true,
        };
      }
      if (departure.local_date !== day.date) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `The journey departs on ${departure.local_date}, but dayId is ${day.date}.`,
            },
          ],
          isError: true,
        };
      }
      const endDay = listDays(tripId).days.find((day) => day.date === arrival.local_date);
      if (!endDay) {
        return {
          content: [{ type: 'text' as const, text: `No trip day exists for the arrival date ${arrival.local_date}.` }],
          isError: true,
        };
      }
      const { reservation } = createReservation(tripId, {
        title: `${from.name} → ${to.name}`,
        type: 'transit',
        status: 'confirmed',
        day_id: dayId,
        end_day_id: endDay.id,
        reservation_time: `${departure.local_date}T${departure.local_time}`,
        reservation_end_time: `${arrival.local_date}T${arrival.local_time}`,
        notes,
        metadata,
        endpoints,
        needs_review: false,
      });
      safeBroadcast(tripId, 'reservation:created', { reservation });
      notifyBookingChange(tripId, userId, reservation.title, reservation.type || '');
      return ok({ reservation });
    },
  );
}
