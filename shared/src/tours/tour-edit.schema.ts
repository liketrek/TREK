import { idSchema } from '../common/primitives.schema';
import { hexColorSchema } from '../place/place.schema';
import { obstacleReviewOpSchema } from './paddle-check.schema';
import { skiDisciplineSchema, skiTechniqueSchema } from './ski.schema';
import {
  plannedTourDurationMinutesSchema,
  tourDescriptionSchema,
  tourNameSchema,
  tourRevisionSchema,
  tourWebsiteSchema,
} from './tours.schema';

import { z } from 'zod';

/**
 * The edits of a saved tour an assistant makes besides its route, for every
 * type, with the rules the planner's save and the tour detail hold them to:
 * the words and times of a tour, the colour its line is drawn in, a copy, and
 * the writes a ski or paddle tour has of its own. Each names the tour by its
 * place id; a write that changes the tour names the revision it was read at.
 */

const placeId = idSchema.describe('The place id of the tour, as list_tours gives it');
const expectedRevision = tourRevisionSchema.describe(
  'The revision of the tour as last read (get_tour_plan or list_tours); a tour changed since is refused, not overwritten',
);

/** The fields update_tour_details changes, each left out where it stays as it is. */
export const TOUR_DETAIL_FIELDS = [
  'name',
  'description',
  'website',
  'break_additional_minutes',
  'planned_duration_minutes',
] as const;

/**
 * P8: a tour's words and planned times, for any type and a recorded track
 * too, without touching its route, its points or its days. Null clears a
 * field; the breaks are minutes on top of the moving time, the planned
 * duration a total the travellers set themselves, breaks included.
 */
export const tourDetailsUpdateRequestSchema = z
  .object({
    placeId,
    expected_revision: expectedRevision,
    name: tourNameSchema.optional().describe('A new name for the tour'),
    description: tourDescriptionSchema.describe('A new description; null clears it'),
    website: tourWebsiteSchema.nullable().optional().describe('The web page of the tour, an https URL; null clears it'),
    break_additional_minutes: plannedTourDurationMinutesSchema
      .optional()
      .describe('Minutes of breaks on top of the moving time, 0 to 1440; null clears them'),
    planned_duration_minutes: plannedTourDurationMinutesSchema
      .optional()
      .describe('How long the travellers plan to be out in all, breaks included, in minutes; null clears it'),
  })
  .strict()
  .refine((value) => TOUR_DETAIL_FIELDS.some((field) => value[field] !== undefined), {
    message: 'give at least one field to change',
  });
export type TourDetailsUpdateRequest = z.infer<typeof tourDetailsUpdateRequestSchema>;

/** P8: the colour a tour's line is drawn in on the map, as the tour detail sets it; null takes the type's colour. */
export const tourRouteColorRequestSchema = z
  .object({
    placeId,
    route_color: hexColorSchema
      .nullable()
      .describe('A hex colour such as "#e11d48"; null draws the line in the colour of its tour type again'),
  })
  .strict();
export type TourRouteColorRequest = z.infer<typeof tourRouteColorRequestSchema>;

/** P2C-07 over MCP: the tour saved again as a new tour of the same trip, under its own name, without its days. */
export const tourCopyToolRequestSchema = z
  .object({
    placeId,
    name: tourNameSchema.describe('The name of the copy, such as "Ridge walk (short)"'),
  })
  .strict();
export type TourCopyToolRequest = z.infer<typeof tourCopyToolRequestSchema>;

/** SKI-02 over MCP: a ski track classified again, its discipline and for cross-country its technique. */
export const skiClassifyToolRequestSchema = z
  .object({
    placeId,
    ski_discipline: skiDisciplineSchema.describe(
      'alpine, snowboard, cross_country, touring (ski touring), snowshoe or winter_hike',
    ),
    ski_technique: skiTechniqueSchema
      .nullable()
      .optional()
      .describe('For cross_country only: classic, skating, or unknown when the travellers do not know'),
    expected_revision: expectedRevision.optional(),
  })
  .strict();
export type SkiClassifyToolRequest = z.infer<typeof skiClassifyToolRequestSchema>;

/** PAD-06 over MCP: decisions about the obstacles of a paddle tour, at most one change per obstacle. */
export const obstacleDecisionsToolRequestSchema = z
  .object({
    placeId,
    ops: z
      .array(obstacleReviewOpSchema)
      .min(1)
      .max(100)
      .describe(
        "Each change to the checklist: key and basis copied from the entry of get_tour_plan's obstacle_check, op decide (with decision pass, portage, reroute or not_affected, and the entry's basis), note (the note only), clear (the decision taken back) or keep (a decision about an object the data no longer holds)",
      ),
  })
  .strict();
export type ObstacleDecisionsToolRequest = z.infer<typeof obstacleDecisionsToolRequestSchema>;

/** A read about one saved tour: get_tour_trail_details, restore_recorded_track. */
export const tourRefToolRequestSchema = z.object({ placeId }).strict();
export type TourRefToolRequest = z.infer<typeof tourRefToolRequestSchema>;

/** HOR-01 over MCP: the map view to find the signposted horse routes in. */
export const horseRoutesToolRequestSchema = z
  .object({
    bbox: z
      .string()
      .max(200)
      .describe(
        'The map view as "south,west,north,east" in degrees, such as "47.5,11.2,47.7,11.5"; at most about half a degree on each side',
      ),
  })
  .strict();
export type HorseRoutesToolRequest = z.infer<typeof horseRoutesToolRequestSchema>;
