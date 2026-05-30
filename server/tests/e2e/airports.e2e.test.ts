/**
 * Airports module e2e — exercises the migrated /api/airports endpoints through
 * the real JwtAuthGuard against a temp SQLite db (seeded via the shared harness).
 * The airport service is mocked so the test doesn't depend on the bundled dataset.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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

const { mockSearch, mockFindByIata } = vi.hoisted(() => ({ mockSearch: vi.fn(), mockFindByIata: vi.fn() }));
vi.mock('../../src/services/airportService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/airportService')>();
  return { ...actual, searchAirports: mockSearch, findByIata: mockFindByIata };
});

import { AirportsModule } from '../../src/nest/airports/airports.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const BER = {
  iata: 'BER', icao: 'EDDB', name: 'Berlin Brandenburg', city: 'Berlin',
  country: 'DE', lat: 52.36, lng: 13.5, tz: 'Europe/Berlin',
};

describe('Airports e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AirportsModule] }).compile();
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
    mockSearch.mockReturnValue([BER]);
    mockFindByIata.mockImplementation((code: string) => (code === 'BER' ? BER : null));
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 { error, code } without a session cookie', async () => {
    const res = await request(server).get('/api/airports/search').query({ q: 'ber' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('200 with results for a query', async () => {
    const res = await request(server).get('/api/airports/search').set('Cookie', sessionCookie(1)).query({ q: 'ber' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([BER]);
  });

  it('200 [] for a missing query without hitting the service', async () => {
    mockSearch.mockClear();
    const res = await request(server).get('/api/airports/search').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('200 for a known IATA code', async () => {
    const res = await request(server).get('/api/airports/BER').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(BER);
  });

  it('404 { error } for an unknown IATA code', async () => {
    const res = await request(server).get('/api/airports/ZZZ').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Airport not found' });
  });
});
