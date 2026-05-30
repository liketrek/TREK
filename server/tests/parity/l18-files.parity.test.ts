/**
 * C3 parity — files (trip file manager) + photos (global photo access).
 *
 * Same request at the legacy Express routes and the migrated Nest controllers,
 * with the file/photo services, permissions, the WebSocket broadcast, demo and
 * auth mocked identically. Multipart upload + the sendFile/stream success bodies
 * differ per framework (multer vs FileInterceptor, res.sendFile), so this pins
 * routing, status codes and the JSON error envelopes — including the unguarded
 * download's token-auth errors and the photo id/access guards.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => ({ id: 42 }), all: () => [], run: () => undefined }) },
  canAccessTrip: vi.fn(() => ({ user_id: 1 })), closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  demoUploadBlock: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));
vi.mock('../../src/middleware/tripAccess', () => ({
  requireTripAccess: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { trip: unknown }).trip = { user_id: 1 };
    next();
  },
}));

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { fileSvc } = vi.hoisted(() => ({
  fileSvc: {
    // Constants the route + controller read at import time.
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    BLOCKED_EXTENSIONS: ['.exe', '.svg'],
    filesDir: '/tmp/files',
    getAllowedExtensions: () => '*',
    verifyTripAccess: vi.fn(), formatFile: vi.fn(), resolveFilePath: vi.fn(), authenticateDownload: vi.fn(),
    listFiles: vi.fn(), getFileById: vi.fn(), getFileByIdFull: vi.fn(), getDeletedFile: vi.fn(),
    createFile: vi.fn(), updateFile: vi.fn(), toggleStarred: vi.fn(), softDeleteFile: vi.fn(),
    restoreFile: vi.fn(), permanentDeleteFile: vi.fn(), emptyTrash: vi.fn(), createFileLink: vi.fn(),
    deleteFileLink: vi.fn(), getFileLinks: vi.fn(),
  },
}));
vi.mock('../../src/services/fileService', () => fileSvc);

vi.mock('../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

const { photoSvc, helperSvc } = vi.hoisted(() => ({
  photoSvc: { streamPhoto: vi.fn(), getPhotoInfo: vi.fn(), resolveTrekPhoto: vi.fn() },
  helperSvc: { canAccessTrekPhoto: vi.fn() },
}));
vi.mock('../../src/services/memories/photoResolverService', () => photoSvc);
vi.mock('../../src/services/memories/helpersService', () => helperSvc);

import filesRoutes from '../../src/routes/files';
import photosRoutes from '../../src/routes/photos';
import { FilesModule } from '../../src/nest/files/files.module';
import { PhotosModule } from '../../src/nest/photos/photos.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C3 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/files', filesRoutes);
    app.use('/api/photos', photosRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [FilesModule, PhotosModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    fileSvc.listFiles.mockReturnValue([{ id: 1, original_name: 'a.pdf' }]);
    fileSvc.getFileById.mockReturnValue({ id: 9, starred: 0, description: 'x' });
    fileSvc.getDeletedFile.mockReturnValue({ id: 9 });
    fileSvc.updateFile.mockReturnValue({ id: 9, description: 'new' });
    fileSvc.toggleStarred.mockReturnValue({ id: 9, starred: 1 });
    fileSvc.restoreFile.mockReturnValue({ id: 9 });
    fileSvc.permanentDeleteFile.mockResolvedValue(undefined);
    fileSvc.emptyTrash.mockResolvedValue(2);
    fileSvc.createFileLink.mockReturnValue([{ id: 1 }]);
    fileSvc.getFileLinks.mockReturnValue([{ id: 1 }]);
    fileSvc.authenticateDownload.mockReturnValue({ error: 'Authentication required', status: 401 });
  });

  beforeEach(() => {
    fileSvc.verifyTripAccess.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
    helperSvc.canAccessTrekPhoto.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  // Files — JSON endpoints
  it('GET /files', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/files' }));
  it('GET /files?trash=true', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/files', query: { trash: 'true' } }));
  it('GET /files 404 no access', () => {
    fileSvc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/files' });
  });
  it('PUT /files/:id', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/files/9', body: { description: 'new' } }));
  it('PUT /files/:id 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/files/9', body: { description: 'x' } });
  });
  it('PUT /files/:id 404', () => {
    fileSvc.getFileById.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    return expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/files/9', body: {} });
  });
  it('PATCH /files/:id/star', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/trips/5/files/9/star' }));
  it('DELETE /files/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/files/9' }));
  it('POST /files/:id/restore (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/files/9/restore' }));
  it('POST /files/:id/restore 404 not in trash', () => {
    fileSvc.getDeletedFile.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/files/9/restore' });
  });
  it('DELETE /files/:id/permanent', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/files/9/permanent' }));
  it('DELETE /files/trash/empty', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/files/trash/empty' }));
  it('POST /files/:id/link (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/files/9/link', body: { reservation_id: 2 } }));
  it('DELETE /files/:id/link/:linkId', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/files/9/link/3' }));
  it('GET /files/:id/links', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/files/9/links' }));

  // Files — download (unguarded), error paths only (sendFile body differs)
  it('GET /files/:id/download 401 (token)', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/files/9/download' }));
  it('GET /files/:id/download 404 no access', () => {
    fileSvc.authenticateDownload.mockReturnValue({ userId: 1 });
    fileSvc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/files/9/download' });
  });

  // Photos — guard paths only (stream/info success writes binary/json via res)
  it('GET /photos/:id/thumbnail 400 invalid id', () => expectParity(expressServer, nestServer, { path: '/api/photos/abc/thumbnail' }));
  it('GET /photos/:id/original 403 no access', () => {
    helperSvc.canAccessTrekPhoto.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/photos/5/original' });
  });
  it('GET /photos/:id/info 403 no access', () => {
    helperSvc.canAccessTrekPhoto.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/photos/5/info' });
  });
});
