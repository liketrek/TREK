/**
 * Maps module e2e — exercises the migrated /api/maps endpoints through the real
 * JwtAuthGuard against a temp SQLite db. The DI-native MapsService's provider
 * methods are stubbed via instance spies (no outbound HTTP), and the temp db
 * carries an empty app_settings table so the kill-switch reads resolve to
 * "enabled".
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

import { MapsModule } from '../../src/nest/maps/maps.module';
import { MapsService } from '../../src/nest/maps/maps.service';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Maps e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, MapsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Same harness shape as the todo/budget e2e suites: the APP_PIPE from
    // app.module.ts isn't in this focused module graph, so wire it by hand —
    // it validates any @Body() typed with a Zod DTO metatype.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    // Stub the provider fan-out on the container's MapsService instance — the
    // controller-facing wrapper methods delegate to these since the maps fold.
    const maps = app.get(MapsService);
    vi.spyOn(maps, 'searchPlaces').mockResolvedValue({ places: [{ name: 'Berlin' }], source: 'osm' });
    vi.spyOn(maps, 'reverseGeocode').mockResolvedValue({ name: 'Spot', address: 'Street 1' });
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
    // The exact error wording is pinned in maps.controller.test.ts — this suite
    // pins the status contract only (the body-contract ratchet reshapes the 400
    // envelope in its own commit).
    expect(res.body).toHaveProperty('error');
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
