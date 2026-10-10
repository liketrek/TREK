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

export const tourMaxHikingDifficultySchema = z.number().int().min(1).max(6);
export type TourMaxHikingDifficulty = z.infer<typeof tourMaxHikingDifficultySchema>;

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
  difficulty: z.string().nullable(),
  // Nullable reference to a tour in wanderer.
  wanderer_ref: z.string().nullable(),
  match_confidence: z.number().min(0).max(1).nullable(),
  max_hiking_difficulty: tourMaxHikingDifficultySchema,
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
  planned: z.boolean(),
  caution: z.boolean(),
  /** Read-model provenance signal: planner-authored tours persist routing controls; GPX imports do not. */
  has_waypoints: z.boolean().optional(),
});
export type TourListItem = z.infer<typeof tourListItemSchema>;

export const tourListResponseSchema = z.object({
  tours: z.array(tourListItemSchema),
});
export type TourListResponse = z.infer<typeof tourListResponseSchema>;

export const tourWaypointRoleSchema = z.enum(['start', 'via', 'end']);
export type TourWaypointRole = z.infer<typeof tourWaypointRoleSchema>;

export const tourWaypointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  role: tourWaypointRoleSchema,
  sequence: z.number().int().nonnegative(),
});
export type TourWaypoint = z.infer<typeof tourWaypointSchema>;

const enrichedRoutePointSchema = z.tuple([
  z.number().finite().min(-90).max(90),
  z.number().finite().min(-180).max(180),
  z.number().finite(),
]);

export const tourCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    tour_type: z.literal('hike').default('hike'),
    route_geometry: z.array(enrichedRoutePointSchema).min(2),
    waypoints: z.array(tourWaypointSchema).min(2),
    max_hiking_difficulty: tourMaxHikingDifficultySchema.default(2),
    duration_seconds: z.number().finite().nonnegative().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    value.waypoints.forEach((point, index) => {
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
  });
export type TourCreateRequest = z.infer<typeof tourCreateRequestSchema>;

export const tourCreateResponseSchema = z.object({
  tour: tourListItemSchema,
  waypoints: z.array(tourWaypointSchema),
});
export type TourCreateResponse = z.infer<typeof tourCreateResponseSchema>;

/** Saved-tour editor payload: list metadata plus its persisted routing controls. */
export const tourDetailResponseSchema = tourCreateResponseSchema;
export type TourDetailResponse = z.infer<typeof tourDetailResponseSchema>;

export const tourImportGpxResponseSchema = z.object({
  tours: z.array(tourListItemSchema),
  caution: z.boolean(),
  skipped: z.number().int(),
});
export type TourImportGpxResponse = z.infer<typeof tourImportGpxResponseSchema>;
