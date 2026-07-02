/**
 * Transit proxy e2e — /api/transit/geocode + /api/transit/plan through the real
 * JwtAuthGuard against a temp SQLite db. The transit service is mocked; this
 * focuses on auth (401), param pass-through and error propagation (#1065).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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

const { transitSvc } = vi.hoisted(() => ({ transitSvc: { geocode: vi.fn(), plan: vi.fn() } }));
vi.mock('../../src/services/transitService', () => transitSvc);

import { TransitModule } from '../../src/nest/transit/transit.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Transit proxy e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [TransitModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    transitSvc.geocode.mockReset();
    transitSvc.plan.mockReset();
  });

  afterAll(async () => { await app.close(); });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/transit/geocode?q=alexanderplatz')).status).toBe(401);
    expect((await request(server).get('/api/transit/plan?from=1,2&to=3,4')).status).toBe(401);
  });

  it('geocode passes q/lang/near through and returns the service result', async () => {
    transitSvc.geocode.mockResolvedValueOnce({ results: [{ name: 'Alexanderplatz' }] });
    const res = await request(server).get('/api/transit/geocode?q=alex&lang=de&near=52.5,13.4').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.results[0].name).toBe('Alexanderplatz');
    expect(transitSvc.geocode).toHaveBeenCalledWith('alex', 'de', '52.5,13.4');
  });

  it('plan passes all params through (arriveBy + maxTransfers coerced)', async () => {
    transitSvc.plan.mockResolvedValueOnce({ itineraries: [] });
    const res = await request(server)
      .get('/api/transit/plan?from=52.5,13.4&to=52.6,13.5&time=2026-07-13T09:00:00Z&arriveBy=true&modes=BUS&maxTransfers=2')
      .set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(transitSvc.plan).toHaveBeenCalledWith({
      from: '52.5,13.4', to: '52.6,13.5', time: '2026-07-13T09:00:00Z', arriveBy: true, modes: 'BUS', maxTransfers: 2,
    });
  });

  it('service validation errors propagate with their status', async () => {
    const err = new Error('from must be "lat,lng"') as Error & { status: number };
    err.status = 400;
    transitSvc.plan.mockRejectedValueOnce(err);
    const res = await request(server).get('/api/transit/plan?from=bad&to=1,2').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('lat,lng');
  });

  it('upstream failures surface as 502', async () => {
    const err = new Error('Transit provider error (HTTP 500)') as Error & { status: number };
    err.status = 502;
    transitSvc.plan.mockRejectedValueOnce(err);
    const res = await request(server).get('/api/transit/plan?from=1,2&to=3,4').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(502);
  });
});
