import { idSchema } from '../common/primitives.schema';
import { tourOriginSchema } from './tour-provenance.schema';

import { z } from 'zod';

/**
 * ACT-01: a recorded track assigned to a tour, the way the tour was actually
 * done. The plan stays what it is: its line, its measures and its times are
 * never touched by an assignment. The recording is a tour of the same trip
 * that came in through the GPX import (or from wanderer) and still holds the
 * line it was recorded with; it keeps its own identity and provenance, and
 * the assignment only points at it. One assignment per execution: a day the
 * tour is on, or no day at all.
 *
 * This is not the track an import planned over in place keeps
 * (`has_recorded_track`, `plannedOver`): that one is where a plan came from,
 * this one is what was walked.
 */

/** The recording an assignment points at, as it is named in the trip. */
export const tourActivityTrackSchema = z.object({
  place_id: idSchema,
  name: z.string(),
  /** How the recording came into the trip; never `trek`, a planned line is no recording. */
  origin: tourOriginSchema,
  /** The GPX file it was read from; null for a wanderer trail and an import from before TREK kept the name. */
  file_name: z.string().nullable(),
  /** When it came into the trip. */
  imported_at: z.string().nullable(),
});
export type TourActivityTrack = z.infer<typeof tourActivityTrackSchema>;

/**
 * What the recording measures, read from its own line every time, so a
 * recording that changes changes these and nothing of the plan. A value the
 * track does not carry stays null: no heights without heights on every point,
 * no time without a time on every point.
 */
export const tourActivityMetricsSchema = z.object({
  distance_km: z.number().nullable(),
  elevation_gain_m: z.number().nullable(),
  elevation_loss_m: z.number().nullable(),
  /** The first and last time the track carries, ISO 8601 in UTC. */
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  /** From the first to the last time, pauses included; null without times on the track. */
  elapsed_minutes: z.number().int().nonnegative().nullable(),
  point_count: z.number().int().nonnegative(),
});
export type TourActivityMetrics = z.infer<typeof tourActivityMetricsSchema>;

const activityPointSchema = z.union([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number(), z.number()])]);

export const tourActivitySchema = z.object({
  id: idSchema,
  /** The execution: the day assignment of the tour it was done on; null for none. */
  assignment_id: idSchema.nullable(),
  /** The day of that assignment, for a reader without the day lists. */
  day_id: idSchema.nullable(),
  assigned_at: z.string().nullable(),
  track: tourActivityTrackSchema,
  metrics: tourActivityMetricsSchema,
  /** The recorded line, every point, for the profile; the MCP tools leave it out. */
  geometry: z.array(activityPointSchema),
});
export type TourActivity = z.infer<typeof tourActivitySchema>;

/** What a tour list item says about its assignments: which recordings, on which execution. */
export const tourActivityRefSchema = z.object({
  id: idSchema,
  track_place_id: idSchema,
  assignment_id: idSchema.nullable(),
});
export type TourActivityRef = z.infer<typeof tourActivityRefSchema>;

/**
 * Assigning a recording to a tour, confirmed by the user. An execution that
 * already has recordings gets this one instead (a day has one, no day can have
 * several once their days are gone); the recording named must not document
 * another tour.
 */
export const tourActivityAssignRequestSchema = z
  .object({
    track_place_id: idSchema,
    assignment_id: idSchema.nullable(),
  })
  .strict();
export type TourActivityAssignRequest = z.infer<typeof tourActivityAssignRequestSchema>;

/**
 * Why an assignment was refused, as the 4xx body's `code` names it: the track
 * is no recording (planned in TREK, or planned over since), it documents
 * another tour already, it is the tour itself or has recordings of its own, the
 * tour is itself the recording of another, or the execution is not this tour's.
 */
export const TOUR_ACTIVITY_REFUSALS = [
  'activity_track_not_recorded',
  'activity_track_in_use',
  'activity_track_is_tour',
  'activity_tour_is_track',
  'activity_assignment_not_of_tour',
] as const;
export type TourActivityRefusal = (typeof TOUR_ACTIVITY_REFUSALS)[number];
