/**
 * Unit tests for backupService.
 * Covers BACKUP-031 to BACKUP-060.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks — must be defined before any vi.mock() calls
// ---------------------------------------------------------------------------

const fsMock = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  createWriteStream: vi.fn(),
  unlinkSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
  createReadStream: vi.fn(),
  rmSync: vi.fn(),
  copyFileSync: vi.fn(),
  renameSync: vi.fn(),
  cpSync: vi.fn(),
  // Identity by default: when uploadsDir is a plain directory, realpathSync
  // returns it unchanged. Tests that exercise the symlink case override this.
  realpathSync: vi.fn((p: string) => p),
}));

const archiverInstanceMock = vi.hoisted(() => ({
  pipe: vi.fn(),
  file: vi.fn(),
  directory: vi.fn(),
  glob: vi.fn(),
  finalize: vi.fn(),
  on: vi.fn(),
}));

const archiverMock = vi.hoisted(() => vi.fn());

const unzipperMock = vi.hoisted(() => ({
  Extract: vi.fn(),
  // Central-directory reader used for the pre-extract zip-bomb size check.
  // Default to an empty archive so existing restore tests proceed to Extract.
  Open: { file: vi.fn().mockResolvedValue({ files: [] }) },
}));

const dbMock = vi.hoisted(() => ({
  db: {
    exec: vi.fn(),
    prepare: vi.fn(),
  },
  closeDb: vi.fn(),
  reinitialize: vi.fn(),
  getPlaceWithTags: vi.fn(),
  canAccessTrip: vi.fn(),
  isOwner: vi.fn(),
}));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));
vi.mock('fs', () => ({ default: fsMock, ...fsMock }));
vi.mock('archiver', () => ({ default: archiverMock }));
vi.mock('unzipper', () => ({ default: unzipperMock }));
import {
  formatSize,
  parseIntField,
  parseAutoBackupBody,
  isValidBackupFilename,
  checkRateLimit,
  createBackup,
  deleteBackup,
  restoreFromZip,
  restoreBackup,
  BACKUP_RATE_WINDOW,
  backupFileExists,
  listBackups,
  sendBackupToResponse,
} from '../../../src/nest/backup/backup.impl';
import type { StorageService } from '../../../src/nest/storage/storage.service';

// ---------------------------------------------------------------------------
// Storage stub — backup.impl functions receive StorageService as a parameter
// (BackupService injects it and forwards). This file mocks fs wholesale, so a
// real LocalDriver would see the mocked fs: use plain stub objects instead.
// ---------------------------------------------------------------------------

function stubStorage(overrides: Record<string, unknown> = {}): StorageService {
  return {
    // async generator; tests override with listOf(...) entries
    list: vi.fn(async function* () {}),
    stat: vi.fn(async () => null),
    exists: vi.fn(async () => false),
    delete: vi.fn(async () => {}),
    put: vi.fn(async () => {}),
    getStream: vi.fn(),
    sendToResponse: vi.fn(async () => {}),
    withLocalFile: vi.fn(async (_c: string, _k: string, fn: (p: string) => Promise<unknown>) => fn('/stub/local/path')),
    // Default: every object has a local path (the zero-copy default-install branch).
    getLocalPathOrNull: vi.fn(async () => '/stub/local/path'),
    spoolDirFor: vi.fn(() => '/stub/spool'),
    tempDir: vi.fn(() => '/stub/tmp'),
    health: vi.fn(() => ({ replicaFailures: [] })),
    reloadConfig: vi.fn(),
    ...overrides,
  } as unknown as StorageService;
}

const listOf = (entries: Array<{ key: string; size?: number; mtimeMs?: number }>) =>
  vi.fn(async function* () {
    for (const e of entries) yield { size: 0, mtimeMs: 0, ...e };
  });

// ---------------------------------------------------------------------------
// formatSize
// ---------------------------------------------------------------------------

describe('BACKUP-031 formatSize', () => {
  it('formats bytes < 1024 as B', () => {
    expect(formatSize(500)).toBe('500 B');
  });

  it('formats bytes in KB range', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(2048)).toBe('2.0 KB');
  });

  it('formats bytes in MB range', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('boundary: exactly 1024 bytes is 1.0 KB', () => {
    expect(formatSize(1023)).toBe('1023 B');
    expect(formatSize(1024)).toBe('1.0 KB');
  });
});

// ---------------------------------------------------------------------------
// parseIntField
// ---------------------------------------------------------------------------

describe('BACKUP-032 parseIntField', () => {
  it('returns numeric value as-is when finite', () => {
    expect(parseIntField(5, 99)).toBe(5);
  });

  it('floors float numbers', () => {
    expect(parseIntField(7.9, 0)).toBe(7);
  });

  it('parses numeric strings', () => {
    expect(parseIntField('12', 0)).toBe(12);
  });

  it('returns fallback for non-numeric string', () => {
    expect(parseIntField('abc', 3)).toBe(3);
  });

  it('returns fallback for null', () => {
    expect(parseIntField(null, 7)).toBe(7);
  });

  it('returns fallback for undefined', () => {
    expect(parseIntField(undefined, 7)).toBe(7);
  });

  it('returns fallback for Infinity', () => {
    expect(parseIntField(Infinity, 5)).toBe(5);
  });

  it('returns fallback for empty string', () => {
    expect(parseIntField('', 4)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// parseAutoBackupBody
// ---------------------------------------------------------------------------

describe('BACKUP-033 parseAutoBackupBody', () => {
  it('parses all valid fields', () => {
    const result = parseAutoBackupBody({
      enabled: true,
      interval: 'weekly',
      keep_days: 14,
      hour: 6,
      day_of_week: 5,
      day_of_month: 15,
    });
    expect(result).toEqual({
      enabled: true,
      interval: 'weekly',
      keep_days: 14,
      hour: 6,
      day_of_week: 5,
      day_of_month: 15,
    });
  });

  it('defaults to daily when interval is invalid', () => {
    const result = parseAutoBackupBody({ interval: 'not-valid' });
    expect(result.interval).toBe('daily');
  });

  it('clamps hour to 0-23', () => {
    expect(parseAutoBackupBody({ hour: 999 }).hour).toBe(23);
    expect(parseAutoBackupBody({ hour: -1 }).hour).toBe(0);
  });

  it('clamps day_of_week to 0-6', () => {
    expect(parseAutoBackupBody({ day_of_week: 10 }).day_of_week).toBe(6);
    expect(parseAutoBackupBody({ day_of_week: -1 }).day_of_week).toBe(0);
  });

  it('clamps day_of_month to 1-28', () => {
    expect(parseAutoBackupBody({ day_of_month: 99 }).day_of_month).toBe(28);
    expect(parseAutoBackupBody({ day_of_month: 0 }).day_of_month).toBe(1);
  });

  it('treats enabled = "true" string as true', () => {
    expect(parseAutoBackupBody({ enabled: 'true' }).enabled).toBe(true);
  });

  it('treats enabled = 1 as true', () => {
    expect(parseAutoBackupBody({ enabled: 1 }).enabled).toBe(true);
  });

  it('treats enabled = false as false', () => {
    expect(parseAutoBackupBody({ enabled: false }).enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidBackupFilename
// ---------------------------------------------------------------------------

describe('BACKUP-034 isValidBackupFilename', () => {
  it('accepts valid backup filename', () => {
    expect(isValidBackupFilename('backup-2026-04-06T12-00-00.zip')).toBe(true);
  });

  it('rejects path traversal', () => {
    expect(isValidBackupFilename('../../etc/passwd')).toBe(false);
  });

  it('rejects filename without .zip extension', () => {
    expect(isValidBackupFilename('backup-2026-04-06T12-00-00.tar.gz')).toBe(false);
  });

  it('rejects filename with spaces', () => {
    expect(isValidBackupFilename('backup 2026.zip')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidBackupFilename('')).toBe(false);
  });

  it('accepts filename with hyphens and underscores', () => {
    expect(isValidBackupFilename('backup-my_trek-2026.zip')).toBe(true);
  });

  it('accepts auto-backup filename', () => {
    expect(isValidBackupFilename('auto-backup-2026-04-21T00-00-00.zip')).toBe(true);
  });

  it('rejects auto-backup with empty body', () => {
    expect(isValidBackupFilename('auto-backup-.zip')).toBe(false);
  });

  it('rejects backup with empty body', () => {
    expect(isValidBackupFilename('backup-.zip')).toBe(false);
  });

  it('rejects arbitrary auto- prefix that is not auto-backup', () => {
    expect(isValidBackupFilename('auto-notbackup-2026.zip')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------

describe('BACKUP-035 checkRateLimit', () => {
  // Each test uses a unique key to avoid state pollution between tests
  it('allows first request', () => {
    expect(checkRateLimit('test-key-1', 3, BACKUP_RATE_WINDOW)).toBe(true);
  });

  it('allows requests up to maxAttempts', () => {
    const key = 'test-key-2';
    expect(checkRateLimit(key, 2, BACKUP_RATE_WINDOW)).toBe(true);
    expect(checkRateLimit(key, 2, BACKUP_RATE_WINDOW)).toBe(true);
  });

  it('blocks request exceeding maxAttempts within window', () => {
    const key = 'test-key-3';
    checkRateLimit(key, 2, BACKUP_RATE_WINDOW);
    checkRateLimit(key, 2, BACKUP_RATE_WINDOW);
    expect(checkRateLimit(key, 2, BACKUP_RATE_WINDOW)).toBe(false);
  });

  it('resets counter after window expires', () => {
    vi.useFakeTimers();
    const key = 'test-key-4';
    const windowMs = 100;
    checkRateLimit(key, 1, windowMs);
    checkRateLimit(key, 1, windowMs); // this one is blocked
    vi.advanceTimersByTime(200);
    // After window expires, should be allowed again
    expect(checkRateLimit(key, 1, windowMs)).toBe(true);
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// createBackup
// ---------------------------------------------------------------------------

describe('BACKUP-036 createBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Wires the write-stream + archiver mocks so finalize() resolves the build. */
  function setupArchiveSuccess() {
    const writableEvents: Record<string, Function> = {};
    fsMock.createWriteStream.mockReturnValue({
      on: vi.fn((event: string, cb: Function) => { writableEvents[event] = cb; }),
    } as never);
    archiverInstanceMock.on.mockImplementation(() => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => { writableEvents['close']?.(); });
    archiverMock.mockReturnValue(archiverInstanceMock);
    return writableEvents;
  }

  /** storage.stat stub for the post-put BackupInfo read. */
  const statOf = (size: number, mtimeMs = Date.parse('2026-04-06T12:00:00Z')) =>
    vi.fn(async (_c: string, key: string) => ({ key, size, mtimeMs }));

  /** storage.list stub keyed by category. */
  const listByCategory = (map: Record<string, Array<{ key: string; size?: number; mtimeMs?: number }>>) =>
    vi.fn((category: string) =>
      (async function* () {
        for (const e of map[category] ?? []) yield { size: 1, mtimeMs: 0, ...e };
      })(),
    );

  it('BACKUP-036a — happy path: builds in the backups spool, commits via put, returns BackupInfo', async () => {
    // No travel.db, no enc key, no plugin roots.
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(2048) });

    const result = await createBackup(storage);

    expect(result.filename).toMatch(/^backup-.*\.zip$/);
    expect(result.size).toBe(2048);
    expect(result.sizeText).toBe('2.0 KB');
    expect(result.created_at).toBe('2026-04-06T12:00:00.000Z');
    expect(archiverMock).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
    expect(archiverInstanceMock.pipe).toHaveBeenCalled();
    expect(archiverInstanceMock.finalize).toHaveBeenCalled();
    // The zip is built in the backups backend's spool, then committed via put.
    expect(fsMock.createWriteStream).toHaveBeenCalledWith(expect.stringContaining('/stub/spool/zip-build-backup-'));
    expect(storage.put).toHaveBeenCalledWith('backups', result.filename, {
      tmpPath: expect.stringContaining('/stub/spool/zip-build-backup-'),
    });
    expect(storage.stat).toHaveBeenCalledWith('backups', result.filename);
  });

  it('BACKUP-036j — archives category objects under the legacy uploads/ entry names via the local fast path', async () => {
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({
      stat: statOf(1024),
      list: listByCategory({
        files: [{ key: 'a.pdf' }],
        journey: [{ key: 'thumbs/x.jpg' }],
      }),
    });

    await createBackup(storage);

    expect(storage.getLocalPathOrNull).toHaveBeenCalledWith('files', 'a.pdf');
    expect(storage.getLocalPathOrNull).toHaveBeenCalledWith('journey', 'thumbs/x.jpg');
    expect(archiverInstanceMock.file).toHaveBeenCalledWith('/stub/local/path', { name: 'uploads/files/a.pdf' });
    expect(archiverInstanceMock.file).toHaveBeenCalledWith('/stub/local/path', { name: 'uploads/journey/thumbs/x.jpg' });
    // The local fast path never touches getStream — this is the zero-copy default-install branch.
    expect(storage.getStream).not.toHaveBeenCalled();
  });

  it('BACKUP-036k — a remote-driver object (no local path) is streamed into per-backup staging and archived from there', async () => {
    fsMock.existsSync.mockReturnValue(false);
    const writableEvents = setupArchiveSuccess();
    const { PassThrough } = await import('node:stream');
    const remoteStream = new PassThrough();
    remoteStream.end(Buffer.from('remote upload bytes'));
    fsMock.createWriteStream.mockImplementation((p: string) => {
      // The zip destination stream still needs the writableEvents wiring
      // setupArchiveSuccess set up (finalize() resolves the build via 'close');
      // staged files use a minimal fake that just resolves the pipeline.
      if (String(p).includes('zip-build-')) {
        return { on: vi.fn((event: string, cb: Function) => { writableEvents[event] = cb; }) };
      }
      // pipeline() (real, from node:stream/promises) needs a real Writable —
      // a PassThrough gives it one without touching the real filesystem.
      return new PassThrough();
    });
    const storage = stubStorage({
      stat: statOf(2048),
      list: listByCategory({ files: [{ key: 'remote.pdf' }] }),
      getLocalPathOrNull: vi.fn(async () => null),
      getStream: vi.fn(async (category: string, key: string) => {
        expect(category).toBe('files');
        expect(key).toBe('remote.pdf');
        return { stream: remoteStream, stat: { key, size: 20, mtimeMs: 0 } };
      }),
    });

    await createBackup(storage);

    expect(storage.getLocalPathOrNull).toHaveBeenCalledWith('files', 'remote.pdf');
    expect(storage.getStream).toHaveBeenCalledWith('files', 'remote.pdf');
    const fileCall = archiverInstanceMock.file.mock.calls.find(
      (c: unknown[]) => (c[1] as { name?: string })?.name === 'uploads/files/remote.pdf',
    );
    expect(fileCall).toBeDefined();
    const stagedPath = fileCall![0] as string;
    expect(stagedPath).toContain('/stub/spool/staging-backup-');
    expect(stagedPath).toContain('files/remote.pdf');
    // The staging dir is removed alongside zipSpool/dbSnap in the existing finally.
    expect(fsMock.rmSync).toHaveBeenCalledWith(
      expect.stringContaining('/stub/spool/staging-backup-'),
      { recursive: true, force: true },
    );
  });

  it('BACKUP-036l — a vanished remote object (archiver "warning") fails the backup instead of silently dropping it', async () => {
    fsMock.existsSync.mockReturnValue(false);
    const archiveEvents: Record<string, Function> = {};
    fsMock.createWriteStream.mockReturnValue({ on: vi.fn() } as never);
    archiverInstanceMock.on.mockImplementation((event: string, cb: Function) => { archiveEvents[event] = cb; });
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      // archiver emits 'warning' (not 'error') for entries it couldn't stat/read
      // (e.g. ENOENT) — without archive.on('warning', reject) this resolves clean.
      archiveEvents['warning']?.(new Error('ENOENT: no such file, stat entry'));
    });
    archiverMock.mockReturnValue(archiverInstanceMock);
    const storage = stubStorage();

    await expect(createBackup(storage)).rejects.toThrow('ENOENT');
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('BACKUP-036m — a mirror replica failure surfaced via health never fails the request', async () => {
    // Mirror semantics: put succeeds against the primary; replica failures are
    // recorded on health(), not thrown. createBackup must still return its info.
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({
      stat: statOf(1024),
      health: vi.fn(() => ({ replicaFailures: [{ backend: 'nas-backups', key: 'backup-x.zip', error: 'EIO' }] })),
    });

    const result = await createBackup(storage);

    expect(result.filename).toMatch(/^backup-.*\.zip$/);
    expect(storage.put).toHaveBeenCalledOnce();
  });

  it('BACKUP-036p — archives the plugin data + code trees when present, skipping dev-links', async () => {
    // Only the plugin roots exist (db/uploads absent → skipped).
    fsMock.existsSync.mockImplementation((p: string) => String(p).includes('plugins'));
    // Two plugin code dirs: 'notes' is real, 'devlink' resolves outside the root.
    // The plugin-data snapshot reads with { withFileTypes: true }; hand it Dirent-likes there.
    const dirent = (name: string) => ({ name, isDirectory: () => true });
    fsMock.readdirSync.mockImplementation((_p: string, opts?: { withFileTypes?: boolean }) =>
      (opts?.withFileTypes ? [dirent('notes'), dirent('devlink')] : ['notes', 'devlink']) as never);
    fsMock.realpathSync.mockImplementation((p: string) => (String(p).endsWith('devlink') ? '/somewhere/else/devlink' : p));
    fsMock.statSync.mockReturnValue({ isDirectory: () => true } as never);
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(2048) });

    await createBackup(storage);

    // the consistent snapshot of the data tree is archived under plugins-data/
    expect(archiverInstanceMock.directory).toHaveBeenCalledWith(expect.stringContaining('plugins-snap'), 'plugins-data');
    // the real code dir is archived, the dev-link is skipped
    expect(archiverInstanceMock.directory).toHaveBeenCalledWith(expect.stringContaining('notes'), 'plugins-code/notes');
    expect(archiverInstanceMock.directory).not.toHaveBeenCalledWith(expect.anything(), 'plugins-code/devlink');
    // the snapshot staging lives in the backups spool
    expect(archiverInstanceMock.directory).toHaveBeenCalledWith(expect.stringContaining('/stub/spool/plugins-snap-backup-'), 'plugins-data');
  });

  it('BACKUP-036b — WAL checkpoint error is swallowed (non-critical)', async () => {
    // db.exec throws on WAL checkpoint
    dbMock.db.exec.mockImplementationOnce(() => { throw new Error('WAL checkpoint failed'); });
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(512) });

    // Should not throw even though WAL checkpoint failed
    const result = await createBackup(storage);
    expect(result).toHaveProperty('filename');
    expect(result.size).toBe(512);
  });

  it('BACKUP-036c — archiver error cleans up the spool staging, skips put and re-throws', async () => {
    fsMock.existsSync.mockReturnValue(false);
    const archiveEvents: Record<string, Function> = {};
    fsMock.createWriteStream.mockReturnValue({ on: vi.fn() } as never);
    archiverInstanceMock.on.mockImplementation((event: string, cb: Function) => { archiveEvents[event] = cb; });
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      // Simulate archive error instead of success
      archiveEvents['error']?.(new Error('disk full'));
    });
    archiverMock.mockReturnValue(archiverInstanceMock);
    const storage = stubStorage();

    await expect(createBackup(storage)).rejects.toThrow('disk full');

    // Nothing is committed; the half-built spool file is removed in the finally.
    expect(storage.put).not.toHaveBeenCalled();
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('zip-build-backup-'), { force: true });
  });

  it('BACKUP-036d — includes travel.db when it exists, snapshotted into the spool', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('travel.db'));
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(1024) });

    await createBackup(storage);

    // the core DB is snapshotted (VACUUM INTO) and archived under the name travel.db
    expect(dbMock.db.exec).toHaveBeenCalledWith(expect.stringContaining('VACUUM INTO'));
    expect(archiverInstanceMock.file).toHaveBeenCalledWith(
      expect.stringContaining('/stub/spool/travel-snap-backup-'),
      { name: 'travel.db' }
    );
  });

  it('BACKUP-036e — excludes the re-derivable photo caches nested under photos/', async () => {
    // In mode A the google/trek caches live inside the photos/ prefix, so the
    // category walk must skip them. (In mode B photos-google is a separate
    // category that is simply never enumerated — no extra branch needed.)
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({
      stat: statOf(1024),
      list: listByCategory({
        photos: [{ key: 'flat.jpg' }, { key: 'google/g.jpg' }, { key: 'trek/t.bin' }],
      }),
    });

    await createBackup(storage);

    expect(archiverInstanceMock.file).toHaveBeenCalledWith('/stub/local/path', { name: 'uploads/photos/flat.jpg' });
    const names = archiverInstanceMock.file.mock.calls.map(c => c[1]?.name as string);
    expect(names.some(n => n?.includes('google/'))).toBe(false);
    expect(names.some(n => n?.includes('trek/'))).toBe(false);
    // Only the archived categories are ever listed — the excludes are structural.
    expect(storage.getLocalPathOrNull).toHaveBeenCalledTimes(1);
  });

  it('BACKUP-036h — only category prefixes are ever archived; backups/ and restore-* are structurally out (issue #1358)', async () => {
    // The uploads/** glob is gone: even when data and uploads map to the same
    // directory, enumeration only ever walks the six archived categories, so
    // prior backup zips and restore-* staging can never be swept into the zip.
    fsMock.existsSync.mockReturnValue(false);
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(1024) });

    await createBackup(storage);

    expect(archiverInstanceMock.glob).not.toHaveBeenCalled();
    const listed = (storage.list as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0] as string);
    expect(listed.sort()).toEqual(['avatars', 'covers', 'files', 'journey', 'photos', 'places']);
    expect(listed).not.toContain('backups');
  });

  it('BACKUP-036f — bundles .encryption_key when present and ENCRYPTION_KEY env is unset', async () => {
    const prevEnvKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('.encryption_key'));
      setupArchiveSuccess();
      const storage = stubStorage({ stat: statOf(1024) });

      await createBackup(storage);

      expect(archiverInstanceMock.file).toHaveBeenCalledWith(
        expect.stringContaining('.encryption_key'),
        { name: '.encryption_key' },
      );
    } finally {
      process.env.ENCRYPTION_KEY = prevEnvKey;
    }
  });

  it('BACKUP-036g — does NOT bundle .encryption_key when ENCRYPTION_KEY env is set', async () => {
    // setup.ts sets process.env.ENCRYPTION_KEY, so the env is the source of truth.
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('.encryption_key'));
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(1024) });

    await createBackup(storage);

    expect(archiverInstanceMock.file).not.toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      expect.anything(),
    );
  });

  it('BACKUP-036i — the auto-backup prefix names both the zip and its scratch snapshots', async () => {
    // The scheduler passes 'auto-backup' so retention and the admin panel can
    // still tell scheduled archives apart by filename.
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('travel.db'));
    setupArchiveSuccess();
    const storage = stubStorage({ stat: statOf(1024) });

    const result = await createBackup(storage, 'auto-backup');

    expect(result.filename).toMatch(/^auto-backup-.*\.zip$/);
    expect(archiverInstanceMock.file).toHaveBeenCalledWith(
      expect.stringContaining('travel-snap-auto-backup-'),
      { name: 'travel.db' },
    );
    expect(storage.put).toHaveBeenCalledWith('backups', result.filename, {
      tmpPath: expect.stringContaining('zip-build-auto-backup-'),
    });
  });
});

// ---------------------------------------------------------------------------
// deleteBackup
// ---------------------------------------------------------------------------

describe('BACKUP-037 deleteBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-037a — happy path: deletes through storage under the backups category', async () => {
    const storage = stubStorage();

    await deleteBackup(storage, 'backup-2026-04-06T12-00-00.zip');

    expect(storage.delete).toHaveBeenCalledOnce();
    expect(storage.delete).toHaveBeenCalledWith('backups', 'backup-2026-04-06T12-00-00.zip');
  });

  it('BACKUP-037b — propagates a storage delete failure', async () => {
    // Note: storage.delete is idempotent on a MISSING object (route parity holds
    // because the controller pre-checks existence and 404s); this pins that a
    // real backend failure still surfaces.
    const storage = stubStorage({ delete: vi.fn(async () => { throw new Error('EIO: i/o error'); }) });

    await expect(deleteBackup(storage, 'backup-missing.zip')).rejects.toThrow('EIO');
  });
});

// ---------------------------------------------------------------------------
// restoreFromZip
// ---------------------------------------------------------------------------

describe('BACKUP-038 restoreFromZip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-038a — returns error when travel.db not found in zip', async () => {
    // Simulate successful extraction but missing travel.db
    const fakeReadStream = { pipe: vi.fn() };
    const fakeExtractStream = { promise: vi.fn().mockResolvedValue(undefined) };
    fsMock.createReadStream.mockReturnValue(fakeReadStream);
    fakeReadStream.pipe.mockReturnValue(fakeExtractStream);
    unzipperMock.Extract.mockReturnValue(fakeExtractStream);

    // extractedDb does not exist
    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return false;
      return true; // extractDir exists for cleanup
    });
    fsMock.rmSync.mockReturnValue(undefined);

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/travel\.db not found/i);
    expect(result.status).toBe(400);
  });

  it('BACKUP-038b — rejects a zip bomb whose declared decompressed size exceeds the cap', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({
      files: [{ uncompressedSize: 6 * 1024 * 1024 * 1024 }], // 6 GB > 5 GB cap
    });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/bomb.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/decompressed size/i);
    expect(unzipperMock.Extract).not.toHaveBeenCalled(); // bailed before extracting
  });
});

// ---------------------------------------------------------------------------
// restoreFromZip — the per-entry extraction loop
//
// This is the part of the restore that decides what an attacker-supplied archive is
// allowed to write, and it had no tests of its own: the zip-slip refusal, the running
// decompressed-byte cap (the declared size in the central directory is
// attacker-controlled, so the real guard counts bytes as they land) and the failure
// path that leaves the process without a reopened DB.
// ---------------------------------------------------------------------------

/** A minimal unzipper entry: emits `chunks` when its stream is piped. */
function zipEntry(entryPath: string, chunks: Buffer[] = [Buffer.alloc(8)], type = 'File') {
  return {
    path: entryPath,
    type,
    uncompressedSize: chunks.reduce((n, c) => n + c.length, 0),
    stream() {
      const handlers: Record<string, Array<(arg?: unknown) => void>> = {};
      return {
        on(event: string, cb: (arg?: unknown) => void) {
          (handlers[event] ??= []).push(cb);
          return this;
        },
        destroy: vi.fn(),
        // The production code pipes AFTER registering handlers, so emitting here is
        // the moment every listener is in place.
        pipe(out: { emit(event: string): void }) {
          for (const chunk of chunks) for (const cb of handlers.data ?? []) cb(chunk);
          out.emit('finish');
        },
      };
    },
  };
}

/** A write stream that only has to carry 'finish' back to the awaiting promise. */
function fakeWriteStream() {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    on(event: string, cb: () => void) {
      (handlers[event] ??= []).push(cb);
      return this;
    },
    destroy: vi.fn(),
    emit(event: string) {
      for (const cb of handlers[event] ?? []) cb();
    },
  };
}

describe('BACKUP-061 restoreFromZip extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMock.createWriteStream.mockImplementation(() => fakeWriteStream());
    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 10 });
  });

  it('BACKUP-061a — refuses an entry whose path escapes the archive root (zip-slip)', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({ files: [zipEntry('../../etc/passwd')] });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/slip.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/escapes the archive root/i);
    // Nothing of that archive is left behind, and no byte of it was written.
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('restore-'), { recursive: true, force: true });
    expect(fsMock.createWriteStream).not.toHaveBeenCalled();
  });

  // The `path.isAbsolute(rel)` half of the guard is only reachable where drive letters
  // exist: on POSIX, path.join always keeps an entry under extractDir, so a leading
  // slash is normalised away and only the `..` check above can fire. Asserting it
  // unconditionally passed locally on Windows and failed on the Linux CI runner, which
  // is the wrong way round for a security test to be discovered.
  it.runIf(process.platform === 'win32')('BACKUP-061b — a drive-letter entry path is refused the same way', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({ files: [zipEntry('C:/Windows/system32/evil.dll')] });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/abs.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(fsMock.createWriteStream).not.toHaveBeenCalled();
  });

  it('BACKUP-061c — directory entries are skipped rather than written', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({
      files: [zipEntry('uploads/', [], 'Directory'), zipEntry('travel.db')],
    });

    // What happens after extraction is BACKUP-042..045's business; this case only
    // cares that the directory entry never reached the writer.
    await restoreFromZip(stubStorage(), '/data/tmp/dirs.zip').catch(() => undefined);

    expect(fsMock.createWriteStream).toHaveBeenCalledTimes(1);
  });

  it('BACKUP-061d — stops mid-stream once the ACTUAL decompressed bytes cross the cap', async () => {
    // The declared size is a lie: the central directory claims 8 bytes while the
    // stream delivers well past the 5 GB cap. Only the running total catches this.
    const lying = zipEntry('travel.db', [Buffer.alloc(3 * 1024 * 1024 * 1024), Buffer.alloc(3 * 1024 * 1024 * 1024)]);
    lying.uncompressedSize = 8;
    unzipperMock.Open.file.mockResolvedValueOnce({ files: [lying] });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/liar.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/decompressed size/i);
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('restore-'), { recursive: true, force: true });
  });

  it('BACKUP-061e — a stream error is not swallowed as a size refusal', async () => {
    const entry = zipEntry('travel.db');
    entry.stream = () => {
      const handlers: Record<string, Array<(arg?: unknown) => void>> = {};
      return {
        on(event: string, cb: (arg?: unknown) => void) {
          (handlers[event] ??= []).push(cb);
          return this;
        },
        destroy: vi.fn(),
        pipe() {
          for (const cb of handlers.error ?? []) cb(new Error('corrupt deflate stream'));
        },
      };
    };
    unzipperMock.Open.file.mockResolvedValueOnce({ files: [entry] });

    // A corrupt stream is NOT dressed up as a 400 "too large": it leaves the function
    // as a throw, which is what makes the controller answer 500 rather than telling the
    // admin their perfectly-sized backup is over the cap.
    await expect(restoreFromZip(stubStorage(), '/data/tmp/corrupt.zip')).rejects.toThrow('corrupt deflate stream');
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('restore-'), { recursive: true, force: true });
  });

  it('BACKUP-061f — a reopen failure after the swap reports "restart required", not success', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({ files: [zipEntry('travel.db')] });
    const restored = {
      prepare: vi
        .fn()
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ integrity_check: 'ok' }) })
        .mockReturnValueOnce({
          all: vi.fn().mockReturnValue([{ name: 'users' }, { name: 'trips' }, { name: 'trip_members' }, { name: 'places' }, { name: 'days' }]),
        }),
      close: vi.fn(),
    };
    DatabaseMock.mockImplementation(function () {
      return restored;
    });
    fsMock.existsSync.mockImplementation((path: string) => !String(path).includes('uploads'));
    dbMock.reinitialize.mockImplementationOnce(() => {
      throw new Error('database is locked');
    });
    const storage = stubStorage();

    const result = await restoreFromZip(storage, '/data/tmp/ok.zip');

    // The files already landed, so this is neither a success nor a plain failure: the
    // admin has to restart, and the message has to say so.
    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toMatch(/restart the server/i);
    // A failed reopen leaves no live DB handle for the registry to read: reload
    // (and with it any rehydration) is skipped rather than reading through a
    // torn/unavailable connection — already reported as "restart required".
    expect(storage.reloadConfig).not.toHaveBeenCalled();
    expect(storage.put).not.toHaveBeenCalled();
    // Plugin-tree staging is pure filesystem (plugin-backup.ts), has no DB
    // dependency, and is the archive's ONLY copy of that data — it must still
    // run even when the DB reopen failed, or extractDir's cleanup right after
    // would delete it with no recovery path. fs.cpSync only fires from inside
    // stageExtractedPluginTrees in this flow, so its call is the proof.
    expect(fsMock.cpSync).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// better-sqlite3 mock — hoisted by Vitest regardless of file position
// ---------------------------------------------------------------------------

const DatabaseMock = vi.hoisted(() => vi.fn());

vi.mock('better-sqlite3', () => ({ default: DatabaseMock }));

// BACKUP-039 (backupFilePath) retired: every consumer addresses backups as
// (category, name) through StorageService now — no absolute path leaves the impl.

// ---------------------------------------------------------------------------
// backupFileExists
// ---------------------------------------------------------------------------

describe('BACKUP-040 backupFileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-040a — returns true when storage.exists resolves true', async () => {
    const storage = stubStorage({ exists: vi.fn(async () => true) });
    await expect(backupFileExists(storage, 'backup-2026-01-01T00-00-00.zip')).resolves.toBe(true);
    expect(storage.exists).toHaveBeenCalledWith('backups', 'backup-2026-01-01T00-00-00.zip');
  });

  it('BACKUP-040b — returns false when storage.exists resolves false', async () => {
    const storage = stubStorage({ exists: vi.fn(async () => false) });
    await expect(backupFileExists(storage, 'backup-missing.zip')).resolves.toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendBackupToResponse
// ---------------------------------------------------------------------------

describe('BACKUP-062 sendBackupToResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-062a — serves through storage with the res.download attachment header', async () => {
    const storage = stubStorage();
    const res = { setHeader: vi.fn() } as unknown as import('express').Response;

    await sendBackupToResponse(storage, 'backup-2026-01-01T00-00-00.zip', res);

    expect(storage.sendToResponse).toHaveBeenCalledOnce();
    expect(storage.sendToResponse).toHaveBeenCalledWith(
      'backups',
      'backup-2026-01-01T00-00-00.zip',
      res,
      { disposition: 'attachment; filename="backup-2026-01-01T00-00-00.zip"' },
    );
  });

  it('BACKUP-062b — propagates a storage failure (the controller owns the miss contract)', async () => {
    const storage = stubStorage({ sendToResponse: vi.fn(async () => { throw new Error('missing'); }) });
    const res = {} as import('express').Response;

    await expect(sendBackupToResponse(storage, 'backup-x.zip', res)).rejects.toThrow('missing');
  });
});

// ---------------------------------------------------------------------------
// listBackups
// ---------------------------------------------------------------------------

describe('BACKUP-041 listBackups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-041a — returns empty array when the category has no objects', async () => {
    const storage = stubStorage();
    await expect(listBackups(storage)).resolves.toEqual([]);
    expect(storage.list).toHaveBeenCalledWith('backups');
  });

  it('BACKUP-041b — returns BackupInfo for each .zip object', async () => {
    const storage = stubStorage({
      list: listOf([{ key: 'backup-2026-01-01T00-00-00.zip', size: 1024, mtimeMs: Date.parse('2026-01-01T00:00:00Z') }]),
    });

    const result = await listBackups(storage);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('backup-2026-01-01T00-00-00.zip');
    expect(result[0].size).toBe(1024);
    expect(result[0].sizeText).toBe('1.0 KB');
    expect(result[0].created_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('BACKUP-041c — sorts results newest-first by mtime', async () => {
    const storage = stubStorage({
      list: listOf([
        { key: 'backup-2026-01-01T00-00-00.zip', size: 512, mtimeMs: Date.parse('2026-01-01T00:00:00Z') },
        { key: 'backup-2026-06-01T00-00-00.zip', size: 2048, mtimeMs: Date.parse('2026-06-01T00:00:00Z') },
      ]),
    });

    const result = await listBackups(storage);

    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('backup-2026-06-01T00-00-00.zip');
    expect(result[1].filename).toBe('backup-2026-01-01T00-00-00.zip');
  });

  it('BACKUP-041d — filters out non-.zip objects', async () => {
    const storage = stubStorage({
      list: listOf([
        { key: 'backup-2026-01-01T00-00-00.zip', size: 1024, mtimeMs: Date.parse('2026-01-01T00:00:00Z') },
        { key: 'README.txt' },
        { key: 'backup-partial.tar.gz' },
      ]),
    });

    const result = await listBackups(storage);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('backup-2026-01-01T00-00-00.zip');
  });

  it('BACKUP-041e — skips nested keys (storage.list recurses; the legacy readdir was single-level)', async () => {
    // A restore-* staging tree only sits under the backups root when an install
    // maps data and uploads to the same directory — it must not surface.
    const storage = stubStorage({
      list: listOf([
        { key: 'restore-123/uploads/x.zip' },
        { key: 'backup-2026-01-01T00-00-00.zip', size: 1024, mtimeMs: Date.parse('2026-01-01T00:00:00Z') },
      ]),
    });

    const result = await listBackups(storage);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('backup-2026-01-01T00-00-00.zip');
  });
});

// ---------------------------------------------------------------------------
// restoreFromZip — extended paths (BACKUP-042 through BACKUP-046)
// ---------------------------------------------------------------------------

/** Shared helper: configures the stream mocks so extraction succeeds. */
function setupSuccessfulExtraction() {
  const fakeExtractStream = { promise: vi.fn().mockResolvedValue(undefined) };
  const fakeReadStream = { pipe: vi.fn().mockReturnValue(fakeExtractStream) };
  fsMock.createReadStream.mockReturnValue(fakeReadStream);
  unzipperMock.Extract.mockReturnValue(fakeExtractStream);
  return { fakeReadStream, fakeExtractStream };
}

describe('BACKUP-042 restoreFromZip — integrity check fails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-042a — returns status 400 with integrity check error message', async () => {
    setupSuccessfulExtraction();

    fsMock.existsSync.mockImplementation((p: string) =>
      String(p).endsWith('travel.db')
    );
    fsMock.rmSync.mockReturnValue(undefined);

    const fakeDbInstance = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ integrity_check: 'corruption' }),
        all: vi.fn(),
      }),
      close: vi.fn(),
    };
    DatabaseMock.mockImplementation(function () {
      return fakeDbInstance;
    });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/integrity check/i);
    expect(fsMock.rmSync).toHaveBeenCalled();
  });
});

describe('BACKUP-043 restoreFromZip — missing required table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-043a — returns status 400 with missing required table error', async () => {
    setupSuccessfulExtraction();

    fsMock.existsSync.mockImplementation((p: string) =>
      String(p).endsWith('travel.db')
    );
    fsMock.rmSync.mockReturnValue(undefined);

    const fakeDbInstance = {
      prepare: vi.fn()
        .mockReturnValueOnce({
          get: vi.fn().mockReturnValue({ integrity_check: 'ok' }),
        })
        .mockReturnValueOnce({
          all: vi.fn().mockReturnValue([{ name: 'users' }, { name: 'trips' }]),
        }),
      close: vi.fn(),
    };
    DatabaseMock.mockImplementation(function () {
      return fakeDbInstance;
    });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/missing required table/i);
    expect(fsMock.rmSync).toHaveBeenCalled();
  });
});

describe('BACKUP-044 restoreFromZip — Database constructor throws (invalid SQLite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-044a — returns status 400 with "not a valid SQLite database" error', async () => {
    setupSuccessfulExtraction();

    fsMock.existsSync.mockImplementation((p: string) =>
      String(p).endsWith('travel.db')
    );
    fsMock.rmSync.mockReturnValue(undefined);

    DatabaseMock.mockImplementation(function () {
      throw new Error('file is not a database');
    });

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/not a valid SQLite database/i);
    expect(fsMock.rmSync).toHaveBeenCalled();
  });
});

describe('BACKUP-045 restoreFromZip — full success path (no uploads)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupAllTablesPresent() {
    const fakeDbInstance = {
      prepare: vi.fn()
        .mockReturnValueOnce({
          get: vi.fn().mockReturnValue({ integrity_check: 'ok' }),
        })
        .mockReturnValueOnce({
          all: vi.fn().mockReturnValue([
            { name: 'users' },
            { name: 'trips' },
            { name: 'trip_members' },
            { name: 'places' },
            { name: 'days' },
          ]),
        }),
      close: vi.fn(),
    };
    DatabaseMock.mockImplementation(function () {
      return fakeDbInstance;
    });
    return fakeDbInstance;
  }

  it('BACKUP-045a — returns { success: true } on full success', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).includes('uploads')) return false;
      return true;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
  });

  it('BACKUP-045b — closeDb is called before file copy operations', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    const callOrder: string[] = [];
    dbMock.closeDb.mockImplementation(() => { callOrder.push('closeDb'); });
    fsMock.copyFileSync.mockImplementation(() => { callOrder.push('copyFileSync'); });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).includes('uploads')) return false;
      return true;
    });

    await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(callOrder.indexOf('closeDb')).toBeLessThan(callOrder.indexOf('copyFileSync'));
  });

  it('BACKUP-045c — reinitialize is called even when copyFileSync throws', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).includes('uploads')) return false;
      return true;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockImplementation(() => {
      throw new Error('disk full');
    });
    fsMock.rmSync.mockReturnValue(undefined);

    await expect(restoreFromZip(stubStorage(), '/data/tmp/upload.zip')).rejects.toThrow('disk full');

    expect(dbMock.reinitialize).toHaveBeenCalled();
  });

  it('BACKUP-045d — restores bundled .encryption_key when the archive carries one', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).endsWith('.encryption_key')) return true; // extracted key present
      if (String(p).includes('uploads')) return false;
      return true;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    // Key copied from the extract dir into the live data dir.
    expect(fsMock.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      expect.stringContaining('.encryption_key'),
    );
  });

  it('BACKUP-045e — skips key restore when the archive has no .encryption_key', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).endsWith('.encryption_key')) return false; // no key in archive
      if (String(p).includes('uploads')) return false;
      return true;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    const result = await restoreFromZip(stubStorage(), '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    expect(fsMock.copyFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      expect.stringContaining('.encryption_key'),
    );
  });

  it('BACKUP-045f — reloadConfig runs after reinitialize and before uploads rehydration (audit #4)', async () => {
    // The registry reads storage.* app_settings through the DB handle — which
    // is closed and reopened around this restore. reloadConfig() must run
    // AFTER that reopen (else it reads a torn/unavailable connection) and
    // BEFORE any rehydrated byte is put, so rehydration lands per the
    // RESTORED config rather than the stale pre-restore one.
    setupSuccessfulExtraction();
    setupAllTablesPresent();

    const callOrder: string[] = [];
    dbMock.reinitialize.mockImplementation(() => { callOrder.push('reinitialize'); });

    const dirent = (name: string, dir = false) => ({ name, isDirectory: () => dir, isFile: () => !dir });
    fsMock.existsSync.mockImplementation((p: string) => !String(p).endsWith('.encryption_key'));
    fsMock.readdirSync.mockImplementation((p: string, opts?: { withFileTypes?: boolean }) => {
      const s = String(p);
      const entries = s.endsWith('uploads') ? [dirent('files', true)] : s.endsWith('files') ? [dirent('a.pdf')] : [];
      return (opts?.withFileTypes ? entries : entries.map(e => e.name)) as never;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    const storage = stubStorage({
      reloadConfig: vi.fn(() => { callOrder.push('reloadConfig'); }),
      put: vi.fn(async () => { callOrder.push('put:rehydrate'); }),
    });

    const result = await restoreFromZip(storage, '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    expect(callOrder).toEqual(['reinitialize', 'reloadConfig', 'put:rehydrate']);
  });
});

describe('BACKUP-046 restoreFromZip — uploads rehydration through storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupAllTablesPresent() {
    const fakeDbInstance = {
      prepare: vi.fn()
        .mockReturnValueOnce({
          get: vi.fn().mockReturnValue({ integrity_check: 'ok' }),
        })
        .mockReturnValueOnce({
          all: vi.fn().mockReturnValue([
            { name: 'users' },
            { name: 'trips' },
            { name: 'trip_members' },
            { name: 'places' },
            { name: 'days' },
          ]),
        }),
      close: vi.fn(),
    };
    DatabaseMock.mockImplementation(function () {
      return fakeDbInstance;
    });
    return fakeDbInstance;
  }

  const dirent = (name: string, dir = false) => ({ name, isDirectory: () => dir, isFile: () => !dir });

  /** Common fs wiring: travel.db + extracted uploads exist; the extracted tree
   *  is described per-path via `tree` (walked with { withFileTypes: true }). */
  function setupExtractedUploads(tree: Record<string, ReturnType<typeof dirent>[]>) {
    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('.encryption_key')) return false;
      return true;
    });
    fsMock.readdirSync.mockImplementation((p: string, opts?: { withFileTypes?: boolean }) => {
      const s = String(p);
      const key = Object.keys(tree).find(k => s.endsWith(k));
      const entries = key ? tree[key] : [];
      return (opts?.withFileTypes ? entries : entries.map(e => e.name)) as never;
    });
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);
  }

  it('BACKUP-046a — wipes only top-level category objects, then puts each extracted entry (legacy wipe parity)', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();
    setupExtractedUploads({
      '/uploads': [dirent('files', true), dirent('journey', true)],
      '/uploads/files': [dirent('a.pdf')],
      '/uploads/journey': [dirent('thumbs', true)],
      '/uploads/journey/thumbs': [dirent('t.jpg')],
    });

    // Pre-existing objects: one bare per category plus a nested journey thumb —
    // the legacy wipe unlinked one level deep only, so nested keys must survive.
    // One delete rejects to pin the swallowed-per-file-error behavior.
    const storage = stubStorage({
      list: vi.fn((category: string) =>
        (async function* () {
          yield { key: 'old.bin', size: 1, mtimeMs: 0 };
          if (category === 'journey') yield { key: 'thumbs/old.jpg', size: 1, mtimeMs: 0 };
        })(),
      ),
      delete: vi.fn(async (category: string) => {
        // one category's wipe fails — swallowed per-file, exactly like the old
        // unlink loop (exercises the best-effort .catch)
        if (category === 'covers') throw new Error('EACCES');
      }),
    });

    const result = await restoreFromZip(storage, '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    // wipe: bare keys deleted in every archived category, nested keys never
    const deleted = (storage.delete as ReturnType<typeof vi.fn>).mock.calls;
    expect(deleted.every(([, key]) => !(key as string).includes('/'))).toBe(true);
    expect(deleted.map(([c]) => c).sort()).toEqual(['avatars', 'covers', 'files', 'journey', 'photos', 'places']);
    // rehydration: every extracted file becomes a category put, nested keys intact
    expect(storage.put).toHaveBeenCalledWith('files', 'a.pdf', { tmpPath: expect.stringContaining('/uploads/files/a.pdf') });
    expect(storage.put).toHaveBeenCalledWith('journey', 'thumbs/t.jpg', { tmpPath: expect.stringContaining('/uploads/journey/thumbs/t.jpg') });
    // No uploads bulk copy remains (plugin-tree staging still uses cpSync — out of scope).
    const cpTargets = fsMock.cpSync.mock.calls.map(c => String(c[1]));
    expect(cpTargets.some(t => t.includes('uploads'))).toBe(false);
  });

  it('BACKUP-046b — skips entries that cannot map to a storage key, with a warning (2026-08-17 decision)', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();
    setupExtractedUploads({
      '/uploads': [dirent('files', true), dirent('mystery', true), dirent('stray.txt')],
      '/uploads/files': [dirent('a.pdf')],
      '/uploads/mystery': [dirent('b.bin')],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { StorageInvalidKeyError } = await import('../../../src/nest/storage/storage.types');
    const storage = stubStorage({
      put: vi.fn(async (_c: string, key: string) => {
        // dot-segment keys from old `dot: true` archives are rejected by
        // central key validation — the restore must skip, not fail
        if (key === 'a.pdf') throw new StorageInvalidKeyError(key);
      }),
    });

    const result = await restoreFromZip(storage, '/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    // unknown top-level dir + top-level file + invalid key: all skipped, warned
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mystery/b.bin'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('stray.txt'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a.pdf'));
    warn.mockRestore();
  });

  it('BACKUP-046c — a genuine put failure still fails the restore', async () => {
    setupSuccessfulExtraction();
    setupAllTablesPresent();
    setupExtractedUploads({
      '/uploads': [dirent('files', true)],
      '/uploads/files': [dirent('a.pdf')],
    });
    const storage = stubStorage({
      put: vi.fn(async () => { throw new Error('ENOSPC: no space left'); }),
    });

    await expect(restoreFromZip(storage, '/data/tmp/upload.zip')).rejects.toThrow('ENOSPC');
    // the DB reopen still ran (finally) — the process is never left closed
    expect(dbMock.reinitialize).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// restoreBackup (stored-zip restore via withLocalFile)
// ---------------------------------------------------------------------------

describe('BACKUP-063 restoreBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-063a — reads the stored zip through withLocalFile("backups") and returns the restore result', async () => {
    const storage = stubStorage({
      withLocalFile: vi.fn(async () => ({ success: true })),
    });

    await expect(restoreBackup(storage, 'backup-2026-01-01T00-00-00.zip')).resolves.toEqual({ success: true });
    expect(storage.withLocalFile).toHaveBeenCalledWith('backups', 'backup-2026-01-01T00-00-00.zip', expect.any(Function));
  });

  it('BACKUP-063b — the local path handed back by storage feeds the restore core', async () => {
    // The default stub invokes the callback with a local path; the restore core
    // runs against it for real (empty archive → travel.db missing → 400 result).
    fsMock.existsSync.mockReturnValue(false);
    unzipperMock.Open.file.mockResolvedValue({ files: [] });
    const storage = stubStorage();

    const result = await restoreBackup(storage, 'backup-2026-01-01T00-00-00.zip');

    expect(result).toEqual({ success: false, error: 'Invalid backup: travel.db not found', status: 400 });
  });
});

// BACKUP-047 (updateAutoSettings) moved to tests/unit/auto-backup.test.ts with
// the function — it lives on AutoBackupJob now.
