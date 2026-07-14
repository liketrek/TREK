import { canAccessTrip } from '../../db/database';
import { RateLimitService } from '../../nest/auth/rate-limit.service';
import { isDemoUser } from '../../services/authService';
import { getDay, listDays } from '../../services/dayService';
import { haversineKm } from '../../services/distanceService';
import { createReservation, notifyBookingChange, type EndpointInput } from '../../services/reservationService';
import { localParts, resolveTimeZone } from '../../services/timezoneService';
import {
  geocode,
  plan,
  SCHEDULED_TRANSIT_MODES,
  type TransitItinerary,
  type TransitLeg,
} from '../../services/transitService';
import { canRead, canWrite } from '../scopes';
import {
  demoDenied,
  hasTripPermission,
  noAccess,
  ok,
  permissionDenied,
  safeBroadcast,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
} from './_shared';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

import { z } from 'zod';

const TRANSIT_RATE_WINDOW = 15 * 60 * 1000;
const transitRateLimiter = new RateLimitService();

const transitPlaceSchema = z.object({
  name: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const transitStopSchema = transitPlaceSchema.extend({
  time: z.string().nullable(),
  scheduledTime: z.string().nullable(),
  track: z.string().max(100).nullable(),
});

const transitLegModes = z.enum(['WALK', ...SCHEDULED_TRANSIT_MODES]);

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/)
  .nullable();

const transitLegSchema = z.object({
  mode: transitLegModes,
  from: transitStopSchema,
  to: transitStopSchema,
  duration: z.number().nonnegative(),
  distance: z.number().nonnegative().nullable(),
  headsign: z.string().max(300).nullable(),
  line: z.string().max(100).nullable(),
  lineColor: colorSchema,
  lineTextColor: colorSchema,
  agency: z.string().max(300).nullable(),
  intermediateStops: z.number().int().nonnegative(),
  geometry: z.string().max(60_000).nullable(),
  geometryPrecision: z.number().int().min(0).max(10),
});

const transitItinerarySchema = z
  .object({
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    duration: z.number().nonnegative(),
    transfers: z.number().int().nonnegative(),
    walkSeconds: z.number().nonnegative(),
    legs: z.array(transitLegSchema).min(1).max(20),
  })
  .superRefine((itinerary, context) => {
    if (new Date(itinerary.endTime).getTime() <= new Date(itinerary.startTime).getTime()) {
      context.addIssue({ code: 'custom', message: 'endTime must be after startTime', path: ['endTime'] });
    }
    if (!itinerary.legs.some((leg) => leg.mode !== 'WALK')) {
      context.addIssue({ code: 'custom', message: 'At least one scheduled transit leg is required', path: ['legs'] });
    }
    const geometrySize = itinerary.legs.reduce((total, leg) => total + (leg.geometry?.length ?? 0), 0);
    if (geometrySize > 60_000) {
      context.addIssue({ code: 'custom', message: 'Combined transit geometry is too large', path: ['legs'] });
    }
  });

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

function transitLocalParts(iso: string, timezone: string): { date: string; time: string } {
  const parts = localParts(iso, timezone);
  if (!parts.date || !parts.time) throw new Error(`Unable to convert ${iso} to local time in ${timezone}.`);
  return { date: parts.date, time: parts.time };
}

function timezoneAt(lat: number, lng: number): string {
  const timezone = resolveTimeZone(lat, lng);
  if (!timezone) throw new Error(`Unable to resolve timezone for ${lat},${lng}.`);
  return timezone;
}

function coordinatesMatch(
  expected: z.infer<typeof transitPlaceSchema>,
  actual: z.infer<typeof transitPlaceSchema>,
): boolean {
  return haversineKm(expected.lat, expected.lng, actual.lat, actual.lng) <= 0.1;
}

function cleanItineraryNames(itinerary: TransitItinerary, fromName: string, toName: string): TransitItinerary {
  const clean = (name: string) => (name === 'START' ? fromName : name === 'END' ? toName : name);
  return {
    ...itinerary,
    legs: itinerary.legs.map((leg) => ({
      ...leg,
      from: { ...leg.from, name: clean(leg.from.name) },
      to: { ...leg.to, name: clean(leg.to.name) },
    })),
  };
}

function buildEndpoints(
  from: z.infer<typeof transitPlaceSchema>,
  to: z.infer<typeof transitPlaceSchema>,
  itinerary: TransitItinerary,
): EndpointInput[] {
  const fromTimezone = timezoneAt(from.lat, from.lng);
  const toTimezone = timezoneAt(to.lat, to.lng);
  const departure = transitLocalParts(itinerary.startTime, fromTimezone);
  const arrival = transitLocalParts(itinerary.endTime, toTimezone);
  const transitLegs = itinerary.legs.filter((leg) => leg.mode !== 'WALK');
  const endpoints: EndpointInput[] = [
    {
      role: 'from',
      sequence: 0,
      name: from.name,
      code: null,
      lat: from.lat,
      lng: from.lng,
      timezone: fromTimezone,
      local_date: departure.date,
      local_time: departure.time,
    },
  ];

  transitLegs.slice(0, -1).forEach((leg, index) => {
    const stop = leg.to;
    const timezone = timezoneAt(stop.lat, stop.lng);
    const local = stop.time ? transitLocalParts(stop.time, timezone) : null;
    endpoints.push({
      role: 'stop',
      sequence: index + 1,
      name: stop.name,
      code: null,
      lat: stop.lat,
      lng: stop.lng,
      timezone,
      local_date: local?.date ?? null,
      local_time: local?.time ?? null,
    });
  });

  endpoints.push({
    role: 'to',
    sequence: endpoints.length,
    name: to.name,
    code: null,
    lat: to.lat,
    lng: to.lng,
    timezone: toTimezone,
    local_date: arrival.date,
    local_time: arrival.time,
  });
  return endpoints;
}

function buildMetadata(itinerary: TransitItinerary) {
  const duration = Math.max(
    0,
    Math.round((new Date(itinerary.endTime).getTime() - new Date(itinerary.startTime).getTime()) / 1000),
  );
  const walkSeconds = itinerary.legs
    .filter((leg) => leg.mode === 'WALK')
    .reduce((total, leg) => total + leg.duration, 0);
  return {
    transit: {
      provider: 'transitous',
      duration,
      transfers: itinerary.transfers,
      walk_seconds: walkSeconds,
      legs: itinerary.legs.map((leg: TransitLeg) => ({
        mode: leg.mode,
        line: leg.line,
        line_color: leg.lineColor,
        line_text_color: leg.lineTextColor,
        headsign: leg.headsign,
        agency: leg.agency,
        duration: leg.duration,
        stops: leg.intermediateStops,
        from: {
          name: leg.from.name,
          time: leg.from.time ? transitLocalParts(leg.from.time, timezoneAt(leg.from.lat, leg.from.lng)).time : null,
          track: leg.from.track,
        },
        to: {
          name: leg.to.name,
          time: leg.to.time ? transitLocalParts(leg.to.time, timezoneAt(leg.to.lat, leg.to.lng)).time : null,
          track: leg.to.track,
        },
        geometry: leg.geometry,
        geometry_precision: leg.geometryPrecision,
      })),
    },
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
            .object({ lat: z.number(), lng: z.number() })
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
          'Search scheduled public-transit routes via Transitous between two coordinates. Returns itineraries that can be passed unchanged to create_transit_journey.',
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
          return ok({
            itineraries: result.itineraries.map((itinerary) => cleanItineraryNames(itinerary, from.name, to.name)),
          });
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
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, dayId, from, to, itinerary, notes }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('reservation_edit', tripId, userId)) return permissionDenied();
      const day = getDay(dayId, tripId);
      if (!day) {
        return { content: [{ type: 'text' as const, text: 'dayId does not belong to this trip.' }], isError: true };
      }

      const cleaned = cleanItineraryNames(itinerary, from.name, to.name);
      const firstStop = cleaned.legs[0].from;
      const lastStop = cleaned.legs[cleaned.legs.length - 1].to;
      if (!coordinatesMatch(from, firstStop) || !coordinatesMatch(to, lastStop)) {
        return {
          content: [
            { type: 'text' as const, text: 'The itinerary does not match the requested origin and destination.' },
          ],
          isError: true,
        };
      }
      let endpoints: EndpointInput[];
      let metadata: ReturnType<typeof buildMetadata>;
      try {
        endpoints = buildEndpoints(from, to, cleaned);
        metadata = buildMetadata(cleaned);
      } catch (err) {
        return errorResult(err, 'Unable to resolve the transit journey timezones.');
      }
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
