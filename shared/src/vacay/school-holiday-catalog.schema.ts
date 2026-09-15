import { idSchema, nonEmptyString } from '../common/primitives.schema';

import { z } from 'zod';

export const schoolHolidayCountryRequestSchema = z.object({
  code: z.string().regex(/^[A-Z]{2}$/),
  name: nonEmptyString.max(100),
});
export const schoolHolidayPeriodSchema = z
  .object({
    name: nonEmptyString.max(150),
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine((period) => period.endDate >= period.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })
  .refine((period) => Date.parse(period.endDate) - Date.parse(period.startDate) <= 366 * 86400000, {
    message: 'A holiday period must not exceed one year',
    path: ['endDate'],
  });
export const schoolHolidayRegionRequestSchema = z.object({
  name: nonEmptyString.max(150),
  revision: z.number().int().nonnegative(),
  holidays: z.array(schoolHolidayPeriodSchema).max(500),
});
export const schoolHolidayRegionSchema = z.object({
  id: idSchema,
  country: z.string(),
  name: z.string(),
  code: z.string(),
  revision: z.number().int(),
});
export const schoolHolidayCatalogSchema = z.object({
  countries: z.array(schoolHolidayCountryRequestSchema),
  regions: z.array(schoolHolidayRegionSchema),
});
export const schoolHolidayRegionDetailSchema = schoolHolidayRegionSchema.extend({
  holidays: z.array(schoolHolidayPeriodSchema),
});
export type SchoolHolidayCountryRequest = z.infer<typeof schoolHolidayCountryRequestSchema>;
export type SchoolHolidayPeriod = z.infer<typeof schoolHolidayPeriodSchema>;
export type SchoolHolidayRegionRequest = z.infer<typeof schoolHolidayRegionRequestSchema>;
export type SchoolHolidayRegion = z.infer<typeof schoolHolidayRegionSchema>;
export type SchoolHolidayCatalog = z.infer<typeof schoolHolidayCatalogSchema>;
export type SchoolHolidayRegionDetail = z.infer<typeof schoolHolidayRegionDetailSchema>;

export function manualSchoolRegionId(code: string): number | null {
  const match = /^[A-Z]{2}-MANUAL-([1-9][0-9]*)$/.exec(code);
  return match ? Number(match[1]) : null;
}
