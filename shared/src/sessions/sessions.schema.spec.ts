import {
  userSessionIdSchema,
  userSessionListResponseSchema,
  userSessionRevokeOthersResponseSchema,
  userSessionRevokeParamsSchema,
  userSessionRevokeResponseSchema,
  userSessionSchema,
} from './sessions.schema';

import { describe, expect, it } from 'vitest';

const ID = '0b7c6f3e-2a51-4c8e-9d43-5f1e2b7a9c10';

const session = {
  id: ID,
  created_at: '2026-10-01 08:00:00',
  last_seen_at: '2026-10-02 09:30:00',
  expires_at: '2026-10-31 08:00:00',
  user_agent: 'Mozilla/5.0',
  current: true,
};

describe('userSessionIdSchema', () => {
  it('accepts a uuid', () => {
    expect(userSessionIdSchema.safeParse(ID).success).toBe(true);
  });

  it('rejects anything that is not a uuid', () => {
    expect(userSessionIdSchema.safeParse('42').success).toBe(false);
    expect(userSessionIdSchema.safeParse('').success).toBe(false);
    expect(userSessionIdSchema.safeParse(`${ID}x`).success).toBe(false);
  });
});

describe('userSessionRevokeParamsSchema', () => {
  it('takes the id from the path', () => {
    expect(userSessionRevokeParamsSchema.parse({ id: ID })).toEqual({ id: ID });
  });

  it('refuses a malformed id', () => {
    expect(userSessionRevokeParamsSchema.safeParse({ id: 'not-a-session' }).success).toBe(false);
  });
});

describe('userSessionSchema', () => {
  it('accepts a listed session', () => {
    expect(userSessionSchema.parse(session)).toEqual(session);
  });

  it('allows a session without a user agent', () => {
    expect(userSessionSchema.safeParse({ ...session, user_agent: null }).success).toBe(true);
  });

  it('requires the current flag to be a boolean', () => {
    expect(userSessionSchema.safeParse({ ...session, current: 1 }).success).toBe(false);
  });
});

describe('userSessionListResponseSchema', () => {
  it('wraps the sessions with the tracked flag', () => {
    const body = { sessions: [session], current_tracked: true };
    expect(userSessionListResponseSchema.parse(body)).toEqual(body);
  });

  it('accepts an empty list for a request made with an untracked token', () => {
    expect(userSessionListResponseSchema.safeParse({ sessions: [], current_tracked: false }).success).toBe(true);
  });
});

describe('revoke responses', () => {
  it('pins the single revoke body', () => {
    expect(userSessionRevokeResponseSchema.safeParse({ success: true }).success).toBe(true);
    expect(userSessionRevokeResponseSchema.safeParse({ success: false }).success).toBe(false);
  });

  it('counts the sessions signed out', () => {
    expect(userSessionRevokeOthersResponseSchema.safeParse({ success: true, revoked: 2 }).success).toBe(true);
    expect(userSessionRevokeOthersResponseSchema.safeParse({ success: true, revoked: -1 }).success).toBe(false);
    expect(userSessionRevokeOthersResponseSchema.safeParse({ success: true, revoked: 1.5 }).success).toBe(false);
  });
});
