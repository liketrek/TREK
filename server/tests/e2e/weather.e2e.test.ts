/**
 * Weather module e2e — exercises the migrated /api/weather endpoints through the
 * real JwtAuthGuard against a temp SQLite db (seeded via the shared harness).
 * The weather service is mocked so no real Open-Meteo calls happen.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { createTempDb, seedUser, sessionCookie } from './harness';

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

const { mockGet, mockGetDetailed } = vi.hoisted(() => ({ mockGet: vi.fn(), mockGetDetailed: vi.fn() }));
vi.mock('../../src/services/weatherService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/weatherService')>();
  return { ...actual, getWeather: mockGet, getDetailedWeather: mockGetDetailed };
});

import { WeatherModule } from '../../src/nest/weather/weather.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Weather e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [WeatherModule] }).compile();
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
    mockGet.mockResolvedValue({ temp: 21, main: 'Clear', description: 'Klar', type: 'current' });
    mockGetDetailed.mockResolvedValue({ temp: 20, main: 'Rain', description: 'Regen', type: 'forecast', hourly: [] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 { error, code } without a session cookie', async () => {
    const res = await request(server).get('/api/weather').query({ lat: '1', lng: '2' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('401 with an invalid token', async () => {
    const res = await request(server).get('/api/weather').set('Cookie', 'trek_session=not-a-jwt').query({ lat: '1', lng: '2' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token', code: 'AUTH_REQUIRED' });
  });

  it('400 when authenticated but lat/lng missing', async () => {
    const res = await request(server).get('/api/weather').set('Cookie', sessionCookie(1)).query({ lng: '2' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Latitude and longitude are required' });
  });

  it('200 with a valid session cookie', async () => {
    const res = await request(server).get('/api/weather').set('Cookie', sessionCookie(1)).query({ lat: '52.5', lng: '13.4' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ temp: 21, main: 'Clear', type: 'current' });
  });

  it('200 on /detailed with a valid session cookie', async () => {
    const res = await request(server).get('/api/weather/detailed').set('Cookie', sessionCookie(1)).query({ lat: '1', lng: '2', date: '2026-07-01' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ type: 'forecast' });
  });
});
