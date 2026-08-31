import {
  COMMON_CURRENCIES_MAX,
  MASKED_SETTING_VALUE,
  commonCurrencyListSchema,
  settingResetKeySchema,
  settingResetResponseSchema,
  settingUpsertRequestSchema,
  settingsBulkRequestSchema,
} from './settings.schema';

import { describe, it, expect } from 'vitest';

describe('settingUpsertRequestSchema', () => {
  it('requires a key; value is any/optional', () => {
    expect(settingUpsertRequestSchema.safeParse({ key: 'theme', value: 'dark' }).success).toBe(true);
    expect(settingUpsertRequestSchema.safeParse({ key: 'theme' }).success).toBe(true);
    expect(settingUpsertRequestSchema.safeParse({ value: 'dark' }).success).toBe(false);
  });
});

describe('settingsBulkRequestSchema', () => {
  it('requires a settings record', () => {
    expect(settingsBulkRequestSchema.safeParse({ settings: { a: 1, b: 'x' } }).success).toBe(true);
    expect(settingsBulkRequestSchema.safeParse({ settings: {} }).success).toBe(true);
    expect(settingsBulkRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('MASKED_SETTING_VALUE', () => {
  it('is the bullet sentinel the client echoes for unchanged secrets', () => {
    expect(MASKED_SETTING_VALUE).toBe('••••••••');
  });
});

describe('commonCurrencyListSchema', () => {
  it('normalizes supported codes while preserving order', () => {
    expect(commonCurrencyListSchema.parse([' usd ', 'jpy'])).toEqual(['USD', 'JPY']);
  });

  it('rejects unsupported, duplicate, and oversized lists', () => {
    expect(commonCurrencyListSchema.safeParse(['ZZZ']).success).toBe(false);
    expect(commonCurrencyListSchema.safeParse(['usd', 'USD']).success).toBe(false);
    expect(
      commonCurrencyListSchema.safeParse(['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'CNY', 'HKD', 'AUD', 'CAD', 'NZD', 'SEK'])
        .success,
    ).toBe(false);
    expect(COMMON_CURRENCIES_MAX).toBe(10);
  });
});

describe('common currency reset contract', () => {
  it('accepts only the resettable setting and a normalized response', () => {
    expect(settingResetKeySchema.parse('common_currencies')).toBe('common_currencies');
    expect(settingResetKeySchema.safeParse('theme').success).toBe(false);
    expect(settingResetResponseSchema.parse({ success: true, key: 'common_currencies', value: [' usd '] })).toEqual({
      success: true,
      key: 'common_currencies',
      value: ['USD'],
    });
  });
});
