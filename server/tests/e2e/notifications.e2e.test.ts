/**
 * Notifications module e2e — exercises the migrated /api/notifications endpoints
 * through the real JwtAuthGuard against a migrated temp SQLite db. NotificationsService
 * runs its real (DI-native) in-app SQL; the channel
 * transports and the preference matrix (still plain services/* modules) are
 * mocked. Focuses on auth, the inline admin gate on /test-smtp, routing (the
 * /in-app/all ordering trap) and status/body shapes.
 */
import { db } from '../../src/db/database';
import { Notifications } from '../../src/db/entities/Notifications.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../src/nest/notifications/notification-preferences.service';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { NtfyService } from '../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../src/nest/notifications/transports/webhook.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { makeNotification } from '../helpers/factories/notifications';
import { deleteRows, findRows } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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

let orm: TestOrm;

async function seedNotification(recipientId: number, overrides: { is_read?: number } = {}): Promise<number> {
  const row = await makeNotification(orm, recipientId, {
    title_key: 'notif.test.title',
    text_key: 'notif.test.text',
    is_read: overrides.is_read ?? 0,
  });
  return row.id;
}

describe('Notifications e2e (real auth guard + migrated temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        NotificationsModule,
      ],
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
    orm = await createTestOrm(db);
    // Pinned ids: sessionCookie(1) and (2) sign for exactly these users.
    await makeAdmin(orm, { id: 1, email: 'admin@example.test' });
    await makeUser(orm, { id: 2, email: 'user@example.test' });
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
    await orm.close();
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
    await deleteRows(orm, Notifications);
    await seedNotification(2);
    await seedNotification(2);
    await seedNotification(2, { is_read: 1 });
    const res = await request(server).get('/api/notifications/in-app/unread-count').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 2 });
  });

  it('DELETE /in-app/all hits deleteAll, not the /:id handler', async () => {
    await deleteRows(orm, Notifications);
    for (let i = 0; i < 4; i++) await seedNotification(2);
    const other = await seedNotification(1);
    const res = await request(server).delete('/api/notifications/in-app/all').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 4 });
    // Only user 2's rows are gone — the static route deleted per-recipient, it
    // did not fall through to the /:id param handler (which would 400 on 'all').
    const rows = await findRows(orm, Notifications);
    expect(rows.map((r) => r.id)).toEqual([other]);
  });

  it('400 on a non-numeric in-app id', async () => {
    const res = await request(server).put('/api/notifications/in-app/abc/read').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid id' });
  });
});
