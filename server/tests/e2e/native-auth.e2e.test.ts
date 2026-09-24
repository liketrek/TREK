/**
 * Native sign-in hand-off e2e: the real CookieAuthGuard, the real cookie
 * service and the real AuthService against a temp SQLite db. Walks the whole
 * round trip the apps make: the browser side mints a code for a challenge, the
 * WebView side redeems it with the verifier and walks away with a session
 * cookie that /api/auth/me accepts.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie, signSession } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: () => undefined,
  isOwner: () => false,
}));
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));

import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser } from '../helpers/factories';
import { resetRateLimits } from '../helpers/test-db';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { NativeAuthModule } from '../../src/nest/native-auth/native-auth.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('hex');

describe('Native sign-in hand-off e2e', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let userId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, AuthModule, NativeAuthModule] })
      .overrideProvider(MailerService)
      .useValue({ sendPasswordResetEmail: vi.fn() })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  const handoff = (cookie: string, body: unknown = { challenge }) =>
    request(server).post('/api/auth/native/handoff').set('Cookie', cookie).send(body as object);

  beforeAll(async () => {
    createTables(db as never);
    runMigrations(db as never);
    userId = createUser(db as never, { username: 'native-e2e' }).user.id;
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => resetRateLimits(app));

  afterAll(async () => {
    await app.close();
  });

  it('carries a browser session into a fresh session cookie for the app', async () => {
    const minted = await handoff(sessionCookie(userId));
    expect(minted.status).toBe(200);
    expect(typeof minted.body.code).toBe('string');

    const redeemed = await request(server).post('/api/auth/native/exchange').send({ code: minted.body.code, verifier });
    expect(redeemed.status).toBe(200);
    expect(redeemed.body).toEqual({ ok: true });
    const cookie = (redeemed.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Max-Age=\d+/);

    const me = await request(server).get('/api/auth/me').set('Cookie', cookie!.split(';')[0]!);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(userId);

    const audited = db.prepare("SELECT details FROM audit_log WHERE action = 'user.login' AND user_id = ? ORDER BY id DESC LIMIT 1").get(userId) as { details: string };
    expect(JSON.parse(audited.details)).toEqual({ method: 'native_app' });
  });

  it('refuses to mint a code without a cookie session, even for a valid bearer token', async () => {
    const res = await request(server).post('/api/auth/native/handoff')
      .set('Authorization', `Bearer ${signSession(userId)}`)
      .send({ challenge });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('COOKIE_AUTH_REQUIRED');
  });

  it('validates the challenge shape', async () => {
    expect((await handoff(sessionCookie(userId), { challenge: 'not-a-hash' })).status).toBe(400);
  });

  it('refuses a code presented with the wrong verifier, and the code is gone after', async () => {
    const { code } = (await handoff(sessionCookie(userId))).body;
    const wrong = await request(server).post('/api/auth/native/exchange').send({ code, verifier: 'x'.repeat(43) });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error).toBe('Invalid or expired code');
    expect(wrong.headers['set-cookie']).toBeUndefined();

    const retry = await request(server).post('/api/auth/native/exchange').send({ code, verifier });
    expect(retry.status).toBe(400);
  });

  it('rate-limits the exchange per ip', async () => {
    for (let i = 0; i < 20; i++) {
      await request(server).post('/api/auth/native/exchange').send({ code: `nope-${i}`, verifier });
    }
    const blocked = await request(server).post('/api/auth/native/exchange').send({ code: 'nope', verifier });
    expect(blocked.status).toBe(429);
  });
});
