/**
 * Vacay module e2e — exercises the migrated /api/addons/vacay endpoints through
 * the real JwtAuthGuard against a migrated temp SQLite db. DI-native: VacayService runs
 * its real SQL over the temp db (no legacy service mock); the notification side
 * channel stays mocked and the broadcast goes to a FakeRealtimeService. Focuses on auth, status codes
 * (POSTs stay 200), the Zod-pipe 400 envelope and a 403 body.
 */
import { db } from '../../src/db/database';
import { VacayEntries } from '../../src/db/entities/VacayEntries.entity';
import { VacayPlans } from '../../src/db/entities/VacayPlans.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { VacayModule } from '../../src/nest/vacay/vacay.module';
import { findRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
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

let orm: TestOrm;
const realtime = new FakeRealtimeService();

describe('Vacay e2e (real auth guard + migrated temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        VacayModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned id: sessionCookie(1) signs for exactly this user.
    await makeUser(orm, { id: 1, email: 'e2e@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/addons/vacay/plan');
    expect(res.status).toBe(401);
  });

  it('200 plan for an authenticated user (lazily creates the plan)', async () => {
    const res = await request(server).get('/api/addons/vacay/plan').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.plan.owner_id).toBe(1);
    expect(res.body.isOwner).toBe(true);
    expect(await findRow(orm, VacayPlans, { owner: 1 })).not.toBeNull();
  });

  it('200 (not 201) on POST entries/toggle, forwarding the socket id', async () => {
    const res = await request(server)
      .post('/api/addons/vacay/entries/toggle')
      .set('Cookie', sessionCookie(1))
      .set('X-Socket-Id', 'sock-7')
      .send({ date: '2026-07-01' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ action: 'added', fraction: 1, kind: 'vacation' });
    expect(await findRow(orm, VacayEntries, { user: 1, date: '2026-07-01' })).not.toBeNull();
    expect(realtime.broadcastToUserMock).toHaveBeenCalledWith(1, { type: 'vacay:update' }, 'sock-7');
  });

  it('400 from the Zod pipe on entries/toggle without a date', async () => {
    const res = await request(server).post('/api/addons/vacay/entries/toggle').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('date');
  });

  it('403 on color for a user not in the plan', async () => {
    const res = await request(server)
      .put('/api/addons/vacay/color')
      .set('Cookie', sessionCookie(1))
      .send({ color: '#fff', target_user_id: 99 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'User not in plan' });
  });
});
