import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { AdminGuard } from '../../../../src/nest/auth-core/admin.guard';
import { CookieAuthGuard } from '../../../../src/nest/auth-core/cookie-auth.guard';
import { CurrentUser } from '../../../../src/nest/auth-core/current-user.decorator';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { extractToken, verifyJwtAndLoadUser } from '../../../../src/nest/auth-core/jwt-verify';
import { OptionalJwtGuard } from '../../../../src/nest/auth-core/optional-jwt.guard';
import type { AuthService } from '../../../../src/nest/auth/auth.service';
import { PasskeyEnabledGuard } from '../../../../src/nest/auth/passkey-enabled.guard';
import { PasskeyController } from '../../../../src/nest/auth/passkey.controller';
import type { PasskeyService } from '../../../../src/nest/auth/passkey.service';
import { setAuthCookie } from '../../../../src/nest/common/cookie';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { RateLimitService } from '../../../../src/nest/common/rate-limit.service';
import type { User } from '../../../../src/types';
import type { EntityManager } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';

import type { Request } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/nest/auth-core/jwt-verify', () => ({ extractToken: vi.fn(), verifyJwtAndLoadUser: vi.fn() }));
vi.mock('../../../../src/nest/common/cookie', () => ({ setAuthCookie: vi.fn() }));
vi.mock('../../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

// AuditService is constructor-injected since the auditLog DI migration; the
// wrapper keeps the historical construction sites positional.
const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
// PasskeyService is constructor-injected since the passkey DI fold; a stub
// object replaces the old services/passkeyService path mock.
const passkey = {
  passkeyRegisterOptions: vi.fn(),
  passkeyRegisterVerify: vi.fn(),
  passkeyLoginOptions: vi.fn(),
  passkeyLoginVerify: vi.fn(),
  listPasskeys: vi.fn(),
  renamePasskey: vi.fn(),
  deletePasskey: vi.fn(),
};
const pc = (limiter: RateLimitService) => new PasskeyController(limiter, audit, passkey as unknown as PasskeyService);

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

// JwtAuthGuard/CookieAuthGuard/OptionalJwtGuard now inject EntityManager
// (Plan 3b Task 1 RULING) rather than reading the legacy `db` proxy through
// the mocked jwt-verify.ts — verifyJwtAndLoadUser itself is fully mocked
// above, so `em.getRepository` never needs to return anything meaningful;
// it just has to not throw when the guard calls it.
const emStub = { getRepository: () => ({}) } as unknown as EntityManager;

function context(req: unknown) {
  return { switchToHttp: () => ({ getRequest: () => req }) } as never;
}
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}
async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(emStub);

  it('rejects with the legacy 401 { error, code } when no token is present', async () => {
    vi.mocked(extractToken).mockReturnValue(null);
    expect(await thrownAsync(() => guard.canActivate(context({ headers: {}, cookies: {} })))).toEqual({
      status: 401,
      body: { error: 'Access token required', code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects an invalid/expired token (verify returns null)', async () => {
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(null);
    expect(await thrownAsync(() => guard.canActivate(context({ headers: {} })))).toEqual({
      status: 401,
      body: { error: 'Invalid or expired token', code: 'AUTH_REQUIRED' },
    });
  });

  it('attaches the loaded user and allows a valid token through', async () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(user);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('CookieAuthGuard', () => {
  const guard = new CookieAuthGuard(emStub);

  it('401s when the trek_session cookie is missing', async () => {
    expect(await thrownAsync(() => guard.canActivate(context({ cookies: {} })))).toEqual({
      status: 401,
      body: { error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' },
    });
    // and when there is no cookies object at all
    expect(await thrownAsync(() => guard.canActivate(context({})))).toEqual({
      status: 401,
      body: { error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' },
    });
  });

  it('401s when the cookie token fails verification', async () => {
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(null);
    expect(await thrownAsync(() => guard.canActivate(context({ cookies: { trek_session: 'tok' } })))).toEqual({
      status: 401,
      body: { error: 'Invalid or expired session', code: 'AUTH_REQUIRED' },
    });
  });

  it('attaches the user and allows a valid cookie session through', async () => {
    const req: Record<string, unknown> = { cookies: { trek_session: 'tok' } };
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(user);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('OptionalJwtGuard', () => {
  const guard = new OptionalJwtGuard(emStub);

  it('always allows; sets req.user to null when no token', async () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue(null);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBeNull();
    expect(verifyJwtAndLoadUser).not.toHaveBeenCalled();
  });

  it('sets req.user to null when a token verifies to nothing', async () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(null);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBeNull();
  });

  it('populates req.user from a valid token', async () => {
    const req: Record<string, unknown> = { headers: {} };
    vi.mocked(extractToken).mockReturnValue('tok');
    vi.mocked(verifyJwtAndLoadUser).mockResolvedValue(user);
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.user).toBe(user);
  });
});

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('403s for anonymous and for a non-admin role', () => {
    expect(thrown(() => guard.canActivate(context({})))).toEqual({
      status: 403,
      body: { error: 'Admin access required' },
    });
    expect(thrown(() => guard.canActivate(context({ user: { role: 'user' } })))).toEqual({
      status: 403,
      body: { error: 'Admin access required' },
    });
  });

  it('allows an admin through', () => {
    expect(guard.canActivate(context({ user: { role: 'admin' } }))).toBe(true);
  });
});

describe('PasskeyEnabledGuard', () => {
  // The guard injects AuthService since the auth DI fold; a resolveAuthToggles
  // stub replaces the old services/authService path mock.
  const resolveAuthToggles = vi.fn();
  const guard = new PasskeyEnabledGuard({ resolveAuthToggles } as unknown as AuthService);

  it('404s when passkey_login is off', async () => {
    resolveAuthToggles.mockResolvedValue({ passkey_login: false });
    expect(await thrownAsync(() => guard.canActivate())).toEqual({
      status: 404,
      body: { error: 'Passkey login is not enabled' },
    });
  });

  it('allows when passkey_login is on', async () => {
    resolveAuthToggles.mockResolvedValue({ passkey_login: true });
    expect(await guard.canActivate()).toBe(true);
  });
});

describe('CurrentUser decorator', () => {
  // Apply the decorator to a throwaway handler so Nest stores the param factory in
  // route metadata, then invoke that factory exactly as the framework would.
  function paramFactory(): (data: unknown, ctx: unknown) => User | undefined {
    class Target {
      handler(_u: User) {}
    }
    (CurrentUser() as ParameterDecorator)(Target.prototype, 'handler', 0);
    const meta = Reflect.getMetadata('__routeArguments__', Target, 'handler') as Record<
      string,
      { factory: (data: unknown, ctx: unknown) => User | undefined }
    >;
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
  const req = { ip: '9.9.9.9', headers: {} } as Request;
  const res = {} as never;
  function rl(): RateLimitService {
    return new RateLimitService();
  }

  it('register/options maps a service error, else returns the options', async () => {
    passkey.passkeyRegisterOptions.mockRejectedValue(new DomainError(401, 'Incorrect password'));
    expect(await thrownAsync(() => pc(rl()).registerOptions(user, { password: 'x' }, req))).toEqual({
      status: 401,
      body: { error: 'Incorrect password' },
    });
    passkey.passkeyRegisterOptions.mockResolvedValue({ options: { challenge: 'c' } as never });
    expect(await pc(rl()).registerOptions(user, { password: 'p' }, req)).toEqual({ challenge: 'c' });
  });

  it('register/verify maps a service error, else audits and returns the credential', async () => {
    passkey.passkeyRegisterVerify.mockRejectedValue(new DomainError(400, 'Verification failed'));
    expect(await thrownAsync(() => pc(rl()).registerVerify(user, {}, req))).toEqual({
      status: 400,
      body: { error: 'Verification failed' },
    });
    passkey.passkeyRegisterVerify.mockResolvedValue({ credential: { id: 'cr' } } as never);
    expect(await pc(rl()).registerVerify(user, {}, req)).toEqual({ success: true, credential: { id: 'cr' } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.passkey_register' }));
  });

  it('login/options maps a service error, else returns the options', async () => {
    passkey.passkeyLoginOptions.mockRejectedValue(new DomainError(503, 'Not configured'));
    expect(await thrownAsync(() => pc(rl()).loginOptions(req))).toEqual({
      status: 503,
      body: { error: 'Not configured' },
    });
    passkey.passkeyLoginOptions.mockResolvedValue({ options: { challenge: 'd' } } as never);
    expect(await pc(rl()).loginOptions(req)).toEqual({ challenge: 'd' });
  });

  it('login/verify audits a failure then maps the error, padding latency', async () => {
    passkey.passkeyLoginVerify.mockResolvedValue({
      error: 'No match',
      status: 401,
      auditAction: 'user.login_fail',
      auditUserId: null,
    } as never);
    expect(await thrownAsync(() => pc(rl()).loginVerify({}, req, res))).toEqual({
      status: 401,
      body: { error: 'No match' },
    });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.login_fail' }));
  }, 10000);

  it('login/verify sets the session cookie and audits login on success', async () => {
    passkey.passkeyLoginVerify.mockResolvedValue({ token: 'tk', user, auditUserId: 1 } as never);
    expect(await pc(rl()).loginVerify({}, req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.login', details: { method: 'passkey' } }),
    );
  }, 10000);

  it('credentials: list, rename (error + success), delete (error + success)', async () => {
    passkey.listPasskeys.mockResolvedValue([{ id: 'a' }]);
    expect(await pc(rl()).list(user)).toEqual({ credentials: [{ id: 'a' }] });

    passkey.renamePasskey.mockRejectedValue(new DomainError(404, 'Not found'));
    expect(await thrownAsync(() => pc(rl()).rename(user, 'cid', { name: 'x' }))).toEqual({
      status: 404,
      body: { error: 'Not found' },
    });
    passkey.renamePasskey.mockResolvedValue({ success: true });
    expect(await pc(rl()).rename(user, 'cid', { name: 'x' })).toEqual({ success: true });

    passkey.deletePasskey.mockRejectedValue(new DomainError(401, 'Incorrect password'));
    expect(await thrownAsync(() => pc(rl()).remove(user, 'cid', { password: 'x' }, req))).toEqual({
      status: 401,
      body: { error: 'Incorrect password' },
    });
    passkey.deletePasskey.mockResolvedValue({ success: true });
    expect(await pc(rl()).remove(user, 'cid', { password: 'p' }, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.passkey_delete' }));
  });

  it('throttles registration and login ceremonies once the bucket is exhausted', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) await s.check('mfa', '9.9.9.9', 5, 15 * 60 * 1000, now);
    expect(await thrownAsync(() => pc(s).registerOptions(user, {}, req))).toEqual({
      status: 429,
      body: { error: 'Too many attempts. Please try again later.' },
    });

    const s2 = new RateLimitService();
    for (let i = 0; i < 10; i++) await s2.check('login', '9.9.9.9', 10, 15 * 60 * 1000, now);
    expect(await thrownAsync(() => pc(s2).loginOptions(req))).toEqual({
      status: 429,
      body: { error: 'Too many attempts. Please try again later.' },
    });
  });

  it('falls back to the "unknown" rate-limit key when req.ip is absent', async () => {
    passkey.passkeyLoginOptions.mockResolvedValue({ options: { challenge: 'z' } } as never);
    const noIp = { headers: {} } as Request;
    expect(await pc(rl()).loginOptions(noIp)).toEqual({ challenge: 'z' });
  });
});
