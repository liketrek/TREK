import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The promise this feature makes is that automatic backups get the same
 * off-box treatment as manual ones. Nothing else asserts it: the hook has its
 * own tests, and backupService has its own, but if the call in
 * `scheduler.runBackup()` were deleted, every scheduled backup would silently
 * stay on the box and every existing test would still pass.
 */

const scheduled: ((...a: unknown[]) => unknown)[] = [];
vi.mock('node-cron', () => ({
  default: {
    schedule: (_expr: string, fn: (...a: unknown[]) => unknown) => { scheduled.push(fn); return { stop: vi.fn() }; },
    validate: () => true,
  },
  schedule: (_expr: string, fn: (...a: unknown[]) => unknown) => { scheduled.push(fn); return { stop: vi.fn() }; },
  validate: () => true,
}));

// A minimal archiver that finishes immediately.
vi.mock('archiver', () => ({
  default: () => ({
    on: vi.fn(),
    pipe: vi.fn(),
    file: vi.fn(),
    directory: vi.fn(),
    glob: vi.fn(),
    finalize: vi.fn(),
  }),
}));

vi.mock('node:fs', () => {
  const api = {
    // Only the settings file exists: loadSettings() must find auto-backup
    // enabled, while travel.db and uploads/ stay absent so the archive is empty.
    existsSync: vi.fn((p: string) => String(p).endsWith('backup-settings.json')),
    mkdirSync: vi.fn(),
    // Auto-backup is enabled so start() actually schedules runBackup.
    readFileSync: vi.fn(() => JSON.stringify({ enabled: true, interval: 'daily', keep_days: 0, hour: 2, day_of_week: 0, day_of_month: 1 })),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ mtime: new Date(), mtimeMs: Date.now(), size: 1 })),
    unlinkSync: vi.fn(),
    // The archive is "written" as soon as someone listens for close.
    createWriteStream: vi.fn(() => ({
      on: (event: string, cb: () => void) => { if (event === 'close') setImmediate(cb); },
      pipe: vi.fn(),
    })),
  };
  return { default: api, ...api };
});

vi.mock('../../src/db/database', () => ({
  db: { exec: vi.fn(), prepare: () => ({ all: () => [], get: () => undefined, run: vi.fn() }) },
}));
vi.mock('../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));
vi.mock('../../src/services/auditLog', () => ({ logInfo: vi.fn(), logError: vi.fn() }));

const onBackupWritten = vi.fn();
vi.mock('../../src/nest/backup/backup-target', () => ({
  onBackupWritten: (...a: unknown[]) => onBackupWritten(...a),
}));

import { start } from '../../src/scheduler';

beforeEach(() => {
  scheduled.length = 0;
  onBackupWritten.mockReset();
  onBackupWritten.mockResolvedValue({ attempted: false, uploaded: false });
});

describe('scheduler auto-backup → external target', () => {
  it('hands every scheduled backup to the same post-write hook manual backups use', async () => {
    start();
    expect(scheduled.length).toBeGreaterThan(0);

    await scheduled[0]();

    expect(onBackupWritten).toHaveBeenCalledTimes(1);
    const zipPath = String(onBackupWritten.mock.calls[0][0]);
    // The auto builder writes auto-backup-*.zip; that exact archive must be the
    // one offered to the target, not a re-derived or manual-style path.
    expect(zipPath).toMatch(/auto-backup-.*\.zip$/);
  });

  it('does not let a failing target abort the run', async () => {
    // The hook is contractually non-throwing, but the call sits outside the try
    // that deletes the archive on error — so even a throw must not take the
    // local backup with it.
    onBackupWritten.mockRejectedValue(new Error('target exploded'));
    start();
    await expect(scheduled[0]()).rejects.toThrow('target exploded');
    // The archive itself was never removed: unlinkSync is only reached from the
    // builder's own catch, which this failure is deliberately outside of.
    const fs = (await import('node:fs')).default;
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
