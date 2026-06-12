/**
 * Unified Memories integration tests (UNIFIED-001 – UNIFIED-020).
 * Covers the provider-agnostic /unified/trips/:tripId/photos and
 * /unified/trips/:tripId/album-links routes.
 *
 * No real HTTP is made — safeFetch is mocked to never be called.
 * The broadcast WebSocket call is no-op mocked.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

// ── Hoisted DB mock ──────────────────────────────────────────────────────────

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
    getPlaceWithTags: () => null,
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
vi.mock('../../src/utils/ssrfGuard', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/ssrfGuard')>('../../src/utils/ssrfGuard');
  return {
    ...actual,
    checkSsrf: vi.fn().mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' }),
    safeFetch: vi.fn().mockRejectedValue(new Error('safeFetch should not be called in unified tests')),
  };
});

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, addTripMember, addTripPhoto, addAlbumLink } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;

const BASE = '/api/integrations/memories/unified';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function photosUrl(tripId: number) { return `${BASE}/trips/${tripId}/photos`; }
function albumLinksUrl(tripId: number, linkId?: number) {
  return linkId ? `${BASE}/trips/${tripId}/album-links/${linkId}` : `${BASE}/trips/${tripId}/album-links`;
}

// ── Unified Photo Management ─────────────────────────────────────────────────

describe('Unified photo management', () => {
  it('UNIFIED-001 — GET photos lists own + shared photos from other members', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // owner has a private photo; member has a shared photo
    addTripPhoto(testDb, trip.id, owner.id, 'asset-own', 'immich', { shared: false });
    addTripPhoto(testDb, trip.id, member.id, 'asset-shared', 'immich', { shared: true });

    const res = await request(app)
      .get(photosUrl(trip.id))
      .set('Cookie', authCookie(owner.id));

    expect(res.status).toBe(200);
    const ids = (res.body.photos as any[]).map((p: any) => p.asset_id);
    expect(ids).toContain('asset-own');
    expect(ids).toContain('asset-shared');
  });

  it('UNIFIED-002 — GET photos excludes other members\' private photos', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    addTripPhoto(testDb, trip.id, member.id, 'asset-private', 'immich', { shared: false });

    const res = await request(app)
      .get(photosUrl(trip.id))
      .set('Cookie', authCookie(owner.id));

    expect(res.status).toBe(200);
    const ids = (res.body.photos as any[]).map((p: any) => p.asset_id);
    expect(ids).not.toContain('asset-private');
  });

  it('UNIFIED-003 — GET photos returns 404 for non-member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .get(photosUrl(trip.id))
      .set('Cookie', authCookie(stranger.id));

    expect(res.status).toBe(404);
  });

  it('UNIFIED-004 — POST photos adds photos from selections', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({
        shared: true,
        selections: [{ provider: 'immich', asset_ids: ['asset-a', 'asset-b'] }],
      });

    expect(res.status).toBe(200);
    expect(res.body.added).toBe(2);

    const rows = testDb.prepare(`
      SELECT tkp.asset_id FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ?
    `).all(trip.id) as any[];
    expect(rows.map((r: any) => r.asset_id)).toEqual(expect.arrayContaining(['asset-a', 'asset-b']));
  });

  it('UNIFIED-005 — POST photos with empty selections returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ selections: [] });

    expect(res.status).toBe(400);
  });

  it('UNIFIED-006 — POST photos with invalid provider returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ selections: [{ provider: 'nonexistent', asset_ids: ['asset-x'] }] });

    expect(res.status).toBe(400);
  });

  it('UNIFIED-007 — PUT photos/sharing toggles shared flag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, 'asset-tog', 'immich', { shared: false });
    const trekRef = testDb.prepare(`
      SELECT tp.photo_id FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ? AND tkp.asset_id = ?
    `).get(trip.id, 'asset-tog') as any;

    const res = await request(app)
      .put(`${photosUrl(trip.id)}/sharing`)
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: trekRef.photo_id, shared: true });

    expect(res.status).toBe(200);
    const row = testDb.prepare(`
      SELECT tp.shared FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tkp.asset_id = ?
    `).get('asset-tog') as any;
    expect(row.shared).toBe(1);
  });

  it('UNIFIED-008 — PUT photos/sharing on non-member trip returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .put(`${photosUrl(trip.id)}/sharing`)
      .set('Cookie', authCookie(stranger.id))
      .send({ provider: 'immich', asset_id: 'any', shared: true });

    expect(res.status).toBe(404);
  });

  it('UNIFIED-009 — DELETE photos removes own photo', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripPhoto(testDb, trip.id, user.id, 'asset-del', 'immich');
    const trekRef = testDb.prepare(`
      SELECT tp.photo_id FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tp.trip_id = ? AND tkp.asset_id = ?
    `).get(trip.id, 'asset-del') as any;

    const res = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ photo_id: trekRef.photo_id });

    expect(res.status).toBe(200);
    const row = testDb.prepare(`
      SELECT tp.* FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      WHERE tkp.asset_id = ?
    `).get('asset-del');
    expect(row).toBeUndefined();
  });

  it('UNIFIED-010 — DELETE photos on non-member trip returns 404', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .delete(photosUrl(trip.id))
      .set('Cookie', authCookie(stranger.id))
      .send({ provider: 'immich', asset_id: 'any' });

    expect(res.status).toBe(404);
  });
});

// ── Unified Album-Link Management ────────────────────────────────────────────

describe('Unified album-link management', () => {
  it('UNIFIED-011 — POST album-links with missing provider returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ album_id: 'album-abc', album_name: 'Test' }); // no provider

    expect(res.status).toBe(400);
  });

  it('UNIFIED-012 — POST album-links with missing album_id returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_name: 'Test' }); // no album_id

    expect(res.status).toBe(400);
  });

  it('UNIFIED-013 — POST album-links duplicate link returns 409', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_id: 'album-dup', album_name: 'Dup' });

    const res = await request(app)
      .post(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id))
      .send({ provider: 'immich', album_id: 'album-dup', album_name: 'Dup' });

    expect(res.status).toBe(409);
  });

  it('UNIFIED-014 — GET album-links only returns links for enabled providers', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addAlbumLink(testDb, trip.id, user.id, 'immich', 'album-enabled');

    // Disable the immich provider
    testDb.prepare('UPDATE photo_providers SET enabled = 0 WHERE id = ?').run('immich');

    const res = await request(app)
      .get(albumLinksUrl(trip.id))
      .set('Cookie', authCookie(user.id));

    // Re-enable for future tests
    testDb.prepare('UPDATE photo_providers SET enabled = 1 WHERE id = ?').run('immich');

    expect(res.status).toBe(400); // no providers enabled → error
  });
});

// ── Auth checks ───────────────────────────────────────────────────────────────

describe('Unified auth checks', () => {
  it('UNIFIED-020 — GET photos without auth returns 401', async () => {
    const res = await request(app).get(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — POST photos without auth returns 401', async () => {
    const res = await request(app).post(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — PUT photos/sharing without auth returns 401', async () => {
    const res = await request(app).put(`${BASE}/trips/1/photos/sharing`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — DELETE photos without auth returns 401', async () => {
    const res = await request(app).delete(`${BASE}/trips/1/photos`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — GET album-links without auth returns 401', async () => {
    const res = await request(app).get(`${BASE}/trips/1/album-links`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — POST album-links without auth returns 401', async () => {
    const res = await request(app).post(`${BASE}/trips/1/album-links`);
    expect(res.status).toBe(401);
  });

  it('UNIFIED-020 — DELETE album-links without auth returns 401', async () => {
    const res = await request(app).delete(`${BASE}/trips/1/album-links/1`);
    expect(res.status).toBe(401);
  });
});
