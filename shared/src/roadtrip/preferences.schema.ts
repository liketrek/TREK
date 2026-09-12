import { z } from 'zod';

const clock = z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]);
const amount = z.number().finite().nonnegative();

export const roadtripPreferencesSchema = z
  .object({
    roadtrip_leg_minutes: amount.max(1440).optional(),
    roadtrip_day_minutes: amount.max(1440).optional(),
    roadtrip_day_start: clock.optional(),
    roadtrip_day_end: clock.optional(),
    roadtrip_day_end_mode: z.enum(['route', 'stop']).optional(),
    roadtrip_range_km: amount.max(40000).optional(),
    roadtrip_vehicle: z.enum(['', 'combustion', 'electric']).optional(),
    roadtrip_fill_percent: amount.max(100).optional(),
    roadtrip_tank_litres: amount.max(10000).optional(),
    roadtrip_litres_per_100: amount.max(1000).optional(),
    roadtrip_battery_kwh: amount.max(10000).optional(),
    roadtrip_kwh_per_100: amount.max(1000).optional(),
    roadtrip_battery_degradation: amount.max(100).optional(),
    roadtrip_connect_days: z.boolean().optional(),
    roadtrip_service_stops_in_days: z.boolean().optional(),
    roadtrip_day_colors: z.boolean().optional(),
    roadtrip_show_hazards: z.boolean().optional(),
    roadtrip_avoid: z
      .string()
      .max(32)
      .refine(
        (value) => value === '' || value.split(',').every((part) => ['toll', 'motorway', 'ferry'].includes(part)),
        'Expected a comma-separated selection of toll, motorway, ferry',
      )
      .optional(),
  })
  .strict();

export const roadtripPreferencesUpdateSchema = roadtripPreferencesSchema.refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one driving preference',
);
export type RoadtripPreferences = z.infer<typeof roadtripPreferencesSchema>;
export const ROADTRIP_PREFERENCE_KEYS = Object.keys(roadtripPreferencesSchema.shape) as (keyof RoadtripPreferences)[];

export const roadtripPreferencesResponseSchema = z.object({
  tripId: z.number().int().positive(),
  preferences: roadtripPreferencesSchema,
});
