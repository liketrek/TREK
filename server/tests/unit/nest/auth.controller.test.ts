import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { AuthPublicController } from '../../../src/nest/auth/auth-public.controller';
import { AuthController } from '../../../src/nest/auth/auth.controller';
import type { TokenService } from '../../../src/nest/tokens/token.service';
import type { UserProfileService } from '../../../src/nest/auth/user-profile.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import { isDemoEmail } from '../../../src/nest/common/demo';
import type { User } from '../../../src/types';
import { anyBody } from '../../helpers/dto';
import type { ForgotPasswordDto } from '../../../src/nest/auth/auth.dto';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;
const req = { ip: '9.9.9.9', headers: {} } as Request;
const res = {} as Response;

function asvc(o: Partial<AuthService> = {}): AuthService {
  return { setAuthCookie: vi.fn(), clearAuthCookie: vi.fn(), getAppUrl: vi.fn(() => 'https://x'), sendPasswordResetEmail: vi.fn(), ...o } as unknown as AuthService;
}
function rl(): RateLimitService { return new RateLimitService(); }

// AuditService is constructor-injected since the auditLog DI migration; the
// wrappers keep the historical construction sites positional.
const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
const apc = (a: AuthService, limiter: RateLimitService) => new AuthPublicController(a, limiter, audit);
// Tokens moved to TokenService; the controller takes it second. Stubbed via a
// third, optional argument so every non-token call site stays as it was.
const storageStub = { put: vi.fn().mockResolvedValue(undefined) } as unknown as import('../../../src/nest/storage/storage.service').StorageService;
const ac = (a: AuthService, limiter: RateLimitService, t: Partial<TokenService> = {}, pr: Partial<UserProfileService> = {}) =>
  new AuthController(a, pr as UserProfileService, t as TokenService, limiter, audit, new RuntimeEnvService(), storageStub);

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
afterEach(() => { delete process.env.DEMO_MODE; });

describe('RateLimitService', () => {
  it('allows up to max then blocks within the window; buckets are isolated', () => {
    const s = rl();
    expect(s.check('login', 'ip', 2, 1000, 0)).toBe(true);
    expect(s.check('login', 'ip', 2, 1000, 10)).toBe(true);
    expect(s.check('login', 'ip', 2, 1000, 20)).toBe(false); // 3rd within window
    expect(s.check('mfa', 'ip', 2, 1000, 20)).toBe(true);     // different bucket
    expect(s.check('login', 'ip', 2, 1000, 2000)).toBe(true); // window elapsed -> reset
  });

  it('reset clears a single named bucket, and reset() clears all of them', () => {
    const s = rl();
    s.check('login', 'ip', 1, 1000, 0); // login bucket now at its cap
    s.check('mfa', 'ip', 1, 1000, 0);   // mfa bucket now at its cap
    expect(s.check('login', 'ip', 1, 1000, 0)).toBe(false);
    s.reset('login'); // only the login bucket
    expect(s.check('login', 'ip', 1, 1000, 0)).toBe(true);
    expect(s.check('mfa', 'ip', 1, 1000, 0)).toBe(false); // mfa untouched
    s.reset(); // everything
    expect(s.check('mfa', 'ip', 1, 1000, 0)).toBe(true);
  });
});

describe('AuthPublicController', () => {
  it('demo-login maps error, else sets the cookie + returns token/user', () => {
    expect(thrown(() => apc(asvc({ demoLogin: vi.fn().mockReturnValue({ error: 'Demo disabled', status: 403 }) } as Partial<AuthService>), rl()).demoLogin(req, res))).toEqual({ status: 403, body: { error: 'Demo disabled' } });
    const setAuthCookie = vi.fn();
    const c = apc(asvc({ demoLogin: vi.fn().mockReturnValue({ token: 'tk', user }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.demoLogin(req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req);
  });

  it('register audits + sets cookie; maps error', () => {
    expect(thrown(() => apc(asvc({ registerUser: vi.fn().mockReturnValue({ error: 'Email taken', status: 409 }) } as Partial<AuthService>), rl()).register(anyBody(), req, res))).toEqual({ status: 409, body: { error: 'Email taken' } });
    const setAuthCookie = vi.fn();
    const c = apc(asvc({ registerUser: vi.fn().mockReturnValue({ token: 'tk', user, auditUserId: 1, auditDetails: {} }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.register({ email: 'a@b.c', password: 'p' }, req, res)).toEqual({ token: 'tk', user });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.register' }));
    expect(setAuthCookie).toHaveBeenCalled();
  });

  it('invite 429 when rate-limited', () => {
    const s = rl();
    s.check('login', '9.9.9.9', 10, 15 * 60 * 1000, Date.now()); // not exhausted yet
    const c = apc(asvc({ validateInviteToken: vi.fn().mockReturnValue({ valid: true, max_uses: 1, used_count: 0, expires_at: null }) } as Partial<AuthService>), s);
    expect(c.invite('tok', req)).toEqual({ valid: true, max_uses: 1, used_count: 0, expires_at: null });
  });

  it('login: mfa branch, success cookie, error mapping', async () => {
    const setAuthCookie = vi.fn();
    const mfa = apc(asvc({ loginUser: vi.fn().mockReturnValue({ mfa_required: true, mfa_token: 'mt' }) } as Partial<AuthService>), rl());
    expect(await mfa.login(anyBody(), req, res)).toEqual({ mfa_required: true, mfa_token: 'mt' });
    const ok = apc(asvc({ loginUser: vi.fn().mockReturnValue({ token: 'tk', user, remember: true }), setAuthCookie } as Partial<AuthService>), rl());
    expect(await ok.login(anyBody(), req, res)).toEqual({ token: 'tk', user });
    // The "remember me" flag from the service rides through to the cookie service.
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req, true);
    const bad = apc(asvc({ loginUser: vi.fn().mockReturnValue({ error: 'Bad creds', status: 401, auditAction: 'user.login_fail' }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => bad.login(anyBody(), req, res))).toEqual({ status: 401, body: { error: 'Bad creds' } });
  }, 10000);

  it('forgot-password issues a reset email then returns the generic ok', async () => {
    const sendPasswordResetEmail = vi.fn().mockResolvedValue({ delivered: true });
    const c = apc(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'issued', tokenForDelivery: 'rt', userEmail: 'a@b.c', userId: 1 }), sendPasswordResetEmail } as Partial<AuthService>), rl());
    expect(await c.forgotPassword({ email: 'a@b.c' }, req)).toEqual({ ok: true });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('a@b.c', 'https://x/reset-password?token=rt', 1);
  }, 10000);

  it('reset-password: error audits a fail, mfa branch, success', () => {
    expect(thrown(() => apc(asvc({ resetPassword: vi.fn().mockReturnValue({ error: 'Invalid token', status: 400 }) } as Partial<AuthService>), rl()).resetPassword(anyBody(), req))).toEqual({ status: 400, body: { error: 'Invalid token' } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_reset_fail' }));
    expect(apc(asvc({ resetPassword: vi.fn().mockReturnValue({ mfa_required: true }) } as Partial<AuthService>), rl()).resetPassword(anyBody(), req)).toEqual({ mfa_required: true });
    expect(apc(asvc({ resetPassword: vi.fn().mockReturnValue({ userId: 1 }) } as Partial<AuthService>), rl()).resetPassword(anyBody(), req)).toEqual({ success: true });
  });

  it('app-config forwards the optional user (present and absent)', () => {
    const getAppConfig = vi.fn().mockReturnValue({ version: '3' });
    const c = apc(asvc({ getAppConfig } as Partial<AuthService>), rl());
    expect(c.appConfig({ user } as unknown as Request)).toEqual({ version: '3' });
    expect(getAppConfig).toHaveBeenLastCalledWith(user);
    expect(c.appConfig({} as Request)).toEqual({ version: '3' });
    expect(getAppConfig).toHaveBeenLastCalledWith(undefined);
  });

  it('invite maps a service error', () => {
    const c = apc(asvc({ validateInviteToken: vi.fn().mockReturnValue({ error: 'Expired', status: 410 }) } as Partial<AuthService>), rl());
    expect(thrown(() => c.invite('tok', req))).toEqual({ status: 410, body: { error: 'Expired' } });
  });

  it('login takes the mfa-required branch and never sets a cookie', async () => {
    const setAuthCookie = vi.fn();
    const c = apc(asvc({ loginUser: vi.fn().mockReturnValue({ mfa_required: true, mfa_token: 'mt', auditAction: 'user.login_mfa' }), setAuthCookie } as Partial<AuthService>), rl());
    expect(await c.login(anyBody(), req, res)).toEqual({ mfa_required: true, mfa_token: 'mt' });
    expect(setAuthCookie).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.login_mfa' }));
  }, 10000);

  it('forgot-password: non-issued reason and a delivery failure both still return ok', async () => {
    // Non-issued (unknown email / throttled): audits the reason, no email sent.
    const sendNever = vi.fn();
    const skip = apc(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'not_found', userId: null }), sendPasswordResetEmail: sendNever } as Partial<AuthService>), rl());
    expect(await skip.forgotPassword({ email: 'x@y.z' }, req)).toEqual({ ok: true });
    expect(sendNever).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_reset_request', details: { reason: 'not_found' } }));
    // Issued but the mailer throws: swallowed, audited as failed, still ok.
    const boom = vi.fn().mockRejectedValue(new Error('smtp'));
    const fail = apc(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'issued', tokenForDelivery: 'rt', userEmail: 'a@b.c', userId: 1 }), sendPasswordResetEmail: boom } as Partial<AuthService>), rl());
    expect(await fail.forgotPassword({ email: 'a@b.c' }, req)).toEqual({ ok: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ details: { delivered: 'failed' } }));
  }, 10000);

  it('forgot-password ignores a non-string email body', async () => {
    const requestPasswordReset = vi.fn().mockReturnValue({ reason: 'not_found', userId: null });
    const c = apc(asvc({ requestPasswordReset } as Partial<AuthService>), rl());
    expect(await c.forgotPassword(anyBody<ForgotPasswordDto>({ email: 42 as unknown as string }), req)).toEqual({ ok: true });
    expect(requestPasswordReset).toHaveBeenCalledWith('', expect.any(String));
  }, 10000);

  it('reset-password 429 once the dedicated reset bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    for (let i = 0; i < 5; i++) s.check('reset', '9.9.9.9', 5, 15 * 60 * 1000, now);
    const c = apc(asvc({ resetPassword: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.resetPassword(anyBody(), req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('mfa/verify-login maps a service error', () => {
    const c = apc(asvc({ verifyMfaLogin: vi.fn().mockReturnValue({ error: 'Bad code', status: 401 }) } as Partial<AuthService>), rl());
    expect(thrown(() => c.verifyMfaLogin(anyBody(), req, res))).toEqual({ status: 401, body: { error: 'Bad code' } });
  });

  it('demo-login + register + invite throw 429 when the login bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    for (let i = 0; i < 10; i++) s.check('login', '9.9.9.9', 10, 15 * 60 * 1000, now);
    const c = apc(asvc({ registerUser: vi.fn(), validateInviteToken: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.register(anyBody(), req, res))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
    expect(thrown(() => c.invite('t', req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('mfa/verify-login sets cookie + audits; logout clears cookie', () => {
    const setAuthCookie = vi.fn();
    const c = apc(asvc({ verifyMfaLogin: vi.fn().mockReturnValue({ token: 'tk', user, auditUserId: 1 }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.verifyMfaLogin(anyBody(), req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalled();
    const clearAuthCookie = vi.fn();
    expect(apc(asvc({ clearAuthCookie } as Partial<AuthService>), rl()).logout(req, res)).toEqual({ success: true });
    expect(clearAuthCookie).toHaveBeenCalledWith(res, req);
  });
});

describe('AuthController (authenticated)', () => {
  it('GET /me 404 when missing, else returns the loaded user', () => {
    expect(thrown(() => ac(asvc({ getCurrentUser: vi.fn().mockReturnValue(undefined) } as Partial<AuthService>), rl()).me(user))).toEqual({ status: 404, body: { error: 'User not found' } });
    expect(ac(asvc({ getCurrentUser: vi.fn().mockReturnValue({ id: 1 }) } as Partial<AuthService>), rl()).me(user)).toEqual({ user: { id: 1 } });
  });

  it('change-password maps error, else audits', () => {
    expect(thrown(() => ac(asvc({ changePassword: vi.fn().mockReturnValue({ error: 'Wrong', status: 400 }) } as Partial<AuthService>), rl()).changePassword(user, anyBody(), req, res))).toEqual({ status: 400, body: { error: 'Wrong' } });
    expect(ac(asvc({ changePassword: vi.fn().mockReturnValue({}) } as Partial<AuthService>), rl()).changePassword(user, anyBody(), req, res)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_change' }));
  });

  it('avatar 403 in demo mode, 400 without a file, else saves', async () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(true);
    expect(await thrownAsync(() => ac(asvc(), rl()).avatar(user, { filename: 'a.jpg' } as Express.Multer.File))).toEqual({ status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' } });
    vi.mocked(isDemoEmail).mockReturnValue(false);
    delete process.env.DEMO_MODE;
    expect(await thrownAsync(() => ac(asvc(), rl()).avatar(user, undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
    const saveAvatar = vi.fn().mockResolvedValue({ avatar: '/a.jpg' });
    expect(await ac(asvc({}), rl(), {}, { saveAvatar }).avatar(user, { filename: 'a.jpg' } as Express.Multer.File)).toEqual({ avatar: '/a.jpg' });
  });

  it('mfa/setup awaits the QR promise, maps a generation failure to 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = ac(asvc({ setupMfa: vi.fn().mockReturnValue({ secret: 's', otpauth_url: 'o', qrPromise: Promise.resolve('<svg>') }) } as Partial<AuthService>), rl());
    expect(await ok.mfaSetup(user)).toEqual({ secret: 's', otpauth_url: 'o', qr_svg: '<svg>' });
    const fail = ac(asvc({ setupMfa: vi.fn().mockReturnValue({ secret: 's', otpauth_url: 'o', qrPromise: Promise.reject(new Error('x')) }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => fail.mfaSetup(user))).toEqual({ status: 500, body: { error: 'Could not generate QR code' } });
  });

  it('mfa/enable audits + returns backup codes; mcp-tokens create 201', () => {
    const enable = ac(asvc({ enableMfa: vi.fn().mockReturnValue({ mfa_enabled: true, backup_codes: ['a', 'b'] }) } as Partial<AuthService>), rl());
    expect(enable.mfaEnable(user, { code: '123456' }, req)).toEqual({ success: true, mfa_enabled: true, backup_codes: ['a', 'b'] });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.mfa_enable' }));
    const tok = ac(asvc({}), rl(), { createMcpToken: vi.fn().mockReturnValue({ token: 'mcp_x' }) });
    expect(tok.createMcpToken(user, { name: 'CLI' }, req)).toEqual({ token: 'mcp_x' });
  });

  it('resource-token 503 when unavailable, else returns the token payload', () => {
    expect(thrown(() => ac(asvc({}), rl(), { createResourceToken: vi.fn().mockReturnValue(null) }).resourceToken(user, {}))).toEqual({ status: 503, body: { error: 'Service unavailable' } });
    expect(ac(asvc({}), rl(), { createResourceToken: vi.fn().mockReturnValue({ token: 'rt' }) }).resourceToken(user, { purpose: 'download' })).toEqual({ token: 'rt' });
  });

  it('ws/resource tokens throttle on their own buckets, so a mint loop cannot drain the store or block login', () => {
    const s = rl();
    const now = Date.now();
    for (let i = 0; i < 120; i++) s.check('ws_token', String(user.id), 120, 15 * 60 * 1000, now);
    expect(thrown(() => ac(asvc({}), s, { createWsToken: vi.fn().mockReturnValue({ token: 'ws' }) }).wsToken(user)))
      .toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
    // The login bucket is untouched: an exhausted socket loop must not lock the account out.
    expect(s.check('login', '9.9.9.9', 5, 15 * 60 * 1000, now)).toBe(true);

    const s2 = rl();
    for (let i = 0; i < 120; i++) s2.check('resource_token', String(user.id), 120, 15 * 60 * 1000, now);
    expect(thrown(() => ac(asvc({}), s2, { createResourceToken: vi.fn().mockReturnValue({ token: 'rt' }) }).resourceToken(user, {})))
      .toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('the ws/resource ceilings are per account, not per address: one heavy user cannot 429 the office', () => {
    const s = rl();
    const now = Date.now();
    const other = { ...user, id: 2 } as User;
    // Both users sit behind the same NAT address, and the first one burns its
    // whole ceiling.
    for (let i = 0; i < 120; i++) {
      ac(asvc({}), s, { createWsToken: vi.fn().mockReturnValue({ token: 'ws' }) }).wsToken(user);
    }
    expect(thrown(() => ac(asvc({}), s, { createWsToken: vi.fn().mockReturnValue({ token: 'ws' }) }).wsToken(user)))
      .toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });

    expect(ac(asvc({}), s, { createWsToken: vi.fn().mockReturnValue({ token: 'ws2' }) }).wsToken(other)).toEqual({ token: 'ws2' });
    expect(ac(asvc({}), s, { createResourceToken: vi.fn().mockReturnValue({ token: 'rt2' }) }).resourceToken(other, {})).toEqual({ token: 'rt2' });
  });

  it('rate-limited account ops throw 429 once the bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    // exhaust the shared 'login' bucket for this ip (max 5)
    for (let i = 0; i < 5; i++) s.check('login', '9.9.9.9', 5, 15 * 60 * 1000, now);
    const c = ac(asvc({ changePassword: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.changePassword(user, anyBody(), req, res))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('change-password refreshes this device cookie when the service returns a token', () => {
    const setAuthCookie = vi.fn();
    const c = ac(asvc({ changePassword: vi.fn().mockReturnValue({ token: 'tk2' }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.changePassword(user, anyBody(), req, res)).toEqual({ success: true });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk2', req, undefined);
  });

  it('change-password carries the session cookie remember claim into the service and the re-issued cookie (#1927)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const remembered = jwt.sign({ id: 1, pv: 0, remember: true }, 'any-secret');
    const reqCookie = { ip: '9.9.9.9', headers: {}, cookies: { trek_session: remembered } } as unknown as Request;
    const setAuthCookie = vi.fn();
    const changePassword = vi.fn().mockReturnValue({ token: 'tk3' });
    const c = ac(asvc({ changePassword, setAuthCookie } as Partial<AuthService>), rl());
    expect(c.changePassword(user, anyBody(), reqCookie, res)).toEqual({ success: true });
    expect(changePassword).toHaveBeenCalledWith(1, 'u@example.test', anyBody(), true);
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk3', reqCookie, true);
  });

  it('delete-account maps error, else audits and succeeds', () => {
    expect(thrown(() => ac(asvc({ deleteAccount: vi.fn().mockReturnValue({ error: 'Last admin', status: 403 }) } as Partial<AuthService>), rl()).deleteAccount(user, req))).toEqual({ status: 403, body: { error: 'Last admin' } });
    expect(ac(asvc({ deleteAccount: vi.fn().mockReturnValue({}) } as Partial<AuthService>), rl()).deleteAccount(user, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.account_delete' }));
  });

  it('maps-key + api-keys pass straight through to the service', () => {
    const updateMapsKey = vi.fn().mockReturnValue({ success: true });
    expect(ac(asvc({}), rl(), {}, { updateMapsKey }).mapsKey(user, { maps_api_key: 'k' }, req)).toEqual({ success: true });
    expect(updateMapsKey).toHaveBeenCalledWith(1, 'k');
    const updateApiKeys = vi.fn().mockReturnValue({ ok: 1 });
    expect(ac(asvc({}), rl(), {}, { updateApiKeys }).apiKeys(user, anyBody({ a: 1 } as never), req)).toEqual({ ok: 1 });
    // No changedKeys from the service (and none in the body): nothing to audit.
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('api-keys audits one settings.api_keys_update with the changed names only (#1939)', () => {
    const updateApiKeys = vi.fn().mockReturnValue({ success: true, user: { id: 1 }, changedKeys: ['maps_api_key'] });
    const c = ac(asvc({}), rl(), {}, { updateApiKeys });
    // changedKeys is stripped off the response — the client body is unchanged.
    expect(c.apiKeys(user, anyBody({ maps_api_key: 'AIza-super-secret' } as never), req)).toEqual({ success: true, user: { id: 1 } });
    expect(writeAudit).toHaveBeenCalledTimes(1);
    expect(writeAudit).toHaveBeenCalledWith({
      userId: 1,
      action: 'settings.api_keys_update',
      resource: 'api_keys',
      ip: '1.2.3.4',
      details: { changed: ['maps_api_key'] },
    });
    // Never the value, not even truncated: details is rendered raw in the panel.
    expect(JSON.stringify(writeAudit.mock.calls)).not.toContain('AIza-super-secret');
  });

  it('maps-key and settings audit the same action; an unchanged save writes nothing', () => {
    const mapsC = ac(asvc({}), rl(), {}, { updateMapsKey: vi.fn().mockReturnValue({ success: true, changedKeys: ['maps_api_key'] }) });
    mapsC.mapsKey(user, { maps_api_key: 'k' }, req);
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'settings.api_keys_update', details: { changed: ['maps_api_key'] } }));

    writeAudit.mockClear();
    const setC = ac(asvc({}), rl(), {}, { updateSettings: vi.fn().mockReturnValue({ success: true, user: { id: 1 }, changedKeys: ['unsplash_api_key'] }) });
    expect(setC.updateSettings(user, {}, req)).toEqual({ success: true, user: { id: 1 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'settings.api_keys_update', details: { changed: ['unsplash_api_key'] } }));

    // The test button in the panel saves before every click — an identical value
    // must not cost a log line.
    writeAudit.mockClear();
    ac(asvc({}), rl(), {}, { updateApiKeys: vi.fn().mockReturnValue({ success: true, changedKeys: [] }) })
      .apiKeys(user, anyBody({ maps_api_key: 'same' } as never), req);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('update-settings + get-settings map errors, else return their payloads', () => {
    expect(thrown(() => ac(asvc({}), rl(), {}, { updateSettings: vi.fn().mockReturnValue({ error: 'Bad', status: 400 }) }).updateSettings(user, {}, req))).toEqual({ status: 400, body: { error: 'Bad' } });
    expect(ac(asvc({}), rl(), {}, { updateSettings: vi.fn().mockReturnValue({ success: true, user: { id: 1 } }) }).updateSettings(user, {}, req)).toEqual({ success: true, user: { id: 1 } });
    expect(thrown(() => ac(asvc({}), rl(), {}, { getSettings: vi.fn().mockReturnValue({ error: 'Nope', status: 404 }) }).getSettings(user))).toEqual({ status: 404, body: { error: 'Nope' } });
    expect(ac(asvc({}), rl(), {}, { getSettings: vi.fn().mockReturnValue({ settings: { theme: 'dark' } }) }).getSettings(user)).toEqual({ settings: { theme: 'dark' } });
  });

  // travel-stats left with getTravelStats; it is covered by
  // atlas.controller.test.ts (TravelStatsController).
  it('delete-avatar + users delegate to the service', async () => {
    const deleteAvatar = vi.fn().mockResolvedValue({ removed: true });
    expect(await ac(asvc({}), rl(), {}, { deleteAvatar }).deleteAvatar(user)).toEqual({ removed: true });
    const listUsers = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(ac(asvc({}), rl(), {}, { listUsers }).users(user)).toEqual({ users: [{ id: 1 }] });
    expect(listUsers).toHaveBeenCalledWith(1);
  });

  it('validate-keys maps error, else returns the maps/weather payload', async () => {
    expect(await thrownAsync(() => ac(asvc({}), rl(), {}, { validateKeys: vi.fn().mockResolvedValue({ error: 'fail', status: 502 }) }).validateKeys(user))).toEqual({ status: 502, body: { error: 'fail' } });
    const ok = ac(asvc({}), rl(), {}, { validateKeys: vi.fn().mockResolvedValue({ maps: true, weather: false, maps_details: { ok: 1 } }) });
    expect(await ok.validateKeys(user)).toEqual({ maps: true, weather: false, maps_details: { ok: 1 } });
  });

  it('app-settings get maps error, else returns data; put maps error, else audits', () => {
    expect(thrown(() => ac(asvc({ getAppSettings: vi.fn().mockReturnValue({ error: 'denied', status: 403 }) } as Partial<AuthService>), rl()).getAppSettings(user))).toEqual({ status: 403, body: { error: 'denied' } });
    expect(ac(asvc({ getAppSettings: vi.fn().mockReturnValue({ data: { x: 1 } }) } as Partial<AuthService>), rl()).getAppSettings(user)).toEqual({ x: 1 });
    expect(thrown(() => ac(asvc({ updateAppSettings: vi.fn().mockReturnValue({ error: 'bad', status: 400 }) } as Partial<AuthService>), rl()).updateAppSettings(user, {}, req))).toEqual({ status: 400, body: { error: 'bad' } });
    expect(ac(asvc({ updateAppSettings: vi.fn().mockReturnValue({ auditSummary: 's', auditDebugDetails: 'd' }) } as Partial<AuthService>), rl()).updateAppSettings(user, {}, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'settings.app_update' }));
  });

  it('mfa/setup maps a service error before ever awaiting the QR promise', async () => {
    const c = ac(asvc({ setupMfa: vi.fn().mockReturnValue({ error: 'already on', status: 409 }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => c.mfaSetup(user))).toEqual({ status: 409, body: { error: 'already on' } });
  });

  it('mfa/enable + mfa/disable map errors', () => {
    expect(thrown(() => ac(asvc({ enableMfa: vi.fn().mockReturnValue({ error: 'Invalid code', status: 400 }) } as Partial<AuthService>), rl()).mfaEnable(user, { code: 'x' }, req))).toEqual({ status: 400, body: { error: 'Invalid code' } });
    expect(thrown(() => ac(asvc({ disableMfa: vi.fn().mockReturnValue({ error: 'Wrong', status: 401 }) } as Partial<AuthService>), rl()).mfaDisable(user, anyBody(), req))).toEqual({ status: 401, body: { error: 'Wrong' } });
    const ok = ac(asvc({ disableMfa: vi.fn().mockReturnValue({ mfa_enabled: false }) } as Partial<AuthService>), rl());
    expect(ok.mfaDisable(user, anyBody(), req)).toEqual({ success: true, mfa_enabled: false });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.mfa_disable' }));
  });

  it('mcp-tokens list + create error + delete error/success', () => {
    expect(ac(asvc({}), rl(), { listMcpTokens: vi.fn().mockReturnValue([{ id: 't' }]) }).listMcpTokens(user)).toEqual({ tokens: [{ id: 't' }] });
    expect(thrown(() => ac(asvc({}), rl(), { createMcpToken: vi.fn().mockReturnValue({ error: 'Name taken', status: 409 }) }).createMcpToken(user, { name: 'x' }, req))).toEqual({ status: 409, body: { error: 'Name taken' } });
    expect(thrown(() => ac(asvc({}), rl(), { deleteMcpToken: vi.fn().mockReturnValue({ error: 'Not found', status: 404 }) }).deleteMcpToken(user, 'tid'))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(ac(asvc({}), rl(), { deleteMcpToken: vi.fn().mockReturnValue({}) }).deleteMcpToken(user, 'tid')).toEqual({ success: true });
  });

  it('ws-token maps error, else returns the token', () => {
    expect(thrown(() => ac(asvc({}), rl(), { createWsToken: vi.fn().mockReturnValue({ error: 'down', status: 503 }) }).wsToken(user))).toEqual({ status: 503, body: { error: 'down' } });
    expect(ac(asvc({}), rl(), { createWsToken: vi.fn().mockReturnValue({ token: 'ws' }) }).wsToken(user)).toEqual({ token: 'ws' });
  });

  it('avatar saves when not in demo mode (env present but email is not a demo email)', async () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(false);
    const saveAvatar = vi.fn().mockResolvedValue({ avatar: '/b.png' });
    expect(await ac(asvc({}), rl(), {}, { saveAvatar }).avatar(user, { filename: 'b.png' } as Express.Multer.File)).toEqual({ avatar: '/b.png' });
  });
});
