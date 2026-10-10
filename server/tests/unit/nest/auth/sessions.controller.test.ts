import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { SessionsController } from '../../../../src/nest/auth/sessions.controller';
import type { SessionsService } from '../../../../src/nest/sessions/sessions.service';
import type { User } from '../../../../src/types';
import { HttpException } from '@nestjs/common';

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));

const SID = '0b7c6f3e-2a51-4c8e-9d43-5f1e2b7a9c10';
const OTHER = '9f0e1d2c-3b4a-4c5d-8e6f-7a8b9c0d1e2f';
const user = { id: 7, username: 'u', email: 'u@example.test', role: 'user' } as User;

const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;

/** A request carrying a session token; the controller only decodes it, the guard verified it. */
function reqWith(jti?: string): Request {
  const token = jwt.sign({ id: 7, pv: 0 }, 'any-secret', { algorithm: 'HS256', ...(jti ? { jwtid: jti } : {}) });
  return { ip: '9.9.9.9', headers: {}, cookies: { trek_session: token } } as unknown as Request;
}

function resStub() {
  return { clearCookie: vi.fn() } as unknown as Response & { clearCookie: ReturnType<typeof vi.fn> };
}

function controller(o: Partial<Record<'list' | 'revoke' | 'revokeAll', ReturnType<typeof vi.fn>>> = {}) {
  const sessions = { list: vi.fn(), revoke: vi.fn(), revokeAll: vi.fn(), ...o };
  return { c: new SessionsController(sessions as unknown as SessionsService, audit), sessions };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe('SessionsController', () => {
  it('GET lists the sessions with the current one flagged', async () => {
    const listed = [{ id: SID, created_at: 'a', last_seen_at: 'b', expires_at: 'c', user_agent: null, current: true }];
    const { c, sessions } = controller({ list: vi.fn().mockResolvedValue(listed) });

    expect(await c.list(user, reqWith(SID))).toEqual({ sessions: listed, current_tracked: true });
    expect(sessions.list).toHaveBeenCalledWith(7, SID);
  });

  it('GET says so when the request token is not tracked', async () => {
    const { c, sessions } = controller({ list: vi.fn().mockResolvedValue([]) });

    expect(await c.list(user, reqWith())).toEqual({ sessions: [], current_tracked: false });
    expect(sessions.list).toHaveBeenCalledWith(7, undefined);
  });

  it('POST revoke-others keeps the current session and audits the count', async () => {
    const { c, sessions } = controller({ revokeAll: vi.fn().mockResolvedValue(3) });

    expect(await c.revokeOthers(user, reqWith(SID))).toEqual({ success: true, revoked: 3 });
    expect(sessions.revokeAll).toHaveBeenCalledWith(7, SID);
    expect(writeAudit).toHaveBeenCalledWith({
      userId: 7,
      action: 'user.sessions_revoke_others',
      ip: '1.2.3.4',
      details: { revoked: 3 },
    });
  });

  it('DELETE ends another session and leaves this cookie alone', async () => {
    const { c, sessions } = controller({ revoke: vi.fn().mockResolvedValue(true) });
    const res = resStub();

    expect(await c.revoke(user, { id: OTHER }, reqWith(SID), res)).toEqual({ success: true });
    expect(sessions.revoke).toHaveBeenCalledWith(7, OTHER);
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith({
      userId: 7,
      action: 'user.session_revoke',
      ip: '1.2.3.4',
      resource: OTHER,
    });
  });

  it('DELETE of the current session clears the cookie too', async () => {
    const { c } = controller({ revoke: vi.fn().mockResolvedValue(true) });
    const res = resStub();

    expect(await c.revoke(user, { id: SID }, reqWith(SID), res)).toEqual({ success: true });
    expect(res.clearCookie).toHaveBeenCalledWith('trek_session', expect.any(Object));
  });

  it('DELETE answers 404 for a session the caller does not have', async () => {
    const { c } = controller({ revoke: vi.fn().mockResolvedValue(false) });

    const err = await c.revoke(user, { id: OTHER }, reqWith(SID), resStub()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect((err as HttpException).getStatus()).toBe(404);
    expect((err as HttpException).getResponse()).toEqual({ error: 'Session not found' });
    expect(writeAudit).not.toHaveBeenCalled();
  });
});

describe('SessionsController on a demo instance', () => {
  const demo = { id: 3, username: 'demo', email: 'demo@trek.app', role: 'user' } as User;

  it('GET shows the shared demo account only the session it was called with', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const mine = { id: SID, created_at: 'a', last_seen_at: 'b', expires_at: 'c', user_agent: 'Mine', current: true };
    const theirs = {
      id: OTHER,
      created_at: 'a',
      last_seen_at: 'b',
      expires_at: 'c',
      user_agent: 'Another visitor',
      current: false,
    };
    // Flags `current` from the id it is handed, as SessionsService.list does:
    // a request without a tracked token has no current session at all.
    const list = vi.fn((_userId: number, currentId?: string) =>
      Promise.resolve([theirs, mine].map((session) => ({ ...session, current: session.id === currentId }))),
    );
    const { c } = controller({ list });

    expect(await c.list(demo, reqWith(SID))).toEqual({ sessions: [mine], current_tracked: true });
    expect(await c.list(demo, reqWith())).toEqual({ sessions: [], current_tracked: false });
  });

  it('DELETE and revoke-others answer 403 for the shared demo account and end nothing', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const { c, sessions } = controller({ revoke: vi.fn(), revokeAll: vi.fn() });

    for (const call of [
      () => c.revokeOthers(demo, reqWith(SID)),
      () => c.revoke(demo, { id: OTHER }, reqWith(SID), resStub()),
    ]) {
      const err = await call().catch((e: unknown) => e);
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(403);
      expect((err as HttpException).getResponse()).toEqual({ error: 'Sessions cannot be ended in demo mode.' });
    }
    expect(sessions.revoke).not.toHaveBeenCalled();
    expect(sessions.revokeAll).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('another account on a demo instance, and the demo address without demo mode, keep the full routes', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const listed = [
      { id: SID, created_at: 'a', last_seen_at: 'b', expires_at: 'c', user_agent: null, current: true },
      { id: OTHER, created_at: 'a', last_seen_at: 'b', expires_at: 'c', user_agent: null, current: false },
    ];
    const { c } = controller({ list: vi.fn().mockResolvedValue(listed), revokeAll: vi.fn().mockResolvedValue(1) });
    expect((await c.list(user, reqWith(SID))).sessions).toHaveLength(2);
    expect(await c.revokeOthers(user, reqWith(SID))).toEqual({ success: true, revoked: 1 });

    vi.stubEnv('DEMO_MODE', '');
    expect((await c.list(demo, reqWith(SID))).sessions).toHaveLength(2);
    expect(await c.revokeOthers(demo, reqWith(SID))).toEqual({ success: true, revoked: 1 });
  });
});
