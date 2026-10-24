import { paddleRoutePointSchema } from './paddle-route.schema';

import { z } from 'zod';

/**
 * PAD-05A, the admin side: the regions TREK reads paddle data for. Each is
 * one of Geofabrik's regional OpenStreetMap extracts, chosen by its id there
 * (`oberpfalz`, `us/california`); TREK downloads it, reads the paddle objects
 * out and keeps nothing else of it. A region is read again every month.
 */

export const paddleRegionStatusSchema = z.enum(['queued', 'importing', 'ready', 'failed']);
export type PaddleRegionStatus = z.infer<typeof paddleRegionStatusSchema>;

/** PAD-11: what a region's water network holds, as the build counted it. */
export const paddleRegionGraphStatsSchema = z.object({
  /** Kilometres of river and canal the router can follow. */
  water_km: z.number().nonnegative(),
  lakes: z.number().int().nonnegative(),
  portages: z.number().int().nonnegative(),
  /** Barriers the router found no mapped portage for, only a short straight carry. */
  inferred_portages: z.number().int().nonnegative(),
  /** Short gaps between waters the router bridges, marked as such. */
  gaps: z.number().int().nonnegative(),
  locks: z.number().int().nonnegative(),
});
export type PaddleRegionGraphStats = z.infer<typeof paddleRegionGraphStatsSchema>;

/** How far a read has come: the download, the reading of the file, the build of its network, each with the share done (null while unknown). */
export const paddleRegionProgressSchema = z.object({
  phase: z.enum(['download', 'read', 'build']),
  fraction: z.number().min(0).max(1).nullable(),
});
export type PaddleRegionProgress = z.infer<typeof paddleRegionProgressSchema>;

/** Who added a region: an admin by hand, or TREK itself for a paddler planning there (PAD-11C). */
export const paddleRegionOriginSchema = z.enum(['admin', 'auto']);
export type PaddleRegionOrigin = z.infer<typeof paddleRegionOriginSchema>;

export const paddleRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: paddleRegionStatusSchema,
  origin: paddleRegionOriginSchema,
  /** The date the region's data is current to, ISO 8601; null before the first read. */
  source_timestamp: z.string().nullable(),
  /** When TREK last read it, ISO 8601. */
  imported_at: z.string().nullable(),
  feature_count: z.number().int(),
  /** Why the last read failed, as plain text; null otherwise. */
  error: z.string().nullable(),
  /**
   * How far the read under way has come: the download, then the reading of
   * the file and the build of its network, each with the share done.
   * Null unless the region is being read.
   */
  progress: paddleRegionProgressSchema.nullable(),
  /**
   * PAD-11: the water network built from the same read, for routing: how big
   * it came out and what the data left open. Null before the first build.
   */
  network: paddleRegionGraphStatsSchema
    .extend({
      /** When the network was built, ISO 8601. */
      built_at: z.string(),
      /** The size of its file. */
      bytes: z.number().int().nonnegative(),
    })
    .nullable(),
});
export type PaddleRegion = z.infer<typeof paddleRegionSchema>;

/**
 * PAD-11C: how TREK gets the water data of a place a paddler plans in, when
 * no region covers it yet. `auto` adds the smallest of Geofabrik's regions
 * around it by itself, up to `max_mb` and a few a day; what is larger, or past
 * the day's few, waits for an admin as a request. `ask` sends every such
 * place to an admin as a request, `off` neither loads nor asks.
 */
export const paddleRegionAutoModeSchema = z.enum(['auto', 'ask', 'off']);
export type PaddleRegionAutoMode = z.infer<typeof paddleRegionAutoModeSchema>;

export const PADDLE_AUTO_MAX_MB = { min: 10, max: 4096, default: 500 } as const;
/** How many regions TREK adds by itself in one day (UTC); more wait for an admin. */
export const PADDLE_AUTO_REGIONS_PER_DAY = 5;

export const paddleRegionSettingsSchema = z.object({
  mode: paddleRegionAutoModeSchema,
  max_mb: z.number().int().min(PADDLE_AUTO_MAX_MB.min).max(PADDLE_AUTO_MAX_MB.max),
});
export type PaddleRegionSettings = z.infer<typeof paddleRegionSettingsSchema>;

/** Why a region waits for an admin: the mode asks for it, it is larger than allowed, or the day's few are used up. */
export const paddleRegionWaitReasonSchema = z.enum(['ask', 'too_large', 'limit']);
export type PaddleRegionWaitReason = z.infer<typeof paddleRegionWaitReasonSchema>;

/** A region a paddler's planning asked for and an admin has yet to allow (or declined). */
export const paddleRegionPendingSchema = z.object({
  id: z.string(),
  name: z.string(),
  reason: paddleRegionWaitReasonSchema,
  /** The extract's size as Geofabrik announced it, bytes; null when it did not say. */
  bytes: z.number().int().nonnegative().nullable(),
  /** The user whose planning asked for it, by name; null once that account is gone. */
  requested_by: z.string().nullable(),
  requested_at: z.string(),
  declined: z.boolean(),
});
export type PaddleRegionPending = z.infer<typeof paddleRegionPendingSchema>;

export const paddleRegionListResponseSchema = z.object({
  regions: z.array(paddleRegionSchema),
  requests: z.array(paddleRegionPendingSchema),
});
export type PaddleRegionListResponse = z.infer<typeof paddleRegionListResponseSchema>;

export const paddleRegionCatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** The regions it lies in, outermost first, for telling "Limburg" from "Limburg". */
  path: z.array(z.string()),
});
export type PaddleRegionCatalogEntry = z.infer<typeof paddleRegionCatalogEntrySchema>;

export const paddleRegionCatalogQuerySchema = z.object({ q: z.string().trim().min(2).max(80) });
export const paddleRegionCatalogResponseSchema = z.object({ regions: z.array(paddleRegionCatalogEntrySchema) });
export type PaddleRegionCatalogResponse = z.infer<typeof paddleRegionCatalogResponseSchema>;

/** Geofabrik's region ids: lower case words, digits and dashes, a few of them nested with a slash (`us/texas`). */
export const paddleRegionIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/);

/** A region's boundary as Geofabrik draws it: a polygon or several, rings of [lng, lat]. */
const boundaryRing = z.array(z.tuple([z.number(), z.number()]));
export const paddleRegionBoundarySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: z.array(boundaryRing) }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(boundaryRing)) }),
]);
export type PaddleRegionBoundary = z.infer<typeof paddleRegionBoundarySchema>;

export const paddleRegionRequestSchema = z.object({ id: paddleRegionIdSchema });
export type PaddleRegionRequest = z.infer<typeof paddleRegionRequestSchema>;

/** The most places one look for water data asks about; the planner asks for the ends of its unplanned legs. */
export const MAX_PADDLE_LOAD_POINTS = 10;

/**
 * PAD-11C: the planner asks for the water data around places no region
 * covers. Asking again is how it follows a load: an answer never starts a
 * second one, and a request already with the admins is not sent twice.
 */
export const paddleRegionLoadRequestSchema = z.object({
  points: z.array(paddleRoutePointSchema).min(1).max(MAX_PADDLE_LOAD_POINTS),
  /** Read a region again whose last read failed. */
  retry: z.boolean().default(false),
});
export type PaddleRegionLoadRequest = z.input<typeof paddleRegionLoadRequestSchema>;

const regionRefSchema = z.object({ id: z.string(), name: z.string() });

/**
 * Where the water data around one place stands. `ready`: a network covers it,
 * plan again. `no_water`: its region is read and holds no water near it.
 * `loading`: its region is downloaded or read now, `ahead` others before it.
 * `requested` and `declined`: it waits for an admin, or an admin said no.
 * `failed`: the last read of its region failed. `unavailable`: nothing to be
 * done here (loading is off, Geofabrik has no extract for the place, or its
 * list cannot be fetched right now).
 */
export const paddleRegionLoadStateSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('ready'), region: regionRefSchema }),
  z.object({ state: z.literal('no_water'), region: regionRefSchema }),
  z.object({
    state: z.literal('loading'),
    region: regionRefSchema,
    progress: paddleRegionProgressSchema.nullable(),
    ahead: z.number().int().nonnegative(),
  }),
  z.object({ state: z.literal('requested'), region: regionRefSchema, reason: paddleRegionWaitReasonSchema }),
  z.object({ state: z.literal('declined'), region: regionRefSchema }),
  z.object({ state: z.literal('failed'), region: regionRefSchema }),
  z.object({
    state: z.literal('unavailable'),
    region: regionRefSchema.nullable(),
    reason: z.enum(['off', 'no_extract', 'catalog_unavailable']),
  }),
]);
export type PaddleRegionLoadState = z.infer<typeof paddleRegionLoadStateSchema>;

/** One answer per place asked about, in the order asked. */
export const paddleRegionLoadResponseSchema = z.object({ points: z.array(paddleRegionLoadStateSchema) });
export type PaddleRegionLoadResponse = z.infer<typeof paddleRegionLoadResponseSchema>;
