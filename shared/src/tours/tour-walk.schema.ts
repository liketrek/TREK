import { STATION_IMPORTANCES, stationKeySchema, TOUR_STATION_NAME_MAX } from './tours.schema';

import { z } from 'zod';

/**
 * CW-03: how far a city walk got on one of its days. A visit belongs to the
 * walk's place on that day (its day assignment), never to the walk itself, so
 * the same walk on another day, or a copy, starts with nothing visited. A
 * station without a row is still planned.
 */
export const TOUR_VISIT_STATUSES = ['visited', 'skipped'] as const;
export const tourVisitStatusSchema = z.enum(TOUR_VISIT_STATUSES);
export type TourVisitStatus = z.infer<typeof tourVisitStatusSchema>;

export const tourVisitSchema = z.object({
  assignment_id: z.number().int().positive(),
  station_key: stationKeySchema,
  status: tourVisitStatusSchema,
});
export type TourVisit = z.infer<typeof tourVisitSchema>;

export const tourVisitListResponseSchema = z.object({ visits: z.array(tourVisitSchema) });
export type TourVisitListResponse = z.infer<typeof tourVisitListResponseSchema>;

/** Planned takes a station back to where it started: nothing visited, nothing skipped. */
export const tourVisitUpdateRequestSchema = z.object({ status: z.enum(['planned', ...TOUR_VISIT_STATUSES]) }).strict();
export type TourVisitUpdateRequest = z.infer<typeof tourVisitUpdateRequestSchema>;

/**
 * CW-06, CW-07: a Google Maps walking route shared as a link, read into the
 * stations of a city walk. Only links Google marks as on foot are taken; the
 * way between the stations is TREK's own, planned afresh.
 *
 * The link is long on purpose: a route of ten stops with their names and the
 * data Google adds runs past two thousand characters.
 */
export const WALK_IMPORT_URL_MAX = 8192;
/** The most stops one link may bring; Google Maps itself takes ten. */
export const WALK_IMPORT_STATIONS_MAX = 30;
export const walkImportPreviewRequestSchema = z
  .object({ url: z.string().trim().min(1).max(WALK_IMPORT_URL_MAX) })
  .strict();
export type WalkImportPreviewRequest = z.infer<typeof walkImportPreviewRequestSchema>;

/** A stop as the link names it; a stop without coordinates in the link is not guessed at. */
export const walkImportStationSchema = z.object({
  name: z.string().max(TOUR_STATION_NAME_MAX).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
});
export type WalkImportStation = z.infer<typeof walkImportStationSchema>;

export const walkImportPreviewResponseSchema = z.object({
  stations: z.array(walkImportStationSchema).min(2).max(WALK_IMPORT_STATIONS_MAX),
  /** The link as it was read, after its short form was followed. */
  resolved_url: z.string().url(),
});
export type WalkImportPreviewResponse = z.infer<typeof walkImportPreviewResponseSchema>;

/** Why a link was not read, for the dialog to say in the reader's language. */
export const WALK_IMPORT_REFUSALS = [
  'not_google_maps',
  'not_a_route',
  'not_walking',
  'mode_unknown',
  'short_link_refused',
  'short_link_failed',
  'short_link_unknown',
  'too_few_stops',
  'too_many_stops',
] as const;
export const walkImportRefusalSchema = z.enum(WALK_IMPORT_REFUSALS);
export type WalkImportRefusal = z.infer<typeof walkImportRefusalSchema>;

/** The body of a refusal: the English text for API and MCP clients, and its reason. */
export const walkImportRefusalResponseSchema = z.object({ error: z.string(), reason: walkImportRefusalSchema });

/**
 * CW-13: a station of a walk as the remaining time names it: its place in the
 * walk's order, its key (null for one saved before keys) and its name.
 */
export const walkStationRefSchema = z.object({
  position: z.number().int().positive(),
  key: stationKeySchema.nullable(),
  name: z.string().nullable(),
});
export type WalkStationRef = z.infer<typeof walkStationRefSchema>;

/** Why the remaining walking time is not known: no stations, no line yet, no walking time, or no clear progress. */
export const WALK_REMAINDER_GAPS = ['no_stations', 'route_pending', 'no_walking_time', 'progress_ambiguous'] as const;
export const walkRemainderGapSchema = z.enum(WALK_REMAINDER_GAPS);
export type WalkRemainderGap = z.infer<typeof walkRemainderGapSchema>;

const minutesSchema = z.number().int().nonnegative();

/**
 * CW-13: what is left of a city walk on one of its days, worked out from the
 * stations checked off that day and the saved line. The reference is the last
 * station visited, or the start before any is: a status says what was done,
 * never where the travellers are now. Walking time and stays stay apart.
 */
export const walkRemainderSchema = z.object({
  reference: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('start') }),
    z.object({ kind: z.literal('last_visited'), station: walkStationRefSchema }),
    /** A station still planned before the last one visited: where the walk is cannot be told. */
    z.object({
      kind: z.literal('ambiguous'),
      last_visited: walkStationRefSchema,
      open_before: z.array(walkStationRefSchema),
    }),
  ]),
  live_position: z.literal(false),
  finished: z.boolean(),
  walking: z.object({
    /** The walking time of the whole walk as saved. */
    total_minutes: minutesSchema.nullable(),
    remaining_minutes: minutesSchema.nullable(),
    unknown_because: walkRemainderGapSchema.nullable(),
    /** A station ahead was skipped: the saved line still leads through it, so the time is at most this. */
    upper_bound: z.boolean(),
    skipped_ahead: z.array(walkStationRefSchema),
    /** The part of it from the last station to the end of the line, a loop's way back to its start. */
    after_last_station_minutes: minutesSchema.nullable(),
  }),
  stays: z.object({
    /** The stays of the open stations as far as entered; a visited station's stay counts as done. */
    remaining_known_minutes: minutesSchema,
    unknown: z.array(walkStationRefSchema),
    /** Of the known minutes, those of optional stations. */
    optional_known_minutes: minutesSchema,
  }),
  open_stations: z.array(
    walkStationRefSchema.extend({
      importance: z.enum(['normal', ...STATION_IMPORTANCES]),
      stay_minutes: minutesSchema.nullable(),
      /** The walking time from the reference to it along the saved line; null where the remaining time is not known. */
      walk_minutes_from_reference: minutesSchema.nullable(),
    }),
  ),
});
export type WalkRemainder = z.infer<typeof walkRemainderSchema>;
