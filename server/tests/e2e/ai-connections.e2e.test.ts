/**
 * AI connections e2e: /api/ai (a user's own connection and the assistant's
 * status) and /api/admin/ai (the instance's connection and settings) through
 * the real AddonGuard, JwtAuthGuard and AdminGuard, the Zod pipe and the
 * response contracts, over the real services and repositories on a migrated
 * temp SQLite db.
 *
 * Replaced: safeFetch, so no provider is ever asked (each case answers the
 * model list it needs).
 */
import { AiConnections } from '../../src/db/entities/AiConnections.entity';
import { AiConnectionsModule } from '../../src/nest/ai-connections/ai-connections.module';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../src/nest/common/demo.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { deleteRows, findRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
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
const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const db = createSnapshotTestDb();
const USER = 1;
const ADMIN = 2;
const OTHER = 3;

let orm: TestOrm;
let server: Server;
let app: Awaited<ReturnType<typeof build>>;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(db),
      await createTestMikroOrmModule(db),
      AppConfigModule,
      RealtimeModule,
      DemoModule,
      AiConnectionsModule,
    ],
  })
    .overrideProvider(RealtimeService)
    .useValue(new FakeRealtimeService())
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalPipes(new ZodValidationPipe());
  nest.useGlobalFilters(new TrekExceptionFilter());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

function anthropicModels(): Response {
  return new Response(
    JSON.stringify({
      data: [
        { id: 'claude-haiku', display_name: 'Haiku' },
        { id: 'claude-sonnet-5', display_name: 'Sonnet' },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, username: 'traveler', email: 'traveler@example.test' });
  await makeUser(orm, { id: ADMIN, username: 'admin', email: 'admin@example.test', role: 'admin' });
  await makeUser(orm, { id: OTHER, username: 'other', email: 'other@example.test' });
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  safeFetch.mockReset();
  safeFetch.mockImplementation(async () => anthropicModels());
  await setAddonEnabled(orm, 'ai_assistant', true);
  await deleteRows(orm, AiConnections);
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('AI connections e2e', () => {
  it('AIE2E-001: the addon gate answers 404 before auth, then auth answers 401', async () => {
    await setAddonEnabled(orm, 'ai_assistant', false);
    expect((await request(server).get('/api/ai/status')).status).toBe(404);
    await setAddonEnabled(orm, 'ai_assistant', true);
    expect((await request(server).get('/api/ai/status')).status).toBe(401);
  });

  it('AIE2E-002: a user connects a key, picks a model and removes the connection again', async () => {
    const before = await request(server).get('/api/ai/status').set(as(USER));
    expect(before.status).toBe(200);
    expect(before.body).toMatchObject({ available: false, canConnectOwn: true, own: null });

    expect((await request(server).put('/api/ai/connection').set(as(USER)).send({ kind: 'anthropic' })).status).toBe(
      400,
    );

    const saved = await request(server)
      .put('/api/ai/connection')
      .set(as(USER))
      .send({ kind: 'anthropic', apiKey: 'sk-ant-api03-e2e-key-4242' });
    expect(saved.status).toBe(200);
    expect(saved.body).toEqual({
      scope: 'user',
      kind: 'anthropic',
      model: 'claude-sonnet-5',
      hint: '…4242',
      status: 'ok',
      host: 'api.anthropic.com',
    });
    expect(JSON.stringify(saved.body)).not.toContain('e2e-key');
    expect((await findRow(orm, AiConnections, { user: USER }))?.secrets).toMatch(/^enc:v1:/);

    const status = await request(server).get('/api/ai/status').set(as(USER));
    expect(status.body).toMatchObject({ available: true, effective: { source: 'user', paidBy: 'user' } });

    const models = await request(server).get('/api/ai/models').set(as(USER));
    expect(models.status).toBe(200);
    expect(models.body.models).toHaveLength(2);

    const changed = await request(server)
      .patch('/api/ai/connection/model')
      .set(as(USER))
      .send({ model: 'claude-haiku' });
    expect(changed.body).toMatchObject({ model: 'claude-haiku' });

    const removed = await request(server).delete('/api/ai/connection').set(as(USER));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ success: true });
    expect(await findRow(orm, AiConnections, { user: USER })).toBeNull();
  });

  it('AIE2E-003: a key the provider refuses is a 422 with its code, and nothing is saved', async () => {
    safeFetch.mockImplementation(
      async () => new Response(JSON.stringify({ error: { type: 'authentication_error' } }), { status: 401 }),
    );
    const res = await request(server)
      .put('/api/ai/connection')
      .set(as(OTHER))
      .send({ kind: 'anthropic', apiKey: 'sk-ant-bad-key' });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'The provider refused this key', code: 'invalid_key' });
    expect(await findRow(orm, AiConnections, { user: OTHER })).toBeNull();
  });

  it('AIE2E-004: the admin routes are for admins; the instance connection and the settings round-trip', async () => {
    expect((await request(server).get('/api/admin/ai/settings').set(as(USER))).status).toBe(403);

    const settings = await request(server)
      .put('/api/admin/ai/settings')
      .set(as(ADMIN))
      .send({ policy: 'instance', dailyTurns: 25, retention: { mode: 'days', days: 30 } });
    expect(settings.status).toBe(200);
    // A client that sends no webSearch leaves the search on.
    expect(settings.body).toEqual({
      policy: 'instance',
      dailyTurns: 25,
      retention: { mode: 'days', days: 30 },
      webSearch: true,
    });
    const off = await request(server)
      .put('/api/admin/ai/settings')
      .set(as(ADMIN))
      .send({ policy: 'instance', dailyTurns: 25, retention: { mode: 'days', days: 30 }, webSearch: false });
    expect(off.body.webSearch).toBe(false);

    const saved = await request(server)
      .put('/api/admin/ai/connection')
      .set(as(ADMIN))
      .send({ kind: 'anthropic', apiKey: 'sk-ant-instance-key-7777' });
    expect(saved.status).toBe(200);
    expect(saved.body.connection).toMatchObject({ scope: 'instance', kind: 'anthropic', hint: '…7777', baseUrl: null });
    expect(saved.body.prefill).toBeNull();

    // A user now runs on the instance's connection, with the daily limit and a privacy notice to acknowledge.
    const status = await request(server).get('/api/ai/status').set(as(USER));
    expect(status.body).toMatchObject({
      available: true,
      canConnectOwn: false,
      effective: { source: 'instance', paidBy: 'instance' },
      quota: { used: 0, limit: 25 },
      privacyAcked: false,
    });
    const ack = await request(server)
      .post('/api/ai/privacy-ack')
      .set(as(USER))
      .send({ kind: 'anthropic', host: 'api.anthropic.com' });
    expect(ack.status).toBe(200);
    expect((await request(server).get('/api/ai/status').set(as(USER))).body.privacyAcked).toBe(true);

    // Under the instance policy, a user cannot connect a key of their own.
    const own = await request(server)
      .put('/api/ai/connection')
      .set(as(USER))
      .send({ kind: 'anthropic', apiKey: 'sk-ant-own' });
    expect(own.status).toBe(403);

    expect((await request(server).delete('/api/admin/ai/connection').set(as(ADMIN))).status).toBe(200);
    await request(server)
      .put('/api/admin/ai/settings')
      .set(as(ADMIN))
      .send({ policy: 'instance_or_user', dailyTurns: 50, retention: { mode: 'days', days: 90 } });
  });

  it('AIE2E-005: an instance custom server is refused on the user route, and the body is validated as the union', async () => {
    const user = await request(server)
      .put('/api/ai/connection')
      .set(as(USER))
      .send({ kind: 'custom', apiKey: 'whatever-key', baseUrl: 'http://lan' });
    expect(user.status).toBe(400);
    const admin = await request(server)
      .put('/api/admin/ai/connection')
      .set(as(ADMIN))
      .send({ kind: 'custom', baseUrl: 'javascript:alert(1)', model: 'x' });
    expect(admin.status).toBe(400);
  });

  it('AIE2E-006: a ChatGPT sign-in starts with an authorize URL, and a wrong pasted address is refused', async () => {
    const start = await request(server).post('/api/ai/connect/chatgpt/start').set(as(USER));
    expect(start.status).toBe(200);
    expect(new URL(start.body.authorizeUrl).origin).toBe('https://auth.openai.com');
    const finish = await request(server)
      .post('/api/ai/connect/chatgpt/finish')
      .set(as(USER))
      .send({ flowId: start.body.flowId, pastedUrl: 'https://example.com/callback?code=x' });
    expect(finish.status).toBe(422);
    expect(finish.body).toMatchObject({ code: 'wrong_url' });
  });

  it('AIE2E-007: the instance OpenRouter sign-in is not started on the user route', async () => {
    const res = await request(server)
      .post('/api/ai/connect/openrouter/start')
      .set(as(USER))
      .send({ scope: 'instance' });
    expect(res.status).toBe(403);
  });
});
