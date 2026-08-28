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
  // #1535: the same journey booked as two flights, which is what an AirTrail import
  // whose legs never chained leaves behind. The hub is a legitimate 'to'/'from' pair, so
  // only the ground time between them says it was a plane change. Own user again.
  it('200 stats leaves out a layover country whose two legs are separate bookings', async () => {
    const flyerId = createUser(db as never, { username: 'atlas-flyer', email: 'atlas-flyer@test.example' }).user.id;
    const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const trip = createTrip(db as never, flyerId, {
      title: 'New York via Helsinki',
      start_date: iso(-20),
      end_date: iso(-10),
    });
    const day = iso(-15);
    const insertFlight = db.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, ?, 'flight')");
    const insertEndpoint = db.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng, code, local_date, local_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const inbound = insertFlight.run(trip.id, 'BRU-HEL').lastInsertRowid;
    insertEndpoint.run(inbound, 'from', 0, 'Brussels', 50.9014, 4.4844, 'BRU', day, '07:00');
    insertEndpoint.run(inbound, 'to', 1, 'Helsinki', 60.3172, 24.9633, 'HEL', day, '09:30');
    const onward = insertFlight.run(trip.id, 'HEL-JFK').lastInsertRowid;
    insertEndpoint.run(onward, 'from', 0, 'Helsinki', 60.3172, 24.9633, 'HEL', day, '11:00');
    insertEndpoint.run(onward, 'to', 1, 'New York', 40.6413, -73.7781, 'JFK', day, '15:00');

    const res = await request(server).get('/api/addons/atlas/stats').set('Cookie', sessionCookie(flyerId));
    expect(res.status).toBe(200);

    const codes = (res.body.countries as { code: string }[]).map((c) => c.code);
    expect(codes).toContain('BE');
    expect(codes).toContain('US');
    expect(codes).not.toContain('FI');
    expect(res.body.stats.totalCountries).toBe(2);
  });

  // ── /locate (#1115) ────────────────────────────────────────────────────────
  describe('GET locate', () => {
    it('resolves a coordinate to the country and the region the map can highlight', async () => {
      // Rome. Italy has admin1 coverage in the bundle, so both come back.
      const res = await request(server)
        .get('/api/addons/atlas/locate?lat=41.9028&lng=12.4964')
        .set('Cookie', sessionCookie(userId));

      expect(res.status).toBe(200);
      expect(res.body.country_code).toBe('IT');
      expect(typeof res.body.region_code === 'string' || res.body.region_code === null).toBe(true);
    });

    it('answers with nulls out at sea rather than failing', async () => {
      const res = await request(server)
        .get('/api/addons/atlas/locate?lat=0&lng=-140')
        .set('Cookie', sessionCookie(userId));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ country_code: null, region_code: null, region_name: null });
    });

    it('rejects a missing or out-of-range coordinate', async () => {
      for (const query of ['', '?lat=41.9', '?lat=abc&lng=12.5', '?lat=91&lng=12.5', '?lat=41.9&lng=181']) {
        const res = await request(server).get(`/api/addons/atlas/locate${query}`).set('Cookie', sessionCookie(userId));
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Valid lat and lng are required' });
      }
    });

    it('needs a session like every other atlas route', async () => {
      expect((await request(server).get('/api/addons/atlas/locate?lat=41.9&lng=12.5')).status).toBe(401);
    });
  });

  // ── GET /api/v1/stats (#1367) ─────────────────────────────────────────────
  //
  // Mounted from this module rather than public-api/ because its figures are
  // AtlasService's; see the controller's docblock. Exercised here because this
  // is the suite that already boots the real AtlasModule against a full schema —
  // the public-api e2e builds a hand-rolled minimal one and could not.
  describe('public API stats', () => {
    function mintApiKey(uid: number, kind = 'api'): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createHash, randomBytes } = require('crypto');
      const raw = 'trek_' + randomBytes(24).toString('hex');
      db.prepare('INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix, kind) VALUES (?, ?, ?, ?, ?)')
        .run(uid, `key-${kind}-${uid}`, createHash('sha256').update(raw).digest('hex'), raw.slice(0, 12), kind);
      return raw;
    }

    it('401 without a key, and a session cookie is not a substitute', async () => {
      expect((await request(server).get('/api/v1/stats')).status).toBe(401);
      // The whole point of a machine credential: the browser session does not open it.
      const res = await request(server).get('/api/v1/stats').set('Cookie', sessionCookie(userId));
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'API token required', code: 'API_TOKEN_REQUIRED' });
    });

    it('401 for an MCP token — the wrong kind is indistinguishable from no token', async () => {
      const mcpKey = mintApiKey(userId, 'mcp');
      const res = await request(server).get('/api/v1/stats').set('X-API-Key', mcpKey);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid API token', code: 'API_TOKEN_INVALID' });
    });

    it('200 with counts and the last started trip, over both header spellings', async () => {
      const { user } = createUser(db as never, { username: 'stats-e2e', email: 'stats-e2e@test.example' });
      const key = mintApiKey(user.id);
      const iso = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

      createTrip(db as never, user.id, { title: 'Older', start_date: iso(-90), end_date: iso(-80) });
      const recent = createTrip(db as never, user.id, { title: 'Recent', start_date: iso(-40), end_date: iso(-30) });
      createTrip(db as never, user.id, { title: 'Booked', start_date: iso(30), end_date: iso(40) });
      const cat = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number } | undefined;
      const placeId = db
        .prepare('INSERT INTO places (trip_id, name, address, category_id) VALUES (?, ?, ?, ?)')
        .run(recent.id, 'Trevi', 'Piazza di Trevi, 00187, Roma, Italy', cat?.id ?? null).lastInsertRowid as number;
      db.prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
        .run(placeId, 'IT', 'IT-62', 'Lazio');

      const res = await request(server).get('/api/v1/stats').set('Authorization', `Bearer ${key}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        total_trips: 3,
        total_countries: 1,
        total_places: 1,
        last_trip: { title: 'Recent', country: 'IT', countries: ['IT'] },
      });
      // Scalars all the way — a widget maps fields, it cannot aggregate a list.
      for (const k of ['total_trips', 'total_countries', 'total_cities', 'total_places', 'total_days', 'total_distance_km']) {
        expect(typeof res.body[k]).toBe('number');
      }

      const viaHeader = await request(server).get('/api/v1/stats').set('X-API-Key', key);
      expect(viaHeader.body).toEqual(res.body);
    });

    it('counts only the caller own trips', async () => {
      const { user: stranger } = createUser(db as never, { username: 'stats-other', email: 'stats-other@test.example' });
      const key = mintApiKey(stranger.id);
      const res = await request(server).get('/api/v1/stats').set('X-API-Key', key);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total_trips: 0, total_countries: 0, last_trip: null });
    });
  });

});
