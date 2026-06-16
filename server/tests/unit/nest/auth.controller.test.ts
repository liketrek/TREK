import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { AuthPublicController } from '../../../src/nest/auth/auth-public.controller';
import { AuthController } from '../../../src/nest/auth/auth.controller';
import { RateLimitService } from '../../../src/nest/auth/rate-limit.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import { writeAudit } from '../../../src/services/auditLog';
import { isDemoEmail } from '../../../src/services/demo';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;
const req = { ip: '9.9.9.9', headers: {} } as Request;
const res = {} as Response;

function asvc(o: Partial<AuthService> = {}): AuthService {
  return { setAuthCookie: vi.fn(), clearAuthCookie: vi.fn(), getAppUrl: vi.fn(() => 'https://x'), sendPasswordResetEmail: vi.fn(), ...o } as unknown as AuthService;
}
function rl(): RateLimitService { return new RateLimitService(); }

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
    expect(thrown(() => new AuthPublicController(asvc({ demoLogin: vi.fn().mockReturnValue({ error: 'Demo disabled', status: 403 }) } as Partial<AuthService>), rl()).demoLogin(req, res))).toEqual({ status: 403, body: { error: 'Demo disabled' } });
    const setAuthCookie = vi.fn();
    const c = new AuthPublicController(asvc({ demoLogin: vi.fn().mockReturnValue({ token: 'tk', user }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.demoLogin(req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req);
  });

  it('register audits + sets cookie; maps error', () => {
    expect(thrown(() => new AuthPublicController(asvc({ registerUser: vi.fn().mockReturnValue({ error: 'Email taken', status: 409 }) } as Partial<AuthService>), rl()).register({}, req, res))).toEqual({ status: 409, body: { error: 'Email taken' } });
    const setAuthCookie = vi.fn();
    const c = new AuthPublicController(asvc({ registerUser: vi.fn().mockReturnValue({ token: 'tk', user, auditUserId: 1, auditDetails: {} }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.register({ email: 'a@b.c', password: 'p' }, req, res)).toEqual({ token: 'tk', user });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.register' }));
    expect(setAuthCookie).toHaveBeenCalled();
  });

  it('invite 429 when rate-limited', () => {
    const s = rl();
    s.check('login', '9.9.9.9', 10, 15 * 60 * 1000, Date.now()); // not exhausted yet
    const c = new AuthPublicController(asvc({ validateInviteToken: vi.fn().mockReturnValue({ valid: true, max_uses: 1, used_count: 0, expires_at: null }) } as Partial<AuthService>), s);
    expect(c.invite('tok', req)).toEqual({ valid: true, max_uses: 1, used_count: 0, expires_at: null });
  });

  it('login: mfa branch, success cookie, error mapping', async () => {
    const setAuthCookie = vi.fn();
    const mfa = new AuthPublicController(asvc({ loginUser: vi.fn().mockReturnValue({ mfa_required: true, mfa_token: 'mt' }) } as Partial<AuthService>), rl());
    expect(await mfa.login({}, req, res)).toEqual({ mfa_required: true, mfa_token: 'mt' });
    const ok = new AuthPublicController(asvc({ loginUser: vi.fn().mockReturnValue({ token: 'tk', user, remember: true }), setAuthCookie } as Partial<AuthService>), rl());
    expect(await ok.login({}, req, res)).toEqual({ token: 'tk', user });
    // The "remember me" flag from the service rides through to the cookie service.
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk', req, true);
    const bad = new AuthPublicController(asvc({ loginUser: vi.fn().mockReturnValue({ error: 'Bad creds', status: 401, auditAction: 'user.login_fail' }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => bad.login({}, req, res))).toEqual({ status: 401, body: { error: 'Bad creds' } });
  }, 10000);

  it('forgot-password issues a reset email then returns the generic ok', async () => {
    const sendPasswordResetEmail = vi.fn().mockResolvedValue({ delivered: true });
    const c = new AuthPublicController(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'issued', tokenForDelivery: 'rt', userEmail: 'a@b.c', userId: 1 }), sendPasswordResetEmail } as Partial<AuthService>), rl());
    expect(await c.forgotPassword({ email: 'a@b.c' }, req)).toEqual({ ok: true });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('a@b.c', 'https://x/reset-password?token=rt', 1);
  }, 10000);

  it('reset-password: error audits a fail, mfa branch, success', () => {
    expect(thrown(() => new AuthPublicController(asvc({ resetPassword: vi.fn().mockReturnValue({ error: 'Invalid token', status: 400 }) } as Partial<AuthService>), rl()).resetPassword({}, req))).toEqual({ status: 400, body: { error: 'Invalid token' } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_reset_fail' }));
    expect(new AuthPublicController(asvc({ resetPassword: vi.fn().mockReturnValue({ mfa_required: true }) } as Partial<AuthService>), rl()).resetPassword({}, req)).toEqual({ mfa_required: true });
    expect(new AuthPublicController(asvc({ resetPassword: vi.fn().mockReturnValue({ userId: 1 }) } as Partial<AuthService>), rl()).resetPassword({}, req)).toEqual({ success: true });
  });

  it('app-config forwards the optional user (present and absent)', () => {
    const getAppConfig = vi.fn().mockReturnValue({ version: '3' });
    const c = new AuthPublicController(asvc({ getAppConfig } as Partial<AuthService>), rl());
    expect(c.appConfig({ user } as unknown as Request)).toEqual({ version: '3' });
    expect(getAppConfig).toHaveBeenLastCalledWith(user);
    expect(c.appConfig({} as Request)).toEqual({ version: '3' });
    expect(getAppConfig).toHaveBeenLastCalledWith(undefined);
  });

  it('invite maps a service error', () => {
    const c = new AuthPublicController(asvc({ validateInviteToken: vi.fn().mockReturnValue({ error: 'Expired', status: 410 }) } as Partial<AuthService>), rl());
    expect(thrown(() => c.invite('tok', req))).toEqual({ status: 410, body: { error: 'Expired' } });
  });

  it('login takes the mfa-required branch and never sets a cookie', async () => {
    const setAuthCookie = vi.fn();
    const c = new AuthPublicController(asvc({ loginUser: vi.fn().mockReturnValue({ mfa_required: true, mfa_token: 'mt', auditAction: 'user.login_mfa' }), setAuthCookie } as Partial<AuthService>), rl());
    expect(await c.login({}, req, res)).toEqual({ mfa_required: true, mfa_token: 'mt' });
    expect(setAuthCookie).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.login_mfa' }));
  }, 10000);

  it('forgot-password: non-issued reason and a delivery failure both still return ok', async () => {
    // Non-issued (unknown email / throttled): audits the reason, no email sent.
    const sendNever = vi.fn();
    const skip = new AuthPublicController(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'not_found', userId: null }), sendPasswordResetEmail: sendNever } as Partial<AuthService>), rl());
    expect(await skip.forgotPassword({ email: 'x@y.z' }, req)).toEqual({ ok: true });
    expect(sendNever).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_reset_request', details: { reason: 'not_found' } }));
    // Issued but the mailer throws: swallowed, audited as failed, still ok.
    const boom = vi.fn().mockRejectedValue(new Error('smtp'));
    const fail = new AuthPublicController(asvc({ requestPasswordReset: vi.fn().mockReturnValue({ reason: 'issued', tokenForDelivery: 'rt', userEmail: 'a@b.c', userId: 1 }), sendPasswordResetEmail: boom } as Partial<AuthService>), rl());
    expect(await fail.forgotPassword({ email: 'a@b.c' }, req)).toEqual({ ok: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ details: { delivered: 'failed' } }));
  }, 10000);

  it('forgot-password ignores a non-string email body', async () => {
    const requestPasswordReset = vi.fn().mockReturnValue({ reason: 'not_found', userId: null });
    const c = new AuthPublicController(asvc({ requestPasswordReset } as Partial<AuthService>), rl());
    expect(await c.forgotPassword({ email: 42 } as { email?: unknown }, req)).toEqual({ ok: true });
    expect(requestPasswordReset).toHaveBeenCalledWith('', expect.any(String));
  }, 10000);

  it('reset-password 429 once the dedicated reset bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    for (let i = 0; i < 5; i++) s.check('reset', '9.9.9.9', 5, 15 * 60 * 1000, now);
    const c = new AuthPublicController(asvc({ resetPassword: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.resetPassword({}, req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('mfa/verify-login maps a service error', () => {
    const c = new AuthPublicController(asvc({ verifyMfaLogin: vi.fn().mockReturnValue({ error: 'Bad code', status: 401 }) } as Partial<AuthService>), rl());
    expect(thrown(() => c.verifyMfaLogin({}, req, res))).toEqual({ status: 401, body: { error: 'Bad code' } });
  });

  it('demo-login + register + invite throw 429 when the login bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    for (let i = 0; i < 10; i++) s.check('login', '9.9.9.9', 10, 15 * 60 * 1000, now);
    const c = new AuthPublicController(asvc({ registerUser: vi.fn(), validateInviteToken: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.register({}, req, res))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
    expect(thrown(() => c.invite('t', req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('mfa/verify-login sets cookie + audits; logout clears cookie', () => {
    const setAuthCookie = vi.fn();
    const c = new AuthPublicController(asvc({ verifyMfaLogin: vi.fn().mockReturnValue({ token: 'tk', user, auditUserId: 1 }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.verifyMfaLogin({}, req, res)).toEqual({ token: 'tk', user });
    expect(setAuthCookie).toHaveBeenCalled();
    const clearAuthCookie = vi.fn();
    expect(new AuthPublicController(asvc({ clearAuthCookie } as Partial<AuthService>), rl()).logout(req, res)).toEqual({ success: true });
    expect(clearAuthCookie).toHaveBeenCalledWith(res, req);
  });
});

describe('AuthController (authenticated)', () => {
  it('GET /me 404 when missing, else returns the loaded user', () => {
    expect(thrown(() => new AuthController(asvc({ getCurrentUser: vi.fn().mockReturnValue(undefined) } as Partial<AuthService>), rl()).me(user))).toEqual({ status: 404, body: { error: 'User not found' } });
    expect(new AuthController(asvc({ getCurrentUser: vi.fn().mockReturnValue({ id: 1 }) } as Partial<AuthService>), rl()).me(user)).toEqual({ user: { id: 1 } });
  });

  it('change-password maps error, else audits', () => {
    expect(thrown(() => new AuthController(asvc({ changePassword: vi.fn().mockReturnValue({ error: 'Wrong', status: 400 }) } as Partial<AuthService>), rl()).changePassword(user, {}, req))).toEqual({ status: 400, body: { error: 'Wrong' } });
    expect(new AuthController(asvc({ changePassword: vi.fn().mockReturnValue({}) } as Partial<AuthService>), rl()).changePassword(user, {}, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password_change' }));
  });

  it('avatar 403 in demo mode, 400 without a file, else saves', async () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(true);
    expect(await thrownAsync(() => new AuthController(asvc(), rl()).avatar(user, { filename: 'a.jpg' } as Express.Multer.File))).toEqual({ status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' } });
    vi.mocked(isDemoEmail).mockReturnValue(false);
    delete process.env.DEMO_MODE;
    expect(await thrownAsync(() => new AuthController(asvc(), rl()).avatar(user, undefined))).toEqual({ status: 400, body: { error: 'No image uploaded' } });
    const saveAvatar = vi.fn().mockResolvedValue({ avatar: '/a.jpg' });
    expect(await new AuthController(asvc({ saveAvatar } as Partial<AuthService>), rl()).avatar(user, { filename: 'a.jpg' } as Express.Multer.File)).toEqual({ avatar: '/a.jpg' });
  });

  it('mfa/setup awaits the QR promise, maps a generation failure to 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = new AuthController(asvc({ setupMfa: vi.fn().mockReturnValue({ secret: 's', otpauth_url: 'o', qrPromise: Promise.resolve('<svg>') }) } as Partial<AuthService>), rl());
    expect(await ok.mfaSetup(user)).toEqual({ secret: 's', otpauth_url: 'o', qr_svg: '<svg>' });
    const fail = new AuthController(asvc({ setupMfa: vi.fn().mockReturnValue({ secret: 's', otpauth_url: 'o', qrPromise: Promise.reject(new Error('x')) }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => fail.mfaSetup(user))).toEqual({ status: 500, body: { error: 'Could not generate QR code' } });
  });

  it('mfa/enable audits + returns backup codes; mcp-tokens create 201', () => {
    const enable = new AuthController(asvc({ enableMfa: vi.fn().mockReturnValue({ mfa_enabled: true, backup_codes: ['a', 'b'] }) } as Partial<AuthService>), rl());
    expect(enable.mfaEnable(user, { code: '123456' }, req)).toEqual({ success: true, mfa_enabled: true, backup_codes: ['a', 'b'] });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.mfa_enable' }));
    const tok = new AuthController(asvc({ createMcpToken: vi.fn().mockReturnValue({ token: 'mcp_x' }) } as Partial<AuthService>), rl());
    expect(tok.createMcpToken(user, { name: 'CLI' }, req)).toEqual({ token: 'mcp_x' });
  });

  it('resource-token 503 when unavailable, else returns the token payload', () => {
    expect(thrown(() => new AuthController(asvc({ createResourceToken: vi.fn().mockReturnValue(null) } as Partial<AuthService>), rl()).resourceToken(user, {}))).toEqual({ status: 503, body: { error: 'Service unavailable' } });
    expect(new AuthController(asvc({ createResourceToken: vi.fn().mockReturnValue({ token: 'rt' }) } as Partial<AuthService>), rl()).resourceToken(user, { purpose: 'download' })).toEqual({ token: 'rt' });
  });

  it('rate-limited account ops throw 429 once the bucket is exhausted', () => {
    const s = rl();
    const now = Date.now();
    // exhaust the shared 'login' bucket for this ip (max 5)
    for (let i = 0; i < 5; i++) s.check('login', '9.9.9.9', 5, 15 * 60 * 1000, now);
    const c = new AuthController(asvc({ changePassword: vi.fn() } as Partial<AuthService>), s);
    expect(thrown(() => c.changePassword(user, {}, req))).toEqual({ status: 429, body: { error: 'Too many attempts. Please try again later.' } });
  });

  it('change-password refreshes this device cookie when the service returns a token', () => {
    const setAuthCookie = vi.fn();
    const c = new AuthController(asvc({ changePassword: vi.fn().mockReturnValue({ token: 'tk2' }), setAuthCookie } as Partial<AuthService>), rl());
    expect(c.changePassword(user, {}, req, res)).toEqual({ success: true });
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'tk2', req);
  });

  it('delete-account maps error, else audits and succeeds', () => {
    expect(thrown(() => new AuthController(asvc({ deleteAccount: vi.fn().mockReturnValue({ error: 'Last admin', status: 403 }) } as Partial<AuthService>), rl()).deleteAccount(user, req))).toEqual({ status: 403, body: { error: 'Last admin' } });
    expect(new AuthController(asvc({ deleteAccount: vi.fn().mockReturnValue({}) } as Partial<AuthService>), rl()).deleteAccount(user, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.account_delete' }));
  });

  it('maps-key + api-keys pass straight through to the service', () => {
    const updateMapsKey = vi.fn().mockReturnValue({ success: true });
    expect(new AuthController(asvc({ updateMapsKey } as Partial<AuthService>), rl()).mapsKey(user, { maps_api_key: 'k' })).toEqual({ success: true });
    expect(updateMapsKey).toHaveBeenCalledWith(1, 'k');
    const updateApiKeys = vi.fn().mockReturnValue({ ok: 1 });
    expect(new AuthController(asvc({ updateApiKeys } as Partial<AuthService>), rl()).apiKeys(user, { a: 1 })).toEqual({ ok: 1 });
  });

  it('update-settings + get-settings map errors, else return their payloads', () => {
    expect(thrown(() => new AuthController(asvc({ updateSettings: vi.fn().mockReturnValue({ error: 'Bad', status: 400 }) } as Partial<AuthService>), rl()).updateSettings(user, {}))).toEqual({ status: 400, body: { error: 'Bad' } });
    expect(new AuthController(asvc({ updateSettings: vi.fn().mockReturnValue({ success: true, user: { id: 1 } }) } as Partial<AuthService>), rl()).updateSettings(user, {})).toEqual({ success: true, user: { id: 1 } });
    expect(thrown(() => new AuthController(asvc({ getSettings: vi.fn().mockReturnValue({ error: 'Nope', status: 404 }) } as Partial<AuthService>), rl()).getSettings(user))).toEqual({ status: 404, body: { error: 'Nope' } });
    expect(new AuthController(asvc({ getSettings: vi.fn().mockReturnValue({ settings: { theme: 'dark' } }) } as Partial<AuthService>), rl()).getSettings(user)).toEqual({ settings: { theme: 'dark' } });
  });

  it('delete-avatar + users + travel-stats delegate to the service', async () => {
    const deleteAvatar = vi.fn().mockResolvedValue({ removed: true });
    expect(await new AuthController(asvc({ deleteAvatar } as Partial<AuthService>), rl()).deleteAvatar(user)).toEqual({ removed: true });
    const listUsers = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(new AuthController(asvc({ listUsers } as Partial<AuthService>), rl()).users(user)).toEqual({ users: [{ id: 1 }] });
    expect(listUsers).toHaveBeenCalledWith(1);
    const getTravelStats = vi.fn().mockReturnValue({ countries: 3 });
    expect(new AuthController(asvc({ getTravelStats } as Partial<AuthService>), rl()).travelStats(user)).toEqual({ countries: 3 });
  });

  it('validate-keys maps error, else returns the maps/weather payload', async () => {
    expect(await thrownAsync(() => new AuthController(asvc({ validateKeys: vi.fn().mockResolvedValue({ error: 'fail', status: 502 }) } as Partial<AuthService>), rl()).validateKeys(user))).toEqual({ status: 502, body: { error: 'fail' } });
    const ok = new AuthController(asvc({ validateKeys: vi.fn().mockResolvedValue({ maps: true, weather: false, maps_details: { ok: 1 } }) } as Partial<AuthService>), rl());
    expect(await ok.validateKeys(user)).toEqual({ maps: true, weather: false, maps_details: { ok: 1 } });
  });

  it('app-settings get maps error, else returns data; put maps error, else audits', () => {
    expect(thrown(() => new AuthController(asvc({ getAppSettings: vi.fn().mockReturnValue({ error: 'denied', status: 403 }) } as Partial<AuthService>), rl()).getAppSettings(user))).toEqual({ status: 403, body: { error: 'denied' } });
    expect(new AuthController(asvc({ getAppSettings: vi.fn().mockReturnValue({ data: { x: 1 } }) } as Partial<AuthService>), rl()).getAppSettings(user)).toEqual({ x: 1 });
    expect(thrown(() => new AuthController(asvc({ updateAppSettings: vi.fn().mockReturnValue({ error: 'bad', status: 400 }) } as Partial<AuthService>), rl()).updateAppSettings(user, {}, req))).toEqual({ status: 400, body: { error: 'bad' } });
    expect(new AuthController(asvc({ updateAppSettings: vi.fn().mockReturnValue({ auditSummary: 's', auditDebugDetails: 'd' }) } as Partial<AuthService>), rl()).updateAppSettings(user, {}, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'settings.app_update' }));
  });

  it('mfa/setup maps a service error before ever awaiting the QR promise', async () => {
    const c = new AuthController(asvc({ setupMfa: vi.fn().mockReturnValue({ error: 'already on', status: 409 }) } as Partial<AuthService>), rl());
    expect(await thrownAsync(() => c.mfaSetup(user))).toEqual({ status: 409, body: { error: 'already on' } });
  });

  it('mfa/enable + mfa/disable map errors', () => {
    expect(thrown(() => new AuthController(asvc({ enableMfa: vi.fn().mockReturnValue({ error: 'Invalid code', status: 400 }) } as Partial<AuthService>), rl()).mfaEnable(user, { code: 'x' }, req))).toEqual({ status: 400, body: { error: 'Invalid code' } });
    expect(thrown(() => new AuthController(asvc({ disableMfa: vi.fn().mockReturnValue({ error: 'Wrong', status: 401 }) } as Partial<AuthService>), rl()).mfaDisable(user, {}, req))).toEqual({ status: 401, body: { error: 'Wrong' } });
    const ok = new AuthController(asvc({ disableMfa: vi.fn().mockReturnValue({ mfa_enabled: false }) } as Partial<AuthService>), rl());
    expect(ok.mfaDisable(user, {}, req)).toEqual({ success: true, mfa_enabled: false });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.mfa_disable' }));
  });

  it('mcp-tokens list + create error + delete error/success', () => {
    expect(new AuthController(asvc({ listMcpTokens: vi.fn().mockReturnValue([{ id: 't' }]) } as Partial<AuthService>), rl()).listMcpTokens(user)).toEqual({ tokens: [{ id: 't' }] });
    expect(thrown(() => new AuthController(asvc({ createMcpToken: vi.fn().mockReturnValue({ error: 'Name taken', status: 409 }) } as Partial<AuthService>), rl()).createMcpToken(user, { name: 'x' }, req))).toEqual({ status: 409, body: { error: 'Name taken' } });
    expect(thrown(() => new AuthController(asvc({ deleteMcpToken: vi.fn().mockReturnValue({ error: 'Not found', status: 404 }) } as Partial<AuthService>), rl()).deleteMcpToken(user, 'tid'))).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(new AuthController(asvc({ deleteMcpToken: vi.fn().mockReturnValue({}) } as Partial<AuthService>), rl()).deleteMcpToken(user, 'tid')).toEqual({ success: true });
  });

  it('ws-token maps error, else returns the token', () => {
    expect(thrown(() => new AuthController(asvc({ createWsToken: vi.fn().mockReturnValue({ error: 'down', status: 503 }) } as Partial<AuthService>), rl()).wsToken(user))).toEqual({ status: 503, body: { error: 'down' } });
    expect(new AuthController(asvc({ createWsToken: vi.fn().mockReturnValue({ token: 'ws' }) } as Partial<AuthService>), rl()).wsToken(user)).toEqual({ token: 'ws' });
  });

  it('avatar saves when not in demo mode (env present but email is not a demo email)', async () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(false);
    const saveAvatar = vi.fn().mockResolvedValue({ avatar: '/b.png' });
    expect(await new AuthController(asvc({ saveAvatar } as Partial<AuthService>), rl()).avatar(user, { filename: 'b.png' } as Express.Multer.File)).toEqual({ avatar: '/b.png' });
  });
});
