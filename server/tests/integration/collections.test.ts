/**
 * Collections upload integration tests (COLL-P01…P05).
 *
 * Cover + place-image upload parity, written BEFORE the storage-upload swap:
 * statuses, bodies, on-disk layout — including the cover filter's plain-Error
 * 500 quirk (shared with the trip cover config) and the place-image filter's
 * statusCode-400 contract.
 */
import { buildApp } from '../../src/bootstrap';
import { runMigrations } from '../../src/db/migrations';
import { createTables } from '../../src/db/schema';
import { authCookie } from '../helpers/auth';
import { createUser } from '../helpers/factories';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

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
    canAccessTrip: (tripId: any, userId: number) =>
      db
        .prepare(
          `SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`,
        )
        .get(userId, tripId, userId),
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
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

let nestApp: INestApplication;
let app: Application;
const FIXTURE_IMG = path.join(__dirname, '../fixtures/small-image.jpg');
const coversDir = path.join(__dirname, '../../uploads/covers');
const placesDir = path.join(__dirname, '../../uploads/places');

function createCollection(ownerId: number): number {
  return Number(
    testDb.prepare("INSERT INTO collections (owner_id, name) VALUES (?, 'C')").run(ownerId).lastInsertRowid,
  );
}

function createCollectionPlace(collectionId: number, ownerId: number): number {
  return Number(
    testDb
      .prepare("INSERT INTO collection_places (collection_id, owner_id, name) VALUES (?, ?, 'P')")
      .run(collectionId, ownerId).lastInsertRowid,
  );
}

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  // Enable the collections addon (the controller sits behind AddonGuard).
  testDb
    .prepare(
      "INSERT OR REPLACE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES ('collections', 'Collections', 'Saved places', 'global', 'Bookmark', 1, 40)",
    )
    .run();
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
  fs.rmSync(coversDir, { recursive: true, force: true });
  fs.rmSync(placesDir, { recursive: true, force: true });
});

describe('Collection cover upload', () => {
  it('COLL-P01 — cover upload stores /uploads/covers/<uuid> and writes the file', async () => {
    const { user } = createUser(testDb);
    const collectionId = createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id))
      .attach('cover', FIXTURE_IMG, 'cover.png');
    expect(res.status).toBe(201);
    expect(res.body.cover_image).toMatch(/^\/uploads\/covers\/[0-9a-f-]{36}\.png$/);
    const diskName = res.body.cover_image.replace('/uploads/covers/', '');
    expect(fs.existsSync(path.join(coversDir, diskName))).toBe(true);
  });

  it('COLL-P02 — no file → 400 "No image uploaded"', async () => {
    const { user } = createUser(testDb);
    const collectionId = createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No image uploaded');
  });

  it('COLL-P03 — non-image cover is 500 (plain-Error filter quirk — pinned, do not "fix")', async () => {
    const { user } = createUser(testDb);
    const collectionId = createCollection(user.id);

    const res = await request(app)
      .post(`/api/addons/collections/${collectionId}/cover`)
      .set('Cookie', authCookie(user.id))
      .attach('cover', Buffer.from('plain text'), { filename: 'doc.txt', contentType: 'text/plain' });
    expect(res.status).toBe(500);
  });
});

describe('Collection place image upload', () => {
  it('COLL-P04 — place image upload stores /uploads/places/<uuid> and writes the file', async () => {
    const { user } = createUser(testDb);
    const collectionId = createCollection(user.id);
    const placeId = createCollectionPlace(collectionId, user.id);

    const res = await request(app)
      .post(`/api/addons/collections/places/${placeId}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', FIXTURE_IMG, 'photo.jpg');
    expect(res.status).toBe(200);
    expect(res.body.image_url).toMatch(/^\/uploads\/places\/[0-9a-f-]{36}\.jpg$/);
    const diskName = res.body.image_url.replace('/uploads/places/', '');
    expect(fs.existsSync(path.join(placesDir, diskName))).toBe(true);
  });

  it('COLL-P05 — non-image place upload is 400 with the bespoke message', async () => {
    const { user } = createUser(testDb);
    const collectionId = createCollection(user.id);
    const placeId = createCollectionPlace(collectionId, user.id);

    const res = await request(app)
      .post(`/api/addons/collections/places/${placeId}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only jpg, png, gif, webp images allowed');
  });
});
