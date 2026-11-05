/**
 * StorageReclaimJob: the nightly 04:05 pass. It hands the registrar the pass's
 * own promise, so the lease covers the whole run, skips a demo instance and a
 * busy slot quietly, and logs one line only when the pass had something to say.
 * RCLJ-001 to RCLJ-006.
 */
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { logDebug, logError, logInfo } from '../../../../src/nest/audit/audit-log.logger';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { StorageReclaimJob } from '../../../../src/nest/storage/storage-reclaim.job';
import type { StorageReclaimService } from '../../../../src/nest/storage/storage-reclaim.service';
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimReport } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

function registrarStub(enabled = true) {
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn((_name: string, _expression: string, _onTick: () => void | Promise<void>) => enabled),
    unregister: vi.fn(),
  };
}

function report(
  over: Partial<StorageReclaimReport['categories']> = {},
  stopped: StorageReclaimReport['stopped'] = null,
) {
  const none = { objects: 0, bytes: 0 };
  const row = {
    objects: 0,
    unreferenced: none,
    eligible: none,
    deleted: none,
    confirmationRequired: false,
    skipped: null,
  };
  return {
    startedAt: 1,
    finishedAt: 2,
    mode: 'delete',
    stopped,
    categories: { ...Object.fromEntries(STORAGE_RECLAIM_CATEGORIES.map((c) => [c, row])), ...over },
  } as StorageReclaimReport;
}

function makeJob(run: () => Promise<StorageReclaimReport>, opts: { enabled?: boolean; demo?: boolean } = {}) {
  const registrar = registrarStub(opts.enabled ?? true);
  const reclaim = { run: vi.fn(run) };
  const env = { isDemoMode: () => opts.demo === true };
  const job = new StorageReclaimJob(
    registrar as unknown as CronRegistrarService,
    reclaim as unknown as StorageReclaimService,
    env as unknown as RuntimeEnvService,
  );
  return { job, registrar, reclaim };
}

beforeEach(() => vi.clearAllMocks());

describe('StorageReclaimJob', () => {
  it('RCLJ-001: registers at 04:05 and hands the registrar the pass promise itself', async () => {
    let finish: (value: StorageReclaimReport) => void = () => undefined;
    const { job, registrar, reclaim } = makeJob(() => new Promise((resolve) => (finish = resolve)));
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('storage-reclaim', '5 4 * * *', expect.any(Function));
    const [call] = registrar.register.mock.calls;
    if (!call) throw new Error('the job registered nothing');
    const ticking = call[2]();
    expect(ticking).toBeInstanceOf(Promise);
    let settled = false;
    void (ticking as Promise<void>).then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    finish(report());
    await ticking;
    expect(reclaim.run).toHaveBeenCalledTimes(1);
  });

  it('RCLJ-002: does not register under the test gate, and never sweeps at boot', () => {
    const { job, registrar, reclaim } = makeJob(async () => report(), { enabled: false });
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(reclaim.run).not.toHaveBeenCalled();
  });

  it('RCLJ-003: a demo instance is skipped without a pass', async () => {
    const { job, reclaim } = makeJob(async () => report(), { demo: true });
    await job.tick();
    expect(reclaim.run).not.toHaveBeenCalled();
  });

  it('RCLJ-004: logs one line only when something was found, deleted, skipped or stopped', async () => {
    const quiet = makeJob(async () => report({ photos: { ...report().categories.photos, skipped: 'not_reclaimed' } }));
    await quiet.job.tick(new Date(5));
    expect(quiet.reclaim.run).toHaveBeenCalledWith({ now: new Date(5) });
    expect(logInfo).not.toHaveBeenCalled();

    const busy = report(
      {
        covers: {
          objects: 10,
          unreferenced: { objects: 2, bytes: 30 },
          eligible: { objects: 1, bytes: 10 },
          deleted: { objects: 1, bytes: 10 },
          confirmationRequired: false,
          skipped: null,
        },
        files: { ...report().categories.files, confirmationRequired: true },
        avatars: { ...report().categories.avatars, skipped: 'interrupted' },
      },
      'database_reopened',
    );
    await makeJob(async () => busy).job.tick();
    expect(logInfo).toHaveBeenCalledWith(
      'Storage reclaim: 2 unreferenced object(s); deleted 1 (10 bytes); waiting for an admin to confirm files; ' +
        'skipped avatars (interrupted); stopped: database_reopened',
    );
  });

  it('RCLJ-005: a refusal (busy, demo) is a debug line, not an error', async () => {
    const { job } = makeJob(async () => {
      throw new DomainError(409, 'another storage job is running', { code: 'reclaim_busy' });
    });
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logDebug).toHaveBeenCalledWith('Storage reclaim skipped: another storage job is running');
    expect(logError).not.toHaveBeenCalled();
  });

  it('RCLJ-006: any other failure is contained in one error line', async () => {
    await makeJob(async () => {
      throw new Error('registry not initialized');
    }).job.tick();
    expect(logError).toHaveBeenCalledWith('Storage reclaim: registry not initialized');
    await makeJob(vi.fn<() => Promise<StorageReclaimReport>>().mockRejectedValue('plain')).job.tick();
    expect(logError).toHaveBeenCalledWith('Storage reclaim: plain');
  });
});
