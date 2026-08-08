import {
  adminUserCreateRequestSchema,
  adminUserUpdateRequestSchema,
  adminPermissionsRequestSchema,
  adminInviteCreateRequestSchema,
  adminFeatureToggleRequestSchema,
  adminTemplateNameRequestSchema,
  adminOidcUpdateRequestSchema,
  adminAddonUpdateRequestSchema,
  adminCollabFeaturesRequestSchema,
  adminNotificationPreferencesRequestSchema,
  adminDefaultUserSettingsRequestSchema,
  adminTestNotificationRequestSchema,
} from './admin.schema';

import { describe, it, expect } from 'vitest';

describe('adminUserCreateRequestSchema', () => {
  it('accepts the full body the client sends', () => {
    expect(
      adminUserCreateRequestSchema.safeParse({
        username: 'u',
        email: 'a@b.c',
        password: 'p',
        role: 'admin',
      }).success,
    ).toBe(true);
  });

  it('leaves the missing-field and invalid-role 400s to the service', () => {
    // All fields optional: the service answers 'Username, email and password are required'.
    expect(adminUserCreateRequestSchema.safeParse({}).success).toBe(true);
    // role is z.string(), not an enum: the service answers 'Invalid role'.
    expect(adminUserCreateRequestSchema.safeParse({ email: 'a@b.c', role: 'root' }).success).toBe(true);
  });

  it('rejects wrongly-typed fields and strips unknown keys', () => {
    expect(adminUserCreateRequestSchema.safeParse({ email: 42 }).success).toBe(false);
    expect(adminUserCreateRequestSchema.parse({ email: 'a@b.c', extra: 1 })).toEqual({ email: 'a@b.c' });
  });
});

describe('adminUserUpdateRequestSchema', () => {
  it('accepts partial updates, including an empty body', () => {
    expect(adminUserUpdateRequestSchema.safeParse({ role: 'user' }).success).toBe(true);
    expect(adminUserUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(adminUserUpdateRequestSchema.safeParse({ username: 5 }).success).toBe(false);
  });
});

describe('adminPermissionsRequestSchema', () => {
  it('requires a permissions record', () => {
    expect(adminPermissionsRequestSchema.safeParse({ permissions: { trip_edit: 'admin' } }).success).toBe(true);
    expect(adminPermissionsRequestSchema.safeParse({}).success).toBe(false);
    expect(adminPermissionsRequestSchema.safeParse({ permissions: null }).success).toBe(false);
  });

  it('keeps values unknown so bad levels land in the service `skipped` list, not a 400', () => {
    expect(adminPermissionsRequestSchema.safeParse({ permissions: { trip_edit: 'nonsense' } }).success).toBe(true);
  });
});

describe('adminInviteCreateRequestSchema', () => {
  it('accepts optional uses/expiry/role and both number and string ids', () => {
    expect(adminInviteCreateRequestSchema.safeParse({ max_uses: 5, expires_in_days: 7 }).success).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({ max_uses: '5', trip_id: '3' }).success).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({}).success).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({ trip_id: null }).success).toBe(true);
    expect(adminInviteCreateRequestSchema.safeParse({ role: 'root' }).success).toBe(false);
  });
});

describe('adminFeatureToggleRequestSchema', () => {
  it('requires a boolean enabled', () => {
    expect(adminFeatureToggleRequestSchema.safeParse({ enabled: true }).success).toBe(true);
    expect(adminFeatureToggleRequestSchema.safeParse({ enabled: 'yes' }).success).toBe(false);
    expect(adminFeatureToggleRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('adminTemplateNameRequestSchema', () => {
  it('keeps name optional so the service owns the "required" 400, and strips extras', () => {
    expect(adminTemplateNameRequestSchema.safeParse({ name: 'Beach' }).success).toBe(true);
    expect(adminTemplateNameRequestSchema.safeParse({}).success).toBe(true);
    expect(adminTemplateNameRequestSchema.parse({ name: 'Beach', description: 'x' })).toEqual({ name: 'Beach' });
    expect(adminTemplateNameRequestSchema.safeParse({ name: 7 }).success).toBe(false);
  });
});

describe('adminOidcUpdateRequestSchema', () => {
  it('accepts the client body and strips the extra oidc_only key', () => {
    const body = { issuer: 'https://i', client_id: 'c', display_name: 'd', discovery_url: 'u' };
    expect(adminOidcUpdateRequestSchema.safeParse(body).success).toBe(true);
    expect(adminOidcUpdateRequestSchema.parse({ ...body, oidc_only: false })).toEqual(body);
    // Empty strings must survive — they are the "clear SSO config" signal.
    expect(adminOidcUpdateRequestSchema.parse({ issuer: '', client_id: '' })).toEqual({ issuer: '', client_id: '' });
  });
});

describe('adminAddonUpdateRequestSchema', () => {
  it('accepts either shape and keeps config free-form', () => {
    expect(adminAddonUpdateRequestSchema.safeParse({ enabled: true }).success).toBe(true);
    const config = { provider: 'openai', model: 'm', apiKey: '••••', multimodal: true, nested: { a: 1 } };
    expect(adminAddonUpdateRequestSchema.parse({ config })).toEqual({ config });
    expect(adminAddonUpdateRequestSchema.safeParse({ enabled: 'yes' }).success).toBe(false);
  });
});

describe('adminCollabFeaturesRequestSchema', () => {
  it('accepts a single computed key', () => {
    expect(adminCollabFeaturesRequestSchema.safeParse({ chat: false }).success).toBe(true);
    expect(adminCollabFeaturesRequestSchema.safeParse({}).success).toBe(true);
    expect(adminCollabFeaturesRequestSchema.safeParse({ polls: 'no' }).success).toBe(false);
  });
});

describe('adminNotificationPreferencesRequestSchema', () => {
  it('accepts arbitrary event types and channel ids, including plugin channels', () => {
    expect(
      adminNotificationPreferencesRequestSchema.safeParse({
        trip_reminder: { email: true, 'plugin:acme': false },
      }).success,
    ).toBe(true);
    expect(adminNotificationPreferencesRequestSchema.safeParse({}).success).toBe(true);
    expect(adminNotificationPreferencesRequestSchema.safeParse({ x: { email: 'yes' } }).success).toBe(false);
  });
});

describe('adminDefaultUserSettingsRequestSchema', () => {
  it('keeps null as the reset sentinel and rejects non-objects', () => {
    expect(adminDefaultUserSettingsRequestSchema.parse({ theme: 'dark', density: null, compact: true })).toEqual({
      theme: 'dark',
      density: null,
      compact: true,
    });
    expect(adminDefaultUserSettingsRequestSchema.safeParse([]).success).toBe(false);
    expect(adminDefaultUserSettingsRequestSchema.safeParse(null).success).toBe(false);
  });
});

describe('adminTestNotificationRequestSchema', () => {
  it('accepts an empty body and both inApp shapes', () => {
    expect(adminTestNotificationRequestSchema.safeParse({}).success).toBe(true);
    expect(adminTestNotificationRequestSchema.safeParse({ event: 'trip_reminder', inApp: true }).success).toBe(true);
    expect(
      adminTestNotificationRequestSchema.safeParse({
        event: 'x',
        scope: 'admin',
        targetId: 1,
        params: { a: 'b' },
        inApp: { type: 'boolean', positiveCallback: { action: 'test_approve', payload: {} } },
      }).success,
    ).toBe(true);
    expect(adminTestNotificationRequestSchema.safeParse({ targetId: 'one' }).success).toBe(false);
  });
});
