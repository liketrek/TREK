import { z } from 'zod';

/**
 * Vacay API contract — single source of truth for the /api/addons/vacay endpoints
 * (shared vacation-day planner: plan, holiday calendars, members/invites, years,
 * entries, stats, public-holiday lookups).
 *
 * Parity note: like atlas, the legacy vacay route is NOT addon-gated at the mount
 * (app.ts), so the migration adds no gate. Plan/entry/stats shapes are wide and
 * DB-derived, so the response schemas stay open records; the request schemas and
 * the bespoke 400/403/404/502 controller messages pin the client-facing parts.
 *
 * Many mutations carry an `X-Socket-Id` header that the services use to suppress
 * the echo broadcast to the originating client — it is forwarded unchanged.
 */

const open = z.record(z.string(), z.unknown());

// Plan settings update (PUT /plan): every field optional — only provided keys
// are written (dynamic SET list server-side). weekend_days is the
// comma-separated weekday list stored as TEXT (e.g. '0,6'); week_start is
// coerced to 0/1 server-side; holidays_region takes null to clear the legacy
// single-region field (superseded by holiday calendars, still on the wire).
export const vacayUpdatePlanRequestSchema = z.object({
  block_weekends: z.boolean().optional(),
  holidays_enabled: z.boolean().optional(),
  holidays_region: z.string().nullable().optional(),
  school_holidays_enabled: z.boolean().optional(),
  company_holidays_enabled: z.boolean().optional(),
  carry_over_enabled: z.boolean().optional(),
  weekend_days: z.string().optional(),
  week_start: z.number().optional(),
});
export type VacayUpdatePlanRequest = z.infer<typeof vacayUpdatePlanRequestSchema>;

export const vacayAddHolidayCalendarRequestSchema = z.object({
  region: z.string().min(1),
  type: z.enum(['public_holiday', 'school_holiday']).optional(),
  label: z.string().nullable().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
});
export type VacayAddHolidayCalendarRequest = z.infer<typeof vacayAddHolidayCalendarRequestSchema>;

// Partial calendar update (PUT /plan/holiday-calendars/:id): every field
// optional — only provided keys are written (dynamic SET list server-side).
export const vacayUpdateHolidayCalendarRequestSchema = z.object({
  region: z.string().optional(),
  type: z.enum(['public_holiday', 'school_holiday']).optional(),
  label: z.string().nullable().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
});
export type VacayUpdateHolidayCalendarRequest = z.infer<typeof vacayUpdateHolidayCalendarRequestSchema>;

export const vacaySetColorRequestSchema = z.object({
  color: z.string().optional(),
  target_user_id: z.union([z.number(), z.string()]).optional(),
});
export type VacaySetColorRequest = z.infer<typeof vacaySetColorRequestSchema>;

export const vacayInviteRequestSchema = z.object({
  user_id: z.union([z.number(), z.string()]),
});
export type VacayInviteRequest = z.infer<typeof vacayInviteRequestSchema>;

export const vacayInviteActionRequestSchema = z.object({
  plan_id: z.number().optional(),
});
export type VacayInviteActionRequest = z.infer<typeof vacayInviteActionRequestSchema>;

export const vacayAddYearRequestSchema = z.object({
  year: z.union([z.number(), z.string()]),
});
export type VacayAddYearRequest = z.infer<typeof vacayAddYearRequestSchema>;

export const vacayToggleEntryRequestSchema = z.object({
  date: z.string().min(1),
  target_user_id: z.union([z.number(), z.string()]).optional(),
  // Half vacation days (#552): 0.5 logs a half day, 1 (or omitted) a full day.
  fraction: z.union([z.literal(0.5), z.literal(1)]).optional(),
  // Leave type (#1074): 'comp' logs a flex/comp day (does not touch the
  // entitlement), 'vacation' (or omitted) a regular vacation day.
  kind: z.enum(['vacation', 'comp']).optional(),
});
export type VacayToggleEntryRequest = z.infer<typeof vacayToggleEntryRequestSchema>;

// Configurable vacation year (#737): the leave-year window is per user, not per
// plan. 'calendar' is the unchanged Jan–Dec default, 'fiscal' starts on the given
// month/day, 'anniversary' on the month/day of the hire date.
export const vacayYearSettingsRequestSchema = z.object({
  year_type: z.enum(['calendar', 'fiscal', 'anniversary']),
  year_start_month: z.number().int().min(1).max(12).optional(),
  year_start_day: z.number().int().min(1).max(31).optional(),
  hire_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
export type VacayYearSettingsRequest = z.infer<typeof vacayYearSettingsRequestSchema>;

export const vacayCompanyHolidayRequestSchema = z.object({
  date: z.string(),
  note: z.string().optional(),
});
export type VacayCompanyHolidayRequest = z.infer<typeof vacayCompanyHolidayRequestSchema>;

export const vacayUpdateStatsRequestSchema = z.object({
  vacation_days: z.number().optional(),
  target_user_id: z.union([z.number(), z.string()]).optional(),
});
export type VacayUpdateStatsRequest = z.infer<typeof vacayUpdateStatsRequestSchema>;

// Read-only calendar sharing (#444/#667): grant another user view access to
// your vacation calendar without fusing plans.
export const vacayShareRequestSchema = z.object({
  user_id: z.union([z.number(), z.string()]),
});
export type VacayShareRequest = z.infer<typeof vacayShareRequestSchema>;

export const vacayShareUpdateRequestSchema = z.object({
  hidden: z.boolean(),
});
export type VacayShareUpdateRequest = z.infer<typeof vacayShareUpdateRequestSchema>;

/** Plan / entries / stats payloads are wide and DB-derived; kept open. */
export const vacayPlanDataSchema = open;
export type VacayPlanData = z.infer<typeof vacayPlanDataSchema>;
