import { haversineKm } from './distanceService';
import type { EndpointInput } from './reservationService';
import { localParts, resolveTimeZone } from './timezoneService';
import { deriveTransitStats, type TransitItinerary, type TransitLeg } from './transitService';

import { z } from 'zod';

const MAX_ENDPOINT_DISTANCE_KM = 0.1;
const MAX_LEG_GAP_KM = 1;
const TIME_TOLERANCE_MS = 60_000;

export const transitCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const transitPlaceSchema = transitCoordinatesSchema.extend({
  name: z.string().min(1).max(300),
});

const transitStopSchema = transitPlaceSchema.extend({
  time: z.string().datetime({ offset: true }).nullable(),
  scheduledTime: z.string().datetime({ offset: true }).nullable(),
  track: z.string().max(100).nullable(),
});

// SCHEDULED_TRANSIT_MODES is the *request* whitelist — what a caller may filter by. The
// provider's response taxonomy is wider: MOTIS's default TRANSIT expands to
// TRAM,FERRY,AIRPLANE,BUS,COACH,RAIL,ODM,RIDE_SHARING,FUNICULAR,AERIAL_LIFT,OTHER, and a leg
// can also be a street mode (BIKE/CAR/RENTAL). Validating legs against the request whitelist
// silently dropped every itinerary containing e.g. an AIRPLANE leg. transitService already
// uppercases the mode and defaults it to WALK, so accept any mode token and let the
// "at least one non-WALK leg" rule below do the gating — exactly as the web client does,
// which treats mode as a free string.
const transitLegModes = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Z_]+$/);

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

export function effectiveTransitStopTime(stop: { time?: string | null; scheduledTime?: string | null }): string | null {
  return stop.time ?? stop.scheduledTime ?? null;
}

export const transitItinerarySchema = z
  .object({
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    duration: z.number().nonnegative(),
    transfers: z.number().int().nonnegative(),
    walkSeconds: z.number().nonnegative(),
    legs: z.array(transitLegSchema).min(1).max(20),
  })
  .superRefine((itinerary, context) => {
    const startTime = new Date(itinerary.startTime).getTime();
    const endTime = new Date(itinerary.endTime).getTime();
    if (endTime <= startTime) {
      context.addIssue({ code: 'custom', message: 'endTime must be after startTime', path: ['endTime'] });
    }
    if (!itinerary.legs.some((leg) => leg.mode !== 'WALK')) {
      context.addIssue({ code: 'custom', message: 'At least one scheduled transit leg is required', path: ['legs'] });
    }
    const maximumTransfers = Math.max(0, itinerary.legs.filter((leg) => leg.mode !== 'WALK').length - 1);
    if (itinerary.transfers > maximumTransfers) {
      context.addIssue({
        code: 'custom',
        message: 'transfers exceeds the number of transit legs',
        path: ['transfers'],
      });
    }
    const geometrySize = itinerary.legs.reduce((total, leg) => total + (leg.geometry?.length ?? 0), 0);
    if (geometrySize > 60_000) {
      context.addIssue({ code: 'custom', message: 'Combined transit geometry is too large', path: ['legs'] });
    }
    itinerary.legs.forEach((leg, index) => {
      const effectiveFromTime = effectiveTransitStopTime(leg.from);
      const effectiveToTime = effectiveTransitStopTime(leg.to);
      const fromTime = effectiveFromTime ? new Date(effectiveFromTime).getTime() : null;
      const toTime = effectiveToTime ? new Date(effectiveToTime).getTime() : null;
      if (fromTime === null || toTime === null) {
        context.addIssue({
          code: 'custom',
          message: 'Every leg requires departure and arrival times',
          path: ['legs', index],
        });
        return;
      }
      if (toTime < fromTime) {
        context.addIssue({ code: 'custom', message: 'Leg arrival must not precede departure', path: ['legs', index] });
      }
      if (Math.abs(toTime - fromTime - leg.duration * 1000) > TIME_TOLERANCE_MS) {
        context.addIssue({
          code: 'custom',
          message: 'Leg duration does not match its times',
          path: ['legs', index, 'duration'],
        });
      }
      if (fromTime < startTime || toTime > endTime) {
        context.addIssue({
          code: 'custom',
          message: 'Leg times must stay within the itinerary',
          path: ['legs', index],
        });
      }
      if (index === 0) return;
      const previous = itinerary.legs[index - 1];
      if (haversineKm(previous.to.lat, previous.to.lng, leg.from.lat, leg.from.lng) > MAX_LEG_GAP_KM) {
        context.addIssue({ code: 'custom', message: 'Adjacent legs are not connected', path: ['legs', index, 'from'] });
      }
      const previousTime = effectiveTransitStopTime(previous.to);
      if (
        previousTime &&
        effectiveFromTime &&
        new Date(effectiveFromTime).getTime() < new Date(previousTime).getTime()
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Adjacent legs are not chronological',
          path: ['legs', index, 'from', 'time'],
        });
      }
    });
    const firstDeparture = effectiveTransitStopTime(itinerary.legs[0].from);
    const lastArrival = effectiveTransitStopTime(itinerary.legs[itinerary.legs.length - 1].to);
    if (!firstDeparture || Math.abs(new Date(firstDeparture).getTime() - startTime) > TIME_TOLERANCE_MS) {
      context.addIssue({
        code: 'custom',
        message: 'First leg must start with the itinerary',
        path: ['legs', 0, 'from', 'time'],
      });
    }
    if (!lastArrival || Math.abs(new Date(lastArrival).getTime() - endTime) > TIME_TOLERANCE_MS) {
      context.addIssue({
        code: 'custom',
        message: 'Last leg must end with the itinerary',
        path: ['legs', itinerary.legs.length - 1, 'to', 'time'],
      });
    }
  });

export type TransitPlaceInput = z.infer<typeof transitPlaceSchema>;

export function transitCoordinatesMatch(expected: TransitPlaceInput, actual: TransitPlaceInput): boolean {
  return haversineKm(expected.lat, expected.lng, actual.lat, actual.lng) <= MAX_ENDPOINT_DISTANCE_KM;
}

export function cleanTransitItineraryNames(
  itinerary: TransitItinerary,
  fromName: string,
  toName: string,
): TransitItinerary {
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

export function buildTransitReservationParts(
  from: TransitPlaceInput,
  to: TransitPlaceInput,
  itinerary: TransitItinerary,
) {
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
    const stopTime = effectiveTransitStopTime(stop);
    const local = stopTime ? transitLocalParts(stopTime, timezone) : null;
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

  const stats = deriveTransitStats(itinerary.startTime, itinerary.endTime, itinerary.legs, itinerary.transfers);
  const metadata = {
    transit: {
      provider: 'transitous',
      duration: stats.duration,
      transfers: stats.transfers,
      walk_seconds: stats.walkSeconds,
      legs: itinerary.legs.map((leg: TransitLeg) => {
        const fromTime = effectiveTransitStopTime(leg.from);
        const toTime = effectiveTransitStopTime(leg.to);
        return {
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
            time: fromTime ? transitLocalParts(fromTime, timezoneAt(leg.from.lat, leg.from.lng)).time : null,
            track: leg.from.track,
          },
          to: {
            name: leg.to.name,
            time: toTime ? transitLocalParts(toTime, timezoneAt(leg.to.lat, leg.to.lng)).time : null,
            track: leg.to.track,
          },
          geometry: leg.geometry,
          geometry_precision: leg.geometryPrecision,
        };
      }),
    },
  };

  return { endpoints, metadata };
}
