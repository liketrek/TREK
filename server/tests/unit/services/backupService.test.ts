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
vi.mock('../../../src/scheduler', () => ({
  VALID_INTERVALS: ['hourly', 'daily', 'weekly', 'monthly'],
  loadSettings: vi.fn(() => ({
    enabled: false,
    interval: 'daily',
    keep_days: 7,
    hour: 2,
    day_of_week: 0,
    day_of_month: 1,
  })),
  saveSettings: vi.fn(),
  start: vi.fn(),
}));

import {
  formatSize,
  parseIntField,
  parseAutoBackupBody,
  isValidBackupFilename,
  checkRateLimit,
  createBackup,
  deleteBackup,
  restoreFromZip,
  BACKUP_RATE_WINDOW,
  backupFilePath,
  backupFileExists,
  listBackups,
  updateAutoSettings,
} from '../../../src/services/backupService';

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

  it('BACKUP-036a — happy path: creates zip and returns BackupInfo', async () => {
    // Set up fs mocks
    fsMock.existsSync.mockImplementation((p: string) => {
      // backupsDir exists, dbPath does not (skip DB file), uploadsDir does not exist
      return false;
    });
    fsMock.mkdirSync.mockReturnValue(undefined);

    // Mock WriteStream with event emitter behaviour
    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    // Mock archiver instance
    archiverInstanceMock.on.mockImplementation((event: string, cb: Function) => {
      // noop — no error
    });
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      // Trigger 'close' on the output stream to resolve the Promise
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 2048, birthtime: new Date('2026-04-06T12:00:00Z') });

    const result = await createBackup();

    expect(result).toHaveProperty('filename');
    expect(result.filename).toMatch(/^backup-.*\.zip$/);
    expect(result.size).toBe(2048);
    expect(result.sizeText).toBe('2.0 KB');
    expect(result).toHaveProperty('created_at');
    expect(archiverMock).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
    expect(archiverInstanceMock.pipe).toHaveBeenCalled();
    expect(archiverInstanceMock.finalize).toHaveBeenCalled();
  });

  it('BACKUP-036b — WAL checkpoint error is swallowed (non-critical)', async () => {
    // db.exec throws on WAL checkpoint
    dbMock.db.exec.mockImplementationOnce(() => { throw new Error('WAL checkpoint failed'); });

    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);
    fsMock.existsSync.mockReturnValue(false);
    fsMock.mkdirSync.mockReturnValue(undefined);

    archiverInstanceMock.on.mockImplementation((_event: string, _cb: Function) => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 512, birthtime: new Date('2026-04-06T12:00:00Z') });

    // Should not throw even though WAL checkpoint failed
    const result = await createBackup();
    expect(result).toHaveProperty('filename');
    expect(result.size).toBe(512);
  });

  it('BACKUP-036c — archiver error cleans up partial file and re-throws', async () => {
    fsMock.existsSync.mockReturnValue(false);
    fsMock.mkdirSync.mockReturnValue(undefined);

    const writableEvents: Record<string, Function> = {};
    const archiveEvents: Record<string, Function> = {};

    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    archiverInstanceMock.on.mockImplementation((event: string, cb: Function) => {
      archiveEvents[event] = cb;
    });
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      // Simulate archive error instead of success
      if (archiveEvents['error']) archiveEvents['error'](new Error('disk full'));
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    // The output file "exists" after partial write so cleanup runs
    fsMock.existsSync.mockImplementation((p: string) => {
      // Return true only when checking the output path (ends with .zip)
      return String(p).endsWith('.zip');
    });
    fsMock.unlinkSync.mockReturnValue(undefined);

    await expect(createBackup()).rejects.toThrow('disk full');
    // Partial file should have been removed
    expect(fsMock.unlinkSync).toHaveBeenCalled();
  });

  it('BACKUP-036d — includes travel.db when it exists', async () => {
    fsMock.existsSync.mockImplementation((p: string) => {
      // backupsDir does not need to be created (exists), dbPath exists, no uploads
      if (String(p).endsWith('travel.db')) return true;
      return false;
    });
    fsMock.mkdirSync.mockReturnValue(undefined);

    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    archiverInstanceMock.on.mockImplementation((_e: string, _cb: Function) => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 1024, birthtime: new Date('2026-04-06T12:00:00Z') });

    await createBackup();

    // archive.file should have been called with the db path
    expect(archiverInstanceMock.file).toHaveBeenCalledWith(
      expect.stringContaining('travel.db'),
      { name: 'travel.db' }
    );
  });

  it('BACKUP-036e — includes uploads but excludes the re-derivable photo caches', async () => {
    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('uploads')) return true;
      return false;
    });
    fsMock.mkdirSync.mockReturnValue(undefined);

    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    archiverInstanceMock.on.mockImplementation((_e: string, _cb: Function) => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 1024, birthtime: new Date('2026-04-06T12:00:00Z') });

    await createBackup();

    expect(archiverInstanceMock.glob).toHaveBeenCalledWith(
      '**/*',
      expect.objectContaining({
        cwd: expect.stringContaining('uploads'),
        ignore: ['photos/google/**', 'photos/trek/**', 'backups/**', 'restore-*/**'],
      }),
      { prefix: 'uploads' },
    );
    // The re-derivable caches must not be archived verbatim.
    expect(archiverInstanceMock.directory).not.toHaveBeenCalled();
  });

  it('BACKUP-036h — never sweeps backups/ or restore-* into the archive (issue #1358)', async () => {
    // Regression guard: when data and uploads map to the same directory, the
    // uploads glob would otherwise pick up the backups/ dir and recursively
    // embed every prior backup zip, compounding size without bound.
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('uploads'));
    fsMock.mkdirSync.mockReturnValue(undefined);

    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    archiverInstanceMock.on.mockImplementation((_e: string, _cb: Function) => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 1024, birthtime: new Date('2026-04-06T12:00:00Z') });

    await createBackup();

    const globCall = archiverInstanceMock.glob.mock.calls.at(-1);
    const ignore: string[] = globCall?.[1]?.ignore ?? [];
    expect(ignore).toContain('backups/**');
    expect(ignore).toContain('restore-*/**');
  });

  it('BACKUP-036f — bundles .encryption_key when present and ENCRYPTION_KEY env is unset', async () => {
    const prevEnvKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('.encryption_key'));
      fsMock.mkdirSync.mockReturnValue(undefined);

      const writableEvents: Record<string, Function> = {};
      const fakeWriteStream = {
        on: vi.fn((event: string, cb: Function) => {
          writableEvents[event] = cb;
        }),
      };
      fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

      archiverInstanceMock.on.mockImplementation((_e: string, _cb: Function) => {});
      archiverInstanceMock.pipe.mockReturnValue(undefined);
      archiverInstanceMock.finalize.mockImplementation(() => {
        if (writableEvents['close']) writableEvents['close']();
      });
      archiverMock.mockReturnValue(archiverInstanceMock);

      fsMock.statSync.mockReturnValue({ size: 1024, birthtime: new Date('2026-04-06T12:00:00Z') });

      await createBackup();

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
    fsMock.mkdirSync.mockReturnValue(undefined);

    const writableEvents: Record<string, Function> = {};
    const fakeWriteStream = {
      on: vi.fn((event: string, cb: Function) => {
        writableEvents[event] = cb;
      }),
    };
    fsMock.createWriteStream.mockReturnValue(fakeWriteStream);

    archiverInstanceMock.on.mockImplementation((_e: string, _cb: Function) => {});
    archiverInstanceMock.pipe.mockReturnValue(undefined);
    archiverInstanceMock.finalize.mockImplementation(() => {
      if (writableEvents['close']) writableEvents['close']();
    });
    archiverMock.mockReturnValue(archiverInstanceMock);

    fsMock.statSync.mockReturnValue({ size: 1024, birthtime: new Date('2026-04-06T12:00:00Z') });

    await createBackup();

    expect(archiverInstanceMock.file).not.toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteBackup
// ---------------------------------------------------------------------------

describe('BACKUP-037 deleteBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-037a — happy path: calls unlinkSync with correct path', () => {
    fsMock.unlinkSync.mockReturnValue(undefined);

    deleteBackup('backup-2026-04-06T12-00-00.zip');

    expect(fsMock.unlinkSync).toHaveBeenCalledOnce();
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('backup-2026-04-06T12-00-00.zip')
    );
  });

  it('BACKUP-037b — throws when unlinkSync throws (file not found)', () => {
    fsMock.unlinkSync.mockImplementation(() => {
      const err: NodeJS.ErrnoException = new Error('ENOENT: no such file or directory');
      err.code = 'ENOENT';
      throw err;
    });

    expect(() => deleteBackup('backup-missing.zip')).toThrow('ENOENT');
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

    const result = await restoreFromZip('/data/tmp/upload.zip');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/travel\.db not found/i);
    expect(result.status).toBe(400);
  });

  it('BACKUP-038b — rejects a zip bomb whose declared decompressed size exceeds the cap', async () => {
    unzipperMock.Open.file.mockResolvedValueOnce({
      files: [{ uncompressedSize: 6 * 1024 * 1024 * 1024 }], // 6 GB > 5 GB cap
    });

    const result = await restoreFromZip('/data/tmp/bomb.zip');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/decompressed size/i);
    expect(unzipperMock.Extract).not.toHaveBeenCalled(); // bailed before extracting
  });
});

// ---------------------------------------------------------------------------
// better-sqlite3 mock — hoisted by Vitest regardless of file position
// ---------------------------------------------------------------------------

const DatabaseMock = vi.hoisted(() => vi.fn());

vi.mock('better-sqlite3', () => ({ default: DatabaseMock }));

// ---------------------------------------------------------------------------
// backupFilePath
// ---------------------------------------------------------------------------

describe('BACKUP-039 backupFilePath', () => {
  it('BACKUP-039a — returns a path ending with the given filename', () => {
    const result = backupFilePath('backup-test.zip');
    expect(result).toMatch(/backup-test\.zip$/);
  });
});

// ---------------------------------------------------------------------------
// backupFileExists
// ---------------------------------------------------------------------------

describe('BACKUP-040 backupFileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-040a — returns true when existsSync returns true', () => {
    fsMock.existsSync.mockReturnValue(true);
    expect(backupFileExists('backup-2026-01-01T00-00-00.zip')).toBe(true);
    expect(fsMock.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('backup-2026-01-01T00-00-00.zip')
    );
  });

  it('BACKUP-040b — returns false when existsSync returns false', () => {
    fsMock.existsSync.mockReturnValue(false);
    expect(backupFileExists('backup-missing.zip')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// listBackups
// ---------------------------------------------------------------------------

describe('BACKUP-041 listBackups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ensureBackupsDir: backupsDir already exists so mkdirSync is not called
    fsMock.existsSync.mockReturnValue(true);
  });

  it('BACKUP-041a — returns empty array when no .zip files in directory', () => {
    fsMock.readdirSync.mockReturnValue([]);
    expect(listBackups()).toEqual([]);
  });

  it('BACKUP-041b — returns BackupInfo array for each .zip file', () => {
    fsMock.readdirSync.mockReturnValue(['backup-2026-01-01T00-00-00.zip']);
    fsMock.statSync.mockReturnValue({
      size: 1024,
      mtime: new Date('2026-01-01T00:00:00Z'),
    });

    const result = listBackups();

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('backup-2026-01-01T00-00-00.zip');
    expect(result[0].size).toBe(1024);
    expect(result[0].sizeText).toBe('1.0 KB');
    expect(result[0].created_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('BACKUP-041c — sorts results newest-first', () => {
    fsMock.readdirSync.mockReturnValue([
      'backup-2026-01-01T00-00-00.zip',
      'backup-2026-06-01T00-00-00.zip',
    ]);
    fsMock.statSync.mockImplementation((p: string) => {
      if (String(p).includes('2026-01-01')) {
        return { size: 512, mtime: new Date('2026-01-01T00:00:00Z') };
      }
      return { size: 2048, mtime: new Date('2026-06-01T00:00:00Z') };
    });

    const result = listBackups();

    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('backup-2026-06-01T00-00-00.zip');
    expect(result[1].filename).toBe('backup-2026-01-01T00-00-00.zip');
  });

  it('BACKUP-041d — filters out non-.zip files', () => {
    fsMock.readdirSync.mockReturnValue([
      'backup-2026-01-01T00-00-00.zip',
      'README.txt',
      'backup-partial.tar.gz',
    ]);
    fsMock.statSync.mockReturnValue({
      size: 1024,
      mtime: new Date('2026-01-01T00:00:00Z'),
    });

    const result = listBackups();

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

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

    await restoreFromZip('/data/tmp/upload.zip');

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

    await expect(restoreFromZip('/data/tmp/upload.zip')).rejects.toThrow('disk full');

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

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

    const result = await restoreFromZip('/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    expect(fsMock.copyFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      expect.stringContaining('.encryption_key'),
    );
  });
});

describe('BACKUP-046 restoreFromZip — with uploads directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BACKUP-046a — cpSync is called to copy uploads when they exist in the archive', async () => {
    setupSuccessfulExtraction();

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

    fsMock.existsSync.mockImplementation((p: string) => {
      // travel.db present, extractedUploads present
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).includes('uploads')) return true;
      return true;
    });
    fsMock.readdirSync.mockImplementation((p: string) => {
      // uploadsDir has one subdirectory 'photos'; 'photos' has one file
      if (String(p).includes('uploads') && !String(p).includes('restore-')) {
        return ['photos'] as any;
      }
      if (String(p).includes('photos')) return ['img1.jpg'] as any;
      return [] as any;
    });
    fsMock.statSync.mockReturnValue({ isDirectory: () => true } as any);
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.cpSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);

    await restoreFromZip('/data/tmp/upload.zip');

    expect(fsMock.cpSync).toHaveBeenCalledWith(
      expect.stringContaining('uploads'),
      expect.stringContaining('uploads'),
      { recursive: true, force: true }
    );
  });

  it('BACKUP-046b — copies into the symlink target, not the symlink itself (#1193)', async () => {
    // In Docker, uploadsDir (/app/server/uploads) is a symlink to the mounted
    // /app/uploads volume. cpSync(dereference:false) would throw
    // ERR_FS_CP_DIR_TO_NON_DIR overwriting the symlink node with a directory.
    // The fix resolves the symlink with realpathSync first, so the copy targets
    // the real directory behind it.
    setupSuccessfulExtraction();

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

    fsMock.existsSync.mockImplementation((p: string) => {
      if (String(p).endsWith('travel.db')) return true;
      if (String(p).includes('uploads')) return true;
      return true;
    });
    fsMock.readdirSync.mockImplementation((p: string) => {
      if (String(p).includes('uploads') && !String(p).includes('restore-')) {
        return ['photos'] as any;
      }
      if (String(p).includes('photos')) return ['img1.jpg'] as any;
      return [] as any;
    });
    fsMock.statSync.mockReturnValue({ isDirectory: () => true } as any);
    fsMock.unlinkSync.mockReturnValue(undefined);
    fsMock.copyFileSync.mockReturnValue(undefined);
    fsMock.cpSync.mockReturnValue(undefined);
    fsMock.rmSync.mockReturnValue(undefined);
    // Resolve the uploads symlink to a distinct real target directory.
    const REAL_TARGET = '/app/uploads';
    fsMock.realpathSync.mockReturnValueOnce(REAL_TARGET);

    const result = await restoreFromZip('/data/tmp/upload.zip');

    expect(result).toEqual({ success: true });
    // The copy destination must be the resolved real path, never the symlink.
    expect(fsMock.cpSync).toHaveBeenCalledWith(
      expect.stringContaining('uploads'),
      REAL_TARGET,
      { recursive: true, force: true }
    );
  });
});

// ---------------------------------------------------------------------------
// updateAutoSettings
// ---------------------------------------------------------------------------

describe('BACKUP-047 updateAutoSettings', () => {
  let schedulerMock: typeof import('../../../src/scheduler');

  beforeEach(async () => {
    vi.clearAllMocks();
    schedulerMock = await import('../../../src/scheduler');
  });

  it('BACKUP-047a — calls scheduler.saveSettings with the parsed settings', () => {
    updateAutoSettings({ enabled: true, interval: 'weekly', hour: 6 });

    expect(schedulerMock.saveSettings).toHaveBeenCalledOnce();
    expect(schedulerMock.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, interval: 'weekly', hour: 6 })
    );
  });

  it('BACKUP-047b — calls scheduler.start() after saving', () => {
    const saveOrder: string[] = [];
    (schedulerMock.saveSettings as ReturnType<typeof vi.fn>).mockImplementation(() => {
      saveOrder.push('saveSettings');
    });
    (schedulerMock.start as ReturnType<typeof vi.fn>).mockImplementation(() => {
      saveOrder.push('start');
    });

    updateAutoSettings({ enabled: false });

    expect(saveOrder).toEqual(['saveSettings', 'start']);
  });

  it('BACKUP-047c — returns the parsed settings object', () => {
    const result = updateAutoSettings({
      enabled: true,
      interval: 'monthly',
      keep_days: 30,
      hour: 3,
      day_of_week: 2,
      day_of_month: 15,
    });

    expect(result).toEqual({
      enabled: true,
      interval: 'monthly',
      keep_days: 30,
      hour: 3,
      day_of_week: 2,
      day_of_month: 15,
    });
  });
});
