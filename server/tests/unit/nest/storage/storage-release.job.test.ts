/**
 * StorageReleaseJob: every ten minutes, the due rows of the release queue.
 * It hands the registrar the tick's own promise, so the lease covers the whole
 * tick, logs at debug only, and contains a failure in one error line.
 * RELJ-001 to RELJ-004.
 */
import { logDebug, logError } from '../../../../src/nest/audit/audit-log.logger';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { StorageReleaseJob } from '../../../../src/nest/storage/storage-release.job';
import type { ReleaseTickResult, StorageReleaseService } from '../../../../src/nest/storage/storage-release.service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

function makeJob(processDue: () => Promise<ReleaseTickResult>, enabled = true) {
  const registrar = {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn((_name: string, _expression: string, _onTick: () => void | Promise<void>) => enabled),
  };
  const release = { processDue: vi.fn(processDue) };
  const job = new StorageReleaseJob(
    registrar as unknown as CronRegistrarService,
    release as unknown as StorageReleaseService,
  );
  return { job, registrar, release };
}

const ran = (deleted: number, kept: number): ReleaseTickResult => ({ skipped: null, deleted, kept });

beforeEach(() => vi.clearAllMocks());

describe('StorageReleaseJob', () => {
  it('RELJ-001: registers every ten minutes and hands the registrar the tick promise itself', async () => {
    let finish: (value: ReleaseTickResult) => void = () => undefined;
    const { job, registrar, release } = makeJob(() => new Promise((resolve) => (finish = resolve)));
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('storage-release', '*/10 * * * *', expect.any(Function));
    const [call] = registrar.register.mock.calls;
    if (!call) throw new Error('the job registered nothing');
    const ticking = call[2]();
    expect(ticking).toBeInstanceOf(Promise);
    let settled = false;
    void (ticking as Promise<void>).then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    finish(ran(0, 0));
    await ticking;
    expect(release.processDue).toHaveBeenCalledTimes(1);
  });

  it('RELJ-002: does not register under the test gate', () => {
    const { job, registrar, release } = makeJob(async () => ran(0, 0), false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(release.processDue).not.toHaveBeenCalled();
  });

  it('RELJ-003: says at debug what a tick did or why it skipped, and nothing for an empty one', async () => {
    const quiet = makeJob(async () => ran(0, 0));
    await quiet.job.tick(new Date(5));
    expect(quiet.release.processDue).toHaveBeenCalledWith(new Date(5));
    expect(logDebug).not.toHaveBeenCalled();
    await makeJob(async () => ran(3, 1)).job.tick();
    expect(logDebug).toHaveBeenCalledWith('Storage release: deleted 3, kept 1 still named');
    await makeJob(async () => ({ skipped: 'busy', deleted: 0, kept: 0 })).job.tick();
    expect(logDebug).toHaveBeenCalledWith('Storage release skipped: busy');
    expect(logError).not.toHaveBeenCalled();
  });

  it('RELJ-004: a failure is contained in one error line', async () => {
    await makeJob(async () => {
      throw new Error('registry not initialized');
    }).job.tick();
    expect(logError).toHaveBeenCalledWith('Storage release: registry not initialized');
    await makeJob(vi.fn<() => Promise<ReleaseTickResult>>().mockRejectedValue('plain')).job.tick();
    expect(logError).toHaveBeenCalledWith('Storage release: plain');
  });
});
