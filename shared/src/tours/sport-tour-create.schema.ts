import { MAX_PADDLE_ROUTE_LEGS, paddleLockPolicySchema } from '../paddle/paddle-route.schema';
import { MAX_SKI_ROUTE_LEGS } from '../ski/ski-route.schema';
import { portageSpeedKmhSchema } from './paddle-plan.schema';
import { skiDisciplineSchema, skiIssues, skiRouteOptionsSchema, skiTechniqueSchema } from './ski.schema';
import { hikeDayIdSchema, hikeStartTimeSchema, plannedMinutesSchema } from './tour-hike.schema';
import {
  paddleBoatTypeSchema,
  paddleLakeStyleSchema,
  paddleSpeedKmhSchema,
  paddleWaterContextSchema,
  tourDescriptionSchema,
  tourNameSchema,
  tourWaypointSchema,
} from './tours.schema';

import { z } from 'zod';

/**
 * A paddle tour or a ski tour the assistant planned with plan_paddle_route
 * or plan_ski_route, saved once the traveller said yes. The legs run from
 * each point to the next; the server plans them again with the same router
 * (both are deterministic over the same data), joins them into one line with
 * its heights and saves the tour the way the planner's save does. A leg that
 * cannot be planned refuses the tour; nothing is saved. Nothing here carries
 * a line from the caller.
 */

const { lat, lng, name } = tourWaypointSchema.shape;

const sportPointSchema = z
  .object({ lat, lng, name: name.describe('What the point is, such as a put-in, a lift station or a hut') })
  .strict();
export type SportTourPoint = z.infer<typeof sportPointSchema>;

const dayFields = {
  planned_duration_minutes: plannedMinutesSchema.optional(),
  day_id: hikeDayIdSchema.optional().describe('The day of the trip the tour is put on, as list_days gives it'),
  start_time: hikeStartTimeSchema
    .optional()
    .describe('When the tour starts on that day, HH:MM, kept as the start of its visit; only with day_id'),
};

export const paddleTourCreateRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the paddle tour is called'),
    description: tourDescriptionSchema.describe('A few words about the tour for the travellers, up to 2000 characters'),
    waypoints: z
      .array(sportPointSchema)
      .min(2)
      .max(MAX_PADDLE_ROUTE_LEGS + 1)
      .describe(
        'The points on the water in order: the put-in, the points on the way and the take-out; each leg runs from one to the next, as plan_paddle_route planned them',
      ),
    boat_type: paddleBoatTypeSchema.optional().describe('The boat: kayak (the default), canoe, sup or other'),
    water_context: paddleWaterContextSchema.describe('The water the tour is on: river or lake'),
    lake_style: paddleLakeStyleSchema
      .optional()
      .describe('direct crosses lakes straight (the default), shore keeps near the shore'),
    lock_policy: paddleLockPolicySchema
      .optional()
      .describe('auto (whichever is quicker, the default), use the locks, or portage round them'),
    paddle_speed_kmh: paddleSpeedKmhSchema
      .optional()
      .describe("The paddling speed in km/h the time is reckoned with; the boat's starting value when left out"),
    portage_speed_kmh: portageSpeedKmhSchema
      .optional()
      .describe('The carrying speed on a portage in km/h; 2 when left out'),
    ...dayFields,
  })
  .strict();
export type PaddleTourCreateRequest = z.infer<typeof paddleTourCreateRequestSchema>;

export const skiTourCreateRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the ski tour is called'),
    description: tourDescriptionSchema.describe('A few words about the tour for the travellers, up to 2000 characters'),
    waypoints: z
      .array(sportPointSchema)
      .min(2)
      .max(MAX_SKI_ROUTE_LEGS + 1)
      .describe(
        'The points in order: the start, the points on the way (a lift station, a hut, a summit) and the end; each leg runs from one to the next, as plan_ski_route planned them',
      ),
    discipline: skiDisciplineSchema.describe(
      'alpine, snowboard, cross_country, touring, snowshoe or winter_hike, as plan_ski_route was asked',
    ),
    technique: skiTechniqueSchema
      .optional()
      .describe('Cross-country only, and needed there: classic, skating or unknown (the skier does not mind)'),
    options: skiRouteOptionsSchema.optional().describe('The options plan_ski_route was asked with'),
    ...dayFields,
  })
  .strict()
  .superRefine((value, ctx) => {
    const issues = skiIssues(true, { ski_discipline: value.discipline, ski_technique: value.technique ?? null });
    for (const issue of issues) {
      const path = issue.path[0] === 'ski_technique' ? ['technique'] : ['discipline'];
      ctx.addIssue({ code: 'custom', path, message: issue.message });
    }
  });
export type SkiTourCreateRequest = z.infer<typeof skiTourCreateRequestSchema>;
