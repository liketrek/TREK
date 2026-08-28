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

/**
 * Someone who is on the trip.
 *
 * Display name only. Ids would let a consumer correlate the same person across
 * instances, and email addresses have no business leaving TREK over an
 * integration key — the name is what a traveller already sees on the trip.
 */
export const publicApiTravellerSchema = z.object({
  name: z.string(),
  /** True for the trip's owner; everyone else joined as a member. */
  owner: z.boolean(),
});
export type PublicApiTraveller = z.infer<typeof publicApiTravellerSchema>;

/**
 * An entry on the traveller's bucket list: somewhere they want to go, with no
 * trip attached yet.
 *
 * Lives on the user rather than on a trip, which is why it has its own endpoint
 * rather than an `include`. It is the one part of TREK that is explicitly about
 * places not yet visited, so a consumer that knows where someone actually went
 * can tell them they got there.
 */
export const publicApiBucketListItemSchema = z.object({
  name: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** ISO 3166-1 alpha-2, when the entry is pinned to a country. */
  country_code: z.string().nullable(),
  notes: z.string().nullable(),
  /** An optional date the traveller is aiming for. Not a booking. */
  target_date: z.string().nullable(),
});
export type PublicApiBucketListItem = z.infer<typeof publicApiBucketListItemSchema>;

export const publicApiBucketListSchema = z.object({
  items: z.array(publicApiBucketListItemSchema),
});
export type PublicApiBucketList = z.infer<typeof publicApiBucketListSchema>;

/** Trip without its itinerary — what the list endpoint returns. */
export const publicApiTripSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  currency: z.string().nullable(),
  archived: z.boolean(),
  /**
   * When the trip's own fields last changed — title, dates, currency, cover.
   *
   * Explicitly NOT a content timestamp: editing a place, a day or a note does not
   * touch it, because the child tables carry no `updated_at` of their own. A client
   * that polls must compare the payload it received, not this value; using it to
   * skip a fetch would silently miss every itinerary edit.
   */
  updated_at: z.string().nullable(),
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
  travellers: z.array(publicApiTravellerSchema).optional(),
  /**
   * Places on the trip that sit on no day yet — the shortlist a traveller
   * collects before deciding when to go where.
   *
   * Comes with `include=places`, because a section called "places" that silently
   * omitted half of them would be worse than one that did not exist. On a real
   * instance these are routinely half of a trip's places, and they carry the
   * coordinates that make them worth matching against.
   */
  unplanned_places: z.array(publicApiPlaceSchema).optional(),
  /**
   * Bookings not pinned to a day. A reservation keeps its `day_id` as a nullable
   * reference, and deleting a day sets it null rather than deleting the booking,
   * so these exist in the wild and are not an edge case.
   *
   * Comes with `include=reservations`, for the same reason as above.
   */
  unscheduled_reservations: z.array(publicApiReservationSchema).optional(),
});
export type PublicApiTrip = z.infer<typeof publicApiTripSchema>;

/**
 * The sections a caller may ask for. Defaults to everything, because the common
 * case is a full sync; a consumer that only wants notes says so and gets a payload
 * a fraction of the size.
 */
export const PUBLIC_API_INCLUDES = ['days', 'places', 'notes', 'reservations', 'accommodations', 'travellers'] as const;
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

/**
 * The trip the traveller most recently took, for a dashboard that wants to name it.
 *
 * "Most recently took" means started, not created: a trip booked for next year is
 * not what anybody means by their last trip. A user whose trips are all in the
 * future therefore gets `null` here rather than a trip they have not been on.
 */
export const publicApiLastTripSchema = z.object({
  title: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  /**
   * ISO-3166-1 alpha-2 of the country the trip mostly took place in — the one a
   * widget shows when it has room for exactly one. Null when no place on the trip
   * ever resolved to a country, which is normal for a trip jotted down without
   * geocoded stops.
   */
  country: z.string().nullable(),
  /**
   * Every country the trip touched, most-visited first. `country` is this list's
   * head; a multi-country trip is not lossy here.
   */
  countries: z.array(z.string()),
});
export type PublicApiLastTrip = z.infer<typeof publicApiLastTripSchema>;

/**
 * Aggregate counts for a dashboard widget (#1367) — Homepage's `customapi` and
 * anything else that renders a handful of numbers and cannot aggregate a list
 * itself.
 *
 * Scalars rather than the arrays behind them. `GET /api/v1/trips` already hands
 * out the rows for a consumer that wants to count its own way; this endpoint
 * exists for the one that wants a number and a single HTTP request.
 *
 * The figures are the ones TREK's own dashboard shows, computed from the same
 * source, so a widget cannot disagree with the passport card sitting next to it.
 * That is the whole reason this is not a fresh count over `/trips`: "visited
 * countries" carries years of accumulated rules — countries reached only by a
 * flight, layovers that do not count as visited, countries the user hid by hand —
 * and a second implementation would drift from the first the week after it shipped.
 */
export const publicApiStatsSchema = z.object({
  /** Trips the caller owns or is a member of, archived ones included. */
  total_trips: z.number(),
  /** Distinct countries counted as visited. */
  total_countries: z.number(),
  /** Distinct cities, derived from place addresses. */
  total_cities: z.number(),
  total_places: z.number(),
  /** Days across all trips, not days travelled. */
  total_days: z.number(),
  /** Flown distance, summed over non-cancelled flight bookings. Kilometres. */
  total_distance_km: z.number(),
  last_trip: publicApiLastTripSchema.nullable(),
});
export type PublicApiStats = z.infer<typeof publicApiStatsSchema>;
