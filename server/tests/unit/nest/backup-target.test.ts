import { describe, it, expect, vi, beforeEach } from 'vitest';

const logInfo = vi.fn();
const logError = vi.fn();
const writeAudit = vi.fn();
vi.mock('../../../src/services/auditLog', () => ({
  logInfo: (...a: unknown[]) => logInfo(...a),
  logError: (...a: unknown[]) => logError(...a),
  writeAudit: (...a: unknown[]) => writeAudit(...a),
}));

const resolveS3Target = vi.fn();
vi.mock('../../../src/nest/backup/backup-target.config', () => ({
  resolveS3Target: () => resolveS3Target(),
  isTargetUsable: (c: { bucket: string; accessKeyId: string; secretAccessKey: string }) =>
    !!(c.bucket && c.accessKeyId && c.secretAccessKey),
}));

const uploadBackup = vi.fn();
const has = vi.fn();
const listRemote = vi.fn();
const downloadRemote = vi.fn();
vi.mock('../../../src/nest/backup/backup-target.s3', () => ({
  s3Target: (cfg: { bucket: string; accessKeyId: string; secretAccessKey: string }) => ({
    id: 's3',
    isConfigured: () => !!(cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey),
    upload: (...a: unknown[]) => uploadBackup(...a),
    has: (...a: unknown[]) => has(...a),
    test: vi.fn(),
  }),
  listRemote: (...a: unknown[]) => listRemote(...a),
  downloadRemote: (...a: unknown[]) => downloadRemote(...a),
}));

import { fetchRemoteBackup, listRemoteBackups, mirrorExistingBackups, onBackupWritten } from '../../../src/nest/backup/backup-target';

// A distinctive secret so the "never audited" assertion cannot pass by accident
// on a substring that happens to appear in the serialised call list.
const usable = { enabled: true, bucket: 'b', accessKeyId: 'k', secretAccessKey: 'sEcReT-must-not-leak' };

beforeEach(() => vi.clearAllMocks());

describe('onBackupWritten', () => {
  it('does nothing when no target is enabled', async () => {
    resolveS3Target.mockReturnValue({ ...usable, enabled: false });
    expect(await onBackupWritten('/b/x.zip')).toEqual({ attempted: false, uploaded: false });
    expect(uploadBackup).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('reports an enabled-but-incomplete target instead of silently skipping', async () => {
    resolveS3Target.mockReturnValue({ ...usable, secretAccessKey: '' });
    const res = await onBackupWritten('/b/x.zip');
    expect(res.attempted).toBe(true);
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/incomplete/i);
    expect(logError).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'backup.target_failed' }));
    expect(uploadBackup).not.toHaveBeenCalled();
  });

  it('audits a successful mirror', async () => {
    resolveS3Target.mockReturnValue(usable);
    uploadBackup.mockResolvedValue({ uploaded: true, key: 'backup-1.zip' });
    expect(await onBackupWritten('/b/backup-1.zip')).toEqual({ attempted: true, uploaded: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.target_uploaded', resource: 'backup-1.zip' }),
    );
  });

  it('surfaces an upload failure to the caller and the audit log', async () => {
    resolveS3Target.mockReturnValue(usable);
    uploadBackup.mockResolvedValue({ uploaded: false, key: 'backup-1.zip', error: 'Access denied.' });
    const res = await onBackupWritten('/b/backup-1.zip');
    expect(res).toEqual({ attempted: true, uploaded: false, error: 'Access denied.' });
    expect(logError).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.target_failed', details: expect.objectContaining({ error: 'Access denied.' }) }),
    );
  });

  it('never throws — a config read blowing up must not fail the local backup', async () => {
    resolveS3Target.mockImplementation(() => { throw new Error('db gone'); });
    const res = await onBackupWritten('/b/x.zip');
    expect(res).toEqual({ attempted: true, uploaded: false, error: 'db gone' });
    expect(logError).toHaveBeenCalled();
  });

  it('never lets the secret reach the audit log', async () => {
    resolveS3Target.mockReturnValue(usable);
    uploadBackup.mockResolvedValue({ uploaded: true, key: 'backup-1.zip' });
    await onBackupWritten('/b/backup-1.zip');
    expect(JSON.stringify(writeAudit.mock.calls)).not.toContain(usable.secretAccessKey);
  });
});

describe('mirrorExistingBackups', () => {
  it('refuses when no target is configured, without pretending success', async () => {
    resolveS3Target.mockReturnValue({ ...usable, enabled: false });
    const res = await mirrorExistingBackups(['/b/a.zip', '/b/b.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 0, failed: 2 });
    expect(res.errors[0]).toMatch(/not configured/i);
  });

  it('skips archives already at the target instead of re-transferring them', async () => {
    resolveS3Target.mockReturnValue(usable);
    has.mockImplementation((p: string) => Promise.resolve(p === '/b/old.zip'));
    uploadBackup.mockResolvedValue({ uploaded: true, key: 'new.zip' });

    const res = await mirrorExistingBackups(['/b/old.zip', '/b/new.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, skipped: 1, failed: 0 });
    expect(uploadBackup).toHaveBeenCalledTimes(1);
    expect(uploadBackup).toHaveBeenCalledWith('/b/new.zip');
  });

  it('keeps going after a failure and reports the count', async () => {
    resolveS3Target.mockReturnValue(usable);
    has.mockResolvedValue(false);
    uploadBackup
      .mockResolvedValueOnce({ uploaded: false, error: 'Access denied.' })
      .mockResolvedValueOnce({ uploaded: true, key: 'b.zip' });

    const res = await mirrorExistingBackups(['/b/a.zip', '/b/b.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, failed: 1 });
    expect(res.errors).toContain('Access denied.');
  });

  it('caps the collected errors so a mass failure stays readable', async () => {
    resolveS3Target.mockReturnValue(usable);
    has.mockResolvedValue(false);
    uploadBackup.mockResolvedValue({ uploaded: false, error: 'nope' });

    const res = await mirrorExistingBackups(Array.from({ length: 20 }, (_, i) => `/b/${i}.zip`));
    expect(res.failed).toBe(20);
    expect(res.errors.length).toBeLessThanOrEqual(3);
  });
});

describe('listRemoteBackups', () => {
  const isBackupName = (n: string) => n.endsWith('.zip');

  it('returns nothing when no target is enabled, without calling the target', async () => {
    resolveS3Target.mockReturnValue({ ...usable, enabled: false });
    expect(await listRemoteBackups(isBackupName)).toEqual({ backups: [] });
    expect(listRemote).not.toHaveBeenCalled();
  });

  it('degrades to an empty list plus an error when the bucket is unreachable', async () => {
    resolveS3Target.mockReturnValue(usable);
    listRemote.mockRejectedValue(new Error('bucket down'));
    // The local backups must still render — an unreachable target must never
    // hide the copies you do have.
    const res = await listRemoteBackups(isBackupName);
    expect(res.backups).toEqual([]);
    expect(res.error).toBe('bucket down');
    expect(logError).toHaveBeenCalled();
  });

  it('passes the archives through on success', async () => {
    resolveS3Target.mockReturnValue(usable);
    listRemote.mockResolvedValue([{ filename: 'backup-1.zip', size: 5, created_at: 'x' }]);
    expect((await listRemoteBackups(isBackupName)).backups).toHaveLength(1);
  });
});

describe('fetchRemoteBackup', () => {
  it('refuses when no target is enabled rather than writing an empty file', async () => {
    resolveS3Target.mockReturnValue({ ...usable, enabled: false });
    await expect(fetchRemoteBackup('backup-1.zip', '/tmp/x.zip')).rejects.toThrow(/not configured/i);
    expect(downloadRemote).not.toHaveBeenCalled();
  });

  it('streams the archive to the given path', async () => {
    resolveS3Target.mockReturnValue(usable);
    downloadRemote.mockResolvedValue(undefined);
    await fetchRemoteBackup('backup-1.zip', '/tmp/x.zip');
    expect(downloadRemote).toHaveBeenCalledWith('backup-1.zip', '/tmp/x.zip', usable);
  });
});
