import { oauthTokenRequestSchema, oauthConsentRequestSchema, oauthClientCreateRequestSchema } from './oauth.schema';

import { describe, it, expect } from 'vitest';

describe('oauthTokenRequestSchema', () => {
  it('is permissive across grant types and passes extras through', () => {
    expect(
      oauthTokenRequestSchema.safeParse({
        grant_type: 'authorization_code',
        client_id: 'c',
        code: 'x',
        redirect_uri: 'u',
        code_verifier: 'v',
      }).success,
    ).toBe(true);
    expect(
      oauthTokenRequestSchema.safeParse({
        grant_type: 'client_credentials',
        client_id: 'c',
        client_secret: 's',
        scope: 'a b',
      }).success,
    ).toBe(true);
    expect(oauthTokenRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('oauthConsentRequestSchema', () => {
  it('requires the PKCE consent fields + approved flag', () => {
    expect(
      oauthConsentRequestSchema.safeParse({
        client_id: 'c',
        redirect_uri: 'u',
        scope: 's',
        code_challenge: 'cc',
        code_challenge_method: 'S256',
        approved: true,
      }).success,
    ).toBe(true);
    expect(
      oauthConsentRequestSchema.safeParse({
        client_id: 'c',
        redirect_uri: 'u',
        scope: 's',
        code_challenge: 'cc',
        code_challenge_method: 'S256',
      }).success,
    ).toBe(false);
  });
});

describe('oauthClientCreateRequestSchema', () => {
  it('requires name + allowed_scopes', () => {
    expect(
      oauthClientCreateRequestSchema.safeParse({
        name: 'CLI',
        allowed_scopes: ['trips:read'],
      }).success,
    ).toBe(true);
    expect(oauthClientCreateRequestSchema.safeParse({ name: 'CLI' }).success).toBe(false);
    expect(oauthClientCreateRequestSchema.safeParse({ allowed_scopes: [] }).success).toBe(false);
  });
});
