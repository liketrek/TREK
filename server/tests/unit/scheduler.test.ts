import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Prevent node-cron from scheduling anything at import time
vi.mock('node-cron', () => ({
  default: { schedule: vi.fn(), validate: vi.fn(() => true) },
  schedule: vi.fn(),
  validate: vi.fn(() => true),
}));
// Prevent archiver from causing side effects
vi.mock('archiver', () => ({ default: vi.fn() }));
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
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ all: vi.fn(() => []), get: vi.fn(), run: vi.fn() }) },
}));
vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

import fs from 'node:fs';
import { buildCronExpression, cleanupOldBackups } from '../../src/scheduler';

// readdirSync and statSync are overloaded in node:fs, and vi.mocked() picks the last
// overload (Dirent[] / BigIntStats) rather than the one the scheduler calls. These handles
// point at the very same mock functions from the factory above, pinned to the plain
// string[] / Stats signatures that cleanupOldBackups actually uses.
const readdirSyncMock = fs.readdirSync as unknown as Mock<(path: string) => string[]>;
const statSyncMock = fs.statSync as unknown as Mock<(path: string) => fs.Stats>;
const unlinkSyncMock = fs.unlinkSync as unknown as Mock<(path: string) => void>;

// cleanupOldBackups reads nothing but mtimeMs off a stat result, so the stubs below stay
// deliberately partial instead of faking a whole fs.Stats.
function statStub(partial: Partial<fs.Stats>): fs.Stats {
  return partial as fs.Stats;
}

interface BackupSettings {
  enabled: boolean;
  interval: string;
  keep_days: number;
  hour: number;
  day_of_week: number;
  day_of_month: number;
}

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
      expect(buildCronExpression(settings({ interval: 'hourly', hour: 5, day_of_week: 3, day_of_month: 15 }))).toBe('0 * * * *');
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

describe('cleanupOldBackups', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = new Date('2026-04-27T02:00:00Z').getTime();

  function isoFilename(daysAgo: number, prefix: 'auto-backup' | 'backup' = 'auto-backup'): string {
    const d = new Date(NOW - daysAgo * DAY);
    const stamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}-${stamp}.zip`;
  }

  beforeEach(() => {
    readdirSyncMock.mockReset();
    statSyncMock.mockReset();
    unlinkSyncMock.mockReset();
    statSyncMock.mockReturnValue(statStub({ mtime: new Date(), mtimeMs: NOW, birthtimeMs: NOW, size: 0 }));
  });

  it('never deletes manual backup-*.zip files regardless of age', () => {
    const manual = isoFilename(365 * 5, 'backup');
    const auto = isoFilename(0);
    readdirSyncMock.mockReturnValue([manual, auto]);
    cleanupOldBackups(7, NOW);
    const deleted = unlinkSyncMock.mock.calls.map(([p]) => p);
    expect(deleted.some(p => p.includes(manual))).toBe(false);
  });

  it('keeps auto-backups newer than retention', () => {
    const recent = isoFilename(3);
    readdirSyncMock.mockReturnValue([recent]);
    cleanupOldBackups(7, NOW);
    expect(unlinkSyncMock).not.toHaveBeenCalled();
  });

  it('deletes auto-backups older than retention', () => {
    const old = isoFilename(30);
    readdirSyncMock.mockReturnValue([old]);
    cleanupOldBackups(7, NOW);
    expect(unlinkSyncMock).toHaveBeenCalledOnce();
    const [calledPath] = unlinkSyncMock.mock.calls[0];
    expect(calledPath).toContain(old);
  });

  it('overlayfs regression: birthtimeMs=0 does not delete a same-day backup', () => {
    const fresh = isoFilename(0);
    readdirSyncMock.mockReturnValue([fresh]);
    statSyncMock.mockReturnValue(statStub({ birthtimeMs: 0, mtimeMs: NOW, mtime: new Date(NOW), size: 100 }));
    cleanupOldBackups(7, NOW);
    expect(unlinkSyncMock).not.toHaveBeenCalled();
  });

  it('malformed filename falls back to mtimeMs: keeps recent file', () => {
    readdirSyncMock.mockReturnValue(['auto-backup-garbage.zip']);
    statSyncMock.mockReturnValue(statStub({ birthtimeMs: 0, mtimeMs: NOW - 1 * DAY, mtime: new Date(NOW - 1 * DAY), size: 0 }));
    cleanupOldBackups(7, NOW);
    expect(unlinkSyncMock).not.toHaveBeenCalled();
  });

  it('malformed filename falls back to mtimeMs: deletes stale file', () => {
    readdirSyncMock.mockReturnValue(['auto-backup-garbage.zip']);
    statSyncMock.mockReturnValue(statStub({ birthtimeMs: 0, mtimeMs: NOW - 30 * DAY, mtime: new Date(NOW - 30 * DAY), size: 0 }));
    cleanupOldBackups(7, NOW);
    expect(unlinkSyncMock).toHaveBeenCalledOnce();
  });

  it('ignores non-zip files and does not crash', () => {
    const old = isoFilename(30);
    readdirSyncMock.mockReturnValue([old, 'notes.txt']);
    cleanupOldBackups(7, NOW);
    const calls = unlinkSyncMock.mock.calls;
    expect(calls.every(([p]) => !p.includes('notes.txt'))).toBe(true);
    expect(calls.length).toBe(1);
  });

  it('swallows readdirSync errors without throwing', () => {
    readdirSyncMock.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(() => cleanupOldBackups(7, NOW)).not.toThrow();
  });
});
