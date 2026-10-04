/**
 * Atlas integration tests.
 * Covers ATLAS-001 to ATLAS-008.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { getRegionGeo } from '../../src/nest/atlas/atlas-geo';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  // Stub the admin-1 GeoJSON download so /regions/geo is deterministic and never
  // hits the real network (the un-stubbed fetch of a ~4600-feature file from
  // raw.githubusercontent.com is what made ATLAS-013 hang/time out under load).
  // Any other outbound fetch (e.g. background reverse-geocoding) returns empty so
  // no test depends on live network.
  vi.stubGlobal('fetch', async (url: unknown) => {
    if (String(url).includes('natural-earth-vector')) {
      return new Response(
        JSON.stringify({
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { iso_a2: 'DE' }, geometry: { type: 'Point', coordinates: [10, 51] } },
            { type: 'Feature', properties: { iso_a2: 'FR' }, geometry: { type: 'Point', coordinates: [2, 47] } },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();

  // Warm the admin-1 store here rather than inside ATLAS-013. The first call streams
  // the multi-MB bundle through the brace-depth splitter and caches it for the process,
  // which costs ~3s on a quiet machine and more when every worker is busy — so whichever
  // test hit it first used to pay for it inside its own 5s budget and fail under load.
  await getRegionGeo(['ZZ']);
}, 60_000);

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await nestApp.close();
  testDb.close();
});

describe('Atlas stats', () => {
  it('ATLAS-001 — GET /api/atlas/stats returns stats object', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('countries');
    expect(res.body).toHaveProperty('stats');
  });

  it('ATLAS-014 — a future trip is returned as planned and excluded from totalCountries (#1048)', async () => {
    const { user } = createUser(testDb);
    // Offsets from today rather than literal dates, so this cannot expire.
    const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const past = createTrip(testDb, user.id, { title: 'Rome, last month', start_date: iso(-40), end_date: iso(-30) });
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    const insertPlace = testDb.prepare('INSERT INTO places (trip_id, name, address) VALUES (?, ?, ?)');
    insertPlace.run(past.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');
    insertPlace.run(future.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const res = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    const countries = res.body.countries as { code: string; status: string }[];
    expect(countries.find(c => c.code === 'IT')?.status).toBe('visited');
    expect(countries.find(c => c.code === 'JP')?.status).toBe('planned');
    expect(res.body.stats.totalCountries).toBe(1);
    expect(res.body.stats.totalCountriesPlanned).toBe(1);
    // The whole point: the map gets more countries than the passport counter shows.
    expect(countries.length).toBeGreaterThan(res.body.stats.totalCountries);
  });

  it('ATLAS-002 — GET /api/atlas/country/:code returns places in country', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/addons/atlas/country/FR')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.places)).toBe(true);
  });
});

describe('Mark/unmark country', () => {
  it('ATLAS-003 — POST /country/:code/mark marks country as visited', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/country/DE/mark')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it appears in visited countries
    const stats = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));
    const codes = (stats.body.countries as any[]).map((c: any) => c.code);
    expect(codes).toContain('DE');
  });

  it('ATLAS-004 — DELETE /country/:code/mark unmarks country', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/country/IT/mark')
      .set('Cookie', authCookie(user.id));

    const res = await request(app)
      .delete('/api/addons/atlas/country/IT/mark')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Bucket list', () => {
  it('ATLAS-005 — POST /bucket-list creates a bucket list item', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Machu Picchu', country_code: 'PE', lat: -13.1631, lng: -72.5450 });
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe('Machu Picchu');
  });

  it('ATLAS-005 — POST without name returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ country_code: 'JP' });
    expect(res.status).toBe(400);
  });

  it('ATLAS-005 — POST the same item twice returns 409 and keeps one row (#1898)', async () => {
    const { user } = createUser(testDb);
    const body = { name: 'Japan', country_code: 'JP' };

    const first = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send(body);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send(body);
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: 'Already on your bucket list' });

    const list = await request(app)
      .get('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id));
    expect(list.body.items).toHaveLength(1);
  });

  it('ATLAS-005 — POST the same item for another target date is allowed (#1898)', async () => {
    const { user } = createUser(testDb);

    const undated = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Japan', country_code: 'JP', target_date: null });
    expect(undated.status).toBe(201);

    const dated = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Japan', country_code: 'JP', target_date: '2027-05' });
    expect(dated.status).toBe(201);

    const list = await request(app)
      .get('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id));
    expect(list.body.items).toHaveLength(2);
  });

  it('ATLAS-006 — GET /bucket-list returns items', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Santorini', country_code: 'GR' });

    const res = await request(app)
      .get('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('ATLAS-007 — PUT /bucket-list/:id updates item', async () => {
    const { user } = createUser(testDb);

    const create = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Old Name' });
    const id = create.body.item.id;

    const res = await request(app)
      .put(`/api/addons/atlas/bucket-list/${id}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name', notes: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('New Name');
  });

  it('ATLAS-007 — PUT onto an existing wish returns 409 and leaves the row alone (#1898)', async () => {
    const { user } = createUser(testDb);
    await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Japan', country_code: 'JP', target_date: '2027-05' });
    const second = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Japan', country_code: 'JP', target_date: '2028-09' });

    const res = await request(app)
      .put(`/api/addons/atlas/bucket-list/${second.body.item.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ target_date: '2027-05' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Already on your bucket list' });

    const list = await request(app)
      .get('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id));
    expect(list.body.items.map((i: { target_date: string }) => i.target_date).sort()).toEqual(['2027-05', '2028-09']);
  });

  it('ATLAS-008 — DELETE /bucket-list/:id removes item', async () => {
    const { user } = createUser(testDb);

    const create = await request(app)
      .post('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Tokyo' });
    const id = create.body.item.id;

    const del = await request(app)
      .delete(`/api/addons/atlas/bucket-list/${id}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app)
      .get('/api/addons/atlas/bucket-list')
      .set('Cookie', authCookie(user.id));
    expect(list.body.items).toHaveLength(0);
  });

  it('ATLAS-008 — DELETE non-existent item returns 404', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .delete('/api/addons/atlas/bucket-list/99999')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });
});

describe('Mark/unmark region', () => {
  it('ATLAS-009 — POST /region/:code/mark marks a region as visited', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('ATLAS-009 — POST /region/:code/mark without name returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ country_code: 'DE' });

    expect(res.status).toBe(400);
  });

  it('ATLAS-009 — POST /region/:code/mark without country_code returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen' });

    expect(res.status).toBe(400);
  });

  it('ATLAS-009 — marking a region also auto-marks the parent country', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    const stats = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));

    const codes = (stats.body.countries as any[]).map((c: any) => c.code);
    expect(codes).toContain('DE');
  });

  it('ATLAS-009 — marking the same region twice is idempotent', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    const res = await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    expect(res.status).toBe(200);
  });

  it('ATLAS-010 — GET /regions returns marked regions grouped by country', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    await request(app)
      .post('/api/addons/atlas/region/DE-BY/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Bayern', country_code: 'DE' });

    const res = await request(app)
      .get('/api/addons/atlas/regions')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('regions');
    const deRegions = res.body.regions['DE'] as any[];
    expect(deRegions).toBeDefined();
    const codes = deRegions.map((r: any) => r.code);
    expect(codes).toContain('DE-NW');
    expect(codes).toContain('DE-BY');
  });

  it('ATLAS-011 — DELETE /region/:code/mark unmarks a region', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    const del = await request(app)
      .delete('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id));

    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const res = await request(app)
      .get('/api/addons/atlas/regions')
      .set('Cookie', authCookie(user.id));

    const deRegions = res.body.regions['DE'] as any[] | undefined;
    const codes = (deRegions || []).map((r: any) => r.code);
    expect(codes).not.toContain('DE-NW');
  });

  it('ATLAS-011 — unmark last region in country also unmarks the parent country', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    await request(app)
      .delete('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id));

    const stats = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));

    const codes = (stats.body.countries as any[]).map((c: any) => c.code);
    expect(codes).not.toContain('DE');
  });

  it('ATLAS-011 — unmark one region keeps country when another region remains', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    await request(app)
      .post('/api/addons/atlas/region/DE-BY/mark')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Bayern', country_code: 'DE' });

    await request(app)
      .delete('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user.id));

    const stats = await request(app)
      .get('/api/addons/atlas/stats')
      .set('Cookie', authCookie(user.id));

    const codes = (stats.body.countries as any[]).map((c: any) => c.code);
    expect(codes).toContain('DE');
  });

  it('ATLAS-011 — regions are isolated between users', async () => {
    const { user: user1 } = createUser(testDb);
    const { user: user2 } = createUser(testDb);

    await request(app)
      .post('/api/addons/atlas/region/DE-NW/mark')
      .set('Cookie', authCookie(user1.id))
      .send({ name: 'Nordrhein-Westfalen', country_code: 'DE' });

    const res = await request(app)
      .get('/api/addons/atlas/regions')
      .set('Cookie', authCookie(user2.id));

    expect(res.status).toBe(200);
    const deRegions = res.body.regions['DE'] as any[] | undefined;
    expect(deRegions).toBeUndefined();
  });
});

describe('Regions geo', () => {
  it('ATLAS-012 — GET /regions/geo without countries param returns empty FeatureCollection', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/addons/atlas/regions/geo')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('ATLAS-013 — GET /regions/geo?countries=DE,FR returns FeatureCollection', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/addons/atlas/regions/geo?countries=DE,FR')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('type', 'FeatureCollection');
  });
});

describe('A place that moves takes its Atlas country with it (#2527)', () => {
  // The region cache is filled by a background task that GET /regions only starts,
  // so wait for the row the way the next Atlas load would find it.
  async function regionRowOf(placeId: number): Promise<{ country_code: string; region_code: string } | undefined> {
    for (let i = 0; i < 100; i++) {
      const row = testDb.prepare('SELECT country_code, region_code FROM place_regions WHERE place_id = ?').get(placeId) as
        | { country_code: string; region_code: string }
        | undefined;
      if (row) return row;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return undefined;
  }

  async function atlasCountries(userId: number): Promise<string[]> {
    const res = await request(app).get('/api/addons/atlas/stats').set('Cookie', authCookie(userId));
    expect(res.status).toBe(200);
    return (res.body.countries as { code: string }[]).map((c) => c.code);
  }

  it('ATLAS-015: correcting a place from France to Germany moves it on the Atlas', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Wrongly imported', start_date: '2025-05-01', end_date: '2025-05-05' });
    const place = testDb
      .prepare('INSERT INTO places (trip_id, name, lat, lng, address) VALUES (?, ?, ?, ?, ?) RETURNING id')
      .get(trip.id, 'Hotel', 48.8566, 2.3522, 'Rue de Rivoli, Paris, France') as { id: number };

    // The place is seen on the Atlas once, which caches France for it.
    await request(app).get('/api/addons/atlas/regions').set('Cookie', authCookie(user.id));
    expect((await regionRowOf(place.id))?.country_code).toBe('FR');
    expect(await atlasCountries(user.id)).toEqual(['FR']);

    // The user fixes the location in the trip.
    const put = await request(app)
      .put(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ lat: 52.5163, lng: 13.3777, address: 'Pariser Platz, Berlin, Germany' });
    expect(put.status).toBe(200);

    expect(await atlasCountries(user.id)).toEqual(['DE']);

    // And the regions follow on the next load, with nothing left in France.
    await request(app).get('/api/addons/atlas/regions').set('Cookie', authCookie(user.id));
    expect((await regionRowOf(place.id))?.country_code).toBe('DE');
    const regions = await request(app).get('/api/addons/atlas/regions').set('Cookie', authCookie(user.id));
    expect(Object.keys(regions.body.regions)).toEqual(['DE']);
    expect(await atlasCountries(user.id)).toEqual(['DE']);
  });

  it('ATLAS-015: an edit that leaves the location alone keeps the cached country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris', start_date: '2025-05-01', end_date: '2025-05-05' });
    const place = testDb
      .prepare('INSERT INTO places (trip_id, name, lat, lng, address) VALUES (?, ?, ?, ?, ?) RETURNING id')
      .get(trip.id, 'Louvre', 48.8606, 2.3376, 'Rue de Rivoli, Paris, France') as { id: number };
    await request(app).get('/api/addons/atlas/regions').set('Cookie', authCookie(user.id));
    const cached = await regionRowOf(place.id);
    expect(cached?.country_code).toBe('FR');

    // The place editor sends the whole form back, location included, for a notes edit.
    const put = await request(app)
      .put(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ notes: 'Closed on Tuesdays', lat: 48.8606, lng: 2.3376, address: 'Rue de Rivoli, Paris, France' });
    expect(put.status).toBe(200);

    expect(testDb.prepare('SELECT country_code, region_code FROM place_regions WHERE place_id = ?').get(place.id)).toEqual(cached);
  });
});
