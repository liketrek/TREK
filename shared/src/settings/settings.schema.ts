import { FRANKFURTER_CURRENCY_SET } from '../exchange-rate/frankfurter-currencies';

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

export const COMMON_CURRENCIES_MAX = 10;

/** Ordered, user-managed shortcuts to currencies supported by our rate provider. */
export const commonCurrencyListSchema = z
  .array(
    z
      .string()
      .trim()
      .transform((code) => code.toUpperCase()),
  )
  .max(COMMON_CURRENCIES_MAX)
  .superRefine((codes, ctx) => {
    const seen = new Set<string>();
    codes.forEach((code, index) => {
      if (!FRANKFURTER_CURRENCY_SET.has(code)) {
        ctx.addIssue({ code: 'custom', path: [index], message: `Unsupported currency code: ${code}` });
      }
      if (seen.has(code)) {
        ctx.addIssue({ code: 'custom', path: [index], message: `Duplicate currency code: ${code}` });
      }
      seen.add(code);
    });
  });
export type CommonCurrencyList = z.infer<typeof commonCurrencyListSchema>;

export const settingResetKeySchema = z.literal('common_currencies');
export type SettingResetKey = z.infer<typeof settingResetKeySchema>;

export const settingResetResponseSchema = z
  .object({
    success: z.literal(true),
    key: settingResetKeySchema,
    value: commonCurrencyListSchema,
  })
  .strict();
export type SettingResetResponse = z.infer<typeof settingResetResponseSchema>;

export const settingUpsertRequestSchema = z.object({
  key: z.string().min(1),
  value: z.unknown().optional(),
});
export type SettingUpsertRequest = z.infer<typeof settingUpsertRequestSchema>;

export const settingsBulkRequestSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsBulkRequest = z.infer<typeof settingsBulkRequestSchema>;
