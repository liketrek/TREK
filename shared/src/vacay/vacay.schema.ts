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
  // A half company holiday (#2439): 0.5 leaves the other half of the day open for a
  // half vacation day. Omitted is a whole day, as before.
  fraction: z.union([z.literal(0.5), z.literal(1)]).optional(),
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

/**
 * Plan / entries / stats payloads, kept open.
 * @deprecated Use the typed response schemas below (vacayPlanResponseSchema, vacayEntriesResponseSchema, ...).
 */
export const vacayPlanDataSchema = open;
export type VacayPlanData = z.infer<typeof vacayPlanDataSchema>;

// ── Responses ───────────────────────────────────────────────────────────────
// The plan's own flags come back as booleans (the service converts them); the
// other rows keep SQLite's storage spelling, as the routes have always answered.

/** A holiday calendar on a plan (public or school holidays of one region). */
export const vacayHolidayCalendarSchema = z.object({
  id: z.number(),
  plan_id: z.number(),
  type: z.enum(['public_holiday', 'school_holiday']),
  region: z.string(),
  label: z.string().nullable(),
  color: z.string(),
  sort_order: z.number(),
});
export type VacayHolidayCalendar = z.infer<typeof vacayHolidayCalendarSchema>;

/** A vacation plan with its settings and holiday calendars. */
export const vacayPlanSchema = z.object({
  id: z.number(),
  owner_id: z.number(),
  block_weekends: z.boolean(),
  holidays_enabled: z.boolean(),
  holidays_region: z.string().nullable(),
  school_holidays_enabled: z.boolean(),
  company_holidays_enabled: z.boolean(),
  carry_over_enabled: z.boolean(),
  weekend_days: z.string().nullable(),
  week_start: z.number(),
  holiday_calendars: z.array(vacayHolidayCalendarSchema),
});
export type VacayPlan = z.infer<typeof vacayPlanSchema>;

/** A person on a plan, or one who could be invited to it. */
export const vacayUserSchema = z.object({ id: z.number(), username: z.string(), email: z.string() });
export type VacayUser = z.infer<typeof vacayUserSchema>;

/** GET /plan: the caller's active plan, its people and its open invitations. */
export const vacayPlanResponseSchema = z.object({
  plan: vacayPlanSchema,
  users: z.array(vacayUserSchema.extend({ color: z.string() })),
  pendingInvites: z.array(
    z.object({
      id: z.number(),
      user_id: z.number(),
      username: z.string(),
      email: z.string(),
      created_at: z.string().nullable(),
    }),
  ),
  incomingInvites: z.array(
    z.object({
      id: z.number(),
      plan_id: z.number(),
      username: z.string(),
      email: z.string(),
      created_at: z.string().nullable(),
    }),
  ),
  isOwner: z.boolean(),
  isFused: z.boolean(),
});
export type VacayPlanResponse = z.infer<typeof vacayPlanResponseSchema>;

/** PUT /plan: the plan after the write. */
export const vacayPlanUpdateResponseSchema = z.object({ plan: vacayPlanSchema });
export type VacayPlanUpdateResponse = z.infer<typeof vacayPlanUpdateResponseSchema>;

/** POST/PUT plan/holiday-calendars */
export const vacayHolidayCalendarResponseSchema = z.object({ calendar: vacayHolidayCalendarSchema });
export type VacayHolidayCalendarResponse = z.infer<typeof vacayHolidayCalendarResponseSchema>;

/** GET available-users: who could be invited to fuse with the plan. */
export const vacayAvailableUsersResponseSchema = z.object({ users: z.array(vacayUserSchema) });
export type VacayAvailableUsersResponse = z.infer<typeof vacayAvailableUsersResponseSchema>;

/** GET/POST /years, DELETE /years/:year: the plan's years after the call. */
export const vacayYearsResponseSchema = z.object({ years: z.array(z.number()) });
export type VacayYearsResponse = z.infer<typeof vacayYearsResponseSchema>;

/** A user's leave-year settings (#737). */
export const vacayYearSettingsSchema = z.object({
  user_id: z.number(),
  year_type: z.string(),
  year_start_month: z.number(),
  year_start_day: z.number(),
  hire_date: z.string().nullable(),
});
export type VacayYearSettings = z.infer<typeof vacayYearSettingsSchema>;

/** GET/PUT year-settings */
export const vacayYearSettingsResponseSchema = z.object({ settings: vacayYearSettingsSchema });
export type VacayYearSettingsResponse = z.infer<typeof vacayYearSettingsResponseSchema>;

/** GET entries/:year: every entry in the viewer's leave-year window, and the company holidays in it. */
export const vacayEntriesResponseSchema = z.object({
  entries: z.array(
    z.object({
      id: z.number(),
      plan_id: z.number(),
      user_id: z.number(),
      date: z.string(),
      note: z.string().nullable(),
      fraction: z.number(),
      kind: z.string().nullable(),
      person_name: z.string(),
      person_color: z.string(),
    }),
  ),
  companyHolidays: z.array(
    z.object({
      id: z.number(),
      plan_id: z.number(),
      date: z.string(),
      note: z.string().nullable(),
      fraction: z.number(),
    }),
  ),
});
export type VacayEntriesResponse = z.infer<typeof vacayEntriesResponseSchema>;

/** POST entries/toggle: what the click did to the day. */
export const vacayToggleEntryResponseSchema = z.object({
  action: z.enum(['added', 'updated', 'removed']),
  fraction: z.number().optional(),
  kind: z.string().optional(),
});
export type VacayToggleEntryResponse = z.infer<typeof vacayToggleEntryResponseSchema>;

/** POST entries/company-holiday: what the click did to the company holiday. */
export const vacayCompanyHolidayResponseSchema = z.object({
  action: z.enum(['added', 'updated', 'removed']),
  fraction: z.number().optional(),
});
export type VacayCompanyHolidayResponse = z.infer<typeof vacayCompanyHolidayResponseSchema>;

/** GET stats/:year: one row per person on the plan. */
export const vacayStatsResponseSchema = z.object({
  stats: z.array(
    z.object({
      user_id: z.number(),
      person_name: z.string(),
      person_color: z.string(),
      year: z.number(),
      vacation_days: z.number().nullable(),
      carried_over: z.number().nullable(),
      total_available: z.number(),
      used: z.number(),
      remaining: z.number(),
      comp_used: z.number(),
      window_start: z.string(),
      window_end: z.string(),
    }),
  ),
});
export type VacayStatsResponse = z.infer<typeof vacayStatsResponseSchema>;

/** GET /shares: the caller's outgoing shares and the calendars shared with them. */
export const vacaySharesResponseSchema = z.object({
  outgoing: z.array(z.object({ id: z.number(), user_id: z.number(), username: z.string() })),
  incoming: z.array(
    z.object({ id: z.number(), owner_id: z.number(), username: z.string(), color: z.string(), hidden: z.boolean() }),
  ),
});
export type VacaySharesResponse = z.infer<typeof vacaySharesResponseSchema>;

/** GET shares/available-users: who the caller could share with (usernames only). */
export const vacayShareAvailableUsersResponseSchema = z.object({
  users: z.array(z.object({ id: z.number(), username: z.string() })),
});
export type VacayShareAvailableUsersResponse = z.infer<typeof vacayShareAvailableUsersResponseSchema>;

/** GET shares/calendars/:year: the calendars shared with the caller, over the caller's window. */
export const vacaySharedCalendarsResponseSchema = z.object({
  calendars: z.array(
    z.object({
      share_id: z.number(),
      owner_id: z.number(),
      owner_name: z.string(),
      color: z.string(),
      hidden: z.boolean(),
      entries: z.array(z.object({ date: z.string(), fraction: z.number(), kind: z.string().nullable() })),
      companyHolidays: z.array(z.object({ date: z.string() })),
    }),
  ),
});
export type VacaySharedCalendarsResponse = z.infer<typeof vacaySharedCalendarsResponseSchema>;
