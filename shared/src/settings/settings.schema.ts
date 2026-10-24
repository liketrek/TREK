import { z } from 'zod';

/**
 * User-settings API contract — per-user key/value preferences under
 * /api/settings (get all, upsert one, bulk upsert).
 *
 * Values are intentionally untyped (settings hold strings, numbers, booleans
 * and small objects). A masked value of '••••••••' on a single upsert is a
 * no-op sentinel (the client echoes the masked secret back unchanged).
 */
export const MASKED_SETTING_VALUE = '••••••••';

export const settingUpsertRequestSchema = z.object({
  key: z.string().min(1),
  value: z.unknown().optional(),
});
export type SettingUpsertRequest = z.infer<typeof settingUpsertRequestSchema>;

export const settingsBulkRequestSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsBulkRequest = z.infer<typeof settingsBulkRequestSchema>;

/**
 * The first column of every date picker (#2029). Stored as the day's name, like
 * the other regional settings ('24h', 'metric'): getUserSettings JSON-parses
 * each row, so a digit string would come back as a number, a name comes back
 * unchanged. Vacay keeps its own per-plan week_start (0/1) next to this.
 */
export const WEEK_START_VALUES = ['monday', 'sunday', 'saturday'] as const;
export type WeekStart = (typeof WEEK_START_VALUES)[number];
export const weekStartSchema = z.enum(WEEK_START_VALUES);
/** What a user who never picked one gets, and what every picker did before the setting existed. */
export const DEFAULT_WEEK_START: WeekStart = 'monday';
/** Date#getDay() of each value, the number a calendar grid computes with. */
export const WEEK_START_DAY: Record<WeekStart, number> = { monday: 1, sunday: 0, saturday: 6 };

// ── Responses ───────────────────────────────────────────────────────────────

/** GET /api/settings: the user's preferences by key, each value as getUserSettings parsed it (secrets masked). */
export const settingsListResponseSchema = z.object({ settings: z.record(z.string(), z.unknown()) });
export type SettingsListResponse = z.infer<typeof settingsListResponseSchema>;

/**
 * PUT /api/settings: the key echoed back with what happened to it. `value` when it was
 * written, `unchanged` when the masked secret came back as it was, `managed` when a
 * managed install keeps the key.
 */
export const settingUpsertResponseSchema = z.object({
  success: z.literal(true),
  key: z.string(),
  value: z.unknown().optional(),
  unchanged: z.literal(true).optional(),
  managed: z.literal(true).optional(),
});
export type SettingUpsertResponse = z.infer<typeof settingUpsertResponseSchema>;

/** POST /api/settings/bulk: how many keys were written, and the managed keys left alone (only when there were any). */
export const settingsBulkResponseSchema = z.object({
  success: z.literal(true),
  updated: z.number(),
  managed_keys: z.array(z.string()).optional(),
});
export type SettingsBulkResponse = z.infer<typeof settingsBulkResponseSchema>;

/** GET/PUT /api/admin/default-user-settings: the stored defaults a new account starts with, by key. */
export const adminDefaultUserSettingsResponseSchema = z.record(z.string(), z.unknown());
export type AdminDefaultUserSettingsResponse = z.infer<typeof adminDefaultUserSettingsResponseSchema>;

/**
 * The planner's view switches a traveller expects to find again on any device
 * (#2639): road trip mode, the recorded Dawarich trail and the whole-trip route
 * overview. One settings row per user, keyed by trip id, holding only the
 * switches that are on; a trip without any is left out instead of stored as a
 * row of falses. The server drops trips the user can no longer open on every
 * write, so a deleted trip does not linger in the row.
 */
export const PLANNER_TRIP_VIEWS_KEY = 'planner_trip_views';
/** More trips than anyone keeps open at once; it bounds the row, not a person. */
export const PLANNER_TRIP_VIEWS_MAX = 500;

export const plannerTripViewSchema = z.object({
  roadtrip: z.boolean().optional(),
  dawarich: z.boolean().optional(),
  overview: z.boolean().optional(),
});
export type PlannerTripView = z.infer<typeof plannerTripViewSchema>;
export type PlannerTripViewFlag = keyof PlannerTripView;

export const plannerTripViewsSchema = z
  .record(z.string().regex(/^[1-9]\d{0,9}$/), plannerTripViewSchema)
  .refine((views) => Object.keys(views).length <= PLANNER_TRIP_VIEWS_MAX, {
    message: `At most ${PLANNER_TRIP_VIEWS_MAX} trips`,
  });
export type PlannerTripViews = z.infer<typeof plannerTripViewsSchema>;

/** The views with every trip that has no switch on left out. */
export function compactPlannerTripViews(views: PlannerTripViews): PlannerTripViews {
  const kept: PlannerTripViews = {};
  for (const [tripId, view] of Object.entries(views)) {
    const on: PlannerTripView = {};
    if (view.roadtrip) on.roadtrip = true;
    if (view.dawarich) on.dawarich = true;
    if (view.overview) on.overview = true;
    if (Object.keys(on).length > 0) kept[tripId] = on;
  }
  return kept;
}
