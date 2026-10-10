import { JWT_SECRET, SESSION_DURATION_REMEMBER_SECONDS, SESSION_DURATION_SECONDS } from '../../../../src/config';
import { UserSessions } from '../../../../src/db/entities/UserSessions.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import { verifyJwtAndLoadUser } from '../../../../src/nest/auth-core/jwt-verify';
import {
  SessionsService,
  USER_AGENT_MAX_LENGTH,
  legacySessionId,
  sessionClientFrom,
} from '../../../../src/nest/sessions/sessions.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { countRows, findRow, findRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { userSessionIdSchema } from '@trek/shared';

import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let svc: SessionsService;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  svc = new SessionsService(t.repo(UserSessions));
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterEach(() => {
  vi.useRealTimers();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

interface Claims {
  id: number;
  pv: number;
  jti: string;
  iat: number;
  exp: number;
  remember?: boolean;
}

function claimsOf(token: string): Claims {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as Claims;
}

function rowOf(id: string) {
  return findRow(t, UserSessions, { id });
}

function textOf(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

describe('sessionClientFrom', () => {
  it('reads the User-Agent header', () => {
    expect(sessionClientFrom({ headers: { 'user-agent': 'Firefox/130' } } as unknown as Request)).toEqual({
      userAgent: 'Firefox/130',
    });
  });

  it('is null without one, or with an empty one', () => {
    expect(sessionClientFrom({ headers: {} } as unknown as Request)).toEqual({ userAgent: null });
    expect(sessionClientFrom({ headers: { 'user-agent': '' } } as unknown as Request)).toEqual({ userAgent: null });
  });
});

describe('SessionsService.issue', () => {
  it("SESS-001: signs a token with a fresh jti and records its session with the token's own times", async () => {
    const { user } = createUser(testDb);
    const token = await svc.issue({ id: user.id, pv: 2 }, undefined, { userAgent: 'Firefox/130' });
    const claims = claimsOf(token);

    expect(claims).toEqual(expect.objectContaining({ id: user.id, pv: 2 }));
    expect('remember' in claims).toBe(false);
    expect(claims.jti).toMatch(/^[0-9a-f-]{36}$/);
    expect(claims.exp - claims.iat).toBe(SESSION_DURATION_SECONDS);
    expect(await rowOf(claims.jti)).toEqual({
      id: claims.jti,
      user_id: user.id,
      created_at: textOf(claims.iat),
      last_seen_at: textOf(claims.iat),
      expires_at: textOf(claims.exp),
      revoked_at: null,
      user_agent: 'Firefox/130',
    });
  });

  it('SESS-002: "remember me" picks the long lifetime and keeps the claim either way', async () => {
    const { user } = createUser(testDb);
    const long = claimsOf(await svc.issue({ id: user.id, pv: 0 }, true));
    const short = claimsOf(await svc.issue({ id: user.id, pv: 0 }, false));

    expect(long.remember).toBe(true);
    expect(long.exp - long.iat).toBe(SESSION_DURATION_REMEMBER_SECONDS);
    expect(short.remember).toBe(false);
    expect(short.exp - short.iat).toBe(SESSION_DURATION_SECONDS);
  });

  it('SESS-003: every sign-in is its own session; the user agent is cut and may be absent', async () => {
    const { user } = createUser(testDb);
    const a = claimsOf(await svc.issue({ id: user.id, pv: 0 }, undefined, { userAgent: 'x'.repeat(400) }));
    const b = claimsOf(await svc.issue({ id: user.id, pv: 0 }));

    expect(a.jti).not.toBe(b.jti);
    expect((await rowOf(a.jti))?.user_agent).toHaveLength(USER_AGENT_MAX_LENGTH);
    expect((await rowOf(b.jti))?.user_agent).toBeNull();
  });
});

describe('SessionsService.renew', () => {
  it('SESS-004: re-signs a tracked token under the same id and moves the session expiry with it', async () => {
    // Only the clock: the ORM's own timers keep running.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T00:00:00Z'));
    const { user } = createUser(testDb);
    const first = claimsOf(await svc.issue({ id: user.id, pv: 1 }, false));

    // Past half of the default lifetime, still inside it.
    vi.setSystemTime(new Date(Date.parse('2026-10-08T00:00:00Z') + SESSION_DURATION_SECONDS * 750));
    const renewed = await svc.renew({ id: user.id, pv: 1, remember: false, jti: first.jti }, { userAgent: 'ignored' });
    const claims = claimsOf(renewed!);

    expect(claims.jti).toBe(first.jti);
    expect(claims.remember).toBe(false);
    expect(claims.exp).toBeGreaterThan(first.exp);
    expect(await rowOf(first.jti)).toEqual(
      expect.objectContaining({
        expires_at: textOf(claims.exp),
        last_seen_at: textOf(Date.parse('2026-10-08T00:00:00Z') / 1000 + SESSION_DURATION_SECONDS * 0.75),
        created_at: '2026-10-08 00:00:00',
        user_agent: null,
      }),
    );
    expect(await countRows(t, UserSessions)).toBe(1);
  });

  it('SESS-005: a session that ended in the meantime is not renewed', async () => {
    const { user } = createUser(testDb);
    const first = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    await svc.revoke(user.id, first.jti);

    expect(await svc.renew({ id: user.id, pv: 0, jti: first.jti })).toBeNull();
    expect((await rowOf(first.jti))?.expires_at).toBe(textOf(first.exp));
  });

  it('SESS-006: a token from before sessions were tracked comes back as a tracked session', async () => {
    const { user } = createUser(testDb);
    const renewed = await svc.renew({ id: user.id, remember: true }, { userAgent: 'Safari' });
    const claims = claimsOf(renewed!);

    expect(claims.pv).toBe(0);
    expect(claims.remember).toBe(true);
    expect(await rowOf(claims.jti)).toEqual(
      expect.objectContaining({ user_id: user.id, user_agent: 'Safari', revoked_at: null }),
    );
  });
});

describe('SessionsService.renew of a token from before tracking', () => {
  /** A token as the server signed them before sessions were tracked: no jti. */
  function untracked(userId: number): string {
    return jwt.sign({ id: userId, pv: 0 }, JWT_SECRET, { algorithm: 'HS256', expiresIn: SESSION_DURATION_SECONDS });
  }

  it('SESS-012: the requests of one page load renew it into a single session', async () => {
    const { user } = createUser(testDb);
    const legacy = untracked(user.id);

    // Every request of the load carries the same cookie and renews it.
    const renewed: (string | null)[] = [];
    for (let i = 0; i < 5; i++)
      renewed.push(await svc.renew({ id: user.id, pv: 0, token: legacy }, { userAgent: 'Page load' }));

    const ids = new Set(renewed.map((token) => claimsOf(token!).jti));
    expect(ids).toEqual(new Set([legacySessionId(legacy)]));
    const rows = await findRows(t, UserSessions, { user: user.id });
    expect(rows.map(({ id, user_agent, revoked_at }) => ({ id, user_agent, revoked_at }))).toEqual([
      { id: legacySessionId(legacy), user_agent: 'Page load', revoked_at: null },
    ]);
    expect(await svc.list(user.id)).toHaveLength(1);
  });

  it('SESS-013: a session derived from it that was ended is not brought back', async () => {
    const { user } = createUser(testDb);
    const legacy = untracked(user.id);
    const first = claimsOf((await svc.renew({ id: user.id, pv: 0, token: legacy }))!);
    expect(await svc.revoke(user.id, first.jti)).toBe(true);

    expect(await svc.renew({ id: user.id, pv: 0, token: legacy })).toBeNull();
    expect((await rowOf(first.jti))?.revoked_at).not.toBeNull();
    expect(await countRows(t, UserSessions, { user: user.id })).toBe(1);
  });

  it('SESS-017: a session derived from it that was ended stays ended through the nightly purge', async () => {
    const { user } = createUser(testDb);
    const legacy = untracked(user.id);
    const first = claimsOf((await svc.renew({ id: user.id, pv: 0, token: legacy }))!);
    expect(await svc.revoke(user.id, first.jti)).toBe(true);

    // The purge that night, while the old token is still valid.
    expect(await svc.purgeInactive(new Date())).toBe(0);
    expect(await svc.renew({ id: user.id, pv: 0, token: legacy })).toBeNull();
    expect((await rowOf(first.jti))?.revoked_at).not.toBeNull();
    expect(await svc.list(user.id)).toEqual([]);

    // Once the old token has expired the row may go, since the token is refused by then.
    const legacyExp = (jwt.decode(legacy) as { exp: number }).exp;
    expect(await svc.purgeInactive(new Date((legacyExp + SESSION_DURATION_SECONDS + 60) * 1000))).toBe(1);
    expect(() => jwt.verify(legacy, JWT_SECRET, { algorithms: ['HS256'], clockTimestamp: legacyExp + 60 })).toThrow();
  });

  it('SESS-018: the derived session is kept at least as long as the old token lives', async () => {
    const { user } = createUser(testDb);
    // An old token with a longer life than the one it is renewed into.
    const legacy = jwt.sign({ id: user.id, pv: 0 }, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: SESSION_DURATION_REMEMBER_SECONDS,
    });
    const renewed = claimsOf((await svc.renew({ id: user.id, pv: 0, token: legacy }))!);

    expect(renewed.exp - renewed.iat).toBe(SESSION_DURATION_SECONDS);
    expect((await rowOf(renewed.jti))?.expires_at).toBe(textOf((jwt.decode(legacy) as { exp: number }).exp));
  });

  it('SESS-014: two different tokens of the same user stay two sessions', async () => {
    const { user } = createUser(testDb);
    const a = claimsOf((await svc.renew({ id: user.id, pv: 0, token: untracked(user.id) }))!);
    const b = claimsOf(
      (await svc.renew({ id: user.id, pv: 0, token: jwt.sign({ id: user.id, pv: 0, n: 2 }, JWT_SECRET) }))!,
    );
    expect(a.jti).not.toBe(b.jti);
  });
});

describe('legacySessionId', () => {
  it('SESS-015: is stable per token, differs between tokens and passes the session id check', () => {
    const one = legacySessionId('header.payload.signature-one');
    expect(legacySessionId('header.payload.signature-one')).toBe(one);
    expect(legacySessionId('header.payload.signature-two')).not.toBe(one);
    for (const token of ['a', 'b', 'header.payload.signature-one', 'x'.repeat(500)]) {
      const id = legacySessionId(token);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(userSessionIdSchema.safeParse(id).success).toBe(true);
    }
  });
});

describe('SessionsService list and revoke', () => {
  it('SESS-007: lists the active sessions and flags the current one', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const here = claimsOf(await svc.issue({ id: user.id, pv: 0 }, undefined, { userAgent: 'here' }));
    const there = claimsOf(await svc.issue({ id: user.id, pv: 0 }, undefined, { userAgent: 'there' }));
    const ended = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    await svc.issue({ id: other.id, pv: 0 });
    await svc.revoke(user.id, ended.jti);

    const listed = await svc.list(user.id, here.jti);
    expect(listed.map((s) => [s.id, s.user_agent, s.current]).sort()).toEqual(
      [
        [here.jti, 'here', true],
        [there.jti, 'there', false],
      ].sort(),
    );
    expect((await svc.list(user.id)).every((s) => !s.current)).toBe(true);
  });

  it('SESS-008: revoke ends one session of the caller only', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const mine = claimsOf(await svc.issue({ id: user.id, pv: 0 }));

    expect(await svc.revoke(other.id, mine.jti)).toBe(false);
    expect(await svc.revoke(user.id, mine.jti)).toBe(true);
    expect((await rowOf(mine.jti))?.revoked_at).not.toBeNull();
  });

  it('SESS-009: revokeAll ends every session, or every one but the current', async () => {
    const { user } = createUser(testDb);
    const a = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    const b = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    const c = claimsOf(await svc.issue({ id: user.id, pv: 0 }));

    expect(await svc.revokeAll(user.id, b.jti)).toBe(2);
    expect((await rowOf(b.jti))?.revoked_at).toBeNull();
    expect((await rowOf(a.jti))?.revoked_at).not.toBeNull();
    expect((await rowOf(c.jti))?.revoked_at).not.toBeNull();
    expect(await svc.revokeAll(user.id)).toBe(1);
  });

  it('SESS-010: endSession ends the session a token names, and nothing for an untracked or missing token', async () => {
    const { user } = createUser(testDb);
    const mine = claimsOf(await svc.issue({ id: user.id, pv: 0 }));

    expect(await svc.endSession(null)).toBe(false);
    expect(await svc.endSession({ id: user.id })).toBe(false);
    expect(await svc.endSession({ id: user.id, jti: mine.jti })).toBe(true);
    expect((await rowOf(mine.jti))?.revoked_at).not.toBeNull();
  });

  it('SESS-011: purgeInactive removes the expired rows and keeps a revoked one until it expires', async () => {
    const { user } = createUser(testDb);
    const live = claimsOf(await svc.issue({ id: user.id, pv: 0 }, true));
    const ended = claimsOf(await svc.issue({ id: user.id, pv: 0 }, true));
    const short = claimsOf(await svc.issue({ id: user.id, pv: 0 }, false));
    await svc.revoke(user.id, ended.jti);

    // Just past the default lifetime: the short session has expired, the remembered ones have not.
    expect(SESSION_DURATION_REMEMBER_SECONDS).toBeGreaterThan(SESSION_DURATION_SECONDS + 60);
    expect(await svc.purgeInactive(new Date(Date.now() + (SESSION_DURATION_SECONDS + 60) * 1000))).toBe(1);
    expect(await rowOf(live.jti)).not.toBeNull();
    expect((await rowOf(ended.jti))?.revoked_at).not.toBeNull();
    expect(await rowOf(short.jti)).toBeNull();

    // Past the long lifetime as well: the revoked row goes with the live one.
    expect(await svc.purgeInactive(new Date(Date.now() + (SESSION_DURATION_REMEMBER_SECONDS + 60) * 1000))).toBe(2);
    expect(await rowOf(ended.jti)).toBeNull();
  });
});

describe('SessionsService as the session check', () => {
  it('SESS-016: answers findActive and touchLastSeen for verifyJwtAndLoadUser', async () => {
    const { user } = createUser(testDb);
    const live = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    const ended = claimsOf(await svc.issue({ id: user.id, pv: 0 }));
    await svc.revoke(user.id, ended.jti);
    const now = textOf(Math.floor(Date.now() / 1000));

    expect(await svc.findActive(live.jti, user.id, now)).toEqual({ id: live.jti, last_seen_at: textOf(live.iat) });
    expect(await svc.findActive(ended.jti, user.id, now)).toBeNull();
    await svc.touchLastSeen(live.jti, '2030-01-01 00:00:00');
    expect((await rowOf(live.jti))?.last_seen_at).toBe('2030-01-01 00:00:00');

    const sign = (jti: string) =>
      jwt.sign({ id: user.id, pv: 0 }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 600, jwtid: jti });
    expect((await verifyJwtAndLoadUser(sign(live.jti), t.repo(Users), svc))?.id).toBe(user.id);
    expect(await verifyJwtAndLoadUser(sign(ended.jti), t.repo(Users), svc)).toBeNull();
  });
});
