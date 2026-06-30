/**
 * Optimistic-concurrency / 409 conflict tests (#1135) for the place + packing
 * update services. A matching If-Match token (or none) updates as before; a
 * stale token returns the conflict sentinel carrying the server's current row.
 */
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

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { updatePlace, createPlace } from '../../../src/services/placeService';
import { createItem, updateItem } from '../../../src/services/packingService';
import { isUpdateConflict } from '../../../src/services/conflictResult';

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
  const place = createPlace(String(tripId), { name: 'Original' }) as { id: number; updated_at: string };
  return place;
}

describe('updatePlace — optimistic concurrency', () => {
  it('updates normally when no If-Match token is sent (back-compat)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = updatePlace(String(trip.id), String(place.id), { name: 'Edited' });
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('updates when the If-Match token matches the current updated_at', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = updatePlace(String(trip.id), String(place.id), { name: 'Edited' }, place.updated_at);
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('returns a conflict (with the server row) when the token is stale', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = freshPlace(trip.id);

    const result = updatePlace(String(trip.id), String(place.id), { name: 'Mine' }, '1999-01-01 00:00:00');
    expect(isUpdateConflict(result)).toBe(true);
    if (isUpdateConflict(result)) {
      expect((result.server as { name: string }).name).toBe('Original');
    }
    // The row must NOT have been overwritten.
    const row = testDb.prepare('SELECT name FROM places WHERE id = ?').get(place.id) as { name: string };
    expect(row.name).toBe('Original');
  });

  it('returns null for a place that does not exist', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(updatePlace(String(trip.id), '999999', { name: 'x' }, 'whatever')).toBeNull();
  });
});

describe('updateItem (packing) — optimistic concurrency', () => {
  it('migration added updated_at and createItem stamps it', () => {
    const cols = testDb.prepare("PRAGMA table_info('packing_items')").all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('updated_at');

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createItem(trip.id, { name: 'Socks' }) as { id: number; updated_at: string | null };
    expect(item.updated_at).toBeTruthy();
  });

  it('returns a conflict when the packing token is stale', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createItem(trip.id, { name: 'Socks' }) as { id: number; updated_at: string };

    const stale = updateItem(trip.id, item.id, { name: 'Mine' }, ['name'], '1999-01-01 00:00:00');
    expect(isUpdateConflict(stale)).toBe(true);

    const fresh = updateItem(trip.id, item.id, { name: 'Edited' }, ['name'], item.updated_at);
    expect(isUpdateConflict(fresh)).toBe(false);
    expect((fresh as { name: string }).name).toBe('Edited');
  });
})
