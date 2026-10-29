import { z } from 'zod';

/**
 * POST /api/routing/valhalla/:action: the TREK services' Valhalla, asked
 * through this server so the installation key never reaches a browser. The
 * bodies are Valhalla's own, narrowed to what TREK asks: the planner in the
 * browser and the road trip router on the server send exactly these.
 */

/** Which Valhalla an instance asks: the public FOSSGIS one, the TREK services' one, or an own one. */
export const valhallaProviderSchema = z.enum(['fossgis', 'trek', 'custom']);
export type ValhallaProvider = z.infer<typeof valhallaProviderSchema>;

export const valhallaRelayActionSchema = z.enum(['route', 'trace_attributes', 'height']);
export type ValhallaRelayAction = z.infer<typeof valhallaRelayActionSchema>;

/** The largest body the relay takes, in bytes of its JSON. */
export const VALHALLA_RELAY_MAX_BODY_BYTES = 64 * 1024;
/** Locations one route may carry: the TREK Valhalla allows twenty for every costing TREK asks. */
export const VALHALLA_RELAY_MAX_LOCATIONS = 20;
/** Points of a line a description may carry, as many as the planner thins a line to. */
export const VALHALLA_RELAY_MAX_TRACE_POINTS = 4000;
/** Points one height question may carry: the planner asks 500 at a time. */
export const VALHALLA_RELAY_MAX_HEIGHT_POINTS = 1000;
/** Alternate ways one route may ask for besides its own. */
export const VALHALLA_RELAY_MAX_ALTERNATES = 5;

const point = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const costingSchema = z.enum(['auto', 'pedestrian', 'bicycle']);

const optionName = z.string().min(1).max(64);
/** Per costing, its weightings and switches by name: a number, a word or a flag. */
const costingOptionsSchema = z.record(
  optionName,
  z.record(optionName, z.union([z.number(), z.string().max(64), z.boolean()])),
);

/** The UTF-8 length of the body's JSON: every escape encodeURIComponent writes stands for one byte. */
function relayBytes(body: unknown): number {
  return encodeURIComponent(JSON.stringify(body)).replace(/%[\dA-F]{2}/g, '_').length;
}

const withinRelayBytes = {
  check: (body: unknown) => relayBytes(body) <= VALHALLA_RELAY_MAX_BODY_BYTES,
  message: `The request is larger than ${VALHALLA_RELAY_MAX_BODY_BYTES / 1024} KB`,
};

const locationSchema = point.extend({
  radius: z.number().int().min(0).max(1000).optional(),
  search_filter: z.object({ exclude_ferry: z.boolean().optional() }).optional(),
});

export const valhallaRouteRequestSchema = z
  .object({
    locations: z.array(locationSchema).min(2).max(VALHALLA_RELAY_MAX_LOCATIONS),
    costing: costingSchema,
    costing_options: costingOptionsSchema.optional(),
    directions_options: z.object({ units: z.enum(['kilometers', 'miles']).optional() }).optional(),
    alternates: z.number().int().min(0).max(VALHALLA_RELAY_MAX_ALTERNATES).optional(),
  })
  .refine(withinRelayBytes.check, withinRelayBytes.message);
export type ValhallaRouteRequest = z.infer<typeof valhallaRouteRequestSchema>;

/** A line described either point by point or as Valhalla's polyline of precision 6, never both. */
export const valhallaTraceRequestSchema = z
  .object({
    shape: z.array(point).min(2).max(VALHALLA_RELAY_MAX_TRACE_POINTS).optional(),
    encoded_polyline: z.string().min(1).max(VALHALLA_RELAY_MAX_BODY_BYTES).optional(),
    costing: costingSchema,
    costing_options: costingOptionsSchema.optional(),
    shape_match: z.enum(['map_snap', 'walk_or_snap', 'edge_walk']).optional(),
    filters: z
      .object({
        attributes: z.array(z.string().min(1).max(64)).max(40),
        action: z.enum(['include', 'exclude']),
      })
      .optional(),
  })
  .refine((body) => (body.shape === undefined) !== (body.encoded_polyline === undefined), {
    message: 'Send the line as shape or as encoded_polyline',
  })
  .refine(withinRelayBytes.check, withinRelayBytes.message);
export type ValhallaTraceRequest = z.infer<typeof valhallaTraceRequestSchema>;

export const valhallaHeightRequestSchema = z
  .object({
    shape: z.array(point).min(1).max(VALHALLA_RELAY_MAX_HEIGHT_POINTS),
    range: z.boolean().optional(),
  })
  .refine(withinRelayBytes.check, withinRelayBytes.message);
export type ValhallaHeightRequest = z.infer<typeof valhallaHeightRequestSchema>;

export const VALHALLA_RELAY_REQUEST_SCHEMAS = {
  route: valhallaRouteRequestSchema,
  trace_attributes: valhallaTraceRequestSchema,
  height: valhallaHeightRequestSchema,
} as const satisfies Record<ValhallaRelayAction, z.ZodType>;
