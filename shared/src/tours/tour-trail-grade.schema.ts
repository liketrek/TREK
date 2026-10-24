import { z } from 'zod';

/**
 * BIK-05, MAP-03 and MAP-04: what OpenStreetMap records for the ways a tour
 * runs on, asked for by the ways' ids: the mountain bike scales for a bike
 * tour, the SAC hiking scale, the surface and the kind of way for a hike. A
 * read: nothing about the tour changes. A way without a grade is unknown,
 * never easy; a way that could not be asked about is named, so the planner
 * can say so.
 */

/** The most ways one question names; a longer tour asks for its first ones. */
export const TOUR_TRAIL_GRADE_MAX_WAYS = 2000;

export const tourTrailGradeRequestSchema = z
  .object({
    way_ids: z.array(z.number().int().positive()).min(1).max(TOUR_TRAIL_GRADE_MAX_WAYS),
  })
  .strict();
export type TourTrailGradeRequest = z.infer<typeof tourTrailGradeRequestSchema>;

/**
 * MAP-03: the six steps of the SAC hiking scale as OpenStreetMap writes them
 * in `sac_scale`, from T1 to T6 in this order.
 */
export const SAC_SCALE_VALUES = [
  'hiking',
  'mountain_hiking',
  'demanding_mountain_hiking',
  'alpine_hiking',
  'demanding_alpine_hiking',
  'difficult_alpine_hiking',
] as const;
export const sacScaleSchema = z.enum(SAC_SCALE_VALUES);
export type SacScale = z.infer<typeof sacScaleSchema>;
export type SacStep = 1 | 2 | 3 | 4 | 5 | 6;

/** The step of the scale a `sac_scale` value names: `hiking` is T1, `difficult_alpine_hiking` T6. */
export function sacStepOf(value: SacScale): SacStep {
  return (SAC_SCALE_VALUES.indexOf(value) + 1) as SacStep;
}

/** The most of a tag's value that is handed on as written, so a stray long value cannot bloat the answer. */
export const OSM_TAG_VALUE_MAX = 64;

const writtenValue = z.string().min(1).max(OSM_TAG_VALUE_MAX).nullable();

/**
 * One way's grades as OpenStreetMap tags them, read to the scale's own steps:
 * `mtb:scale` 0 to 6 (a + or - kept), `mtb:scale:uphill` 0 to 5,
 * `mtb:scale:imba` 0 to 4, and `sac_scale` as one of its six values. Null
 * where the way has no such tag or one that is no step of the scale. A
 * `sac_scale` that is there but names no single step (`T3`, two values joined
 * by `;`) is handed on as written in `sac_scale_unclear`, so the planner can
 * say the grade is unclear rather than missing; it is never read to a step.
 *
 * MAP-04: `surface` and `highway` are handed on as OpenStreetMap wrote them
 * (trimmed, never normalised), so the planner can tell a recorded surface
 * from the router's own reading, which may be a default. Null where the way
 * carries no such tag.
 */
export const tourTrailGradeSchema = z.object({
  id: z.number().int().positive(),
  mtb_scale: z
    .string()
    .regex(/^[0-6][+-]?$/)
    .nullable(),
  mtb_scale_uphill: z
    .string()
    .regex(/^[0-5][+-]?$/)
    .nullable(),
  mtb_scale_imba: z
    .string()
    .regex(/^[0-4]$/)
    .nullable(),
  sac_scale: sacScaleSchema.nullable(),
  sac_scale_unclear: writtenValue,
  surface: writtenValue,
  highway: writtenValue,
});
export type TourTrailGrade = z.infer<typeof tourTrailGradeSchema>;

export const tourTrailGradeResponseSchema = z.object({
  /** The ways asked about that carry at least one of the values read. */
  ways: z.array(tourTrailGradeSchema),
  /** The ways the data could not be asked about this time: their grade is unknown, not absent. */
  unanswered: z.array(z.number().int().positive()),
});
export type TourTrailGradeResponse = z.infer<typeof tourTrailGradeResponseSchema>;
