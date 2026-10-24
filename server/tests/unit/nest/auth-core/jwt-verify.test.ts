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
import type { UserSessionsRepository } from '../../../../src/db/repositories/UserSessions.repository';
import type { UsersRepository, UserWithPasswordVersion } from '../../../../src/db/repositories/Users.repository';
import { dbNow } from '../../../../src/db/types';
import {
  SESSION_TOUCH_INTERVAL_MS,
  currentSessionId,
  extractToken,
  verifiedSessionClaims,
  verifyJwtAndLoadUser,
} from '../../../../src/nest/auth-core/jwt-verify';
import { TEST_CONFIG } from '../../../helpers/test-config';

import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { describe, it, expect, vi, afterEach } from 'vitest';

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

/**
 * A fake `UserSessionsRepository`: `findActive` answers `active` (null = no
 * active session by that id), `touchLastSeen` records or fails as asked.
 */
function sessionsRepo(
  active: { id: string; last_seen_at: string } | null = null,
  touch: () => Promise<void> = async () => {},
): UserSessionsRepository & { findActive: ReturnType<typeof vi.fn>; touchLastSeen: ReturnType<typeof vi.fn> } {
  return { findActive: vi.fn(async () => active), touchLastSeen: vi.fn(touch) } as unknown as UserSessionsRepository & {
    findActive: ReturnType<typeof vi.fn>;
    touchLastSeen: ReturnType<typeof vi.fn>;
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

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
    const token = jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(token, users, sessionsRepo())).toEqual({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
    });
    expect(users.findByIdWithPasswordVersion).toHaveBeenCalledWith(1);
  });

  it('AUTH-JWT-002: returns null for a malformed token', async () => {
    expect(await verifyJwtAndLoadUser('invalid.jwt.token', usersRepo(null), sessionsRepo())).toBeNull();
  });

  it('AUTH-JWT-003: returns null when the user no longer exists', async () => {
    const users = usersRepo(null);
    expect(
      await verifyJwtAndLoadUser(
        jwt.sign({ id: 99999 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' }),
        users,
        sessionsRepo(),
      ),
    ).toBeNull();
  });

  it('AUTH-JWT-004: returns null for an expired token', async () => {
    const expired = jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 3600 }, TEST_CONFIG.JWT_SECRET, {
      algorithm: 'HS256',
    });
    expect(await verifyJwtAndLoadUser(expired, usersRepo(null), sessionsRepo())).toBeNull();
  });

  it('AUTH-JWT-005: returns null for a token signed with the wrong secret', async () => {
    expect(
      await verifyJwtAndLoadUser(
        jwt.sign({ id: 1 }, 'wrong-secret', { algorithm: 'HS256' }),
        usersRepo(null),
        sessionsRepo(),
      ),
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
    const mfaToken = jwt.sign({ id: 1, purpose: 'mfa_login' }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(mfaToken, users, sessionsRepo())).toBeNull();
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
    const stale = jwt.sign({ id: 1, pv: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(stale, users, sessionsRepo())).toBeNull();
  });

  it('AUTH-JWT-008: accepts a token whose password_version matches', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 2,
    });
    const current = jwt.sign({ id: 1, pv: 2 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(current, users, sessionsRepo())).not.toBeNull();
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
    const legacy = jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(legacy, users, sessionsRepo())).not.toBeNull();
  });

  it('AUTH-JWT-010: but a pre-pv token stops working once the user has reset', async () => {
    const users = usersRepo({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password_version: 1,
    });
    const legacy = jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(legacy, users, sessionsRepo())).toBeNull();
  });
});

describe('verifyJwtAndLoadUser: the session check', () => {
  const alice = { id: 1, username: 'alice', email: 'alice@example.com', role: 'user', password_version: 0 };
  const SID = '0b7c6f3e-2a51-4c8e-9d43-5f1e2b7a9c10';

  it('AUTH-JWT-011: a token without a jti is never looked up, so tokens from before the upgrade keep working', async () => {
    const sessions = sessionsRepo();
    const legacy = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(legacy, usersRepo(alice), sessions)).not.toBeNull();
    expect(sessions.findActive).not.toHaveBeenCalled();
  });

  it('AUTH-JWT-012: a token naming an active session of its own user passes', async () => {
    const sessions = sessionsRepo({ id: SID, last_seen_at: dbNow() });
    const token = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: SID });

    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), sessions)).toEqual({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
    });
    expect(sessions.findActive).toHaveBeenCalledWith(
      SID,
      1,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    );
  });

  it('AUTH-JWT-013: a token whose session is revoked, expired or unknown is refused', async () => {
    const token = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: SID });

    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), sessionsRepo(null))).toBeNull();
  });

  it('AUTH-JWT-014: a jti that is not a string is refused without a lookup', async () => {
    const sessions = sessionsRepo({ id: SID, last_seen_at: dbNow() });
    const token = jwt.sign({ id: 1, pv: 0, jti: 42 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });

    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), sessions)).toBeNull();
    expect(sessions.findActive).not.toHaveBeenCalled();
  });

  it('AUTH-JWT-015: the password_version gate runs before the session lookup', async () => {
    const sessions = sessionsRepo({ id: SID, last_seen_at: dbNow() });
    const stale = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: SID });

    expect(await verifyJwtAndLoadUser(stale, usersRepo({ ...alice, password_version: 1 }), sessions)).toBeNull();
    expect(sessions.findActive).not.toHaveBeenCalled();
  });

  it('AUTH-JWT-016: last_seen_at is refreshed once it is older than the touch interval, not before', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const token = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: SID });

    const fresh = sessionsRepo({ id: SID, last_seen_at: '2026-10-08 11:58:00' });
    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), fresh)).not.toBeNull();
    expect(fresh.touchLastSeen).not.toHaveBeenCalled();

    const staleAt = dbNow(new Date(Date.parse('2026-10-08T12:00:00Z') - SESSION_TOUCH_INTERVAL_MS));
    const stale = sessionsRepo({ id: SID, last_seen_at: staleAt });
    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), stale)).not.toBeNull();
    expect(stale.touchLastSeen).toHaveBeenCalledWith(SID, '2026-10-08 12:00:00');
  });

  it('AUTH-JWT-017: a failed last_seen_at write does not turn a valid session into a refusal', async () => {
    const sessions = sessionsRepo({ id: SID, last_seen_at: '2020-01-01 00:00:00' }, async () => {
      throw new Error('database is locked');
    });
    const token = jwt.sign({ id: 1, pv: 0 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: SID });

    expect(await verifyJwtAndLoadUser(token, usersRepo(alice), sessions)).not.toBeNull();
    expect(sessions.touchLastSeen).toHaveBeenCalled();
  });
});

describe('currentSessionId', () => {
  it('reads the jti of the cookie token', () => {
    const token = jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: 'sid-1' });
    expect(currentSessionId(makeReq({ cookies: { trek_session: token } }))).toBe('sid-1');
  });

  it('falls back to the bearer token', () => {
    const token = jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256', jwtid: 'sid-2' });
    expect(currentSessionId(makeReq({ headers: { authorization: `Bearer ${token}` } }))).toBe('sid-2');
  });

  it('is undefined for a token without a jti, and without any token', () => {
    expect(
      currentSessionId(makeReq({ cookies: { trek_session: jwt.sign({ id: 1 }, TEST_CONFIG.JWT_SECRET) } })),
    ).toBeUndefined();
    expect(currentSessionId(makeReq())).toBeUndefined();
  });

  it('is undefined for a jti that is not a string', () => {
    const token = jwt.sign({ id: 1, jti: 7 }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' });
    expect(currentSessionId(makeReq({ cookies: { trek_session: token } }))).toBeUndefined();
  });
});

describe('verifiedSessionClaims', () => {
  it('returns the claims of a well-signed token, even an expired one', () => {
    const expired = jwt.sign({ id: 3, jti: 'sid', exp: Math.floor(Date.now() / 1000) - 60 }, TEST_CONFIG.JWT_SECRET, {
      algorithm: 'HS256',
    });
    expect(verifiedSessionClaims(expired)).toEqual(expect.objectContaining({ id: 3, jti: 'sid' }));
  });

  it('refuses a token signed with another secret', () => {
    expect(verifiedSessionClaims(jwt.sign({ id: 3, jti: 'sid' }, 'wrong-secret', { algorithm: 'HS256' }))).toBeNull();
  });

  it('refuses a purpose-scoped token and one without a numeric user id', () => {
    expect(
      verifiedSessionClaims(jwt.sign({ id: 3, purpose: 'mfa_login' }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' })),
    ).toBeNull();
    expect(verifiedSessionClaims(jwt.sign({ id: 'x' }, TEST_CONFIG.JWT_SECRET, { algorithm: 'HS256' }))).toBeNull();
  });

  it('is null without a token', () => {
    expect(verifiedSessionClaims(null)).toBeNull();
    expect(verifiedSessionClaims(undefined)).toBeNull();
    expect(verifiedSessionClaims('')).toBeNull();
  });
});
