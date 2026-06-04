/**
 * Immich integration tests.
 * Covers IMMICH-001 to IMMICH-024 (settings, SSRF protection, album links).
 *
 * External Immich API calls are not made — tests focus on settings persistence
 * and input validation.
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

// Mock SSRF guard: block loopback and private IPs, allow external hostnames without DNS.
vi.mock('../../src/utils/ssrfGuard', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/ssrfGuard')>('../../src/utils/ssrfGuard');
  return {
    ...actual,
    checkSsrf: vi.fn().mockImplementation(async (rawUrl: string) => {
      try {
        const url = new URL(rawUrl);
        const h = url.hostname;
        if (h === '127.0.0.1' || h === '::1' || h === 'localhost') {
          return { allowed: false, isPrivate: true, error: 'Requests to loopback addresses are not allowed' };
        }
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
          return { allowed: false, isPrivate: true, error: 'Requests to private network addresses are not allowed' };
        }
        return { allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' };
      } catch {
        return { allowed: false, isPrivate: false, error: 'Invalid URL' };
      }
    }),
    safeFetch: vi.fn().mockRejectedValue(new Error('safeFetch should not be called in unit tests')),
  };
});

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Immich settings', () => {
  it('IMMICH-001 — GET /api/integrations/memories/immich/settings returns current settings', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    // Settings may be empty initially
    expect(res.body).toBeDefined();
  });

  it('IMMICH-001 — PUT /api/integrations/memories/immich/settings saves Immich URL and API key', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'https://immich.example.com', immich_api_key: 'test-api-key' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('IMMICH-002 — PUT /api/integrations/memories/immich/settings with private IP is blocked by SSRF guard', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'http://192.168.1.100', immich_api_key: 'test-key' });
    expect(res.status).toBe(400);
  });

  it('IMMICH-002 — PUT /api/integrations/memories/immich/settings with loopback is blocked', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .set('Cookie', authCookie(user.id))
      .send({ immich_url: 'http://127.0.0.1:2283', immich_api_key: 'test-key' });
    expect(res.status).toBe(400);
  });
});

describe('Immich authentication', () => {
  it('GET /api/integrations/memories/immich/settings without auth returns 401', async () => {
    const res = await request(app).get('/api/integrations/memories/immich/settings');
    expect(res.status).toBe(401);
  });

  it('PUT /api/integrations/memories/immich/settings without auth returns 401', async () => {
    const res = await request(app)
      .put('/api/integrations/memories/immich/settings')
      .send({ url: 'https://example.com', api_key: 'key' });
    expect(res.status).toBe(401);
  });
});

describe('Immich album links', () => {
  it('IMMICH-020 — POST album-links creates a link', async () => {
    const { user } = createUser(testDb);
    const trip = testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?) RETURNING *').get(user.id, 'Test Trip') as any;

    const res = await request(app)
      .post(`/api/integrations/memories/unified/trips/${trip.id}/album-links`)
      .set('Cookie', authCookie(user.id))
      .send({ album_id: 'album-uuid-123', album_name: 'Vacation 2024', provider: 'immich' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const link = testDb.prepare('SELECT * FROM trip_album_links WHERE trip_id = ? AND user_id = ?').get(trip.id, user.id) as any;
    expect(link).toBeDefined();
    expect(link.album_id).toBe('album-uuid-123');
    expect(link.album_name).toBe('Vacation 2024');
  });

  it('IMMICH-021 — GET album-links returns linked albums', async () => {
    const { user } = createUser(testDb);
    const trip = testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?) RETURNING *').get(user.id, 'Test Trip') as any;
    testDb.prepare('INSERT INTO trip_album_links (trip_id, user_id, album_id, album_name, provider) VALUES (?, ?, ?, ?, ?)').run(trip.id, user.id, 'album-abc', 'My Album', 'immich');

    const res = await request(app)
      .get(`/api/integrations/memories/unified/trips/${trip.id}/album-links`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.links).toBeDefined();
    expect(res.body.links.length).toBe(1);
    expect(res.body.links[0].album_id).toBe('album-abc');
  });

  it('IMMICH-022 — DELETE album-links removes associated photos but not individually-added ones', async () => {
    const { user } = createUser(testDb);
    const trip = testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?) RETURNING *').get(user.id, 'Test Trip') as any;

    // Create album link
    const linkResult = testDb.prepare('INSERT INTO trip_album_links (trip_id, user_id, album_id, album_name, provider) VALUES (?, ?, ?, ?, ?) RETURNING *')
      .get(trip.id, user.id, 'album-xyz', 'Album XYZ', 'immich') as any;

    // Insert photos synced from the album
    for (const assetId of ['asset-001', 'asset-002']) {
      testDb.prepare('INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)').run('immich', assetId, user.id);
      const tkp = testDb.prepare('SELECT id FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?').get('immich', assetId, user.id) as any;
      testDb.prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared, album_link_id) VALUES (?, ?, ?, 1, ?)').run(trip.id, user.id, tkp.id, linkResult.id);
    }

    // Insert an individually-added photo (no album_link_id)
    testDb.prepare('INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)').run('immich', 'asset-manual', user.id);
    const tkpManual = testDb.prepare('SELECT id FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?').get('immich', 'asset-manual', user.id) as any;
    testDb.prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)').run(trip.id, user.id, tkpManual.id);

    const res = await request(app)
      .delete(`/api/integrations/memories/unified/trips/${trip.id}/album-links/${linkResult.id}`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Album-linked photos should be gone
    const remainingPhotos = testDb.prepare(`
      SELECT tp.*, tkp.asset_id FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ?
    `).all(trip.id) as any[];
    expect(remainingPhotos.length).toBe(1);
    expect(remainingPhotos[0].asset_id).toBe('asset-manual');

    // Album link itself should be gone
    const link = testDb.prepare('SELECT * FROM trip_album_links WHERE id = ?').get(linkResult.id);
    expect(link).toBeUndefined();
  });

  it('IMMICH-023 — DELETE album-link by non-member returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?) RETURNING *').get(owner.id, 'Test Trip') as any;

    const linkResult = testDb.prepare('INSERT INTO trip_album_links (trip_id, user_id, album_id, album_name, provider) VALUES (?, ?, ?, ?, ?) RETURNING *')
      .get(trip.id, owner.id, 'album-secret', 'Secret Album', 'immich') as any;
    testDb.prepare('INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)').run('immich', 'asset-owned', owner.id);
    const tkpOwned = testDb.prepare('SELECT id FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?').get('immich', 'asset-owned', owner.id) as any;
    testDb.prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared, album_link_id) VALUES (?, ?, ?, 1, ?)').run(trip.id, owner.id, tkpOwned.id, linkResult.id);

    // Non-member tries to delete owner's album link — should be denied
    const res = await request(app)
      .delete(`/api/integrations/memories/unified/trips/${trip.id}/album-links/${linkResult.id}`)
      .set('Cookie', authCookie(other.id));

    expect(res.status).toBe(404);

    // Link and photos should still exist
    const link = testDb.prepare('SELECT * FROM trip_album_links WHERE id = ?').get(linkResult.id);
    expect(link).toBeDefined();
    const photo = testDb.prepare(`
      SELECT tp.* FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tkp.asset_id = ?
    `).get('asset-owned');
    expect(photo).toBeDefined();
  });

  it('IMMICH-024 — DELETE album-link without auth returns 401', async () => {
    const res = await request(app).delete('/api/integrations/memories/unified/trips/1/album-links/1');
    expect(res.status).toBe(401);
  });
});
