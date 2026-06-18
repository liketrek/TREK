import { oidcCallbackQuerySchema, oidcExchangeQuerySchema } from './oidc.schema';

import { describe, it, expect } from 'vitest';

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
