/**
 * Notifications module e2e — exercises the migrated /api/notifications endpoints
 * through the real JwtAuthGuard against a temp SQLite db. The notification
 * services are mocked; this focuses on auth, the inline admin gate on
 * /test-smtp, routing (the /in-app/all ordering trap) and status/body shapes.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

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

import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Notifications e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [NotificationsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, role: 'admin', email: 'admin@example.test' });
    seedUser(db as never, { id: 2, role: 'user', email: 'user@example.test' });
    app = await build();
    server = app.getHttpServer();
    prefs.getPreferencesMatrix.mockReturnValue({ preferences: {}, available_channels: {}, event_types: [], implemented_combos: {} });
    inapp.getUnreadCount.mockReturnValue(2);
    inapp.deleteAll.mockReturnValue(4);
    channels.testSmtp.mockResolvedValue({ success: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/notifications/preferences');
    expect(res.status).toBe(401);
  });

  it('200 preferences for an authenticated user', async () => {
    const res = await request(server).get('/api/notifications/preferences').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ preferences: {} });
  });

  it('403 { error: Admin only } when a non-admin hits test-smtp', async () => {
    const res = await request(server).post('/api/notifications/test-smtp').set('Cookie', sessionCookie(2)).send({});
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin only' });
    expect(channels.testSmtp).not.toHaveBeenCalled();
  });

  it('200 test-smtp for an admin (stays 200, not 201)', async () => {
    const res = await request(server).post('/api/notifications/test-smtp').set('Cookie', sessionCookie(1)).send({ email: 'x@y.z' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('200 unread-count', async () => {
    const res = await request(server).get('/api/notifications/in-app/unread-count').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 2 });
  });

  it('DELETE /in-app/all hits deleteAll, not deleteNotification', async () => {
    const res = await request(server).delete('/api/notifications/in-app/all').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 4 });
    expect(inapp.deleteAll).toHaveBeenCalledWith(2);
    expect(inapp.deleteNotification).not.toHaveBeenCalled();
  });

  it('400 on a non-numeric in-app id', async () => {
    const res = await request(server).put('/api/notifications/in-app/abc/read').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid id' });
  });
});
