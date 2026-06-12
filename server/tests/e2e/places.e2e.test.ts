/**
 * Places module e2e — exercises the migrated /api/trips/:tripId/places endpoints
 * through the real JwtAuthGuard against a temp SQLite db. placeService,
 * journeyService, the permission check, canAccessTrip and the WebSocket
 * broadcast are mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/journeyService', () => ({ onPlaceCreated: vi.fn(), onPlaceUpdated: vi.fn(), onPlaceDeleted: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { pl } = vi.hoisted(() => ({
  pl: {
    listPlaces: vi.fn(), createPlace: vi.fn(), getPlace: vi.fn(), updatePlace: vi.fn(), deletePlace: vi.fn(),
    deletePlacesMany: vi.fn(), importGpx: vi.fn(), importMapFile: vi.fn(), importGoogleList: vi.fn(),
    importNaverList: vi.fn(), searchPlaceImage: vi.fn(),
  },
}));
vi.mock('../../src/services/placeService', () => pl);

import { PlacesModule } from '../../src/nest/places/places.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Places e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [PlacesModule] }).compile();
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
    pl.listPlaces.mockReturnValue([{ id: 1, name: 'Spot' }]);
    pl.createPlace.mockReturnValue({ id: 9, name: 'Spot' });
    pl.deletePlacesMany.mockReturnValue([1, 2]);
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/places')).status).toBe(401);
  });

  it('200 list', async () => {
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ places: [{ id: 1, name: 'Spot' }] });
  });

  it('201 create, 403 without permission, 400 over-long name', async () => {
    const ok = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ place: { id: 9, name: 'Spot' } });
    const long = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'x'.repeat(201) });
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: 'name must be 200 characters or less' });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(forbidden.status).toBe(403);
  });

  it('200 (not 201) bulk-delete, 400 on bad ids', async () => {
    const ok = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: [1, 2] });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ deleted: [1, 2], count: 2 });
    const bad = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: ['a'] });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'ids must be an array of numbers' });
  });

  it('404 trip when not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });
});
