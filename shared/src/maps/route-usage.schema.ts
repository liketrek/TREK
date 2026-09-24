import { z } from 'zod';

/**
 * Route usage counters — how much routing this instance actually does.
 *
 * The question behind them is whether TREK could host its own router. Today every
 * route is calculated in the browser against the public FOSSGIS hosts, so nobody
 * has a number: not how many requests a real trip costs, not how they split
 * between the day plan and the road trip mode, not how many already go to a
 * self-hosted engine. Deciding on a hosted router without that number would be
 * guessing at the bill.
 *
 * Counters, not a log. A row is a day, a profile and a surface with totals on it —
 * there is no query, no coordinate, no route, no user, no trip and no session. The
 * only thing recorded about a request is that it happened, what kind it was, and
 * how big it was. Nothing here leaves the instance on its own: the totals sit in
 * that instance's own database and its own admin reads them.
 *
 * Reported in batches rather than per request. A counter that costs a network call
 * of its own would measure load by adding it.
 */

/** The three OSRM profiles TREK asks for, plus a bucket for a routing plugin. */
export const routeUsageProfileSchema = z.enum(['driving', 'walking', 'cycling', 'other']);
export type RouteUsageProfile = z.infer<typeof routeUsageProfileSchema>;

/**
 * What kind of request it was, named after the call that made it rather than after
 * the screen it came from: the day plan and road trip mode share `legs`, so a screen
 * label would have to be threaded through every caller to be true. The split still
 * carries the hosting question, because the kinds cost very different amounts —
 * `legs` is one request for a whole chain, `alternatives` asks two or three times
 * over for a single leg.
 */
export const routeUsageSurfaceSchema = z.enum(['route', 'segments', 'legs', 'alternatives', 'other']);
export type RouteUsageSurface = z.infer<typeof routeUsageSurfaceSchema>;

export const routeUsageEntrySchema = z.object({
  profile: routeUsageProfileSchema,
  surface: routeUsageSurfaceSchema,
  /** True when the instance points at its own engine, so its load is already local. */
  selfHosted: z.boolean(),
  /** Requests in this batch. Capped well above any plausible batch. */
  requests: z.number().int().min(1).max(10_000),
  /** Waypoints handed over in total, which is what a per-request limit binds on. */
  waypoints: z.number().int().min(0).max(1_000_000),
  /** Routed distance in kilometres, summed. Rounded to whole kilometres. */
  km: z.number().min(0).max(10_000_000),
  /** How many of them came back with no route at all. */
  failed: z.number().int().min(0).max(10_000),
});
export type RouteUsageEntry = z.infer<typeof routeUsageEntrySchema>;

export const routeUsageReportRequestSchema = z.object({
  entries: z.array(routeUsageEntrySchema).min(1).max(40),
});
export type RouteUsageReportRequest = z.infer<typeof routeUsageReportRequestSchema>;

/** Answered even when counting is switched off, so the client never has to care. */
export const routeUsageReportResultSchema = z.object({
  recorded: z.boolean(),
});
export type RouteUsageReportResult = z.infer<typeof routeUsageReportResultSchema>;

export const routeUsageDayRowSchema = z.object({
  day: z.string(),
  profile: routeUsageProfileSchema,
  surface: routeUsageSurfaceSchema,
  selfHosted: z.boolean(),
  requests: z.number().int(),
  waypoints: z.number().int(),
  km: z.number(),
  failed: z.number().int(),
});
export type RouteUsageDayRow = z.infer<typeof routeUsageDayRowSchema>;

export const routeUsageSummaryResultSchema = z.object({
  enabled: z.boolean(),
  /** Days a row survives. Aggregates are tiny, so this is far longer than a log's. */
  retentionDays: z.number().int(),
  /** Days that have any counter at all, which is what the averages divide by. */
  daysCovered: z.number().int(),
  firstDay: z.string().nullable(),
  lastDay: z.string().nullable(),
  totalRequests: z.number().int(),
  totalFailed: z.number().int(),
  /** The headline for the hosting question: requests on an average counted day. */
  requestsPerDay: z.number(),
  /** Busiest single day, because a router has to survive the peak, not the mean. */
  busiestDay: z.string().nullable(),
  busiestDayRequests: z.number().int(),
  /** Mean waypoints per request: the figure a 10-waypoint API limit binds on. */
  waypointsPerRequest: z.number(),
  /** Mean routed kilometres per request, against a 1500 km limit. */
  kmPerRequest: z.number(),
  byProfile: z.array(z.object({ profile: routeUsageProfileSchema, requests: z.number().int() })),
  bySurface: z.array(z.object({ surface: routeUsageSurfaceSchema, requests: z.number().int() })),
  /** How much of the load already goes to an engine the operator runs. */
  selfHostedShare: z.number(),
  /** The counted days themselves, newest first, for a chart or an export. */
  days: z.array(z.object({ day: z.string(), requests: z.number().int() })),
});
export type RouteUsageSummaryResult = z.infer<typeof routeUsageSummaryResultSchema>;
