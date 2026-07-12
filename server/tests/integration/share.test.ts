/**
 * Share link integration tests.
 * Covers SHARE-001 to SHARE-009.
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
import { createUser, createTrip, addTripMember, createDay, createPlace, createDayAssignment, createDayNote } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import * as placePhotoCache from '../../src/services/placePhotoCache';
import fs from 'node:fs';

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

describe('Share link CRUD', () => {
  it('SHARE-001 — POST creates share link with default permissions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  it('SHARE-002 — POST creates share link with custom permissions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: false, share_packing: true });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('SHARE-003 — POST again updates share link permissions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const first = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: true });

    const second = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: false });
    // Same token (update, not create)
    expect(second.body.token).toBe(first.body.token);
  });

  it('SHARE-004 — GET returns share link status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});

    const res = await request(app)
      .get(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('SHARE-004 — GET returns null token when no share link exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.token).toBeNull();
  });

  it('SHARE-005 — DELETE removes share link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const status = await request(app)
      .get(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id));
    expect(status.body.token).toBeNull();
  });
});

describe('Shared trip access', () => {
  it('SHARE-006 — GET /shared/:token returns trip data with all sections', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Adventure' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: true, share_packing: true });
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.trip).toBeDefined();
    expect(res.body.trip.title).toBe('Paris Adventure');
  });

  it('SHARE-007 — GET /shared/:token hides budget when share_budget=false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: false });
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    // Budget should be an empty array when share_budget is false
    expect(Array.isArray(res.body.budget)).toBe(true);
    expect(res.body.budget).toHaveLength(0);
  });

  // Regression: a co-member's private packing item (#858) must never reach a public share.
  it('SHARE-026 — hides private packing items from the public payload', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, category, checked, is_private, owner_id) VALUES (?, 'Private thing', 'Misc', 0, 1, ?)").run(trip.id, user.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, category, checked, is_private, owner_id) VALUES (?, 'Common thing', 'Misc', 0, 0, ?)").run(trip.id, user.id);
    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_packing: true });
    const res = await request(app).get(`/api/shared/${create.body.token}`);
    expect(res.status).toBe(200);
    const names = (res.body.packing || []).map((p: any) => p.name);
    expect(names).toContain('Common thing');
    expect(names).not.toContain('Private thing');
  });

  // Regression — GHSA-9hc8-p7gm-p7mx: share_map must be enforced server-side, not
  // just hidden in the client. When the owner disables the map, the itinerary and
  // every place (with coordinates) must be withheld from the public payload.
  it('SHARE-024 — hides itinerary and places when share_map=false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Secret Route' });
    const day = createDay(testDb, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb, trip.id, { name: 'Safehouse', lat: 12.3456, lng: 65.4321 });
    createDayAssignment(testDb, day.id, place.id);
    createDayNote(testDb, day.id, trip.id, { text: 'Do not share' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_map: false, share_packing: true });
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.permissions.share_map).toBe(false);
    // Itinerary + place data withheld…
    expect(res.body.days).toHaveLength(0);
    expect(res.body.places).toHaveLength(0);
    expect(res.body.assignments).toEqual({});
    expect(res.body.dayNotes).toEqual({});
    // …and the coordinates never appear anywhere in the response.
    expect(JSON.stringify(res.body)).not.toContain('12.3456');
    expect(JSON.stringify(res.body)).not.toContain('65.4321');
  });

  it('SHARE-008 — GET /shared/:invalid-token returns 404', async () => {
    const res = await request(app).get('/api/shared/invalid-token-xyz');
    expect(res.status).toBe(404);
  });

  it('SHARE-009 — non-member cannot create share link', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(other.id))
      .send({});
    expect(res.status).toBe(404);
  });
});

describe('Shared trip — day assignments and notes', () => {
  it('SHARE-010 — shared trip with days and assignments includes place data in assignments', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome Trip' });
    const day = createDay(testDb, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb, trip.id, { name: 'Colosseum', lat: 41.89, lng: 12.49 });
    createDayAssignment(testDb, day.id, place.id, { notes: 'Amazing site' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(1);
    const dayAssignments = res.body.assignments[day.id];
    expect(Array.isArray(dayAssignments)).toBe(true);
    expect(dayAssignments).toHaveLength(1);
    expect(dayAssignments[0].place.name).toBe('Colosseum');
    expect(dayAssignments[0].place.lat).toBe(41.89);
  });

  it('SHARE-011 — shared trip with day notes includes notes in response', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Notes Trip' });
    const day = createDay(testDb, trip.id, { date: '2025-07-01' });
    createDayNote(testDb, day.id, trip.id, { text: 'Meet at the station' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    const dayNotes = res.body.dayNotes[day.id];
    expect(Array.isArray(dayNotes)).toBe(true);
    expect(dayNotes).toHaveLength(1);
    expect(dayNotes[0].text).toBe('Meet at the station');
  });

  it('SHARE-012 — share_collab=true includes collab messages in response', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO collab_messages (trip_id, user_id, text, deleted) VALUES (?, ?, ?, 0)').run(trip.id, user.id, 'Hello team!');

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_collab: true });
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.collab)).toBe(true);
    expect(res.body.collab).toHaveLength(1);
    expect(res.body.collab[0].text).toBe('Hello team!');
  });

  it('SHARE-013 — assignments empty when days have no assignments', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id, { date: '2025-08-01' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});
    const token = create.body.token;

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(1);
    expect(res.body.assignments).toEqual({});
  });
});

describe('Shared trip — ordering parity (issue #981)', () => {
  it('SHARE-014 — assignments with same order_index are ordered by created_at (tiebreaker)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2025-09-01' });
    const place1 = createPlace(testDb, trip.id, { name: 'First Created' });
    const place2 = createPlace(testDb, trip.id, { name: 'Second Created' });

    // Both with order_index = 0 (schema default) but different created_at
    testDb.prepare(
      "INSERT INTO day_assignments (day_id, place_id, order_index, created_at) VALUES (?, ?, 0, '2025-01-01T10:00:00')"
    ).run(day.id, place1.id);
    testDb.prepare(
      "INSERT INTO day_assignments (day_id, place_id, order_index, created_at) VALUES (?, ?, 0, '2025-01-01T11:00:00')"
    ).run(day.id, place2.id);

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    const assignments = res.body.assignments[day.id];
    expect(assignments).toHaveLength(2);
    expect(assignments[0].place.name).toBe('First Created');
    expect(assignments[1].place.name).toBe('Second Created');
  });

  it('SHARE-015 — reservations include day_positions map from reservation_day_positions table', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2025-09-01' });

    const res1 = testDb.prepare(
      "INSERT INTO reservations (trip_id, title, type, day_id, reservation_time) VALUES (?, ?, ?, ?, ?)"
    ).run(trip.id, 'Test Flight', 'flight', day.id, '2025-09-01T09:00:00');
    const reservationId = Number(res1.lastInsertRowid);

    // Insert a per-day position
    testDb.prepare(
      'INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)'
    ).run(reservationId, day.id, 1.5);

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_bookings: true });

    const shareRes = await request(app).get(`/api/shared/${token}`);
    expect(shareRes.status).toBe(200);
    const reservation = shareRes.body.reservations.find((r: any) => r.id === reservationId);
    expect(reservation).toBeDefined();
    expect(reservation.day_positions).toBeDefined();
    expect(reservation.day_positions[day.id]).toBe(1.5);
  });
});

describe('Shared trip — display currency (issue #1361)', () => {
  it('SHARE-021 — baseCurrency resolves from the share owner\'s default_currency setting', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Trip keeps the EUR default; the owner's Costs display currency is CAD.
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'default_currency', ?)")
      .run(user.id, JSON.stringify('CAD'));

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: true });

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.baseCurrency).toBe('CAD');
  });

  it('SHARE-022 — baseCurrency falls back to the trip currency when the owner has no setting', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('UPDATE trips SET currency = ? WHERE id = ?').run('GBP', trip.id);

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: true });

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.baseCurrency).toBe('GBP');
  });

  it('SHARE-023 — baseCurrency uses the admin instance default when the owner has no per-user setting', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id); // EUR trip default, no user setting
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('default_user_setting_default_currency', ?)")
      .run(JSON.stringify('USD'));

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_budget: true });

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.baseCurrency).toBe('USD');
  });
});

describe('Shared trip — place photos in shared links (issue #1100)', () => {
  const PLACE_ID = 'ChIJsharedPhoto1100';
  const PROXY_URL = `/api/maps/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`;
  const photoBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  let cachedFilePath: string;

  afterAll(() => { try { if (cachedFilePath) fs.unlinkSync(cachedFilePath); } catch { /* ignore */ } });

  async function setupSharedPlaceWithPhoto() {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Photo Place' });
    testDb.prepare('UPDATE places SET image_url = ?, google_place_id = ? WHERE id = ?').run(PROXY_URL, PLACE_ID, place.id);

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});
    return { token, place };
  }

  it('SHARE-016 — shared payload rewrites place image_url to the public token-scoped proxy', async () => {
    const { token } = await setupSharedPlaceWithPhoto();
    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    const place = res.body.places.find((p: any) => p.image_url);
    expect(place.image_url).toBe(`/api/shared/${token}/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`);
    expect(place.image_url.startsWith('/api/maps/')).toBe(false);
  });

  it('SHARE-017 — shared payload rewrites assignment place image_url too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2025-10-01' });
    const place = createPlace(testDb, trip.id, { name: 'Assigned Photo Place' });
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run(PROXY_URL, place.id);
    createDayAssignment(testDb, day.id, place.id, {});

    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({});

    const res = await request(app).get(`/api/shared/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.assignments[day.id][0].place.image_url)
      .toBe(`/api/shared/${token}/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`);
  });

  it('SHARE-018 — public proxy streams cached bytes for a valid token + place (no cookie)', async () => {
    const { token } = await setupSharedPlaceWithPhoto();
    const cached = await placePhotoCache.put(PLACE_ID, photoBytes, null);
    cachedFilePath = cached.filePath;

    const res = await request(app).get(`/api/shared/${token}/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(Buffer.from(res.body)).toEqual(photoBytes);
  });

  it('SHARE-019 — public proxy 404s for a placeId not in the shared trip', async () => {
    const { token } = await setupSharedPlaceWithPhoto();
    const res = await request(app).get(`/api/shared/${token}/place-photo/ChIJnotInTrip/bytes`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Photo not cached' });
  });

  it('SHARE-020 — public proxy 404s for an invalid token', async () => {
    await setupSharedPlaceWithPhoto();
    const res = await request(app).get(`/api/shared/bad-token/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Photo not cached' });
  });

  // Regression — GHSA-9hc8 sibling: place photos are part of the map/itinerary,
  // so the proxy must 404 when the owner disabled the map, even with a valid
  // token + cached bytes.
  it('SHARE-025 — public place-photo proxy 404s when share_map=false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Hidden Photo Place' });
    testDb.prepare('UPDATE places SET image_url = ?, google_place_id = ? WHERE id = ?').run(PROXY_URL, PLACE_ID, place.id);
    const { body: { token } } = await request(app)
      .post(`/api/trips/${trip.id}/share-link`)
      .set('Cookie', authCookie(user.id))
      .send({ share_map: false });
    const cached = await placePhotoCache.put(PLACE_ID, photoBytes, null);
    cachedFilePath = cached.filePath;

    const res = await request(app).get(`/api/shared/${token}/place-photo/${encodeURIComponent(PLACE_ID)}/bytes`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Photo not cached' });
  });
});
