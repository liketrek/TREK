/**
 * Trip Files integration tests.
 * Covers FILE-001 to FILE-021.
 *
 * Notes:
 * - Tests use fixture files from tests/fixtures/
 * - File uploads create real files in uploads/files/ — tests clean up after themselves where possible
 * - FILE-009 (ephemeral token download) is covered via the /api/auth/resource-token endpoint
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import path from 'path';
import fs from 'fs';

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
import { createUser, createTrip, createReservation, createPlace, addTripMember } from '../helpers/factories';
import { authCookie, generateToken } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;
const FIXTURE_PDF = path.join(__dirname, '../fixtures/test.pdf');
const FIXTURE_IMG = path.join(__dirname, '../fixtures/small-image.jpg');

// Ensure uploads/files dir exists
const uploadsDir = path.join(__dirname, '../../uploads/files');

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  // Seed allowed_file_types to include common types (wildcard)
  testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_file_types', '*')").run();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  // Re-seed allowed_file_types after reset
  testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_file_types', '*')").run();
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

// Helper to upload a file and return the file object
async function uploadFile(tripId: number, userId: number, fixturePath = FIXTURE_PDF) {
  const res = await request(app)
    .post(`/api/trips/${tripId}/files`)
    .set('Cookie', authCookie(userId))
    .attach('file', fixturePath);
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload file
// ─────────────────────────────────────────────────────────────────────────────

describe('Upload file', () => {
  it('FILE-001 — POST uploads a file and returns file metadata', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    expect(res.status).toBe(201);
    expect(res.body.file).toBeDefined();
    expect(res.body.file.id).toBeDefined();
    expect(res.body.file.filename).toBeDefined();
  });

  it('FILE-002 — uploading a blocked extension (.svg) is rejected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Create a temp .svg file
    const svgPath = path.join(uploadsDir, 'test_blocked.svg');
    fs.writeFileSync(svgPath, '<svg></svg>');
    try {
      const res = await request(app)
        .post(`/api/trips/${trip.id}/files`)
        .set('Cookie', authCookie(user.id))
        .attach('file', svgPath);
      expect(res.status).toBe(400);
    } finally {
      if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
    }
  });

  it('FILE-021 — non-member cannot upload file', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/files`)
      .set('Cookie', authCookie(other.id))
      .attach('file', FIXTURE_PDF);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// List files
// ─────────────────────────────────────────────────────────────────────────────

describe('List files', () => {
  it('FILE-006 — GET returns all non-trashed files', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await uploadFile(trip.id, user.id, FIXTURE_PDF);
    await uploadFile(trip.id, user.id, FIXTURE_IMG);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/files`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.files.length).toBeGreaterThanOrEqual(2);
  });

  it('FILE-007 — GET ?trash=true returns only trashed files', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    // Soft-delete it
    await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}`)
      .set('Cookie', authCookie(user.id));

    const trash = await request(app)
      .get(`/api/trips/${trip.id}/files?trash=true`)
      .set('Cookie', authCookie(user.id));
    expect(trash.status).toBe(200);
    const trashIds = (trash.body.files as any[]).map((f: any) => f.id);
    expect(trashIds).toContain(fileId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Star / unstar
// ─────────────────────────────────────────────────────────────────────────────

describe('Star/unstar file', () => {
  it('FILE-011 — PATCH /:id/star toggles starred status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const res = await request(app)
      .patch(`/api/trips/${trip.id}/files/${fileId}/star`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.file.starred).toBe(1);

    // Toggle back
    const res2 = await request(app)
      .patch(`/api/trips/${trip.id}/files/${fileId}/star`)
      .set('Cookie', authCookie(user.id));
    expect(res2.body.file.starred).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Soft delete / restore / permanent delete
// ─────────────────────────────────────────────────────────────────────────────

describe('Soft delete, restore, permanent delete', () => {
  it('FILE-012 — DELETE moves file to trash', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    // Should not appear in normal list
    const list = await request(app)
      .get(`/api/trips/${trip.id}/files`)
      .set('Cookie', authCookie(user.id));
    const ids = (list.body.files as any[]).map((f: any) => f.id);
    expect(ids).not.toContain(fileId);
  });

  it('FILE-013 — POST /:id/restore restores from trash', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}`)
      .set('Cookie', authCookie(user.id));

    const restore = await request(app)
      .post(`/api/trips/${trip.id}/files/${fileId}/restore`)
      .set('Cookie', authCookie(user.id));
    expect(restore.status).toBe(200);
    expect(restore.body.file.id).toBe(fileId);
  });

  it('FILE-014 — DELETE /:id/permanent permanently deletes from trash', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}`)
      .set('Cookie', authCookie(user.id));

    const perm = await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}/permanent`)
      .set('Cookie', authCookie(user.id));
    expect(perm.status).toBe(200);
    expect(perm.body.success).toBe(true);
  });

  it('FILE-015 — DELETE /:id/permanent on non-trashed file returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    // Not trashed — should 404
    const res = await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}/permanent`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });

  it('FILE-016 — DELETE /trash/empty empties all trash', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const f1 = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const f2 = await uploadFile(trip.id, user.id, FIXTURE_IMG);

    await request(app).delete(`/api/trips/${trip.id}/files/${f1.body.file.id}`).set('Cookie', authCookie(user.id));
    await request(app).delete(`/api/trips/${trip.id}/files/${f2.body.file.id}`).set('Cookie', authCookie(user.id));

    const empty = await request(app)
      .delete(`/api/trips/${trip.id}/files/trash/empty`)
      .set('Cookie', authCookie(user.id));
    expect(empty.status).toBe(200);

    const trash = await request(app)
      .get(`/api/trips/${trip.id}/files?trash=true`)
      .set('Cookie', authCookie(user.id));
    expect(trash.body.files).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Update file metadata
// ─────────────────────────────────────────────────────────────────────────────

describe('Update file metadata', () => {
  it('FILE-017 — PUT updates description', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/files/${fileId}`)
      .set('Cookie', authCookie(user.id))
      .send({ description: 'My important document' });
    expect(res.status).toBe(200);
    expect(res.body.file.description).toBe('My important document');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// File links
// ─────────────────────────────────────────────────────────────────────────────

describe('File links', () => {
  it('FILE-018/019/020 — link file to reservation, list links, unlink', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const resv = createReservation(testDb, trip.id, { title: 'My Flight', type: 'flight' });
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    // Link (POST /:id/link)
    const link = await request(app)
      .post(`/api/trips/${trip.id}/files/${fileId}/link`)
      .set('Cookie', authCookie(user.id))
      .send({ reservation_id: resv.id });
    expect(link.status).toBe(200);
    expect(link.body.success).toBe(true);

    // List links (GET /:id/links)
    const links = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/links`)
      .set('Cookie', authCookie(user.id));
    expect(links.status).toBe(200);
    expect(links.body.links.some((l: any) => l.reservation_id === resv.id)).toBe(true);

    // Unlink (DELETE /:id/link/:linkId — use the link id from the list)
    const linkId = links.body.links.find((l: any) => l.reservation_id === resv.id)?.id;
    expect(linkId).toBeDefined();
    const unlink = await request(app)
      .delete(`/api/trips/${trip.id}/files/${fileId}/link/${linkId}`)
      .set('Cookie', authCookie(user.id));
    expect(unlink.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-trip link isolation (GHSA — reservation title disclosure)
//
// A file may only point at reservations / assignments / places from its own
// trip. The reservation JOIN returns the reservation title, so a member of one
// trip linking a file to another private trip's reservation id used to read the
// foreign title back. Every write path (link, upload, update) must reject it.
// ─────────────────────────────────────────────────────────────────────────────

describe('Cross-trip link isolation', () => {
  it('SEC-FILE-LINK-001 — linking a file to a reservation from another trip is rejected (no title leak)', async () => {
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb);
    const attackerTrip = createTrip(testDb, attacker.id, { title: 'Attacker Trip' });
    const victimTrip = createTrip(testDb, victim.id, { title: 'Victim Trip' });
    const victimReservation = createReservation(testDb, victimTrip.id, { title: 'Victim Secret Flight', type: 'flight' });
    const upload = await uploadFile(attackerTrip.id, attacker.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const link = await request(app)
      .post(`/api/trips/${attackerTrip.id}/files/${fileId}/link`)
      .set('Cookie', authCookie(attacker.id))
      .send({ reservation_id: victimReservation.id });
    expect(link.status).toBe(400);

    // Nothing was stored, so the title cannot leak back through the links list.
    const links = await request(app)
      .get(`/api/trips/${attackerTrip.id}/files/${fileId}/links`)
      .set('Cookie', authCookie(attacker.id));
    expect(links.status).toBe(200);
    expect(JSON.stringify(links.body)).not.toContain('Victim Secret Flight');
    expect((links.body.links as any[]).some((l) => l.reservation_id === victimReservation.id)).toBe(false);
  });

  it('SEC-FILE-LINK-002 — uploading a file with a foreign reservation_id is rejected (no title leak)', async () => {
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb);
    const attackerTrip = createTrip(testDb, attacker.id);
    const victimTrip = createTrip(testDb, victim.id);
    const victimReservation = createReservation(testDb, victimTrip.id, { title: 'Victim Secret Flight', type: 'flight' });

    const res = await request(app)
      .post(`/api/trips/${attackerTrip.id}/files`)
      .set('Cookie', authCookie(attacker.id))
      .field('reservation_id', String(victimReservation.id))
      .attach('file', FIXTURE_PDF);
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('Victim Secret Flight');
  });

  it('SEC-FILE-LINK-003 — updating a file with a foreign reservation_id is rejected (no title leak)', async () => {
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb);
    const attackerTrip = createTrip(testDb, attacker.id);
    const victimTrip = createTrip(testDb, victim.id);
    const victimReservation = createReservation(testDb, victimTrip.id, { title: 'Victim Secret Flight', type: 'flight' });
    const upload = await uploadFile(attackerTrip.id, attacker.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const res = await request(app)
      .put(`/api/trips/${attackerTrip.id}/files/${fileId}`)
      .set('Cookie', authCookie(attacker.id))
      .send({ reservation_id: victimReservation.id });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('Victim Secret Flight');
  });

  it('SEC-FILE-LINK-004 — linking a file to a place from another trip is rejected', async () => {
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb);
    const attackerTrip = createTrip(testDb, attacker.id);
    const victimTrip = createTrip(testDb, victim.id);
    const victimPlace = createPlace(testDb, victimTrip.id, { name: 'Victim Secret Place' });
    const upload = await uploadFile(attackerTrip.id, attacker.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const link = await request(app)
      .post(`/api/trips/${attackerTrip.id}/files/${fileId}/link`)
      .set('Cookie', authCookie(attacker.id))
      .send({ place_id: victimPlace.id });
    expect(link.status).toBe(400);

    const links = await request(app)
      .get(`/api/trips/${attackerTrip.id}/files/${fileId}/links`)
      .set('Cookie', authCookie(attacker.id));
    expect((links.body.links as any[]).some((l) => l.place_id === victimPlace.id)).toBe(false);
  });

  it('SEC-FILE-LINK-005 — same-trip reservation links and uploads still succeed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const resv = createReservation(testDb, trip.id, { title: 'My Own Flight', type: 'flight' });

    // Upload carrying the trip's own reservation id is accepted.
    const upload = await request(app)
      .post(`/api/trips/${trip.id}/files`)
      .set('Cookie', authCookie(user.id))
      .field('reservation_id', String(resv.id))
      .attach('file', FIXTURE_PDF);
    expect(upload.status).toBe(201);
    const fileId = upload.body.file.id;

    // And linking it to the same reservation works.
    const link = await request(app)
      .post(`/api/trips/${trip.id}/files/${fileId}/link`)
      .set('Cookie', authCookie(user.id))
      .send({ reservation_id: resv.id });
    expect(link.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Download
// ─────────────────────────────────────────────────────────────────────────────

describe('File download', () => {
  it('FILE-010 — GET /:id/download without auth returns 401', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const res = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/download`);
    expect(res.status).toBe(401);
  });

  it('FILE-008 — GET /:id/download with Bearer JWT downloads file', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const token = generateToken(user.id);

    const dl = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/download`)
      .set('Authorization', `Bearer ${token}`);
    // multer stores the file to disk during uploadFile — physical file exists
    expect(dl.status).toBe(200);
  });

  it('FILE-011 — GET /:id/download with trek_session cookie downloads file', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const upload = await uploadFile(trip.id, user.id, FIXTURE_PDF);
    const fileId = upload.body.file.id;

    const token = generateToken(user.id);

    const dl = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/download`)
      .set('Cookie', `trek_session=${token}`);
    expect(dl.status).toBe(200);
  });
});
