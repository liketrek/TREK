import { z } from 'zod';

/** What can be looked for along a tour on foot, by bike or on the water. */
export const TOUR_POI_CATEGORIES = [
  'viewpoint',
  'peak',
  'shelter',
  'drinking_water',
  'food',
  'toilets',
  'picnic',
  'campsite',
  'sights',
  'slipway',
  'boat_rental',
  'bike_repair',
  'museum',
  'park',
  'cafe',
  'restaurant',
  'market',
  'ebike_charging',
] as const;
export const tourPoiCategorySchema = z.enum(TOUR_POI_CATEGORIES);
export type TourPoiCategory = z.infer<typeof tourPoiCategorySchema>;
