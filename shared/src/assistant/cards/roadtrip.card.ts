import { idSchema } from '../../common/primitives.schema';
import { roadtripStopTypeSchema } from '../../place/place.schema';
import { MAX_TRIP_DAYS } from '../../trip/trip.schema';
import { cardClockSchema, cardDateSchema, cardLatSchema, cardLngSchema, cardPointSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A road trip's drive as calculate_roadtrip worked it out: the totals, a
 * strip of its days and, for each day, the stops the planner's rail lists, in
 * the shape the rail reads them, so the chat draws the very rows the planner
 * draws. The server builds it from the tool's raw answer and fits it under
 * MAX_CARD_CHARS: a long trip keeps its first days and counts the rest
 * (`moreDays`), a long day its first stops (`moreStops`), and the lines of
 * the drive are thinned until the card fits.
 */

/** The days a card holds in full; the rest are counted in `moreDays`. */
export const ROADTRIP_CARD_DAYS_MAX = 14;
/** The stops of one day a card holds; the rest are counted in `moreStops`. */
export const ROADTRIP_CARD_STOPS_MAX = 16;
/** The driven pieces of one day; a ride between two terminals splits a day's line. */
export const ROADTRIP_CARD_DAY_LINES_MAX = 4;
/** The points of one driven piece. */
export const ROADTRIP_CARD_LINE_POINTS_MAX = 64;
/** The points of every line of the card together. */
export const ROADTRIP_CARD_POINTS_MAX = 400;

const metres = z.number().min(0).max(5e7);
const seconds = z.number().min(0).max(1e7);
const minutes = z.number().int().min(0).max(100_000);
const dayNumber = z.number().int().min(1).max(MAX_TRIP_DAYS);

/** A driven piece of a day, `[lat, lng]` points at five decimals. */
export const roadtripCardLineSchema = z.array(cardPointSchema).min(2).max(ROADTRIP_CARD_LINE_POINTS_MAX);

/** One stop of a day as the planner's rail reads it, with its schedule entry and what is wrong about it. */
export const roadtripCardStopSchema = z.object({
  // Null for a ride's terminal or a hire car's desk, which are no places of the trip.
  placeId: idSchema.nullable(),
  // Null for a booked night at a day's edge and for a terminal: neither is an assignment.
  assignmentId: idSchema.nullable(),
  name: cardText(80),
  lat: cardLatSchema,
  lng: cardLngSchema,
  stopType: roadtripStopTypeSchema.nullable(),
  // A time pinned on the stop, and the time the drive leaves it at.
  time: cardClockSchema.nullable(),
  leaveAt: cardClockSchema.nullable(),
  dwellMinutes: z.number().int().min(0).max(10_080).nullable(),
  offRoadM: z.number().int().min(0).max(100_000).nullable(),
  // The stop's own fill figure; null follows the trip's setting.
  fillPercent: z.number().int().min(0).max(100).nullable(),
  // The booked night's stop on its check-in day.
  night: z.object({ checkIn: cardClockSchema.nullable() }).nullable(),
  // A marker the daily travel times put where a day ends or resumes.
  autoNight: z.object({ phase: z.enum(['start', 'end']), fromDayNumber: dayNumber }).nullable(),
  bookend: z
    .object({
      phase: z.enum(['morning', 'evening']),
      reservationId: idSchema.nullable(),
      checkingIn: z.boolean(),
      checkingOut: z.boolean(),
      checkIn: cardClockSchema.nullable(),
      checkOut: cardClockSchema.nullable(),
    })
    .nullable(),
  carrier: z
    .object({
      reservationId: idSchema,
      type: z.string().min(1).max(20),
      role: z.enum(['departure', 'arrival', 'pickup', 'return']),
      title: cardText(80),
      code: z.string().min(1).max(8).nullable(),
      at: cardClockSchema.nullable(),
    })
    .nullable(),
  // The schedule's entry for the stop.
  arrival: cardClockSchema.nullable(),
  departure: cardClockSchema.nullable(),
  anchored: z.boolean(),
  dayOffset: z.number().int().min(0).max(60),
  late: z.array(z.object({ code: z.enum(['late', 'missedLeave']), minutes })).max(2),
  // About the drive LEAVING this stop.
  findings: z
    .array(
      z.object({
        code: z.enum(['leg', 'range']),
        overMinutes: minutes.nullable(),
        sinceKm: z.number().min(0).max(40_000).nullable(),
      }),
    )
    .max(2),
});

/** One day of the drive. `legs[i]` runs from `stops[i]` to `stops[i + 1]`; null where it is not routed. */
export const roadtripCardDaySchema = z.object({
  dayId: idSchema,
  dayNumber,
  date: cardDateSchema.nullable(),
  title: cardText(80).nullable(),
  distanceM: metres,
  durationS: seconds,
  stops: z.array(roadtripCardStopSchema).max(ROADTRIP_CARD_STOPS_MAX),
  moreStops: z.number().int().min(0).max(1000),
  legs: z
    .array(z.object({ distanceM: metres, durationS: seconds, mode: z.string().min(1).max(40) }).nullable())
    .max(ROADTRIP_CARD_STOPS_MAX - 1),
  dayOver: z.object({ minutes, limitMinutes: z.number().int().min(1).max(1440) }).nullable(),
  avoidMissed: z.array(z.enum(['motorway', 'toll', 'ferry'])).max(3),
  // Where the range runs out, counted from the last fill.
  dryKm: z.number().min(0).max(40_000).nullable(),
  // The driven pieces only: a ride's straight jump between its terminals is left out.
  lines: z.array(roadtripCardLineSchema).max(ROADTRIP_CARD_DAY_LINES_MAX),
});

export const roadtripCardSchema = z.object({
  kind: z.literal('roadtrip'),
  complete: z.boolean(),
  problem: z.enum(['routing', 'coordinates', 'dayWindow']).nullable(),
  // The settings a preview tried without saving them; empty for the saved drive.
  previewKeys: z.array(z.string().regex(/^roadtrip_[a-z0-9_]{1,40}$/)).max(12),
  vehicle: z.enum(['combustion', 'electric']).nullable(),
  defaultFill: z.number().int().min(1).max(100).nullable(),
  // The trip's own setting, so the sketch colours its days the way the map does.
  dayColors: z.boolean(),
  distanceM: metres,
  durationS: seconds,
  stopCount: z.number().int().min(0).max(10_000),
  chargingCount: z.number().int().min(0).max(10_000),
  days: z.array(roadtripCardDaySchema).min(1).max(ROADTRIP_CARD_DAYS_MAX),
  moreDays: z.number().int().min(0).max(1000),
  quietDays: z.number().int().min(0).max(1000),
  undatedRides: z.number().int().min(0).max(100),
});
export type RoadtripCard = z.infer<typeof roadtripCardSchema>;
export type RoadtripCardDay = z.infer<typeof roadtripCardDaySchema>;
export type RoadtripCardStop = z.infer<typeof roadtripCardStopSchema>;
