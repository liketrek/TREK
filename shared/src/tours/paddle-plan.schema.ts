import { z } from 'zod';

/**
 * PAD-03 and PAD-07: what a paddle tour carries beyond its line. A stretch the
 * boat is carried (a portage), a lock with the times the paddler expects at it,
 * and the planning speeds the estimate is reckoned with. These are the
 * paddler's own plan, never facts from a data source.
 */

/** TREK's planning starting values, to adjust: not norms, not measurements. */
export const DEFAULT_PORTAGE_SPEED_KMH = 2;
export const DEFAULT_PORTAGE_EXTRA_MINUTES = 10;

/** The highest carrying speed a paddler can enter, in km/h. */
export const MAX_PORTAGE_SPEED_KMH = 10;
export const portageSpeedKmhSchema = z.number().finite().min(0.5).max(MAX_PORTAGE_SPEED_KMH);

/** Minutes one portage or one lock may take in a plan; a day tour stays within a day. */
export const MAX_PADDLE_STOP_MINUTES = 12 * 60;
export const paddleStopMinutesSchema = z.number().int().min(0).max(MAX_PADDLE_STOP_MINUTES);

/**
 * A lock on the tour, with the time the paddler expects to wait for it and to
 * pass it. Either may be unknown: an unknown time is missing from the
 * estimate, never zero.
 */
export const paddleLockSchema = z.object({
  wait_minutes: paddleStopMinutesSchema.nullable(),
  transit_minutes: paddleStopMinutesSchema.nullable(),
});
export type PaddleLock = z.infer<typeof paddleLockSchema>;

/** The most portages or locks one recorded track may be marked with. */
export const MAX_TRACK_MARKS = 50;

/**
 * Marks laid onto a recorded track (a GPX import), which is never redrawn: a
 * portage is the stretch between two distances along it, a lock one distance.
 * Distances are metres from the start of the track as recorded.
 */
export const trackPortageMarkSchema = z
  .object({
    from_m: z.number().finite().min(0),
    to_m: z.number().finite().min(0),
    /** Getting out, unloading and putting back in; null takes the starting value. */
    extra_minutes: paddleStopMinutesSchema.nullable(),
  })
  .refine((mark) => mark.to_m > mark.from_m, { message: 'a portage ends after it begins', path: ['to_m'] });
export type TrackPortageMark = z.infer<typeof trackPortageMarkSchema>;

export const trackLockMarkSchema = paddleLockSchema.extend({
  at_m: z.number().finite().min(0),
});
export type TrackLockMark = z.infer<typeof trackLockMarkSchema>;

export const trackMarksSchema = z
  .object({
    portages: z.array(trackPortageMarkSchema).max(MAX_TRACK_MARKS),
    locks: z.array(trackLockMarkSchema).max(MAX_TRACK_MARKS),
  })
  .superRefine((marks, ctx) => {
    const sorted = [...marks.portages].sort((a, b) => a.from_m - b.from_m);
    sorted.forEach((mark, i) => {
      const before = sorted[i - 1];
      if (before && mark.from_m < before.to_m)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['portages'], message: 'portages must not overlap' });
    });
  });
export type TrackMarks = z.infer<typeof trackMarksSchema>;

/**
 * PUT /api/trips/:tripId/tours/:placeId/paddle-plan: the paddle plan of a tour
 * that has no control points of its own, a recorded track. A planned tour
 * saves the same values with its route.
 */
export const tourPaddlePlanRequestSchema = z.object({
  paddle_speed_kmh: z.number().finite().min(0.5).max(20).nullable(),
  portage_speed_kmh: portageSpeedKmhSchema.nullable(),
  track_marks: trackMarksSchema,
});
export type TourPaddlePlanRequest = z.infer<typeof tourPaddlePlanRequestSchema>;
