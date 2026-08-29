/**
 * Scheduled backup run (AutoBackupJob).
 *
 * The auto-backup used to archive the live travel.db: the archiver reads its
 * entries while streaming, so a WAL auto-checkpoint writing pages back mid-run
 * left a torn copy in the zip — without the -wal that would make it recoverable.
 * It also shipped without .encryption_key, so the archive could not be decrypted
 * on another install. The run now goes through backupService.createBackup(),
 * which snapshots the DB with VACUUM INTO and bundles the key.
 */
import { AutoBackupJob } from '../../src/nest/backup/auto-backup.job';
import { createBackup } from '../../src/nest/backup/backup.impl';
import type { BackupService } from '../../src/nest/backup/backup.service';
import type { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import type { StorageService } from '../../src/nest/storage/storage.service';

import type { PathLike } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fsMock = vi.hoisted(() => ({
  // The parameter is declared so the double carries fs's real signature: the
  // cases below replace this default with a path-dependent implementation.
  existsSync: vi.fn((_p: PathLike) => false),
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

const liveDb = path.join(__dirname, '../../data', 'travel.db');

// createBackup receives StorageService as a parameter (BackupService injects
// it). fs is mocked wholesale here, so a plain stub stands in for the backups
// backend: staging under /stub/spool, empty category listings, put/stat succeed.
const storageStub = vi.hoisted(() => ({}) as Record<string, unknown>);
function resetStorageStub() {
  Object.assign(storageStub, {
    spoolDirFor: vi.fn(() => '/stub/spool'),
    tempDir: vi.fn(() => '/stub/tmp'),
    list: vi.fn(async function* () {}),
    withLocalFile: vi.fn(async (_c: string, _k: string, fn: (p: string) => Promise<unknown>) => fn('/stub/local/path')),
    put: vi.fn(async () => {}),
    stat: vi.fn(async (_c: string, key: string) => ({ key, size: 4096, mtimeMs: Date.parse('2026-04-27T02:00:00Z') })),
    exists: vi.fn(async () => true),
    delete: vi.fn(async () => {}),
  });
}
resetStorageStub();

interface Registered {
  name: string;
  expr: string;
  onTick: () => Promise<void> | void;
}

/** An AutoBackupJob wired to the real createBackup and a capturing registrar double. */
function makeJob() {
  const registered: Registered[] = [];
  const registrar = {
    isEnabled: vi.fn(() => true),
    register: vi.fn((name: string, expr: string, onTick: Registered['onTick']) => {
      registered.push({ name, expr, onTick });
      return true;
    }),
    unregister: vi.fn(),
  };
  const job = new AutoBackupJob(
    // The same wiring the container does, with the real service function behind
    // it — the run below is still the production code path. The forward mirrors
    // BackupService: inject the storage stub as the first argument.
    {
      createBackup: (prefix?: 'backup' | 'auto-backup') =>
        createBackup(storageStub as unknown as StorageService, prefix),
    } as unknown as BackupService,
    registrar as unknown as CronRegistrarService,
    storageStub as unknown as StorageService,
  );
  return { job, registered, registrar };
}

/** Wires up the archiver so finalize() resolves the run, and returns its events. */
function stubArchiver(): Record<string, (arg?: unknown) => void> {
  const outputEvents: Record<string, (arg?: unknown) => void> = {};
  const archiveEvents: Record<string, (arg?: unknown) => void> = {};
  fsMock.createWriteStream.mockReturnValue({
    on: vi.fn((event: string, cb: () => void) => {
      outputEvents[event] = cb;
    }),
  } as never);
  archiveMock.on.mockImplementation((event: string, cb: (arg?: unknown) => void) => {
    archiveEvents[event] = cb;
  });
  archiveMock.finalize.mockImplementation(() => {
    outputEvents['close']?.();
  });
  archiverMock.mockReturnValue(archiveMock);
  return archiveEvents;
}

/** Arms the job with auto-backup enabled and hands back the cron tick. */
function scheduledRun(): () => Promise<void> {
  fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'daily', keep_days: 7 }));
  const { job, registered } = makeJob();
  job.start();
  return registered.at(-1)?.onTick as () => Promise<void>;
}

describe('auto-backup run', () => {
  const envKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    resetStorageStub();
    // No ENCRYPTION_KEY in the env means the key file is the source of truth and
    // has to travel with the backup.
    delete process.env.ENCRYPTION_KEY;
    fsMock.statSync.mockReturnValue({
      size: 4096,
      birthtime: new Date('2026-04-27T02:00:00Z'),
      mtimeMs: Date.now(),
    } as never);
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = envKey;
  });

  it('archives a VACUUM INTO snapshot, never the live travel.db', async () => {
    fsMock.existsSync.mockImplementation(
      (p: string) => String(p).endsWith('travel.db') || String(p).endsWith('backup-settings.json'),
    );
    stubArchiver();

    await scheduledRun()();

    expect(dbMock.db.exec).toHaveBeenCalledWith(expect.stringContaining('VACUUM INTO'));
    const dbEntry = archiveMock.file.mock.calls.find(([, opts]) => opts?.name === 'travel.db');
    expect(dbEntry).toBeDefined();
    expect(dbEntry?.[0]).toContain('/stub/spool/travel-snap-auto-backup-');
    expect(dbEntry?.[0]).not.toBe(liveDb);
  });

  it('bundles the at-rest encryption key', async () => {
    fsMock.existsSync.mockImplementation(
      (p: string) => String(p).endsWith('.encryption_key') || String(p).endsWith('backup-settings.json'),
    );
    stubArchiver();

    await scheduledRun()();

    expect(archiveMock.file).toHaveBeenCalledWith(expect.stringContaining('.encryption_key'), {
      name: '.encryption_key',
    });
  });

  it('keeps the auto-backup-*.zip naming so retention still prunes it', async () => {
    fsMock.existsSync.mockImplementation((p: string) => String(p).endsWith('backup-settings.json'));
    // An expired scheduled archive sits in the backups category (retention
    // lists through storage now); the category enumeration stays empty.
    storageStub.list = vi.fn((category: string) =>
      (async function* () {
        if (category === 'backups') yield { key: 'auto-backup-2020-01-01T02-00-00.zip', size: 0, mtimeMs: 0 };
      })(),
    );
    stubArchiver();

    await scheduledRun()();

    expect(logMock.logInfo).toHaveBeenCalledWith(
      expect.stringMatching(/^Auto-Backup created: auto-backup-[\dT-]+\.zip$/),
    );
    // cleanupOldBackups(storage, keep_days) still runs after the archive and
    // only prunes objects it can match by prefix — through storage.delete
    expect(storageStub.delete).toHaveBeenCalledWith('backups', 'auto-backup-2020-01-01T02-00-00.zip');
  });

  it('logs the failure, drops the partial zip and skips retention', async () => {
    fsMock.existsSync.mockImplementation(
      (p: string) => String(p).endsWith('.zip') || String(p).endsWith('backup-settings.json'),
    );
    const archiveEvents = stubArchiver();
    archiveMock.finalize.mockImplementation(() => {
      archiveEvents['error']?.(new Error('disk full'));
    });

    await scheduledRun()();

    expect(logMock.logError).toHaveBeenCalledWith('Auto-Backup: disk full');
    expect(logMock.logInfo).not.toHaveBeenCalledWith(expect.stringContaining('Auto-Backup created'));
    // nothing was committed (put commits by rename only on success); the
    // half-built zip spool and snapshot scratch are cleaned up, and retention
    // never runs
    expect(storageStub.put).not.toHaveBeenCalled();
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('zip-build-auto-backup-'), { force: true });
    expect(fsMock.rmSync).toHaveBeenCalledWith(expect.stringContaining('travel-snap-auto-backup-'), { force: true });
    expect(storageStub.list).not.toHaveBeenCalledWith('backups');
    expect(storageStub.delete).not.toHaveBeenCalled();
  });
});

describe('auto-backup scheduling (AutoBackupJob.start)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStorageStub();
    fsMock.existsSync.mockImplementation(() => false);
    fsMock.readFileSync.mockReturnValue('{}');
  });

  it('disabled settings unregister the job and log Auto-Backup disabled', () => {
    const { job, registrar } = makeJob();
    job.start();
    expect(registrar.unregister).toHaveBeenCalledWith('auto-backup');
    expect(registrar.register).not.toHaveBeenCalled();
    expect(logMock.logInfo).toHaveBeenCalledWith('Auto-Backup disabled');
  });

  it('enabled settings register the built expression under the auto-backup name and log the banner', () => {
    fsMock.existsSync.mockImplementation((p: PathLike) => String(p).endsWith('backup-settings.json'));
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'daily', keep_days: 7, hour: 2 }));
    const { job, registered } = makeJob();
    job.start();
    expect(registered.at(-1)?.name).toBe('auto-backup');
    expect(registered.at(-1)?.expr).toBe('0 2 * * *');
    expect(logMock.logInfo).toHaveBeenCalledWith(
      expect.stringMatching(/^Auto-Backup scheduled: daily \(0 2 \* \* \*\), tz: .+, retention: 7 days$/),
    );
  });

  it('skips the banner when the registrar refuses to arm (test gate)', () => {
    fsMock.existsSync.mockImplementation((p: PathLike) => String(p).endsWith('backup-settings.json'));
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'daily', keep_days: 7 }));
    const { job, registrar } = makeJob();
    registrar.register.mockImplementation(() => false);
    job.start();
    expect(logMock.logInfo).not.toHaveBeenCalledWith(expect.stringContaining('Auto-Backup scheduled'));
  });

  it('onApplicationBootstrap does nothing when the registrar is disabled', () => {
    const { job, registrar } = makeJob();
    registrar.isEnabled.mockReturnValue(false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(registrar.unregister).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('onApplicationBootstrap arms the cron when the registrar is enabled', () => {
    fsMock.existsSync.mockImplementation((p: PathLike) => String(p).endsWith('backup-settings.json'));
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'hourly' }));
    const { job, registered } = makeJob();
    job.onApplicationBootstrap();
    expect(registered.at(-1)?.name).toBe('auto-backup');
    expect(registered.at(-1)?.expr).toBe('0 * * * *');
  });

  it('keep_days 0 banners "retention: forever" and skips retention after a run', async () => {
    fsMock.existsSync.mockImplementation((p: PathLike) => String(p).endsWith('backup-settings.json'));
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ enabled: true, interval: 'daily', keep_days: 0 }));
    stubArchiver();
    const { job, registered } = makeJob();
    job.start();
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringContaining('retention: forever'));

    await (registered.at(-1)?.onTick as () => Promise<void>)();
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringContaining('Auto-Backup created'));
    expect(storageStub.list).not.toHaveBeenCalledWith('backups'); // cleanupOldBackups never ran
    expect(storageStub.delete).not.toHaveBeenCalled();
  });

  it('a non-Error rejection from createBackup is stringified into the failure log', async () => {
    const broken = { createBackup: vi.fn().mockRejectedValue('plain string') } as unknown as BackupService;
    const registrar = { isEnabled: vi.fn(() => true), register: vi.fn(() => true), unregister: vi.fn() };
    const job = new AutoBackupJob(
      broken,
      registrar as unknown as CronRegistrarService,
      storageStub as unknown as StorageService,
    );
    await job.runBackup();
    expect(logMock.logError).toHaveBeenCalledWith('Auto-Backup: plain string');
  });

  it('getAutoSettings returns the loaded settings with a resolved timezone', () => {
    const prevTz = process.env.TZ;
    try {
      process.env.TZ = 'Europe/Zurich';
      const { job } = makeJob();
      expect(job.getAutoSettings()).toEqual({
        settings: { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
        timezone: 'Europe/Zurich',
      });

      delete process.env.TZ;
      // Falls back to the host zone (or UTC when the host reports none).
      expect(typeof job.getAutoSettings().timezone).toBe('string');
      expect(job.getAutoSettings().timezone.length).toBeGreaterThan(0);
    } finally {
      if (prevTz === undefined) delete process.env.TZ;
      else process.env.TZ = prevTz;
    }
  });
});

// Moved from backup.impl.test.ts when updateAutoSettings moved onto the job
// (the impl used to call scheduler.saveSettings + scheduler.start()).
describe('BACKUP-047 updateAutoSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStorageStub();
    fsMock.existsSync.mockImplementation(() => false);
    fsMock.readFileSync.mockReturnValue('{}');
  });

  it('BACKUP-047a — persists the parsed settings to backup-settings.json', () => {
    const { job } = makeJob();
    job.updateAutoSettings({ enabled: true, interval: 'weekly', hour: 6 });

    expect(fsMock.writeFileSync).toHaveBeenCalledOnce();
    const [file, payload] = fsMock.writeFileSync.mock.calls[0] as [string, string];
    expect(file).toContain('backup-settings.json');
    expect(JSON.parse(payload)).toMatchObject({ enabled: true, interval: 'weekly', hour: 6 });
  });

  it('BACKUP-047b — re-arms the job only after saving', () => {
    const order: string[] = [];
    fsMock.writeFileSync.mockImplementation(() => {
      order.push('save');
    });
    const { job, registrar } = makeJob();
    // Saving {enabled:false} sends start() down the disabled path — unregister
    // is its scheduling action, so it stands in for the old scheduler.start().
    registrar.unregister.mockImplementation(() => {
      order.push('start');
    });

    job.updateAutoSettings({ enabled: false });

    expect(order).toEqual(['save', 'start']);
  });

  it('BACKUP-047c — returns the parsed settings object', () => {
    const { job } = makeJob();
    const result = job.updateAutoSettings({
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
