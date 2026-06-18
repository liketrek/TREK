import {
  adminUserCreateRequestSchema,
  adminPermissionsRequestSchema,
  adminInviteCreateRequestSchema,
  adminFeatureToggleRequestSchema,
} from './admin.schema';

import { describe, it, expect } from 'vitest';

describe('adminUserCreateRequestSchema', () => {
  it('requires an email; role limited to user/admin', () => {
    expect(
      adminUserCreateRequestSchema.safeParse({
        email: 'a@b.c',
        password: 'p',
        role: 'admin',
      }).success,
    ).toBe(true);
    expect(adminUserCreateRequestSchema.safeParse({ email: 'a@b.c' }).success).toBe(true);
    expect(adminUserCreateRequestSchema.safeParse({ password: 'p' }).success).toBe(false);
    expect(adminUserCreateRequestSchema.safeParse({ email: 'a@b.c', role: 'root' }).success).toBe(false);
  });
});

describe('adminPermissionsRequestSchema', () => {
  it('requires a permissions record', () => {
    expect(
      adminPermissionsRequestSchema.safeParse({
        permissions: { trip_edit: { user: true } },
      }).success,
    ).toBe(true);
    expect(adminPermissionsRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('adminInviteCreateRequestSchema', () => {
  it('accepts optional uses/expiry/role', () => {
    expect(
      adminInviteCreateRequestSchema.safeParse({
        max_uses: 5,
        expires_in_days: 7,
      }).success,
    ).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({}).success).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({ role: 'root' }).success).toBe(false);
  });
});

describe('adminFeatureToggleRequestSchema', () => {
  it('requires a boolean enabled', () => {
    expect(adminFeatureToggleRequestSchema.safeParse({ enabled: true }).success).toBe(true);
    expect(adminFeatureToggleRequestSchema.safeParse({ enabled: 'yes' }).success).toBe(false);
  });
});
