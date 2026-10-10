/**
 * Sessions e2e: session tokens that can be ended before they expire.
 *
 * Boots AuthModule (which brings SessionsModule) against the snapshot schema,
 * with the real JwtAuthGuard, the real cookie service and the real
 * renewal interceptor, then drives the flows a browser would: sign in on two
 * devices, list the sessions, end one, end the others, log out, change the
 * password, reset it by email, turn two-factor off, delete the account, and
 * run the nightly purge against the real table. A token from before sessions
 * were tracked (the harness's `sessionCookie`, which carries no `jti`) must
 * keep working throughout. The admin paths that end sessions boot the whole
 * app and live in session-revocation.e2e.test.ts.
 */
import { db } from '../../src/db/database';
import { UserSessions } from '../../src/db/entities/UserSessions.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { SessionRenewalInterceptor } from '../../src/nest/auth/session-renewal.interceptor';
import { encryptMfaSecret } from '../../src/nest/common/crypto/mfaCrypto';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { SessionPurgeJob } from '../../src/nest/sessions/session-purge.job';
import { SessionsService } from '../../src/nest/sessions/sessions.service';
import { createUser } from '../helpers/factories';
import { insertRow, updateRows } from '../helpers/factories/rows';
import { sessionRows } from '../helpers/sessions';
import { resetRateLimits } from '../helpers/test-db';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
});

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

/** The reset mail the forgot-password route sends; the link in it carries the token. */
const sendPasswordResetEmail = vi.fn().mockResolvedValue({ delivered: 'email' });

describe('Sessions e2e (sign-in sessions that can be ended)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>>;

  async function build() {
    moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), AuthModule],
    })
      .overrideProvider(MailerService)
      .useValue({ sendPasswordResetEmail })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalInterceptors(new SessionRenewalInterceptor(moduleRef.get(SessionsService)));
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => resetRateLimits(app));

  afterAll(async () => {
    await app.close();
  });

  /** Sign in as the user from a device; returns the `trek_session=…` cookie pair. */
  async function signIn(email: string, password: string, device: string): Promise<string> {
    const res = await request(server).post('/api/auth/login').set('User-Agent', device).send({ email, password });
    expect(res.status).toBe(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
    return /^(trek_session=[^;]+)/.exec(cookie)![1];
  }

  const sessionIdOf = (cookie: string) => (jwt.decode(cookie.slice('trek_session='.length)) as { jti: string }).jti;
  const me = (cookie: string) => request(server).get('/api/auth/me').set('Cookie', cookie);

  function freshUser(name: string) {
    return createUser(db as never, { username: name, email: `${name}@example.test` });
  }

  it('a login is listed as the current session, with its device', async () => {
    const { user, password } = freshUser('sess-list');
    const laptop = await signIn(user.email, password, 'Laptop Browser');
    const phone = await signIn(user.email, password, 'Phone Browser');

    const res = await request(server).get('/api/auth/sessions').set('Cookie', laptop);
    expect(res.status).toBe(200);
    expect(res.body.current_tracked).toBe(true);
    const byId = Object.fromEntries(
      (res.body.sessions as { id: string; user_agent: string; current: boolean }[]).map((s) => [s.id, s]),
    );
    expect(Object.keys(byId).sort()).toEqual([sessionIdOf(laptop), sessionIdOf(phone)].sort());
    expect(byId[sessionIdOf(laptop)]).toEqual(expect.objectContaining({ user_agent: 'Laptop Browser', current: true }));
    expect(byId[sessionIdOf(phone)]).toEqual(expect.objectContaining({ user_agent: 'Phone Browser', current: false }));
  }, 15000);

  it('the session routes need a session', async () => {
    expect((await request(server).get('/api/auth/sessions')).status).toBe(401);
    expect((await request(server).post('/api/auth/sessions/revoke-others')).status).toBe(401);
  });

  it('logout ends the session itself, so a copy of the cookie stops working', async () => {
    const { user, password } = freshUser('sess-logout');
    const cookie = await signIn(user.email, password, 'Browser');
    expect((await me(cookie)).status).toBe(200);

    const out = await request(server).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ success: true });

    expect((await me(cookie)).status).toBe(401);
  }, 10000);

  it('ending another session signs that device out and leaves this one signed in', async () => {
    const { user, password } = freshUser('sess-revoke-one');
    const laptop = await signIn(user.email, password, 'Laptop');
    const phone = await signIn(user.email, password, 'Phone');

    const res = await request(server)
      .delete(`/api/auth/sessions/${sessionIdOf(phone)}`)
      .set('Cookie', laptop);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(((res.headers['set-cookie'] ?? []) as unknown as string[]).some((c) => c.startsWith('trek_session='))).toBe(
      false,
    );

    expect((await me(phone)).status).toBe(401);
    expect((await me(laptop)).status).toBe(200);
    // Ended already: the same id now answers like one that never existed.
    expect(
      (
        await request(server)
          .delete(`/api/auth/sessions/${sessionIdOf(phone)}`)
          .set('Cookie', laptop)
      ).status,
    ).toBe(404);
  }, 15000);

  it('ending the current session is a logout: the cookie is cleared and stops working', async () => {
    const { user, password } = freshUser('sess-revoke-self');
    const cookie = await signIn(user.email, password, 'Browser');

    const res = await request(server)
      .delete(`/api/auth/sessions/${sessionIdOf(cookie)}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(((res.headers['set-cookie'] ?? []) as unknown as string[]).some((c) => c.startsWith('trek_session=;'))).toBe(
      true,
    );
    expect((await me(cookie)).status).toBe(401);
  }, 10000);

  it("another user's session id answers 404 and stays signed in; a malformed id answers 400", async () => {
    const owner = freshUser('sess-owner');
    const intruder = freshUser('sess-intruder');
    const ownerCookie = await signIn(owner.user.email, owner.password, 'Owner');
    const intruderCookie = await signIn(intruder.user.email, intruder.password, 'Intruder');

    const res = await request(server)
      .delete(`/api/auth/sessions/${sessionIdOf(ownerCookie)}`)
      .set('Cookie', intruderCookie);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Session not found' });
    expect((await me(ownerCookie)).status).toBe(200);

    const bad = await request(server).delete('/api/auth/sessions/not-a-session').set('Cookie', intruderCookie);
    expect(bad.status).toBe(400);
  }, 15000);

  it('signing out the other sessions keeps only this one', async () => {
    const { user, password } = freshUser('sess-others');
    const here = await signIn(user.email, password, 'Here');
    const there = await signIn(user.email, password, 'There');
    const elsewhere = await signIn(user.email, password, 'Elsewhere');

    const res = await request(server).post('/api/auth/sessions/revoke-others').set('Cookie', here);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, revoked: 2 });

    expect((await me(here)).status).toBe(200);
    expect((await me(there)).status).toBe(401);
    expect((await me(elsewhere)).status).toBe(401);
    const list = await request(server).get('/api/auth/sessions').set('Cookie', here);
    expect((list.body.sessions as { id: string }[]).map((s) => s.id)).toEqual([sessionIdOf(here)]);
  }, 20000);

  it('a password change ends every other session; the re-issued cookie is a new session', async () => {
    const { user, password } = freshUser('sess-password');
    const here = await signIn(user.email, password, 'Here');
    const there = await signIn(user.email, password, 'There');

    const change = await request(server)
      .put('/api/auth/me/password')
      .set('Cookie', here)
      .set('User-Agent', 'Here')
      .send({ current_password: password, new_password: 'New1234!x' });
    expect(change.status).toBe(200);
    const reissued = ((change.headers['set-cookie'] ?? []) as unknown as string[])
      .filter((c) => c.startsWith('trek_session='))
      .pop()!;
    const next = /^(trek_session=[^;]+)/.exec(reissued)![1];

    expect((await me(there)).status).toBe(401);
    expect((await me(here)).status).toBe(401);
    expect((await me(next)).status).toBe(200);
    const list = await request(server).get('/api/auth/sessions').set('Cookie', next);
    expect(list.body.sessions).toEqual([
      expect.objectContaining({ id: sessionIdOf(next), user_agent: 'Here', current: true }),
    ]);
  }, 15000);

  it('a password change over a Bearer token ends every session and starts none, since no cookie carries it', async () => {
    const { user, password } = freshUser('sess-password-bearer');
    const cookie = await signIn(user.email, password, 'Api client');
    const bearer = cookie.slice('trek_session='.length);

    const change = await request(server)
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ current_password: password, new_password: 'New1234!x' });
    expect(change.status).toBe(200);
    expect(change.body).toEqual({ success: true });
    expect(
      ((change.headers['set-cookie'] ?? []) as unknown as string[]).some((c) => c.startsWith('trek_session=')),
    ).toBe(false);

    const rows = await sessionRows(db as never, user.id);
    expect(rows).toEqual([expect.objectContaining({ id: sessionIdOf(cookie), revoked_at: expect.any(String) })]);
  }, 15000);

  it('a token from before sessions were tracked keeps working, is listed as untracked, and survives "sign out others"', async () => {
    const { user, password } = freshUser('sess-legacy');
    const legacy = sessionCookie(user.id);
    const tracked = await signIn(user.email, password, 'Tracked');

    const list = await request(server).get('/api/auth/sessions').set('Cookie', legacy);
    expect(list.status).toBe(200);
    expect(list.body.current_tracked).toBe(false);
    expect((list.body.sessions as { current: boolean }[]).every((s) => !s.current)).toBe(true);

    const res = await request(server).post('/api/auth/sessions/revoke-others').set('Cookie', legacy);
    expect(res.body).toEqual({ success: true, revoked: 1 });
    expect((await me(tracked)).status).toBe(401);
    expect((await me(legacy)).status).toBe(200);
  }, 10000);

  it('sliding renewal keeps the session id, and a renewed token from before tracking becomes a session', async () => {
    const { user } = freshUser('sess-renew');
    const old = sessionCookie(user.id, 0, { lifetime: 86400, consumed: 60000 });

    const first = await request(server).get('/api/auth/me').set('Cookie', old).set('User-Agent', 'Renewed');
    expect(first.status).toBe(200);
    const renewedCookie = ((first.headers['set-cookie'] ?? []) as unknown as string[]).find((c) =>
      c.startsWith('trek_session='),
    )!;
    const renewed = /^(trek_session=[^;]+)/.exec(renewedCookie)![1];

    const list = await request(server).get('/api/auth/sessions').set('Cookie', renewed);
    expect(list.body.current_tracked).toBe(true);
    expect(list.body.sessions).toEqual([
      expect.objectContaining({ id: sessionIdOf(renewed), user_agent: 'Renewed', current: true }),
    ]);
  }, 10000);

  it("on a demo instance, visitors of the shared demo account neither see nor end each other's sessions", async () => {
    createUser(db as never, { username: 'demo', email: 'demo@trek.app' });
    vi.stubEnv('DEMO_MODE', 'true');
    try {
      const visit = async (device: string) => {
        const res = await request(server).post('/api/auth/demo-login').set('User-Agent', device);
        expect(res.status).toBe(200);
        const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
        return /^(trek_session=[^;]+)/.exec(cookie)![1];
      };
      const first = await visit('First visitor');
      const second = await visit('Second visitor');

      const list = await request(server).get('/api/auth/sessions').set('Cookie', first);
      expect(list.status).toBe(200);
      expect(list.body.sessions).toEqual([
        expect.objectContaining({ id: sessionIdOf(first), user_agent: 'First visitor', current: true }),
      ]);

      const one = await request(server)
        .delete(`/api/auth/sessions/${sessionIdOf(second)}`)
        .set('Cookie', first);
      expect(one.status).toBe(403);
      expect(one.body).toEqual({ error: 'Sessions cannot be ended in demo mode.' });
      const others = await request(server).post('/api/auth/sessions/revoke-others').set('Cookie', first);
      expect(others.status).toBe(403);
      expect(others.body).toEqual({ error: 'Sessions cannot be ended in demo mode.' });

      expect((await me(second)).status).toBe(200);
      expect((await me(first)).status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  }, 15000);

  /** The rows of the user's sessions that still let a token in. */
  const liveRows = async (userId: number) =>
    (await sessionRows(db as never, userId)).filter((row) => row.revoked_at === null);

  it('a password reset by email ends every session of the account', async () => {
    const { user, password } = freshUser('sess-reset');
    const laptop = await signIn(user.email, password, 'Laptop');
    const phone = await signIn(user.email, password, 'Phone');
    sendPasswordResetEmail.mockClear();

    const forgot = await request(server).post('/api/auth/forgot-password').send({ email: user.email });
    expect(forgot.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const link = sendPasswordResetEmail.mock.calls[0][1] as string;
    const resetToken = decodeURIComponent(/[?&]token=([^&]+)/.exec(link)![1]);

    const reset = await request(server)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, new_password: 'Reset1234!x' });
    expect(reset.status).toBe(200);
    expect(reset.body).toEqual({ success: true });

    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(401);
    expect((await sessionRows(db as never, user.id)).map((row) => row.id).sort()).toEqual(
      [sessionIdOf(laptop), sessionIdOf(phone)].sort(),
    );
    expect(await liveRows(user.id)).toEqual([]);
    // The new password signs in again, as a new session.
    const after = await signIn(user.email, 'Reset1234!x', 'Laptop');
    expect((await me(after)).status).toBe(200);
  }, 20000);

  it('turning two-factor off ends every other session and keeps this one', async () => {
    const { user, password } = freshUser('sess-mfa-off');
    const here = await signIn(user.email, password, 'Here');
    const there = await signIn(user.email, password, 'There');
    // Two-factor turned on after both sign-ins, as the factory does it.
    const secret = 'JBSWY3DPEHPK3PXP';
    await updateRows(
      moduleRef.get(MikroORM),
      Users,
      { id: user.id },
      { mfa_enabled: 1, mfa_secret: encryptMfaSecret(secret) },
    );

    const off = await request(server)
      .post('/api/auth/mfa/disable')
      .set('Cookie', here)
      .send({ password, code: authenticator.generate(secret) });
    expect(off.status).toBe(200);
    expect(off.body).toEqual({ success: true, mfa_enabled: false });

    expect((await me(there)).status).toBe(401);
    expect((await me(here)).status).toBe(200);
    expect((await liveRows(user.id)).map((row) => row.id)).toEqual([sessionIdOf(here)]);
  }, 15000);

  it('deleting the account takes its sessions with it', async () => {
    const { user, password } = freshUser('sess-delete');
    const here = await signIn(user.email, password, 'Here');
    const there = await signIn(user.email, password, 'There');
    expect(await sessionRows(db as never, user.id)).toHaveLength(2);

    const res = await request(server).delete('/api/auth/me').set('Cookie', here);
    expect(res.status).toBe(200);

    expect(await sessionRows(db as never, user.id)).toEqual([]);
    expect((await me(here)).status).toBe(401);
    expect((await me(there)).status).toBe(401);
  }, 15000);

  it('the nightly purge removes the expired rows, keeps an ended one until it expires, and leaves the live session working', async () => {
    const { user, password } = freshUser('sess-purge');
    const live = await signIn(user.email, password, 'Live');
    const ended = await signIn(user.email, password, 'Ended');
    expect(
      (
        await request(server)
          .delete(`/api/auth/sessions/${sessionIdOf(ended)}`)
          .set('Cookie', live)
      ).status,
    ).toBe(200);
    await insertRow(moduleRef.get(MikroORM), UserSessions, {
      id: '0b7c6f3e-2a51-4c8e-9d43-5f1e2b7a9c10',
      user: user.id,
      created_at: '2020-01-01 00:00:00',
      last_seen_at: '2020-01-01 00:00:00',
      expires_at: '2020-01-02 00:00:00',
    });
    expect(await sessionRows(db as never, user.id)).toHaveLength(3);

    const job = moduleRef.get(SessionPurgeJob);
    await withRequestContext(moduleRef.get(MikroORM), () => job.tick());

    expect((await sessionRows(db as never, user.id)).map((row) => row.id).sort()).toEqual(
      [sessionIdOf(live), sessionIdOf(ended)].sort(),
    );
    expect((await me(live)).status).toBe(200);
    expect((await me(ended)).status).toBe(401);
  }, 15000);

  it('a session renewed from a token from before tracking stays ended through the nightly purge', async () => {
    const { user } = freshUser('sess-legacy-purge');
    const old = sessionCookie(user.id, 0, { lifetime: 86400, consumed: 60000 });

    const first = await request(server).get('/api/auth/me').set('Cookie', old).set('User-Agent', 'Old');
    const renewedCookie = ((first.headers['set-cookie'] ?? []) as unknown as string[]).find((c) =>
      c.startsWith('trek_session='),
    )!;
    const renewed = /^(trek_session=[^;]+)/.exec(renewedCookie)![1];
    expect((await request(server).post('/api/auth/logout').set('Cookie', renewed)).status).toBe(200);
    expect((await me(renewed)).status).toBe(401);

    const job = moduleRef.get(SessionPurgeJob);
    await withRequestContext(moduleRef.get(MikroORM), () => job.tick());

    // The old token itself lives out its own expiry, but it is not renewed into the ended session again.
    const again = await request(server).get('/api/auth/me').set('Cookie', old).set('User-Agent', 'Old');
    expect(again.status).toBe(200);
    expect(
      ((again.headers['set-cookie'] ?? []) as unknown as string[]).some((c) => c.startsWith('trek_session=')),
    ).toBe(false);
    expect(await sessionRows(db as never, user.id)).toEqual([
      expect.objectContaining({ id: sessionIdOf(renewed), revoked_at: expect.any(String) }),
    ]);
    const list = await request(server).get('/api/auth/sessions').set('Cookie', old);
    expect(list.body.sessions).toEqual([]);
  }, 15000);
});
