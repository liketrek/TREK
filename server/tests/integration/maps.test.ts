/**
 * Maps integration tests.
 * Covers MAPS-001 to MAPS-008.
 *
 * External API calls (Nominatim, Google Places, Wikipedia) are tested at the
 * input validation level. Full integration tests would require live external APIs.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
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

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { MapsService } from '../../src/nest/maps/maps.service';

let nestApp: INestApplication;
let app: Application;
// Instance spies on the container's MapsService (permissions-migration
// precedent) — the DI fold made the provider methods the outbound seam.
// Defaults mirror the old module mock: bare resolves, except
// resolveGoogleMapsUrl which rejects with 400 (SSRF-like behaviour for URLs
// that look internal); individual tests override with mockResolvedValueOnce.
let mapsService: {
  searchPlaces: ReturnType<typeof vi.spyOn>;
  autocompletePlaces: ReturnType<typeof vi.spyOn>;
  getPlaceDetails: ReturnType<typeof vi.spyOn>;
  getPlacePhoto: ReturnType<typeof vi.spyOn>;
  reverseGeocode: ReturnType<typeof vi.spyOn>;
  resolveGoogleMapsUrl: ReturnType<typeof vi.spyOn>;
};

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  const maps = nestApp.get(MapsService);
  mapsService = {
    searchPlaces: vi.spyOn(maps, 'searchPlaces').mockResolvedValue(undefined as never),
    autocompletePlaces: vi.spyOn(maps, 'autocompletePlaces').mockResolvedValue(undefined as never),
    getPlaceDetails: vi.spyOn(maps, 'getPlaceDetails').mockResolvedValue(undefined as never),
    getPlacePhoto: vi.spyOn(maps, 'getPlacePhoto').mockResolvedValue(undefined as never),
    reverseGeocode: vi.spyOn(maps, 'reverseGeocode').mockResolvedValue(undefined as never),
    resolveGoogleMapsUrl: vi.spyOn(maps, 'resolveGoogleMapsUrl').mockRejectedValue(
      Object.assign(new Error('SSRF or invalid URL'), { status: 400 }),
    ),
  };
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Maps authentication', () => {
  it('POST /maps/search without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/maps/search')
      .send({ query: 'Paris' });
    expect(res.status).toBe(401);
  });

  it('GET /maps/reverse without auth returns 401', async () => {
    const res = await request(app)
      .get('/api/maps/reverse?lat=48.8566&lng=2.3522');
    expect(res.status).toBe(401);
  });
});

describe('Maps validation', () => {
  it('MAPS-001 — POST /maps/search without query returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/search')
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
  });

  it('MAPS-006 — GET /maps/reverse without lat/lng returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/maps/reverse')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(400);
  });

  it('MAPS-007 — POST /maps/resolve-url without url returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/resolve-url')
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('Maps SSRF protection', () => {
  it('MAPS-007 — POST /maps/resolve-url with internal IP is blocked', async () => {
    const { user } = createUser(testDb);

    // SSRF: should be blocked by ssrfGuard
    const res = await request(app)
      .post('/api/maps/resolve-url')
      .set('Cookie', authCookie(user.id))
      .send({ url: 'http://192.168.1.1/admin' });
    expect(res.status).toBe(400);
  });

  it('MAPS-007 — POST /maps/resolve-url with loopback IP is blocked', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/resolve-url')
      .set('Cookie', authCookie(user.id))
      .send({ url: 'http://127.0.0.1/secret' });
    expect(res.status).toBe(400);
  });
});

describe('Maps happy paths (mocked service)', () => {
  it('MAPS-002 — POST /maps/search returns results from service', async () => {
    const { user } = createUser(testDb);
    mapsService.searchPlaces.mockResolvedValueOnce({
      results: [{ address: 'Paris, France', source: 'nominatim' }],
    } as any);

    const res = await request(app)
      .post('/api/maps/search')
      .set('Cookie', authCookie(user.id))
      .send({ query: 'Paris' });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].address).toBe('Paris, France');
  });

  it('MAPS-003 — GET /maps/details/:placeId returns place details', async () => {
    const { user } = createUser(testDb);
    mapsService.getPlaceDetails.mockResolvedValueOnce({
      name: 'Eiffel Tower',
      address: 'Champ de Mars, Paris',
    } as any);

    const res = await request(app)
      .get('/api/maps/details/ChIJLU7jZClu5kcR4PcOOO6p3I0')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Eiffel Tower');
  });

  it('MAPS-004 — GET /maps/place-photo/:placeId returns photo url', async () => {
    const { user } = createUser(testDb);
    mapsService.getPlacePhoto.mockResolvedValueOnce({
      url: 'https://example.com/photo.jpg',
      source: 'wikimedia',
    } as any);

    const res = await request(app)
      .get('/api/maps/place-photo/ChIJLU7jZClu5kcR4PcOOO6p3I0?lat=48.8584&lng=2.2945')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/photo.jpg');
  });

  it('MAPS-005 — GET /maps/reverse returns geocoded location', async () => {
    const { user } = createUser(testDb);
    mapsService.reverseGeocode.mockResolvedValueOnce({
      name: 'Eiffel Tower',
      address: 'Champ de Mars, Paris',
    } as any);

    const res = await request(app)
      .get('/api/maps/reverse?lat=48.8584&lng=2.2945')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Eiffel Tower');
  });

  it('MAPS-008 — POST /maps/resolve-url returns extracted coordinates', async () => {
    const { user } = createUser(testDb);
    mapsService.resolveGoogleMapsUrl.mockResolvedValueOnce({
      lat: 48.8584,
      lng: 2.2945,
    } as any);

    const res = await request(app)
      .post('/api/maps/resolve-url')
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://maps.google.com/place/eiffel-tower' });

    expect(res.status).toBe(200);
    expect(res.body.lat).toBe(48.8584);
    expect(res.body.lng).toBe(2.2945);
  });

  it('MAPS-002 — search service error propagates correct status', async () => {
    const { user } = createUser(testDb);
    const err = Object.assign(new Error('No API key'), { status: 503 });
    mapsService.searchPlaces.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/maps/search')
      .set('Cookie', authCookie(user.id))
      .send({ query: 'Anywhere' });

    expect(res.status).toBe(503);
  });

  it('MAPS-003 — getPlaceDetails error returns 500', async () => {
    const { user } = createUser(testDb);
    mapsService.getPlaceDetails.mockRejectedValueOnce(new Error('External API failure'));

    const res = await request(app)
      .get('/api/maps/details/some-place-id')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('MAPS-004 — getPlacePhoto error with status returns that status', async () => {
    const { user } = createUser(testDb);
    mapsService.getPlacePhoto.mockRejectedValueOnce(
      Object.assign(new Error('Photo provider unavailable'), { status: 503 })
    );

    const res = await request(app)
      .get('/api/maps/place-photo/some-place-id?lat=48.8&lng=2.3')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error');
  });

  // A photo-less place must answer 200 { photoUrl: null }: one 404 per place turns
  // a normal itinerary render into a 404 storm that fail2ban/CrowdSec bans (#1727).
  it('MAPS-004b — a place with no photo answers 200 with photoUrl null', async () => {
    const { user } = createUser(testDb);
    mapsService.getPlacePhoto.mockResolvedValueOnce({ photoUrl: null, attribution: null });

    const res = await request(app)
      .get('/api/maps/place-photo/node%3A5255005321?lat=36.76&lng=-3.84&name=Nerja')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ photoUrl: null, attribution: null });
  });

  // Places keep the bytes URL in image_url, so an evicted cache entry means one
  // request per place on the next trip render — the second half of the same ban
  // vector. Nothing to serve is an empty 204, not a 404.
  it('MAPS-004c — the bytes proxy answers 204 for a photo that is not cached', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/maps/place-photo/ChIJnot-cached/bytes')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(204);
    expect(res.text).toBeFalsy();
  });

  it('MAPS-005 — reverseGeocode error returns null values', async () => {
    const { user } = createUser(testDb);
    mapsService.reverseGeocode.mockRejectedValueOnce(new Error('Geocode failed'));

    const res = await request(app)
      .get('/api/maps/reverse?lat=48.8584&lng=2.2945')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.name).toBeNull();
    expect(res.body.address).toBeNull();
  });
});

describe('Maps autocomplete', () => {
  it('MAPS-009 — POST /maps/autocomplete without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/maps/autocomplete')
      .send({ input: 'Paris' });
    expect(res.status).toBe(401);
  });

  it('MAPS-010 — POST /maps/autocomplete without input returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
  });

  it('MAPS-011 — POST /maps/autocomplete with non-string input returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 123 });
    expect(res.status).toBe(400);
  });

  it('MAPS-012 — POST /maps/autocomplete with invalid locationBias returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'Paris', locationBias: { low: { lat: NaN, lng: 2.3 }, high: { lat: 49, lng: 3 } } });
    expect(res.status).toBe(400);
  });

  it('MAPS-013 — POST /maps/autocomplete returns suggestions from service', async () => {
    const { user } = createUser(testDb);
    mapsService.autocompletePlaces.mockResolvedValueOnce({
      suggestions: [
        { placeId: 'ChIJ1234', mainText: 'Paris', secondaryText: 'France' },
      ],
      source: 'google',
    });

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'Paris' });

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(1);
    expect(res.body.suggestions[0].mainText).toBe('Paris');
    expect(res.body.source).toBe('google');
  });

  it('MAPS-014 — POST /maps/autocomplete passes lang and locationBias to service', async () => {
    const { user } = createUser(testDb);
    mapsService.autocompletePlaces.mockResolvedValueOnce({
      suggestions: [],
      source: 'google',
    });

    await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'test', lang: 'fr', locationBias: { low: { lat: 48.5, lng: 2.0 }, high: { lat: 49.0, lng: 2.8 } } });

    expect(mapsService.autocompletePlaces).toHaveBeenCalledWith(
      user.id,
      'test',
      'fr',
      { low: { lat: 48.5, lng: 2.0 }, high: { lat: 49.0, lng: 2.8 } },
      undefined,
    );
  });

  it('MAPS-015 — autocomplete service error propagates correct status', async () => {
    const { user } = createUser(testDb);
    const err = Object.assign(new Error('Rate limited'), { status: 429 });
    mapsService.autocompletePlaces.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'test' });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Rate limited');
  });

  it('MAPS-016 — autocomplete service error without status returns 500', async () => {
    const { user } = createUser(testDb);
    mapsService.autocompletePlaces.mockRejectedValueOnce(new Error('Unknown'));

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'test' });

    expect(res.status).toBe(500);
  });

  it('MAPS-017 — POST /maps/autocomplete with input > 200 chars returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/maps/autocomplete')
      .set('Cookie', authCookie(user.id))
      .send({ input: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    // Wording pinned in maps.controller.test.ts (see the e2e suite's note).
    expect(res.body).toHaveProperty('error');
  });
});
