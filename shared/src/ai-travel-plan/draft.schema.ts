import { travelPlanSourceSchema, travelPlanWarningSchema, type TravelPlanWarning } from './warnings';

import { z } from 'zod';

/**
 * A place the planner proposes. `provider` + `providerId` identify a real record
 * in a provider the server is allowed to call; a draft never carries a place
 * that a provider did not return.
 *
 * Coordinates are WGS-84 by contract: a provider that speaks another datum
 * converts at its own boundary, and `coordinateSystem` records that so a reader
 * never has to assume it. The remaining fields are what the provider knew about
 * the place when it was checked; empty values mean "the provider had none", not
 * "the planner guessed".
 */
export const travelPlanPlaceSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  providerId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** The provider's own taxonomy, e.g. 风景名胜; null when it has none. */
  category: z.string().trim().min(1).max(120).nullable().default(null),
  /** Full address as the provider wrote it, region included. */
  address: z.string().trim().min(1).max(300).nullable().default(null),
  /** Provider rating, 0–5. Null when the provider has no rating for the place. */
  rating: z.number().min(0).max(5).nullable().default(null),
  /** Opening-hours lines exactly as the provider wrote them; empty when none. */
  hours: z.array(z.string().trim().min(1).max(200)).default([]),
  coordinateSystem: z.enum(['wgs84', 'gcj02', 'bd09']).default('wgs84'),
});

export type TravelPlanPlace = z.infer<typeof travelPlanPlaceSchema>;

export const travelPlanTravelModeSchema = z.enum(['walk', 'public_transit', 'drive', 'train', 'flight', 'other']);

export const travelPlanLegSchema = z.object({
  mode: travelPlanTravelModeSchema,
  minutes: z.number().int().nonnegative(),
  distanceMeters: z.number().int().nonnegative().nullable(),
});

export type TravelPlanLeg = z.infer<typeof travelPlanLegSchema>;

export const travelPlanCostRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

export type TravelPlanCostRange = z.infer<typeof travelPlanCostRangeSchema>;

export const travelPlanDraftItemSchema = z.object({
  place: travelPlanPlaceSchema,
  /** `HH:MM` on the day, or null when the planner leaves the time open. */
  arriveAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
    .nullable(),
  leaveAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
    .nullable(),
  activity: z.string().trim().max(200).nullable(),
  travelFromPrevious: travelPlanLegSchema.nullable(),
  estimatedCostCny: travelPlanCostRangeSchema.nullable(),
  /** Where the place came from and when it was checked. Never absent. */
  source: travelPlanSourceSchema,
});

export type TravelPlanDraftItem = z.infer<typeof travelPlanDraftItemSchema>;

export const travelPlanDayWeatherSchema = z.object({
  provider: z.literal('open-meteo'),
  kind: z.enum(['clear', 'clouds', 'rain', 'snow', 'storm', 'fog', 'other']),
  tempMin: z.number().nullable(),
  tempMax: z.number().nullable(),
  description: z.string().trim().max(120).nullable(),
  /** `climate` means the date is outside the forecast window; reference only. */
  type: z.enum(['forecast', 'climate']),
  checkedAt: z.string().trim().min(1).max(40),
});

export type TravelPlanDayWeather = z.infer<typeof travelPlanDayWeatherSchema>;

export const travelPlanDraftDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  items: z.array(travelPlanDraftItemSchema),
  weather: travelPlanDayWeatherSchema.nullable().optional(),
});

export type TravelPlanDraftDay = z.infer<typeof travelPlanDraftDaySchema>;

export const travelPlanBudgetSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  /** Per category lower bound, in CNY. Empty when the plan has no estimate. */
  breakdown: z.record(z.string(), z.number().nonnegative()).default({}),
  /** Per category upper bound, matching `breakdown`. */
  breakdownMax: z.record(z.string(), z.number().nonnegative()).default({}),
  /** How the estimate was reached; empty means the budget is a placeholder. */
  assumptions: z.array(z.string().trim().min(1).max(200)).default([]),
});

export type TravelPlanBudget = z.infer<typeof travelPlanBudgetSchema>;

export const travelPlanHotelSampleSchema = z.object({
  place: travelPlanPlaceSchema,
  rating: z.number().min(0).max(5).nullable(),
  distanceMeters: z.number().int().nonnegative().nullable(),
  source: travelPlanSourceSchema,
});

export type TravelPlanHotelSample = z.infer<typeof travelPlanHotelSampleSchema>;

/**
 * A cluster of lodging around one anchor stop. It answers "where should I
 * stay", not "what does a room cost": no rate, no availability.
 */
export const travelPlanLodgingAreaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  lat: z.number(),
  lng: z.number(),
  hotelCount: z.number().int().nonnegative(),
  avgRating: z.number().min(0).max(5).nullable(),
  sampleHotels: z.array(travelPlanHotelSampleSchema).max(3).default([]),
  reason: z.string().trim().max(200).nullable(),
});

export type TravelPlanLodgingArea = z.infer<typeof travelPlanLodgingAreaSchema>;

/**
 * The proposal the traveller reviews. Nothing here is written to a trip until
 * the traveller explicitly applies it.
 */
export const travelPlanDraftSchema = z.object({
  summary: z.string().trim().max(2000),
  /** The db timestamp of the last provider check, or null when none was made. */
  factsCheckedAt: z.string().trim().min(1).max(40).nullable(),
  days: z.array(travelPlanDraftDaySchema),
  estimatedBudgetCny: travelPlanBudgetSchema,
  /** Where to stay, derived from the real lodging the provider returned. */
  lodgingAreas: z.array(travelPlanLodgingAreaSchema).default([]),
  warnings: z.array(travelPlanWarningSchema).default([]),
});

export type TravelPlanDraft = z.infer<typeof travelPlanDraftSchema>;

/**
 * The honest empty draft an unconfigured planner answers with: no days, no
 * places, no price — only the warning that says so. Never a fabricated POI.
 */
export function emptyTravelPlanDraft(checkedAt: string, warnings: TravelPlanWarning[] = []): TravelPlanDraft {
  return {
    summary: '尚未配置可用的行程规划引擎，当前只保存了你的旅行需求。',
    factsCheckedAt: checkedAt,
    days: [],
    estimatedBudgetCny: { min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] },
    lodgingAreas: [],
    warnings,
  };
}
