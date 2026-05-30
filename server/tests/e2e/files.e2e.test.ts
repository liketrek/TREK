/**
 * Files + photos e2e — exercises the migrated /api/trips/:tripId/files and
 * /api/photos endpoints through the real JwtAuthGuard against a temp SQLite db.
 * The file/photo services, permission check and broadcast are mocked; this
 * focuses on auth (incl. the unguarded download's own token auth), trip-access
 * 404, permission 403, the photo id/access guards and status codes.
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

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { fileSvc } = vi.hoisted(() => ({
  fileSvc: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, BLOCKED_EXTENSIONS: ['.exe', '.svg'], filesDir: '/tmp/files', getAllowedExtensions: () => '*',
    verifyTripAccess: vi.fn(), resolveFilePath: vi.fn(), authenticateDownload: vi.fn(),
    listFiles: vi.fn(), getFileById: vi.fn(), getDeletedFile: vi.fn(), createFile: vi.fn(), updateFile: vi.fn(),
    toggleStarred: vi.fn(), softDeleteFile: vi.fn(), restoreFile: vi.fn(), permanentDeleteFile: vi.fn(),
    emptyTrash: vi.fn(), createFileLink: vi.fn(), deleteFileLink: vi.fn(), getFileLinks: vi.fn(), formatFile: vi.fn(),
  },
}));
vi.mock('../../src/services/fileService', () => fileSvc);

const { photoSvc, helperSvc } = vi.hoisted(() => ({
  photoSvc: { streamPhoto: vi.fn(), getPhotoInfo: vi.fn(), resolveTrekPhoto: vi.fn() },
  helperSvc: { canAccessTrekPhoto: vi.fn() },
}));
vi.mock('../../src/services/memories/photoResolverService', () => photoSvc);
vi.mock('../../src/services/memories/helpersService', () => helperSvc);

import { FilesModule } from '../../src/nest/files/files.module';
import { PhotosModule } from '../../src/nest/photos/photos.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Files + photos e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [FilesModule, PhotosModule] }).compile();
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
    fileSvc.listFiles.mockReturnValue([{ id: 1, original_name: 'a.pdf' }]);
    fileSvc.getFileById.mockReturnValue({ id: 9, starred: 0 });
    fileSvc.toggleStarred.mockReturnValue({ id: 9, starred: 1 });
  });

  beforeEach(() => {
    fileSvc.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
    helperSvc.canAccessTrekPhoto.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 listing files without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/files')).status).toBe(401);
  });

  it('200 list for an accessible trip', async () => {
    const res = await request(server).get('/api/trips/5/files').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ files: [{ id: 1, original_name: 'a.pdf' }] });
  });

  it('404 when the trip is not accessible', async () => {
    fileSvc.verifyTripAccess.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/files').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('200 toggling a star with permission', async () => {
    const res = await request(server).patch('/api/trips/5/files/9/star').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ file: { id: 9, starred: 1 } });
  });

  it('403 deleting without file_delete permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).delete('/api/trips/5/files/9').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission to delete files' });
  });

  it('download is unguarded but enforces its own token auth (401 without one)', async () => {
    fileSvc.authenticateDownload.mockReturnValue({ error: 'Authentication required', status: 401 });
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
