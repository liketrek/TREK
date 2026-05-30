/**
 * L6 parity — notifications.
 *
 * Fires the same request at the legacy Express /api/notifications route and the
 * migrated Nest controller with the three notification services mocked
 * identically for both, asserting client-identical status + body. Includes the
 * route-ordering trap (DELETE /in-app/all must NOT be captured by /in-app/:id).
 * Auth/admin are neutralised the same way (a fixed admin user); the 401/403
 * paths are covered by the e2e test against the real guard.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { adminUser } = vi.hoisted(() => ({
  adminUser: { id: 1, username: 'admin', email: 'admin@example.test', role: 'admin' },
}));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  closeDb: () => {},
  reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = adminUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => adminUser,
}));

const { prefs, inapp, channels } = vi.hoisted(() => ({
  prefs: { getPreferencesMatrix: vi.fn(), setPreferences: vi.fn() },
  inapp: {
    getNotifications: vi.fn(), getUnreadCount: vi.fn(), markRead: vi.fn(), markUnread: vi.fn(),
    markAllRead: vi.fn(), deleteNotification: vi.fn(), deleteAll: vi.fn(), respondToBoolean: vi.fn(),
  },
  channels: {
    testSmtp: vi.fn(), testWebhook: vi.fn(), testNtfy: vi.fn(),
    getUserWebhookUrl: vi.fn(), getAdminWebhookUrl: vi.fn(),
    getUserNtfyConfig: vi.fn(), getAdminNtfyConfig: vi.fn(),
  },
}));
vi.mock('../../src/services/notificationPreferencesService', () => prefs);
vi.mock('../../src/services/inAppNotifications', () => inapp);
vi.mock('../../src/services/notifications', () => channels);

import notificationsRoutes from '../../src/routes/notifications';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('L6 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [NotificationsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    prefs.getPreferencesMatrix.mockReturnValue({ preferences: {}, available_channels: {}, event_types: [], implemented_combos: {} });
    inapp.getNotifications.mockReturnValue({ notifications: [{ id: 1 }], total: 1, unread_count: 1 });
    inapp.getUnreadCount.mockReturnValue(2);
    inapp.markAllRead.mockReturnValue(3);
    inapp.deleteAll.mockReturnValue(4);
    inapp.markRead.mockImplementation((id: number) => id === 5);
    inapp.deleteNotification.mockImplementation((id: number) => id === 5);
    inapp.respondToBoolean.mockResolvedValue({ success: true, notification: { id: 5, response: 'positive' } });
    channels.testSmtp.mockResolvedValue({ success: true });
    channels.testWebhook.mockResolvedValue({ success: true });
    channels.getAdminNtfyConfig.mockReturnValue({ server: null, token: null });
    channels.getUserNtfyConfig.mockReturnValue(null);
    channels.testNtfy.mockResolvedValue({ success: true });
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /preferences', () => expectParity(expressServer, nestServer, { path: '/api/notifications/preferences' }));

  it('PUT /preferences', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/notifications/preferences', body: { trip_invite: { inapp: true } } }));

  it('POST /test-smtp (admin, 200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/test-smtp', body: { email: 'x@y.z' } }));

  it('POST /test-webhook with a url (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/test-webhook', body: { url: 'https://hooks.example/x' } }));

  it('POST /test-webhook invalid url (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/test-webhook', body: { url: 'not a url' } }));

  it('POST /test-ntfy with a topic (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/test-ntfy', body: { topic: 'mytopic' } }));

  it('POST /test-ntfy no topic (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/test-ntfy', body: {} }));

  it('GET /in-app', () =>
    expectParity(expressServer, nestServer, { path: '/api/notifications/in-app', query: { limit: '10', offset: '0' } }));

  it('GET /in-app/unread-count', () =>
    expectParity(expressServer, nestServer, { path: '/api/notifications/in-app/unread-count' }));

  it('PUT /in-app/read-all', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/notifications/in-app/read-all' }));

  it('DELETE /in-app/all (must not be captured by /:id)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/notifications/in-app/all' }));

  it('PUT /in-app/:id/read success', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/notifications/in-app/5/read' }));

  it('PUT /in-app/:id/read 404', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/notifications/in-app/9/read' }));

  it('PUT /in-app/:id/read invalid id (400)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/notifications/in-app/abc/read' }));

  it('DELETE /in-app/:id success', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/notifications/in-app/5' }));

  it('POST /in-app/:id/respond success (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/in-app/5/respond', body: { response: 'positive' } }));

  it('POST /in-app/:id/respond invalid value (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/notifications/in-app/5/respond', body: { response: 'maybe' } }));
});
