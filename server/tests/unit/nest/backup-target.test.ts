import { describe, it, expect, vi, beforeEach } from 'vitest';

const logInfo = vi.fn();
const logError = vi.fn();
const writeAudit = vi.fn();
vi.mock('../../../src/services/auditLog', () => ({
  logInfo: (...a: unknown[]) => logInfo(...a),
  logError: (...a: unknown[]) => logError(...a),
  writeAudit: (...a: unknown[]) => writeAudit(...a),
}));

const resolveTarget = vi.fn();
vi.mock('../../../src/nest/backup/backup-target.config', () => ({
  resolveTarget: () => resolveTarget(),
}));

// Both backends are stubbed with the same controllable fake, so these tests
// exercise the dispatcher and the shared behaviour rather than either backend.
const backend = {
  isConfigured: vi.fn(),
  upload: vi.fn(),
  has: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  download: vi.fn(),
  test: vi.fn(),
};
vi.mock('../../../src/nest/backup/backup-target.s3', () => ({
  s3Target: () => ({ ...backend, id: 's3' }),
}));
vi.mock('../../../src/nest/backup/backup-target.local', () => ({
  localTarget: () => ({ ...backend, id: 'local' }),
}));

import {
  deleteRemoteBackup,
  fetchRemoteBackup,
  listRemoteBackups,
  mirrorExistingBackups,
  onBackupWritten,
  remoteBackupExists,
  targetFor,
  testConfiguredTarget,
} from '../../../src/nest/backup/backup-target';

const SECRET = 'sEcReT-must-not-leak';
const s3Cfg = { type: 's3', bucket: 'b', accessKeyId: 'k', secretAccessKey: SECRET };
const localCfg = { type: 'local', localPath: '/mnt/nas' };
const offCfg = { type: 'none' };

beforeEach(() => {
  vi.clearAllMocks();
  backend.isConfigured.mockReturnValue(true);
});

describe('targetFor — backend selection', () => {
  it('returns nothing when the target is off', () => {
    resolveTarget.mockReturnValue(offCfg);
    expect(targetFor(() => true)).toBeNull();
  });

  it('selects the backend named by the configured type', () => {
    resolveTarget.mockReturnValue(s3Cfg);
    expect(targetFor(() => true)?.id).toBe('s3');
    resolveTarget.mockReturnValue(localCfg);
    expect(targetFor(() => true)?.id).toBe('local');
  });
});

describe('onBackupWritten', () => {
  it('does nothing when no target is configured', async () => {
    resolveTarget.mockReturnValue(offCfg);
    expect(await onBackupWritten('/b/x.zip')).toEqual({ attempted: false, uploaded: false });
    expect(backend.upload).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('reports a selected-but-incomplete target instead of silently skipping', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.isConfigured.mockReturnValue(false);
    const res = await onBackupWritten('/b/x.zip');
    expect(res.attempted).toBe(true);
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/incomplete/i);
    expect(logError).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.target_failed' }));
    expect(backend.upload).not.toHaveBeenCalled();
  });

  it('audits a successful mirror, naming the backend', async () => {
    resolveTarget.mockReturnValue(localCfg);
    backend.upload.mockResolvedValue({ uploaded: true, key: '/mnt/nas/backup-1.zip' });
    expect(await onBackupWritten('/b/backup-1.zip')).toEqual({ attempted: true, uploaded: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.target_uploaded', details: { target: 'local' } }),
    );
  });

  it('surfaces an upload failure to the caller and the audit log', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.upload.mockResolvedValue({ uploaded: false, key: 'backup-1.zip', error: 'Access denied.' });
    const res = await onBackupWritten('/b/backup-1.zip');
    expect(res).toEqual({ attempted: true, uploaded: false, error: 'Access denied.' });
    expect(logError).toHaveBeenCalled();
  });

  it('never throws — a config read blowing up must not fail the local backup', async () => {
    resolveTarget.mockImplementation(() => { throw new Error('db gone'); });
    expect(await onBackupWritten('/b/x.zip')).toEqual({ attempted: true, uploaded: false, error: 'db gone' });
    expect(logError).toHaveBeenCalled();
  });

  it('never lets the S3 secret reach the audit log', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.upload.mockResolvedValue({ uploaded: true, key: 'backup-1.zip' });
    await onBackupWritten('/b/backup-1.zip');
    expect(JSON.stringify(writeAudit.mock.calls)).not.toContain(SECRET);
  });
});

describe('mirrorExistingBackups', () => {
  it('refuses when no target is configured, without pretending success', async () => {
    resolveTarget.mockReturnValue(offCfg);
    const res = await mirrorExistingBackups(['/b/a.zip', '/b/b.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 0, failed: 2 });
    expect(res.errors[0]).toMatch(/no external backup target/i);
  });

  it('skips archives already at the target instead of re-transferring them', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.has.mockImplementation((p: string) => Promise.resolve(p === '/b/old.zip'));
    backend.upload.mockResolvedValue({ uploaded: true, key: 'new.zip' });

    const res = await mirrorExistingBackups(['/b/old.zip', '/b/new.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, skipped: 1, failed: 0 });
    expect(backend.upload).toHaveBeenCalledTimes(1);
    expect(backend.upload).toHaveBeenCalledWith('/b/new.zip');
  });

  it('keeps going after a failure and reports the count', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.has.mockResolvedValue(false);
    backend.upload
      .mockResolvedValueOnce({ uploaded: false, error: 'Access denied.' })
      .mockResolvedValueOnce({ uploaded: true, key: 'b.zip' });

    const res = await mirrorExistingBackups(['/b/a.zip', '/b/b.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, failed: 1 });
    expect(res.errors).toContain('Access denied.');
  });

  it('caps the collected errors so a mass failure stays readable', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.has.mockResolvedValue(false);
    backend.upload.mockResolvedValue({ uploaded: false, error: 'nope' });

    const res = await mirrorExistingBackups(Array.from({ length: 20 }, (_, i) => `/b/${i}.zip`));
    expect(res.failed).toBe(20);
    expect(res.errors.length).toBeLessThanOrEqual(3);
  });
});

describe('listRemoteBackups', () => {
  const isBackupName = (n: string) => n.endsWith('.zip');

  it('returns nothing when no target is configured, without calling a backend', async () => {
    resolveTarget.mockReturnValue(offCfg);
    expect(await listRemoteBackups(isBackupName)).toEqual({ backups: [] });
    expect(backend.list).not.toHaveBeenCalled();
  });

  it('degrades to an empty list plus an error when the target is unreachable', async () => {
    // The local backups must still render — an unreachable target must never
    // hide the copies you do have.
    resolveTarget.mockReturnValue(s3Cfg);
    backend.list.mockRejectedValue(new Error('bucket down'));
    const res = await listRemoteBackups(isBackupName);
    expect(res.backups).toEqual([]);
    expect(res.error).toBe('bucket down');
    expect(logError).toHaveBeenCalled();
  });

  it('passes the archives through on success', async () => {
    resolveTarget.mockReturnValue(localCfg);
    backend.list.mockResolvedValue([{ filename: 'backup-1.zip', size: 5, created_at: 'x' }]);
    expect((await listRemoteBackups(isBackupName)).backups).toHaveLength(1);
  });
});

describe('deleteRemoteBackup', () => {
  it('is a no-op when no target is configured', async () => {
    resolveTarget.mockReturnValue(offCfg);
    expect(await deleteRemoteBackup('x.zip')).toEqual({ deleted: false });
    expect(backend.remove).not.toHaveBeenCalled();
  });

  it('reports a target that refused the delete rather than throwing', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.remove.mockRejectedValue(new Error('Access denied.'));
    expect(await deleteRemoteBackup('x.zip')).toEqual({ deleted: false, error: 'Access denied.' });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.target_failed' }));
  });

  it('audits a successful delete', async () => {
    resolveTarget.mockReturnValue(localCfg);
    backend.remove.mockResolvedValue(undefined);
    expect(await deleteRemoteBackup('x.zip')).toEqual({ deleted: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.target_deleted' }));
  });
});

describe('remoteBackupExists', () => {
  it('answers false when no target is configured', async () => {
    resolveTarget.mockReturnValue(offCfg);
    expect(await remoteBackupExists('x.zip')).toBe(false);
  });

  it('answers false when the check itself fails, rather than throwing', async () => {
    resolveTarget.mockReturnValue(s3Cfg);
    backend.has.mockRejectedValue(new Error('boom'));
    expect(await remoteBackupExists('x.zip')).toBe(false);
  });
});

describe('fetchRemoteBackup', () => {
  it('refuses when no target is configured rather than writing an empty file', async () => {
    resolveTarget.mockReturnValue(offCfg);
    await expect(fetchRemoteBackup('backup-1.zip', '/tmp/x.zip')).rejects.toThrow(/no external backup target/i);
    expect(backend.download).not.toHaveBeenCalled();
  });

  it('streams the archive to the given path', async () => {
    resolveTarget.mockReturnValue(localCfg);
    backend.download.mockResolvedValue(undefined);
    await fetchRemoteBackup('backup-1.zip', '/tmp/x.zip');
    expect(backend.download).toHaveBeenCalledWith('backup-1.zip', '/tmp/x.zip');
  });
});

describe('testConfiguredTarget', () => {
  it('reports that nothing is configured instead of a bare failure', async () => {
    resolveTarget.mockReturnValue(offCfg);
    const res = await testConfiguredTarget();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no external backup target/i);
  });

  it('delegates to the configured backend', async () => {
    resolveTarget.mockReturnValue(localCfg);
    backend.test.mockResolvedValue({ success: true });
    expect(await testConfiguredTarget()).toEqual({ success: true });
  });
});
