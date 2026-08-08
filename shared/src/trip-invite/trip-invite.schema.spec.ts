import { tripInviteLinkCreateRequestSchema } from './trip-invite.schema';

import { describe, it, expect } from 'vitest';

describe('tripInviteLinkCreateRequestSchema', () => {
  it('accepts an empty body (no expiry chosen)', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({}).success).toBe(true);
  });

  it('accepts an explicit null (the client always sends the key)', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: null }).success).toBe(true);
  });

  it('accepts a number and a digits-only string (legacy form input)', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: 7 }).success).toBe(true);
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: '7' }).success).toBe(true);
  });

  it('accepts the empty string (blank form input means no expiry)', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: '' }).success).toBe(true);
  });

  it('rejects non-numeric strings instead of parseInt-ing them', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: '7abc' }).success).toBe(false);
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: 'never' }).success).toBe(false);
  });

  it('rejects non-scalar values', () => {
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: {} }).success).toBe(false);
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: [7] }).success).toBe(false);
    expect(tripInviteLinkCreateRequestSchema.safeParse({ expires_in_days: true }).success).toBe(false);
  });
});
