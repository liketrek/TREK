/**
 * Web Push routes e2e: /api/notifications/push/* and the push test send
 * through the real JwtAuthGuard, the Zod pipe and the real providers on a temp
 * SQLite db. Only the outbound POST (safeFetchFollow) is replaced.
 */
import { db } from '../../src/db/database';
import { PushSubscriptions } from '../../src/db/entities/PushSubscriptions.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { deleteRows, findRows } from '../helpers/factories/rows';
import { readAppSetting, setAppSetting } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { createECDH } from 'node:crypto';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// The migrated snapshot (users for the guard, app_settings and the
// push_subscriptions table from legacy step 245), opened inside the factory;
// the test reaches it through the mocked module.
vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

const { safeFetchFollow } = vi.hoisted(() => ({ safeFetchFollow: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchFollow,
}));

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

let orm: TestOrm;

async function rows() {
  return (await findRows(orm, PushSubscriptions, {}, { id: 'asc' })).map((r) => ({
    user_id: r.user_id,
    endpoint: r.endpoint,
    vapid_public_key: r.vapid_public_key,
    user_agent: r.user_agent,
  }));
}

/** An app setting the push service keeps; fails the case when it is not there. */
async function storedSetting(key: string): Promise<string> {
  const value = await readAppSetting(orm, key);
  if (value === null) throw new Error(`no app setting ${key}`);
  return value;
}

describe('Web Push e2e (real auth guard + temp SQLite)', () => {
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
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // The two users the session cookies are signed for, pinned to ids 1 and 2.
    orm = await createTestOrm(db);
    await makeUser(orm, {
      id: 1,
      username: 'e2e-user-1',
      email: 'one@example.test',
      role: 'user',
      password_version: 0,
    });
    await makeUser(orm, {
      id: 2,
      username: 'e2e-user-2',
      email: 'two@example.test',
      role: 'user',
      password_version: 0,
    });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, PushSubscriptions);
    safeFetchFollow.mockReset();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
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
    const stored = await storedSetting('web_push_vapid_public_key');
    const res = await request(server).get('/api/notifications/push/public-key').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ publicKey: stored });
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
    expect(await rows()).toEqual([
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
    expect((await rows()).map((r) => r.user_id)).toEqual([2]);
  });

  it('POST subscriptions: 400 with the bespoke message for a host that is not a push service', async () => {
    const res = await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription('https://example.com/collect') });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Push endpoint is not a known push service' });
    expect(await rows()).toEqual([]);
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
    expect(await rows()).toHaveLength(1);

    const owner = await request(server)
      .delete('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ endpoint: ENDPOINT });
    expect(owner.status).toBe(200);
    expect(owner.body).toEqual({ success: true });
    expect(await rows()).toEqual([]);

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
    const readKey = storedSetting;
    const unreadable = 'enc:v1:bm90IGEgY2lwaGVydGV4dA';
    const publicKey = await readKey('web_push_vapid_public_key');
    const ciphertext = await readKey('web_push_vapid_private_key');
    await request(server)
      .post('/api/notifications/push/subscriptions')
      .set('Cookie', sessionCookie(1))
      .send({ subscription: subscription() });
    await setAppSetting(orm, 'web_push_vapid_private_key', unreadable);
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
      expect((await rows()).map((r) => r.endpoint)).toEqual([ENDPOINT]);
      expect(await readKey('web_push_vapid_public_key')).toBe(publicKey);
      expect(await readKey('web_push_vapid_private_key')).toBe(unreadable);
    } finally {
      await setAppSetting(orm, 'web_push_vapid_private_key', ciphertext);
    }
    const back = await request(server).get('/api/notifications/push/public-key').set('Cookie', sessionCookie(1));
    expect(back.body).toEqual({ publicKey });
  });
});
