/**
 * /api/place-shadow e2e — the real JwtAuthGuard, the real AdminGuard and the
 * real Zod pipe against a migrated temp SQLite db.
 *
 * The three things worth booting a server for: that a non-admin cannot read
 * other people's searches, that a switched-off log answers 200 instead of an
 * error the client would log forever, and that the pipe rejects a malformed
 * body before the service ever sees it.
 */
import { db } from '../../src/db/database';
import { PlaceShadowPicks } from '../../src/db/entities/PlaceShadowPicks.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { PlaceShadowModule } from '../../src/nest/place-shadow/place-shadow.module';
import { countRows, deleteRows } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let orm: TestOrm;

const PICK = {
  query: 'kaffee bar am dobi',
  lang: 'de',
  source: 'search:nominatim',
  liveRank: 1,
  liveCount: 5,
  pickedName: 'Baltic Brothers Coffee',
  pickedLat: 54.0885,
  pickedLng: 12.1395,
};

const USER = 1;
const ADMIN = 2;

async function enable(on: boolean): Promise<void> {
  await setAppSetting(orm, 'place_shadow_enabled', on ? 'true' : 'false');
}

describe('/api/place-shadow e2e (real guards + migrated temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    // JwtAuthGuard (Plan 3b Task 1) injects EntityManager, so it needs
    // MikroOrmModule.forRoot in the graph, same as every other e2e harness
    // guarding a route with it.
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), PlaceShadowModule],
      providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: sessionCookie(USER) and (ADMIN) sign for exactly these users.
    await makeUser(orm, { id: USER, email: 'e2e@example.test' });
    await makeAdmin(orm, { id: ADMIN, email: 'admin@example.com' });
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  beforeEach(async () => {
    await deleteRows(orm, PlaceShadowPicks);
    await enable(true);
  });

  describe('POST pick', () => {
    it('401 without a cookie', async () => {
      expect((await request(server).post('/api/place-shadow/pick').send(PICK)).status).toBe(401);
    });

    it('200 { recorded: true } and one row for a signed-in user', async () => {
      const res = await request(server).post('/api/place-shadow/pick').set('Cookie', sessionCookie(USER)).send(PICK);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ recorded: true });
      expect(await countRows(orm, PlaceShadowPicks)).toBe(1);
    });

    it('200 { recorded: false } while the log is off, not an error status', async () => {
      await enable(false);
      const res = await request(server).post('/api/place-shadow/pick').set('Cookie', sessionCookie(USER)).send(PICK);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ recorded: false });
      expect(await countRows(orm, PlaceShadowPicks)).toBe(0);
    });

    it('400 from the pipe on a malformed body, and nothing is written', async () => {
      for (const bad of [
        { ...PICK, query: '' },
        { ...PICK, pickedLat: 200 },
        { ...PICK, liveRank: -1 },
        { ...PICK, source: undefined },
        { ...PICK, query: 'x'.repeat(201) },
      ]) {
        const res = await request(server).post('/api/place-shadow/pick').set('Cookie', sessionCookie(USER)).send(bad);
        expect(res.status, JSON.stringify(bad).slice(0, 60)).toBe(400);
      }
      expect(await countRows(orm, PlaceShadowPicks)).toBe(0);
    });
  });

  describe('reading is admin only', () => {
    for (const [method, path] of [
      ['get', '/api/place-shadow/summary'],
      ['get', '/api/place-shadow/export'],
      ['delete', '/api/place-shadow'],
    ] as const) {
      it(`403 for a non-admin on ${method.toUpperCase()} ${path}`, async () => {
        expect((await request(server)[method](path).set('Cookie', sessionCookie(USER))).status).toBe(403);
      });

      it(`401 without a cookie on ${method.toUpperCase()} ${path}`, async () => {
        expect((await request(server)[method](path)).status).toBe(401);
      });
    }

    it('an admin gets the summary', async () => {
      await request(server).post('/api/place-shadow/pick').set('Cookie', sessionCookie(USER)).send(PICK);
      await request(server)
        .post('/api/place-shadow/pick')
        .set('Cookie', sessionCookie(USER))
        .send({ ...PICK, liveRank: 0 });
      const res = await request(server).get('/api/place-shadow/summary').set('Cookie', sessionCookie(ADMIN));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        enabled: true,
        total: 2,
        bySource: [{ source: 'search:nominatim', count: 2 }],
        liveTopOneShare: 0.5,
        liveTopFiveShare: 1,
      });
    });

    it('an admin gets the corpus, and the wipe empties it', async () => {
      await request(server).post('/api/place-shadow/pick').set('Cookie', sessionCookie(USER)).send(PICK);
      const dump = await request(server).get('/api/place-shadow/export').set('Cookie', sessionCookie(ADMIN));
      expect(dump.status).toBe(200);
      expect(dump.body.version).toBe(1);
      expect(dump.body.rows).toHaveLength(1);
      expect(dump.body.rows[0]).toMatchObject({ query: PICK.query, pickedName: PICK.pickedName, liveRank: 1 });

      const wiped = await request(server).delete('/api/place-shadow').set('Cookie', sessionCookie(ADMIN));
      expect(wiped.status).toBe(200);
      expect(wiped.body).toEqual({ removed: 1 });
      expect(await countRows(orm, PlaceShadowPicks)).toBe(0);
    });
  });
});
