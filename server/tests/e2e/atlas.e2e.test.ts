/**
 * Atlas e2e — drives /api/addons/atlas through the REAL JwtAuthGuard AND the
 * real DI-native AtlasService (DatabaseModule + AtlasModule) against a temp
 * SQLite db (full schema). No service mock (the legacy path-mock died with the
 * fold): auth, status codes (mark POSTs stay 200, bucket create stays 201),
 * cache headers, the bespoke 400/404 bodies, and the SQL effects are all real.
 * countries/geo serves the real bundled admin-0 gz. Seeded data stays
 * coordinate-free so the background place_regions geocode never fires.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: () => undefined,
  isOwner: () => false,
}));

vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser, createTrip } from '../helpers/factories';
import { AtlasModule } from '../../src/nest/atlas/atlas.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Atlas e2e (real auth guard + real service + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let userId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, AtlasModule] }).compile();
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
    createTables(db as never);
    runMigrations(db as never);
    userId = createUser(db as never, { username: 'atlas-e2e', email: 'atlas-e2e@test.example' }).user.id;
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/addons/atlas/stats');
    expect(res.status).toBe(401);
  });

  it('200 countries/geo serves the bundled gzipped admin-0 that the client decompresses to a FeatureCollection', async () => {
    const res = await request(server).get('/api/addons/atlas/countries/geo').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
    // superagent transparently decompresses, mirroring the browser.
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features.length).toBeGreaterThan(0);
    expect(res.headers['cache-control']).toContain('max-age=86400');
  });

  it('200 stats for an authenticated user — the trip-less branch keeps its bespoke shape', async () => {
    db.prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(userId, 'JP');
    const res = await request(server).get('/api/addons/atlas/stats').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    // Zero-trip early return: has a `trips` key and only the four base stats —
    // no totalCities/mostVisited/continents/… (preserved quirk).
    expect(res.body).toEqual({
      countries: [{ code: 'JP', placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }],
      trips: [],
      stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
    });
    db.prepare('DELETE FROM visited_countries WHERE user_id = ?').run(userId);
  });

  it('200 (not 201) on POST country mark, with upper-cased code written to the db', async () => {
    const res = await request(server).post('/api/addons/atlas/country/de/mark').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const row = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').get(userId);
    expect(row).toEqual({ country_code: 'DE' });
    db.prepare('DELETE FROM visited_countries WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM hidden_countries WHERE user_id = ?').run(userId);
  });

  it('400 on region mark without country_code (ZodValidationPipe envelope)', async () => {
    const res = await request(server).post('/api/addons/atlas/region/by/mark').set('Cookie', sessionCookie(userId)).send({ name: 'Bavaria' });
    expect(res.status).toBe(400);
    // The legacy hand-rolled 'name and country_code are required' body became
    // the pipe's `field: message` envelope with the atlas DTO ratchet.
    expect(res.body.error).toMatch(/^country_code: /);
    expect(db.prepare('SELECT COUNT(*) AS n FROM visited_regions WHERE user_id = ?').get(userId)).toEqual({ n: 0 });
  });

  it("400 'Name is required' on whitespace-only bucket name (legacy trim guard survives the DTO)", async () => {
    const res = await request(server).post('/api/addons/atlas/bucket-list').set('Cookie', sessionCookie(userId)).send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('no-store cache header on /regions', async () => {
    const res = await request(server).get('/api/addons/atlas/regions').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ regions: {} });
    expect(res.headers['cache-control']).toBe('no-cache, no-store');
  });

  it('empty FeatureCollection (no cache header) when /regions/geo has no countries', async () => {
    const res = await request(server).get('/api/addons/atlas/regions/geo').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: 'FeatureCollection', features: [] });
    expect(res.headers['cache-control']).toBeUndefined();
  });

  it('201 on bucket-list create, row persisted', async () => {
    const res = await request(server).post('/api/addons/atlas/bucket-list').set('Cookie', sessionCookie(userId)).send({ name: 'Kyoto' });
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe('Kyoto');
    const row = db.prepare('SELECT name, user_id FROM bucket_list WHERE id = ?').get(res.body.item.id);
    expect(row).toEqual({ name: 'Kyoto', user_id: userId });
  });

  it('404 on delete of a missing bucket item', async () => {
    const res = await request(server).delete('/api/addons/atlas/bucket-list/999').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  // #1048 — the whole point of the feature over the real wire: a booked-but-not-taken
  // trip must still reach the client (so the map can draw it) without counting as a
  // visit. Runs on its own user so the trip-less pin above stays trip-less.
  it('200 stats keeps a future trip out of the visited count but still ships it as planned', async () => {
    const plannerId = createUser(db as never, { username: 'atlas-planner', email: 'atlas-planner@test.example' }).user.id;
    // Offsets from today, not literal dates — a hardcoded future date expires.
    const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const past = createTrip(db as never, plannerId, { title: 'Rome, last month', start_date: iso(-40), end_date: iso(-30) });
    const future = createTrip(db as never, plannerId, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    // Address-only (no lat/lng), keeping the file's no-background-geocode property.
    const insertPlace = db.prepare('INSERT INTO places (trip_id, name, address) VALUES (?, ?, ?)');
    insertPlace.run(past.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');
    insertPlace.run(future.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const res = await request(server).get('/api/addons/atlas/stats').set('Cookie', sessionCookie(plannerId));
    expect(res.status).toBe(200);

    const byCode = Object.fromEntries((res.body.countries as { code: string }[]).map((c) => [c.code, c]));
    expect(byCode['IT']).toMatchObject({ status: 'visited' });
    expect(byCode['JP']).toMatchObject({ status: 'planned' });
    expect(res.body.stats.totalCountries).toBe(1);
    expect(res.body.stats.totalCountriesPlanned).toBe(1);
    expect(res.body.countries.length).toBeGreaterThan(res.body.stats.totalCountries);
    expect(res.body.continents).toEqual({ Europe: 1 });
    expect(res.body.continentsPlanned).toEqual({ Asia: 1 });

    // The country sheet agrees with the map.
    const jp = await request(server).get('/api/addons/atlas/country/jp').set('Cookie', sessionCookie(plannerId));
    expect(jp.status).toBe(200);
    expect(jp.body.status).toBe('planned');
  });
});
