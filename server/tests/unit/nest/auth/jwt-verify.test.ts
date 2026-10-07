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
 *
 * Plan 3b Task 1: `verifyJwtAndLoadUser` now takes an explicit `UsersRepository`
 * parameter instead of reading the legacy `db` proxy — this file stubs
 * `findByIdWithPasswordVersion` directly (a fake repository object, exactly
 * the shape `Users.repository.test.ts` proves against real rows) rather than
 * mocking `src/db/database`'s module-level `db` export, which this file no
 * longer imports at all.
 */
import type { UsersRepository, UserWithPasswordVersion } from '../../../../src/db/repositories/Users.repository';
import { extractToken, verifyJwtAndLoadUser } from '../../../../src/nest/auth/jwt-verify';

import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../../../src/config', () => ({ JWT_SECRET: 'test-secret' }));

function makeReq(
  overrides: {
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
): Request {
  return {
    cookies: overrides.cookies || {},
    headers: overrides.headers || {},
  } as unknown as Request;
}

/**
 * A fake `UsersRepository` whose `findByIdWithPasswordVersion` returns the
 * given row.
 *
 * `password_version` is widened to `number | null` here, unlike the real
 * `UserWithPasswordVersion.password_version: number` — the column is
 * `INTEGER NOT NULL DEFAULT 0`, so a real row can never carry `null`, but
 * AUTH-JWT-009 (task-1-review.md F5) still needs to pin
 * `verifyJwtAndLoadUser`'s `typeof row.password_version === 'number' ? … :
 * 0` fallback branch, which is otherwise unreachable through the real type.
 * Widening the fake, not `UserWithPasswordVersion` itself (which would
 * loosen a production type for a test-only case), keeps that column's real
 * NOT-NULL guarantee intact everywhere else.
 */
function usersRepo(
  row: (Omit<UserWithPasswordVersion, 'password_version'> & { password_version: number | null }) | null,
): UsersRepository {
  return { findByIdWithPasswordVersion: vi.fn(async () => row) } as unknown as UsersRepository;
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
  it('AUTH-JWT-001: returns the user for a valid token, without password_version', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 0,
    });
    const token = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(token, users)).toEqual({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
    });
    expect(users.findByIdWithPasswordVersion).toHaveBeenCalledWith(1);
  });

  it('AUTH-JWT-002: returns null for a malformed token', async () => {
    expect(await verifyJwtAndLoadUser('invalid.jwt.token', usersRepo(null))).toBeNull();
  });

  it('AUTH-JWT-003: returns null when the user no longer exists', async () => {
    const users = usersRepo(null);
    expect(
      await verifyJwtAndLoadUser(jwt.sign({ id: 99999 }, 'test-secret', { algorithm: 'HS256' }), users),
    ).toBeNull();
  });

  it('AUTH-JWT-004: returns null for an expired token', async () => {
    const expired = jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 3600 }, 'test-secret', {
      algorithm: 'HS256',
    });
    expect(await verifyJwtAndLoadUser(expired, usersRepo(null))).toBeNull();
  });

  it('AUTH-JWT-005: returns null for a token signed with the wrong secret', async () => {
    expect(
      await verifyJwtAndLoadUser(jwt.sign({ id: 1 }, 'wrong-secret', { algorithm: 'HS256' }), usersRepo(null)),
    ).toBeNull();
  });

  it('AUTH-JWT-006: rejects a purpose-scoped mfa_login token even when the user is valid', async () => {
    // Issued after the password check but before TOTP, signed with the same
    // secret. It must never authenticate an ordinary request.
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 0,
    });
    const mfaToken = jwt.sign({ id: 1, purpose: 'mfa_login' }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(mfaToken, users)).toBeNull();
    expect(users.findByIdWithPasswordVersion).not.toHaveBeenCalled();
  });

  it('AUTH-JWT-007: rejects a token whose password_version predates the user row', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 2,
    });
    const stale = jwt.sign({ id: 1, pv: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(stale, users)).toBeNull();
  });

  it('AUTH-JWT-008: accepts a token whose password_version matches', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 2,
    });
    const current = jwt.sign({ id: 1, pv: 2 }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(current, users)).not.toBeNull();
  });

  it('AUTH-JWT-009: a pre-pv token still works against a row whose password_version reads as unset (both fall back to 0)', async () => {
    // password_version: null pins the `typeof row.password_version === 'number' ? … : 0`
    // fallback branch directly (task-1-review.md F5) — unreachable through
    // the real UsersRepository, whose column is NOT NULL DEFAULT 0, but
    // worth keeping covered rather than deleting the branch it guards.
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: null,
    });
    const legacy = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(legacy, users)).not.toBeNull();
  });

  it('AUTH-JWT-010: but a pre-pv token stops working once the user has reset', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 1,
    });
    const legacy = jwt.sign({ id: 1 }, 'test-secret', { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(legacy, users)).toBeNull();
  });
});
