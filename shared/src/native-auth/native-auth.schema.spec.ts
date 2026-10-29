import { nativeExchangeRequestSchema, nativeHandoffRequestSchema } from './native-auth.schema';

import { describe, it, expect } from 'vitest';

const challenge = 'a'.repeat(64);

describe('nativeHandoffRequestSchema', () => {
  it('accepts a lowercase hex sha256', () => {
    expect(nativeHandoffRequestSchema.safeParse({ challenge }).success).toBe(true);
  });

  it('rejects anything that is not 64 lowercase hex characters', () => {
    expect(nativeHandoffRequestSchema.safeParse({ challenge: 'A'.repeat(64) }).success).toBe(false);
    expect(nativeHandoffRequestSchema.safeParse({ challenge: 'a'.repeat(63) }).success).toBe(false);
    expect(nativeHandoffRequestSchema.safeParse({ challenge: 'z'.repeat(64) }).success).toBe(false);
    expect(nativeHandoffRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('nativeExchangeRequestSchema', () => {
  it('requires a code and a verifier of at least 43 characters', () => {
    expect(nativeExchangeRequestSchema.safeParse({ code: 'c', verifier: 'v'.repeat(43) }).success).toBe(true);
    expect(nativeExchangeRequestSchema.safeParse({ code: 'c', verifier: 'v'.repeat(42) }).success).toBe(false);
    expect(nativeExchangeRequestSchema.safeParse({ code: '', verifier: 'v'.repeat(43) }).success).toBe(false);
    expect(nativeExchangeRequestSchema.safeParse({ verifier: 'v'.repeat(43) }).success).toBe(false);
  });
});
