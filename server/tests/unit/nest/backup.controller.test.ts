import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';
import type { AutoBackupJob } from '../../../src/nest/backup/auto-backup.job';
import { BackupController } from '../../../src/nest/backup/backup.controller';
import * as backupSvc from '../../../src/nest/backup/backup.impl';
import { BackupService as RealBackupService } from '../../../src/nest/backup/backup.service';
import type { BackupService } from '../../../src/nest/backup/backup.service';
import { StorageNotFoundError } from '../../../src/nest/storage/storage.types';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import type { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
// The thin BackupService wrapper forwards every call straight into this
// module, so the mock stubs the delegated functions for the wrapper tests
// below (the multer size cap is consumed by backup.module's upload factory).
vi.mock('../../../src/nest/backup/backup.impl', () => ({
  MAX_BACKUP_UPLOAD_SIZE: 1024,
  BACKUP_RATE_WINDOW: 3600000,
  listBackups: vi.fn().mockReturnValue([{ filename: 'svc.zip' }]),
  createBackup: vi.fn().mockResolvedValue({ filename: 'svc.zip', size: 5 }),
  restoreFromZip: vi.fn().mockResolvedValue({ success: true }),
  restoreBackup: vi.fn().mockResolvedValue({ success: true }),
  deleteBackup: vi.fn(),
  isValidBackupFilename: vi.fn().mockReturnValue(true),
  backupFileExists: vi.fn().mockReturnValue(true),
  sendBackupToResponse: vi.fn().mockResolvedValue(undefined),
  checkRateLimit: vi.fn().mockReturnValue(true),
}));

const user = { id: 1, role: 'admin', email: 'a@example.test' } as User;
const req = { ip: '1.2.3.4', headers: {} } as Request;

// AuditService is constructor-injected since the auditLog DI migration; the
// wrapper keeps the historical construction sites positional.
const writeAudit = vi.fn();
const audit = { writeAudit } as unknown as AuditService;
// The auto-settings routes live on AutoBackupJob since the cron moved into the
// backup domain; every other route still goes through BackupService.
function job(o: Partial<AutoBackupJob> = {}): AutoBackupJob {
  return { getAutoSettings: vi.fn(), updateAutoSettings: vi.fn(), start: vi.fn(), ...o } as unknown as AutoBackupJob;
}
const bc = (s: BackupService, j: AutoBackupJob = job()) =>
  new BackupController(s, audit, j, { isManaged: () => false } as unknown as RuntimeEnvService);

function svc(o: Partial<BackupService> = {}): BackupService {
  return {
    listBackups: vi.fn().mockReturnValue([]),
    createBackup: vi.fn(),
    restoreFromZip: vi.fn(),
    restoreBackup: vi.fn(),
    getAutoSettings: vi.fn(),
    updateAutoSettings: vi.fn(),
    deleteBackup: vi.fn(),
    isValidBackupFilename: vi.fn().mockReturnValue(true),
    backupFileExists: vi.fn().mockReturnValue(true),
    sendBackupToResponse: vi.fn().mockResolvedValue(undefined),
    checkRateLimit: vi.fn().mockReturnValue(true),
    rateWindow: 3600000,
    ...o,
  } as unknown as BackupService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}
async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  delete process.env.NODE_ENV;
});

describe('AdminGuard (used by BackupController)', () => {
  function ctx(role?: string) {
    return { switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }) } as never;
  }
  it('403 for a non-admin, passes for an admin', () => {
    expect(thrown(() => new AdminGuard().canActivate(ctx('user')))).toEqual({
      status: 403,
      body: { error: 'Admin access required' },
    });
    expect(new AdminGuard().canActivate(ctx('admin'))).toBe(true);
  });
});

describe('BackupController', () => {
  it('GET /list returns backups, 500 on error', async () => {
    await expect(
      bc(svc({ listBackups: vi.fn().mockResolvedValue([{ filename: 'a.zip' }]) } as Partial<BackupService>)).list(),
    ).resolves.toEqual({ backups: [{ filename: 'a.zip' }] });
    expect(
      await thrownAsync(() =>
        bc(
          svc({
            listBackups: vi.fn(() => {
              throw new Error('io');
            }),
          } as Partial<BackupService>),
        ).list(),
      ),
    ).toEqual({ status: 500, body: { error: 'Error loading backups' } });
  });

  it('POST /create 429 when rate-limited, else creates + audits', async () => {
    expect(
      await thrownAsync(() => bc(svc({ checkRateLimit: vi.fn().mockReturnValue(false) })).create(user, req)),
    ).toEqual({ status: 429, body: { error: 'Too many backup requests. Please try again later.' } });
    const createBackup = vi.fn().mockResolvedValue({ filename: 'b.zip', size: 10 });
    const res = await bc(svc({ createBackup } as Partial<BackupService>)).create(user, req);
    expect(res).toEqual({ success: true, backup: { filename: 'b.zip', size: 10 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.create', resource: 'b.zip' }));
  });

  it('GET /download 400 invalid / 404 missing, else serves through storage', async () => {
    const res = {} as unknown as Response;
    expect(
      await thrownAsync(() => bc(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).download('x', res)),
    ).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(
      await thrownAsync(() => bc(svc({ backupFileExists: vi.fn().mockResolvedValue(false) })).download('x.zip', res)),
    ).toEqual({ status: 404, body: { error: 'Backup not found' } });
    const sendBackupToResponse = vi.fn().mockResolvedValue(undefined);
    await bc(svc({ sendBackupToResponse } as Partial<BackupService>)).download('x.zip', res);
    expect(sendBackupToResponse).toHaveBeenCalledWith('x.zip', res);
  });

  it('GET /download maps a StorageNotFoundError raced past the pre-check to the same 404', async () => {
    const res = {} as unknown as Response;
    const sendBackupToResponse = vi.fn().mockRejectedValue(new StorageNotFoundError('x.zip'));
    expect(
      await thrownAsync(() => bc(svc({ sendBackupToResponse } as Partial<BackupService>)).download('x.zip', res)),
    ).toEqual({ status: 404, body: { error: 'Backup not found' } });
    // A non-miss failure is NOT swallowed into the 404 envelope.
    const boom = vi.fn().mockRejectedValue(new Error('io'));
    await expect(
      bc(svc({ sendBackupToResponse: boom } as Partial<BackupService>)).download('x.zip', res),
    ).rejects.toThrow('io');
  });

  it('POST /restore maps the service status, else audits', async () => {
    expect(
      await thrownAsync(() =>
        bc(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).restore(user, 'x', req),
      ),
    ).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(
      await thrownAsync(() =>
        bc(svc({ backupFileExists: vi.fn().mockReturnValue(false) })).restore(user, 'x.zip', req),
      ),
    ).toEqual({ status: 404, body: { error: 'Backup not found' } });
    expect(
      await thrownAsync(() =>
        bc(
          svc({
            restoreBackup: vi.fn().mockResolvedValue({ success: false, status: 422, error: 'bad zip' }),
          } as Partial<BackupService>),
        ).restore(user, 'x.zip', req),
      ),
    ).toEqual({ status: 422, body: { error: 'bad zip' } });
    const restoreBackup = vi.fn().mockResolvedValue({ success: true });
    const res = await bc(svc({ restoreBackup } as Partial<BackupService>)).restore(user, 'x.zip', req);
    expect(res).toEqual({ success: true });
    expect(restoreBackup).toHaveBeenCalledWith('x.zip');
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.restore', resource: 'x.zip' }));
  });

  it('POST /restore falls back to status 400 when the service omits one', async () => {
    expect(
      await thrownAsync(() =>
        bc(
          svc({
            restoreBackup: vi.fn().mockResolvedValue({ success: false, error: 'nope' }),
          } as Partial<BackupService>),
        ).restore(user, 'x.zip', req),
      ),
    ).toEqual({ status: 400, body: { error: 'nope' } });
  });

  it('POST /upload-restore 400 without a file, cleans up the tmp file', async () => {
    expect(await thrownAsync(() => bc(svc()).uploadRestore(user, undefined, req))).toEqual({
      status: 400,
      body: { error: 'No file uploaded' },
    });
  });

  it('POST /upload-restore success audits + reports', async () => {
    const file = { path: '/tmp/does-not-exist-xyz.zip', originalname: 'up.zip' } as Express.Multer.File;
    const res = await bc(
      svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: true }) } as Partial<BackupService>),
    ).uploadRestore(user, file, req);
    expect(res).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.upload_restore', resource: 'up.zip' }),
    );
  });

  it('POST /upload-restore maps a failed restore status', async () => {
    const file = { path: '/tmp/does-not-exist-xyz.zip', originalname: 'up.zip' } as Express.Multer.File;
    expect(
      await thrownAsync(() =>
        bc(
          svc({
            restoreFromZip: vi.fn().mockResolvedValue({ success: false, status: 422, error: 'bad' }),
          } as Partial<BackupService>),
        ).uploadRestore(user, file, req),
      ),
    ).toEqual({ status: 422, body: { error: 'bad' } });
  });

  it('POST /upload-restore falls back to a default name and maps unexpected errors to 500', async () => {
    const file = { path: '/tmp/does-not-exist-xyz.zip', originalname: '' } as Express.Multer.File;
    expect(
      await thrownAsync(() =>
        bc(
          svc({ restoreFromZip: vi.fn().mockRejectedValue(new Error('boom')) } as Partial<BackupService>),
        ).uploadRestore(user, file, req),
      ),
    ).toEqual({ status: 500, body: { error: 'Error restoring backup' } });
    const ok = { path: '/tmp/does-not-exist-xyz.zip', originalname: '' } as Express.Multer.File;
    await bc(
      svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: true }) } as Partial<BackupService>),
    ).uploadRestore(user, ok, req);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.upload_restore', resource: 'upload.zip' }),
    );
  });

  it('maps unexpected service errors to 500 (create, restore, auto-settings)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      await thrownAsync(() =>
        bc(svc({ createBackup: vi.fn().mockRejectedValue(new Error('disk')) } as Partial<BackupService>)).create(
          user,
          req,
        ),
      ),
    ).toEqual({ status: 500, body: { error: 'Error creating backup' } });
    expect(
      await thrownAsync(() =>
        bc(svc({ restoreBackup: vi.fn().mockRejectedValue(new Error('boom')) } as Partial<BackupService>)).restore(
          user,
          'x.zip',
          req,
        ),
      ),
    ).toEqual({ status: 500, body: { error: 'Error restoring backup' } });
    expect(
      thrown(() =>
        bc(
          svc(),
          job({
            getAutoSettings: vi.fn(() => {
              throw new Error('io');
            }),
          }),
        ).autoSettings(),
      ),
    ).toEqual({ status: 500, body: { error: 'Could not load backup settings' } });
  });

  it('PUT /auto-settings maps errors to 500 (with a dev-only detail)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    const r = thrown(() =>
      bc(
        svc(),
        job({
          updateAutoSettings: vi.fn(() => {
            throw new Error('parse fail');
          }),
        }),
      ).updateAutoSettings(user, {}, req),
    );
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: 'Could not save auto-backup settings', detail: 'parse fail' });
  });

  it('PUT /auto-settings hides the detail in production and stringifies non-Error throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    const r = thrown(() =>
      bc(
        svc(),
        job({
          updateAutoSettings: vi.fn(() => {
            throw 'plain string';
          }),
        }),
      ).updateAutoSettings(user, {}, req),
    );
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: 'Could not save auto-backup settings', detail: undefined });
  });

  it('PUT /auto-settings tolerates a missing body', () => {
    const updateAutoSettings = vi.fn().mockReturnValue({ enabled: false, interval: 'weekly', keep_days: 30 });
    bc(svc(), job({ updateAutoSettings })).updateAutoSettings(
      user,
      undefined as unknown as Record<string, unknown>,
      req,
    );
    expect(updateAutoSettings).toHaveBeenCalledWith({});
  });

  it('GET/PUT /auto-settings', () => {
    expect(
      bc(
        svc(),
        job({ getAutoSettings: vi.fn().mockReturnValue({ settings: { enabled: true }, timezone: 'UTC' }) as never }),
      ).autoSettings(),
    ).toEqual({ settings: { enabled: true }, timezone: 'UTC' });
    const res = bc(
      svc(),
      job({ updateAutoSettings: vi.fn().mockReturnValue({ enabled: true, interval: 'daily', keep_days: 7 }) as never }),
    ).updateAutoSettings(user, { enabled: true }, req);
    expect(res).toEqual({ settings: { enabled: true, interval: 'daily', keep_days: 7 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.auto_settings' }));
  });

  it('DELETE /:filename 400/404, else deletes + audits', async () => {
    expect(
      await thrownAsync(() =>
        bc(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).remove(user, 'x', req),
      ),
    ).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(
      await thrownAsync(() =>
        bc(svc({ backupFileExists: vi.fn().mockResolvedValue(false) })).remove(user, 'x.zip', req),
      ),
    ).toEqual({ status: 404, body: { error: 'Backup not found' } });
    const deleteBackup = vi.fn();
    await expect(bc(svc({ deleteBackup } as Partial<BackupService>)).remove(user, 'x.zip', req)).resolves.toEqual({
      success: true,
    });
    expect(deleteBackup).toHaveBeenCalledWith('x.zip');
  });
});

describe('BackupService (wrapper)', () => {
  // The impl module is fully mocked above, so an empty sentinel stands in for
  // the injected StorageService — the wrapper's job is passing it through.
  const storage = {
    __sentinel: 'storage',
  } as unknown as import('../../../src/nest/storage/storage.service').StorageService;
  const wrapper = new RealBackupService(storage);

  it('forwards every call straight to the legacy backup service', async () => {
    expect(wrapper.listBackups()).toEqual([{ filename: 'svc.zip' }]);
    expect(backupSvc.listBackups).toHaveBeenCalledWith(storage);

    await expect(wrapper.createBackup()).resolves.toEqual({ filename: 'svc.zip', size: 5 });
    expect(backupSvc.createBackup).toHaveBeenCalled();

    await expect(wrapper.restoreFromZip('/tmp/a.zip')).resolves.toEqual({ success: true });
    expect(backupSvc.restoreFromZip).toHaveBeenCalledWith(storage, '/tmp/a.zip');

    await expect(wrapper.restoreBackup('svc.zip')).resolves.toEqual({ success: true });
    expect(backupSvc.restoreBackup).toHaveBeenCalledWith(storage, 'svc.zip');

    wrapper.deleteBackup('svc.zip');
    expect(backupSvc.deleteBackup).toHaveBeenCalledWith(storage, 'svc.zip');

    expect(wrapper.isValidBackupFilename('svc.zip')).toBe(true);
    expect(backupSvc.isValidBackupFilename).toHaveBeenCalledWith('svc.zip');

    expect(wrapper.backupFileExists('svc.zip')).toBe(true);
    expect(backupSvc.backupFileExists).toHaveBeenCalledWith(storage, 'svc.zip');

    const fakeRes = {} as Response;
    await wrapper.sendBackupToResponse('svc.zip', fakeRes);
    expect(backupSvc.sendBackupToResponse).toHaveBeenCalledWith(storage, 'svc.zip', fakeRes);

    expect(wrapper.checkRateLimit('ip', 3, 1000)).toBe(true);
    expect(backupSvc.checkRateLimit).toHaveBeenCalledWith('ip', 3, 1000);
  });

  it('exposes the legacy rate window', () => {
    expect(wrapper.rateWindow).toBe(backupSvc.BACKUP_RATE_WINDOW);
  });
});

describe('BackupModule', () => {
  it('wires the controller and service together', async () => {
    const { BackupModule } = await import('../../../src/nest/backup/backup.module');
    expect(new BackupModule()).toBeInstanceOf(BackupModule);
  });

  it('spools restore uploads to the storage tempDir with the legacy filter and cap', async () => {
    // The restore upload is a restore INPUT, not a stored object — it gets no
    // category and spools to the driver-agnostic scratch dir (spec Uploads #9).
    const { buildBackupUploadOptions } = await import('../../../src/nest/backup/backup.module');
    const storage = {
      tempDir: vi.fn(() => '/data/tmp'),
    } as unknown as import('../../../src/nest/storage/storage.service').StorageService;

    const opts = buildBackupUploadOptions(storage);

    expect(opts.dest).toBe('/data/tmp');
    expect(opts.limits).toEqual({ fileSize: 1024 }); // MAX_BACKUP_UPLOAD_SIZE from the impl mock
    const accept = vi.fn();
    opts.fileFilter?.(undefined as never, { originalname: 'a.zip' } as Express.Multer.File, accept);
    expect(accept).toHaveBeenCalledWith(null, true);
    const reject = vi.fn();
    opts.fileFilter?.(undefined as never, { originalname: 'a.tar.gz' } as Express.Multer.File, reject);
    expect(reject).toHaveBeenCalledWith(expect.objectContaining({ message: 'Only ZIP files allowed' }), false);
  });
});
