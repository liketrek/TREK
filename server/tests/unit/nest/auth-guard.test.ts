import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/middleware/auth', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));
vi.mock('../../../src/services/authService', () => ({ resolveAuthToggles: vi.fn() }));
vi.mock('../../../src/services/cookie', () => ({ setAuthCookie: vi.fn() }));
vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/services/passkeyService', () => ({
  passkeyRegisterOptions: vi.fn(),
  passkeyRegisterVerify: vi.fn(),
  passkeyLoginOptions: vi.fn(),
  passkeyLoginVerify: vi.fn(),
  listPasskeys: vi.fn(),
  renamePasskey: vi.fn(),
  deletePasskey: vi.fn(),
}));

import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { CookieAuthGuard } from '../../../src/nest/auth/cookie-auth.guard';
import { OptionalJwtGuard } from '../../../src/nest/auth/optional-jwt.guard';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';
import { PasskeyEnabledGuard } from '../../../src/nest/auth/passkey-enabled.guard';
import { PasskeyController } from '../../../src/nest/auth/passkey.controller';
import { RateLimitService } from '../../../src/nest/auth/rate-limit.service';
import { CurrentUser } from '../../../src/nest/auth/current-user.decorator';
import { extractToken, verifyJwtAndLoadUser } from '../../../src/middleware/auth';
import { resolveAuthToggles } from '../../../src/services/authService';
import { setAuthCookie } from '../../../src/services/cookie';
import { writeAudit } from '../../../src/services/auditLog';
import * as passkey from '../../../src/services/passkeyService';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

function context(req: unknown) {
  return { switchToHttp: () => ({ getRequest: () => req }) } as never;
}
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}
async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('rejects with the legacy 401 { error, code } when no token is present', () => {
    vi.mocked(extractToken).mockReturnValue(null);
    expect(thrown(() => guard.canActivate(context({ headers: {}, cookies: {} })))).toEqual({
      status: 401,
      body: { error: 'Access token required', code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects an invalid/expired token (verify returns null)', () => {
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(null);
    expect(thrown(() => guard.canActivate(context({ headers: {} })))).toEqual({
      status: 401,
      body: { error: 'Invalid or expired token', code: 'AUTH_REQUIRED' },
    });
  });

  it('attaches the loaded user and allows a valid token through', () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(user);
    expect(guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('CookieAuthGuard', () => {
  const guard = new CookieAuthGuard();

  it('401s when the trek_session cookie is missing', () => {
    expect(thrown(() => guard.canActivate(context({ cookies: {} })))).toEqual({
      status: 401,
      body: { error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' },
    });
    // and when there is no cookies object at all
    expect(thrown(() => guard.canActivate(context({})))).toEqual({
      status: 401,
      body: { error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' },
    });
  });

  it('401s when the cookie token fails verification', () => {
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(null);
    expect(thrown(() => guard.canActivate(context({ cookies: { trek_session: 'tok' } })))).toEqual({
      status: 401,
      body: { error: 'Invalid or expired session', code: 'AUTH_REQUIRED' },
    });
  });

  it('attaches the user and allows a valid cookie session through', () => {
    const req: Record<string, unknown> = { cookies: { trek_session: 'tok' } };
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(user);
    expect(guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('OptionalJwtGuard', () => {
  const guard = new OptionalJwtGuard();

  it('always allows; sets req.user to null when no token', () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue(null);
    expect(guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBeNull();
    expect(verifyJwtAndLoadUser).not.toHaveBeenCalled();
  });

  it('sets req.user to null when a token verifies to nothing', () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(null);
    expect(guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBeNull();
  });

  it('populates req.user from a valid token', () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockReturnValue(user);
    expect(guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('403s for anonymous and for a non-admin role', () => {
    expect(thrown(() => guard.canActivate(context({})))).toEqual({ status: 403, body: { error: 'Admin access required' } });
    expect(thrown(() => guard.canActivate(context({ user: { role: 'user' } })))).toEqual({ status: 403, body: { error: 'Admin access required' } });
  });

  it('allows an admin through', () => {
    expect(guard.canActivate(context({ user: { role: 'admin' } }))).toBe(true);
  });
});

describe('PasskeyEnabledGuard', () => {
  const guard = new PasskeyEnabledGuard();

  it('404s when passkey_login is off', () => {
    vi.mocked(resolveAuthToggles).mockReturnValue({ passkey_login: false } as ReturnType<typeof resolveAuthToggles>);
    expect(thrown(() => guard.canActivate())).toEqual({ status: 404, body: { error: 'Passkey login is not enabled' } });
  });

  it('allows when passkey_login is on', () => {
    vi.mocked(resolveAuthToggles).mockReturnValue({ passkey_login: true } as ReturnType<typeof resolveAuthToggles>);
    expect(guard.canActivate()).toBe(true);
  });
});

describe('CurrentUser decorator', () => {
  // Apply the decorator to a throwaway handler so Nest stores the param factory in
  // route metadata, then invoke that factory exactly as the framework would.
  function paramFactory(): (data: unknown, ctx: unknown) => User | undefined {
    class Target { handler(_u: User) {} }
    (CurrentUser() as ParameterDecorator)(Target.prototype, 'handler', 0);
    const meta = Reflect.getMetadata('__routeArguments__', Target, 'handler') as Record<string, { factory: (data: unknown, ctx: unknown) => User | undefined }>;
    return Object.values(meta)[0].factory;
  }

  it('resolves the authenticated user from the request', () => {
    expect(paramFactory()(undefined, context({ user }))).toBe(user);
  });

  it('returns undefined when no user is attached', () => {
    expect(paramFactory()(undefined, context({}))).toBeUndefined();
  });
});

describe('PasskeyController', () => {
  const req = { ip: '9.9.9.9' } as Request;
  const res = {} as never;
  function rl(): RateLimitService { return new RateLimitService(); }

  it('register/options maps a service error, else returns the options', async () => {
    vi.mocked(passkey.passkeyRegisterOptions).mockResolvedValue({ error: 'Incorrect password', status: 401 });
    expect(await thrownAsync(() => new PasskeyController(rl()).registerOptions(user, { password: 'x' }, req))).toEqual({ status: 401, body: { error: 'Incorrect password' } });
    vi.mocked(passkey.passkeyRegisterOptions).mockResolvedValue({ options: { challenge: 'c' } as never });
    expect(await new PasskeyController(rl()).registerOptions(user, { password: 'p' }, req)).toEqual({ challenge: 'c' });
  });

  it('register/verify maps a service error, else audits and returns the credential', async () => {
    vi.mocked(passkey.passkeyRegisterVerify).mockResolvedValue({ error: 'Verification failed', status: 400 } as never);
    expect(await thrownAsync(() => new PasskeyController(rl()).registerVerify(user, {}, req))).toEqual({ status: 400, body: { error: 'Verification failed' } });
    vi.mocked(passkey.passkeyRegisterVerify).mockResolvedValue({ credential: { id: 'cr' } } as never);
    expect(await new PasskeyController(rl()).registerVerify(user, {}, req)).toEqual({ success: true, credential: { id: 'cr' } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.passkey_register' }));
  });

  it('login/options maps a service error, else returns the options', async () => {
    vi.mocked(passkey.passkeyLoginOptions).mockResolvedValue({ error: 'Not configured', status: 503 } as never);
    expect(await thrownAsync(() => new PasskeyController(rl()).loginOptions(req))).toEqual({ status: 503, body: { error: 'Not configured' } });
    vi.mocked(passkey.passkeyLoginOptions).mockResolvedValue({ options: { challenge: 'd' } } as never);
    expect(await new PasskeyController(rl()).loginOptions(req)).toEqual({ challenge: 'd' });
  });

  it('login/verify audits a failure then maps the error, padding latency', async () => {
    vi.mocked(passkey.passkeyLoginVerify).mockResolvedValue({ error: 'No match', status: 401, auditAction: 'user.login_fail', auditUserId: null } as never);
    expect(await thrownAsync(() => new PasskeyController(rl()).loginVerify({}, req, res))).toEqual({ status: 401, body: { error: 'No match' } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.login_fail' }));
  }, 10000);

  it('login/verify sets the session cookie and audits login on success', async () => {
    vi.mocked(passkey.passkeyLoginVerify).mockResolvedValue({ token: 'tk', user, auditUserId: 1 } as never);
    expect(await new PasskeyController(rl()).loginVerify({}, req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req);
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.login', details: { method: 'passkey' } }));
  }, 10000);

  it('credentials: list, rename (error + success), delete (error + success)', () => {
    vi.mocked(passkey.listPasskeys).mockReturnValue([{ id: 'a' }]);
    expect(new PasskeyController(rl()).list(user)).toEqual({ credentials: [{ id: 'a' }] });

    vi.mocked(passkey.renamePasskey).mockReturnValue({ error: 'Not found', status: 404 });
    expect(thrown(() => new PasskeyController(rl()).rename(user, 'cid', { name: 'x' }))).toEqual({ status: 404, body: { error: 'Not found' } });
    vi.mocked(passkey.renamePasskey).mockReturnValue({ success: true });
    expect(new PasskeyController(rl()).rename(user, 'cid', { name: 'x' })).toEqual({ success: true });

    vi.mocked(passkey.deletePasskey).mockReturnValue({ error: 'Incorrect password', status: 401 });
    expect(thrown(() => new PasskeyController(rl()).remove(user, 'cid', { password: 'x' }, req))).toEqual({ status: 401, body: { error: 'Incorrect password' } });
    vi.mocked(passkey.deletePasskey).mockReturnValue({ success: true });
    expect(new PasskeyController(rl()).remove(user, 'cid', { password: 'p' }, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.passkey_delete' }));
  });

  it('throttles registration and login ceremonies once the bucket is exhausted', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) s.check('mfa', '9.9.9.9', 5, 15 * 60 * 1000, now);
    expect(await thrownAsync(() => new PasskeyController(s).registerOptions(user, {}, req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });

    const s2 = new RateLimitService();
    for (let i = 0; i < 10; i++) s2.check('login', '9.9.9.9', 10, 15 * 60 * 1000, now);
    expect(await thrownAsync(() => new PasskeyController(s2).loginOptions(req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('falls back to the "unknown" rate-limit key when req.ip is absent', async () => {
    vi.mocked(passkey.passkeyLoginOptions).mockResolvedValue({ options: { challenge: 'z' } } as never);
    const noIp = {} as Request;
    expect(await new PasskeyController(rl()).loginOptions(noIp)).toEqual({ challenge: 'z' });
  });
});
