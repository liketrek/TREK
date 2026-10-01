/**
 * Web Push routes e2e: /api/notifications/push/* and the push test send
 * through the real JwtAuthGuard, the Zod pipe and the real providers on a temp
 * SQLite db. Only the outbound POST (safeFetchFollow) is replaced.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { createECDH } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

// The harness db (users for the guard) plus the two tables push reads, built
// inside the factory; the test reaches it through the mocked module.
vi.mock('../../src/db/database', async () => {
  const { createTempDb } = await import('./harness');
  const db = createTempDb();
  db.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  // Same DDL as migration 245.
  db.exec(`CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    vapid_public_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_success_at TEXT,
    failure_count INTEGER NOT NULL DEFAULT 0
  );`);
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

const { safeFetchFollow } = vi.hoisted(() => ({ safeFetchFollow: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchFollow,
}));

import { db } from '../../src/db/database';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/e2e-device';

function subscription(endpoint = ENDPOINT) {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  return {
    endpoint,
    expirationTime: null,
    keys: { p256dh: ua.getPublicKey('base64url'), auth: Buffer.alloc(16, 3).toString('base64url') },
  };
}

function rows() {
  return db
    .prepare('SELECT user_id, endpoint, vapid_public_key, user_agent FROM push_subscriptions ORDER BY id')
    .all() as {
    user_id: number;
    endpoint: string;
    vapid_public_key: string;
    user_agent: string | null;
  }[];
}

describe('Web Push e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, NotificationsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db, { id: 1, email: 'one@example.test' });
    seedUser(db, { id: 2, email: 'two@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM push_subscriptions').run();
    safeFetchFollow.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 on every push route without a session cookie', async () => {
    expect((await request(server).get('/api/notifications/push/public-key')).status).toBe(401);
    expect(
      (await request(server).post('/api/notifications/push/subscriptions').send({ subscription: subscription() }))
        .status,
    ).toBe(401);
    expect(
      (await request(server).delete('/api/notifications/push/subscriptions').send({ endpoint: ENDPOINT })).status,
    ).toBe(401);
  });

  it('GET public-key: the pair exists from bootstrap on, so the route only reads it', async () => {
    const stored = db.prepare("SELECT value FROM app_settings WHERE key = 'web_push_vapid_public_key'").get() as {
      value: string;
    };
    const res = await request(server).get('/api/notifications/push/public-key').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ publicKey: stored.value });
    const raw = Buffer.from(res.body.publicKey, 'base64url');
    expect(raw.length).toBe(65);
    expect(raw[0]).toBe(0x04);
  });

  it('POST subscriptions: 200 with the device count, stored against the served key', async () => {
    const { body: key } = await request(server)
      .get('/api/notifications/push/public-key')
      .set('Cookie', sessionCookie(1));
    const res = await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .set('User-Agent', 'e2e-browser/1.0')
      .send({ subscription: subscription() });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, devices: 1 });
    expect(rows()).toEqual([
      { user_id: 1, endpoint: ENDPOINT, vapid_public_key: key.publicKey, user_agent: 'e2e-browser/1.0' },
    ]);
  });

  it('POST subscriptions: the same browser subscribing for another account moves to it', async () => {
    await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription() });
    const res = await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(2))
      .send({ subscription: subscription() });
    expect(res.body).toEqual({ success: true, devices: 1 });
    expect(rows().map((r) => r.user_id)).toEqual([2]);
  });

  it('POST subscriptions: 400 with the bespoke message for a host that is not a push service', async () => {
    const res = await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription('https://example.com/collect') });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Push endpoint is not a known push service' });
    expect(rows()).toEqual([]);
  });

  it('POST subscriptions: 400 from the contract when the keys are missing', async () => {
    const res = await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: { endpoint: ENDPOINT } });
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.stringContaining('keys'));
  });

  it('DELETE subscriptions: only the owner removes the endpoint, and a repeat is still 200', async () => {
    await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription() });

    const stranger = await request(server)
      .delete('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(2))
      .send({ endpoint: ENDPOINT });
    expect(stranger.status).toBe(200);
    expect(rows()).toHaveLength(1);

    const owner = await request(server)
      .delete('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ endpoint: ENDPOINT });
    expect(owner.status).toBe(200);
    expect(owner.body).toEqual({ success: true });
    expect(rows()).toEqual([]);

    const again = await request(server)
      .delete('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ endpoint: ENDPOINT });
    expect(again.status).toBe(200);
  });

  it('DELETE subscriptions: 400 without an endpoint', async () => {
    const res = await request(server)
      .delete('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST test/push: sends the test message to the caller’s devices through the SSRF-guarded fetch', async () => {
    const none = await request(server).post('/api/notifications/test/push').set('Cookie', sessionCookie(1));
    expect(none.status).toBe(200);
    expect(none.body).toEqual({ success: false, error: 'Channel is not configured for this user' });

    await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription() });
    safeFetchFollow.mockResolvedValue({ ok: true, status: 201, body: null, headers: { get: () => null } });
    const res = await request(server).post('/api/notifications/test/push').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(safeFetchFollow).toHaveBeenCalledWith(
      ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Encoding': 'aes128gcm' }),
      }),
      { maxRedirects: 0, bypassInternalIpAllowed: true },
    );
  });

  it('a stored private key that no longer decrypts turns push off with a 503 and is never replaced', async () => {
    const readKey = (key: string) =>
      (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string }).value;
    const unreadable = 'enc:v1:bm90IGEgY2lwaGVydGV4dA';
    const publicKey = readKey('web_push_vapid_public_key');
    const ciphertext = readKey('web_push_vapid_private_key');
    await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription() });
    db.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(unreadable, 'web_push_vapid_private_key');
    try {
      const key = await request(server).get('/api/notifications/push/public-key').set('Cookie', sessionCookie(1));
      expect(key.status).toBe(503);
      expect(key.body).toEqual({ error: 'Web Push is currently unavailable on this server' });
      const sub = await request(server)
        .post('/api/notifications/push/subscriptions')
        .set('Cookie', sessionCookie(1))
        .send({ subscription: subscription(`${ENDPOINT}-second`) });
      expect(sub.status).toBe(503);
      const test = await request(server).post('/api/notifications/test/push').set('Cookie', sessionCookie(1));
      expect(test.status).toBe(200);
      expect(test.body).toEqual({ success: false, error: 'Web Push is currently unavailable on this server' });
      expect(safeFetchFollow).not.toHaveBeenCalled();
      // The device registered before stays, and neither stored row was touched.
      expect(rows().map((r) => r.endpoint)).toEqual([ENDPOINT]);
      expect(readKey('web_push_vapid_public_key')).toBe(publicKey);
      expect(readKey('web_push_vapid_private_key')).toBe(unreadable);
    } finally {
      db.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(ciphertext, 'web_push_vapid_private_key');
    }
    const back = await request(server).get('/api/notifications/push/public-key').set('Cookie', sessionCookie(1));
    expect(back.body).toEqual({ publicKey });
  });
});
