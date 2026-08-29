/**
 * Optimistic-concurrency / 409 conflict tests (#1135) for the place + packing
 * update services. A matching If-Match token (or none) updates as before; a
 * stale token returns the conflict sentinel carrying the server's current row.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { isUpdateConflict } from '../../../src/nest/common/conflictResult';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { createUser, createTrip } from '../../helpers/factories';
import { notificationsStub } from '../../helpers/notifications';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { resetTestDb } from '../../helpers/test-db';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  function getPlaceWithTags(placeId: number | string) {
    const p = db.prepare('SELECT * FROM places WHERE id = ?').get(placeId);
    if (!p) return null;
    return { ...(p as object), category: null, tags: [] };
  }
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const dbs = new DatabaseService(testDb);
const realtime = new RealtimeService();
const runtimeEnv = new RuntimeEnvService();
// One cache instance shared by maps and places, the way the container wires it:
// the service's stampede guard only works if there is exactly one of them.
const photoCache = new PlacePhotoCacheService(dbs, makeStorageFixture('photos/google/').storage);

const packing = new PackingService(dbs, new PermissionsService(dbs), realtime, notificationsStub());
const places = new PlacesService(
  dbs,
  new PermissionsService(dbs),
  realtime,
  new MapsService(dbs, photoCache),
  new QueryHelpersService(dbs),
  new UnsplashService(dbs, runtimeEnv, makeStorageFixture('').storage),
  photoCache,
  new JourneyDomainService(dbs, realtime, new TrekPhotosRepository(dbs)),
  makeStorageFixture('').storage,
);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

function freshPlace(tripId: number) {
  const place = places.create(String(tripId), { name: 'Original' }) as unknown as { id: number; updated_at: string };
  return place;
}

describe('PlacesService.update — optimistic concurrency', () => {
  it('updates normally when no If-Match token is sent (back-compat)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Edited' });
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('updates when the If-Match token matches the current updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Edited' }, place.updated_at);
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('returns a conflict (with the server row) when the token is stale', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Mine' }, '1999-01-01 00:00:00');
    expect(isUpdateConflict(result)).toBe(true);
    if (isUpdateConflict(result)) {
      expect((result.server as { name: string }).name).toBe('Original');
    }
    // The row must NOT have been overwritten.
    const row = testDb.prepare('SELECT name FROM places WHERE id = ?').get(place.id) as { name: string };
    expect(row.name).toBe('Original');
  });

  it('returns null for a place that does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.update(String(trip.id), '999999', { name: 'x' }, 'whatever')).toBeNull();
  });
});

describe('updateItem (packing) — optimistic concurrency', () => {
  it('migration added updated_at and createItem stamps it', () => {
    const cols = testDb.prepare("PRAGMA table_info('packing_items')").all() as { name: string }[];
    expect(cols.map((c) => c.name)).toContain('updated_at');

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = packing.createItem(trip.id, { name: 'Socks' }) as { id: number; updated_at: string | null };
    expect(item.updated_at).toBeTruthy();
  });

  it('returns a conflict when the packing token is stale', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = packing.createItem(trip.id, { name: 'Socks' }, user.id) as { id: number; updated_at: string };

    const stale = packing.updateItem(trip.id, item.id, { name: 'Mine' }, ['name'], '1999-01-01 00:00:00', user.id);
    expect(isUpdateConflict(stale)).toBe(true);

    const fresh = packing.updateItem(trip.id, item.id, { name: 'Edited' }, ['name'], item.updated_at, user.id);
    expect(isUpdateConflict(fresh)).toBe(false);
    expect((fresh as { name: string }).name).toBe('Edited');
  });
});
