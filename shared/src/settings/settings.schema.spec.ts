import { settingUpsertRequestSchema, settingsBulkRequestSchema, MASKED_SETTING_VALUE } from './settings.schema';

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
