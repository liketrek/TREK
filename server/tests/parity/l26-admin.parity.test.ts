/**
 * A4 parity — admin control surface.
 *
 * Same request at the legacy Express /api/admin route and the migrated Nest
 * controller, with adminService, the settings/MCP/notification-pref helpers,
 * auditLog and auth mocked identically (the fixed user is an admin so both the
 * legacy adminOnly and the Nest AdminGuard pass). Pins routing, the create-201
 * vs 200 split, the {error,status} envelopes and the validation 400s across a
 * representative slice of each sub-domain.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedAdmin } = vi.hoisted(() => ({ fixedAdmin: { id: 1, username: 'a', email: 'a@example.test', role: 'admin' } }));

vi.mock('../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) }, closeDb: () => {}, reinitialize: () => {} }));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedAdmin; next(); },
  adminOnly: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedAdmin,
}));

vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: () => '1.2.3.4', logInfo: vi.fn() }));
vi.mock('../../src/mcp', () => ({ invalidateMcpSessions: vi.fn() }));
vi.mock('../../src/services/notificationPreferencesService', () => ({ getPreferencesMatrix: vi.fn(() => ({ matrix: {} })), setAdminPreferences: vi.fn() }));
vi.mock('../../src/services/settingsService', () => ({ getAdminUserDefaults: vi.fn(() => ({ theme: 'dark' })), setAdminUserDefaults: vi.fn() }));

const { adminSvc } = vi.hoisted(() => ({
  adminSvc: {
    listUsers: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn(), getStats: vi.fn(),
    getPermissions: vi.fn(), savePermissions: vi.fn(), getAuditLog: vi.fn(), getOidcSettings: vi.fn(), updateOidcSettings: vi.fn(),
    saveDemoBaseline: vi.fn(), getGithubReleases: vi.fn(), checkVersion: vi.fn(), listInvites: vi.fn(), createInvite: vi.fn(),
    deleteInvite: vi.fn(), getBagTracking: vi.fn(), updateBagTracking: vi.fn(), getPlacesPhotos: vi.fn(), updatePlacesPhotos: vi.fn(),
    getPlacesAutocomplete: vi.fn(), updatePlacesAutocomplete: vi.fn(), getPlacesDetails: vi.fn(), updatePlacesDetails: vi.fn(),
    getCollabFeatures: vi.fn(), updateCollabFeatures: vi.fn(), listPackingTemplates: vi.fn(), getPackingTemplate: vi.fn(),
    createPackingTemplate: vi.fn(), updatePackingTemplate: vi.fn(), deletePackingTemplate: vi.fn(), createTemplateCategory: vi.fn(),
    updateTemplateCategory: vi.fn(), deleteTemplateCategory: vi.fn(), createTemplateItem: vi.fn(), updateTemplateItem: vi.fn(),
    deleteTemplateItem: vi.fn(), listAddons: vi.fn(), updateAddon: vi.fn(), listMcpTokens: vi.fn(), deleteMcpToken: vi.fn(),
    listOAuthSessions: vi.fn(), revokeOAuthSession: vi.fn(), rotateJwtSecret: vi.fn(),
  },
}));
vi.mock('../../src/services/adminService', () => adminSvc);

import adminRoutes from '../../src/routes/admin';
import { AdminModule } from '../../src/nest/admin/admin.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('A4 parity (Express vs Nest)', () => {
  let ex: express.Express;
  let ne: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    return app;
  }
  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [AdminModule] }).compile();
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
    adminSvc.listUsers.mockReturnValue([{ id: 1 }]);
    adminSvc.createUser.mockReturnValue({ user: { id: 2 }, insertedId: 2, auditDetails: {} });
    adminSvc.updateUser.mockReturnValue({ user: { id: 2 }, previousEmail: 'a@b.c', changed: ['role'] });
    adminSvc.deleteUser.mockReturnValue({ email: 'a@b.c' });
    adminSvc.getStats.mockReturnValue({ users: 3 });
    adminSvc.getPermissions.mockReturnValue({ permissions: {} });
    adminSvc.savePermissions.mockReturnValue({ permissions: { x: 1 }, skipped: [] });
    adminSvc.getAuditLog.mockReturnValue({ entries: [] });
    adminSvc.getOidcSettings.mockReturnValue({ issuer: '' });
    adminSvc.updateOidcSettings.mockReturnValue({});
    adminSvc.getGithubReleases.mockResolvedValue({ releases: [] });
    adminSvc.checkVersion.mockResolvedValue({ current: '3', latest: '3' });
    adminSvc.listInvites.mockReturnValue([]);
    adminSvc.createInvite.mockReturnValue({ invite: { id: 5 }, inviteId: 5, uses: 1, expiresInDays: 7 });
    adminSvc.deleteInvite.mockReturnValue({});
    adminSvc.getBagTracking.mockReturnValue({ enabled: false });
    adminSvc.updateBagTracking.mockReturnValue({ enabled: true });
    adminSvc.updatePlacesPhotos.mockReturnValue({ enabled: true });
    adminSvc.getPlacesPhotos.mockReturnValue({ enabled: false });
    adminSvc.getPlacesAutocomplete.mockReturnValue({ enabled: false });
    adminSvc.updatePlacesAutocomplete.mockReturnValue({ enabled: true });
    adminSvc.getPlacesDetails.mockReturnValue({ enabled: false });
    adminSvc.updatePlacesDetails.mockReturnValue({ enabled: true });
    adminSvc.updatePackingTemplate.mockReturnValue({ id: 3, name: 'B2' });
    adminSvc.createTemplateCategory.mockReturnValue({ id: 4 });
    adminSvc.updateTemplateCategory.mockReturnValue({ id: 4 });
    adminSvc.deleteTemplateCategory.mockReturnValue({});
    adminSvc.updateTemplateItem.mockReturnValue({ id: 7 });
    adminSvc.deleteTemplateItem.mockReturnValue({});
    adminSvc.getCollabFeatures.mockReturnValue({ chat: true });
    adminSvc.updateCollabFeatures.mockReturnValue({ chat: false });
    adminSvc.listPackingTemplates.mockReturnValue([]);
    adminSvc.getPackingTemplate.mockReturnValue({ id: 3 });
    adminSvc.createPackingTemplate.mockReturnValue({ id: 3, name: 'Beach' });
    adminSvc.deletePackingTemplate.mockReturnValue({ name: 'Beach' });
    adminSvc.createTemplateItem.mockReturnValue({ id: 7 });
    adminSvc.listAddons.mockReturnValue([{ id: 'mcp' }]);
    adminSvc.updateAddon.mockReturnValue({ addon: { id: 'mcp', enabled: true }, auditDetails: {} });
    adminSvc.listMcpTokens.mockReturnValue([]);
    adminSvc.deleteMcpToken.mockReturnValue({});
    adminSvc.listOAuthSessions.mockReturnValue([]);
    adminSvc.revokeOAuthSession.mockReturnValue({});
    adminSvc.rotateJwtSecret.mockReturnValue({});
  });

  beforeEach(() => { delete process.env.NODE_ENV; });

  afterAll(async () => { await nestApp.close(); });

  it('GET /users', () => expectParity(ex, ne, { path: '/api/admin/users' }));
  it('POST /users (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/users', body: { email: 'a@b.c' } }));
  it('POST /users error', () => {
    adminSvc.createUser.mockReturnValueOnce({ error: 'taken', status: 409 }).mockReturnValueOnce({ error: 'taken', status: 409 });
    return expectParity(ex, ne, { method: 'post', path: '/api/admin/users', body: {} });
  });
  it('PUT /users/:id', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/users/2', body: { role: 'admin' } }));
  it('DELETE /users/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/users/2' }));
  it('GET /stats', () => expectParity(ex, ne, { path: '/api/admin/stats' }));
  it('GET /permissions', () => expectParity(ex, ne, { path: '/api/admin/permissions' }));
  it('PUT /permissions 400', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/permissions', body: {} }));
  it('PUT /permissions', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/permissions', body: { permissions: { x: 1 } } }));
  it('GET /audit-log', () => expectParity(ex, ne, { path: '/api/admin/audit-log', query: { limit: '10' } }));
  it('GET /oidc', () => expectParity(ex, ne, { path: '/api/admin/oidc' }));
  it('PUT /oidc', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/oidc', body: { issuer: 'https://idp' } }));
  it('POST /save-demo-baseline error', () => {
    adminSvc.saveDemoBaseline.mockReturnValueOnce({ error: 'not demo', status: 400 }).mockReturnValueOnce({ error: 'not demo', status: 400 });
    return expectParity(ex, ne, { method: 'post', path: '/api/admin/save-demo-baseline' });
  });
  it('GET /github-releases', () => expectParity(ex, ne, { path: '/api/admin/github-releases' }));
  it('GET /version-check', () => expectParity(ex, ne, { path: '/api/admin/version-check' }));
  it('GET /notification-preferences', () => expectParity(ex, ne, { path: '/api/admin/notification-preferences' }));
  it('GET /invites', () => expectParity(ex, ne, { path: '/api/admin/invites' }));
  it('POST /invites (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/invites', body: { max_uses: 1 } }));
  it('DELETE /invites/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/invites/5' }));
  it('PUT /bag-tracking', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/bag-tracking', body: { enabled: true } }));
  it('PUT /places-photos 400', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/places-photos', body: { enabled: 'yes' } }));
  it('PUT /places-photos', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/places-photos', body: { enabled: true } }));
  it('PUT /collab-features', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/collab-features', body: { chat: false } }));
  it('GET /places-photos', () => expectParity(ex, ne, { path: '/api/admin/places-photos' }));
  it('GET /places-autocomplete', () => expectParity(ex, ne, { path: '/api/admin/places-autocomplete' }));
  it('PUT /places-autocomplete', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/places-autocomplete', body: { enabled: true } }));
  it('GET /places-details', () => expectParity(ex, ne, { path: '/api/admin/places-details' }));
  it('PUT /places-details', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/places-details', body: { enabled: true } }));
  it('PUT /packing-templates/:id', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/packing-templates/3', body: { name: 'B2' } }));
  it('POST /packing-templates/:id/categories (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/packing-templates/3/categories', body: { name: 'Cat' } }));
  it('PUT /packing-templates/:t/categories/:c', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/packing-templates/3/categories/4', body: { name: 'C2' } }));
  it('DELETE /packing-templates/:t/categories/:c', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/packing-templates/3/categories/4' }));
  it('PUT /packing-templates/:t/items/:i', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/packing-templates/3/items/7', body: { name: 'I2' } }));
  it('DELETE /packing-templates/:t/items/:i', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/packing-templates/3/items/7' }));
  it('DELETE /mcp-tokens/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/mcp-tokens/t1' }));
  it('PUT /notification-preferences', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/notification-preferences', body: {} }));
  it('GET /packing-templates', () => expectParity(ex, ne, { path: '/api/admin/packing-templates' }));
  it('GET /packing-templates/:id', () => expectParity(ex, ne, { path: '/api/admin/packing-templates/3' }));
  it('POST /packing-templates (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/packing-templates', body: { name: 'Beach' } }));
  it('DELETE /packing-templates/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/packing-templates/3' }));
  it('POST /packing-templates/:t/categories/:c/items (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/packing-templates/3/categories/4/items', body: { name: 'Towel' } }));
  it('GET /addons', () => expectParity(ex, ne, { path: '/api/admin/addons' }));
  it('PUT /addons/:id', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/addons/mcp', body: { enabled: true } }));
  it('GET /mcp-tokens', () => expectParity(ex, ne, { path: '/api/admin/mcp-tokens' }));
  it('GET /oauth-sessions', () => expectParity(ex, ne, { path: '/api/admin/oauth-sessions' }));
  it('DELETE /oauth-sessions/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/admin/oauth-sessions/3' }));
  it('POST /rotate-jwt-secret', () => expectParity(ex, ne, { method: 'post', path: '/api/admin/rotate-jwt-secret' }));
  it('GET /default-user-settings', () => expectParity(ex, ne, { path: '/api/admin/default-user-settings' }));
  it('PUT /default-user-settings 400', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/default-user-settings', body: [] }));
  it('PUT /default-user-settings', () => expectParity(ex, ne, { method: 'put', path: '/api/admin/default-user-settings', body: { theme: 'dark' } }));
});
