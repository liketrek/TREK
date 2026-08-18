/**
 * TrekPhotosRepository — capture metadata (#1614).
 *
 * The three sources of a photo's "when and where" disagree in how much they know:
 * a provider search answers with coordinates, the same provider's album listing
 * does not, and a local file gives them up only once its EXIF has been read. These
 * pin the merge rule that keeps a later, emptier answer from erasing an earlier one.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, getPlaceWithTags: () => null, canAccessTrip: () => undefined, isOwner: () => false } };
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
import { DatabaseService } from '../../../src/nest/database/database.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';

let repo: TrekPhotosRepository;

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
  repo = new TrekPhotosRepository(new DatabaseService(testDb));
});

beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

// A fresh path per call: getOrCreateLocal is keyed on file_path and resetTestDb
// leaves trek_photos alone, so a shared path would hand every test the same row.
let seq = 0;
function makePhoto(): number {
  return repo.getOrCreateLocal(`/uploads/journey/${++seq}.jpg`, null, null, null, 'image', null);
}

function read(id: number) {
  return testDb.prepare('SELECT taken_at, lat, lng FROM trek_photos WHERE id = ?').get(id) as {
    taken_at: string | null; lat: number | null; lng: number | null;
  };
}

describe('TrekPhotosRepository.recordCaptureMetadata', () => {
  it('TREKPHOTO-001: stores the capture time and coordinates', () => {
    const id = makePhoto();
    repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-002: a later, emptier answer does not erase what is known', () => {
    const id = makePhoto();
    repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
    // The album listing knows the date but not the place.
    repo.recordCaptureMetadata(id, { takenAt: '2020-01-01T00:00:00Z', lat: null, lng: null });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-003: fills only the half that was still missing', () => {
    const id = makePhoto();
    repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z' });
    repo.recordCaptureMetadata(id, { lat: 48.8584, lng: 2.2945 });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-004: refuses half a coordinate pair rather than landing on null island', () => {
    const id = makePhoto();
    repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: null });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: null, lng: null });
  });

  it('TREKPHOTO-005: an answer with nothing in it touches no row', () => {
    const id = makePhoto();
    repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
    repo.recordCaptureMetadata(id, {});

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });
});
