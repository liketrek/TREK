/**
 * Atlas module e2e — exercises the migrated /api/addons/atlas endpoints through
 * the real JwtAuthGuard against a temp SQLite db. atlasService is mocked; this
 * focuses on auth, status codes (mark POSTs stay 200), the cache headers and the
 * bespoke 400/404 bodies.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import zlib from 'zlib';
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

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getStats: vi.fn(),
    getCountryPlaces: vi.fn(),
    markCountryVisited: vi.fn(),
    unmarkCountryVisited: vi.fn(),
    markRegionVisited: vi.fn(),
    unmarkRegionVisited: vi.fn(),
    getVisitedRegions: vi.fn(),
    getRegionGeo: vi.fn(),
    getCountryGeoGz: vi.fn(),
    listBucketList: vi.fn(),
    createBucketItem: vi.fn(),
    updateBucketItem: vi.fn(),
    deleteBucketItem: vi.fn(),
  },
}));
vi.mock('../../src/services/atlasService', () => mocks);

import { AtlasModule } from '../../src/nest/atlas/atlas.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Atlas e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AtlasModule] }).compile();
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
    mocks.getStats.mockResolvedValue({ countries: 3 });
    mocks.markCountryVisited.mockReturnValue(undefined);
    mocks.listBucketList.mockReturnValue([{ id: 1, name: 'Tokyo' }]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/addons/atlas/stats');
    expect(res.status).toBe(401);
  });

  it('200 countries/geo serves gzipped admin-0 that the client decompresses to a FeatureCollection', async () => {
    const gz = zlib.gzipSync(JSON.stringify({ type: 'FeatureCollection', features: [{ id: 'NO' }] }));
    mocks.getCountryGeoGz.mockReturnValue(gz);
    const res = await request(server).get('/api/addons/atlas/countries/geo').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
    // superagent transparently decompresses, mirroring the browser.
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.headers['cache-control']).toContain('max-age=86400');
  });

  it('200 stats for an authenticated user', async () => {
    const res = await request(server).get('/api/addons/atlas/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ countries: 3 });
  });

  it('200 (not 201) on POST country mark, with upper-cased code', async () => {
    const res = await request(server).post('/api/addons/atlas/country/de/mark').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mocks.markCountryVisited).toHaveBeenCalledWith(1, 'DE');
  });

  it('400 on region mark without name/country_code', async () => {
    const res = await request(server).post('/api/addons/atlas/region/by/mark').set('Cookie', sessionCookie(1)).send({ name: 'Bavaria' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name and country_code are required' });
  });

  it('no-store cache header on /regions', async () => {
    mocks.getVisitedRegions.mockResolvedValue({ regions: {} });
    const res = await request(server).get('/api/addons/atlas/regions').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache, no-store');
  });

  it('empty FeatureCollection (no cache header) when /regions/geo has no countries', async () => {
    const res = await request(server).get('/api/addons/atlas/regions/geo').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: 'FeatureCollection', features: [] });
    expect(res.headers['cache-control']).toBeUndefined();
  });

  it('201 on bucket-list create', async () => {
    mocks.createBucketItem.mockReturnValue({ id: 2, name: 'Kyoto' });
    const res = await request(server).post('/api/addons/atlas/bucket-list').set('Cookie', sessionCookie(1)).send({ name: 'Kyoto' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ item: { id: 2, name: 'Kyoto' } });
  });

  it('404 on delete of a missing bucket item', async () => {
    mocks.deleteBucketItem.mockReturnValue(false);
    const res = await request(server).delete('/api/addons/atlas/bucket-list/9').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });
});
