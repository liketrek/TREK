import { paddleBoatTypeSchema, paddleLakeStyleSchema } from '../tours/tours.schema';

import { z } from 'zod';

/**
 * PAD-11: routing on the water. TREK builds a water network of its own from
 * the same OpenStreetMap extracts the paddle obstacles come from, and plans a
 * paddle tour's legs on it: rivers and canals along their centre lines, lakes
 * across the water with a margin to the shore, and short portages where a
 * weir, a dam or a closed stretch bars the way. Nothing is joined by a
 * straight line in secret: a stretch the data cannot connect fails with the
 * place it fails at, and a short gap the router bridges says so.
 */

export const paddleRoutePointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});
export type PaddleRoutePoint = z.infer<typeof paddleRoutePointSchema>;

/** What a lock on the way means: going through it, carrying round it, or whichever is quicker. */
export const paddleLockPolicySchema = z.enum(['auto', 'use', 'portage']);
export type PaddleLockPolicy = z.infer<typeof paddleLockPolicySchema>;

/** The most legs one request plans; a tour with more asks again. */
export const MAX_PADDLE_ROUTE_LEGS = 40;

export const paddleRouteRequestSchema = z.object({
  legs: z
    .array(z.object({ from: paddleRoutePointSchema, to: paddleRoutePointSchema }))
    .min(1)
    .max(MAX_PADDLE_ROUTE_LEGS),
  boat: paddleBoatTypeSchema.default('kayak'),
  lake_style: paddleLakeStyleSchema.default('direct'),
  lock_policy: paddleLockPolicySchema.default('auto'),
});
export type PaddleRouteRequest = z.infer<typeof paddleRouteRequestSchema>;
export type PaddleRouteInput = z.input<typeof paddleRouteRequestSchema>;

/**
 * The stretches of a routed leg, by index into its geometry: paddled on a
 * river or canal, across a lake, down whitewater (a stretch OSM grades), through
 * a boat pass beside a weir, carried as a portage, through a lock, or a short
 * gap in the data the router bridged.
 */
export const paddleRouteSegmentKindSchema = z.enum(['water', 'lake', 'rapids', 'pass', 'portage', 'lock', 'gap']);
export type PaddleRouteSegmentKind = z.infer<typeof paddleRouteSegmentKindSchema>;

/** Where a portage's line came from: a portage way mapped in OSM, a footpath, or drawn straight by the router. */
export const paddlePortageSourceSchema = z.enum(['tagged', 'footway', 'inferred']);
export type PaddlePortageSource = z.infer<typeof paddlePortageSourceSchema>;

export const paddleRouteSegmentSchema = z.object({
  kind: paddleRouteSegmentKindSchema,
  /** First and last index into the leg's geometry, both included. */
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
  /** The water's, the lock's or the barrier's name, where OSM gives one. */
  name: z.string().nullable(),
  /** A portage's origin; null for every other kind. */
  source: paddlePortageSourceSchema.nullable(),
  /** The OSM object behind a portage's barrier or a lock, `way/123` style. */
  osm_ref: z.string().nullable(),
  /** A whitewater stretch's grade (1 to 6); null for every other kind. */
  grade: z.number().int().min(1).max(6).nullable(),
});
export type PaddleRouteSegment = z.infer<typeof paddleRouteSegmentSchema>;

export const paddleRouteFailureCodeSchema = z.enum([
  /** A point lies farther from any water the network knows than the router reaches. */
  'not_on_water',
  /** No region with a water network covers the point. */
  'no_region',
  /** The region's network is being built; asked again shortly it may answer. */
  'building',
  /** Both ends are on water, but no way over water (and short portages) joins them. */
  'no_water_path',
  /** The ends lie in two regions that do not share the stretch between them. */
  'cross_region',
  'busy',
  'timeout',
]);
export type PaddleRouteFailureCode = z.infer<typeof paddleRouteFailureCodeSchema>;

export const paddleRouteLegSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    /** [lat, lng] from the leg's start to its end, on the water. */
    geometry: z.array(z.tuple([z.number(), z.number()])).min(2),
    segments: z.array(paddleRouteSegmentSchema).min(1),
    distance_m: z.number().nonnegative(),
    /** How far the ends were moved onto the water, in metres. */
    snapped_m: z.object({ from: z.number().nonnegative(), to: z.number().nonnegative() }),
  }),
  z.object({
    status: z.literal('failed'),
    code: paddleRouteFailureCodeSchema,
    /** Where it failed: the point off the water, or the nearest water to it. */
    at: paddleRoutePointSchema.nullable(),
  }),
]);
export type PaddleRouteLeg = z.infer<typeof paddleRouteLegSchema>;

export const paddleRouteResponseSchema = z.object({
  legs: z.array(paddleRouteLegSchema),
  /** The data the legs were planned on, per region used; a newer one may plan them differently. */
  graph_rev: z.string().nullable(),
});
export type PaddleRouteResponse = z.infer<typeof paddleRouteResponseSchema>;
