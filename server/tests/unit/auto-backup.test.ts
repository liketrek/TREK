/**
 * Scheduled backup run.
 *
 * The auto-backup used to archive the live travel.db: the archiver reads its
 * entries while streaming, so a WAL auto-checkpoint writing pages back mid-run
 * left a torn copy in the zip — without the -wal that would make it recoverable.
 * It also shipped without .encryption_key, so the archive could not be decrypted
 * on another install. The run now goes through backupService.createBackup(),
 * which snapshots the DB with VACUUM INTO and bundles the key.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fsMock = vi.hoisted(() => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(() => [] as unknown as string[]),
  statSync: vi.fn(() => ({ size: 0, birthtime: new Date(0), mtimeMs: 0 })),
  unlinkSync: vi.fn(),
  createWriteStream: vi.fn(),
  createReadStream: vi.fn(),
  rmSync: vi.fn(),
  copyFileSync: vi.fn(),
  renameSync: vi.fn(),
  cpSync: vi.fn(),
  realpathSync: vi.fn((p: string) => p),
}));

const archiveMock = vi.hoisted(() => ({
  pipe: vi.fn(),
  file: vi.fn(),
  directory: vi.fn(),
  glob: vi.fn(),
  finalize: vi.fn(),
  on: vi.fn(),
}));

const archiverMock = vi.hoisted(() => vi.fn());

const dbMock = vi.hoisted(() => ({
  db: { exec: vi.fn(), prepare: vi.fn() },
  closeDb: vi.fn(),
  reinitialize: vi.fn(),
}));

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn() }));

const cronMock = vi.hoisted(() => ({ schedule: vi.fn(), validate: vi.fn(() => true) }));

vi.mock('node-cron', () => ({ default: cronMock, ...cronMock }));
vi.mock('fs', () => ({ default: fsMock, ...fsMock }));
vi.mock('node:fs', () => ({ default: fsMock, ...fsMock }));
vi.mock('archiver', () => ({ default: archiverMock }));
vi.mock('unzipper', () => ({ default: { Extract: vi.fn(), Open: { file: vi.fn() } } }));
vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/nest/audit/audit-log.logger', () => logMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));

import path from 'node:path';
import { start } from '../../src/scheduler';

const liveDb = path.join(__dirname, '../../data', 'travel.db');

/** Wires up the archiver so finalize() resolves the run, and returns its events. */
function stubArchiver(): Record<string, (arg?: unknown) => void> {
  const outputEvents: Record<string, (arg?: unknown) => void> = {};
  const archiveEvents: Record<string, (arg?: unknown) => void> = {};
  fsMock.createWriteStream.mockReturnValue({
    on: vi.fn((event: string, cb: () => void) => { outputEvents[event] = cb; }),
  } as never);
  archiveMock.on.mockImplementation((event: string, cb: (arg?: unknown) => void) => { archiveEvents[event] = cb; });
  archiveMock.finalize.mockImplementation(() => { outputEvents['close']?.(); });
  archiverMock.mockReturnValue(archiveMock);
  return archiveEvents;
}

/** Starts the scheduler with auto-backup enabled and hands back the cron callback. */
function scheduledRun(): () => Promise<void> {
  fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'daily', keep_days: 7 }));
  start();
  return cronMock.schedule.mock.calls.at(-1)?.[1] as () => Promise<void>;
}

describe('auto-backup run', () => {
  const envKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    // No ENCRYPTION_KEY in the env means the key file is the source of truth and
    // has to travel with the backup.
    delete process.env.ENCRYPTION_KEY;
    fsMock.statSync.mockReturnValue({ size: 4096, birthtime: new Date('2026-04-27T02:00:00Z'), mtimeMs: Date.now() } as never);
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = envKey;
  });

  it('archives a VACUUM INTO snapshot, never the live travel.db', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('travel.db') || String(p).endsWith('backup-settings.json'));
    stubArchiver();

    await scheduledRun()();

    expect(dbMock.db.exec).toHaveBeenCalledWith(expect.stringContaining('VACUUM INTO'));
    const dbEntry = archiveMock.file.mock.calls.find(([, opts]) => opts?.name === 'travel.db');
    expect(dbEntry).toBeDefined();
    expect(dbEntry?.[0]).toContain('.travel-snap-auto-backup-');
    expect(dbEntry?.[0]).not.toBe(liveDb);
  });

  it('bundles the at-rest encryption key', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('.encryption_key') || String(p).endsWith('backup-settings.json'));
    stubArchiver();

    await scheduledRun()();

    expect(archiveMock.file).toHaveBeenCalledWith(
      expect.stringContaining('.encryption_key'),
      { name: '.encryption_key' },
    );
  });

  it('keeps the auto-backup-*.zip naming so retention still prunes it', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('backup-settings.json'));
    fsMock.readdirSync.mockReturnValue(['auto-backup-2020-01-01T02-00-00.zip'] as unknown as string[]);
    stubArchiver();

    await scheduledRun()();

    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringMatching(/^Auto-Backup created: auto-backup-[\dT-]+\.zip$/));
    // cleanupOldBackups(keep_days) still runs after the archive and only sees
    // files it can match by prefix
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('auto-backup-2020-01-01T02-00-00.zip'));
  });

  it('logs the failure, drops the partial zip and skips retention', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('.zip') || String(p).endsWith('backup-settings.json'));
    const archiveEvents = stubArchiver();
    archiveMock.finalize.mockImplementation(() => { archiveEvents['error']?.(new Error('disk full')); });

    await scheduledRun()();

    expect(logMock.logError).toHaveBeenCalledWith('Auto-Backup: disk full');
    expect(logMock.logInfo).not.toHaveBeenCalledWith(expect.stringContaining('Auto-Backup created'));
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('auto-backup-'));
    // the snapshot scratch file is cleaned up too, and retention never runs
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('.travel-snap-auto-backup-'), { force: true });
    expect(fsMock.readdirSync).not.toHaveBeenCalled();
  });
});
