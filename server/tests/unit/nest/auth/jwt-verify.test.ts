/**
 * The canonical JWT session check, moved here with the verify itself.
 *
 * These assertions come from tests/unit/middleware/auth.test.ts, which exercised
 * them through the Express `authenticate` middleware — a wrapper that no longer
 * exists. They now hit verifyJwtAndLoadUser directly, so a 401 is expressed as
 * "returns null" rather than "sets status 401"; the guards own the status codes
 * and assert them in auth-guard.test.ts.
 *
 * The password_version gate gets direct cases here for the first time. It is the
 * reason this function exists at all: a reset bumps users.password_version and
 * every JWT carrying the prior value has to stop working.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../../../src/db/database', () => ({
  db: { prepare: vi.fn(() => ({ get: vi.fn(), all: vi.fn() })) },
}));
vi.mock('../../../../src/config', () => ({ JWT_SECRET: 'test-secret' }));

import { extractToken, verifyJwtAndLoadUser } from '../../../../src/nest/auth/jwt-verify';
import { db } from '../../../../src/db/database';
import type { Request } from 'express';

function makeReq(overrides: {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
} = {}): Request {
  return {
    cookies: overrides.cookies || {},
    headers: overrides.headers || {},
  } as unknown as Request;
}

/** Stub the single users row the verify reads. */
function userRow(row: Record<string, unknown> | undefined): void {
  vi.mocked(db.prepare).mockReturnValue({ get: vi.fn(() => row), all: vi.fn() } as never);
}

afterEach(() => vi.clearAllMocks());

describe('extractToken', () => {
  it('returns cookie value when trek_session cookie is set', () => {
    expect(extractToken(makeReq({ cookies: { trek_session: 'cookie-token' } }))).toBe('cookie-token');
  });

  it('returns Bearer token from Authorization header when no cookie', () => {
    expect(extractToken(makeReq({ headers: { authorization: 'Bearer header-token' } }))).toBe('header-token');
  });

  it('prefers cookie over Authorization header when both are present', () => {
    const req = makeReq({
      cookies: { trek_session: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' },
    });
    expect(extractToken(req)).toBe('cookie-token');
  });

  it('returns null when neither cookie nor header are present', () => {
    expect(extractToken(makeReq())).toBeNull();
  });

  it('returns null for Authorization header without a token (empty Bearer)', () => {
    expect(extractToken(makeReq({ headers: { authorization: 'Bearer ' } }))).toBeNull();
  });

  it('returns the second word for a non-Bearer scheme — it splits on space, it does not parse', () => {
    expect(extractToken(makeReq({ headers: { authorization: 'Basic sometoken' } }))).toBe('sometoken');
  });
});

describe('verifyJwtAndLoadUser', () => {
  it('AUTH-JWT-001: returns the user for a valid token, without password_version', () => {
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 0 });
    const token = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(token)).toEqual({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user' });
  });

  it('AUTH-JWT-002: returns null for a malformed token', () => {
    expect(verifyJwtAndLoadUser('invalid.jwt.token')).toBeNull();
  });

  it('AUTH-JWT-003: returns null when the user no longer exists', () => {
    userRow(undefined);
    expect(verifyJwtAndLoadUser(jwt.sign({ id: 99999 }, 'test-secret', { algorithm: 'HS256' }))).toBeNull();
  });

  it('AUTH-JWT-004: returns null for an expired token', () => {
    const expired = jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 3600 }, 'test-secret', { algorithm: 'HS256' });
    expect(verifyJwtAndLoadUser(expired)).toBeNull();
  });

  it('AUTH-JWT-005: returns null for a token signed with the wrong secret', () => {
    expect(verifyJwtAndLoadUser(jwt.sign({ id: 1 }, 'wrong-secret', { algorithm: 'HS256' }))).toBeNull();
  });

  it('AUTH-JWT-006: rejects a purpose-scoped mfa_login token even when the user is valid', () => {
    // Issued after the password check but before TOTP, signed with the same
    // secret. It must never authenticate an ordinary request.
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 0 });
    const mfaToken = jwt.sign({ id: 1, purpose: 'mfa_login' }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(mfaToken)).toBeNull();
  });

  it('AUTH-JWT-007: rejects a token whose password_version predates the user row', () => {
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 2 });
    const stale = jwt.sign({ id: 1, pv: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(stale)).toBeNull();
  });

  it('AUTH-JWT-008: accepts a token whose password_version matches', () => {
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 2 });
    const current = jwt.sign({ id: 1, pv: 2 }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(current)).not.toBeNull();
  });

  it('AUTH-JWT-009: a pre-pv token still works against a never-reset user (both read as 0)', () => {
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: null });
    const legacy = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(legacy)).not.toBeNull();
  });

  it('AUTH-JWT-010: but a pre-pv token stops working once the user has reset', () => {
    userRow({ id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 1 });
    const legacy = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(verifyJwtAndLoadUser(legacy)).toBeNull();
  });
});
