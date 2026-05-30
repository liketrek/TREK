/**
 * Maps module e2e — exercises the migrated /api/maps endpoints through the real
 * JwtAuthGuard against a temp SQLite db. mapsService is mocked (no outbound HTTP),
 * and the temp db carries an empty app_settings table so the kill-switch reads
 * resolve to "enabled".
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
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    searchPlaces: vi.fn(),
    autocompletePlaces: vi.fn(),
    getPlaceDetails: vi.fn(),
    getPlaceDetailsExpanded: vi.fn(),
    getPlacePhoto: vi.fn(),
    reverseGeocode: vi.fn(),
    resolveGoogleMapsUrl: vi.fn(),
  },
}));
vi.mock('../../src/services/mapsService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/mapsService')>();
  return { ...actual, ...mocks };
});

import { MapsModule } from '../../src/nest/maps/maps.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Maps e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, MapsModule] }).compile();
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
    mocks.searchPlaces.mockResolvedValue({ places: [{ name: 'Berlin' }], source: 'osm' });
    mocks.reverseGeocode.mockResolvedValue({ name: 'Spot', address: 'Street 1' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).post('/api/maps/search').send({ query: 'berlin' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('400 when authenticated but query is missing', async () => {
    const res = await request(server).post('/api/maps/search').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Search query is required' });
  });

  it('200 with results for a search (POST stays 200, not 201)', async () => {
    const res = await request(server).post('/api/maps/search').set('Cookie', sessionCookie(1)).send({ query: 'berlin' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ places: [{ name: 'Berlin' }], source: 'osm' });
  });

  it('200 on reverse geocode', async () => {
    const res = await request(server).get('/api/maps/reverse').set('Cookie', sessionCookie(1)).query({ lat: '52.5', lng: '13.4' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Spot', address: 'Street 1' });
  });

  it('400 on reverse geocode without coordinates', async () => {
    const res = await request(server).get('/api/maps/reverse').set('Cookie', sessionCookie(1)).query({ lat: '52.5' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'lat and lng required' });
  });
});
