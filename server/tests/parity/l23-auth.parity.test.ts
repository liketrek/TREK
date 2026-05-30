/**
 * A1 parity — auth (public flows + authenticated account/MFA/token endpoints).
 *
 * Same request at the legacy Express /api/auth route and the migrated Nest
 * controllers, with authService, the cookie service, notifications, auditLog and
 * auth middleware mocked identically. Cookies are a header side-effect (not
 * compared) and the rate-limit 429 + multipart avatar are covered in the unit
 * tests; this pins routing, status codes (register/mcp-token 201 vs the rest
 * 200), the login/reset MFA branches and the {error,status} envelopes.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) }, closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedUser; next(); },
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedUser; next(); },
  demoUploadBlock: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

vi.mock('../../src/services/cookie', () => ({ setAuthCookie: vi.fn(), clearAuthCookie: vi.fn() }));
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../src/services/notifications', () => ({ getAppUrl: () => 'https://x', sendPasswordResetEmail: vi.fn().mockResolvedValue({ delivered: true }) }));

const { authSvc } = vi.hoisted(() => ({
  authSvc: {
    getAppConfig: vi.fn(), demoLogin: vi.fn(), validateInviteToken: vi.fn(), registerUser: vi.fn(), loginUser: vi.fn(),
    requestPasswordReset: vi.fn(), resetPassword: vi.fn(), verifyMfaLogin: vi.fn(), getCurrentUser: vi.fn(),
    changePassword: vi.fn(), deleteAccount: vi.fn(), updateMapsKey: vi.fn(), updateApiKeys: vi.fn(), updateSettings: vi.fn(),
    getSettings: vi.fn(), saveAvatar: vi.fn(), deleteAvatar: vi.fn(), listUsers: vi.fn(), validateKeys: vi.fn(),
    getAppSettings: vi.fn(), updateAppSettings: vi.fn(), getTravelStats: vi.fn(), setupMfa: vi.fn(), enableMfa: vi.fn(),
    disableMfa: vi.fn(), listMcpTokens: vi.fn(), createMcpToken: vi.fn(), deleteMcpToken: vi.fn(), createWsToken: vi.fn(),
    createResourceToken: vi.fn(), requestPasswordReset_unused: vi.fn(),
  },
}));
vi.mock('../../src/services/authService', () => authSvc);

import authRoutes from '../../src/routes/auth';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('A1 parity (Express vs Nest)', () => {
  let ex: express.Express;
  let ne: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    return app;
  }
  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ex = buildExpress();
    nestApp = await buildNest();
    ne = nestApp.getHttpServer();
    authSvc.getAppConfig.mockReturnValue({ version: '3', features: {} });
    authSvc.demoLogin.mockReturnValue({ token: 'tk', user: fixedUser });
    authSvc.validateInviteToken.mockReturnValue({ valid: true, max_uses: 1, used_count: 0, expires_at: null });
    authSvc.registerUser.mockReturnValue({ token: 'tk', user: fixedUser, auditUserId: 1, auditDetails: {} });
    authSvc.loginUser.mockReturnValue({ token: 'tk', user: fixedUser });
    authSvc.requestPasswordReset.mockReturnValue({ reason: 'no_user', userId: null });
    authSvc.resetPassword.mockReturnValue({ userId: 1 });
    authSvc.verifyMfaLogin.mockReturnValue({ token: 'tk', user: fixedUser, auditUserId: 1 });
    authSvc.getCurrentUser.mockReturnValue({ id: 1, email: 'u@example.test' });
    authSvc.changePassword.mockReturnValue({});
    authSvc.deleteAccount.mockReturnValue({});
    authSvc.updateMapsKey.mockReturnValue({ success: true });
    authSvc.updateApiKeys.mockReturnValue({ success: true });
    authSvc.updateSettings.mockReturnValue({ success: true, user: fixedUser });
    authSvc.getSettings.mockReturnValue({ settings: { theme: 'dark' } });
    authSvc.deleteAvatar.mockResolvedValue({ success: true });
    authSvc.listUsers.mockReturnValue([{ id: 1 }]);
    authSvc.validateKeys.mockResolvedValue({ maps: true, weather: true, maps_details: {} });
    authSvc.getAppSettings.mockReturnValue({ data: { foo: 'bar' } });
    authSvc.updateAppSettings.mockReturnValue({ auditSummary: {}, auditDebugDetails: {} });
    authSvc.getTravelStats.mockReturnValue({ trips: 5 });
    authSvc.enableMfa.mockReturnValue({ mfa_enabled: true, backup_codes: ['a'] });
    authSvc.disableMfa.mockReturnValue({ mfa_enabled: false });
    authSvc.listMcpTokens.mockReturnValue([{ id: 't1' }]);
    authSvc.createMcpToken.mockReturnValue({ token: 'mcp_x' });
    authSvc.deleteMcpToken.mockReturnValue({});
    authSvc.createWsToken.mockReturnValue({ token: 'ws_x' });
    authSvc.createResourceToken.mockReturnValue({ token: 'rt_x' });
  });

  afterAll(async () => { await nestApp.close(); });

  it('GET /app-config', () => expectParity(ex, ne, { path: '/api/auth/app-config' }));
  it('POST /demo-login', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/demo-login' }));
  it('GET /invite/:token', () => expectParity(ex, ne, { path: '/api/auth/invite/tok' }));
  it('POST /register (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/register', body: { email: 'a@b.c', password: 'p' } }));
  it('POST /login', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/login', body: { email: 'a@b.c', password: 'p' } }));
  it('POST /login mfa branch', () => {
    authSvc.loginUser.mockReturnValueOnce({ mfa_required: true, mfa_token: 'mt' }).mockReturnValueOnce({ mfa_required: true, mfa_token: 'mt' });
    return expectParity(ex, ne, { method: 'post', path: '/api/auth/login', body: {} });
  });
  it('POST /login 401', () => {
    authSvc.loginUser.mockReturnValueOnce({ error: 'Bad creds', status: 401 }).mockReturnValueOnce({ error: 'Bad creds', status: 401 });
    return expectParity(ex, ne, { method: 'post', path: '/api/auth/login', body: {} });
  });
  it('POST /forgot-password', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/forgot-password', body: { email: 'a@b.c' } }));
  it('POST /reset-password', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/reset-password', body: { token: 't', password: 'p' } }));
  it('POST /reset-password mfa branch', () => {
    authSvc.resetPassword.mockReturnValueOnce({ mfa_required: true }).mockReturnValueOnce({ mfa_required: true });
    return expectParity(ex, ne, { method: 'post', path: '/api/auth/reset-password', body: {} });
  });
  it('POST /logout', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/logout' }));
  it('POST /mfa/verify-login', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/mfa/verify-login', body: { mfa_token: 't', code: '1' } }));

  it('GET /me', () => expectParity(ex, ne, { path: '/api/auth/me' }));
  it('GET /me 404', () => {
    authSvc.getCurrentUser.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    return expectParity(ex, ne, { path: '/api/auth/me' });
  });
  it('PUT /me/password', () => expectParity(ex, ne, { method: 'put', path: '/api/auth/me/password', body: { current_password: 'a', new_password: 'b' } }));
  it('DELETE /me', () => expectParity(ex, ne, { method: 'delete', path: '/api/auth/me' }));
  it('PUT /me/maps-key', () => expectParity(ex, ne, { method: 'put', path: '/api/auth/me/maps-key', body: { maps_api_key: 'k' } }));
  it('PUT /me/api-keys', () => expectParity(ex, ne, { method: 'put', path: '/api/auth/me/api-keys', body: {} }));
  it('PUT /me/settings', () => expectParity(ex, ne, { method: 'put', path: '/api/auth/me/settings', body: {} }));
  it('GET /me/settings', () => expectParity(ex, ne, { path: '/api/auth/me/settings' }));
  it('DELETE /avatar', () => expectParity(ex, ne, { method: 'delete', path: '/api/auth/avatar' }));
  it('GET /users', () => expectParity(ex, ne, { path: '/api/auth/users' }));
  it('GET /validate-keys', () => expectParity(ex, ne, { path: '/api/auth/validate-keys' }));
  it('GET /app-settings', () => expectParity(ex, ne, { path: '/api/auth/app-settings' }));
  it('PUT /app-settings', () => expectParity(ex, ne, { method: 'put', path: '/api/auth/app-settings', body: {} }));
  it('GET /travel-stats', () => expectParity(ex, ne, { path: '/api/auth/travel-stats' }));
  it('POST /mfa/enable', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/mfa/enable', body: { code: '1' } }));
  it('POST /mfa/disable', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/mfa/disable', body: {} }));
  it('GET /mcp-tokens', () => expectParity(ex, ne, { path: '/api/auth/mcp-tokens' }));
  it('POST /mcp-tokens (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/mcp-tokens', body: { name: 'CLI' } }));
  it('DELETE /mcp-tokens/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/auth/mcp-tokens/t1' }));
  it('POST /ws-token', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/ws-token' }));
  it('POST /resource-token', () => expectParity(ex, ne, { method: 'post', path: '/api/auth/resource-token', body: { purpose: 'download' } }));
  it('POST /resource-token 503', () => {
    authSvc.createResourceToken.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(ex, ne, { method: 'post', path: '/api/auth/resource-token', body: {} });
  });
});
