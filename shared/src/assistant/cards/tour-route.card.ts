import { idSchema } from '../../common/primitives.schema';
import { skiColourSchemeSchema, skiRunDifficultySchema, skiSegmentKindSchema } from '../../ski/ski-route.schema';
import { HIKE_UNROUTED_REASONS } from '../../tours/hike-plan.schema';
import { HIKE_WARNING_KINDS } from '../../tours/hike-schedule';
import { tourPoiCategorySchema } from '../../tours/tour-poi-category';
import { tourMaxHikingDifficultySchema, tourTypeKeySchema } from '../../tours/tours.schema';
import { cardClockSchema, cardDateSchema, cardLatSchema, cardLngSchema, cardPointSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A tour's route as the chat draws it: a hike, a city walk, a paddle or a ski
 * plan the assistant proposed, a held change that will create or change one,
 * or a saved tour it read. One kind for every line, so a sketch, a height
 * profile, the stops by how far along they lie, the day with its sun and
 * weather and what to look out for read the same whatever the activity.
 * Positions are metres along the whole route; the line is thinned for
 * drawing and every height is whole metres.
 */

/** How much one card carries at most. */
export const TOUR_ROUTE_LIMITS = {
  line: 300,
  stops: 30,
  along: 12,
  stretches: 80,
  hours: 18,
  warnings: 6,
  previous: 200,
} as const;

const L = TOUR_ROUTE_LIMITS;
const metres = z.number().int().min(0).max(5_000_000);
const climb = z.number().int().min(0).max(100_000);
const height = z.number().int().min(-500).max(9_000);
const minutes = z.number().int().min(0).max(86_400);
const sacStep = z.number().int().min(1).max(6);

/** A point of the line, `[lat, lng, height]` at five decimals; every height is null when one is missing. */
export type TourRoutePoint = [number, number, number | null];
// Re-typed on the way out like cardPointSchema, for the builds without strictNullChecks.
export const tourRoutePointSchema = z
  .tuple([cardLatSchema, cardLngSchema, height.nullable()])
  .transform(([lat, lng, metres]): TourRoutePoint => [lat, lng, metres]);

/** What a stop is beyond its role: a kind of place along a hike, its highest point, a city walk's station. */
export const TOUR_ROUTE_STOP_KINDS = ['highest', 'station'] as const;

/** Why a city walk's station is flagged: closed when it is reached, late for an appointment, past the time frame. */
export const TOUR_ROUTE_STOP_FLAGS = ['closed', 'late', 'after_frame'] as const;

export const tourRouteStopSchema = z.object({
  role: z.enum(['start', 'via', 'end', 'along']),
  kind: z.union([tourPoiCategorySchema, z.enum(TOUR_ROUTE_STOP_KINDS)]).nullable(),
  name: cardText(80).nullable(),
  lat: cardLatSchema,
  lng: cardLngSchema,
  atM: metres,
  /** A place along the way: how far off it, in metres. */
  offM: z.number().int().min(0).max(2_000).nullable(),
  /** The walking minutes from the start to it. */
  minutes: minutes.nullable(),
  /** When it is reached on the day's schedule. */
  clock: cardClockSchema.nullable(),
  stayMinutes: minutes.nullable(),
  stageEnd: z.boolean(),
  flag: z.enum(TOUR_ROUTE_STOP_FLAGS).nullable(),
});
export type TourRouteStop = z.infer<typeof tourRouteStopSchema>;

/** A stretch drawn dotted: carried, white water, a gap in the data, a ferry, a lift, a via ferrata, drawn freely. */
export const TOUR_ROUTE_MARKS = ['portage', 'rapids', 'gap', 'ferry', 'lift', 'ferrata', 'free'] as const;

/** A stretch of the route with something to tell: its SAC grade, a ski run or trail, or a mark. */
export const tourRouteStretchSchema = z.discriminatedUnion('facet', [
  z.object({ facet: z.literal('sac'), fromM: metres, toM: metres, step: sacStep }),
  z.object({
    facet: z.literal('ski'),
    fromM: metres,
    toM: metres,
    kind: skiSegmentKindSchema,
    difficulty: skiRunDifficultySchema.nullable(),
  }),
  z.object({ facet: z.literal('mark'), fromM: metres, toM: metres, kind: z.enum(TOUR_ROUTE_MARKS) }),
]);
export type TourRouteStretch = z.infer<typeof tourRouteStretchSchema>;

/** What to look out for: the day's weather and light, and legs of a plan that could not be planned. */
export const TOUR_WARNING_KINDS = [...HIKE_WARNING_KINDS, 'legs_failed'] as const;

/**
 * Why a route is drawn straight between its stops: the hike planner's
 * reasons, a city walk whose only way runs by boat, or a held change whose
 * way is planned only once it is applied.
 */
export const TOUR_ROUTE_PROBLEMS = [...HIKE_UNROUTED_REASONS, 'ferry_only', 'not_planned'] as const;

export const tourRouteScheduleSchema = z.object({
  date: cardDateSchema,
  dayId: idSchema.nullable(),
  dayNumber: z.number().int().min(1).max(999).nullable(),
  start: cardClockSchema.nullable(),
  arrive: cardClockSchema.nullable(),
  nextDay: z.boolean(),
  sunrise: cardClockSchema.nullable(),
  sunset: cardClockSchema.nullable(),
  latestStart: cardClockSchema.nullable(),
  weather: z.enum(['forecast', 'climate']).nullable(),
  hours: z
    .array(
      z.object({
        hour: z.number().int().min(0).max(23),
        main: cardText(20),
        tempC: z.number().int().min(-80).max(60),
        /** Null where the weather knows no likelihood (last year's day, a past day): never read as 0 %. */
        rainPct: z.number().int().min(0).max(100).nullable(),
        windKmh: z.number().int().min(0).max(400).nullable(),
      }),
    )
    .max(L.hours),
});
export type TourRouteSchedule = z.infer<typeof tourRouteScheduleSchema>;

export const tourRouteCardSchema = z.object({
  kind: z.literal('tourRoute'),
  /** proposal: a way proposed; plan: a paddle or ski plan; pending: a held change; saved: a tour of the trip. */
  source: z.enum(['proposal', 'plan', 'pending', 'saved']),
  activity: tourTypeKeySchema,
  placeId: idSchema.nullable(),
  name: cardText(120).nullable(),
  /** A way's own words when several are compared ("short and steep"). */
  label: cardText(40).nullable(),
  distanceM: metres.nullable(),
  ascentM: climb.nullable(),
  descentM: climb.nullable(),
  minEleM: height.nullable(),
  maxEleM: height.nullable(),
  minutes: minutes.nullable(),
  minutesBasis: z.enum(['din33466', 'router', 'planned', 'stations', 'piste']).nullable(),
  /** The hiking limit the way was planned under, a setting rather than a grade of the path. */
  limit: tourMaxHikingDifficultySchema.nullable(),
  grades: z.object({ highest: sacStep.nullable(), unknownShare: z.number().min(0).max(1) }).nullable(),
  /** False: the stops joined straight, drawn dashed, without a profile. */
  routed: z.boolean(),
  problem: z
    .object({
      why: z.enum(TOUR_ROUTE_PROBLEMS),
      position: z.number().int().positive().nullable(),
      snappedM: z.number().int().min(0).max(1_000_000).nullable(),
    })
    .nullable(),
  line: z.array(tourRoutePointSchema).max(L.line),
  stretches: z.array(tourRouteStretchSchema).max(L.stretches),
  /** In the order they lie along the way. */
  stops: z.array(tourRouteStopSchema).max(L.stops + L.along),
  stages: z.number().int().min(2).max(60).nullable(),
  skiScheme: skiColourSchemeSchema.nullable(),
  schedule: tourRouteScheduleSchema.nullable(),
  warnings: z
    .array(
      z.object({
        kind: z.enum(TOUR_WARNING_KINDS),
        at: cardClockSchema.nullable(),
        count: z.number().int().min(1).max(50).nullable(),
      }),
    )
    .max(L.warnings),
  /** A held change of a saved tour's way: the way it has now, to draw faintly beside the new one. */
  previous: z
    .object({
      line: z.array(cardPointSchema).min(2).max(L.previous),
      distanceM: metres,
      ascentM: climb.nullable(),
      minutes: minutes.nullable(),
    })
    .nullable(),
});
export type TourRouteCard = z.infer<typeof tourRouteCardSchema>;
