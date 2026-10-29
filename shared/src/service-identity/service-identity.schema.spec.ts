import {
  serviceChallengeSchema,
  serviceIdentityStatusSchema,
  serviceKeyGrantSchema,
  serviceQuotaSchema,
} from './service-identity.schema';

import { describe, it, expect } from 'vitest';

const challenge = { c: 'v1.abc', alg: 'scrypt', N: 16_384, r: 8, p: 1, bits: 6, expires_at: 1_793_000_600 };

describe('serviceChallengeSchema', () => {
  it('accepts the challenge the issuer sends today', () => {
    expect(serviceChallengeSchema.parse(challenge)).toEqual(challenge);
  });

  it('refuses parameters a small server could not afford', () => {
    expect(serviceChallengeSchema.safeParse({ ...challenge, N: 1 << 20 }).success).toBe(false);
    expect(serviceChallengeSchema.safeParse({ ...challenge, r: 64 }).success).toBe(false);
    expect(serviceChallengeSchema.safeParse({ ...challenge, bits: 40 }).success).toBe(false);
  });

  it('refuses an N that is not a power of two, and any other algorithm', () => {
    expect(serviceChallengeSchema.safeParse({ ...challenge, N: 15_000 }).success).toBe(false);
    expect(serviceChallengeSchema.safeParse({ ...challenge, alg: 'argon2id' }).success).toBe(false);
  });
});

describe('serviceKeyGrantSchema and serviceQuotaSchema', () => {
  it('read the issuer answers', () => {
    expect(serviceKeyGrantSchema.parse({ key: 'tk1.a.b.c', exp: 2, renew_after: 1 }).key).toBe('tk1.a.b.c');
    const quota = { tier: 'std', limit: 10_000, used: 40, remaining: 9_960, reset_at: 1_793_059_200, per_minute: 120 };
    expect(serviceQuotaSchema.parse(quota)).toEqual(quota);
  });

  it('refuses a tier it does not know and a negative count', () => {
    const quota = { tier: 'std', limit: 1, used: 0, remaining: 1, reset_at: 1, per_minute: 1 };
    expect(serviceQuotaSchema.safeParse({ ...quota, tier: 'gold' }).success).toBe(false);
    expect(serviceQuotaSchema.safeParse({ ...quota, used: -1 }).success).toBe(false);
  });
});

describe('serviceIdentityStatusSchema', () => {
  it('describes an installation that is switched off', () => {
    const off = { state: 'off', tier: null, keySource: null, services: [], lastSeenAt: null };
    expect(serviceIdentityStatusSchema.parse(off)).toEqual(off);
  });

  it('describes a connected one with the allowance of each service', () => {
    const quota = { limit: 10_000, used: 12, remaining: 9_988, resetAt: '2026-10-30T00:00:00.000Z' };
    const connected = {
      state: 'connected',
      tier: 'std',
      keySource: 'registered',
      services: [
        { service: 'places', inUse: true, quota },
        { service: 'photon', inUse: false, quota: null },
        { service: 'valhalla', inUse: true, quota },
      ],
      lastSeenAt: '2026-10-29T12:00:00.000Z',
    };
    expect(serviceIdentityStatusSchema.parse(connected)).toEqual(connected);
  });

  it('knows only the three services', () => {
    const status = { state: 'connected', tier: null, keySource: null, lastSeenAt: null };
    const unknown = [{ service: 'nominatim', inUse: true, quota: null }];
    expect(serviceIdentityStatusSchema.safeParse({ ...status, services: unknown }).success).toBe(false);
  });
});
