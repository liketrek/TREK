/**
 * Files + photos e2e — exercises the migrated /api/trips/:tripId/files and
 * /api/photos endpoints through the real JwtAuthGuard against a temp SQLite db.
 * FilesService is DI-native (no service mock): the file rows live in the temp
 * db and the SQL runs for real; only canAccessTrip, the permission check, the
 * photo services and the broadcast are mocked. Focuses on auth (incl. the
 * unguarded download's own token auth), trip-access 404, permission 403, the
 * photo id/access guards and status codes.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
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
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  // FilesService runs its real SQL against these (FILE_SELECT joins reservations
  // and users; the link batch reads file_links; findForeignLinkTarget probes
  // reservations/places/day_assignments).
  // An ORM insert into trips names every column the entity gives a default
  // (is_archived, reminder_days and the two timestamps); the real schema has all four.
  tmp.exec(`CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, currency TEXT,
    is_archived INTEGER DEFAULT 0, reminder_days INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // TripAccessGuard now reads TripsRepository.findAccessible directly
  // (Plan 3c Task 0b), a real join against trip_members.
  tmp.exec('CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);');
  tmp.exec(`CREATE TABLE trip_files (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    place_id INTEGER, reservation_id INTEGER, message_id INTEGER, filename TEXT NOT NULL,
    original_name TEXT NOT NULL, file_size INTEGER, mime_type TEXT, description TEXT,
    note_id INTEGER, uploaded_by INTEGER, starred INTEGER DEFAULT 0,
    deleted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE file_links (id INTEGER PRIMARY KEY AUTOINCREMENT, file_id INTEGER NOT NULL,
    reservation_id INTEGER, assignment_id INTEGER, place_id INTEGER, budget_item_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec('CREATE TABLE budget_items (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, name TEXT);');
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
  db, canAccessTrip, getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

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

import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { FilesModule } from '../../src/nest/files/files.module';
import { PhotosModule } from '../../src/nest/photos/photos.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { deleteRows, insertRow, updateRows } from '../helpers/factories/rows';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';

describe('Files + photos e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let orm: TestOrm;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, FilesModule, PhotosModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    orm = await createTestOrm(db);
    await insertRow(orm, Trips, { id: 5, user: 1, title: 'Trip' });
    await insertRow(orm, TripFiles, { id: 1, trip: 5, filename: 'stored-a.pdf', original_name: 'a.pdf', uploadedByRef: 1 });
    await insertRow(orm, TripFiles, { id: 9, trip: 5, filename: 'stored-b.pdf', original_name: 'b.pdf', uploadedByRef: 1, starred: 0 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    // 0b review L2 / security review F-B7: dead mock scaffolding — see
    // budget.e2e.test.ts's identical comment.
    checkPermission.mockReturnValue(true);
    helperSvc.canAccessTrekPhoto.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
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
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query — `canAccessTrip.mockReturnValue(...)` no
    // longer intercepts it. Trip 5 is a persistent row seeded once in
    // `beforeAll` (not re-seeded per test), so it is removed and restored
    // around this one assertion instead.
    await deleteRows(orm, Trips, { id: 5 });
    try {
      const res = await request(server).get('/api/trips/5/files').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    } finally {
      await insertRow(orm, Trips, { id: 5, user: 1, title: 'Trip' });
    }
  });

  it('200 toggling a star with permission (real UPDATE + re-select)', async () => {
    const res = await request(server).patch('/api/trips/5/files/9/star').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.file.id).toBe(9);
    expect(res.body.file.starred).toBe(1);
    // put it back so the case is order-independent
    await updateRows(orm, TripFiles, { id: 9 }, { starred: 0 });
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
