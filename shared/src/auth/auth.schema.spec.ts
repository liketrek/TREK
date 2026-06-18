import {
  registerRequestSchema,
  loginRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  changePasswordRequestSchema,
  mfaVerifyLoginRequestSchema,
  mfaEnableRequestSchema,
  mcpTokenCreateRequestSchema,
} from './auth.schema';

import { describe, it, expect } from 'vitest';

describe('registerRequestSchema', () => {
  it('requires email + password; username/invite optional', () => {
    expect(registerRequestSchema.safeParse({ email: 'a@b.c', password: 'pw' }).success).toBe(true);
    expect(
      registerRequestSchema.safeParse({
        email: 'a@b.c',
        password: 'pw',
        invite_token: 't',
      }).success,
    ).toBe(true);
    expect(registerRequestSchema.safeParse({ email: 'a@b.c' }).success).toBe(false);
  });
});

describe('loginRequestSchema', () => {
  it('requires email + password', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@b.c', password: 'pw' }).success).toBe(true);
    expect(loginRequestSchema.safeParse({ email: 'a@b.c' }).success).toBe(false);
  });
});

describe('forgot/reset/change password schemas', () => {
  it('validate their required fields', () => {
    expect(forgotPasswordRequestSchema.safeParse({ email: 'a@b.c' }).success).toBe(true);
    expect(resetPasswordRequestSchema.safeParse({ token: 't', new_password: 'pw' }).success).toBe(true);
    expect(
      resetPasswordRequestSchema.safeParse({
        token: 't',
        new_password: 'pw',
        mfa_code: '123456',
      }).success,
    ).toBe(true);
    expect(resetPasswordRequestSchema.safeParse({ new_password: 'pw' }).success).toBe(false);
    expect(
      changePasswordRequestSchema.safeParse({
        current_password: 'a',
        new_password: 'b',
      }).success,
    ).toBe(true);
    expect(changePasswordRequestSchema.safeParse({ new_password: 'b' }).success).toBe(false);
  });
});

describe('mfa + mcp-token schemas', () => {
  it('validate their fields', () => {
    expect(mfaVerifyLoginRequestSchema.safeParse({ mfa_token: 't', code: '123456' }).success).toBe(true);
    expect(mfaVerifyLoginRequestSchema.safeParse({ mfa_token: 't' }).success).toBe(false);
    expect(mfaEnableRequestSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(mcpTokenCreateRequestSchema.safeParse({ name: 'CLI' }).success).toBe(true);
    expect(mcpTokenCreateRequestSchema.safeParse({}).success).toBe(true);
  });
});
