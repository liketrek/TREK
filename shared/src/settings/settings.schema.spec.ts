import {
  commonCurrencyListSchema,
  settingResetKeySchema,
  settingResetResponseSchema,
  settingUpsertRequestSchema,
  settingsBulkRequestSchema,
  MASKED_SETTING_VALUE,
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
  it('normalizes supported codes to uppercase while preserving order', () => {
    expect(commonCurrencyListSchema.parse([' usd ', 'eur', 'CNH'])).toEqual(['USD', 'EUR', 'CNH']);
  });

  it('rejects invalid types, unknown codes, case-insensitive duplicates, and more than ten codes', () => {
    expect(commonCurrencyListSchema.safeParse('USD').success).toBe(false);
    expect(commonCurrencyListSchema.safeParse(['USD', 123]).success).toBe(false);
    expect(commonCurrencyListSchema.safeParse(['ZZZ']).success).toBe(false);
    expect(commonCurrencyListSchema.safeParse(['usd', 'USD']).success).toBe(false);
    expect(
      commonCurrencyListSchema.safeParse(['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM'])
        .success,
    ).toBe(false);
  });
});

describe('settingResetKeySchema', () => {
  it('only accepts the common currency reset key', () => {
    expect(settingResetKeySchema.parse('common_currencies')).toBe('common_currencies');
    expect(settingResetKeySchema.safeParse('language').success).toBe(false);
  });
});

describe('settingResetResponseSchema', () => {
  it('accepts a complete common currency reset response', () => {
    expect(
      settingResetResponseSchema.parse({ success: true, key: 'common_currencies', value: [' usd ', 'EUR'] }),
    ).toEqual({ success: true, key: 'common_currencies', value: ['USD', 'EUR'] });
  });

  it('rejects an incorrect key, a non-list value, invalid currencies, and extra fields', () => {
    expect(settingResetResponseSchema.safeParse({ success: true, key: 'language', value: ['USD'] }).success).toBe(
      false,
    );
    expect(
      settingResetResponseSchema.safeParse({ success: true, key: 'common_currencies', value: 'USD' }).success,
    ).toBe(false);
    expect(
      settingResetResponseSchema.safeParse({ success: true, key: 'common_currencies', value: ['ZZZ'] }).success,
    ).toBe(false);
    expect(
      settingResetResponseSchema.safeParse({
        success: true,
        key: 'common_currencies',
        value: ['USD'],
        unexpected: true,
      }).success,
    ).toBe(false);
  });
});
