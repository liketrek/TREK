import { horseAccessSharesSchema, horseSignpostedSchema } from './horse-route.schema';
import { paddleCheckSchema, tourObstacleCheckSchema } from './paddle-check.schema';
import {
  paddleLockSchema,
  paddleStopMinutesSchema,
  portageSpeedKmhSchema,
  trackMarksSchema,
} from './paddle-plan.schema';
import { runPaceSecondsPerKmSchema } from './run-pace';
import {
  skiDisciplineSchema,
  skiIssues,
  skiPlannedLegsSchema,
  skiRouteBuildSchema,
  skiRouteOptionsSchema,
  skiTechniqueSchema,
  type SkiDiscipline,
  type SkiTechnique,
} from './ski.schema';
import { tourActivityRefSchema, tourActivitySchema } from './tour-activity.schema';
import { tourPackingLinkSchema } from './tour-packing-link.schema';
import { tourPoiCategorySchema } from './tour-poi-category';
import { tourOriginSchema, tourProvenanceSchema } from './tour-provenance.schema';
import { maxTourMinutesFor, TOUR_DAY_MINUTES, tourStageCountOf, tourStageIssues } from './tour-stages';
import { tourTimeEstimateSchema } from './tour-time-estimate';

import { z } from 'zod';

/**
 * Tours contracts — the generalisation of "hike" into a domain of self-contained,
 * non-motorized activities that follow a track (hike, bike, run, ski, kayak,
 * city walk, food tour, ...), a day each or (MDT-01) one route split into
 * stages over several days. Tour types use a controlled key list.
 *
 * Isolated bounded context:
 * no columns on `places`/`days`/`users`. A tour is a Place (route_geometry reused
 * as-is) plus a day_assignments row (reused as-is, `assignPlaceToDay`) plus this
 * facet table keyed by place_id. Boundary vs. Road-Trip: Tours = non-motorized,
 * Road-Trip = motorized.
 */

export const tourTypeKeySchema = z.enum(['hike', 'bike', 'run', 'ski', 'kayak', 'walk', 'food', 'horse']);
export type TourTypeKey = z.infer<typeof tourTypeKeySchema>;

/**
 * The types a tour can be planned, saved and imported as, in the order they
 * are offered. `kayak` is the key the paddle tour has had in `tour_types` from
 * the start; the app calls it a paddle tour, and the boat is a field of its
 * own. A bike tour (BIK-01) names its profile the same way. `walk` is the city
 * walk (CW-01): stations joined on foot, without a hiking limit. `run` is a
 * run (RUN-01), planned on foot with the runner's own pace. `horse` is a
 * ride (HOR-01): sections of signposted horse routes and stretches the rider
 * draws by hand, never routed. `ski` is a ski and winter tour (SKI-02): a
 * discipline from alpine skiing to winter hiking, its legs planned by the
 * piste router where the piste data reaches and drawn straight elsewhere.
 */
export const plannableTourTypeSchema = z.enum(['hike', 'walk', 'run', 'bike', 'kayak', 'horse', 'ski']);
export type PlannableTourType = z.infer<typeof plannableTourTypeSchema>;

/**
 * The types a tour can be imported and kept as: every type the planner plans.
 * An imported track (a ski track among them, SKI-02) comes in as it was
 * recorded and stays so until a tour is planned from it.
 */
export const importableTourTypeSchema = z.enum(['hike', 'walk', 'run', 'bike', 'kayak', 'horse', 'ski']);
export type ImportableTourType = z.infer<typeof importableTourTypeSchema>;

/**
 * BIK-01 to BIK-04: what a bike tour is ridden on, the one profile it is routed
 * for. Touring/city keeps to paved ways, cycle paths and quiet roads; road
 * keeps to asphalt; gravel takes gravel and farm tracks; mtb takes rough tracks
 * as they come. Each asks the router for something else (see the client's
 * bike routing for what was measured); none says a way is rideable or safe.
 */
export const BIKE_PROFILES = ['touring', 'road', 'gravel', 'mtb'] as const;
export const bikeProfileSchema = z.enum(BIKE_PROFILES);
export type BikeProfile = z.infer<typeof bikeProfileSchema>;

/**
 * RUN-01, RUN-02: what a run is planned as, the one profile it is routed for.
 * Running keeps to runnable, mostly paved ways in towns, parks and along
 * rivers; trail running to forest tracks and natural paths, up to mountain
 * paths (T2). A profile asks the router for ways, it says nothing about
 * whether one can be run, and it changes nothing of the running time.
 */
export const RUN_PROFILES = ['running', 'trail'] as const;
export const runProfileSchema = z.enum(RUN_PROFILES);
export type RunProfile = z.infer<typeof runProfileSchema>;

/** PAD-01: the one boat a paddle tour is planned for. */
export const paddleBoatTypeSchema = z.enum(['kayak', 'canoe', 'sup', 'other']);
export type PaddleBoatType = z.infer<typeof paddleBoatTypeSchema>;

/** PAD-01: the water a paddle tour is on. River and lake are the first supported. */
export const paddleWaterContextSchema = z.enum(['river', 'lake']);
export type PaddleWaterContext = z.infer<typeof paddleWaterContextSchema>;

/** PAD-11: how the router crosses lakes: straight over (the default), or along the shore, which a paddler picks for wind. */
export const paddleLakeStyleSchema = z.enum(['direct', 'shore']);
export type PaddleLakeStyle = z.infer<typeof paddleLakeStyleSchema>;

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

/**
 * MF-08, RTE-01: what a hiker asks the router for besides the difficulty
 * limit: steep climbs, steps and ferries, each avoided where there is a way
 * round. Each is a weighting whose effect on the router was measured, never a
 * ban, and none says anything about how hard the path is. A hike without any
 * keeps null, which is what every tour saved before had.
 */
export const HIKING_PREFERENCE_KEYS = ['avoid_climbs', 'avoid_steps', 'avoid_ferries'] as const;
export type HikingPreferenceKey = (typeof HIKING_PREFERENCE_KEYS)[number];
export const hikingPreferencesSchema = z
  .object({
    /** Gentler ways where there are some, even when they are longer. */
    avoid_climbs: z.boolean().optional(),
    /** Steps and stairs only where there is no way round. */
    avoid_steps: z.boolean().optional(),
    /** A ferry only where there is no way round over land. */
    avoid_ferries: z.boolean().optional(),
  })
  .strict();
export type HikingPreferences = z.infer<typeof hikingPreferencesSchema>;

/** The preferences a hike keeps: only those switched on, null when none is. */
export function hikingPreferencesOf(value: HikingPreferences | null | undefined): HikingPreferences | null {
  const kept = HIKING_PREFERENCE_KEYS.filter((key) => value?.[key] === true);
  return kept.length === 0 ? null : Object.fromEntries(kept.map((key) => [key, true]));
}

/** A planned total is bounded to a day; a multi-day tour's moving time to a day a stage (MDT-01). */
export const MAX_PLANNED_TOUR_DURATION_MINUTES = TOUR_DAY_MINUTES;
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

/** CW-03: a station's key, the same across saves. */
export const stationKeySchema = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/);

/** MDT-02: a stop a stage of a multi-day tour starts or ends at, by its key and where it is. */
export const tourStageStopSchema = z.object({
  key: stationKeySchema,
  lat: z.number(),
  lng: z.number(),
});

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
  /** MF-08: what a hike asks the router for besides its limit; null for none and for a paddle tour. Absent in a list cached before it existed. */
  hiking_preferences: hikingPreferencesSchema.nullable().optional(),
  /** The import (a GPX file, a wanderer snapshot) this tour was planned from, while it is still in the trip. */
  derived_from_place_id: z.number().int().positive().nullable().optional(),
  /** BIK-01: a bike tour's profile; null for every other type. Absent in a list cached before it existed. */
  bike_profile: bikeProfileSchema.nullable().optional(),
  /** RUN-01: a run's profile; null for every other type. Absent in a list cached before it existed. */
  run_profile: runProfileSchema.nullable().optional(),
  /** RUN-01: the pace a run is planned at, seconds per km; null while none is entered and for every other type. */
  run_pace_seconds_per_km: z.number().nullable().optional(),
  /** SKI-02: a ski tour's discipline; null for every other type. Absent in a list cached before it existed. */
  ski_discipline: skiDisciplineSchema.nullable().optional(),
  /** SKI-02: how a cross-country tour is skied; null for every other discipline and type. */
  ski_technique: skiTechniqueSchema.nullable().optional(),
  /** The piste router's options a ski tour was planned with; null for every other type and an imported track. */
  ski_options: skiRouteOptionsSchema.nullable().optional(),
  /** The piste data build a ski tour's legs were planned on; null where the router planned none. */
  ski_route_build: z.string().nullable().optional(),
  /** The ski tour's legs the piste router planned, by the index of the point each starts at; null if unknown. */
  ski_planned_legs: skiPlannedLegsSchema.nullable().optional(),
  /** A paddle tour's boat and water; null for every other type. Absent in a list cached before they existed. */
  boat_type: paddleBoatTypeSchema.nullable().optional(),
  water_context: paddleWaterContextSchema.nullable().optional(),
  /** The speed the paddler chose; null while the boat's suggested speed applies. */
  paddle_speed_kmh: z.number().nullable().optional(),
  /** PAD-07: the carrying speed of a paddle tour's portages; null while the starting value applies. */
  portage_speed_kmh: z.number().nullable().optional(),
  /** PAD-11: how its lakes were routed; null (or absent) means straight over. */
  paddle_lake_style: paddleLakeStyleSchema.nullable().optional(),
  /** PAD-03: portages and locks laid onto a recorded track; null for a planned tour and a track without any. */
  track_marks: trackMarksSchema.nullable().optional(),
});
export type Tour = z.infer<typeof tourSchema>;

/**
 * P2C-03: the technical revision of a saved tour, raised by every write that
 * changes it. Not the version of a source the tour was imported from (that is
 * its provenance), and not a copy (a copy is a tour of its own at 1).
 */
export const tourRevisionSchema = z.number().int().min(1);

/**
 * The revision a write was based on. Given, the write is refused with a 409
 * while the tour has moved on; left out, it writes as before, so an older
 * client or a queued offline write keeps working.
 */
export const expectedTourRevisionSchema = tourRevisionSchema.nullable().optional();

/** The 409 a write against a tour that has moved on answers with: the revision it has now. */
export const TOUR_REVISION_CONFLICT = 'tour_revision_conflict';
export const tourRevisionConflictSchema = z.object({
  error: z.string(),
  code: z.literal(TOUR_REVISION_CONFLICT),
  revision: tourRevisionSchema,
});
export type TourRevisionConflict = z.infer<typeof tourRevisionConflictSchema>;

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
  /** P2C-03: the revision a write names to be refused once the tour moved on; absent in a list cached before it existed. */
  revision: tourRevisionSchema.optional(),
  /** CW-03: a city walk's stations, its points that are no shaping points; null for any other type. */
  station_count: z.number().int().nonnegative().nullable().optional(),
  /** CW-02: the stays entered at a city walk's stations, summed; null for any other type. */
  station_stay_minutes: z.number().int().nonnegative().nullable().optional(),
  /** CW-02: how many of a city walk's stations have no stay entered yet; null for any other type. */
  station_stays_unknown: z.number().int().nonnegative().nullable().optional(),
  /**
   * CW-12: the minutes a city walk's ferry legs take by boat, never part of
   * its walking time; null while the router gave one of them no time, absent
   * for a walk without any.
   */
  walk_ferry_minutes: z.number().int().nonnegative().nullable().optional(),
  /**
   * CW-11: a tour saved with its points only, its way not planned yet (a city
   * walk an assistant created). The planner plans the way when the tour is
   * opened, and a save keeps it. Absent in a list cached before it existed.
   */
  route_pending: z.boolean().optional(),
  /**
   * ACT-01: when the track an import read was recorded, from the times on its
   * points (ISO 8601, UTC); null when the file carried none and for a planned
   * tour. Absent in a list cached before it existed.
   */
  track_started_at: z.string().nullable().optional(),
  track_ended_at: z.string().nullable().optional(),
  /**
   * TIME-01: the time a tour without a planned time (an import) is estimated
   * to take, worked out on reading by `tourTimeEstimate` and never stored;
   * null where nothing estimates it. Its minutes are null when the track has
   * no heights. Apart from the times recorded in the file and from a planned
   * total the travellers enter. Absent in a list cached before it existed.
   */
  time_estimate: tourTimeEstimateSchema.nullable().optional(),
  /** ACT-01: the recordings assigned to this tour, one per execution. Absent in a list cached before it existed. */
  activity_tracks: z.array(tourActivityRefSchema).optional(),
  /** ACT-01: the tour this recording documents, when it is assigned to one; null otherwise. */
  activity_of: z.number().int().positive().nullable().optional(),
  /**
   * MDT-01: the stages a multi-day tour's stops split it into; null for a day
   * tour. Absent in a list cached before it existed.
   */
  stage_count: z.number().int().min(2).nullable().optional(),
  /**
   * MDT-02: the stops the stages run between, in route order: the start, every
   * stop that ends a stage, and the end. A stage is put on a day by the key of
   * the stop it starts at. Null for a day tour; absent in a list cached before it existed.
   */
  stage_stops: z.array(tourStageStopSchema).min(3).nullable().optional(),
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
/**
 * The largest body a tour create or edit may send, in bytes. A tour goes whole,
 * its full line with heights and every fixed leg's line besides, at roughly
 * fifty bytes a point: one horse route section at TOUR_FIXED_LEG_MAX_POINTS is
 * a quarter of a megabyte on its own, far past the API's hundred kilobytes.
 */
export const TOUR_WRITE_MAX_BYTES = 2 * 1024 * 1024;

/** The longest a ferry leg's crossing or its walk may take, a whole day. */
const FERRY_LEG_MAX_MINUTES = 24 * 60;
/** The most stretches by boat one ferry leg keeps; a leg between two stations rarely boards more than twice. */
const FERRY_LEG_MAX_CROSSINGS = 20;

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
 * not as water, with the time getting out and back in takes. A horse route
 * section (HOR-01) is a stretch of a signposted horse route from
 * OpenStreetMap, taken in the direction the rider chose, with the `horse=*`
 * tags its ways carried then; being on the route is no permission to ride it.
 * A ferry leg (CW-12) is a city walk's crossing by boat the travellers took on
 * purpose: the router's way from the station to the next, with where on it the
 * boat runs, so the boat's time never counts as walking.
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
  z.object({
    kind: z.literal('horse_route'),
    /** The OSM relation the section came from, `relation/<id>` style. */
    ref: z
      .string()
      .max(64)
      .regex(/^relation\/\d+$/),
    name: z.string().trim().max(255).nullable(),
    geometry: fixedLegGeometrySchema,
    /** Whether the leg runs the way the route is signposted; null both ways or not said. */
    signposted: horseSignpostedSchema.nullable().optional(),
    /** The `horse=*` tags along the section when it was taken, in metres per value. */
    access: horseAccessSharesSchema.optional(),
  }),
  z.object({
    kind: z.literal('ferry'),
    geometry: fixedLegGeometrySchema,
    /**
     * Each stretch of the line by boat, as the indices of the points the boat
     * leaves from and lands at, in order; the walk between two of them stays walking.
     */
    crossings: z
      .array(z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]))
      .min(1)
      .max(FERRY_LEG_MAX_CROSSINGS),
    /** The time of all its crossings as the router gave it; null when it gave none for one of them. */
    minutes: z.number().int().min(0).max(FERRY_LEG_MAX_MINUTES).nullable(),
    /** The walk to the boat and on from it along this leg, by the router. */
    walk_minutes: z.number().int().min(0).max(FERRY_LEG_MAX_MINUTES),
  }),
]);
export type TourFixedLeg = z.infer<typeof tourFixedLegSchema>;
export type TourFixedLegKind = TourFixedLeg['kind'];

/** CW-02: the longest stay a station takes, a whole day. */
export const MAX_STATION_STAY_MINUTES = 24 * 60;
/** The longest name a tour point keeps. */
export const TOUR_STATION_NAME_MAX = 200;
/** The longest opening hours a station keeps, as OpenStreetMap writes them. */
export const TOUR_STATION_HOURS_MAX = 500;
/**
 * How far a router may move a point of a tour onto its way before the point
 * counts as one no way of the tour's type reaches: the planner's limit, and
 * the server's for a city walk it plans on foot (CW-11).
 */
export const TOUR_MAX_SNAP_M = 300;
/** CW-03: how much a station matters, besides normal (null). */
export const STATION_IMPORTANCES = ['optional', 'must'] as const;
export const stationImportanceSchema = z.enum(STATION_IMPORTANCES);
export type StationImportance = z.infer<typeof stationImportanceSchema>;

/** A tour's name, as a create, an edit and a copy take it. */
export const tourNameSchema = z.string().trim().min(1).max(255);
/** A tour's description, as a create and an edit take it. */
export const tourDescriptionSchema = z.string().trim().max(2000).nullable().optional();

export const tourWaypointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  role: tourWaypointRoleSchema,
  sequence: z.number().int().nonnegative(),
  /** The leg to the next waypoint as a fixed line; absent or null for a routed one. */
  fixed_leg: tourFixedLegSchema.nullable().optional(),
  /** PAD-07: a lock at this point of a paddle tour, with the times the paddler expects there. */
  lock: paddleLockSchema.nullable().optional(),
  /**
   * P2A-03: a shaping point, there only to steer the route: no stop, no place
   * to get in or out. Absent means a stop, as every point saved before was.
   */
  shaping: z.boolean().optional(),
  /**
   * PR1-10: the place of the trip this point stands for, chosen on purpose.
   * The point keeps its own coordinates and the place stays a place; a place
   * that is gone (or not of this trip) leaves the point unlinked.
   */
  linked_place_id: z.number().int().positive().nullable().optional(),
  /**
   * CW-03: the point's own key, kept across saves, so the visits of a city
   * walk's stations outlast a reorder. The server gives one to a point that
   * comes without.
   */
  key: stationKeySchema.optional(),
  /** The point's name where it has one: a station of a city walk, a place found along the route. */
  name: z.string().trim().max(TOUR_STATION_NAME_MAX).nullable().optional(),
  /** CW-02: how long a city walk's station is stayed at; 0 is a point passed through, null not known. */
  stay_minutes: z.number().int().min(0).max(MAX_STATION_STAY_MINUTES).nullable().optional(),
  /** CW-03: how much a station matters; null is normal. */
  importance: stationImportanceSchema.nullable().optional(),
  /** CW-10: a station a proposed change keeps where it is; the traveller can still edit it. */
  protected: z.boolean().optional(),
  /** CW-04: the station's opening hours as OpenStreetMap writes them, where it was found there. */
  opening_hours: z.string().trim().max(TOUR_STATION_HOURS_MAX).nullable().optional(),
  /**
   * PLN-03: the kind of place the point was taken in from, found along the
   * tour (a restaurant, a museum), so its row carries that kind's icon as the
   * map drew the place. Null on a point set by hand.
   */
  poi_category: tourPoiCategorySchema.nullable().optional(),
  /**
   * MDT-01: a stop where a stage of a multi-day tour ends and the next one
   * begins. Absent means the route goes on, as on every point saved before.
   */
  stage_end: z.boolean().optional(),
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
    name: tourNameSchema,
    tour_type: plannableTourTypeSchema.default('hike'),
    route_geometry: z.array(enrichedRoutePointSchema).min(2),
    waypoints: z.array(tourWaypointSchema).min(2),
    /** A hike's routing limit (2 when left out); a paddle tour has none. */
    max_hiking_difficulty: tourMaxHikingDifficultySchema.nullable().optional(),
    /** MF-08, a hike's only: what it asks the router for besides its limit. */
    hiking_preferences: hikingPreferencesSchema.nullable().optional(),
    /** BIK-01, a bike tour's only, and its one requirement. */
    bike_profile: bikeProfileSchema.nullable().optional(),
    /** RUN-01, a run's only, and its one requirement. */
    run_profile: runProfileSchema.nullable().optional(),
    /** RUN-01, a run's only: the pace it is planned at, seconds per km; null while none is entered. */
    run_pace_seconds_per_km: runPaceSecondsPerKmSchema.nullable().optional(),
    /** SKI-02, a ski tour's only, and its one requirement: the discipline, for cross-country the technique too. */
    ski_discipline: skiDisciplineSchema.nullable().optional(),
    ski_technique: skiTechniqueSchema.nullable().optional(),
    /** A ski tour's only: what the piste router was asked for (the server keeps what its discipline reads). */
    ski_options: skiRouteOptionsSchema.nullable().optional(),
    /** A ski tour's only: the piste data build its legs were planned on, so newer data can be offered later. */
    ski_route_build: skiRouteBuildSchema.nullable().optional(),
    /** A ski tour's only: the legs the piste router planned, by the index of the point each starts at. */
    ski_planned_legs: skiPlannedLegsSchema.nullable().optional(),
    boat_type: paddleBoatTypeSchema.nullable().optional(),
    water_context: paddleWaterContextSchema.nullable().optional(),
    paddle_speed_kmh: paddleSpeedKmhSchema.nullable().optional(),
    portage_speed_kmh: portageSpeedKmhSchema.nullable().optional(),
    paddle_lake_style: paddleLakeStyleSchema.nullable().optional(),
    duration_seconds: z.number().finite().nonnegative().nullable().optional(),
    planned_duration_minutes: plannedTourDurationMinutesSchema.optional(),
    break_additional_minutes: plannedTourDurationMinutesSchema.optional(),
    description: tourDescriptionSchema,
    website: tourWebsiteSchema.nullable().optional(),
    /**
     * Creating only: the import of this trip the tour was planned from. It is
     * where the tour came from, so an edit later neither sets nor changes it.
     */
    derived_from_place_id: z.number().int().positive().nullable().optional(),
    /** P2C-03, editing only: the revision the draft was opened at. A create ignores it. */
    expected_revision: expectedTourRevisionSchema,
  })
  .superRefine((value, ctx) => {
    if (
      value.planned_duration_minutes == null &&
      value.duration_seconds != null &&
      value.break_additional_minutes != null &&
      Math.round(value.duration_seconds / 60) + value.break_additional_minutes >
        maxTourMinutesFor(tourStageCountOf(value.waypoints))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['break_additional_minutes'],
        message: plannedTimeLimitMessage(tourStageCountOf(value.waypoints)),
      });
    }
    tourTypeIssues(value).forEach((issue) => ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue }));
    tourStageIssues(value.waypoints).forEach((issue) => ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue }));
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
        if (leg.kind === 'ferry' && !crossingsInOrder(leg.crossings, leg.geometry.length)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['waypoints', index, 'fixed_leg', 'crossings'],
            message:
              'a crossing runs between two points of its leg, the first before the second, after the one before it',
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

type Issue = { path: Array<string | number>; message: string };

function crossingsInOrder(crossings: ReadonlyArray<readonly unknown[]>, points: number): boolean {
  let after = 0;
  for (const crossing of crossings) {
    const [from, to] = [Number(crossing[0]), Number(crossing[1])];
    if (!(from >= after && from < to && to < points)) return false;
    after = to;
  }
  return true;
}

/** How a refusal names each type. */
const TYPE_NAMED: Record<PlannableTourType, string> = {
  kayak: 'a paddle tour',
  bike: 'a bike tour',
  walk: 'a city walk',
  run: 'a run',
  hike: 'a hike',
  horse: 'a horse tour',
  ski: 'a ski tour',
};

/**
 * What a save over its time limit is told: a day for a day tour, as it always
 * was, and a day a stage for a multi-day tour (MDT-01).
 */
export function plannedTimeLimitMessage(stageCount: number): string {
  return stageCount > 1
    ? `walking time plus breaks must be ${maxTourMinutesFor(stageCount)} minutes or less, a day a stage, unless a total is overridden`
    : 'walking time plus breaks must be 1440 minutes or less unless a total is overridden';
}

const PADDLE_FIELDS = [
  'boat_type',
  'water_context',
  'paddle_speed_kmh',
  'portage_speed_kmh',
  'paddle_lake_style',
] as const;

/**
 * What belongs to which type: a hike carries a routing limit and no boat; a
 * bike tour and a run exactly one profile each and nothing of a hike's or a
 * paddler's, a run also its pace; a paddle tour exactly one boat and its
 * water, and no hiking limit; a horse tour (HOR-01) only legs taken from a
 * horse route or drawn by hand, and no riding time worked out for it; a ski
 * tour (SKI-02) its discipline (and a cross-country technique), its piste
 * router options, and no via ferrata.
 */
function tourTypeIssues(value: {
  tour_type: PlannableTourType;
  duration_seconds?: number | null;
  max_hiking_difficulty?: number | null;
  hiking_preferences?: HikingPreferences | null;
  bike_profile?: BikeProfile | null;
  run_profile?: RunProfile | null;
  run_pace_seconds_per_km?: number | null;
  ski_discipline?: SkiDiscipline | null;
  ski_technique?: SkiTechnique | null;
  ski_options?: object | null;
  ski_route_build?: string | null;
  ski_planned_legs?: readonly number[] | null;
  boat_type?: PaddleBoatType | null;
  water_context?: PaddleWaterContext | null;
  paddle_speed_kmh?: number | null;
  portage_speed_kmh?: number | null;
  paddle_lake_style?: PaddleLakeStyle | null;
  waypoints?: ReadonlyArray<{
    fixed_leg?: { kind: string } | null;
    lock?: unknown;
    stay_minutes?: number | null;
    importance?: string | null;
    protected?: boolean;
  }>;
}): Issue[] {
  const issues: Issue[] = [];
  const type = value.tour_type;
  const named = TYPE_NAMED[type];
  if (type === 'kayak') {
    if (value.boat_type == null) issues.push({ path: ['boat_type'], message: 'a paddle tour needs a boat type' });
    if (value.water_context == null)
      issues.push({ path: ['water_context'], message: 'a paddle tour needs a water context' });
  } else {
    for (const field of PADDLE_FIELDS) {
      if (value[field] != null) issues.push({ path: [field], message: `${field} belongs to a paddle tour` });
    }
  }
  if (type === 'hike') {
    if (value.max_hiking_difficulty === null)
      issues.push({ path: ['max_hiking_difficulty'], message: 'a hike needs a hiking difficulty' });
  } else {
    if (value.max_hiking_difficulty != null)
      issues.push({ path: ['max_hiking_difficulty'], message: `${named} has no hiking difficulty` });
    if (hikingPreferencesOf(value.hiking_preferences) !== null)
      issues.push({ path: ['hiking_preferences'], message: `${named} has no hiking preferences` });
  }
  if (type === 'bike' && value.bike_profile == null)
    issues.push({ path: ['bike_profile'], message: 'a bike tour needs a bike profile' });
  if (type !== 'bike' && value.bike_profile != null)
    issues.push({ path: ['bike_profile'], message: 'bike_profile belongs to a bike tour' });
  issues.push(...runIssues(value));
  issues.push(...skiIssues(type === 'ski', value));
  if (type !== 'ski') {
    for (const field of ['ski_options', 'ski_route_build', 'ski_planned_legs'] as const) {
      if (value[field] != null) issues.push({ path: [field], message: `${field} belongs to a ski tour` });
    }
  }
  // Each planned leg is one of this tour's legs, named once.
  const legCount = Math.max(0, (value.waypoints?.length ?? 0) - 1);
  (value.ski_planned_legs ?? []).forEach((leg, index, all) => {
    if (leg >= legCount || all.indexOf(leg) !== index)
      issues.push({ path: ['ski_planned_legs', index], message: 'not a leg of this tour, or named twice' });
  });
  // No router plans a ride, so no time is worked out for it; a planned total the rider enters is theirs.
  // A ski tour's time is the piste router's, sent only when it planned every leg.
  if (type === 'horse' && value.duration_seconds != null)
    issues.push({ path: ['duration_seconds'], message: 'a horse tour has no riding time worked out' });
  const points = value.waypoints ?? [];
  // A portage and a lock are a paddler's; a via ferrata is climbed, never ridden.
  points.forEach((point, index) => {
    const kind = point.fixed_leg?.kind;
    if (type !== 'kayak' && kind === 'portage')
      issues.push({ path: ['waypoints', index, 'fixed_leg'], message: 'a portage belongs to a paddle tour' });
    if (type !== 'kayak' && point.lock != null)
      issues.push({ path: ['waypoints', index, 'lock'], message: 'a lock belongs to a paddle tour' });
    if (
      (type === 'bike' || type === 'walk' || type === 'run' || type === 'horse' || type === 'ski') &&
      kind === 'ferrata'
    )
      issues.push({ path: ['waypoints', index, 'fixed_leg'], message: `${named} has no via ferrata` });
    // CW-12: a crossing by boat is taken on a city walk only, where the way on foot has none.
    if (type !== 'walk' && kind === 'ferry')
      issues.push({ path: ['waypoints', index, 'fixed_leg'], message: 'a ferry leg belongs to a city walk' });
    if (type !== 'horse' && kind === 'horse_route')
      issues.push({
        path: ['waypoints', index, 'fixed_leg'],
        message: 'a horse route section belongs to a horse tour',
      });
    // HOR-01: nothing of a ride is routed, so no leg may pass for one that was.
    if (type === 'horse' && index < points.length - 1 && kind !== 'horse_route' && kind !== 'free')
      issues.push({
        path: ['waypoints', index, 'fixed_leg'],
        message: 'each leg of a horse tour follows a horse route or is drawn by hand',
      });
    // A stay, an importance and a protection are a city walk's stations'.
    if (type !== 'walk' && (point.stay_minutes != null || point.importance != null || point.protected === true))
      issues.push({ path: ['waypoints', index], message: 'stations belong to a city walk' });
  });
  return issues;
}

/** RUN-01: a run names its profile; its profile and pace belong to no other type. */
function runIssues(value: {
  tour_type: PlannableTourType;
  run_profile?: RunProfile | null;
  run_pace_seconds_per_km?: number | null;
}): Issue[] {
  if (value.tour_type === 'run')
    return value.run_profile == null ? [{ path: ['run_profile'], message: 'a run needs a run profile' }] : [];
  return (['run_profile', 'run_pace_seconds_per_km'] as const)
    .filter((field) => value[field] != null)
    .map((field) => ({ path: [field], message: `${field} belongs to a run` }));
}

export const tourCreateResponseSchema = z.object({
  tour: tourListItemSchema,
  waypoints: z.array(tourWaypointSchema),
  /** Where the tour came from (P2C-02); absent only in a detail cached before TREK sent it. */
  provenance: tourProvenanceSchema.optional(),
  /** PAD-06: a paddle tour's obstacle checklist; dropped, never refused, when this build cannot read it. */
  obstacle_check: tourObstacleCheckSchema.optional().catch(undefined),
  /** ACT-01: the recorded tracks assigned to the tour; absent only in a detail cached before TREK sent them. */
  activities: z.array(tourActivitySchema).optional(),
  /**
   * P2D-XD-01: the packing list or category the tour points at, null for none.
   * The packing link writes answer with it; an answer without it says nothing
   * about the link, so a cache keeps the one it had.
   */
  packing_link: tourPackingLinkSchema.nullable().optional(),
});
export type TourCreateResponse = z.infer<typeof tourCreateResponseSchema>;

/**
 * P2C-07 "save as new tour": the name the copy gets. Everything else comes
 * from the tour it is copied from; the copy has its own id, line and control
 * points, and no days.
 */
export const tourCopyRequestSchema = z.object({
  name: tourNameSchema,
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
