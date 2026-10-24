import { z } from 'zod';

/**
 * PAD-08: the wind forecast for one place and one day, for a paddle tour on
 * that day. It only ever carries a forecast: a day already gone or beyond the
 * forecast's reach says so and carries no figures, so a climate value or last
 * year's wind can never be read as this day's. Speeds are km/h, directions
 * degrees the wind comes from (meteorological), gusts the strongest within the
 * hour. A value the source did not give is null, never zero.
 */

/** How many days ahead the forecast reaches, today included. */
export const WIND_FORECAST_DAYS = 16;

export const windQuerySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type WindQuery = z.infer<typeof windQuerySchema>;

export const windHourSchema = z.object({
  /** Local hour of the place, 0 to 23. */
  hour: z.number().int().min(0).max(23),
  speed_kmh: z.number().nullable(),
  gusts_kmh: z.number().nullable(),
  direction_deg: z.number().nullable(),
});
export type WindHour = z.infer<typeof windHourSchema>;

export const windDaySchema = z.object({
  /** The strongest hourly mean of the day: a maximum, not an average. */
  speed_max_kmh: z.number().nullable(),
  gusts_max_kmh: z.number().nullable(),
  /** Where the wind came from most over the day. */
  direction_dominant_deg: z.number().nullable(),
});
export type WindDay = z.infer<typeof windDaySchema>;

export const windForecastStatusSchema = z.enum(['forecast', 'past', 'beyond_horizon']);
export type WindForecastStatus = z.infer<typeof windForecastStatusSchema>;

export const windForecastResponseSchema = z.object({
  status: windForecastStatusSchema,
  date: z.string(),
  lat: z.number(),
  lng: z.number(),
  /** The place's time zone the hours are in; null when there is no forecast. */
  timezone: z.string().nullable(),
  source: z.literal('Open-Meteo'),
  /** When TREK asked the source for these figures, ISO 8601. */
  fetched_at: z.string(),
  horizon_days: z.number().int(),
  hours: z.array(windHourSchema),
  day: windDaySchema.nullable(),
});
export type WindForecastResponse = z.infer<typeof windForecastResponseSchema>;

/** The 16 compass points a direction is named by, from north clockwise. */
export const COMPASS_POINTS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** The compass point a direction in degrees falls on. */
export function compassPointOf(degrees: number): CompassPoint {
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_POINTS[index] ?? 'N';
}
