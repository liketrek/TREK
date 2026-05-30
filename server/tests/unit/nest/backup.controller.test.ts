import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));
// The controller imports the tmp-dir + size cap at module load.
vi.mock('../../../src/services/backupService', () => ({ getUploadTmpDir: () => '/tmp', MAX_BACKUP_UPLOAD_SIZE: 1024 }));

import { BackupController } from '../../../src/nest/backup/backup.controller';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';
import type { BackupService } from '../../../src/nest/backup/backup.service';
import { writeAudit } from '../../../src/services/auditLog';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'admin', email: 'a@example.test' } as User;
const req = { ip: '1.2.3.4', headers: {} } as Request;

function svc(o: Partial<BackupService> = {}): BackupService {
  return {
    listBackups: vi.fn().mockReturnValue([]),
    createBackup: vi.fn(),
    restoreFromZip: vi.fn(),
    getAutoSettings: vi.fn(),
    updateAutoSettings: vi.fn(),
    deleteBackup: vi.fn(),
    isValidBackupFilename: vi.fn().mockReturnValue(true),
    backupFilePath: vi.fn().mockReturnValue('/b/x.zip'),
    backupFileExists: vi.fn().mockReturnValue(true),
    checkRateLimit: vi.fn().mockReturnValue(true),
    rateWindow: 3600000,
    ...o,
  } as unknown as BackupService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}
async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => { delete process.env.NODE_ENV; });

describe('AdminGuard (used by BackupController)', () => {
  function ctx(role?: string) {
    return { switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }) } as never;
  }
  it('403 for a non-admin, passes for an admin', () => {
    expect(thrown(() => new AdminGuard().canActivate(ctx('user')))).toEqual({ status: 403, body: { error: 'Admin access required' } });
    expect(new AdminGuard().canActivate(ctx('admin'))).toBe(true);
  });
});

describe('BackupController', () => {
  it('GET /list returns backups, 500 on error', () => {
    expect(new BackupController(svc({ listBackups: vi.fn().mockReturnValue([{ filename: 'a.zip' }]) } as Partial<BackupService>)).list()).toEqual({ backups: [{ filename: 'a.zip' }] });
    expect(thrown(() => new BackupController(svc({ listBackups: vi.fn(() => { throw new Error('io'); }) } as Partial<BackupService>)).list())).toEqual({ status: 500, body: { error: 'Error loading backups' } });
  });

  it('POST /create 429 when rate-limited, else creates + audits', async () => {
    expect(await thrownAsync(() => new BackupController(svc({ checkRateLimit: vi.fn().mockReturnValue(false) })).create(user, req))).toEqual({ status: 429, body: { error: 'Too many backup requests. Please try again later.' } });
    const createBackup = vi.fn().mockResolvedValue({ filename: 'b.zip', size: 10 });
    const res = await new BackupController(svc({ createBackup } as Partial<BackupService>)).create(user, req);
    expect(res).toEqual({ success: true, backup: { filename: 'b.zip', size: 10 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.create', resource: 'b.zip' }));
  });

  it('GET /download 400 invalid / 404 missing, else res.download', () => {
    const res = { download: vi.fn() } as unknown as Response;
    expect(thrown(() => new BackupController(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).download('x', res))).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(thrown(() => new BackupController(svc({ backupFileExists: vi.fn().mockReturnValue(false) })).download('x.zip', res))).toEqual({ status: 404, body: { error: 'Backup not found' } });
    new BackupController(svc()).download('x.zip', res);
    expect(res.download).toHaveBeenCalledWith('/b/x.zip', 'x.zip');
  });

  it('POST /restore maps the service status, else audits', async () => {
    expect(await thrownAsync(() => new BackupController(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).restore(user, 'x', req))).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(await thrownAsync(() => new BackupController(svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: false, status: 422, error: 'bad zip' }) } as Partial<BackupService>)).restore(user, 'x.zip', req))).toEqual({ status: 422, body: { error: 'bad zip' } });
    const res = await new BackupController(svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: true }) } as Partial<BackupService>)).restore(user, 'x.zip', req);
    expect(res).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.restore', resource: 'x.zip' }));
  });

  it('POST /upload-restore 400 without a file, cleans up the tmp file', async () => {
    expect(await thrownAsync(() => new BackupController(svc()).uploadRestore(user, undefined, req))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
  });

  it('POST /upload-restore success audits + reports', async () => {
    const file = { path: '/tmp/does-not-exist-xyz.zip', originalname: 'up.zip' } as Express.Multer.File;
    const res = await new BackupController(svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: true }) } as Partial<BackupService>)).uploadRestore(user, file, req);
    expect(res).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.upload_restore', resource: 'up.zip' }));
  });

  it('POST /upload-restore maps a failed restore status', async () => {
    const file = { path: '/tmp/does-not-exist-xyz.zip', originalname: 'up.zip' } as Express.Multer.File;
    expect(await thrownAsync(() => new BackupController(svc({ restoreFromZip: vi.fn().mockResolvedValue({ success: false, status: 422, error: 'bad' }) } as Partial<BackupService>)).uploadRestore(user, file, req))).toEqual({ status: 422, body: { error: 'bad' } });
  });

  it('maps unexpected service errors to 500 (create, restore, auto-settings)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await thrownAsync(() => new BackupController(svc({ createBackup: vi.fn().mockRejectedValue(new Error('disk')) } as Partial<BackupService>)).create(user, req))).toEqual({ status: 500, body: { error: 'Error creating backup' } });
    expect(await thrownAsync(() => new BackupController(svc({ restoreFromZip: vi.fn().mockRejectedValue(new Error('boom')) } as Partial<BackupService>)).restore(user, 'x.zip', req))).toEqual({ status: 500, body: { error: 'Error restoring backup' } });
    expect(thrown(() => new BackupController(svc({ getAutoSettings: vi.fn(() => { throw new Error('io'); }) } as Partial<BackupService>)).autoSettings())).toEqual({ status: 500, body: { error: 'Could not load backup settings' } });
  });

  it('PUT /auto-settings maps errors to 500 (with a dev-only detail)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    const r = thrown(() => new BackupController(svc({ updateAutoSettings: vi.fn(() => { throw new Error('parse fail'); }) } as Partial<BackupService>)).updateAutoSettings(user, {}, req));
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: 'Could not save auto-backup settings', detail: 'parse fail' });
  });

  it('GET/PUT /auto-settings', () => {
    expect(new BackupController(svc({ getAutoSettings: vi.fn().mockReturnValue({ settings: { enabled: true }, timezone: 'UTC' }) } as Partial<BackupService>)).autoSettings()).toEqual({ settings: { enabled: true }, timezone: 'UTC' });
    const res = new BackupController(svc({ updateAutoSettings: vi.fn().mockReturnValue({ enabled: true, interval: 'daily', keep_days: 7 }) } as Partial<BackupService>)).updateAutoSettings(user, { enabled: true }, req);
    expect(res).toEqual({ settings: { enabled: true, interval: 'daily', keep_days: 7 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.auto_settings' }));
  });

  it('DELETE /:filename 400/404, else deletes + audits', () => {
    expect(thrown(() => new BackupController(svc({ isValidBackupFilename: vi.fn().mockReturnValue(false) })).remove(user, 'x', req))).toEqual({ status: 400, body: { error: 'Invalid filename' } });
    expect(thrown(() => new BackupController(svc({ backupFileExists: vi.fn().mockReturnValue(false) })).remove(user, 'x.zip', req))).toEqual({ status: 404, body: { error: 'Backup not found' } });
    const deleteBackup = vi.fn();
    expect(new BackupController(svc({ deleteBackup } as Partial<BackupService>)).remove(user, 'x.zip', req)).toEqual({ success: true });
    expect(deleteBackup).toHaveBeenCalledWith('x.zip');
  });
});
