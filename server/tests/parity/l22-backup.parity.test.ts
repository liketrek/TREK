/**
 * C7 parity — backup (admin-only).
 *
 * Same request at the legacy Express /api/backup route and the migrated Nest
 * controller, with backupService, auditLog and auth mocked identically (the
 * fixed user is an admin so both the legacy adminOnly and the Nest AdminGuard
 * pass). Multipart upload + res.download success differ per framework, so this
 * pins routing, the rate-limit 429, filename 400/404, restore status mapping
 * and the auto-settings/list/delete JSON.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedAdmin } = vi.hoisted(() => ({ fixedAdmin: { id: 1, username: 'a', email: 'a@example.test', role: 'admin' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) }, closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedAdmin;
    next();
  },
  adminOnly: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedAdmin,
}));

vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));

const { backupSvc } = vi.hoisted(() => ({
  backupSvc: {
    listBackups: vi.fn(), createBackup: vi.fn(), restoreFromZip: vi.fn(), getAutoSettings: vi.fn(),
    updateAutoSettings: vi.fn(), deleteBackup: vi.fn(), isValidBackupFilename: vi.fn(), backupFilePath: vi.fn(),
    backupFileExists: vi.fn(), checkRateLimit: vi.fn(), getUploadTmpDir: () => '/tmp', BACKUP_RATE_WINDOW: 3600000,
    MAX_BACKUP_UPLOAD_SIZE: 1024,
  },
}));
vi.mock('../../src/services/backupService', () => backupSvc);

import backupRoutes from '../../src/routes/backup';
import { BackupModule } from '../../src/nest/backup/backup.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C7 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/backup', backupRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [BackupModule] }).compile();
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
    backupSvc.listBackups.mockReturnValue([{ filename: 'a.zip', size: 1 }]);
    backupSvc.createBackup.mockResolvedValue({ filename: 'b.zip', size: 10 });
    backupSvc.getAutoSettings.mockReturnValue({ settings: { enabled: true }, timezone: 'UTC' });
    backupSvc.updateAutoSettings.mockReturnValue({ enabled: true, interval: 'daily', keep_days: 7 });
    backupSvc.restoreFromZip.mockResolvedValue({ success: true });
  });

  beforeEach(() => {
    backupSvc.isValidBackupFilename.mockReturnValue(true);
    backupSvc.backupFileExists.mockReturnValue(true);
    backupSvc.checkRateLimit.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /backup/list', () => expectParity(expressServer, nestServer, { path: '/api/backup/list' }));
  it('POST /backup/create', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/backup/create' }));
  it('POST /backup/create 429 rate-limited', () => {
    backupSvc.checkRateLimit.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/backup/create' });
  });
  it('GET /backup/download/:f 400 invalid', () => {
    backupSvc.isValidBackupFilename.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/backup/download/bad' });
  });
  it('GET /backup/download/:f 404 missing', () => {
    backupSvc.backupFileExists.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/backup/download/x.zip' });
  });
  it('POST /backup/restore/:f', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/backup/restore/x.zip' }));
  it('POST /backup/restore/:f 400 invalid', () => {
    backupSvc.isValidBackupFilename.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/backup/restore/bad' });
  });
  it('POST /backup/restore/:f maps the service status', () => {
    backupSvc.restoreFromZip.mockResolvedValueOnce({ success: false, status: 422, error: 'bad zip' }).mockResolvedValueOnce({ success: false, status: 422, error: 'bad zip' });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/backup/restore/x.zip' });
  });
  it('GET /backup/auto-settings', () => expectParity(expressServer, nestServer, { path: '/api/backup/auto-settings' }));
  it('PUT /backup/auto-settings', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/backup/auto-settings', body: { enabled: true } }));
  it('DELETE /backup/:f', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/backup/x.zip' }));
  it('DELETE /backup/:f 404', () => {
    backupSvc.backupFileExists.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/backup/x.zip' });
  });
});
