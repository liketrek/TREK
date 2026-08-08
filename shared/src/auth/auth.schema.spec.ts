import {
  registerRequestSchema,
  loginRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  changePasswordRequestSchema,
  mfaVerifyLoginRequestSchema,
  mfaEnableRequestSchema,
  mfaDisableRequestSchema,
  mcpTokenCreateRequestSchema,
  mapsKeyUpdateRequestSchema,
  apiKeysUpdateRequestSchema,
  settingsUpdateRequestSchema,
  appSettingsUpdateRequestSchema,
  resourceTokenRequestSchema,
  passkeyRegisterOptionsRequestSchema,
  passkeyRegisterVerifyRequestSchema,
  passkeyLoginVerifyRequestSchema,
  passkeyRenameRequestSchema,
  passkeyDeleteRequestSchema,
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
    expect(mfaDisableRequestSchema.safeParse({ password: 'pw', code: '123456' }).success).toBe(true);
    expect(mfaDisableRequestSchema.safeParse({ code: '123456' }).success).toBe(false);
    expect(mcpTokenCreateRequestSchema.safeParse({ name: 'CLI' }).success).toBe(true);
    expect(mcpTokenCreateRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('api-key / settings schemas', () => {
  it('mapsKey accepts a string, an explicit null (clear) and omission', () => {
    expect(mapsKeyUpdateRequestSchema.safeParse({ maps_api_key: 'k' }).success).toBe(true);
    expect(mapsKeyUpdateRequestSchema.safeParse({ maps_api_key: null }).success).toBe(true);
    expect(mapsKeyUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(mapsKeyUpdateRequestSchema.safeParse({ maps_api_key: 7 }).success).toBe(false);
  });

  it('apiKeys is a per-key partial with nullable values', () => {
    expect(apiKeysUpdateRequestSchema.safeParse({ unsplash_api_key: null }).success).toBe(true);
    expect(apiKeysUpdateRequestSchema.safeParse({ maps_api_key: 'k', openweather_api_key: 'w' }).success).toBe(true);
    expect(apiKeysUpdateRequestSchema.safeParse({}).success).toBe(true);
  });

  it('settings accepts profile + key fields, all optional', () => {
    expect(settingsUpdateRequestSchema.safeParse({ username: 'alice' }).success).toBe(true);
    expect(settingsUpdateRequestSchema.safeParse({ email: 'a@b.c', maps_api_key: null }).success).toBe(true);
    expect(settingsUpdateRequestSchema.safeParse({ username: 42 }).success).toBe(false);
  });

  it('appSettings is an open string-keyed map (the server owns the key allow-list)', () => {
    expect(appSettingsUpdateRequestSchema.safeParse({ require_mfa: true, smtp_host: 'mail' }).success).toBe(true);
    expect(appSettingsUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(appSettingsUpdateRequestSchema.safeParse('nope').success).toBe(false);
  });

  it('resourceToken keeps purpose an optional string (the 400 is a service rule)', () => {
    expect(resourceTokenRequestSchema.safeParse({ purpose: 'download' }).success).toBe(true);
    expect(resourceTokenRequestSchema.safeParse({}).success).toBe(true);
    expect(resourceTokenRequestSchema.safeParse({ purpose: 5 }).success).toBe(false);
  });
});

describe('passkey schemas', () => {
  it('registerOptions keeps password optional (the 401 is a service rule)', () => {
    expect(passkeyRegisterOptionsRequestSchema.safeParse({ password: 'pw' }).success).toBe(true);
    expect(passkeyRegisterOptionsRequestSchema.safeParse({}).success).toBe(true);
    expect(passkeyRegisterOptionsRequestSchema.safeParse({ password: 5 }).success).toBe(false);
  });

  it('ceremony payloads stay permissive — the WebAuthn verifier owns validation', () => {
    expect(
      passkeyRegisterVerifyRequestSchema.safeParse({ attestationResponse: { id: 'x' }, name: 'Key' }).success,
    ).toBe(true);
    expect(passkeyRegisterVerifyRequestSchema.safeParse({}).success).toBe(true);
    expect(passkeyLoginVerifyRequestSchema.safeParse({ assertionResponse: { id: 'x' } }).success).toBe(true);
    expect(passkeyLoginVerifyRequestSchema.safeParse({}).success).toBe(true);
  });

  it("rename keeps name unknown (the 'Name is required' 400 is a service rule)", () => {
    expect(passkeyRenameRequestSchema.safeParse({ name: 'My Key' }).success).toBe(true);
    expect(passkeyRenameRequestSchema.safeParse({}).success).toBe(true);
    expect(passkeyRenameRequestSchema.safeParse({ name: 42 }).success).toBe(true); // service-side sanitize owns the 400
  });

  it('delete rejects a non-string password (used to 500 in bcrypt) but keeps omission a service rule', () => {
    expect(passkeyDeleteRequestSchema.safeParse({ password: 'pw' }).success).toBe(true);
    expect(passkeyDeleteRequestSchema.safeParse({}).success).toBe(true);
    expect(passkeyDeleteRequestSchema.safeParse({ password: 123 }).success).toBe(false);
  });
});
