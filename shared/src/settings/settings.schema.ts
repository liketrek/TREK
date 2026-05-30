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
