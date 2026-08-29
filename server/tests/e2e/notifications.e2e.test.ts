/**
 * Notifications module e2e — exercises the migrated /api/notifications endpoints
 * through the real JwtAuthGuard against a temp SQLite db. NotificationsService
 * runs its real (DI-native) in-app SQL — notifications DDL below; the channel
 * transports and the preference matrix (still plain services/* modules) are
 * mocked. Focuses on auth, the inline admin gate on /test-smtp, routing (the
 * /in-app/all ordering trap) and status/body shapes.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../src/nest/notifications/notification-preferences.service';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { NtfyService } from '../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../src/nest/notifications/transports/webhook.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  // NotificationsService runs its real SQL (DI-native since the notifications
  // fold) — full notifications column set for listInApp/markRead/deleteAll.
  tmp.exec(`CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('simple', 'boolean', 'navigate')),
    scope TEXT NOT NULL CHECK(scope IN ('trip', 'user', 'admin')),
    target INTEGER NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_key TEXT NOT NULL,
    title_params TEXT DEFAULT '{}',
    text_key TEXT NOT NULL,
    text_params TEXT DEFAULT '{}',
    positive_text_key TEXT,
    negative_text_key TEXT,
    positive_callback TEXT,
    negative_callback TEXT,
    response TEXT CHECK(response IN ('positive', 'negative')),
    navigate_text_key TEXT,
    navigate_target TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

// The preference matrix and the channel transports are providers since the
// fold — overridden at the container instead of mocked by module path; the
// in-app store is real SQL.
const { prefs, mailer, webhook, ntfy } = vi.hoisted(() => ({
  prefs: { getPreferencesMatrix: vi.fn(), setPreferences: vi.fn() },
  mailer: {
    testSmtp: vi.fn(),
    isSmtpConfigured: vi.fn(() => true),
    getUserEmail: vi.fn(),
    getUserLanguage: vi.fn(() => 'en'),
  },
  webhook: { testWebhook: vi.fn(), getUserWebhookUrl: vi.fn(), getAdminWebhookUrl: vi.fn() },
  ntfy: { testNtfy: vi.fn(), getUserNtfyConfig: vi.fn(), getAdminNtfyConfig: vi.fn() },
}));

function seedNotification(recipientId: number, overrides: { is_read?: number } = {}): number {
  const r = db
    .prepare(
      `INSERT INTO notifications (type, scope, target, recipient_id, title_key, text_key, is_read)
     VALUES ('simple', 'user', ?, ?, 'notif.test.title', 'notif.test.text', ?)`,
    )
    .run(recipientId, recipientId, overrides.is_read ?? 0);
  return r.lastInsertRowid as number;
}

describe('Notifications e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, NotificationsModule],
    })
      .overrideProvider(NotificationPreferencesService)
      .useValue(prefs)
      .overrideProvider(MailerService)
      .useValue(mailer)
      .overrideProvider(WebhookService)
      .useValue(webhook)
      .overrideProvider(NtfyService)
      .useValue(ntfy)
      .compile();
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
    prefs.getPreferencesMatrix.mockReturnValue({
      preferences: {},
      available_channels: {},
      event_types: [],
      implemented_combos: {},
    });
    mailer.testSmtp.mockResolvedValue({ success: true });
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
    expect(mailer.testSmtp).not.toHaveBeenCalled();
  });

  it('200 test-smtp for an admin (stays 200, not 201)', async () => {
    const res = await request(server)
      .post('/api/notifications/test-smtp')
      .set('Cookie', sessionCookie(1))
      .send({ email: 'x@y.z' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('200 unread-count from the real notifications table', async () => {
    db.prepare('DELETE FROM notifications').run();
    seedNotification(2);
    seedNotification(2);
    seedNotification(2, { is_read: 1 });
    const res = await request(server).get('/api/notifications/in-app/unread-count').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 2 });
  });

  it('DELETE /in-app/all hits deleteAll, not the /:id handler', async () => {
    db.prepare('DELETE FROM notifications').run();
    for (let i = 0; i < 4; i++) seedNotification(2);
    const other = seedNotification(1);
    const res = await request(server).delete('/api/notifications/in-app/all').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 4 });
    // Only user 2's rows are gone — the static route deleted per-recipient, it
    // did not fall through to the /:id param handler (which would 400 on 'all').
    const rows = db.prepare('SELECT id FROM notifications').all() as { id: number }[];
    expect(rows.map((r) => r.id)).toEqual([other]);
  });

  it('400 on a non-numeric in-app id', async () => {
    const res = await request(server).put('/api/notifications/in-app/abc/read').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid id' });
  });
});
