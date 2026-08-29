/**
 * Auto-backup settings + retention (moved from tests/unit/scheduler.test.ts
 * when the code moved from src/scheduler.ts into the backup domain).
 */
import {
  buildCronExpression,
  cleanupOldBackups,
  loadSettings,
  saveSettings,
  type BackupSettings,
} from '../../../src/nest/backup/auto-backup.settings';
import type { StorageService } from '../../../src/nest/storage/storage.service';

import fs from 'node:fs';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Prevent fs side effects (creating directories, reading files)
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ mtime: new Date(), size: 0 })),
    unlinkSync: vi.fn(),
    createWriteStream: vi.fn(() => ({ on: vi.fn(), pipe: vi.fn() })),
  },
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn(() => ({ mtime: new Date(), size: 0 })),
  unlinkSync: vi.fn(),
  createWriteStream: vi.fn(() => ({ on: vi.fn(), pipe: vi.fn() })),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// The settings half still does file I/O; these handles pin the mock functions
// from the factory above to the plain signatures loadSettings/saveSettings use.
// (Retention no longer touches fs — it goes through StorageService.)
const existsSyncMock = fs.existsSync as unknown as Mock<(path: string) => boolean>;
const readFileSyncMock = fs.readFileSync as unknown as Mock<(path: string, enc: string) => string>;
const writeFileSyncMock = fs.writeFileSync as unknown as Mock<(path: string, data: string) => void>;
const mkdirSyncMock = fs.mkdirSync as unknown as Mock<(path: string, opts?: unknown) => void>;

function settings(overrides: Partial<BackupSettings> = {}): BackupSettings {
  return {
    enabled: true,
    interval: 'daily',
    keep_days: 7,
    hour: 2,
    day_of_week: 0,
    day_of_month: 1,
    ...overrides,
  };
}

describe('buildCronExpression', () => {
  describe('hourly', () => {
    it('returns 0 * * * * regardless of hour/dow/dom', () => {
      expect(buildCronExpression(settings({ interval: 'hourly', hour: 5, day_of_week: 3, day_of_month: 15 }))).toBe(
        '0 * * * *',
      );
    });
  });

  describe('daily', () => {
    it('returns 0 <hour> * * *', () => {
      expect(buildCronExpression(settings({ interval: 'daily', hour: 3 }))).toBe('0 3 * * *');
    });

    it('handles midnight (hour 0)', () => {
      expect(buildCronExpression(settings({ interval: 'daily', hour: 0 }))).toBe('0 0 * * *');
    });

    it('handles last valid hour (23)', () => {
      expect(buildCronExpression(settings({ interval: 'daily', hour: 23 }))).toBe('0 23 * * *');
    });

    it('falls back to hour 2 for invalid hour (24)', () => {
      expect(buildCronExpression(settings({ interval: 'daily', hour: 24 }))).toBe('0 2 * * *');
    });

    it('falls back to hour 2 for negative hour', () => {
      expect(buildCronExpression(settings({ interval: 'daily', hour: -1 }))).toBe('0 2 * * *');
    });
  });

  describe('weekly', () => {
    it('returns 0 <hour> * * <dow>', () => {
      expect(buildCronExpression(settings({ interval: 'weekly', hour: 5, day_of_week: 3 }))).toBe('0 5 * * 3');
    });

    it('handles Sunday (dow 0)', () => {
      expect(buildCronExpression(settings({ interval: 'weekly', hour: 2, day_of_week: 0 }))).toBe('0 2 * * 0');
    });

    it('handles Saturday (dow 6)', () => {
      expect(buildCronExpression(settings({ interval: 'weekly', hour: 2, day_of_week: 6 }))).toBe('0 2 * * 6');
    });

    it('falls back to dow 0 for invalid day_of_week (7)', () => {
      expect(buildCronExpression(settings({ interval: 'weekly', hour: 2, day_of_week: 7 }))).toBe('0 2 * * 0');
    });
  });

  describe('monthly', () => {
    it('returns 0 <hour> <dom> * *', () => {
      expect(buildCronExpression(settings({ interval: 'monthly', hour: 2, day_of_month: 15 }))).toBe('0 2 15 * *');
    });

    it('handles day_of_month 1', () => {
      expect(buildCronExpression(settings({ interval: 'monthly', hour: 2, day_of_month: 1 }))).toBe('0 2 1 * *');
    });

    it('handles max valid day_of_month (28)', () => {
      expect(buildCronExpression(settings({ interval: 'monthly', hour: 2, day_of_month: 28 }))).toBe('0 2 28 * *');
    });

    it('falls back to dom 1 for day_of_month 29', () => {
      expect(buildCronExpression(settings({ interval: 'monthly', hour: 2, day_of_month: 29 }))).toBe('0 2 1 * *');
    });

    it('falls back to dom 1 for day_of_month 0', () => {
      expect(buildCronExpression(settings({ interval: 'monthly', hour: 2, day_of_month: 0 }))).toBe('0 2 1 * *');
    });
  });

  describe('unknown interval', () => {
    it('defaults to daily pattern', () => {
      expect(buildCronExpression(settings({ interval: 'unknown', hour: 4 }))).toBe('0 4 * * *');
    });
  });
});

describe('loadSettings / saveSettings', () => {
  beforeEach(() => {
    existsSyncMock.mockReset().mockReturnValue(false);
    readFileSyncMock.mockReset().mockReturnValue('{}');
    writeFileSyncMock.mockReset();
    mkdirSyncMock.mockReset();
  });

  it('returns the defaults when no settings file exists', () => {
    expect(loadSettings()).toEqual({
      enabled: false,
      interval: 'daily',
      keep_days: 7,
      hour: 2,
      day_of_week: 0,
      day_of_month: 1,
    });
  });

  it('merges the saved file over the defaults', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(JSON.stringify({ enabled: true, interval: 'weekly', hour: 6 }));
    expect(loadSettings()).toEqual({
      enabled: true,
      interval: 'weekly',
      keep_days: 7,
      hour: 6,
      day_of_week: 0,
      day_of_month: 1,
    });
  });

  it('falls back to the defaults on a corrupt settings file', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue('{not json');
    expect(loadSettings()).toEqual({
      enabled: false,
      interval: 'daily',
      keep_days: 7,
      hour: 2,
      day_of_week: 0,
      day_of_month: 1,
    });
  });

  it('saveSettings creates the data dir when missing and writes pretty JSON', () => {
    const s = settings({ enabled: true, interval: 'weekly' });
    saveSettings(s);
    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.stringContaining('data'), { recursive: true });
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      expect.stringContaining('backup-settings.json'),
      JSON.stringify(s, null, 2),
    );
  });

  it('saveSettings skips the mkdir when the data dir already exists', () => {
    existsSyncMock.mockReturnValue(true);
    saveSettings(settings());
    expect(mkdirSyncMock).not.toHaveBeenCalled();
  });
});

describe('cleanupOldBackups', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = new Date('2026-04-27T02:00:00Z').getTime();

  function isoFilename(daysAgo: number, prefix: 'auto-backup' | 'backup' = 'auto-backup'): string {
    const d = new Date(NOW - daysAgo * DAY);
    const stamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}-${stamp}.zip`;
  }

  /** Retention runs against the backups category through storage now. */
  function storageWith(entries: Array<{ key: string; mtimeMs?: number }>): StorageService {
    return {
      list: vi.fn(async function* () {
        for (const e of entries) yield { size: 0, mtimeMs: NOW, ...e };
      }),
      delete: vi.fn(async () => {}),
    } as unknown as StorageService;
  }
  const deletedKeys = (s: StorageService) => (s.delete as Mock).mock.calls.map(([, key]) => key as string);

  it('never deletes manual backup-*.zip files regardless of age', async () => {
    const manual = isoFilename(365 * 5, 'backup');
    const storage = storageWith([{ key: manual }, { key: isoFilename(0) }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(deletedKeys(storage)).not.toContain(manual);
  });

  it('keeps auto-backups newer than retention', async () => {
    const storage = storageWith([{ key: isoFilename(3) }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('deletes auto-backups older than retention', async () => {
    const old = isoFilename(30);
    const storage = storageWith([{ key: old }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).toHaveBeenCalledOnce();
    expect(storage.delete).toHaveBeenCalledWith('backups', old);
  });

  it('ages by filename timestamp first: a fresh name survives a bogus epoch mtime (overlayfs regression)', async () => {
    // On overlayfs the fs timestamps lie (birthtime 0); the filename stamp is
    // authoritative. ObjectStat only carries mtimeMs — set it to epoch and the
    // same-day filename must still win.
    const storage = storageWith([{ key: isoFilename(0), mtimeMs: 0 }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('malformed filename falls back to mtimeMs: keeps recent file', async () => {
    const storage = storageWith([{ key: 'auto-backup-garbage.zip', mtimeMs: NOW - 1 * DAY }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('malformed filename falls back to mtimeMs: deletes stale file', async () => {
    const storage = storageWith([{ key: 'auto-backup-garbage.zip', mtimeMs: NOW - 30 * DAY }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).toHaveBeenCalledOnce();
  });

  it('ignores non-zip files and does not crash', async () => {
    const old = isoFilename(30);
    const storage = storageWith([{ key: old }, { key: 'notes.txt', mtimeMs: 0 }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(deletedKeys(storage)).toEqual([old]);
  });

  it('ignores nested keys (storage.list recurses; the legacy readdir was single-level)', async () => {
    const storage = storageWith([{ key: `restore-123/${isoFilename(30)}`, mtimeMs: 0 }]);
    await cleanupOldBackups(storage, 7, NOW);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('swallows storage list errors without throwing', async () => {
    const storage = {
      list: vi.fn(() => {
        throw new Error('ENOENT');
      }),
      delete: vi.fn(async () => {}),
    } as unknown as StorageService;
    await expect(cleanupOldBackups(storage, 7, NOW)).resolves.toBeUndefined();
  });

  it('swallows delete failures without throwing (mirror replica or fs error)', async () => {
    const storage = storageWith([{ key: isoFilename(30) }]);
    (storage.delete as Mock).mockRejectedValue(new Error('EACCES'));
    await expect(cleanupOldBackups(storage, 7, NOW)).resolves.toBeUndefined();
  });

  it('swallows non-Error throws without throwing (string rejection path)', async () => {
    const storage = {
      list: vi.fn(() => {
        throw 'nope';
      }),
      delete: vi.fn(async () => {}),
    } as unknown as StorageService;
    await expect(cleanupOldBackups(storage, 7, NOW)).resolves.toBeUndefined();
  });
});
