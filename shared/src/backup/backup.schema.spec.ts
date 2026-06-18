import { autoBackupSettingsRequestSchema } from './backup.schema';

import { describe, it, expect } from 'vitest';

describe('autoBackupSettingsRequestSchema', () => {
  it('accepts the known toggles and stays permissive for extras', () => {
    expect(
      autoBackupSettingsRequestSchema.safeParse({
        enabled: true,
        interval: 'daily',
        keep_days: 7,
      }).success,
    ).toBe(true);
    expect(autoBackupSettingsRequestSchema.safeParse({ enabled: false, foo: 'bar' }).success).toBe(true);
    expect(autoBackupSettingsRequestSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a non-boolean enabled', () => {
    expect(autoBackupSettingsRequestSchema.safeParse({ enabled: 'yes' }).success).toBe(false);
  });
});
