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
