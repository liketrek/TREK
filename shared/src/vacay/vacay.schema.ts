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

export const vacayAddHolidayCalendarRequestSchema = z.object({
  region: z.string().min(1),
  label: z.string().nullable().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
});
export type VacayAddHolidayCalendarRequest = z.infer<typeof vacayAddHolidayCalendarRequestSchema>;

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
});
export type VacayToggleEntryRequest = z.infer<typeof vacayToggleEntryRequestSchema>;

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

/** Plan / entries / stats payloads are wide and DB-derived; kept open. */
export const vacayPlanDataSchema = open;
export type VacayPlanData = z.infer<typeof vacayPlanDataSchema>;
