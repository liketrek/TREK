import { z } from 'zod';

/**
 * Public API v1 contract — the read-only surface third-party integrations bind to.
 *
 * Everything else in TREK's REST surface is internal: it answers a session cookie,
 * carries no version, and changes whenever the client changes. This is the opposite
 * promise. Once an integration ships against `/api/v1`, these shapes are a contract,
 * so the rules are: fields may be added, never removed or retyped, and a breaking
 * change gets a new version rather than an edit here.
 *
 * The shapes are deliberately NOT the internal row types. A row carries ids, foreign
 * keys and storage details a consumer has no business depending on (`order_index`,
 * `assignment_id`, the accommodation's `place_id`); those are resolved here instead,
 * so the payload survives a refactor of the tables underneath.
 *
 * Every dated thing carries `date` in ISO `YYYY-MM-DD`. That is the join key for a
 * consumer that keeps its own notion of a trip — location trackers bucket points by
 * day, and matching on a date is the only thing both sides can agree on without
 * sharing ids.
 */

/** A place as it sits on a day, with the day's ordering already applied. */
export const publicApiPlaceSchema = z.object({
  name: z.string(),
  address: z.string().nullable(),
  /** Null for a place the user never geocoded — plenty of them exist. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** `HH:MM`, null when the stop is not pinned to a time. */
  time: z.string().nullable(),
  end_time: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  /** How the traveller reaches this stop from the previous one. */
  transport_mode: z.string().nullable(),
});
export type PublicApiPlace = z.infer<typeof publicApiPlaceSchema>;

/** A free-text note pinned to a day, optionally to a time within it. */
export const publicApiDayNoteSchema = z.object({
  text: z.string(),
  time: z.string().nullable(),
});
export type PublicApiDayNote = z.infer<typeof publicApiDayNoteSchema>;

/**
 * A booking. `type` is TREK's own vocabulary (flight, train, restaurant, …) and is
 * passed through unmapped: inventing a canonical enum here would silently drop the
 * types a consumer might actually care about.
 */
export const publicApiReservationSchema = z.object({
  type: z.string().nullable(),
  title: z.string().nullable(),
  location: z.string().nullable(),
  /** ISO timestamp or `HH:MM`, exactly as the user entered it. */
  time: z.string().nullable(),
  end_time: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
});
export type PublicApiReservation = z.infer<typeof publicApiReservationSchema>;

/**
 * Where the traveller sleeps. Spans days, so it is reported once at trip level with
 * its own date range rather than duplicated onto every night it covers.
 */
export const publicApiAccommodationSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** First and last night as ISO dates, resolved from the start/end day rows. */
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  check_in: z.string().nullable(),
  check_out: z.string().nullable(),
  notes: z.string().nullable(),
});
export type PublicApiAccommodation = z.infer<typeof publicApiAccommodationSchema>;

/** One day of the itinerary. `date` is the join key for consumers. */
export const publicApiDaySchema = z.object({
  date: z.string(),
  day_number: z.number(),
  title: z.string().nullable(),
  notes: z.string().nullable(),
  places: z.array(publicApiPlaceSchema),
  day_notes: z.array(publicApiDayNoteSchema),
  reservations: z.array(publicApiReservationSchema),
});
export type PublicApiDay = z.infer<typeof publicApiDaySchema>;

/** Trip without its itinerary — what the list endpoint returns. */
export const publicApiTripSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  currency: z.string().nullable(),
  archived: z.boolean(),
});
export type PublicApiTripSummary = z.infer<typeof publicApiTripSummarySchema>;

/**
 * A whole trip. The `days`, `accommodations` and per-day sections are present only
 * when the caller asked for them via `include`; an omitted section is absent rather
 * than empty, so a consumer can tell "not requested" from "nothing there".
 */
export const publicApiTripSchema = publicApiTripSummarySchema.extend({
  days: z.array(publicApiDaySchema).optional(),
  accommodations: z.array(publicApiAccommodationSchema).optional(),
});
export type PublicApiTrip = z.infer<typeof publicApiTripSchema>;

/**
 * The sections a caller may ask for. Defaults to everything, because the common
 * case is a full sync; a consumer that only wants notes says so and gets a payload
 * a fraction of the size.
 */
export const PUBLIC_API_INCLUDES = ['days', 'places', 'notes', 'reservations', 'accommodations'] as const;
export type PublicApiInclude = (typeof PUBLIC_API_INCLUDES)[number];

/**
 * `?include=days,notes` — comma-separated, unknown values rejected rather than
 * ignored, so a typo surfaces as a 400 instead of a silently missing section.
 * Absent means all sections.
 */
export const publicApiIncludeQuerySchema = z
  .string()
  .transform((raw) => raw.split(',').map((part) => part.trim()).filter(Boolean))
  .pipe(z.array(z.enum(PUBLIC_API_INCLUDES)).min(1));

export const publicApiTripListSchema = z.object({
  trips: z.array(publicApiTripSummarySchema),
});
export type PublicApiTripList = z.infer<typeof publicApiTripListSchema>;
