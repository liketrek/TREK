/**
 * Share-link e2e — exercises the migrated /api/trips/:tripId/share-link and the
 * public /api/shared/:token endpoints through the real JwtAuthGuard against a
 * temp SQLite db. ShareService runs its real SQL via DatabaseModule (the
 * DATABASE_CONNECTION factory picks up the mocked db singleton); trip access
 * resolves through a real-SQL canAccessTrip over the temp db. Only the
 * permission check and the photo-cache path lookup stay mocked. Focuses on
 * auth, trip-access 404, permission 403, the create-201-vs-update-200 split
 * and the unguarded public read.
 */
import { runMigrations } from '../../src/db/migrations';
import { createTables } from '../../src/db/schema';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { ShareModule } from '../../src/nest/share/share.module';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  // Real-SQL trip access over the temp db — ShareService.verifyTripAccess and
  // DatabaseModule both read the mocked singleton.
  canAccessTrip: (tripId: number | string, userId: number) =>
    db
      .prepare(
        `
      SELECT t.id, t.user_id FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
    `,
      )
      .get(userId, tripId, userId),
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

// Overridden in the container rather than path-mocked: the cache is a provider now.
// serveKey hands the controller a bare photos-google storage name (slice 3).
const serveKey = vi.fn();

describe('Share-link e2e (real auth guard + real SQL over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, ShareModule] })
      .overrideProvider(PlacePhotoCacheService)
      .useValue({ serveKey })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): the DTO-typed body
    // validates by metatype, exactly as it does under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db);
    runMigrations(db);
    // seedUser() omits password_hash, which the real schema requires NOT NULL.
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user')",
    ).run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM share_tokens');
    db.exec('DELETE FROM places');
    db.exec('DELETE FROM trip_members');
    db.exec('DELETE FROM trips');
    tripId = Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (1, ?)').run('Trip').lastInsertRowid);
    checkPermission.mockReturnValue(true);
    serveKey.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  function tokenRow() {
    return db.prepare('SELECT * FROM share_tokens WHERE trip_id = ?').get(tripId) as any;
  }

  it('401 without a session cookie', async () => {
    expect((await request(server).get(`/api/trips/${tripId}/share-link`)).status).toBe(401);
  });

  it('201 on first create, 200 on a subsequent update', async () => {
    const created = await request(server)
      .post(`/api/trips/${tripId}/share-link`)
      .set('Cookie', sessionCookie(1))
      .send({ share_map: true });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ token: tokenRow().token });

    const updated = await request(server)
      .post(`/api/trips/${tripId}/share-link`)
      .set('Cookie', sessionCookie(1))
      .send({});
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ token: created.body.token });
  });

  it('403 without share_manage', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post(`/api/trips/${tripId}/share-link`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect(tokenRow()).toBeUndefined();
  });

  it('404 when the trip is not accessible', async () => {
    const res = await request(server).get('/api/trips/999999/share-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('GET returns the stored flags, DELETE revokes the link', async () => {
    await request(server)
      .post(`/api/trips/${tripId}/share-link`)
      .set('Cookie', sessionCookie(1))
      .send({ share_budget: true });
    const info = await request(server).get(`/api/trips/${tripId}/share-link`).set('Cookie', sessionCookie(1));
    expect(info.status).toBe(200);
    expect(info.body).toEqual(
      expect.objectContaining({ token: tokenRow().token, share_budget: true, share_packing: false }),
    );

    const removed = await request(server).delete(`/api/trips/${tripId}/share-link`).set('Cookie', sessionCookie(1));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ success: true });
    expect(tokenRow()).toBeUndefined();

    const after = await request(server).get(`/api/trips/${tripId}/share-link`).set('Cookie', sessionCookie(1));
    expect(after.body).toEqual({ token: null });
  });

  it('public shared read is unguarded (200, no cookie)', async () => {
    const created = await request(server)
      .post(`/api/trips/${tripId}/share-link`)
      .set('Cookie', sessionCookie(1))
      .send({});
    const res = await request(server).get(`/api/shared/${created.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.trip).toEqual(expect.objectContaining({ id: tripId, title: 'Trip' }));
    expect(res.body.permissions).toEqual(expect.objectContaining({ share_map: true, share_budget: false }));
  });

  it('public shared read 404 for an invalid token', async () => {
    const res = await request(server).get('/api/shared/bad');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invalid or expired link' });
  });

  describe('public place-photo proxy (/api/shared/:token/place-photo/:placeId/bytes)', () => {
    // The controller streams (category 'photos-google', name) through the real
    // storage facade, so the fixture has to live in the real photos-google root.
    const photoName = 'trek-share-photo.e2e.jpg';
    const photoFile = path.join(__dirname, '../../uploads/photos/google', photoName);
    const photoBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG-ish header

    beforeAll(() => {
      fs.mkdirSync(path.dirname(photoFile), { recursive: true });
      fs.writeFileSync(photoFile, photoBytes);
    });
    afterAll(() => {
      try {
        fs.unlinkSync(photoFile);
      } catch {
        /* ignore */
      }
    });

    it('streams cached bytes with no cookie (unguarded) for a valid token + place', async () => {
      const created = await request(server)
        .post(`/api/trips/${tripId}/share-link`)
        .set('Cookie', sessionCookie(1))
        .send({});
      db.prepare('INSERT INTO places (trip_id, name, image_url) VALUES (?, ?, ?)').run(
        tripId,
        'Louvre',
        '/api/maps/place-photo/ChIJabc/bytes',
      );
      serveKey.mockReturnValueOnce(photoName);
      const res = await request(server).get(`/api/shared/${created.body.token}/place-photo/ChIJabc/bytes`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/jpeg');
      expect(res.headers['cache-control']).toContain('immutable');
      expect(Buffer.from(res.body)).toEqual(photoBytes);
      expect(serveKey).toHaveBeenCalledWith('ChIJabc');
    });

    it('answers an empty 204 when the token/place does not resolve to a cached photo', async () => {
      const res = await request(server).get('/api/shared/bad/place-photo/ChIJabc/bytes');
      expect(res.status).toBe(204);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.text ?? '').toBe('');
    });
  });
});
