/**
 * Files + photos e2e — exercises the migrated /api/trips/:tripId/files and
 * /api/photos endpoints through the real JwtAuthGuard against a temp SQLite db.
 * FilesService is DI-native (no service mock): the file rows live in the temp
 * db and the SQL runs for real; only canAccessTrip, the permission check, the
 * photo services and the broadcast are mocked. Focuses on auth (incl. the
 * unguarded download's own token auth), trip-access 404, permission 403, the
 * photo id/access guards and status codes.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { FilesModule } from '../../src/nest/files/files.module';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { PhotosModule } from '../../src/nest/photos/photos.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  // FilesService runs its real SQL against these (FILE_SELECT joins reservations
  // and users; the link batch reads file_links; findForeignLinkTarget probes
  // reservations/places/day_assignments).
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT);');
  tmp.exec(`CREATE TABLE trip_files (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    place_id INTEGER, reservation_id INTEGER, filename TEXT NOT NULL, original_name TEXT NOT NULL,
    file_size INTEGER, mime_type TEXT, description TEXT, uploaded_by INTEGER, starred INTEGER DEFAULT 0,
    deleted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE file_links (id INTEGER PRIMARY KEY AUTOINCREMENT, file_id INTEGER NOT NULL,
    reservation_id INTEGER, assignment_id INTEGER, place_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec('CREATE TABLE reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, title TEXT);');
  tmp.exec('CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER);');
  tmp.exec('CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER);');
  tmp.exec('CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER);');
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip,
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(),
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

const { photoSvc, helperSvc } = vi.hoisted(() => ({
  photoSvc: { streamPhoto: vi.fn(), getPhotoInfo: vi.fn(), resolveTrekPhoto: vi.fn() },
  helperSvc: { canAccessTrekPhoto: vi.fn() },
}));
// Both are providers since the fold; PhotosModule resolves them through DI, so
// the stubs go on the prototypes rather than on a module path.
vi.mock('../../src/nest/memories/photo-resolver.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/photo-resolver.service')>();
  actual.PhotoResolverService.prototype.streamPhoto = photoSvc.streamPhoto;
  actual.PhotoResolverService.prototype.getPhotoInfo = photoSvc.getPhotoInfo;
  return actual;
});
vi.mock('../../src/nest/memories/memories-access.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/memories-access.service')>();
  actual.MemoriesAccessService.prototype.canAccessTrekPhoto = helperSvc.canAccessTrekPhoto;
  return actual;
});

describe('Files + photos e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, FilesModule, PhotosModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (5, 1, ?)').run('Trip');
    db.prepare(
      "INSERT INTO trip_files (id, trip_id, filename, original_name, uploaded_by) VALUES (1, 5, 'stored-a.pdf', 'a.pdf', 1)",
    ).run();
    db.prepare(
      "INSERT INTO trip_files (id, trip_id, filename, original_name, uploaded_by, starred) VALUES (9, 5, 'stored-b.pdf', 'b.pdf', 1, 0)",
    ).run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
    helperSvc.canAccessTrekPhoto.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 listing files without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/files')).status).toBe(401);
  });

  it('200 list for an accessible trip (real SQL, formatted rows)', async () => {
    const res = await request(server).get('/api/trips/5/files').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.files).toHaveLength(2);
    const first = res.body.files.find((f: { id: number }) => f.id === 1);
    expect(first.original_name).toBe('a.pdf');
    expect(first.url).toBe('/api/trips/5/files/1/download');
    expect(first.linked_reservation_ids).toEqual([]);
  });

  it('404 when the trip is not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/files').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('200 toggling a star with permission (real UPDATE + re-select)', async () => {
    const res = await request(server).patch('/api/trips/5/files/9/star').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.file.id).toBe(9);
    expect(res.body.file.starred).toBe(1);
    // put it back so the case is order-independent
    db.prepare('UPDATE trip_files SET starred = 0 WHERE id = 9').run();
  });

  it('403 deleting without file_delete permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).delete('/api/trips/5/files/9').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission to delete files' });
  });

  it('download is unguarded but enforces its own token auth (401 without one)', async () => {
    const res = await request(server).get('/api/trips/5/files/9/download');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('400 on a photo with a non-finite id', async () => {
    const res = await request(server).get('/api/photos/abc/thumbnail').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid photo ID' });
  });

  it('403 on a photo the user cannot access', async () => {
    helperSvc.canAccessTrekPhoto.mockReturnValue(false);
    const res = await request(server).get('/api/photos/5/original').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
  });
});
