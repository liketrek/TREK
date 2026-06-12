/**
 * Share-link e2e — exercises the migrated /api/trips/:tripId/share-link and the
 * public /api/shared/:token endpoints through the real JwtAuthGuard against a
 * temp SQLite db. The share service + permission check are mocked; this focuses
 * on auth, trip-access 404, permission 403, the create-201-vs-update-200 split
 * and the unguarded public read.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db, canAccessTrip } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp, canAccessTrip: vi.fn() };
});

vi.mock('../../src/db/database', () => ({ db, canAccessTrip, closeDb: () => {}, reinitialize: () => {} }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { shareSvc } = vi.hoisted(() => ({
  shareSvc: { createOrUpdateShareLink: vi.fn(), getShareLink: vi.fn(), deleteShareLink: vi.fn(), getSharedTripData: vi.fn(), getSharedPlacePhotoPath: vi.fn() },
}));
vi.mock('../../src/services/shareService', () => shareSvc);

import { ShareModule } from '../../src/nest/share/share.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Share-link e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [ShareModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    shareSvc.getSharedTripData.mockReturnValue({ trip: { id: 9 } });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/share-link')).status).toBe(401);
  });

  it('201 on first create, 200 on a subsequent update', async () => {
    shareSvc.createOrUpdateShareLink.mockReturnValueOnce({ token: 't', created: true });
    const created = await request(server).post('/api/trips/5/share-link').set('Cookie', sessionCookie(1)).send({ share_map: true });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ token: 't' });

    shareSvc.createOrUpdateShareLink.mockReturnValueOnce({ token: 't', created: false });
    const updated = await request(server).post('/api/trips/5/share-link').set('Cookie', sessionCookie(1)).send({});
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ token: 't' });
  });

  it('403 without share_manage', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/share-link').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('404 when the trip is not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/share-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('public shared read is unguarded (200, no cookie)', async () => {
    const res = await request(server).get('/api/shared/tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ trip: { id: 9 } });
  });

  it('public shared read 404 for an invalid token', async () => {
    shareSvc.getSharedTripData.mockReturnValueOnce(null);
    const res = await request(server).get('/api/shared/bad');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invalid or expired link' });
  });

  describe('public place-photo proxy (/api/shared/:token/place-photo/:placeId/bytes)', () => {
    const photoFile = path.join(os.tmpdir(), 'trek-share-photo.e2e.jpg');
    const photoBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG-ish header

    beforeAll(() => fs.writeFileSync(photoFile, photoBytes));
    afterAll(() => { try { fs.unlinkSync(photoFile); } catch { /* ignore */ } });

    it('streams cached bytes with no cookie (unguarded) for a valid token + place', async () => {
      shareSvc.getSharedPlacePhotoPath.mockReturnValueOnce(photoFile);
      const res = await request(server).get('/api/shared/tok/place-photo/ChIJabc/bytes');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/jpeg');
      expect(res.headers['cache-control']).toContain('immutable');
      expect(Buffer.from(res.body)).toEqual(photoBytes);
      expect(shareSvc.getSharedPlacePhotoPath).toHaveBeenCalledWith('tok', 'ChIJabc');
    });

    it('404 when the token/place does not resolve to a cached photo', async () => {
      shareSvc.getSharedPlacePhotoPath.mockReturnValueOnce(null);
      const res = await request(server).get('/api/shared/bad/place-photo/ChIJabc/bytes');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Photo not cached' });
    });
  });
});
