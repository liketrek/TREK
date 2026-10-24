import { tourPoiCategorySchema, type TourPoiCategory } from './tour-poi-category';
import { plannableTourTypeSchema, type PlannableTourType } from './tours.schema';

import { z } from 'zod';

/**
 * PLN-02: places along a tour, searched on purpose. The search reads only:
 * it changes no tour, place or day. Distances are how far a place lies from
 * the line as drawn, never a detour someone walked or paddled.
 */

// The categories live in a module of their own, so the tour contract can name
// one on a waypoint without importing this one, which imports it.
export { TOUR_POI_CATEGORIES, tourPoiCategorySchema, type TourPoiCategory } from './tour-poi-category';
// Which places found are highlights, read by the server that marks them.
export {
  TOUR_HIGHLIGHT_FALLBACK_MIN_QRANK,
  TOUR_HIGHLIGHT_MIN_COUNT,
  TOUR_HIGHLIGHT_MIN_QRANK,
  tourHighlightIds,
} from './tour-highlights';

/** The categories each planned tour type offers, the most asked first. */
export const TOUR_POI_CATEGORIES_BY_TYPE: Record<PlannableTourType, readonly TourPoiCategory[]> = {
  hike: ['viewpoint', 'shelter', 'drinking_water', 'food', 'peak', 'toilets', 'picnic', 'campsite', 'sights'],
  // BIK-07: e-bike charging after the first three, so a new bike tour still starts on those.
  bike: [
    'drinking_water',
    'bike_repair',
    'food',
    'ebike_charging',
    'viewpoint',
    'toilets',
    'shelter',
    'picnic',
    'campsite',
    'sights',
  ],
  kayak: ['slipway', 'boat_rental', 'drinking_water', 'food', 'toilets', 'picnic', 'campsite', 'shelter'],
  walk: ['sights', 'museum', 'park', 'viewpoint', 'cafe', 'restaurant', 'market', 'toilets', 'drinking_water'],
  run: ['drinking_water', 'toilets', 'park', 'viewpoint', 'cafe', 'food', 'shelter', 'sights'],
  // HOR-01: water for horse and rider first; a ride stops where a walk would.
  horse: ['drinking_water', 'shelter', 'viewpoint', 'food', 'picnic', 'toilets', 'campsite', 'sights'],
  // SKI-02: huts and somewhere warm to eat first; a winter day out stops where the snow lets it.
  ski: ['shelter', 'food', 'cafe', 'restaurant', 'toilets', 'viewpoint', 'peak', 'drinking_water'],
};

/**
 * CW-05: the four themes a city walk can be filled from, each a set of the
 * walk's own categories. A suggestion says which theme and category brought
 * it; nothing is claimed beyond what the source tags say.
 */
export const WALK_THEME_KEYS = ['culture', 'parks', 'food', 'mixed'] as const;
export const walkThemeSchema = z.enum(WALK_THEME_KEYS);
export type WalkTheme = z.infer<typeof walkThemeSchema>;
export const WALK_THEMES = {
  culture: ['museum', 'sights'],
  parks: ['park', 'viewpoint'],
  food: ['cafe', 'restaurant', 'market'],
  mixed: ['sights', 'museum', 'park', 'viewpoint', 'cafe', 'market'],
} as const satisfies Record<WalkTheme, readonly TourPoiCategory[]>;

/** How far from the line a place may lie, the choices offered, in metres. */
export const TOUR_POI_CORRIDORS_M = [250, 500, 1000, 2000] as const;
/** The most places one answer carries: the nearest to the line, listed from the start. */
export const TOUR_POI_LIMIT = 60;
/** The most points the line sent may have; a longer line is thinned first. */
export const TOUR_POI_MAX_LINE_POINTS = 1000;
/** The most categories one search asks for. */
export const TOUR_POI_MAX_CATEGORIES = 6;

export const tourPoiSearchRequestSchema = z
  .object({
    tour_type: plannableTourTypeSchema,
    categories: z.array(tourPoiCategorySchema).min(1).max(TOUR_POI_MAX_CATEGORIES),
    corridor_m: z.number().int().min(50).max(2000),
    line: z
      .array(z.tuple([z.number().finite().min(-90).max(90), z.number().finite().min(-180).max(180)]))
      .min(2)
      .max(TOUR_POI_MAX_LINE_POINTS),
    lang: z.string().trim().min(2).max(10).optional(),
  })
  .strict();
export type TourPoiSearchRequest = z.infer<typeof tourPoiSearchRequestSchema>;

/**
 * BIK-07: what a charging point for e-bikes says about itself, each field only
 * as OpenStreetMap states it. The search keeps only points tagged for bicycles,
 * so `bicycle` is always one of the two; a socket, fee or access left unsaid is
 * null or missing, never a yes.
 */
const tourPoiChargingSchema = z.object({
  /** `designated` is made for bikes, `yes` lets them charge. */
  bicycle: z.enum(['yes', 'designated']),
  /** One entry per socket family stated, with how many and how fast where said. */
  sockets: z.array(
    z.object({ type: z.string(), count: z.number().int().positive().nullable(), kw: z.number().positive().nullable() }),
  ),
  /** How many bikes can charge at once. */
  capacity: z.number().int().positive().nullable(),
  /** true costs money, false is free, null is not said. */
  fee: z.boolean().nullable(),
  /** OpenStreetMap's own access value, `customers` or `private` style. */
  access: z.string().nullable(),
});
export type TourPoiCharging = z.infer<typeof tourPoiChargingSchema>;

/** One place found: what the source says about it, and where it lies against the line. */
export const tourPoiSchema = z.object({
  /** The source's own id, `node:123` style for OpenStreetMap. */
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  category: tourPoiCategorySchema,
  /** The source's own kind for it, `amenity=drinking_water` style. */
  kind: z.string(),
  /** Which index answered: OpenStreetMap, or TREK's own places index. */
  source: z.string(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  /** As the source has them; a hint to check, never a promise. */
  opening_hours: z.string().nullable(),
  /** Metres from the line, straight across. */
  distance_m: z.number().nonnegative(),
  /** Metres along the line from its start to the point nearest the place. */
  along_m: z.number().nonnegative(),
  /** One of the best known places along the line (tour-highlights); absent means not one. */
  highlight: z.boolean().optional(),
  /** BIK-07: what an e-bike charging point states; absent on every other kind. */
  charging: tourPoiChargingSchema.optional(),
});
export type TourPoi = z.infer<typeof tourPoiSchema>;

export const tourPoiSearchResponseSchema = z.object({
  pois: z.array(tourPoiSchema),
  /** More places matched than the answer carries. */
  truncated: z.boolean(),
  /** Some stretches of the line could not be searched; the places of the others are there. */
  partial: z.boolean(),
  /** The line was longer than one search covers; only its first part was searched. */
  capped: z.boolean(),
  /** Kinds no source could be asked for right now; their places are missing, not absent. */
  unavailable: z.array(tourPoiCategorySchema),
  /** PLN-05: seconds until asking again makes sense, beside unavailable kinds only; absent when now. */
  retry_after_s: z.number().int().positive().optional(),
});
export type TourPoiSearchResponse = z.infer<typeof tourPoiSearchResponseSchema>;
