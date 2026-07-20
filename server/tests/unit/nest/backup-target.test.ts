import { describe, it, expect, vi, beforeEach } from 'vitest';

const logInfo = vi.fn();
const logError = vi.fn();
const writeAudit = vi.fn();
vi.mock('../../../src/services/auditLog', () => ({
  logInfo: (...a: unknown[]) => logInfo(...a),
  logError: (...a: unknown[]) => logError(...a),
  writeAudit: (...a: unknown[]) => writeAudit(...a),
}));

const rmSync = vi.fn();
vi.mock('node:fs', () => ({ default: { rmSync: (...a: unknown[]) => rmSync(...a) } }));

const resolveTarget = vi.fn();
vi.mock('../../../src/nest/backup/backup-target.config', () => ({
  resolveTarget: () => resolveTarget(),
  isS3Usable: () => true,
}));

/** A controllable stand-in for a backend. */
function fakeBackend(id: string) {
  return {
    id,
    isConfigured: vi.fn(() => true),
    upload: vi.fn(async () => ({ uploaded: true, key: `${id}-key` })),
    has: vi.fn(async () => false),
    remove: vi.fn(async () => undefined),
    list: vi.fn(async () => [] as unknown[]),
    download: vi.fn(async () => undefined),
    test: vi.fn(async () => ({ success: true })),
  };
}
const local = fakeBackend('local');
const s3 = fakeBackend('s3');

vi.mock('../../../src/nest/backup/backup-target.local', () => ({ localTarget: () => local }));
vi.mock('../../../src/nest/backup/backup-target.s3', () => ({ s3Target: () => s3 }));

import {
  deleteEverywhere,
  enabledTargets,
  existsAnywhere,
  fetchBackup,
  listAllBackups,
  mirrorExistingBackups,
  onBackupWritten,
  testConfiguredTargets,
} from '../../../src/nest/backup/backup-target';

const bothOn = { localEnabled: true, s3Enabled: true };
const localOnly = { localEnabled: true, s3Enabled: false };
const s3Only = { localEnabled: false, s3Enabled: true };
const allOff = { localEnabled: false, s3Enabled: false };

function reset(backend: ReturnType<typeof fakeBackend>, id: string) {
  backend.isConfigured.mockReturnValue(true);
  backend.upload.mockResolvedValue({ uploaded: true, key: `${id}-key` });
  backend.has.mockResolvedValue(false);
  backend.remove.mockResolvedValue(undefined);
  backend.list.mockResolvedValue([]);
  backend.download.mockResolvedValue(undefined);
  backend.test.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  reset(local, 'local');
  reset(s3, 's3');
  resolveTarget.mockReturnValue(bothOn);
});

describe('enabledTargets', () => {
  it('returns nothing when every backend is off', () => {
    resolveTarget.mockReturnValue(allOff);
    expect(enabledTargets()).toEqual([]);
  });

  it('returns each enabled backend, local first', () => {
    expect(enabledTargets().map(t => t.id)).toEqual(['local', 's3']);
    resolveTarget.mockReturnValue(s3Only);
    expect(enabledTargets().map(t => t.id)).toEqual(['s3']);
  });
});

describe('onBackupWritten', () => {
  it('does nothing when only the local backend is on', () => {
    // The builder already wrote into the local directory; copying it onto
    // itself would be pointless work on a multi-gigabyte file.
    resolveTarget.mockReturnValue(localOnly);
    return onBackupWritten('/b/x.zip').then(res => {
      expect(res).toEqual({ attempted: false, uploaded: false });
      expect(local.upload).not.toHaveBeenCalled();
    });
  });

  it('uploads to every enabled backend except local', async () => {
    expect(await onBackupWritten('/b/backup-1.zip')).toEqual({ attempted: true, uploaded: true });
    expect(s3.upload).toHaveBeenCalledWith('/b/backup-1.zip');
    expect(local.upload).not.toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'backup.target_uploaded', details: { target: 's3' } }),
    );
  });

  it('reports an enabled-but-incomplete backend instead of skipping it silently', async () => {
    s3.isConfigured.mockReturnValue(false);
    const res = await onBackupWritten('/b/x.zip');
    expect(res.attempted).toBe(true);
    expect(res.error).toMatch(/incomplete/i);
    expect(logError).toHaveBeenCalled();
  });

  it('surfaces an upload failure', async () => {
    s3.upload.mockResolvedValue({ uploaded: false, key: 'k', error: 'Access denied.' });
    const res = await onBackupWritten('/b/x.zip');
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/Access denied/);
  });

  it('never throws — a config read blowing up must not fail the backup', async () => {
    resolveTarget.mockImplementation(() => { throw new Error('db gone'); });
    expect(await onBackupWritten('/b/x.zip')).toEqual({ attempted: true, uploaded: false, error: 'db gone' });
  });

  describe('when the local backend is switched off', () => {
    it('removes the staged archive once another backend has it', async () => {
      resolveTarget.mockReturnValue(s3Only);
      await onBackupWritten('/b/x.zip');
      expect(rmSync).toHaveBeenCalledWith('/b/x.zip', { force: true });
    });

    it('keeps the archive when no backend took it', async () => {
      // Deleting here would destroy the only copy that exists.
      resolveTarget.mockReturnValue(s3Only);
      s3.upload.mockResolvedValue({ uploaded: false, error: 'nope' });
      await onBackupWritten('/b/x.zip');
      expect(rmSync).not.toHaveBeenCalled();
    });
  });
});

describe('listAllBackups', () => {
  const isBackupName = () => true;

  it('unions the backends and records where each archive lives', async () => {
    local.list.mockResolvedValue([
      { filename: 'a.zip', size: 1, created_at: 'x' },
      { filename: 'both.zip', size: 2, created_at: 'y' },
    ]);
    s3.list.mockResolvedValue([
      { filename: 'both.zip', size: 2, created_at: 'y' },
      { filename: 'c.zip', size: 3, created_at: 'z' },
    ]);

    const { backups } = await listAllBackups(isBackupName);
    expect([...backups.keys()].sort()).toEqual(['a.zip', 'both.zip', 'c.zip']);
    expect([...backups.get('both.zip')!.targets].sort()).toEqual(['local', 's3']);
    expect([...backups.get('c.zip')!.targets]).toEqual(['s3']);
  });

  it('keeps the backends that answered when one fails', async () => {
    // Losing sight of the copies you still have is the worst possible response
    // to a network fault.
    local.list.mockResolvedValue([{ filename: 'a.zip', size: 1, created_at: 'x' }]);
    s3.list.mockRejectedValue(new Error('bucket down'));

    const { backups, error } = await listAllBackups(isBackupName);
    expect([...backups.keys()]).toEqual(['a.zip']);
    expect(error).toBe('bucket down');
    expect(logError).toHaveBeenCalled();
  });
});

describe('deleteEverywhere', () => {
  it('removes the archive from every backend that has it', async () => {
    local.has.mockResolvedValue(true);
    s3.has.mockResolvedValue(true);
    const res = await deleteEverywhere('x.zip');
    expect(res.deleted.sort()).toEqual(['local', 's3']);
    expect(res.error).toBeUndefined();
  });

  it('skips a backend that does not have it', async () => {
    local.has.mockResolvedValue(true);
    s3.has.mockResolvedValue(false);
    await deleteEverywhere('x.zip');
    expect(s3.remove).not.toHaveBeenCalled();
  });

  it('reports the backends that refused while keeping the ones that worked', async () => {
    local.has.mockResolvedValue(true);
    s3.has.mockResolvedValue(true);
    s3.remove.mockRejectedValue(new Error('Access denied.'));
    const res = await deleteEverywhere('x.zip');
    expect(res.deleted).toEqual(['local']);
    expect(res.error).toMatch(/s3: Access denied/);
  });
});

describe('existsAnywhere', () => {
  it('is true when any backend has it', async () => {
    s3.has.mockResolvedValue(true);
    expect(await existsAnywhere('x.zip')).toBe(true);
  });

  it('is false when none does', async () => {
    expect(await existsAnywhere('x.zip')).toBe(false);
  });

  it('keeps asking after a backend throws', async () => {
    local.has.mockRejectedValue(new Error('boom'));
    s3.has.mockResolvedValue(true);
    expect(await existsAnywhere('x.zip')).toBe(true);
  });
});

describe('fetchBackup', () => {
  it('prefers the local copy — a file copy beats a download', async () => {
    local.has.mockResolvedValue(true);
    s3.has.mockResolvedValue(true);
    await fetchBackup('x.zip', '/tmp/x.zip');
    expect(local.download).toHaveBeenCalledWith('x.zip', '/tmp/x.zip');
    expect(s3.download).not.toHaveBeenCalled();
  });

  it('falls through to the next backend', async () => {
    local.has.mockResolvedValue(false);
    s3.has.mockResolvedValue(true);
    await fetchBackup('x.zip', '/tmp/x.zip');
    expect(s3.download).toHaveBeenCalled();
  });

  it('throws when nothing holds it, rather than leaving an empty file', async () => {
    await expect(fetchBackup('x.zip', '/tmp/x.zip')).rejects.toThrow(/No backend holds/i);
  });
});

describe('testConfiguredTargets', () => {
  it('says so when nothing is enabled', async () => {
    resolveTarget.mockReturnValue(allOff);
    const res = await testConfiguredTargets();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no storage backend/i);
  });

  it('fails if any backend fails, naming it', async () => {
    s3.test.mockResolvedValue({ success: false, error: 'bucket gone' });
    const res = await testConfiguredTargets();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/s3: bucket gone/);
  });

  it('passes a warning through without failing the test', async () => {
    s3.test.mockResolvedValue({ success: true, error: 'cannot prune' });
    const res = await testConfiguredTargets();
    expect(res.success).toBe(true);
    expect(res.error).toMatch(/cannot prune/);
  });
});

describe('mirrorExistingBackups', () => {
  it('refuses when only the local backend is on', async () => {
    resolveTarget.mockReturnValue(localOnly);
    const res = await mirrorExistingBackups(['/b/a.zip']);
    expect(res).toMatchObject({ total: 1, uploaded: 0, failed: 1 });
    expect(res.errors[0]).toMatch(/beyond the local one/i);
  });

  it('skips archives the backend already has', async () => {
    s3.has.mockImplementation(async (p: string) => p === '/b/old.zip');
    const res = await mirrorExistingBackups(['/b/old.zip', '/b/new.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, skipped: 1, failed: 0 });
    expect(s3.upload).toHaveBeenCalledTimes(1);
  });

  it('counts a failure and keeps going', async () => {
    s3.upload
      .mockResolvedValueOnce({ uploaded: false, error: 'Access denied.' })
      .mockResolvedValueOnce({ uploaded: true, key: 'k' });
    const res = await mirrorExistingBackups(['/b/a.zip', '/b/b.zip']);
    expect(res).toMatchObject({ total: 2, uploaded: 1, failed: 1 });
  });

  it('caps the collected errors so a mass failure stays readable', async () => {
    s3.upload.mockResolvedValue({ uploaded: false, error: 'nope' });
    const res = await mirrorExistingBackups(Array.from({ length: 20 }, (_, i) => `/b/${i}.zip`));
    expect(res.failed).toBe(20);
    expect(res.errors.length).toBeLessThanOrEqual(3);
  });
});
