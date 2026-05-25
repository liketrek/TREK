import { z } from 'zod';

/**
 * Weather API contract — single source of truth for the /api/weather endpoints.
 *
 * The legacy Express routes treat lat/lng as opaque strings (they are parsed with
 * parseFloat inside the service) and only check for presence, so the query schemas
 * mirror that: non-empty strings, not coerced numbers. `lang` defaults to 'de',
 * matching the Express default.
 *
 * The bespoke "X is required" 400 messages are reproduced in the controller, not
 * derived from these schemas, so the error body stays byte-identical to Express.
 */

export const weatherQuerySchema = z.object({
  lat: z.string().min(1),
  lng: z.string().min(1),
  date: z.string().min(1).optional(),
  lang: z.string().min(1).default('de'),
});
export type WeatherQuery = z.infer<typeof weatherQuerySchema>;

/** Detailed weather requires a date (the Express route 400s without it). */
export const detailedWeatherQuerySchema = weatherQuerySchema.extend({
  date: z.string().min(1),
});
export type DetailedWeatherQuery = z.infer<typeof detailedWeatherQuerySchema>;

export const hourlyEntrySchema = z.object({
  hour: z.number(),
  temp: z.number(),
  precipitation: z.number(),
  precipitation_probability: z.number(),
  main: z.string(),
  wind: z.number(),
  humidity: z.number(),
});
export type HourlyEntry = z.infer<typeof hourlyEntrySchema>;

/**
 * Weather response DTO. Fields are optional because the Express service emits
 * different subsets depending on the request type (current / forecast / climate /
 * detailed) and on error (`{ ..., error: 'no_forecast' }`).
 */
export const weatherResultSchema = z.object({
  temp: z.number(),
  temp_max: z.number().optional(),
  temp_min: z.number().optional(),
  main: z.string(),
  description: z.string(),
  type: z.string(),
  sunrise: z.string().nullable().optional(),
  sunset: z.string().nullable().optional(),
  precipitation_sum: z.number().optional(),
  precipitation_probability_max: z.number().optional(),
  wind_max: z.number().optional(),
  hourly: z.array(hourlyEntrySchema).optional(),
  error: z.string().optional(),
});
export type WeatherResult = z.infer<typeof weatherResultSchema>;
