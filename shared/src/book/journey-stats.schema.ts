import { z } from 'zod';

/**
 * What a journey adds up to.
 *
 * The figures a travel book puts on a page — how far, how long, how many
 * countries, which way round — and they are not stored anywhere. They are
 * derived from the trips the user added to the journey: the places on those
 * trips carry coordinates, the trips carry dates, and the journey carries the
 * entries and the photographs.
 *
 * Computed on the server rather than in Studio for one reason that settles it:
 * a place's country is a point-in-polygon test against the bundled admin-0
 * boundaries, and those are 4MB gzipped. The server already holds them and
 * already caches the answer per place in `place_regions` for Atlas. Sending the
 * boundaries to the browser so it can repeat work the server has done would be
 * the wrong trade twice over.
 *
 * Distance is the sum of great-circle hops along the route, in metres. Not
 * driving distance: there is no routing engine here, the places are not
 * necessarily connected by road, and a book that claims a road distance it did
 * not measure is worse than one that says "as the crow flies". Metres because
 * miles and kilometres are a display choice, and rounding at the source would
 * bake one of them in.
 */

export const journeyStatsPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** The place or entry name, for a map that labels its stops. */
  label: z.string(),
  /** ISO date, when the stop has one. Orders the route. */
  date: z.string().nullable(),
  /** ISO-3166-1 alpha-2, resolved from the coordinates. */
  country: z.string().length(2).nullable(),
  /**
   * Which trip this stop belongs to, when the journey knows.
   *
   * A journey is a collection of trips, and a book of one is not always a book
   * of all of them: three countries over two trips printed as a single route
   * draws a line between the last stop of one and the first of the next, which
   * is a journey nobody made. With the trip on every point, Studio can offer a
   * map per trip as well as a map of the whole thing, and the line stops where
   * the trip stopped.
   *
   * Null for a stop that came from an entry nobody linked to a trip.
   */
  tripId: z.number().int().positive().nullable().default(null),
  /**
   * One representative photograph from this stop, when it has one.
   *
   * For a map that marks its stops with pictures rather than with dots. Null is
   * the ordinary case rather than a failure — a printed route with a few plain
   * dots between the photographs reads correctly, and it is what a stop nobody
   * photographed honestly is.
   */
  photoId: z.number().int().positive().nullable().default(null),
});
export type JourneyStatsPoint = z.infer<typeof journeyStatsPointSchema>;

/**
 * The trips behind a journey, named.
 *
 * Only what a panel needs to offer a choice: which trips there are, what they
 * are called, and when they ran. Ordered the way the journey reads, by start
 * date, because `journey_trips` has carried no order of its own since the
 * column was dropped in migration 87.
 */
export const journeyStatsTripSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  /** How many of the route's stops fall on this trip. */
  points: z.number().int().nonnegative(),
});
export type JourneyStatsTrip = z.infer<typeof journeyStatsTripSchema>;

export const journeyStatsCountrySchema = z.object({
  code: z.string().length(2),
  /** English name. The client translates where it has a translation. */
  name: z.string(),
  /** How many stops fell inside it — enough to order countries by weight. */
  places: z.number().int().nonnegative(),
  /** ISO date of the first stop there, for ordering the list as travelled. */
  firstVisit: z.string().nullable(),
});
export type JourneyStatsCountry = z.infer<typeof journeyStatsCountrySchema>;

export const journeyStatsSchema = z.object({
  journeyId: z.number().int().positive(),
  /** Great-circle metres along the route, in order. */
  distance: z.number().nonnegative(),
  /**
   * Calendar days the journey spans, first stop to last, inclusive — a one-day
   * trip is 1 day, not 0. Falls back to the trips' own dates when the entries
   * carry none.
   */
  days: z.number().int().nonnegative(),
  /** Journey entries — what Polarsteps calls a step. */
  steps: z.number().int().nonnegative(),
  /** Photographs in the journey, entries and gallery together. */
  photos: z.number().int().nonnegative(),
  /** Places across every trip added to the journey. */
  places: z.number().int().nonnegative(),
  /** Metres from the first stop to the one furthest from it. */
  furthest: z.number().nonnegative(),
  /** In visit order. */
  countries: z.array(journeyStatsCountrySchema).max(200),
  /** The route, in order, capped at what a printed line can resolve. */
  points: z.array(journeyStatsPointSchema).max(400),
  /** The trips this journey is made of, for a map of one of them. */
  trips: z.array(journeyStatsTripSchema).max(200).default([]),
  /** ISO dates, null when nothing in the journey is dated. */
  start: z.string().nullable(),
  end: z.string().nullable(),
});
export type JourneyStats = z.infer<typeof journeyStatsSchema>;
