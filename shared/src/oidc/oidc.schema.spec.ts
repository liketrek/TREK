import {
  OIDC_LOGOUT_TOKEN_MAX_LENGTH,
  oidcBackchannelLogoutErrorSchema,
  oidcBackchannelLogoutRequestSchema,
  oidcCallbackQuerySchema,
  oidcExchangeQuerySchema,
  oidcLoginQuerySchema,
} from './oidc.schema';

import { describe, it, expect } from 'vitest';

describe('oidcLoginQuerySchema', () => {
  it('accepts invite and remember flags, both optional', () => {
    expect(oidcLoginQuerySchema.safeParse({}).success).toBe(true);
    expect(oidcLoginQuerySchema.safeParse({ invite: 'tok' }).success).toBe(true);
    expect(oidcLoginQuerySchema.safeParse({ remember: '1' }).success).toBe(true);
    expect(oidcLoginQuerySchema.safeParse({ invite: 'tok', remember: '0' }).success).toBe(true);
  });

  it('rejects remember values other than the "0"/"1" wire flags', () => {
    expect(oidcLoginQuerySchema.safeParse({ remember: 'yes' }).success).toBe(false);
    expect(oidcLoginQuerySchema.safeParse({ remember: 'true' }).success).toBe(false);
    expect(oidcLoginQuerySchema.safeParse({ remember: 1 }).success).toBe(false);
  });
});

describe('oidcCallbackQuerySchema', () => {
  it('accepts code+state, an error, or nothing (all optional)', () => {
    expect(oidcCallbackQuerySchema.safeParse({ code: 'c', state: 's' }).success).toBe(true);
    expect(oidcCallbackQuerySchema.safeParse({ error: 'access_denied' }).success).toBe(true);
    expect(oidcCallbackQuerySchema.safeParse({}).success).toBe(true);
  });
});

describe('oidcExchangeQuerySchema', () => {
  it('requires a code', () => {
    expect(oidcExchangeQuerySchema.safeParse({ code: 'c' }).success).toBe(true);
    expect(oidcExchangeQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe('oidcBackchannelLogoutRequestSchema', () => {
  it('requires a non-empty logout_token string', () => {
    expect(oidcBackchannelLogoutRequestSchema.safeParse({ logout_token: 'a.b.c' }).success).toBe(true);
    expect(oidcBackchannelLogoutRequestSchema.safeParse({}).success).toBe(false);
    expect(oidcBackchannelLogoutRequestSchema.safeParse({ logout_token: '' }).success).toBe(false);
  });

  it('refuses a token that is not one string (a repeated form field parses to an array)', () => {
    expect(oidcBackchannelLogoutRequestSchema.safeParse({ logout_token: ['a', 'b'] }).success).toBe(false);
    expect(oidcBackchannelLogoutRequestSchema.safeParse({ logout_token: 5 }).success).toBe(false);
  });

  it('refuses a token past the length cap', () => {
    const long = 'a'.repeat(OIDC_LOGOUT_TOKEN_MAX_LENGTH + 1);
    expect(oidcBackchannelLogoutRequestSchema.safeParse({ logout_token: long }).success).toBe(false);
  });
});

describe('oidcBackchannelLogoutErrorSchema', () => {
  it('describes the spec 2.8 error body', () => {
    expect(
      oidcBackchannelLogoutErrorSchema.safeParse({ error: 'invalid_request', error_description: 'x' }).success,
    ).toBe(true);
    expect(oidcBackchannelLogoutErrorSchema.safeParse({ error: 'server_error', error_description: 'x' }).success).toBe(
      false,
    );
  });
});
