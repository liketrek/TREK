/**
 * Native sign-in hand-off e2e: the real CookieAuthGuard, the real cookie
 * helpers, the real AuthService and session table over a migrated temp SQLite
 * db. Walks the whole round trip the apps make: the browser side mints a code
 * for a challenge, the WebView side redeems it with the verifier and walks
 * away with a session cookie that /api/auth/me accepts.
 */
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { NativeAuthModule } from '../../src/nest/native-auth/native-auth.module';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { findRows } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie, signSession } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import { createHash, randomBytes } from 'crypto';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const verifier = randomBytes(32).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('hex');

const db = createSnapshotTestDb();
let orm: TestOrm;
let server: Server;
let app: Awaited<ReturnType<typeof build>>;
let userId: number;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), AuthModule, NativeAuthModule],
  })
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

const handoff = (cookie: string, body: object = { challenge }) =>
  request(server).post('/api/auth/native/handoff').set('Cookie', cookie).send(body);
const exchange = (body: object) => request(server).post('/api/auth/native/exchange').send(body);

beforeAll(async () => {
  orm = await createTestOrm(db);
  userId = (await makeUser(orm, { username: 'native-e2e', email: 'native-e2e@example.test' })).user.id;
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  await resetRateLimits(app);
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('Native sign-in hand-off e2e', () => {
  it('NATIVE-E2E-001: carries a browser session into a fresh session cookie for the app', async () => {
    const minted = await handoff(sessionCookie(userId));
    expect(minted.status).toBe(200);
    expect(typeof minted.body.code).toBe('string');

    const redeemed = await exchange({ code: minted.body.code, verifier });
    expect(redeemed.status).toBe(200);
    expect(redeemed.body).toEqual({ success: true });
    const cookie = (redeemed.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Max-Age=\d+/);

    const me = await request(server).get('/api/auth/me').set('Cookie', String(cookie).split(';')[0]);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(userId);

    const logins = await findRows(orm, AuditLog, { user: userId, action: 'user.login' });
    expect(logins.map((row) => JSON.parse(row.details ?? '{}'))).toContainEqual({ method: 'native_app' });
  });

  it('NATIVE-E2E-002: refuses to mint a code without a cookie session, even for a valid bearer token', async () => {
    const res = await request(server)
      .post('/api/auth/native/handoff')
      .set('Authorization', `Bearer ${signSession(userId)}`)
      .send({ challenge });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('COOKIE_AUTH_REQUIRED');
  });

  it('NATIVE-E2E-003: validates the challenge shape', async () => {
    expect((await handoff(sessionCookie(userId), { challenge: 'not-a-hash' })).status).toBe(400);
  });

  it('NATIVE-E2E-004: refuses a code presented with the wrong verifier, and the code is gone after', async () => {
    const { code } = (await handoff(sessionCookie(userId))).body as { code: string };
    const wrong = await exchange({ code, verifier: 'x'.repeat(43) });
    expect(wrong.status).toBe(400);
    expect(wrong.body).toEqual({ error: 'Invalid or expired code' });
    expect(wrong.headers['set-cookie']).toBeUndefined();

    const retry = await exchange({ code, verifier });
    expect(retry.status).toBe(400);
  });

  it('NATIVE-E2E-005: rate-limits the exchange per ip', async () => {
    // One after another: twenty requests at once reset the ephemeral test server's connections.
    await Array.from({ length: 20 }).reduce<Promise<unknown>>(
      (previous, _, i) => previous.then(() => exchange({ code: `nope-${i}`, verifier })),
      Promise.resolve(),
    );
    const blocked = await exchange({ code: 'nope', verifier });
    expect(blocked.status).toBe(429);
  });
});
