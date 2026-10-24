import { z } from 'zod';

/**
 * PAD-05A: paddle obstacles and access rules read out of OpenStreetMap, region
 * by region. Every object keeps its own OSM reference and geometry (a weir
 * across a river is a line, never only a point), the tags it was judged by
 * and a hash of them, so a later read tells a changed object from an
 * unchanged one. The map shows them (PAD-05B), the checklist decides about
 * them (PAD-06); neither turns a missing object into a free passage.
 */

export const paddleObstacleKindSchema = z.enum([
  'weir',
  'dam',
  'lock',
  'lock_gate',
  'waterfall',
  'rapids',
  'hazard',
  'put_in',
  'egress',
  'slipway',
  'portage',
  'access',
]);
export type PaddleObstacleKind = z.infer<typeof paddleObstacleKindSchema>;

/** The kinds a paddler has to decide about; the rest are places and ways that help. */
export const PADDLE_BLOCKING_KINDS: readonly PaddleObstacleKind[] = [
  'weir',
  'dam',
  'lock',
  'lock_gate',
  'waterfall',
  'rapids',
  'hazard',
  'access',
];

const position = z.tuple([z.number().finite(), z.number().finite()]);
/** GeoJSON order, [lng, lat], as OSM tools exchange it. */
export const paddleGeometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Point'), coordinates: position }),
  z.object({ type: z.literal('LineString'), coordinates: z.array(position).min(2) }),
  z.object({ type: z.literal('Polygon'), coordinates: z.array(z.array(position).min(4)).min(1) }),
]);
export type PaddleGeometry = z.infer<typeof paddleGeometrySchema>;

export const paddleFeatureSchema = z.object({
  /** `node/123` or `way/456`: the object in OpenStreetMap. */
  ref: z.string(),
  kind: paddleObstacleKindSchema,
  /** The objects of one lock (chamber, gates) share a key; null for an object on its own. */
  group_key: z.string().nullable(),
  name: z.string().nullable(),
  geometry: paddleGeometrySchema,
  /** The tags it was judged by, as OSM holds them. */
  tags: z.record(z.string(), z.string()),
  /** A hash of its tags and geometry: a new value means the object changed. */
  tag_hash: z.string(),
  region_id: z.string(),
});
export type PaddleFeature = z.infer<typeof paddleFeatureSchema>;

export const paddleCoverageStateSchema = z.enum(['covered', 'partial', 'none']);
export type PaddleCoverageState = z.infer<typeof paddleCoverageStateSchema>;

export const paddleCoverageRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** The date the region's data is current to, ISO 8601; null when its file named none. */
  source_timestamp: z.string().nullable(),
  /** When TREK last read the region, ISO 8601. */
  imported_at: z.string().nullable(),
});
export type PaddleCoverageRegion = z.infer<typeof paddleCoverageRegionSchema>;

export const paddleObstaclesQuerySchema = z.object({
  /** south,west,north,east in degrees. */
  bbox: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/),
});
export type PaddleObstaclesQuery = z.infer<typeof paddleObstaclesQuerySchema>;

/** The most objects one answer carries; a wider area answers cut and says so. */
export const PADDLE_OBSTACLES_CAP = 2000;
/** The widest area one request may ask for, in degrees a side. */
export const PADDLE_OBSTACLES_MAX_SPAN_DEG = 1;

export const paddleObstaclesResponseSchema = z.object({
  features: z.array(paddleFeatureSchema),
  /** Whether the area lies inside regions TREK holds data for: wholly, in part, or not at all. */
  coverage: z.object({
    state: paddleCoverageStateSchema,
    regions: z.array(paddleCoverageRegionSchema),
  }),
  /** The answer was cut at PADDLE_OBSTACLES_CAP. */
  truncated: z.boolean(),
});
export type PaddleObstaclesResponse = z.infer<typeof paddleObstaclesResponseSchema>;

export const PADDLE_OBSTACLES_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';

/** What the access tags say about paddling here, read canoe first, then boat. */
export interface PaddleAccess {
  /** The value the tags give; null when none of them speak to boats. */
  value: string | null;
  /** Which tag it came from: the canoe-specific one wins over the general boat one. */
  source: 'canoe' | 'boat' | 'access' | null;
  /** A condition the rule carries (season, hours), as written; it is shown, never evaluated. */
  condition: string | null;
  /** The value forbids paddling outright, as far as the tags go. */
  forbidden: boolean;
  /** Private ground or water: no permission, whatever the line suggests. */
  private: boolean;
}

/**
 * The access rule for paddlers in an object's tags. `canoe` is read before
 * `boat`, and `access` last; a conditional rule is kept as written. A value
 * nobody gave stays null: missing is no permission.
 */
export function paddleAccessOf(tags: Readonly<Record<string, string>>): PaddleAccess {
  const pick = (['canoe', 'boat', 'access'] as const).find((key) => tags[key] !== undefined);
  const conditional = tags['canoe:conditional'] ?? tags['boat:conditional'] ?? null;
  const value = pick ? (tags[pick] ?? null) : null;
  return {
    value,
    source: pick ?? null,
    condition: conditional,
    forbidden: value === 'no',
    private: value === 'private',
  };
}
