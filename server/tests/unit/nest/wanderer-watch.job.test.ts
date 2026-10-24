/**
 * WAN-02: the hourly provider of the wanderer watch: registration, the test
 * gate, and that a failing run cannot take the scheduler down with it.
 */
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import { WandererWatchJob } from '../../../src/nest/tours/wanderer-watch.job';
import type { WandererWatchService } from '../../../src/nest/tours/wanderer-watch.service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

function makeJob(run: () => Promise<void>, enabled = true) {
  const registrar = { isEnabled: vi.fn(() => enabled), register: vi.fn(() => enabled), unregister: vi.fn() };
  const watch = { run: vi.fn(run) };
  const job = new WandererWatchJob(
    watch as unknown as WandererWatchService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, registrar, watch };
}

beforeEach(() => vi.clearAllMocks());

describe('WandererWatchJob', () => {
  it('WWJOB-001: registers hourly at minute 23', () => {
    const { job, registrar } = makeJob(async () => undefined);
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('wanderer-watch', '23 * * * *', expect.any(Function));
  });

  it('WWJOB-002: does not register under the test gate', () => {
    const { job, registrar } = makeJob(async () => undefined, false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('WWJOB-003: a tick runs the watch and contains its failure', async () => {
    const ok = makeJob(async () => undefined);
    await ok.job.tick();
    expect(ok.watch.run).toHaveBeenCalledOnce();

    const failing = makeJob(async () => {
      throw new Error('database is locked');
    });
    await expect(failing.job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
    const odd = makeJob(() => Promise.reject('plain'));
    await odd.job.tick();
    expect(logMock.logError).toHaveBeenLastCalledWith(expect.stringContaining('plain'));
  });
});
