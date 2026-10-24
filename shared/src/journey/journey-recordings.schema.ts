import { dawarichTrackSegmentSchema, type DawarichTrackSegment } from '../dawarich/dawarich.schema';
import { haversineMetres } from '../geo/haversine';

import { z } from 'zod';

/**
 * JRN-01: the route recorded on one day of a journey, taken over from Dawarich
 * on purpose and kept by the journey.
 *
 * The Dawarich overlay is a live read that is forgotten again. A recorded day
 * is the exception the traveller asks for: a preview first, then a confirmed
 * copy of that one day, thinned like the overlay, that stays drawn when the
 * instance is down or the connection is gone. Its pieces keep the gaps of the
 * recording and the mode Dawarich gave them; nothing joins two pieces the
 * recording did not join.
 *
 * A day is cut in one zone, chosen in the preview: Dawarich's own when it
 * reveals one, else the one the traveller picks.
 */

/** Where a recorded day came from. One source today; the column is there for a second. */
export const JOURNEY_RECORDING_SOURCES = ['dawarich'] as const;

/** `YYYY-MM-DD`, a calendar day that exists. */
export const journeyRecordingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Not a calendar day');

/** A zone offset in minutes east of UTC, as far as zones go (UTC-12 to UTC+14). */
export const utcOffsetMinutesSchema = z.number().int().min(-720).max(840);

/** What a recorded day covers, worked out from its pieces. */
export const journeyRecordingStatsSchema = z.object({
  /** Metres along the pieces; a gap between two pieces adds nothing. */
  distanceMeters: z.number(),
  pointCount: z.number(),
  segmentCount: z.number(),
  /** Stretches the recording does not cover: two pieces that do not meet. */
  gapCount: z.number(),
  /** The modes Dawarich gave the pieces, each once, in the order they were first travelled. */
  modes: z.array(z.string()),
  firstAt: z.string().nullable(),
  lastAt: z.string().nullable(),
});
export type JourneyRecordingStats = z.infer<typeof journeyRecordingStatsSchema>;

const recordingWindowSchema = z.object({
  /** The instant the local day began, ISO-8601. */
  from: z.string(),
  /** The instant it ended. */
  to: z.string(),
});

/** A recorded day as the journey keeps it. */
export const journeyRecordedDaySchema = z.object({
  id: z.number(),
  date: z.string(),
  source: z.enum(JOURNEY_RECORDING_SOURCES),
  /** Which Dawarich endpoint answered: pre-segmented tracks or thinned points. */
  sourceKind: z.enum(['tracks', 'points']),
  utcOffsetMinutes: z.number(),
  window: recordingWindowSchema,
  segments: z.array(dawarichTrackSegmentSchema),
  stats: journeyRecordingStatsSchema,
  /** The source hit its page cap and the day is incomplete. */
  truncated: z.boolean(),
  /** The day was not over yet in its zone when it was taken over. */
  provisional: z.boolean(),
  /** When the source answered. */
  fetchedAt: z.string(),
  contentHash: z.string(),
  /** Whose recording it is; null once that account is gone. */
  importedBy: z.object({ id: z.number(), username: z.string() }).nullable(),
  /** When this version was taken over, ISO-8601. */
  savedAt: z.string(),
});
export type JourneyRecordedDay = z.infer<typeof journeyRecordedDaySchema>;

export const journeyRecordedDaysResponseSchema = z.object({
  days: z.array(journeyRecordedDaySchema),
});
export type JourneyRecordedDaysResponse = z.infer<typeof journeyRecordedDaysResponseSchema>;

export const journeyRecordingPreviewRequestSchema = z.object({
  date: journeyRecordingDateSchema,
  /** The zone to cut the day in when the source names none, or when `useSourceOffset` is off. */
  utcOffsetMinutes: utcOffsetMinutesSchema,
  /** Cut the day in the zone Dawarich records in, where it reveals one. */
  useSourceOffset: z.boolean().optional(),
});
export type JourneyRecordingPreviewRequest = z.infer<typeof journeyRecordingPreviewRequestSchema>;

/**
 * What taking a day over would keep, read live and written nowhere. Saving
 * sends `contentHash` back, so what is kept is what was looked at.
 */
export const journeyRecordingPreviewSchema = z.object({
  journey: z.object({ id: z.number(), title: z.string() }),
  date: z.string(),
  utcOffsetMinutes: z.number(),
  /** `source`: the zone Dawarich records in. `chosen`: the one asked for. */
  offsetSource: z.enum(['source', 'chosen']),
  /** Dawarich's own zone where its answer reveals one, else null. */
  sourceOffsetMinutes: z.number().nullable(),
  window: recordingWindowSchema,
  sourceKind: z.enum(['tracks', 'points']),
  segments: z.array(dawarichTrackSegmentSchema),
  stats: journeyRecordingStatsSchema,
  truncated: z.boolean(),
  provisional: z.boolean(),
  fetchedAt: z.string(),
  /** Null when nothing was recorded on the day: there is nothing to keep. */
  contentHash: z.string().nullable(),
  /** The version the journey keeps for this day, if any. */
  stored: journeyRecordedDaySchema.nullable(),
  /** The live recording is the one already kept. */
  sameAsStored: z.boolean(),
  /** How many other people can open the journey and would see the route. */
  audience: z.number(),
});
export type JourneyRecordingPreview = z.infer<typeof journeyRecordingPreviewSchema>;

export const journeyRecordingSaveRequestSchema = z.object({
  utcOffsetMinutes: utcOffsetMinutesSchema,
  /** The `contentHash` of the preview that was confirmed. */
  expectedHash: z.string().regex(/^[0-9a-f]{64}$/),
  /** Replace a different version the journey already keeps for the day. */
  replace: z.boolean().optional(),
});
export type JourneyRecordingSaveRequest = z.infer<typeof journeyRecordingSaveRequestSchema>;

export const journeyRecordingSaveResultSchema = z.object({
  day: journeyRecordedDaySchema,
  /** `unchanged`: the day was kept already, exactly so, and nothing was written. */
  outcome: z.enum(['created', 'replaced', 'unchanged']),
});
export type JourneyRecordingSaveResult = z.infer<typeof journeyRecordingSaveResultSchema>;

/** Two pieces closer than this meet; farther apart, the recording has a gap between them. */
export const RECORDING_GAP_METERS = 250;

/**
 * A point as `[lat, lng]`. Read as a plain array because the client compiles
 * these sources without strictNullChecks, where the schema's tuple reads as two
 * optional numbers and a rest of anything.
 */
type LatLng = readonly unknown[];

const coord = (value: unknown): number => (typeof value === 'number' ? value : 0);

function metresBetween(a: LatLng, b: LatLng): number {
  return haversineMetres(coord(a[0]), coord(a[1]), coord(b[0]), coord(b[1]));
}

function lengthOf(points: readonly LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += metresBetween(points[i - 1]!, points[i]!);
  return total;
}

/**
 * What a day's pieces cover. A piece's own distance is Dawarich's measurement
 * and wins over the thinned line's length, which is always a little short.
 */
export function recordingStats(segments: DawarichTrackSegment[]): JourneyRecordingStats {
  let distanceMeters = 0;
  let pointCount = 0;
  let gapCount = 0;
  const modes: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    distanceMeters += segment.distanceMeters ?? lengthOf(segment.points);
    pointCount += segment.points.length;
    if (segment.mode && !modes.includes(segment.mode)) modes.push(segment.mode);
    const previous = segments[i - 1];
    const end = previous?.points[previous.points.length - 1];
    const start = segment.points[0];
    if (end && start && metresBetween(end, start) > RECORDING_GAP_METERS) gapCount++;
  }
  return {
    distanceMeters: Math.round(distanceMeters),
    pointCount,
    segmentCount: segments.length,
    gapCount,
    modes,
    firstAt: segments[0]?.startedAt ?? null,
    lastAt: segments[segments.length - 1]?.endedAt ?? null,
  };
}
