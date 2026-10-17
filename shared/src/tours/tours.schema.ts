import { paddleCheckSchema, tourObstacleCheckSchema } from './paddle-check.schema';
import {
  paddleLockSchema,
  paddleStopMinutesSchema,
  portageSpeedKmhSchema,
  trackMarksSchema,
} from './paddle-plan.schema';
import { tourOriginSchema, tourProvenanceSchema } from './tour-provenance.schema';

import { z } from 'zod';

/**
 * Tours contracts — the generalisation of "hike" into a domain of self-contained,
 * single-day, non-motorized activities that follow a track (hike, bike, run, ski,
 * kayak, city walk, food tour, ...). Tour types use a controlled key list.
 *
 * Isolated bounded context:
 * no columns on `places`/`days`/`users`. A tour is a Place (route_geometry reused
 * as-is) plus a day_assignments row (reused as-is, `assignPlaceToDay`) plus this
 * facet table keyed by place_id. Boundary vs. Road-Trip: Tours = non-motorized +
 * single-day, Road-Trip = motorized + multi-day.
 */

export const tourTypeKeySchema = z.enum(['hike', 'bike', 'run', 'ski', 'kayak', 'walk', 'food']);
export type TourTypeKey = z.infer<typeof tourTypeKeySchema>;

/**
 * The types a tour can be planned, saved and imported as. `kayak` is the key
 * the paddle tour has had in `tour_types` from the start; the app calls it a
 * paddle tour, and the boat is a field of its own.
 */
export const plannableTourTypeSchema = z.enum(['hike', 'kayak']);
export type PlannableTourType = z.infer<typeof plannableTourTypeSchema>;

/** PAD-01: the one boat a paddle tour is planned for. */
export const paddleBoatTypeSchema = z.enum(['kayak', 'canoe', 'sup', 'other']);
export type PaddleBoatType = z.infer<typeof paddleBoatTypeSchema>;

/** PAD-01: the water a paddle tour is on. River and lake are the first supported. */
export const paddleWaterContextSchema = z.enum(['river', 'lake']);
export type PaddleWaterContext = z.infer<typeof paddleWaterContextSchema>;

/** The highest planning speed a paddler can enter, in km/h. */
export const MAX_PADDLE_SPEED_KMH = 20;
export const paddleSpeedKmhSchema = z.number().finite().min(0.5).max(MAX_PADDLE_SPEED_KMH);

/**
 * The planning speed TREK suggests for a boat, in km/h: a starting value to
 * adjust, not a measurement. "Other" has none; its paddler enters a speed.
 */
export function recommendedPaddleSpeedKmh(boat: PaddleBoatType | null | undefined): number | null {
  return boat === 'kayak' || boat === 'canoe' || boat === 'sup' ? 4 : null;
}

export const tourMaxHikingDifficultySchema = z.number().int().min(1).max(6);
export type TourMaxHikingDifficulty = z.infer<typeof tourMaxHikingDifficultySchema>;

/** Tours are single-day activities, so a planned total is bounded to 24 hours. */
export const MAX_PLANNED_TOUR_DURATION_MINUTES = 24 * 60;
export const plannedTourDurationMinutesSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_PLANNED_TOUR_DURATION_MINUTES)
  .nullable();

export const tourWebsiteSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .superRefine((value, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid URL' });
      return;
    }
    if (parsed.protocol !== 'https:') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be an HTTPS URL' });
    }
    if (parsed.username || parsed.password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must not contain URL credentials' });
    }
  })
  .transform((value) => new URL(value).toString());

export const tourTypeSchema = z.object({
  key: tourTypeKeySchema,
  label_key: z.string(),
  icon: z.string(),
  color: z.string(),
  /** NULL = no engine routing (e.g. kayak — manual waypoints only). */
  routing_profile: z.string().nullable(),
  is_sport: z.boolean(),
  enabled: z.boolean(),
  sort_order: z.number().int(),
});
export type TourType = z.infer<typeof tourTypeSchema>;

export const tourSchema = z.object({
  place_id: z.number().int().positive(),
  tour_type: tourTypeKeySchema,
  distance: z.number().nullable(),
  elevation_gain: z.number().nullable(),
  elevation_loss: z.number().nullable(),
  duration: z.number().nullable(),
  planned_duration_minutes: plannedTourDurationMinutesSchema.optional(),
  break_additional_minutes: plannedTourDurationMinutesSchema.optional(),
  difficulty: z.string().nullable(),
  // Nullable reference to a tour in wanderer.
  wanderer_ref: z.string().nullable(),
  match_confidence: z.number().min(0).max(1).nullable(),
  // NULL for a GPX import: the track carries no difficulty. A drawn tour always has one.
  max_hiking_difficulty: tourMaxHikingDifficultySchema.nullable(),
  /** The import (a GPX file, a wanderer snapshot) this tour was planned from, while it is still in the trip. */
  derived_from_place_id: z.number().int().positive().nullable().optional(),
  /** A paddle tour's boat and water; null for every other type. Absent in a list cached before they existed. */
  boat_type: paddleBoatTypeSchema.nullable().optional(),
  water_context: paddleWaterContextSchema.nullable().optional(),
  /** The speed the paddler chose; null while the boat's suggested speed applies. */
  paddle_speed_kmh: z.number().nullable().optional(),
  /** PAD-07: the carrying speed of a paddle tour's portages; null while the starting value applies. */
  portage_speed_kmh: z.number().nullable().optional(),
  /** PAD-03: portages and locks laid onto a recorded track; null for a planned tour and a track without any. */
  track_marks: trackMarksSchema.nullable().optional(),
});
export type Tour = z.infer<typeof tourSchema>;

export const tourTypeListResponseSchema = z.object({
  tourTypes: z.array(tourTypeSchema),
});
export type TourTypeListResponse = z.infer<typeof tourTypeListResponseSchema>;

/**
 * A tour as shown in the Tours selection list: the `tours` facet joined with
 * its owning place's name, plus
 * two read-model-only fields the list needs and the facet table does not carry:
 * `planned` (whether the place already has a day_assignments row — the same
 * "attach only" fact PlacesSidebar's All/Unplanned/Planned filter uses) and
 * `caution` (derived from match_confidence < 0.5, the "use with caution"
 * threshold — surfaced as a badge instead of making the client re-derive it).
 */
export const tourListItemSchema = tourSchema.extend({
  name: z.string(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  planned: z.boolean(),
  caution: z.boolean(),
  /** Read-model provenance signal: planner-authored tours persist routing controls; GPX imports do not. */
  has_waypoints: z.boolean().optional(),
  /** An import planned over in place still keeps the track it was recorded with, and can go back to it. */
  has_recorded_track: z.boolean().optional(),
  /** Which way the tour came in; absent only in a list cached before TREK recorded it. */
  origin: tourOriginSchema.optional(),
  /**
   * PAD-09: the check bench of a paddle tour, null when it has no line yet.
   * Only paddle tours carry it. A value this build cannot read (a newer
   * server) is dropped rather than refused, so a queued write still lands.
   */
  paddle_check: paddleCheckSchema.nullable().optional().catch(undefined),
});
export type TourListItem = z.infer<typeof tourListItemSchema>;

export const tourListResponseSchema = z.object({
  tours: z.array(tourListItemSchema),
});
export type TourListResponse = z.infer<typeof tourListResponseSchema>;

export const tourWaypointRoleSchema = z.enum(['start', 'via', 'end']);
export type TourWaypointRole = z.infer<typeof tourWaypointRoleSchema>;

/** The most points a fixed leg may carry: a long via ferrata is a few hundred. */
export const TOUR_FIXED_LEG_MAX_POINTS = 5000;
/** How far a fixed leg's ends may lie from the waypoints it joins, in metres. */
export const TOUR_FIXED_LEG_END_TOLERANCE_M = 60;

const fixedLegGeometrySchema = z
  .array(z.tuple([z.number().finite().min(-90).max(90), z.number().finite().min(-180).max(180)]))
  .min(2)
  .max(TOUR_FIXED_LEG_MAX_POINTS);

/**
 * A leg the router does not plan: the line from this waypoint to the next is
 * taken as it stands. A via ferrata put onto the tour from the map follows its
 * own line from OpenStreetMap, since a router walks around a ferrata wherever
 * it can. A free leg (P2A-04) is drawn by hand, straight from one waypoint to
 * the next: off the path network, across a lake, wherever no router goes.
 * Nothing about a free leg was checked by a router. A portage (PAD-03) is a
 * free leg on land: the boat is carried along it, so it counts as land and
 * not as water, with the time getting out and back in takes.
 */
export const tourFixedLegSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ferrata'),
    /** The OSM way or group the line came from, `way/<id>` style. */
    ref: z.string().trim().min(1).max(64),
    name: z.string().trim().max(255).nullable(),
    geometry: fixedLegGeometrySchema,
  }),
  z.object({
    kind: z.literal('free'),
    geometry: fixedLegGeometrySchema,
  }),
  z.object({
    kind: z.literal('portage'),
    geometry: fixedLegGeometrySchema,
    /** Getting out, unloading and back in, on the first leg of a portage; null takes the starting value. */
    extra_minutes: paddleStopMinutesSchema.nullable().optional(),
  }),
]);
export type TourFixedLeg = z.infer<typeof tourFixedLegSchema>;
export type TourFixedLegKind = TourFixedLeg['kind'];

export const tourWaypointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  role: tourWaypointRoleSchema,
  sequence: z.number().int().nonnegative(),
  /** The leg to the next waypoint as a fixed line; absent or null for a routed one. */
  fixed_leg: tourFixedLegSchema.nullable().optional(),
  /** PAD-07: a lock at this point of a paddle tour, with the times the paddler expects there. */
  lock: paddleLockSchema.nullable().optional(),
});
export type TourWaypoint = z.infer<typeof tourWaypointSchema>;

/**
 * Metres between two `[lat, lng]` points, close enough at the length of a
 * leg's end gap. Read as plain arrays: a workspace compiled without strict
 * mode sees the schema's tuples as "maybe two numbers".
 */
function fixedLegGapM(a: readonly unknown[], b: readonly unknown[]): number {
  const [aLat, aLng, bLat, bLng] = [Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1])];
  const rad = Math.PI / 180;
  const x = (bLng - aLng) * rad * Math.cos(((aLat + bLat) / 2) * rad);
  const y = (bLat - aLat) * rad;
  return Math.hypot(x, y) * 6_371_000;
}

const enrichedRoutePointSchema = z.tuple([
  z.number().finite().min(-90).max(90),
  z.number().finite().min(-180).max(180),
  z.number().finite(),
]);

export const tourCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    tour_type: plannableTourTypeSchema.default('hike'),
    route_geometry: z.array(enrichedRoutePointSchema).min(2),
    waypoints: z.array(tourWaypointSchema).min(2),
    /** A hike's routing limit (2 when left out); a paddle tour has none. */
    max_hiking_difficulty: tourMaxHikingDifficultySchema.nullable().optional(),
    boat_type: paddleBoatTypeSchema.nullable().optional(),
    water_context: paddleWaterContextSchema.nullable().optional(),
    paddle_speed_kmh: paddleSpeedKmhSchema.nullable().optional(),
    portage_speed_kmh: portageSpeedKmhSchema.nullable().optional(),
    duration_seconds: z.number().finite().nonnegative().nullable().optional(),
    planned_duration_minutes: plannedTourDurationMinutesSchema.optional(),
    break_additional_minutes: plannedTourDurationMinutesSchema.optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    website: tourWebsiteSchema.nullable().optional(),
    /**
     * Creating only: the import of this trip the tour was planned from. It is
     * where the tour came from, so an edit later neither sets nor changes it.
     */
    derived_from_place_id: z.number().int().positive().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.planned_duration_minutes == null &&
      value.duration_seconds != null &&
      value.break_additional_minutes != null &&
      Math.round(value.duration_seconds / 60) + value.break_additional_minutes > MAX_PLANNED_TOUR_DURATION_MINUTES
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['break_additional_minutes'],
        message: 'walking time plus breaks must be 1440 minutes or less unless a total is overridden',
      });
    }
    tourTypeIssues(value).forEach((issue) => ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue }));
    value.waypoints.forEach((point, index) => {
      const leg = point.fixed_leg;
      const next = value.waypoints[index + 1];
      if (leg) {
        const first = leg.geometry[0];
        const last = leg.geometry[leg.geometry.length - 1];
        const joins =
          !!next &&
          !!first &&
          !!last &&
          fixedLegGapM(first, [point.lat, point.lng]) <= TOUR_FIXED_LEG_END_TOLERANCE_M &&
          fixedLegGapM(last, [next.lat, next.lng]) <= TOUR_FIXED_LEG_END_TOLERANCE_M;
        if (!joins) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['waypoints', index, 'fixed_leg'],
            message: `Waypoint ${index}'s fixed leg must run from it to the next waypoint`,
          });
        }
      }
      const expectedRole: TourWaypointRole =
        index === 0 ? 'start' : index === value.waypoints.length - 1 ? 'end' : 'via';
      if (point.sequence !== index || point.role !== expectedRole) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['waypoints', index],
          message: `Waypoint ${index} must be ${expectedRole} with sequence ${index}`,
        });
      }
    });
  })
  // A hike left without a limit is routed at T2, as before the field could be null.
  .transform((value) => ({
    ...value,
    max_hiking_difficulty: value.tour_type === 'hike' ? (value.max_hiking_difficulty ?? 2) : null,
  }));
export type TourCreateRequest = z.infer<typeof tourCreateRequestSchema>;
/** What a client sends: the fields the server fills in may be left out. */
export type TourCreateInput = z.input<typeof tourCreateRequestSchema>;

/**
 * What belongs to which type: a hike carries a routing limit and no boat; a
 * paddle tour carries exactly one boat and its water, and no hiking limit.
 */
function tourTypeIssues(value: {
  tour_type: PlannableTourType;
  max_hiking_difficulty?: number | null;
  boat_type?: PaddleBoatType | null;
  water_context?: PaddleWaterContext | null;
  paddle_speed_kmh?: number | null;
  portage_speed_kmh?: number | null;
  waypoints?: ReadonlyArray<{ fixed_leg?: { kind: string } | null; lock?: unknown }>;
}): Array<{ path: Array<string | number>; message: string }> {
  const issues: Array<{ path: Array<string | number>; message: string }> = [];
  if (value.tour_type === 'kayak') {
    if (value.boat_type == null) issues.push({ path: ['boat_type'], message: 'a paddle tour needs a boat type' });
    if (value.water_context == null)
      issues.push({ path: ['water_context'], message: 'a paddle tour needs a water context' });
    if (value.max_hiking_difficulty != null)
      issues.push({ path: ['max_hiking_difficulty'], message: 'a paddle tour has no hiking difficulty' });
    return issues;
  }
  if (value.max_hiking_difficulty === null)
    issues.push({ path: ['max_hiking_difficulty'], message: 'a hike needs a hiking difficulty' });
  for (const field of ['boat_type', 'water_context', 'paddle_speed_kmh', 'portage_speed_kmh'] as const) {
    if (value[field] != null) issues.push({ path: [field], message: `${field} belongs to a paddle tour` });
  }
  // A portage and a lock are a paddler's: a hike carries no boat.
  (value.waypoints ?? []).forEach((point, index) => {
    if (point.fixed_leg?.kind === 'portage')
      issues.push({ path: ['waypoints', index, 'fixed_leg'], message: 'a portage belongs to a paddle tour' });
    if (point.lock != null)
      issues.push({ path: ['waypoints', index, 'lock'], message: 'a lock belongs to a paddle tour' });
  });
  return issues;
}

export const tourCreateResponseSchema = z.object({
  tour: tourListItemSchema,
  waypoints: z.array(tourWaypointSchema),
  /** Where the tour came from (P2C-02); absent only in a detail cached before TREK sent it. */
  provenance: tourProvenanceSchema.optional(),
  /** PAD-06: a paddle tour's obstacle checklist; dropped, never refused, when this build cannot read it. */
  obstacle_check: tourObstacleCheckSchema.optional().catch(undefined),
});
export type TourCreateResponse = z.infer<typeof tourCreateResponseSchema>;

/**
 * P2C-07 "save as new tour": the name the copy gets. Everything else comes
 * from the tour it is copied from; the copy has its own id, line and control
 * points, and no days.
 */
export const tourCopyRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
});
export type TourCopyRequest = z.infer<typeof tourCopyRequestSchema>;

/** Saved-tour editor payload: list metadata plus its persisted routing controls. */
export const tourDetailResponseSchema = tourCreateResponseSchema;
export type TourDetailResponse = z.infer<typeof tourDetailResponseSchema>;

export const tourImportGpxResponseSchema = z.object({
  tours: z.array(tourListItemSchema),
  caution: z.boolean(),
  skipped: z.number().int(),
});
export type TourImportGpxResponse = z.infer<typeof tourImportGpxResponseSchema>;
