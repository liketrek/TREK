/**
 * trek_photos media_type persistence (#823): a local or provider photo row can
 * be registered as a video and the discriminator round-trips.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  // FKs off: this suite only checks media_type persistence, not owner/user integrity.
  db.exec('PRAGMA foreign_keys = OFF');
  const mock = { db, closeDb: () => {}, reinitialize: () => {}, getPlaceWithTags: () => null, canAccessTrip: () => null, isOwner: () => false };
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
import { createUser } from '../../helpers/factories';
import { getOrCreateLocalTrekPhoto, getOrCreateTrekPhoto, resolveTrekPhoto } from '../../../src/services/memories/photoResolverService';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  testDb.prepare('DELETE FROM trek_photos').run();
});

afterAll(() => {
  testDb.close();
});

describe('trek_photos media_type', () => {
  it('migration added media_type (default image) and duration_ms', () => {
    const cols = (testDb.prepare("PRAGMA table_info('trek_photos')").all() as { name: string }[]).map(c => c.name);
    expect(cols).toContain('media_type');
    expect(cols).toContain('duration_ms');
  });

  it('a local photo defaults to image', () => {
    const id = getOrCreateLocalTrekPhoto('journey/a.jpg');
    expect(resolveTrekPhoto(id)!.media_type).toBe('image');
  });

  it('a local video stores media_type=video + duration', () => {
    const id = getOrCreateLocalTrekPhoto('journey/clip.mp4', 'journey/poster.jpg', null, null, 'video', 4200);
    const row = resolveTrekPhoto(id)!;
    expect(row.media_type).toBe('video');
    expect(row.duration_ms).toBe(4200);
    expect(row.thumbnail_path).toBe('journey/poster.jpg');
  });

  it('a provider photo can be registered as video', () => {
    const { user } = createUser(testDb);
    const id = getOrCreateTrekPhoto('immich', 'asset-1', user.id, undefined, 'video');
    expect(resolveTrekPhoto(id)!.media_type).toBe('video');
  });
});
